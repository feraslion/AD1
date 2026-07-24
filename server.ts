import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './src/core/database/index.ts';
import { ensureDatabaseTables } from './src/core/database/initSchema.ts';
import {
  products,
  customers,
  suppliers,
  payments,
  purchases,
  purchaseItems,
  invoices,
  invoiceItems,
  accounts,
  journalEntries,
  journalDetails,
  journalLines,
  expenses,
  settings,
  users,
  categories,
  units,
  cashboxes,
  roles,
  permissions,
  rolePermissions,
  postingRules,
  warehouses,
  currencies,
  exchangeRatesHistory,
  taxes,
  paymentMethods,
  companies,
  branches
} from './src/core/database/schema.ts';
import { DEFAULT_CURRENCIES, CurrencyService } from './src/services/CurrencyService.ts';
import { 
  UserRepository,
  CustomerRepository,
  SupplierRepository,
  ProductRepository,
  InventoryRepository,
  SalesRepository,
  PurchaseRepository,
  AccountingRepository,
  AccountRepository,
  CurrencyRepository,
  InvoiceRepository,
  TreasuryRepository,
  ExpenseRepository,
  ReportsRepository
} from './src/core/repositories/index.ts';
import { JournalEngine } from './src/core/services/JournalEngine.ts';
import { TransactionPostingService } from './src/core/services/TransactionPostingService.ts';
import { eq, desc, and, or, like, sql, inArray } from 'drizzle-orm';

const app = express();
const PORT = 3000;

app.use(express.json());

// ─── STANDARD RESPONSE HELPERS ───
function sendResponse(res: express.Response, data: any, status = 200, pagination?: any) {
  res.status(status).json({
    success: true,
    data,
    ...(pagination && { pagination })
  });
}

function sendError(res: express.Response, message: string, details?: any, status = 500) {
  res.status(status).json({
    success: false,
    error: message,
    ...(details && { details })
  });
}

// ─── AUTHENTICATION AND AUTHORIZATION MIDDLEWARES ───
async function authenticate(req: any, res: any, next: any) {
  try {
    const authHeader = req.headers.authorization;
    let userRecord = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const code = authHeader.substring(7).trim();
      const [u] = await db.select().from(users).where(eq(users.id, code));
      if (u) {
        userRecord = u;
      }
    }

    // Default manager user fallback for seamless development/testing session
    if (!userRecord) {
      const [master] = await db.select().from(users).where(eq(users.id, '001'));
      userRecord = master || { id: '001', uid: '001', email: 'manager@system.com', name: 'عبدالرحمن (المدير العام)', role: 'manager', roleId: 'role_manager' };
    }

    // Load permissions for userRecord
    if (userRecord) {
      let userPermissions: string[] = [];
      try {
        if (userRecord.roleId) {
          const perms = await db
            .select({ code: permissions.code })
            .from(rolePermissions)
            .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
            .where(eq(rolePermissions.roleId, userRecord.roleId));
          userPermissions = perms.map(p => p.code);
        }
      } catch (dbErr) {
        console.error('Error fetching db permissions, falling back to defaults:', dbErr);
      }

      // Default fallback mappings if db query is empty or failed
      if (userPermissions.length === 0) {
        const fallbackRole = userRecord.role || 'cashier';
        if (fallbackRole === 'manager') {
          userPermissions = ['view_dashboard', 'pos_access', 'manage_inventory', 'view_invoices', 'view_reports', 'view_purchases', 'view_accounting', 'view_settings', 'manage_users'];
        } else if (fallbackRole === 'accountant') {
          userPermissions = ['view_dashboard', 'pos_access', 'view_invoices', 'view_reports', 'view_purchases', 'view_accounting'];
        } else if (fallbackRole === 'inventory') {
          userPermissions = ['view_dashboard', 'manage_inventory', 'view_purchases'];
        } else if (fallbackRole === 'cashier') {
          userPermissions = ['pos_access', 'view_invoices'];
        }
      }

      userRecord.permissions = userPermissions;
    }

    req.user = userRecord;
    next();
  } catch (error) {
    sendError(res, 'غير مصرح به - فشل التحقق من الهوية', error, 401);
  }
}

function authorize(requirements: string[]) {
  return (req: any, res: any, next: any) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'غير مصرح به - الرجاء تسجيل الدخول أولاً'
      });
    }

    // Manager role always has all permissions/full bypass
    if (req.user.role === 'manager') {
      return next();
    }

    const hasMatch = requirements.some(reqStr => {
      // Check if matches direct role
      if (reqStr === req.user.role) return true;
      // Check if matches a permission code
      if (req.user.permissions && req.user.permissions.includes(reqStr)) return true;
      return false;
    });

    if (!hasMatch) {
      return res.status(403).json({
        success: false,
        error: `صلاحيات غير كافية! هذه العملية تتطلب أحد الصلاحيات أو الأدوار التالية: ${requirements.join(' أو ')}`
      });
    }

    next();
  };
}

// ─── REQUEST LOGGER MIDDLEWARE ───
function requestLogger(req: any, res: any, next: any) {
  const timestamp = new Date().toISOString();
  const userStr = req.user ? `${req.user.name} (${req.user.role})` : 'Guest';
  console.log(`[${timestamp}] ${req.method} ${req.url} - User: ${userStr}`);
  next();
}

app.use('/api', authenticate);
app.use('/api', requestLogger);

// ─── ACCOUNTING JOURNAL POST ENGINE ───
async function postJournalEntry(
  entryNumber: string,
  description: string,
  date: string,
  lines: { accountId: string; debit: number; credit: number; currency?: string; exchangeRate?: number; foreignDebit?: number; foreignCredit?: number }[],
  options?: { currency?: string; exchangeRate?: number; baseCurrency?: string }
) {
  return await AccountingRepository.postJournalEntry(entryNumber, description, date, lines, options);
}

async function getAccountByRule(ruleCode: string, defaultAccountId: string): Promise<string> {
  try {
    const [rule] = await db.select().from(postingRules).where(eq(postingRules.ruleCode, ruleCode));
    return rule ? rule.accountId : defaultAccountId;
  } catch (error) {
    console.error(`Error resolving account for rule ${ruleCode}:`, error);
    return defaultAccountId;
  }
}

// ─── VALIDATION HELPERS ───
function validateProduct(p: any) {
  const errors = [];
  if (!p.name || typeof p.name !== 'string' || p.name.trim().length < 2) {
    errors.push('اسم المنتج مطلوب ويجب أن يكون حرفين على الأقل');
  }
  if (!p.barcode || typeof p.barcode !== 'string' || p.barcode.trim().length < 2) {
    errors.push('رمز الباركود مطلوب');
  }
  if (p.price === undefined || parseFloat(p.price) < 0) {
    errors.push('سعر البيع يجب أن يكون أكبر من أو يساوي الصفر');
  }
  if (p.purchasePrice === undefined || parseFloat(p.purchasePrice) < 0) {
    errors.push('سعر الشراء يجب أن يكون أكبر من أو يساوي الصفر');
  }
  if (!p.category) {
    errors.push('تصنيف المنتج مطلوب');
  }
  if (!p.unit) {
    errors.push('وحدة المنتج مطلوبة');
  }
  return errors;
}

function validateCustomer(c: any) {
  const errors = [];
  if (!c.name || typeof c.name !== 'string' || c.name.trim().length < 2) {
    errors.push('اسم العميل مطلوب ويجب أن يكون حرفين على الأقل');
  }
  return errors;
}

function validateSupplier(s: any) {
  const errors = [];
  if (!s.name || typeof s.name !== 'string' || s.name.trim().length < 2) {
    errors.push('اسم المورد مطلوب ويجب أن يكون حرفين على الأقل');
  }
  return errors;
}

function validateInvoice(inv: any) {
  const errors = [];
  if (!inv.invoiceNumber) errors.push('رقم الفاتورة مطلوب');
  if (!inv.date) errors.push('تاريخ الفاتورة مطلوب');
  if (!inv.items || !Array.isArray(inv.items) || inv.items.length === 0) {
    errors.push('يجب إضافة منتج واحد على الأقل في الفاتورة');
  }
  return errors;
}

function validateUser(u: any) {
  const errors = [];
  if (!u.email || !u.email.includes('@')) errors.push('البريد الإلكتروني غير صالح');
  if (!u.name || u.name.trim().length < 2) errors.push('الاسم مطلوب');
  const validRoles = ['manager', 'accountant', 'cashier', 'inventory'];
  if (!u.role || !validRoles.includes(u.role)) {
    errors.push('دور المستخدم غير صالح، يجب أن يكون أحد الأدوار المعتمدة');
  }
  return errors;
}

// ─── API ROUTE HANDLERS ───

// 1. Products API (With pagination and search/category filtering)
app.get('/api/products', async (req, res) => {
  try {
    const { page, limit, category, search } = req.query;
    
    const conditions = [];
    if (category) {
      conditions.push(eq(products.category, category as string));
    }
    if (search) {
      conditions.push(
        or(
          like(products.name, `%${search}%`),
          like(products.barcode, `%${search}%`)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    let total = 0;
    if (page || limit) {
      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(products)
        .where(whereClause);
      total = Number(countResult[0]?.count || 0);
    }

    let query = db.select().from(products);
    if (whereClause) {
      query = query.where(whereClause) as any;
    }

    if (page && limit) {
      const p = parseInt(page as string) || 1;
      const l = parseInt(limit as string) || 10;
      query = query.limit(l).offset((p - 1) * l) as any;
    }

    const allProducts = await query;
    const mapped = allProducts.map(p => ({
      ...p,
      price: parseFloat(p.price || '0'),
      purchasePrice: parseFloat(p.purchasePrice || '0'),
      stock: parseFloat(p.stock || '0'),
      minStock: parseFloat(p.minStock || '0'),
      taxRate: parseFloat(p.taxRate || '15')
    }));

    if (page || limit) {
      const p = parseInt(page as string) || 1;
      const l = parseInt(limit as string) || 10;
      sendResponse(res, mapped, 200, { page: p, limit: l, total });
    } else {
      sendResponse(res, mapped);
    }
  } catch (error) {
    sendError(res, 'فشل جلب المنتجات', error);
  }
});

app.post('/api/products', authorize(['manager', 'inventory']), async (req, res) => {
  try {
    const p = req.body;
    const errors = validateProduct(p);
    if (errors.length > 0) {
      return sendError(res, 'خطأ في التحقق من البيانات', errors, 400);
    }

    const id = p.id || 'prod_' + Math.random().toString(36).substr(2, 9);
    const existing = await db.select().from(products).where(eq(products.id, id));
    
    const dbValue = {
      id,
      name: p.name,
      barcode: p.barcode,
      price: (p.price || 0).toString(),
      purchasePrice: (p.purchasePrice || 0).toString(),
      stock: (p.stock || 0).toString(),
      minStock: (p.minStock || 0).toString(),
      category: p.category,
      unit: p.unit,
      taxRate: (p.taxRate ?? 15).toString(),
      image: p.image || '',
      description: p.description || ''
    };

    if (existing.length > 0) {
      await db.update(products).set(dbValue).where(eq(products.id, id));
    } else {
      await db.insert(products).values(dbValue);
    }
    sendResponse(res, dbValue);
  } catch (error) {
    sendError(res, 'فشل حفظ المنتج', error);
  }
});

app.delete('/api/products/:id', authorize(['manager', 'inventory']), async (req, res) => {
  try {
    await db.delete(products).where(eq(products.id, req.params.id));
    sendResponse(res, { success: true });
  } catch (error) {
    sendError(res, 'فشل حذف المنتج', error);
  }
});

app.get('/api/products/:id/history', async (req, res) => {
  try {
    const history = await ProductRepository.getProductHistory(req.params.id);
    sendResponse(res, history);
  } catch (error) {
    sendError(res, 'فشل جلب سجل حركة المنتج', error);
  }
});

// 2. Categories API
app.get('/api/categories', async (req, res) => {
  try {
    const allCategories = await db.select().from(categories);
    sendResponse(res, allCategories);
  } catch (error) {
    sendError(res, 'فشل جلب التصنيفات', error);
  }
});

app.post('/api/categories', authorize(['manager', 'inventory']), async (req, res) => {
  try {
    const cat = req.body;
    if (!cat.name || cat.name.trim() === '') {
      return sendError(res, 'اسم التصنيف مطلوب', null, 400);
    }
    const dbValue = {
      id: cat.id || 'cat_' + Math.random().toString(36).substr(2, 9),
      name: cat.name,
      icon: cat.icon || '📦'
    };
    const existing = await db.select().from(categories).where(eq(categories.id, dbValue.id));
    if (existing.length > 0) {
      await db.update(categories).set(dbValue).where(eq(categories.id, dbValue.id));
    } else {
      await db.insert(categories).values(dbValue);
    }
    sendResponse(res, dbValue);
  } catch (error) {
    sendError(res, 'فشل حفظ التصنيف', error);
  }
});

app.delete('/api/categories/:id', authorize(['manager', 'inventory']), async (req, res) => {
  try {
    await db.delete(categories).where(eq(categories.id, req.params.id));
    sendResponse(res, { success: true });
  } catch (error) {
    sendError(res, 'فشل حذف التصنيف', error);
  }
});

// 3. Units API
app.get('/api/units', async (req, res) => {
  try {
    const allUnits = await db.select().from(units);
    sendResponse(res, allUnits);
  } catch (error) {
    sendError(res, 'فشل جلب الوحدات', error);
  }
});

app.post('/api/units', authorize(['manager', 'inventory', 'accountant']), async (req, res) => {
  try {
    const unitData = req.body;
    if (!unitData.name || unitData.name.trim() === '') {
      return sendError(res, 'اسم الوحدة مطلوب', null, 400);
    }
    const dbValue = {
      id: unitData.id || 'unit_' + Math.random().toString(36).substr(2, 9),
      name: unitData.name
    };
    const existing = await db.select().from(units).where(eq(units.id, dbValue.id));
    if (existing.length > 0) {
      await db.update(units).set(dbValue).where(eq(units.id, dbValue.id));
    } else {
      await db.insert(units).values(dbValue);
    }
    sendResponse(res, dbValue);
  } catch (error) {
    sendError(res, 'فشل حفظ الوحدة', error);
  }
});

app.delete('/api/units/:id', authorize(['manager', 'inventory']), async (req, res) => {
  try {
    await db.delete(units).where(eq(units.id, req.params.id));
    sendResponse(res, { success: true });
  } catch (error) {
    sendError(res, 'فشل حذف الوحدة', error);
  }
});

// 3.5 Warehouses & Inventory Engine API
app.get('/api/warehouses', async (req, res) => {
  try {
    const list = await InventoryRepository.getWarehouses();
    sendResponse(res, list);
  } catch (error) {
    sendError(res, 'فشل جلب المستودعات', error);
  }
});

app.post('/api/warehouses', authorize(['manager', 'inventory']), async (req, res) => {
  try {
    const data = req.body;
    if (!data.name || !data.code) {
      return sendError(res, 'اسم وكود المستودع مطلوبان', null, 400);
    }
    const result = await InventoryRepository.upsertWarehouse(data);
    sendResponse(res, result);
  } catch (error) {
    sendError(res, 'فشل حفظ المستودع', error);
  }
});

app.delete('/api/warehouses/:id', authorize(['manager', 'inventory']), async (req, res) => {
  try {
    const result = await InventoryRepository.deleteWarehouse(req.params.id);
    sendResponse(res, result);
  } catch (error: any) {
    sendError(res, error.message || 'فشل حذف المستودع', error);
  }
});

// Stock Moves History API
app.get('/api/stock-moves', authorize(['manager', 'inventory', 'accountant']), async (req, res) => {
  try {
    const { productId, warehouseId, type } = req.query;
    const moves = await InventoryRepository.getStockMoves(
      productId as string,
      warehouseId as string,
      type as string
    );
    sendResponse(res, moves);
  } catch (error) {
    sendError(res, 'فشل جلب حركات المخزون', error);
  }
});

// Warehouse Transfer API
app.post('/api/stock-moves/manual', authorize(['manager', 'inventory']), async (req, res) => {
  try {
    const { productId, warehouseId, type, quantity, unitCost, referenceId, notes } = req.body;
    if (!productId || !warehouseId || !type || !quantity) {
      return sendError(res, 'بيانات حركة المخزون اليدوية غير مكتملة', null, 400);
    }
    const result = await InventoryRepository.recordManualStockMove({
      productId,
      warehouseId,
      type,
      quantity: parseFloat(quantity),
      unitCost: unitCost !== undefined && unitCost !== null && unitCost !== '' ? parseFloat(unitCost) : undefined,
      referenceId,
      notes
    });
    sendResponse(res, result);
  } catch (error: any) {
    sendError(res, error.message || 'فشل تسجيل إذن الحركة المخزنية اليدوية', error);
  }
});

app.post('/api/stock-moves/transfer', authorize(['manager', 'inventory']), async (req, res) => {
  try {
    const { productId, fromWarehouseId, toWarehouseId, quantity, notes } = req.body;
    if (!productId || !fromWarehouseId || !toWarehouseId || !quantity) {
      return sendError(res, 'جميع الحقول الأساسية للتحويل مطلوبة', null, 400);
    }
    const result = await InventoryRepository.transferStock(
      productId,
      fromWarehouseId,
      toWarehouseId,
      parseFloat(quantity),
      notes
    );
    sendResponse(res, { success: true, transfer: result });
  } catch (error: any) {
    sendError(res, error.message || 'فشل تنفيذ تحويل المخزون', error);
  }
});

// Inventory Physical Adjustment API (with Accounting Journal Integration)
app.post('/api/stock-moves/adjustment', authorize(['manager', 'inventory', 'accountant']), async (req, res) => {
  try {
    const { productId, warehouseId, actualQuantity, notes } = req.body;
    if (!productId || !warehouseId || actualQuantity === undefined || actualQuantity === null) {
      return sendError(res, 'بيانات التسوية غير مكتملة', null, 400);
    }
    const result = await InventoryRepository.adjustPhysicalStock(
      productId,
      warehouseId,
      parseFloat(actualQuantity),
      notes
    );
    sendResponse(res, result);
  } catch (error: any) {
    sendError(res, error.message || 'فشل تنفيذ التسوية الجردية', error);
  }
});

// Stock Ledger for Product API
app.get('/api/inventory/ledger/:productId', authorize(['manager', 'inventory', 'accountant']), async (req, res) => {
  try {
    const ledger = await InventoryRepository.getProductStockLedger(req.params.productId);
    sendResponse(res, ledger);
  } catch (error: any) {
    sendError(res, error.message || 'فشل جلب سجل استاد المنتج', error);
  }
});

// Inventory Valuation Report API
app.get('/api/inventory/valuation', authorize(['manager', 'inventory', 'accountant']), async (req, res) => {
  try {
    const method = (req.query.method === 'fifo' ? 'fifo' : 'average') as 'average' | 'fifo';
    const valuation = await InventoryRepository.getInventoryValuation(method);
    sendResponse(res, valuation);
  } catch (error) {
    sendError(res, 'فشل حساب تقييم المخزون', error);
  }
});

// Low Stock Alerts API
app.get('/api/inventory/low-stock', authorize(['manager', 'inventory', 'accountant']), async (req, res) => {
  try {
    const alerts = await InventoryRepository.getLowStockAlerts();
    sendResponse(res, alerts);
  } catch (error) {
    sendError(res, 'فشل جلب تنبيهات المخزون الحرج', error);
  }
});

// 3.6 Currencies API
app.get('/api/currencies', async (req, res) => {
  try {
    let list = await CurrencyRepository.getCurrencies();
    // If list is empty, seed defaults
    if (list.length === 0) {
      for (const curr of DEFAULT_CURRENCIES) {
        await CurrencyRepository.upsertCurrency(curr);
      }
      list = await CurrencyRepository.getCurrencies();
    }
    sendResponse(res, list);
  } catch (error) {
    sendError(res, 'فشل جلب العملات', error);
  }
});

app.post('/api/currencies/seed', authorize(['manager', 'accountant']), async (req, res) => {
  try {
    for (const curr of DEFAULT_CURRENCIES) {
      const existing = await CurrencyRepository.findCurrencyByCode(curr.code);
      if (!existing) {
        await CurrencyRepository.upsertCurrency(curr);
      }
    }
    const updatedList = await CurrencyRepository.getCurrencies();
    sendResponse(res, updatedList);
  } catch (error) {
    sendError(res, 'فشل بذر بيانات العملات', error);
  }
});

app.post('/api/currencies', authorize(['manager', 'accountant']), async (req, res) => {
  try {
    const data = req.body;
    if (!data.code || !data.name || !data.symbol) {
      return sendError(res, 'كود واسم ورمز العملة مطلوبة', null, 400);
    }

    const saved = await CurrencyRepository.upsertCurrency(data);
    sendResponse(res, saved);
  } catch (error) {
    sendError(res, 'فشل حفظ العملة', error);
  }
});

app.post('/api/currencies/:id/rate', authorize(['manager', 'accountant']), async (req, res) => {
  try {
    const { id } = req.params;
    const { exchangeRate } = req.body;

    if (!exchangeRate || isNaN(Number(exchangeRate))) {
      return sendError(res, 'سعر الصرف الجديد مطلوب برقم صحيح', null, 400);
    }

    const userName = (req as any).user?.name || 'مدير النظام';
    const updated = await CurrencyRepository.updateRate(id, Number(exchangeRate), userName);

    sendResponse(res, updated);
  } catch (error) {
    sendError(res, 'فشل تحديث سعر الصرف', error);
  }
});

app.get('/api/currencies/history', async (req, res) => {
  try {
    const { currencyId } = req.query;
    const history = await CurrencyRepository.getExchangeRateHistory(currencyId as string);
    sendResponse(res, history);
  } catch (error) {
    sendError(res, 'فشل جلب سجل تغيير أسعار الصرف', error);
  }
});

app.post('/api/currencies/convert', async (req, res) => {
  try {
    const { amount, from, to } = req.body;
    if (amount === undefined || !from || !to) {
      return sendError(res, 'المبلغ وعملة المصدر وعملة الهدف مطلوبة', null, 400);
    }

    const allCurrencies = await CurrencyRepository.getCurrencies();
    const mappedList = allCurrencies.map(c => ({
      ...c,
      exchangeRate: parseFloat(c.exchangeRate || '1')
    }));

    const result = CurrencyService.convertAmount(
      Number(amount),
      from,
      to,
      mappedList as any
    );

    sendResponse(res, result);
  } catch (error) {
    sendError(res, 'فشل حساب تحويل العملة', error);
  }
});

app.delete('/api/currencies/:id', authorize(['manager', 'accountant']), async (req, res) => {
  try {
    const result = await CurrencyRepository.deleteCurrency(req.params.id);
    sendResponse(res, result);
  } catch (error) {
    sendError(res, 'فشل حذف العملة', error);
  }
});

app.post('/api/currencies/set-base', authorize(['manager', 'accountant']), async (req, res) => {
  try {
    const { currencyId, currencyCode } = req.body;
    const target = currencyId || currencyCode;
    if (!target) {
      return sendError(res, 'معرف أو كود العملة مطلوب', null, 400);
    }
    const userName = (req as any).user?.name || 'مدير النظام';
    const updatedList = await CurrencyRepository.setBaseCurrency(target, userName);
    
    // Also sync default currency in settings if exists
    try {
      const baseCode = await CurrencyRepository.getBaseCurrencyCode();
      const baseObj = await CurrencyRepository.findCurrencyByCode(baseCode);
      if (baseObj) {
        await db.update(settings).set({ currency: baseObj.symbol || baseCode }).where(eq(settings.id, 'default_settings'));
      }
    } catch (e) {
      // ignore if settings not initialized
    }

    sendResponse(res, updatedList);
  } catch (error: any) {
    sendError(res, error.message || 'فشل تغيير العملة الأساسية للشركة', error, 400);
  }
});

// 3.7 Taxes API
app.get('/api/taxes', async (req, res) => {
  try {
    const list = await db.select().from(taxes);
    sendResponse(res, list);
  } catch (error) {
    sendError(res, 'فشل جلب الضرائب', error);
  }
});

app.post('/api/taxes', authorize(['manager', 'accountant']), async (req, res) => {
  try {
    const data = req.body;
    if (!data.name || !data.code || data.rate === undefined) {
      return sendError(res, 'اسم وكود ونسبة الضريبة مطلوبة', null, 400);
    }
    const id = data.id || 'tax_' + Math.random().toString(36).substr(2, 9);
    const dbValue = {
      id,
      name: data.name,
      code: data.code,
      rate: data.rate.toString(),
      isInclusive: data.isInclusive ? 'true' : 'false',
      companyId: data.companyId || null
    };
    const existing = await db.select().from(taxes).where(eq(taxes.id, id));
    if (existing.length > 0) {
      await db.update(taxes).set(dbValue).where(eq(taxes.id, id));
    } else {
      await db.insert(taxes).values(dbValue);
    }
    sendResponse(res, dbValue);
  } catch (error) {
    sendError(res, 'فشل حفظ الضريبة', error);
  }
});

app.delete('/api/taxes/:id', authorize(['manager', 'accountant']), async (req, res) => {
  try {
    await db.delete(taxes).where(eq(taxes.id, req.params.id));
    sendResponse(res, { success: true });
  } catch (error) {
    sendError(res, 'فشل حذف الضريبة', error);
  }
});

// 3.8 Payment Methods API
app.get('/api/payment-methods', async (req, res) => {
  try {
    const list = await db.select().from(paymentMethods);
    sendResponse(res, list);
  } catch (error) {
    sendError(res, 'فشل جلب طرق الدفع', error);
  }
});

app.post('/api/payment-methods', authorize(['manager', 'accountant']), async (req, res) => {
  try {
    const data = req.body;
    if (!data.name || !data.code) {
      return sendError(res, 'اسم وكود طريقة الدفع مطلوبة', null, 400);
    }
    const id = data.id || 'pm_' + Math.random().toString(36).substr(2, 9);
    const dbValue = {
      id,
      code: data.code,
      name: data.name,
      accountId: data.accountId || null,
      companyId: data.companyId || null
    };
    const existing = await db.select().from(paymentMethods).where(eq(paymentMethods.id, id));
    if (existing.length > 0) {
      await db.update(paymentMethods).set(dbValue).where(eq(paymentMethods.id, id));
    } else {
      await db.insert(paymentMethods).values(dbValue);
    }
    sendResponse(res, dbValue);
  } catch (error) {
    sendError(res, 'فشل حفظ طريقة الدفع', error);
  }
});

app.delete('/api/payment-methods/:id', authorize(['manager', 'accountant']), async (req, res) => {
  try {
    await db.delete(paymentMethods).where(eq(paymentMethods.id, req.params.id));
    sendResponse(res, { success: true });
  } catch (error) {
    sendError(res, 'فشل حذف طريقة الدفع', error);
  }
});

// 4. Customers API (With pagination and search filtering)
app.get('/api/customers', async (req, res) => {
  try {
    const { page, limit, search } = req.query;
    
    const pageNum = page ? parseInt(page as string) : undefined;
    const limitNum = limit ? parseInt(limit as string) : undefined;

    const conditions = [];
    if (search) {
      conditions.push(
        or(
          like(customers.name, `%${search}%`),
          like(customers.phone, `%${search}%`)
        )
      );
    }

    let total = 0;
    if (pageNum || limitNum) {
      const countQuery = db.select({ count: sql<number>`count(*)` }).from(customers);
      const countResult = conditions.length > 0
        ? await countQuery.where(and(...conditions))
        : await countQuery;
      total = Number(countResult[0]?.count || 0);
    }

    let query = db.select().from(customers);
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    if (pageNum && limitNum) {
      const p = pageNum || 1;
      const l = limitNum || 10;
      query = query.limit(l).offset((p - 1) * l) as any;
    }

    const allCustomers = await query;
    const mapped = allCustomers.map(c => ({
      ...c,
      balance: parseFloat(c.balance || '0'),
      creditLimit: parseFloat(c.creditLimit || '5000'),
      openingBalance: parseFloat(c.openingBalance || '0')
    }));

    if (pageNum || limitNum) {
      const p = pageNum || 1;
      const l = limitNum || 10;
      sendResponse(res, mapped, 200, { page: p, limit: l, total });
    } else {
      sendResponse(res, mapped);
    }
  } catch (error) {
    sendError(res, 'فشل جلب العملاء', error);
  }
});

// GET /api/customers/reports/aging - Debt aging analysis
app.get('/api/customers/reports/aging', authorize(['manager', 'accountant']), async (req, res) => {
  try {
    const agingReport = await CustomerRepository.getDebtAging();
    sendResponse(res, agingReport);
  } catch (error) {
    sendError(res, 'فشل جلب تقرير أعمار الديون', error);
  }
});

// GET /api/customers/:id/ledger - Customer Statement of Account
app.get('/api/customers/:id/ledger', async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;
    const ledger = await CustomerRepository.getCustomerLedger(id, startDate as string, endDate as string);
    sendResponse(res, ledger);
  } catch (error) {
    sendError(res, 'فشل جلب كشف حساب العميل', error);
  }
});

app.post('/api/customers', authorize(['manager', 'cashier', 'accountant']), async (req, res) => {
  try {
    const c = req.body;
    const errors = validateCustomer(c);
    if (errors.length > 0) {
      return sendError(res, 'خطأ في التحقق من البيانات', errors, 400);
    }

    const id = c.id || 'cust_' + Math.random().toString(36).substr(2, 9);
    const dbValue = {
      id,
      name: c.name,
      phone: c.phone || '',
      email: c.email || '',
      balance: (c.balance ?? 0).toString(),
      creditLimit: (c.creditLimit ?? 5000).toString(),
      taxNumber: c.taxNumber || '',
      crNumber: c.crNumber || '',
      address: c.address || '',
      type: c.type || 'retail',
      status: c.status || 'active',
      notes: c.notes || '',
      openingBalance: (c.openingBalance ?? 0).toString()
    };

    const saved = await CustomerRepository.upsert(dbValue);
    sendResponse(res, saved);
  } catch (error) {
    sendError(res, 'فشل حفظ العميل', error);
  }
});

app.delete('/api/customers/:id', authorize(['manager']), async (req, res) => {
  try {
    const result = await CustomerRepository.delete(req.params.id);
    sendResponse(res, result);
  } catch (error) {
    sendError(res, 'فشل حذف العميل', error);
  }
});

// 5. Suppliers API
app.get('/api/suppliers', async (req, res) => {
  try {
    const allSuppliers = await SupplierRepository.findAll(req.query.search as string);
    const mapped = allSuppliers.map(s => ({
      ...s,
      balance: parseFloat(s.balance || '0')
    }));
    sendResponse(res, mapped);
  } catch (error) {
    sendError(res, 'فشل جلب الموردين', error);
  }
});

app.post('/api/suppliers', authorize(['manager', 'inventory', 'accountant']), async (req, res) => {
  try {
    const s = req.body;
    const errors = validateSupplier(s);
    if (errors.length > 0) {
      return sendError(res, 'خطأ في التحقق من البيانات', errors, 400);
    }

    const id = s.id || 'supp_' + Math.random().toString(36).substr(2, 9);
    const dbValue = {
      id,
      name: s.name,
      phone: s.phone || '',
      email: s.email || '',
      balance: (s.balance || 0).toString()
    };

    const saved = await SupplierRepository.upsert(dbValue);
    sendResponse(res, saved);
  } catch (error) {
    sendError(res, 'فشل حفظ المورد', error);
  }
});

app.delete('/api/suppliers/:id', authorize(['manager']), async (req, res) => {
  try {
    const result = await SupplierRepository.delete(req.params.id);
    sendResponse(res, result);
  } catch (error) {
    sendError(res, 'فشل حذف المورد', error);
  }
});

app.get('/api/suppliers/:id/ledger', async (req, res) => {
  try {
    const { id } = req.params;
    const supplier = await SupplierRepository.findById(id);
    if (!supplier) {
      return sendError(res, 'المورد غير موجود', null, 404);
    }

    // Get all purchases for this supplier
    const supplierPurchases = await SupplierRepository.getSupplierPurchases(id);

    // Get all journal entries related to this supplier (JE-PUR and JE-PAY)
    const allEntries = await AccountingRepository.getJournalEntries();
    const supplierEntries = allEntries.filter(e => 
      e.description?.includes(supplier.name) || 
      e.entryNumber?.includes(`PAY-`) || 
      supplierPurchases.some(p => p.purchaseNumber && e.entryNumber?.includes(String(p.purchaseNumber)))
    );

    let runningBalance = 0;
    const ledgerLines = [];

    for (const pur of supplierPurchases) {
      const gTotal = parseFloat(pur.grandTotal || '0');
      if (pur.paymentMethod === 'credit') {
        runningBalance += gTotal;
        ledgerLines.push({
          id: `pur-${pur.id}`,
          date: pur.date,
          type: 'purchase_invoice',
          typeLabel: 'فاتورة مشتريات آجلة',
          reference: pur.purchaseNumber,
          invoiceNumber: pur.supplierInvoiceNumber || pur.purchaseNumber,
          debit: 0,
          credit: gTotal,
          runningBalance,
          notes: pur.notes || `فاتورة مشتريات رقم ${pur.purchaseNumber}`
        });
      }
    }

    // Process payments
    for (const entry of supplierEntries) {
      if (entry.entryNumber.startsWith('JE-PAY-') && entry.description.includes(supplier.name)) {
        const debitDetail = entry.details.find((d: any) => Number(d.debit || 0) > 0);
        const amount = debitDetail ? Number(debitDetail.debit || 0) : 0;
        if (amount > 0) {
          runningBalance -= amount;
          ledgerLines.push({
            id: `pay-${entry.id}`,
            date: entry.date,
            type: 'supplier_payment',
            typeLabel: 'سند صرف مورد',
            reference: entry.entryNumber.replace('JE-', ''),
            invoiceNumber: '-',
            debit: amount,
            credit: 0,
            runningBalance,
            notes: entry.description
          });
        }
      }
    }

    ledgerLines.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    sendResponse(res, {
      supplier: {
        ...supplier,
        balance: parseFloat(supplier.balance || '0')
      },
      currentBalance: parseFloat(supplier.balance || '0'),
      ledgerLines
    });
  } catch (error) {
    sendError(res, 'فشل جلب كشف حساب المورد', error);
  }
});

// 6. Invoices & POS Sales API (With pagination and filtration)
app.get('/api/invoices', async (req, res) => {
  try {
    const { page, limit, customerId, status, date } = req.query;
    const p = page ? parseInt(page as string) : undefined;
    const l = limit ? parseInt(limit as string) : undefined;

    const result = await SalesRepository.findAllInvoices({
      page: p,
      limit: l,
      customerId: customerId as string,
      status: status as string,
      date: date as string
    });

    if (p || l) {
      sendResponse(res, result.items, 200, { page: p || 1, limit: l || 10, total: result.total });
    } else {
      sendResponse(res, result.items);
    }
  } catch (error) {
    sendError(res, 'فشل جلب الفواتير', error);
  }
});

app.post('/api/invoices', authorize(['manager', 'cashier']), async (req, res) => {
  try {
    const inv = req.body;
    const errors = validateInvoice(inv);
    if (errors.length > 0) {
      return sendError(res, 'خطأ في التحقق من البيانات', errors, 400);
    }

    const result = await SalesRepository.createSaleInvoice(inv);
    sendResponse(res, result);
  } catch (error) {
    sendError(res, 'فشل إنشاء الفاتورة', error);
  }
});

app.post('/api/invoices/:id/return', authorize(['manager', 'cashier', 'accountant']), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await SalesRepository.returnSaleInvoice(id);
    sendResponse(res, result);
  } catch (error: any) {
    sendError(res, error.message || 'فشل معالجة مرتجع الفاتورة', error);
  }
});

// 6b. Quotations API (عروض الأسعار)
app.get('/api/quotations', async (req, res) => {
  try {
    const quotes = await SalesRepository.findAllQuotations();
    sendResponse(res, quotes);
  } catch (error) {
    sendError(res, 'فشل جلب عروض الأسعار', error);
  }
});

app.post('/api/quotations', authorize(['manager', 'cashier', 'accountant']), async (req, res) => {
  try {
    const result = await SalesRepository.createQuotation(req.body);
    sendResponse(res, result);
  } catch (error) {
    sendError(res, 'فشل إنشاء عرض السعر', error);
  }
});

app.post('/api/quotations/:id/convert-order', authorize(['manager', 'cashier', 'accountant']), async (req, res) => {
  try {
    const result = await SalesRepository.convertQuotationToOrder(req.params.id);
    sendResponse(res, result);
  } catch (error: any) {
    sendError(res, error.message || 'فشل تحويل عرض السعر إلى أمر مبيعات', error);
  }
});

// 6c. Sales Orders API (أوامر المبيعات)
app.get('/api/sales-orders', async (req, res) => {
  try {
    const orders = await SalesRepository.findAllSalesOrders();
    sendResponse(res, orders);
  } catch (error) {
    sendError(res, 'فشل جلب أوامر المبيعات', error);
  }
});

app.post('/api/sales-orders', authorize(['manager', 'cashier', 'accountant']), async (req, res) => {
  try {
    const result = await SalesRepository.createSalesOrder(req.body);
    sendResponse(res, result);
  } catch (error) {
    sendError(res, 'فشل إنشاء أمر المبيعات', error);
  }
});

app.post('/api/sales-orders/:id/convert-invoice', authorize(['manager', 'cashier', 'accountant']), async (req, res) => {
  try {
    const { paymentMethod } = req.body;
    const result = await SalesRepository.convertOrderToInvoice(req.params.id, paymentMethod || 'credit');
    sendResponse(res, result);
  } catch (error: any) {
    sendError(res, error.message || 'فشل تحويل أمر المبيعات إلى فاتورة', error);
  }
});

// 6d. Customer Payments API (تحصيل سندات المبيعات)
app.post('/api/customer-payments', authorize(['manager', 'cashier', 'accountant']), async (req, res) => {
  try {
    const result = await SalesRepository.recordCustomerPayment(req.body);
    sendResponse(res, result);
  } catch (error: any) {
    sendError(res, error.message || 'فشل تسجيل تحصيل دفعة العميل', error);
  }
});

// 7. Expenses API (With filtration and standard response)
app.get('/api/expenses', authorize(['manager', 'accountant', 'inventory']), async (req, res) => {
  try {
    const { date, page, limit } = req.query;
    const conditions = [];
    if (date) {
      conditions.push(eq(expenses.date, date as string));
    }
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    let total = 0;
    if (page || limit) {
      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(expenses)
        .where(whereClause);
      total = Number(countResult[0]?.count || 0);
    }

    let query = db.select().from(expenses).orderBy(desc(expenses.createdAt));
    if (whereClause) {
      query = query.where(whereClause) as any;
    }

    if (page && limit) {
      const p = parseInt(page as string) || 1;
      const l = parseInt(limit as string) || 10;
      query = query.limit(l).offset((p - 1) * l) as any;
    }

    const allExpenses = await query;
    const mapped = allExpenses.map(e => ({
      ...e,
      amount: parseFloat(e.amount)
    }));

    if (page || limit) {
      const p = parseInt(page as string) || 1;
      const l = parseInt(limit as string) || 10;
      sendResponse(res, mapped, 200, { page: p, limit: l, total });
    } else {
      sendResponse(res, mapped);
    }
  } catch (error) {
    sendError(res, 'فشل جلب المصاريف', error);
  }
});

app.post('/api/expenses', authorize(['manager', 'accountant']), async (req, res) => {
  try {
    const exp = req.body;
    if (!exp.description || !exp.amount || parseFloat(exp.amount) <= 0) {
      return sendError(res, 'بيانات المصروف غير صالحة', null, 400);
    }

    const id = 'exp_' + Math.random().toString(36).substr(2, 9);
    
    const expDeb = await getAccountByRule('expense_debit', 'acc_expense');
    const expCred = await getAccountByRule('expense_credit', 'acc_cash');

    await db.insert(expenses).values({
      id,
      description: exp.description,
      amount: exp.amount.toString(),
      accountId: expDeb,
      date: exp.date
    });

    await postJournalEntry(
      `JE-EXP-${id}`,
      `مصروف: ${exp.description}`,
      exp.date,
      [
        { accountId: expDeb, debit: parseFloat(exp.amount), credit: 0 },
        { accountId: expCred, debit: 0, credit: parseFloat(exp.amount) }
      ]
    );

    sendResponse(res, { success: true, id });
  } catch (error) {
    sendError(res, 'فشل تسجيل المصروف', error);
  }
});

app.delete('/api/expenses/:id', authorize(['manager', 'accountant']), async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(expenses).where(eq(expenses.id, id));
    sendResponse(res, { success: true });
  } catch (error) {
    sendError(res, 'فشل حذف المصروف', error);
  }
});

// 8. ERP Chart of Accounts & Accounting APIs
app.get(['/api/accounts', '/api/accounting/accounts'], authorize(['manager', 'accountant', 'cashier']), async (req, res) => {
  try {
    const { companyId, type, activeOnly, search } = req.query;
    const accountsList = await AccountRepository.getAccounts({
      companyId: companyId as string,
      type: type as string,
      activeOnly: activeOnly === 'true',
      search: search as string
    });
    sendResponse(res, accountsList);
  } catch (error) {
    sendError(res, 'فشل جلب دليل الحسابات', error);
  }
});

app.get('/api/accounts/tree', authorize(['manager', 'accountant', 'cashier']), async (req, res) => {
  try {
    const { companyId } = req.query;
    const tree = await AccountRepository.getAccountsTree(companyId as string);
    sendResponse(res, tree);
  } catch (error) {
    sendError(res, 'فشل جلب الشجرة الهرمية للحسابات', error);
  }
});

app.get('/api/accounts/suggest-code', authorize(['manager', 'accountant']), async (req, res) => {
  try {
    const { parentId } = req.query;
    if (!parentId) {
      return sendError(res, 'معرف الحساب الرئيسي parentId مطلوب', null, 400);
    }
    const suggestedCode = await AccountRepository.suggestChildCode(parentId as string);
    sendResponse(res, { suggestedCode });
  } catch (error: any) {
    sendError(res, error.message || 'فشل توليد رمز الحساب الفرعي', error, 400);
  }
});

app.get('/api/accounts/:id', authorize(['manager', 'accountant']), async (req, res) => {
  try {
    const { id } = req.params;
    const account = await AccountRepository.findAccountById(id);
    if (!account) {
      return sendError(res, 'الحساب المالي غير موجود', null, 404);
    }
    sendResponse(res, account);
  } catch (error) {
    sendError(res, 'فشل جلب تفاصيل الحساب', error);
  }
});

app.post(['/api/accounts', '/api/accounting/accounts'], authorize(['manager', 'accountant']), async (req, res) => {
  try {
    const { code, name, type } = req.body;
    if (!code || !name || !type) {
      return sendError(res, 'جميع الحقول الأساسية للحساب مطلوبة (الرمز، الاسم، النوع)', null, 400);
    }
    const saved = await AccountRepository.upsertAccount(req.body);
    sendResponse(res, saved);
  } catch (error: any) {
    sendError(res, error.message || 'فشل حفظ الحساب', error, 400);
  }
});

app.post('/api/accounts/:id/toggle-active', authorize(['manager', 'accountant']), async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    const updated = await AccountRepository.toggleAccountActive(id, isActive !== false);
    sendResponse(res, updated);
  } catch (error: any) {
    sendError(res, error.message || 'فشل تغيير حالة الحساب', error, 400);
  }
});

app.post('/api/accounts/seed', authorize(['manager', 'accountant']), async (req, res) => {
  try {
    const { companyId } = req.body;
    const result = await AccountRepository.seedDefaultChartOfAccounts(companyId);
    sendResponse(res, result);
  } catch (error: any) {
    sendError(res, error.message || 'فشل زرع دليل الحسابات القياسي', error);
  }
});

app.delete(['/api/accounts/:id', '/api/accounting/accounts/:id'], authorize(['manager', 'accountant']), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await AccountRepository.deleteAccount(id);
    sendResponse(res, result);
  } catch (error: any) {
    sendError(res, error.message || 'فشل حذف الحساب', error, 400);
  }
});

app.get('/api/accounting/ledger', authorize(['manager', 'accountant']), async (req, res) => {
  try {
    const { accountId, startDate, endDate, currency } = req.query;
    if (!accountId) {
      return sendError(res, 'يجب تحديد معرف الحساب accountId', null, 400);
    }
    
    const result = await AccountingRepository.getGeneralLedger(
      accountId as string, 
      startDate as string, 
      endDate as string,
      currency as string
    );
    sendResponse(res, result);
  } catch (error: any) {
    sendError(res, error.message || 'فشل جلب دفتر الأستاذ للحساب', error);
  }
});

app.get('/api/accounting/trial-balance', authorize(['manager', 'accountant']), async (req, res) => {
  try {
    const { currency } = req.query;
    const trialBalanceData = await AccountingRepository.getTrialBalance(currency as string);
    sendResponse(res, trialBalanceData);
  } catch (error) {
    sendError(res, 'فشل جلب ميزان المراجعة', error);
  }
});

app.get('/api/accounting/journal-entries', authorize(['manager', 'accountant']), async (req, res) => {
  try {
    const { search, date, currency, status } = req.query;
    const entries = await AccountingRepository.getJournalEntries(
      search as string, 
      date as string, 
      currency as string,
      status as string
    );
    sendResponse(res, entries);
  } catch (error) {
    sendError(res, 'فشل جلب قيود اليومية', error);
  }
});

app.get('/api/accounting/journal-entries/:id', authorize(['manager', 'accountant']), async (req, res) => {
  try {
    const { id } = req.params;
    const [entry] = await db.select().from(journalEntries).where(eq(journalEntries.id, id));
    if (!entry) return sendError(res, 'القيد المحاسبي غير موجود', null, 404);

    const lines = await db.select().from(journalLines).where(eq(journalLines.journalEntryId, id));
    const accountIds = Array.from(new Set(lines.map(l => l.accountId)));
    const accs = accountIds.length > 0 ? await db.select().from(accounts).where(inArray(accounts.id, accountIds)) : [];
    const accMap = new Map(accs.map(a => [a.id, a]));

    const mappedLines = lines.map(l => {
      const acc = accMap.get(l.accountId);
      return {
        id: l.id,
        accountId: l.accountId,
        accountCode: acc?.code || '',
        accountName: acc?.name || '',
        accountType: acc?.type || '',
        currency: l.currency || entry.currency || 'SAR',
        exchangeRate: parseFloat(l.exchangeRate || '1.0'),
        foreignDebit: parseFloat(l.foreignDebit || '0'),
        foreignCredit: parseFloat(l.foreignCredit || '0'),
        debit: parseFloat(l.debit || '0'),
        credit: parseFloat(l.credit || '0'),
        description: l.description || entry.description
      };
    });

    sendResponse(res, {
      ...entry,
      foreignAmount: parseFloat(entry.foreignAmount || '0'),
      baseAmount: parseFloat(entry.baseAmount || '0'),
      exchangeRate: parseFloat(entry.exchangeRate || '1.0'),
      lines: mappedLines
    });
  } catch (error) {
    sendError(res, 'فشل جلب تفاصيل القيد المحاسبي', error);
  }
});

app.post('/api/accounting/journal-entries', authorize(['manager', 'accountant']), async (req: any, res) => {
  try {
    const { description, date, reference, lines, currency, baseCurrency, exchangeRate, status } = req.body;
    if (!description || !date || !lines || !Array.isArray(lines) || lines.length === 0) {
      return sendError(res, 'بيانات قيد اليومية غير مكتملة', null, 400);
    }
    const entryNum = 'JE-MAN-' + Math.floor(1000 + Math.random() * 9000);
    const createdBy = req.user?.name || 'المحاسب المالي';

    const result = await JournalEngine.postJournalEntry(
      entryNum, 
      description, 
      date, 
      lines, 
      {
        reference,
        currency,
        baseCurrency,
        exchangeRate: exchangeRate ? parseFloat(exchangeRate) : undefined,
        status: status || 'posted',
        createdBy
      }
    );
    sendResponse(res, { success: true, ...result });
  } catch (error: any) {
    sendError(res, error.message || 'فشل حفظ القيد المحاسبي اليدوي', error, 400);
  }
});

app.post('/api/accounting/journal-entries/:id/post', authorize(['manager', 'accountant']), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await JournalEngine.postDraftEntry(id);
    sendResponse(res, result);
  } catch (error: any) {
    sendError(res, error.message || 'فشل ترحيل قيد المسودة', error, 400);
  }
});

app.post('/api/accounting/journal-entries/:id/reverse', authorize(['manager', 'accountant']), async (req: any, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    if (!reason || !reason.trim()) {
      return sendError(res, 'يجب كتابة سبب عكس وتعديل القيد المحاسبي لأغراض التدقيق', null, 400);
    }
    const createdBy = req.user?.name || 'مدير التدقيق المحاسبي';
    const result = await JournalEngine.reverseJournalEntry(id, reason, createdBy);
    sendResponse(res, result);
  } catch (error: any) {
    sendError(res, error.message || 'فشل عكس القيد المحاسبي', error, 400);
  }
});

app.get('/api/accounting/audit-health', authorize(['manager', 'accountant']), async (req, res) => {
  try {
    const health = await JournalEngine.verifyAccountingIntegrity();
    sendResponse(res, health);
  } catch (error) {
    sendError(res, 'فشل تنفيذ فحص التدقيق المحاسبي', error);
  }
});

app.post('/api/currencies/revaluate', authorize(['manager', 'accountant']), async (req, res) => {
  try {
    const { currencyCode, newExchangeRate, revaluationDate } = req.body;
    if (!currencyCode || !newExchangeRate) {
      return sendError(res, 'رمز العملة وسعر الصرف الجديد مطلوبان', null, 400);
    }
    const dateToUse = revaluationDate || new Date().toISOString().split('T')[0];
    const result = await AccountingRepository.revaluateForeignAccounts(
      currencyCode,
      parseFloat(newExchangeRate),
      dateToUse
    );
    sendResponse(res, result);
  } catch (error: any) {
    sendError(res, error.message || 'فشل تنفيذ عملية إعادة تقييم العملة', error, 400);
  }
});

// Posting Rules APIs
app.get('/api/accounting/posting-rules', authorize(['manager', 'accountant']), async (req, res) => {
  try {
    const rules = await AccountingRepository.getPostingRules();
    sendResponse(res, rules);
  } catch (error) {
    sendError(res, 'فشل جلب قواعد الترحيل المحاسبي', error);
  }
});

app.post('/api/accounting/posting-rules', authorize(['manager', 'accountant']), async (req, res) => {
  try {
    const { ruleCode, accountId } = req.body;
    if (!ruleCode || !accountId) {
      return sendError(res, 'رمز القاعدة ومعرف الحساب مطلوبان', null, 400);
    }
    
    const saved = await AccountingRepository.upsertPostingRule(ruleCode, accountId);
    sendResponse(res, { success: true, ...saved });
  } catch (error) {
    sendError(res, 'فشل تحديث قاعدة الترحيل', error);
  }
});

// 9. Store Settings API
app.get('/api/settings', async (req, res) => {
  try {
    const existing = await db.select().from(settings);
    if (existing.length === 0) {
      const defaultSettings = {
        id: 'global_settings',
        name: 'مطعم ومقهى السحاب',
        logo: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=100&h=100&fit=crop',
        address: 'الرياض، طريق الملك فهد',
        phone: '0501234567',
        taxNumber: '310234567800003',
        taxRate: '15',
        currency: 'ر.س',
        thermalPrinterWidth: '80mm'
      };
      await db.insert(settings).values(defaultSettings);
      return sendResponse(res, {
        ...defaultSettings,
        taxRate: parseFloat(defaultSettings.taxRate)
      });
    }
    const current = existing[0];
    sendResponse(res, {
      ...current,
      taxRate: parseFloat(current.taxRate || '15')
    });
  } catch (error) {
    sendError(res, 'فشل جلب إعدادات المتجر', error);
  }
});

app.post('/api/settings', authorize(['manager']), async (req, res) => {
  try {
    const s = req.body;
    const dbValue = {
      id: 'global_settings',
      name: s.name,
      logo: s.logo || '',
      address: s.address || '',
      phone: s.phone || '',
      taxNumber: s.taxNumber || '',
      taxRate: (s.taxRate ?? 15).toString(),
      currency: s.currency || 'ر.س',
      thermalPrinterWidth: s.thermalPrinterWidth || '80mm'
    };

    const existing = await db.select().from(settings).where(eq(settings.id, 'global_settings'));
    if (existing.length > 0) {
      await db.update(settings).set(dbValue).where(eq(settings.id, 'global_settings'));
    } else {
      await db.insert(settings).values(dbValue);
    }
    sendResponse(res, dbValue);
  } catch (error) {
    sendError(res, 'فشل تحديث الإعدادات', error);
  }
});

// 10. Users, Roles & Permissions APIs (Manager restricted)

// GET all roles with their associated permissions
app.get('/api/roles', authorize(['manager', 'manage_users']), async (req, res) => {
  try {
    const allRoles = await db.select().from(roles);
    
    // For each role, fetch its permissions
    const rolesWithPermissions = await Promise.all(
      allRoles.map(async (r) => {
        const rps = await db
          .select({
            id: permissions.id,
            code: permissions.code,
            name: permissions.name,
            module: permissions.module,
            description: permissions.description
          })
          .from(rolePermissions)
          .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
          .where(eq(rolePermissions.roleId, r.id));
        return {
          ...r,
          permissions: rps
        };
      })
    );
    
    sendResponse(res, rolesWithPermissions);
  } catch (error) {
    sendError(res, 'فشل جلب الأدوار والصلاحيات', error);
  }
});

// CREATE or UPDATE a role with custom permissions
app.post('/api/roles', authorize(['manager', 'manage_users']), async (req, res) => {
  try {
    const { id, name, code, description, permissionIds } = req.body;
    if (!name || !code) {
      return sendError(res, 'الاسم والرمز مطلوبان لتسجيل دور جديد', null, 400);
    }

    const roleId = id || 'role_' + Math.random().toString(36).substr(2, 9);
    const existing = await db.select().from(roles).where(eq(roles.id, roleId));

    const dbValue = {
      id: roleId,
      name,
      code,
      description,
      updatedAt: new Date()
    };

    if (existing.length > 0) {
      await db.update(roles).set(dbValue).where(eq(roles.id, roleId));
    } else {
      await db.insert(roles).values(dbValue);
    }

    // Update role permissions mappings
    if (Array.isArray(permissionIds)) {
      // Clear old permissions
      await db.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId));
      
      // Insert new ones
      if (permissionIds.length > 0) {
        const rpsValues = permissionIds.map((pId, idx) => ({
          id: `rp_${roleId}_${idx}_${Math.random().toString(36).substr(2, 5)}`,
          roleId,
          permissionId: pId
        }));
        await db.insert(rolePermissions).values(rpsValues);
      }
    }

    sendResponse(res, { id: roleId, name, code, description, permissionIds });
  } catch (error) {
    sendError(res, 'فشل حفظ الدور والصلاحيات', error);
  }
});

// DELETE a role
app.delete('/api/roles/:id', authorize(['manager', 'manage_users']), async (req, res) => {
  try {
    const { id } = req.params;
    if (['role_manager', 'role_accountant', 'role_inventory', 'role_cashier'].includes(id)) {
      return sendError(res, 'لا يمكن حذف الأدوار النظامية الأساسية للمؤسسة', null, 400);
    }
    await db.delete(roles).where(eq(roles.id, id));
    sendResponse(res, { success: true });
  } catch (error) {
    sendError(res, 'فشل حذف الدور', error);
  }
});

// GET all available permissions
app.get('/api/permissions', authorize(['manager', 'manage_users']), async (req, res) => {
  try {
    const allPermissions = await db.select().from(permissions);
    sendResponse(res, allPermissions);
  } catch (error) {
    sendError(res, 'فشل جلب الصلاحيات', error);
  }
});

// GET all users (with associated role details)
app.get('/api/users', authorize(['manager', 'manage_users']), async (req, res) => {
  try {
    const { page, limit, role } = req.query;
    const conditions = [];
    if (role) {
      conditions.push(eq(users.role, role as string));
    }
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    let total = 0;
    if (page || limit) {
      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(whereClause);
      total = Number(countResult[0]?.count || 0);
    }

    let query = db
      .select({
        id: users.id,
        uid: users.uid,
        email: users.email,
        name: users.name,
        role: users.role,
        roleId: users.roleId,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        roleName: roles.name,
        roleCode: roles.code
      })
      .from(users)
      .leftJoin(roles, eq(users.roleId, roles.id));

    if (whereClause) {
      query = query.where(whereClause) as any;
    }

    if (page && limit) {
      const p = parseInt(page as string) || 1;
      const l = parseInt(limit as string) || 10;
      query = query.limit(l).offset((p - 1) * l) as any;
    }

    const allUsers = await query;

    if (page || limit) {
      const p = parseInt(page as string) || 1;
      const l = parseInt(limit as string) || 10;
      sendResponse(res, allUsers, 200, { page: p, limit: l, total });
    } else {
      sendResponse(res, allUsers);
    }
  } catch (error) {
    sendError(res, 'فشل جلب المستخدمين', error);
  }
});

// CREATE or UPDATE a user (including roleId link and compatibility sync)
app.post('/api/users', authorize(['manager', 'manage_users']), async (req, res) => {
  try {
    const u = req.body;
    const errors = validateUser(u);
    if (errors.length > 0) {
      return sendError(res, 'خطأ في التحقق من البيانات', errors, 400);
    }

    const id = u.id || 'user_' + Math.random().toString(36).substr(2, 9);
    const existing = await db.select().from(users).where(eq(users.id, id));

    // Resolve compatible role string code from roleId
    let finalRole = u.role || 'cashier';
    if (u.roleId) {
      const [r] = await db.select().from(roles).where(eq(roles.id, u.roleId));
      if (r) {
        finalRole = r.code;
      }
    }

    const dbValue = {
      id,
      uid: u.uid || id,
      email: u.email,
      name: u.name,
      role: finalRole,
      roleId: u.roleId || null,
      updatedAt: new Date()
    };

    if (existing.length > 0) {
      await db.update(users).set(dbValue).where(eq(users.id, id));
    } else {
      await db.insert(users).values(dbValue);
    }
    sendResponse(res, dbValue);
  } catch (error) {
    sendError(res, 'فشل حفظ المستخدم', error);
  }
});

// DELETE a user
app.delete('/api/users/:id', authorize(['manager', 'manage_users']), async (req: any, res) => {
  try {
    const { id } = req.params;
    if (id === '001' || id === req.user.id) {
      return sendError(res, 'غير مسموح بحذف الحساب الإداري الرئيسي أو حسابك النشط حالياً.', null, 400);
    }
    await db.delete(users).where(eq(users.id, id));
    sendResponse(res, { success: true });
  } catch (error) {
    sendError(res, 'فشل حذف المستخدم', error);
  }
});

// 11. Cashboxes API
app.get('/api/cashboxes', async (req, res) => {
  try {
    const boxes = await db.select().from(cashboxes);
    const mapped = boxes.map(b => ({
      ...b,
      currentBalance: parseFloat(b.currentBalance || '0')
    }));
    sendResponse(res, mapped);
  } catch (error) {
    sendError(res, 'فشل جلب صناديق النقدية', error);
  }
});

app.post('/api/cashboxes', authorize(['manager']), async (req, res) => {
  try {
    const box = req.body;
    if (!box.name || box.name.trim() === '') {
      return sendError(res, 'اسم الصندوق مطلوب', null, 400);
    }
    const id = box.id || 'cashbox_' + Math.random().toString(36).substr(2, 9);
    const existing = await db.select().from(cashboxes).where(eq(cashboxes.id, id));

    const dbValue = {
      id,
      name: box.name,
      status: box.status || 'closed',
      currentBalance: (box.currentBalance || 0).toString(),
      lastOpenedAt: box.lastOpenedAt || null,
      lastClosedAt: box.lastClosedAt || null
    };

    if (existing.length > 0) {
      await db.update(cashboxes).set(dbValue).where(eq(cashboxes.id, id));
    } else {
      await db.insert(cashboxes).values(dbValue);
    }
    sendResponse(res, dbValue);
  } catch (error) {
    sendError(res, 'فشل حفظ صندوق النقدية', error);
  }
});

app.post('/api/cashboxes/open', authorize(['manager', 'cashier']), async (req, res) => {
  try {
    const { id, startBalance } = req.body;
    if (!id) return sendError(res, 'معرف الصندوق مطلوب', null, 400);

    const [box] = await db.select().from(cashboxes).where(eq(cashboxes.id, id));
    if (!box) return sendError(res, 'الصندوق غير موجود', null, 404);

    const updated = {
      status: 'open',
      currentBalance: (startBalance || 0).toString(),
      lastOpenedAt: new Date().toISOString()
    };
    await db.update(cashboxes).set(updated).where(eq(cashboxes.id, id));
    sendResponse(res, { success: true, box: { ...box, ...updated } });
  } catch (error) {
    sendError(res, 'فشل فتح الصندوق', error);
  }
});

app.post('/api/cashboxes/close', authorize(['manager', 'cashier']), async (req, res) => {
  try {
    const { id, endBalance } = req.body;
    if (!id) return sendError(res, 'معرف الصندوق مطلوب', null, 400);

    const [box] = await db.select().from(cashboxes).where(eq(cashboxes.id, id));
    if (!box) return sendError(res, 'الصندوق غير موجود', null, 404);

    const updated = {
      status: 'closed',
      currentBalance: (endBalance || 0).toString(),
      lastClosedAt: new Date().toISOString()
    };
    await db.update(cashboxes).set(updated).where(eq(cashboxes.id, id));
    sendResponse(res, { success: true, box: { ...box, ...updated } });
  } catch (error) {
    sendError(res, 'فشل إغلاق الصندوق', error);
  }
});

// 11b. Treasury & Banking API (الخزينة والبنوك)
app.get('/api/treasury/cashboxes', async (req, res) => {
  try {
    const list = await TreasuryRepository.getCashboxes();
    sendResponse(res, list);
  } catch (error) {
    sendError(res, 'فشل جلب صناديق الخزينة', error);
  }
});

app.post('/api/treasury/cashboxes', authorize(['manager', 'accountant']), async (req, res) => {
  try {
    const item = await TreasuryRepository.upsertCashbox(req.body);
    sendResponse(res, item);
  } catch (error) {
    sendError(res, 'فشل حفظ صندوق الخزينة', error);
  }
});

app.delete('/api/treasury/cashboxes/:id', authorize(['manager']), async (req, res) => {
  try {
    await TreasuryRepository.deleteCashbox(req.params.id);
    sendResponse(res, { success: true });
  } catch (error) {
    sendError(res, 'فشل حذف الخزينة', error);
  }
});

app.get('/api/treasury/bank-accounts', async (req, res) => {
  try {
    const list = await TreasuryRepository.getBankAccounts();
    sendResponse(res, list);
  } catch (error) {
    sendError(res, 'فشل جلب الحسابات البنكية', error);
  }
});

app.post('/api/treasury/bank-accounts', authorize(['manager', 'accountant']), async (req, res) => {
  try {
    const item = await TreasuryRepository.upsertBankAccount(req.body);
    sendResponse(res, item);
  } catch (error) {
    sendError(res, 'فشل حفظ الحساب البنكي', error);
  }
});

app.delete('/api/treasury/bank-accounts/:id', authorize(['manager']), async (req, res) => {
  try {
    await TreasuryRepository.deleteBankAccount(req.params.id);
    sendResponse(res, { success: true });
  } catch (error) {
    sendError(res, 'فشل حذف الحساب البنكي', error);
  }
});

app.get('/api/treasury/transactions', async (req, res) => {
  try {
    const type = req.query.type as string;
    const list = await TreasuryRepository.getTransactions(type);
    sendResponse(res, list);
  } catch (error) {
    sendError(res, 'فشل جلب معاملات الخزينة والبنوك', error);
  }
});

app.post('/api/treasury/deposits', authorize(['manager', 'accountant', 'cashier']), async (req, res) => {
  try {
    const result = await TreasuryRepository.createDeposit(req.body);
    sendResponse(res, result);
  } catch (error: any) {
    sendError(res, error.message || 'فشل تسجيل الإيداع', error);
  }
});

app.post('/api/treasury/withdrawals', authorize(['manager', 'accountant']), async (req, res) => {
  try {
    const result = await TreasuryRepository.createWithdrawal(req.body);
    sendResponse(res, result);
  } catch (error: any) {
    sendError(res, error.message || 'فشل تسجيل السحب/المصروف', error);
  }
});

app.post('/api/treasury/transfers', authorize(['manager', 'accountant']), async (req, res) => {
  try {
    const result = await TreasuryRepository.createTransfer(req.body);
    sendResponse(res, result);
  } catch (error: any) {
    sendError(res, error.message || 'فشل تنفيذ التحويل المالي', error);
  }
});

app.get('/api/treasury/reconciliations/:bankAccountId', async (req, res) => {
  try {
    const list = await TreasuryRepository.getBankReconciliations(req.params.bankAccountId);
    sendResponse(res, list);
  } catch (error) {
    sendError(res, 'فشل جلب سجل التسويات البنكية', error);
  }
});

app.get('/api/treasury/unreconciled/:bankAccountId', async (req, res) => {
  try {
    const list = await TreasuryRepository.getUnreconciledTransactions(req.params.bankAccountId);
    sendResponse(res, list);
  } catch (error) {
    sendError(res, 'فشل جلب المعاملات غير المسواة', error);
  }
});

app.post('/api/treasury/reconcile', authorize(['manager', 'accountant']), async (req, res) => {
  try {
    const result = await TreasuryRepository.executeBankReconciliation(req.body);
    sendResponse(res, result);
  } catch (error: any) {
    sendError(res, error.message || 'فشل إتمام التسوية البنكية', error);
  }
});

// 11c. Expense Management API (إدارة المصروفات والتصنيفات)
app.get('/api/expenses/categories', async (req, res) => {
  try {
    const list = await ExpenseRepository.getCategories();
    sendResponse(res, list);
  } catch (error) {
    sendError(res, 'فشل جلب تصنيفات المصروفات', error);
  }
});

app.post('/api/expenses/categories', authorize(['manager', 'accountant']), async (req, res) => {
  try {
    const cat = await ExpenseRepository.upsertCategory(req.body);
    sendResponse(res, cat);
  } catch (error) {
    sendError(res, 'فشل حفظ تصنيف المصروفات', error);
  }
});

app.delete('/api/expenses/categories/:id', authorize(['manager']), async (req, res) => {
  try {
    await ExpenseRepository.deleteCategory(req.params.id);
    sendResponse(res, { success: true });
  } catch (error) {
    sendError(res, 'فشل حذف تصنيف المصروفات', error);
  }
});

app.get('/api/expenses/requests', async (req, res) => {
  try {
    const statusFilter = req.query.status as string;
    const list = await ExpenseRepository.getRequests(statusFilter);
    sendResponse(res, list);
  } catch (error) {
    sendError(res, 'فشل جلب طلبات المصروفات', error);
  }
});

app.post('/api/expenses/requests', async (req, res) => {
  try {
    const item = await ExpenseRepository.createRequest(req.body);
    sendResponse(res, item);
  } catch (error: any) {
    sendError(res, error.message || 'فشل إنشاء طلب المصروف', error);
  }
});

app.post('/api/expenses/requests/:id/approve', authorize(['manager', 'accountant']), async (req, res) => {
  try {
    const approvedBy = req.body.approvedBy || (req as any).user?.name || 'مدير النظام';
    const result = await ExpenseRepository.approveRequest(req.params.id, approvedBy);
    sendResponse(res, result);
  } catch (error: any) {
    sendError(res, error.message || 'فشل الموافقة على طلب المصروف', error);
  }
});

app.post('/api/expenses/requests/:id/reject', authorize(['manager', 'accountant']), async (req, res) => {
  try {
    const reason = req.body.reason || 'تم رفض الطلب بواسطة الإدارة';
    const result = await ExpenseRepository.rejectRequest(req.params.id, reason);
    sendResponse(res, result);
  } catch (error: any) {
    sendError(res, error.message || 'فشل رفض طلب المصروف', error);
  }
});

app.post('/api/expenses/requests/:id/pay', authorize(['manager', 'accountant', 'cashier']), async (req, res) => {
  try {
    const result = await ExpenseRepository.payExpense(req.params.id, req.body);
    sendResponse(res, result);
  } catch (error: any) {
    sendError(res, error.message || 'فشل سداد المصروف القيد المحاسبي', error);
  }
});

app.get('/api/expenses/reports', async (req, res) => {
  try {
    const reports = await ExpenseRepository.getExpenseReports();
    sendResponse(res, reports);
  } catch (error) {
    sendError(res, 'فشل جلب تقارير المصروفات', error);
  }
});

// 11d. Reporting Engine API (محرك التقارير والشاشات التحليلية)
app.get('/api/reports/sales', async (req, res) => {
  try {
    const filter = {
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string
    };
    const report = await ReportsRepository.getSalesReport(filter);
    sendResponse(res, report);
  } catch (error) {
    sendError(res, 'فشل توليد تقرير المبيعات', error);
  }
});

app.get('/api/reports/purchases', async (req, res) => {
  try {
    const filter = {
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string
    };
    const report = await ReportsRepository.getPurchaseReport(filter);
    sendResponse(res, report);
  } catch (error) {
    sendError(res, 'فشل توليد تقرير المشتريات', error);
  }
});

app.get('/api/reports/inventory', async (req, res) => {
  try {
    const report = await ReportsRepository.getInventoryReport();
    sendResponse(res, report);
  } catch (error) {
    sendError(res, 'فشل توليد تقرير المخزون', error);
  }
});

app.get('/api/reports/customers', async (req, res) => {
  try {
    const report = await ReportsRepository.getCustomerReport();
    sendResponse(res, report);
  } catch (error) {
    sendError(res, 'فشل توليد تقرير العملاء', error);
  }
});

app.get('/api/reports/suppliers', async (req, res) => {
  try {
    const report = await ReportsRepository.getSupplierReport();
    sendResponse(res, report);
  } catch (error) {
    sendError(res, 'فشل توليد تقرير الموردين', error);
  }
});

app.get('/api/reports/profit', async (req, res) => {
  try {
    const filter = {
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string
    };
    const report = await ReportsRepository.getProfitReport(filter);
    sendResponse(res, report);
  } catch (error) {
    sendError(res, 'فشل توليد تقرير الأرباح والخسائر', error);
  }
});

app.get('/api/reports/financial-statements', async (req, res) => {
  try {
    const filter = {
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      currency: req.query.currency as string
    };
    const report = await ReportsRepository.getFinancialStatements(filter);
    sendResponse(res, report);
  } catch (error) {
    sendError(res, 'فشل توليد القوائم المالية المحاسبية', error);
  }
});

// 12. Purchasing API (ERP Procurement Workflow)
app.get('/api/purchase-requests', async (req, res) => {
  try {
    const list = await PurchaseRepository.findAllPurchaseRequests();
    sendResponse(res, list);
  } catch (error) {
    sendError(res, 'فشل جلب طلبات الشراء', error);
  }
});

app.post('/api/purchase-requests', authorize(['manager', 'inventory', 'accountant']), async (req, res) => {
  try {
    const result = await PurchaseRepository.createPurchaseRequest(req.body);
    sendResponse(res, result);
  } catch (error) {
    sendError(res, 'فشل إنشاء طلب الشراء', error);
  }
});

app.post('/api/purchase-requests/:id/convert-order', authorize(['manager', 'inventory', 'accountant']), async (req, res) => {
  try {
    const result = await PurchaseRepository.convertRequestToOrder(req.params.id);
    sendResponse(res, result);
  } catch (error: any) {
    sendError(res, error.message || 'فشل تحويل طلب الشراء إلى أمر شراء', error);
  }
});

app.get('/api/purchases', async (req, res) => {
  try {
    const list = await PurchaseRepository.findAllPurchases();
    sendResponse(res, list);
  } catch (error) {
    sendError(res, 'فشل جلب قائمة المشتريات وأوامر الشراء', error);
  }
});

app.post('/api/purchases', authorize(['manager', 'inventory', 'accountant']), async (req, res) => {
  try {
    const { items, invoiceNumber, purchaseNumber } = req.body;
    if ((!invoiceNumber && !purchaseNumber) || !items || items.length === 0) {
      return sendError(res, 'بيانات المشتريات غير مكتملة', null, 400);
    }
    
    const result = await PurchaseRepository.createPurchaseOrder(req.body);
    sendResponse(res, result);
  } catch (error) {
    sendError(res, 'فشل تسجيل فاتورة أو أمر المشتريات', error);
  }
});

// Receive Goods for a Purchase Order (إذن استلام البضائع)
app.post('/api/purchases/:id/receive', authorize(['manager', 'inventory']), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await PurchaseRepository.receiveGoods(id, req.body || {});
    sendResponse(res, result);
  } catch (error: any) {
    sendError(res, error.message || 'فشل استلام البضائع', error);
  }
});

// Issue Supplier Invoice & Post Accounting for a Received Purchase Order
app.post('/api/purchases/:id/invoice', authorize(['manager', 'accountant']), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await PurchaseRepository.issueSupplierInvoice(id, req.body || {});
    sendResponse(res, result);
  } catch (error: any) {
    sendError(res, error.message || 'فشل إصدار فاتورة المورد', error);
  }
});

// Return Purchase Invoice & Post Accounting Reversal
app.post('/api/purchases/:id/return', authorize(['manager', 'accountant', 'inventory']), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await PurchaseRepository.returnPurchaseInvoice(id, req.body || {});
    sendResponse(res, result);
  } catch (error: any) {
    sendError(res, error.message || 'فشل تسجيل مرتجع المشتريات والترحيل المحاسبي', error);
  }
});

// 13. Customer Receipt Payments API
app.get('/api/payments/customer', authorize(['manager', 'cashier', 'accountant']), async (req, res) => {
  try {
    const { customerId } = req.query;
    let query = db.select().from(payments).where(eq(payments.type, 'receipt'));
    if (customerId) {
      query = db.select().from(payments).where(
        and(
          eq(payments.type, 'receipt'),
          eq(payments.partyId, customerId as string)
        )
      ) as any;
    }
    const list = await query;
    const mapped = list.map(p => ({
      id: p.id,
      receiptNumber: p.paymentNumber,
      customerId: p.partyId,
      amount: parseFloat(p.amount || '0'),
      paymentMethod: p.method,
      date: p.date,
      reference: p.reference || '',
      notes: p.notes || '',
      createdAt: p.createdAt
    }));
    sendResponse(res, mapped);
  } catch (error) {
    sendError(res, 'فشل جلب سندات القبض', error);
  }
});

app.post('/api/payments/customer', authorize(['manager', 'cashier', 'accountant']), async (req, res) => {
  try {
    const { customerId, amount, paymentMethod, date, receiptNumber, reference, notes, invoiceId } = req.body;
    if (!customerId || !amount || parseFloat(amount) <= 0) {
      return sendError(res, 'بيانات سند القبض غير كاملة أو غير صالحة', null, 400);
    }
    
    const customer = await CustomerRepository.findById(customerId);
    if (!customer) throw new Error('العميل غير موجود');

    const num = receiptNumber || `RCPT-${Date.now().toString().slice(-6)}`;
    const pmtDate = date || new Date().toISOString().split('T')[0];
    const pmtMethod = paymentMethod || 'cash';
    
    await CustomerRepository.adjustBalance(customerId, -amount);

    // Record in payments table
    await db.insert(payments).values({
      id: 'pay_' + Math.random().toString(36).substr(2, 9),
      companyId: customer.companyId || 'company_default',
      branchId: customer.branchId || 'branch_default',
      paymentNumber: num,
      date: pmtDate,
      type: 'receipt',
      partyId: customerId,
      partyType: 'customer',
      amount: amount.toString(),
      method: pmtMethod,
      reference: reference || invoiceId || '',
      notes: notes || `سند قبض من العميل: ${customer.name}`
    });

    // Accounting Entry
    const cashAcc = await getAccountByRule('payment_customer_debit_cash', 'acc_cash');
    const bankAcc = await getAccountByRule('payment_customer_debit_bank', 'acc_bank');
    const custCreditAcc = await getAccountByRule('payment_customer_credit', 'acc_receivable');

    const accountingLines = [];
    if (pmtMethod === 'cash') {
      accountingLines.push({ accountId: cashAcc, debit: amount, credit: 0 });
    } else {
      accountingLines.push({ accountId: bankAcc, debit: amount, credit: 0 });
    }
    accountingLines.push({ accountId: custCreditAcc, debit: 0, credit: amount });

    await postJournalEntry(
      `JE-RCPT-${num}`,
      `سند قبض عميل: ${customer.name} - ${num}`,
      pmtDate,
      accountingLines
    );

    sendResponse(res, { success: true, receiptNumber: num, customerName: customer.name });
  } catch (error) {
    sendError(res, 'فشل تسجيل سند القبض', error);
  }
});

// 14. Supplier Payments API
app.post('/api/payments/supplier', authorize(['manager', 'inventory', 'accountant']), async (req, res) => {
  try {
    const { supplierId, amount, paymentMethod, date, paymentNumber, currency, exchangeRate } = req.body;
    if (!supplierId || !amount || parseFloat(amount) <= 0) {
      return sendError(res, 'بيانات سند الصرف غير كاملة أو غير صالحة', null, 400);
    }
    
    const supplier = await SupplierRepository.findById(supplierId);
    if (!supplier) throw new Error('المورد غير موجود');
    
    await SupplierRepository.adjustBalance(supplierId, -amount);

    const payDebAcc = await getAccountByRule('payment_supplier_debit', 'acc_payable');
    const cashAcc = await getAccountByRule('payment_supplier_credit_cash', 'acc_cash');
    const bankAcc = await getAccountByRule('payment_supplier_credit_bank', 'acc_bank');

    const accountingLines = [];
    accountingLines.push({ accountId: payDebAcc, debit: amount, credit: 0 });
    if (paymentMethod === 'cash') {
      accountingLines.push({ accountId: cashAcc, debit: 0, credit: amount });
    } else {
      accountingLines.push({ accountId: bankAcc, debit: 0, credit: amount });
    }

    await postJournalEntry(
      `JE-PAY-${paymentNumber}`,
      `سند صرف مورد: ${supplier.name}`,
      date,
      accountingLines,
      {
        currency: currency || 'SAR',
        exchangeRate: exchangeRate ? parseFloat(exchangeRate) : 1.0
      }
    );

    sendResponse(res, { success: true });
  } catch (error) {
    sendError(res, 'فشل تسجيل سند الصرف', error);
  }
});


// ─── DATABASE SEEDER FOR DEFAULT ERP CONVENTIONS ───
async function seedDefaultData() {
  try {
    await ensureDatabaseTables();

    const existingCompanies = await db.select().from(companies);
    if (existingCompanies.length === 0) {
      console.log('Seeding default Company...');
      await db.insert(companies).values({
        id: 'company-1',
        name: 'المؤسسة الرئيسية',
        taxNumber: '300000000000003',
        email: 'info@company.com',
        phone: '0110000000',
        address: 'الرياض، المملكة العربية السعودية'
      });
    }

    const existingBranches = await db.select().from(branches);
    if (existingBranches.length === 0) {
      console.log('Seeding default Branch...');
      await db.insert(branches).values({
        id: 'branch-1',
        companyId: 'company-1',
        name: 'الفرع الرئيسي',
        code: 'BR-MAIN',
        address: 'الرياض'
      });
    }

    const existingAccounts = await db.select().from(accounts);
    if (existingAccounts.length === 0) {
      console.log('Seeding default Chart of Accounts...');
      const defaultAccounts = [
        { id: 'acc_cash', code: '1101', name: 'النقدية بالصندوق (Cash)', type: 'asset', balance: '0' },
        { id: 'acc_bank', code: '1102', name: 'الحساب البنكي (Bank)', type: 'asset', balance: '0' },
        { id: 'acc_receivable', code: '1103', name: 'الذمم المدينة للعملاء (Receivables)', type: 'asset', balance: '0' },
        { id: 'acc_inventory', code: '1201', name: 'مخزون البضائع (Inventory)', type: 'asset', balance: '0' },
        { id: 'acc_payable', code: '2101', name: 'الذمم الدائنة للموردين (Payables)', type: 'liability', balance: '0' },
        { id: 'acc_tax', code: '2201', name: 'ضريبة القيمة المضافة المستحقة (VAT)', type: 'liability', balance: '0' },
        { id: 'acc_equity', code: '3101', name: 'رأس المال (Capital)', type: 'equity', balance: '0' },
        { id: 'acc_sales', code: '4101', name: 'إيراد المبيعات (Sales Revenue)', type: 'revenue', balance: '0' },
        { id: 'acc_forex_gain', code: '4201', name: 'أرباح فروق العملة (Gain on FX)', type: 'revenue', balance: '0' },
        { id: 'acc_cogs', code: '5101', name: 'تكلفة البضاعة المباعة (COGS)', type: 'expense', balance: '0' },
        { id: 'acc_expense', code: '5201', name: 'المصاريف العمومية والتشغيلية (Expenses)', type: 'expense', balance: '0' },
        { id: 'acc_forex_loss', code: '5202', name: 'خسائر فروق العملة (Loss on FX)', type: 'expense', balance: '0' },
      ];
      await db.insert(accounts).values(defaultAccounts);
      console.log('Chart of Accounts seeded successfully.');
    }

    const existingSuppliers = await db.select().from(suppliers);
    if (existingSuppliers.length === 0) {
      console.log('Seeding default Suppliers...');
      const defaultSuppliers = [
        { id: 'supp-1', name: 'شركة المراعي الوطنية', phone: '0114944444', email: 'info@almarai.com', balance: '0' },
        { id: 'supp-2', name: 'شركة لوزين للمخبوزات', phone: '0112345678', email: 'sales@lusine.com', balance: '0' },
        { id: 'supp-3', name: 'موزع حلويات الخليج', phone: '0501112223', email: 'dist@gulfsweets.com', balance: '0' },
      ];
      await db.insert(suppliers).values(defaultSuppliers);
    }

    const existingUnits = await db.select().from(units);
    if (existingUnits.length === 0) {
      console.log('Seeding default Units...');
      const defaultUnits = [
        { id: '1', name: 'حبة' },
        { id: '2', name: 'كيلو' },
        { id: '3', name: 'كرتون' },
        { id: '4', name: 'لتر' },
        { id: '5', name: 'شدة' },
        { id: '6', name: 'جرام' }
      ];
      await db.insert(units).values(defaultUnits);
    }

    const existingCategories = await db.select().from(categories);
    if (existingCategories.length === 0) {
      console.log('Seeding default Categories...');
      const defaultCategories = [
        { id: 'cat-1', name: 'المعلبات والأغذية', icon: '🥫' },
        { id: 'cat-2', name: 'المخبوزات والحلويات', icon: '🍞' },
        { id: 'cat-3', name: 'المشروبات والعصائر', icon: '🥤' },
        { id: 'cat-4', name: 'الألبان والأجبان', icon: '🧀' },
        { id: 'cat-5', name: 'الخضروات والفواكه', icon: '🍎' }
      ];
      await db.insert(categories).values(defaultCategories);
    }

    const existingRoles = await db.select().from(roles);
    if (existingRoles.length === 0) {
      console.log('Seeding default ERP Roles...');
      const defaultRoles = [
        { id: 'role_manager', name: 'المدير العام', code: 'manager', description: 'صلاحيات كاملة على كافة النظام والتحكم بالصلاحيات والمستخدمين' },
        { id: 'role_accountant', name: 'المحاسب المالي', code: 'accountant', description: 'إدارة الحسابات وقيود اليومية والتقارير المالية والضريبية' },
        { id: 'role_inventory', name: 'أمين المستودع', code: 'inventory', description: 'إدارة المنتجات، الكميات، التحركات المخزنية وفواتير المشتريات' },
        { id: 'role_cashier', name: 'موظف الكاشير', code: 'cashier', description: 'إجراء المبيعات وإصدار فواتير نقاط البيع السريعة' }
      ];
      await db.insert(roles).values(defaultRoles);
    }

    const existingPermissions = await db.select().from(permissions);
    if (existingPermissions.length === 0) {
      console.log('Seeding default ERP Permissions...');
      const defaultPermissions = [
        { id: 'p_view_dashboard', name: 'عرض لوحة التحكم', code: 'view_dashboard', module: 'dashboard', description: 'عرض الإحصائيات العامة للمؤسسة' },
        { id: 'p_pos_access', name: 'الوصول لنقطة البيع', code: 'pos_access', module: 'sales', description: 'استخدام كاشير المبيعات ونقاط البيع' },
        { id: 'p_manage_inventory', name: 'إدارة المنتجات والمخزن', code: 'manage_inventory', module: 'inventory', description: 'إضافة وتعديل المنتجات وإدارة الكميات والتحركات' },
        { id: 'p_view_invoices', name: 'عرض الفواتير والضرائب', code: 'view_invoices', module: 'sales', description: 'الاطلاع على فواتير المبيعات والتقارير الضريبية' },
        { id: 'p_view_reports', name: 'عرض التقارير والأرباح', code: 'view_reports', module: 'dashboard', description: 'عرض التقارير المالية التفصيلية وحساب الأربائر والخسائر' },
        { id: 'p_view_purchases', name: 'المشتريات والمدفوعات', code: 'view_purchases', module: 'purchases', description: 'إدارة فواتير المشتريات ومستحقات الموردين' },
        { id: 'p_view_accounting', name: 'القيود والحسابات المالية', code: 'view_accounting', module: 'accounting', description: 'إدارة الدفاتر المحاسبية وشجرة الحسابات وقيود اليومية' },
        { id: 'p_view_settings', name: 'إعدادات النظام والضريبة', code: 'view_settings', module: 'settings', description: 'إعدادات المتجر وبيانات الضريبة والطباعة الحرارية' },
        { id: 'p_manage_users', name: 'إدارة المستخدمين والصلاحيات', code: 'manage_users', module: 'users', description: 'إدارة ملفات الموظفين وأدوارهم وصلاحياتهم' }
      ];
      await db.insert(permissions).values(defaultPermissions);
    }

    const existingRolePerms = await db.select().from(rolePermissions);
    if (existingRolePerms.length === 0) {
      console.log('Seeding default Role Permissions...');
      const defaultRolePerms = [
        // Manager gets everything
        { id: 'rp1', roleId: 'role_manager', permissionId: 'p_view_dashboard' },
        { id: 'rp2', roleId: 'role_manager', permissionId: 'p_pos_access' },
        { id: 'rp3', roleId: 'role_manager', permissionId: 'p_manage_inventory' },
        { id: 'rp4', roleId: 'role_manager', permissionId: 'p_view_invoices' },
        { id: 'rp5', roleId: 'role_manager', permissionId: 'p_view_reports' },
        { id: 'rp6', roleId: 'role_manager', permissionId: 'p_view_purchases' },
        { id: 'rp7', roleId: 'role_manager', permissionId: 'p_view_accounting' },
        { id: 'rp8', roleId: 'role_manager', permissionId: 'p_view_settings' },
        { id: 'rp9', roleId: 'role_manager', permissionId: 'p_manage_users' },

        // Accountant
        { id: 'rp10', roleId: 'role_accountant', permissionId: 'p_view_dashboard' },
        { id: 'rp11', roleId: 'role_accountant', permissionId: 'p_pos_access' },
        { id: 'rp12', roleId: 'role_accountant', permissionId: 'p_view_invoices' },
        { id: 'rp13', roleId: 'role_accountant', permissionId: 'p_view_reports' },
        { id: 'rp14', roleId: 'role_accountant', permissionId: 'p_view_purchases' },
        { id: 'rp15', roleId: 'role_accountant', permissionId: 'p_view_accounting' },

        // Inventory
        { id: 'rp16', roleId: 'role_inventory', permissionId: 'p_view_dashboard' },
        { id: 'rp17', roleId: 'role_inventory', permissionId: 'p_manage_inventory' },
        { id: 'rp18', roleId: 'role_inventory', permissionId: 'p_view_purchases' },

        // Cashier
        { id: 'rp19', roleId: 'role_cashier', permissionId: 'p_pos_access' },
        { id: 'rp20', roleId: 'role_cashier', permissionId: 'p_view_invoices' }
      ];
      await db.insert(rolePermissions).values(defaultRolePerms);
    }

    const existingUsers = await db.select().from(users);
    if (existingUsers.length === 0) {
      console.log('Seeding default ERP Users with Role IDs...');
      const defaultUsers = [
        { id: '001', uid: '001', email: 'manager@system.com', name: 'عبدالرحمن (المدير العام)', role: 'manager', roleId: 'role_manager' },
        { id: '002', uid: '002', email: 'accountant@system.com', name: 'ياسر (المحاسب المالي)', role: 'accountant', roleId: 'role_accountant' },
        { id: '003', uid: '003', email: 'inventory@system.com', name: 'أنس (أمين المستودع)', role: 'inventory', roleId: 'role_inventory' },
        { id: '004', uid: '004', email: 'cashier@system.com', name: 'أحمد (موظف الكاشير)', role: 'cashier', roleId: 'role_cashier' }
      ];
      await db.insert(users).values(defaultUsers);
      console.log('ERP Users seeded successfully.');
    } else {
      // For existing users, update roleId if it is null
      for (const u of existingUsers) {
        if (!u.roleId) {
          let roleId = 'role_cashier';
          if (u.role === 'manager') roleId = 'role_manager';
          else if (u.role === 'accountant') roleId = 'role_accountant';
          else if (u.role === 'inventory') roleId = 'role_inventory';
          
          await db.update(users).set({ roleId }).where(eq(users.id, u.id));
        }
      }
    }

    const existingBoxes = await db.select().from(cashboxes);
    if (existingBoxes.length === 0) {
      console.log('Seeding default Cashboxes...');
      const defaultBoxes = [
        { id: 'box_main', name: 'الصندوق الرئيسي (المبيعات اليومية)', status: 'closed', currentBalance: '0' },
        { id: 'box_spare', name: 'صندوق الطوارئ الاحتياطي', status: 'closed', currentBalance: '0' }
      ];
      await db.insert(cashboxes).values(defaultBoxes);
    }

    const existingRules = await db.select().from(postingRules);
    if (existingRules.length === 0) {
      console.log('Seeding default Posting Rules...');
      const defaultRules = [
        { id: 'pr_s_cash', ruleCode: 'sales_cash_debit', accountId: 'acc_cash', description: 'حساب مدين المبيعات النقدية (الصندوق)' },
        { id: 'pr_s_bank', ruleCode: 'sales_bank_debit', accountId: 'acc_bank', description: 'حساب مدين المبيعات البنكية (الشبكة)' },
        { id: 'pr_s_credit', ruleCode: 'sales_credit_debit', accountId: 'acc_receivable', description: 'حساب مدين المبيعات الآجلة (العملاء)' },
        { id: 'pr_s_rev', ruleCode: 'sales_revenue_credit', accountId: 'acc_sales', description: 'حساب دائن إيرادات المبيعات' },
        { id: 'pr_s_tax', ruleCode: 'sales_tax_credit', accountId: 'acc_tax', description: 'حساب دائن ضريبة القيمة المضافة المحتسبة' },
        { id: 'pr_s_cogs', ruleCode: 'sales_cogs_debit', accountId: 'acc_cogs', description: 'حساب مدين تكلفة البضاعة المباعة' },
        { id: 'pr_s_inv', ruleCode: 'sales_inventory_credit', accountId: 'acc_inventory', description: 'حساب دائن المخزون (المبيعات)' },
        { id: 'pr_p_cash', ruleCode: 'purchase_cash_credit', accountId: 'acc_cash', description: 'حساب دائن المشتريات النقدية (الصندوق)' },
        { id: 'pr_p_bank', ruleCode: 'purchase_bank_credit', accountId: 'acc_bank', description: 'حساب دائن المشتريات البنكية (الشبكة)' },
        { id: 'pr_p_credit', ruleCode: 'purchase_credit_credit', accountId: 'acc_payable', description: 'حساب دائن المشتريات الآجلة (الموردين)' },
        { id: 'pr_p_inv', ruleCode: 'purchase_inventory_debit', accountId: 'acc_inventory', description: 'حساب مدين المخزون (المشتريات)' },
        { id: 'pr_p_tax', ruleCode: 'purchase_tax_debit', accountId: 'acc_tax', description: 'حساب مدين ضريبة مدخلات المشتريات' },
        { id: 'pr_e_deb', ruleCode: 'expense_debit', accountId: 'acc_expense', description: 'حساب مدين المصاريف التشغيلية' },
        { id: 'pr_e_cred', ruleCode: 'expense_credit', accountId: 'acc_cash', description: 'حساب دائن سداد المصاريف (الصندوق)' },
        { id: 'pr_pm_c_deb_cash', ruleCode: 'payment_customer_debit_cash', accountId: 'acc_cash', description: 'حساب مدين سندات القبض نقدًا (الصندوق)' },
        { id: 'pr_pm_c_deb_bank', ruleCode: 'payment_customer_debit_bank', accountId: 'acc_bank', description: 'حساب مدين سندات القبض بنكًا (الشبكة)' },
        { id: 'pr_pm_c_cred', ruleCode: 'payment_customer_credit', accountId: 'acc_receivable', description: 'حساب دائن تسوية عميل (سند قبض)' },
        { id: 'pr_pm_s_deb', ruleCode: 'payment_supplier_debit', accountId: 'acc_payable', description: 'حساب مدين تسوية مورد (سند صرف)' },
        { id: 'pr_pm_s_cred_cash', ruleCode: 'payment_supplier_credit_cash', accountId: 'acc_cash', description: 'حساب دائن سندات الصرف نقدًا (الصندوق)' },
        { id: 'pr_pm_s_cred_bank', ruleCode: 'payment_supplier_credit_bank', accountId: 'acc_bank', description: 'حساب دائن سندات الصرف بنكًا (الشبكة)' },
        { id: 'pr_forex_gain', ruleCode: 'forex_gain_credit', accountId: 'acc_forex_gain', description: 'حساب أرباح فروق تسعير العملات' },
        { id: 'pr_forex_loss', ruleCode: 'forex_loss_debit', accountId: 'acc_forex_loss', description: 'حساب خسائر فروق تسعير العملات' },
      ];
      await db.insert(postingRules).values(defaultRules);
      console.log('Posting Rules seeded successfully.');
    }

    const existingCurrencies = await db.select().from(currencies);
    if (existingCurrencies.length === 0) {
      console.log('Seeding default Currencies (SAR, USD, SYP, TRY)...');
      for (const curr of DEFAULT_CURRENCIES) {
        await db.insert(currencies).values({
          id: curr.id,
          code: curr.code,
          name: curr.name,
          symbol: curr.symbol,
          exchangeRate: curr.exchangeRate.toString(),
          isDefault: curr.isDefault ? 'true' : 'false',
        });
      }
      console.log('Default Currencies seeded successfully.');
    }
  } catch (error) {
    console.error('Error seeding database default data:', error);
  }
}


// ─── VITE DEV / PROD MIDDLEWARE INTEGRATION ───
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
    seedDefaultData().catch(err => {
      console.error('Error during seedDefaultData:', err);
    });
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
