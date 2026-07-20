import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './src/core/database/index.ts';
import {
  products,
  customers,
  suppliers,
  invoices,
  invoiceItems,
  accounts,
  journalEntries,
  journalDetails,
  expenses,
  settings,
  users,
  categories,
  units,
  cashboxes,
  roles,
  permissions,
  rolePermissions,
  postingRules
} from './src/core/database/schema.ts';
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

app.use(authenticate);
app.use(requestLogger);

// ─── ACCOUNTING JOURNAL POST ENGINE ───
async function postJournalEntry(entryNumber: string, description: string, date: string, lines: { accountId: string, debit: number, credit: number }[]) {
  const totalDebit = lines.reduce((sum, l) => sum + l.debit, 0);
  const totalCredit = lines.reduce((sum, l) => sum + l.credit, 0);
  
  const roundedDebit = Math.round(totalDebit * 100) / 100;
  const roundedCredit = Math.round(totalCredit * 100) / 100;

  if (Math.abs(roundedDebit - roundedCredit) > 0.01) {
    throw new Error(`القيد غير متزن! إجمالي المدين (${roundedDebit}) لا يساوي إجمالي الدائن (${roundedCredit})`);
  }

  const entryId = 'je_' + Math.random().toString(36).substr(2, 9);
  
  await db.insert(journalEntries).values({
    id: entryId,
    entryNumber,
    description,
    date
  });

  const detailValues = [];
  const accountIds = Array.from(new Set(lines.map(line => line.accountId)));

  // Fetch all accounts involved in a single query
  const accountsList = accountIds.length > 0 
    ? await db.select().from(accounts).where(inArray(accounts.id, accountIds))
    : [];

  const accountsMap = new Map(accountsList.map(acc => [acc.id, acc]));

  for (const line of lines) {
    const detailId = 'jd_' + Math.random().toString(36).substr(2, 9);
    detailValues.push({
      id: detailId,
      journalEntryId: entryId,
      accountId: line.accountId,
      debit: line.debit.toString(),
      credit: line.credit.toString()
    });
  }

  // Bulk insert journal details in one query!
  if (detailValues.length > 0) {
    await db.insert(journalDetails).values(detailValues);
  }

  // Parallelize balance updates to minimize round-trip database latency!
  const updatePromises = lines.map(async (line) => {
    const account = accountsMap.get(line.accountId);
    if (account) {
      let currentBal = parseFloat(account.balance || '0');
      const change = line.debit - line.credit;
      
      if (account.type === 'asset' || account.type === 'expense') {
        currentBal += change;
      } else {
        currentBal -= change; // Credit increases balance for liabilities, equity, and revenues
      }

      await db.update(accounts).set({ balance: currentBal.toString() }).where(eq(accounts.id, line.accountId));
    }
  });

  await Promise.all(updatePromises);
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

// 4. Customers API (With pagination and search filtering)
app.get('/api/customers', async (req, res) => {
  try {
    const { page, limit, search } = req.query;
    
    const conditions = [];
    if (search) {
      conditions.push(
        or(
          like(customers.name, `%${search}%`),
          like(customers.phone, `%${search}%`)
        )
      );
    }
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    let total = 0;
    if (page || limit) {
      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(customers)
        .where(whereClause);
      total = Number(countResult[0]?.count || 0);
    }

    let query = db.select().from(customers);
    if (whereClause) {
      query = query.where(whereClause) as any;
    }

    if (page && limit) {
      const p = parseInt(page as string) || 1;
      const l = parseInt(limit as string) || 10;
      query = query.limit(l).offset((p - 1) * l) as any;
    }

    const allCustomers = await query;
    const mapped = allCustomers.map(c => ({
      ...c,
      balance: parseFloat(c.balance || '0'),
      creditLimit: parseFloat(c.creditLimit || '5000')
    }));

    if (page || limit) {
      const p = parseInt(page as string) || 1;
      const l = parseInt(limit as string) || 10;
      sendResponse(res, mapped, 200, { page: p, limit: l, total });
    } else {
      sendResponse(res, mapped);
    }
  } catch (error) {
    sendError(res, 'فشل جلب العملاء', error);
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
      balance: (c.balance || 0).toString(),
      creditLimit: (c.creditLimit || 5000).toString()
    };

    const existing = await db.select().from(customers).where(eq(customers.id, id));
    if (existing.length > 0) {
      await db.update(customers).set(dbValue).where(eq(customers.id, id));
    } else {
      await db.insert(customers).values(dbValue);
    }
    sendResponse(res, dbValue);
  } catch (error) {
    sendError(res, 'فشل حفظ العميل', error);
  }
});

app.delete('/api/customers/:id', authorize(['manager']), async (req, res) => {
  try {
    await db.delete(customers).where(eq(customers.id, req.params.id));
    sendResponse(res, { success: true });
  } catch (error) {
    sendError(res, 'فشل حذف العميل', error);
  }
});

// 5. Suppliers API
app.get('/api/suppliers', async (req, res) => {
  try {
    const allSuppliers = await db.select().from(suppliers);
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

    const existing = await db.select().from(suppliers).where(eq(suppliers.id, id));
    if (existing.length > 0) {
      await db.update(suppliers).set(dbValue).where(eq(suppliers.id, id));
    } else {
      await db.insert(suppliers).values(dbValue);
    }
    sendResponse(res, dbValue);
  } catch (error) {
    sendError(res, 'فشل حفظ المورد', error);
  }
});

app.delete('/api/suppliers/:id', authorize(['manager']), async (req, res) => {
  try {
    await db.delete(suppliers).where(eq(suppliers.id, req.params.id));
    sendResponse(res, { success: true });
  } catch (error) {
    sendError(res, 'فشل حذف المورد', error);
  }
});

// 6. Invoices & POS Sales API (With pagination and filtration)
app.get('/api/invoices', async (req, res) => {
  try {
    const { page, limit, customerId, status, date } = req.query;
    
    const conditions = [];
    if (customerId) {
      conditions.push(eq(invoices.customerId, customerId as string));
    }
    if (status) {
      conditions.push(eq(invoices.status, status as string));
    }
    if (date) {
      conditions.push(eq(invoices.date, date as string));
    }
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    let total = 0;
    if (page || limit) {
      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(invoices)
        .where(whereClause);
      total = Number(countResult[0]?.count || 0);
    }

    let query = db.select().from(invoices).orderBy(desc(invoices.createdAt));
    if (whereClause) {
      query = query.where(whereClause) as any;
    }

    if (page && limit) {
      const p = parseInt(page as string) || 1;
      const l = parseInt(limit as string) || 10;
      query = query.limit(l).offset((p - 1) * l) as any;
    }

    const allInvoices = await query;
    const invoiceIds = allInvoices.map(inv => inv.id);
    const allItems = invoiceIds.length > 0
      ? await db.select().from(invoiceItems).where(inArray(invoiceItems.invoiceId, invoiceIds))
      : [];

    const mapped = allInvoices.map(inv => {
      const items = allItems.filter(item => item.invoiceId === inv.id).map(item => ({
        productId: item.productId,
        productName: item.productName,
        price: parseFloat(item.price || '0'),
        quantity: parseFloat(item.quantity || '0'),
        discount: parseFloat(item.discount || '0'),
        discountType: item.discountType as 'fixed' | 'percentage',
        total: parseFloat(item.total || '0'),
        taxAmount: parseFloat(item.taxAmount || '0')
      }));

      return {
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        date: inv.date,
        items,
        totalWithoutTax: parseFloat(inv.totalWithoutTax || '0'),
        taxAmount: parseFloat(inv.taxAmount || '0'),
        discountAmount: parseFloat(inv.discountAmount || '0'),
        grandTotal: parseFloat(inv.grandTotal || '0'),
        paymentMethod: inv.paymentMethod as 'cash' | 'card' | 'credit' | 'split',
        paymentDetails: {
          cashAmount: parseFloat(inv.cashAmount || '0'),
          cardAmount: parseFloat(inv.cardAmount || '0')
        },
        status: inv.status as 'paid' | 'unpaid' | 'partially_paid',
        customerId: inv.customerId || undefined,
        customerName: inv.customerName || undefined,
        taxNumber: inv.taxNumber || undefined,
        cashierName: inv.cashierName
      };
    });

    if (page || limit) {
      const p = parseInt(page as string) || 1;
      const l = parseInt(limit as string) || 10;
      sendResponse(res, mapped, 200, { page: p, limit: l, total });
    } else {
      sendResponse(res, mapped);
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

    const invId = inv.id || 'inv_' + Math.random().toString(36).substr(2, 9);
    
    await db.insert(invoices).values({
      id: invId,
      invoiceNumber: inv.invoiceNumber,
      date: inv.date,
      totalWithoutTax: inv.totalWithoutTax.toString(),
      taxAmount: inv.taxAmount.toString(),
      discountAmount: inv.discountAmount.toString(),
      grandTotal: inv.grandTotal.toString(),
      paymentMethod: inv.paymentMethod,
      cashAmount: (inv.paymentDetails?.cashAmount || 0).toString(),
      cardAmount: (inv.paymentDetails?.cardAmount || 0).toString(),
      status: inv.status,
      customerId: inv.customerId || null,
      customerName: inv.customerName || null,
      taxNumber: inv.taxNumber || null,
      cashierName: inv.cashierName || 'أحمد الكاشير'
    });

    let totalCogs = 0;
    const itemIds = Array.from(new Set(inv.items.map((item: any) => item.productId))) as string[];

    // Bulk fetch all relevant products at once!
    const productsList = itemIds.length > 0
      ? await db.select().from(products).where(inArray(products.id, itemIds))
      : [];
    const productsMap = new Map(productsList.map(p => [p.id, p]));

    const invoiceItemValues = [];

    for (const item of inv.items) {
      const itemId = 'item_' + Math.random().toString(36).substr(2, 9);
      invoiceItemValues.push({
        id: itemId,
        invoiceId: invId,
        productId: item.productId,
        productName: item.productName,
        price: item.price.toString(),
        quantity: item.quantity.toString(),
        discount: item.discount.toString(),
        discountType: item.discountType,
        total: item.total.toString(),
        taxAmount: item.taxAmount.toString()
      });

      const product = productsMap.get(item.productId);
      if (product) {
        const purchasePrice = parseFloat(product.purchasePrice || '0');
        totalCogs += purchasePrice * item.quantity;
      }
    }

    // Bulk insert all invoice items at once!
    if (invoiceItemValues.length > 0) {
      await db.insert(invoiceItems).values(invoiceItemValues);
    }

    // Parallelize inventory stock updates!
    const stockUpdatePromises = inv.items.map(async (item: any) => {
      const product = productsMap.get(item.productId);
      if (product) {
        const currentStock = parseFloat(product.stock || '0');
        if (currentStock !== 999) {
          const nextStock = Math.max(0, currentStock - item.quantity);
          await db.update(products).set({
            stock: nextStock.toString()
          }).where(eq(products.id, item.productId));
        }
      }
    });

    await Promise.all(stockUpdatePromises);

    // Double-entry ledger integration
    const accountingLines = [];

    const cashAcc = await getAccountByRule('sales_cash_debit', 'acc_cash');
    const bankAcc = await getAccountByRule('sales_bank_debit', 'acc_bank');
    const recAcc = await getAccountByRule('sales_credit_debit', 'acc_receivable');
    const salesAcc = await getAccountByRule('sales_revenue_credit', 'acc_sales');
    const taxAcc = await getAccountByRule('sales_tax_credit', 'acc_tax');
    const cogsAcc = await getAccountByRule('sales_cogs_debit', 'acc_cogs');
    const invAcc = await getAccountByRule('sales_inventory_credit', 'acc_inventory');

    if (inv.paymentMethod === 'cash') {
      accountingLines.push({ accountId: cashAcc, debit: inv.grandTotal, credit: 0 });
    } else if (inv.paymentMethod === 'card') {
      accountingLines.push({ accountId: bankAcc, debit: inv.grandTotal, credit: 0 });
    } else if (inv.paymentMethod === 'credit') {
      accountingLines.push({ accountId: recAcc, debit: inv.grandTotal, credit: 0 });
      if (inv.customerId) {
        const [customer] = await db.select().from(customers).where(eq(customers.id, inv.customerId));
        if (customer) {
          const newBal = parseFloat(customer.balance || '0') + inv.grandTotal;
          await db.update(customers).set({ balance: newBal.toString() }).where(eq(customers.id, inv.customerId));
        }
      }
    } else if (inv.paymentMethod === 'split') {
      const cashAmt = inv.paymentDetails?.cashAmount || 0;
      const cardAmt = inv.paymentDetails?.cardAmount || 0;
      if (cashAmt > 0) accountingLines.push({ accountId: cashAcc, debit: cashAmt, credit: 0 });
      if (cardAmt > 0) accountingLines.push({ accountId: bankAcc, debit: cardAmt, credit: 0 });
    }

    accountingLines.push({ accountId: salesAcc, debit: 0, credit: inv.totalWithoutTax });

    if (inv.taxAmount > 0) {
      accountingLines.push({ accountId: taxAcc, debit: 0, credit: inv.taxAmount });
    }

    if (totalCogs > 0) {
      accountingLines.push({ accountId: cogsAcc, debit: totalCogs, credit: 0 });
      accountingLines.push({ accountId: invAcc, debit: 0, credit: totalCogs });
    }

    await postJournalEntry(
      `JE-INV-${inv.invoiceNumber}`,
      `فاتورة مبيعات رقم ${inv.invoiceNumber}`,
      inv.date,
      accountingLines
    );

    sendResponse(res, { success: true, invoiceId: invId });
  } catch (error) {
    sendError(res, 'فشل إنشاء الفاتورة', error);
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

// 8. Accounting Reports & Ledger API
app.get('/api/accounting/accounts', authorize(['manager', 'accountant']), async (req, res) => {
  try {
    const allAccounts = await db.select().from(accounts);
    sendResponse(res, allAccounts.map(acc => ({
      ...acc,
      balance: parseFloat(acc.balance || '0')
    })));
  } catch (error) {
    sendError(res, 'فشل جلب الحسابات', error);
  }
});

app.post('/api/accounting/accounts', authorize(['manager', 'accountant']), async (req, res) => {
  try {
    const { id, code, name, type, balance } = req.body;
    if (!code || !name || !type) {
      return sendError(res, 'جميع الحقول الأساسية للحساب مطلوبة', null, 400);
    }
    const accountId = id || 'acc_' + Math.random().toString(36).substr(2, 9);
    const dbValue = {
      id: accountId,
      code,
      name,
      type,
      balance: (balance || 0).toString()
    };
    const existing = await db.select().from(accounts).where(eq(accounts.id, accountId));
    if (existing.length > 0) {
      await db.update(accounts).set(dbValue).where(eq(accounts.id, accountId));
    } else {
      await db.insert(accounts).values(dbValue);
    }
    sendResponse(res, dbValue);
  } catch (error) {
    sendError(res, 'فشل حفظ الحساب', error);
  }
});

app.delete('/api/accounting/accounts/:id', authorize(['manager', 'accountant']), async (req, res) => {
  try {
    const { id } = req.params;
    const existingDetails = await db.select().from(journalDetails).where(eq(journalDetails.accountId, id));
    if (existingDetails.length > 0) {
      return sendError(res, 'لا يمكن حذف الحساب نظراً لوجود قيود محاسبية مسجلة عليه.', null, 400);
    }
    await db.delete(accounts).where(eq(accounts.id, id));
    sendResponse(res, { success: true });
  } catch (error) {
    sendError(res, 'فشل حذف الحساب', error);
  }
});

app.get('/api/accounting/ledger', authorize(['manager', 'accountant']), async (req, res) => {
  try {
    const { accountId } = req.query;
    if (!accountId) {
      return sendError(res, 'يجب تحديد معرف الحساب accountId', null, 400);
    }
    
    const [account] = await db.select().from(accounts).where(eq(accounts.id, accountId as string));
    if (!account) {
      return sendError(res, 'الحساب غير موجود', null, 404);
    }

    const details = await db.select().from(journalDetails).where(eq(journalDetails.accountId, accountId as string));
    const entryIds = Array.from(new Set(details.map(d => d.journalEntryId)));
    const entries = entryIds.length > 0
      ? await db.select().from(journalEntries).where(inArray(journalEntries.id, entryIds))
      : [];

    const ledgerLines = details.map(d => {
      const parent = entries.find(e => e.id === d.journalEntryId);
      return {
        id: d.id,
        entryNumber: parent ? parent.entryNumber : 'N/A',
        description: parent ? parent.description : 'N/A',
        date: parent ? parent.date : '',
        debit: parseFloat(d.debit || '0'),
        credit: parseFloat(d.credit || '0')
      };
    }).sort((a, b) => a.date.localeCompare(b.date));

    sendResponse(res, {
      account: {
        ...account,
        balance: parseFloat(account.balance || '0')
      },
      lines: ledgerLines
    });
  } catch (error) {
    sendError(res, 'فشل جلب دفتر الأستاذ للحساب', error);
  }
});

app.get('/api/accounting/journal-entries', authorize(['manager', 'accountant']), async (req, res) => {
  try {
    const { page, limit, search, date } = req.query;
    const conditions = [];
    if (search) {
      conditions.push(like(journalEntries.description, `%${search}%`));
    }
    if (date) {
      conditions.push(eq(journalEntries.date, date as string));
    }
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    let total = 0;
    if (page || limit) {
      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(journalEntries)
        .where(whereClause);
      total = Number(countResult[0]?.count || 0);
    }

    let query = db.select().from(journalEntries).orderBy(desc(journalEntries.createdAt));
    if (whereClause) {
      query = query.where(whereClause) as any;
    }

    if (page && limit) {
      const p = parseInt(page as string) || 1;
      const l = parseInt(limit as string) || 10;
      query = query.limit(l).offset((p - 1) * l) as any;
    }

    const allEntries = await query;
    const entryIds = allEntries.map(e => e.id);
    const allDetails = entryIds.length > 0
      ? await db.select().from(journalDetails).where(inArray(journalDetails.journalEntryId, entryIds))
      : [];

    const mapped = allEntries.map(entry => {
      const details = allDetails.filter(d => d.journalEntryId === entry.id).map(d => ({
        id: d.id,
        accountId: d.accountId,
        debit: parseFloat(d.debit || '0'),
        credit: parseFloat(d.credit || '0')
      }));
      return { ...entry, details };
    });

    if (page || limit) {
      const p = parseInt(page as string) || 1;
      const l = parseInt(limit as string) || 10;
      sendResponse(res, mapped, 200, { page: p, limit: l, total });
    } else {
      sendResponse(res, mapped);
    }
  } catch (error) {
    sendError(res, 'فشل جلب قيود اليومية', error);
  }
});

app.post('/api/accounting/journal-entries', authorize(['manager', 'accountant']), async (req, res) => {
  try {
    const { description, date, lines } = req.body;
    if (!description || !date || !lines || !Array.isArray(lines) || lines.length === 0) {
      return sendError(res, 'بيانات قيد اليومية غير مكتملة', null, 400);
    }
    const entryNum = 'JE-MAN-' + Math.floor(1000 + Math.random() * 9000);
    await postJournalEntry(entryNum, description, date, lines);
    sendResponse(res, { success: true, entryNumber: entryNum });
  } catch (error) {
    sendError(res, 'فشل حفظ القيد المحاسبي اليدوي', error.message || error);
  }
});

// Posting Rules APIs
app.get('/api/accounting/posting-rules', authorize(['manager', 'accountant']), async (req, res) => {
  try {
    const rules = await db.select().from(postingRules);
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
    
    // Check if account exists
    const [acc] = await db.select().from(accounts).where(eq(accounts.id, accountId));
    if (!acc) {
      return sendError(res, 'الحساب المحدد غير موجود', null, 404);
    }

    await db.update(postingRules).set({ accountId }).where(eq(postingRules.ruleCode, ruleCode));
    sendResponse(res, { success: true });
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

// 12. Purchasing API
app.post('/api/purchases', authorize(['manager', 'inventory', 'accountant']), async (req, res) => {
  try {
    const { supplierId, date, items, paymentMethod, invoiceNumber, taxAmount, totalWithoutTax, grandTotal } = req.body;
    if (!invoiceNumber || !items || items.length === 0) {
      return sendError(res, 'بيانات المشتريات غير مكتملة', null, 400);
    }
    
    const itemIds = Array.from(new Set(items.map((item: any) => item.productId))) as string[];
    const productsList = itemIds.length > 0
      ? await db.select().from(products).where(inArray(products.id, itemIds))
      : [];
    const productsMap = new Map(productsList.map(p => [p.id, p]));

    const updatePromises = items.map(async (item: any) => {
      const product = productsMap.get(item.productId);
      if (product) {
        const currentStock = parseFloat(product.stock || '0');
        const nextStock = currentStock === 999 ? 999 : currentStock + item.quantity;
        await db.update(products).set({
          stock: nextStock.toString(),
          purchasePrice: item.purchasePrice.toString()
        }).where(eq(products.id, item.productId));
      }
    });

    await Promise.all(updatePromises);

    if (paymentMethod === 'credit' && supplierId) {
      const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, supplierId));
      if (supplier) {
        const nextBalance = parseFloat(supplier.balance || '0') + grandTotal;
        await db.update(suppliers).set({ balance: nextBalance.toString() }).where(eq(suppliers.id, supplierId));
      }
    }

    const cashAcc = await getAccountByRule('purchase_cash_credit', 'acc_cash');
    const bankAcc = await getAccountByRule('purchase_bank_credit', 'acc_bank');
    const payAcc = await getAccountByRule('purchase_credit_credit', 'acc_payable');
    const invAcc = await getAccountByRule('purchase_inventory_debit', 'acc_inventory');
    const taxAcc = await getAccountByRule('purchase_tax_debit', 'acc_tax');

    const accountingLines = [];
    accountingLines.push({ accountId: invAcc, debit: totalWithoutTax, credit: 0 });
    if (taxAmount > 0) {
      accountingLines.push({ accountId: taxAcc, debit: taxAmount, credit: 0 });
    }

    if (paymentMethod === 'cash') {
      accountingLines.push({ accountId: cashAcc, debit: 0, credit: grandTotal });
    } else if (paymentMethod === 'card') {
      accountingLines.push({ accountId: bankAcc, debit: 0, credit: grandTotal });
    } else if (paymentMethod === 'credit') {
      accountingLines.push({ accountId: payAcc, debit: 0, credit: grandTotal });
    }

    await postJournalEntry(
      `JE-PUR-${invoiceNumber}`,
      `فاتورة مشتريات رقم ${invoiceNumber}`,
      date,
      accountingLines
    );

    sendResponse(res, { success: true });
  } catch (error) {
    sendError(res, 'فشل تسجيل فاتورة المشتريات', error);
  }
});

// 13. Customer Receipt Payments API
app.post('/api/payments/customer', authorize(['manager', 'cashier', 'accountant']), async (req, res) => {
  try {
    const { customerId, amount, paymentMethod, date, receiptNumber } = req.body;
    if (!customerId || !amount || parseFloat(amount) <= 0) {
      return sendError(res, 'بيانات سند القبض غير كاملة أو غير صالحة', null, 400);
    }
    
    const [customer] = await db.select().from(customers).where(eq(customers.id, customerId));
    if (!customer) throw new Error('العميل غير موجود');
    
    const nextBalance = parseFloat(customer.balance || '0') - amount;
    await db.update(customers).set({ balance: nextBalance.toString() }).where(eq(customers.id, customerId));

    const cashAcc = await getAccountByRule('payment_customer_debit_cash', 'acc_cash');
    const bankAcc = await getAccountByRule('payment_customer_debit_bank', 'acc_bank');
    const custCreditAcc = await getAccountByRule('payment_customer_credit', 'acc_receivable');

    const accountingLines = [];
    if (paymentMethod === 'cash') {
      accountingLines.push({ accountId: cashAcc, debit: amount, credit: 0 });
    } else {
      accountingLines.push({ accountId: bankAcc, debit: amount, credit: 0 });
    }
    accountingLines.push({ accountId: custCreditAcc, debit: 0, credit: amount });

    await postJournalEntry(
      `JE-RCPT-${receiptNumber}`,
      `سند قبض عميل: ${customer.name}`,
      date,
      accountingLines
    );

    sendResponse(res, { success: true });
  } catch (error) {
    sendError(res, 'فشل تسجيل سند القبض', error);
  }
});

// 14. Supplier Payments API
app.post('/api/payments/supplier', authorize(['manager', 'inventory', 'accountant']), async (req, res) => {
  try {
    const { supplierId, amount, paymentMethod, date, paymentNumber } = req.body;
    if (!supplierId || !amount || parseFloat(amount) <= 0) {
      return sendError(res, 'بيانات سند الصرف غير كاملة أو غير صالحة', null, 400);
    }
    
    const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, supplierId));
    if (!supplier) throw new Error('المورد غير موجود');
    
    const nextBalance = parseFloat(supplier.balance || '0') - amount;
    await db.update(suppliers).set({ balance: nextBalance.toString() }).where(eq(suppliers.id, supplierId));

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
      accountingLines
    );

    sendResponse(res, { success: true });
  } catch (error) {
    sendError(res, 'فشل تسجيل سند الصرف', error);
  }
});


// ─── DATABASE SEEDER FOR DEFAULT ERP CONVENTIONS ───
async function seedDefaultData() {
  try {
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
        { id: 'acc_cogs', code: '5101', name: 'تكلفة البضاعة المباعة (COGS)', type: 'expense', balance: '0' },
        { id: 'acc_expense', code: '5201', name: 'المصاريف العمومية والتشغيلية (Expenses)', type: 'expense', balance: '0' },
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
      ];
      await db.insert(postingRules).values(defaultRules);
      console.log('Posting Rules seeded successfully.');
    }
  } catch (error) {
    console.error('Error seeding database default data:', error);
  }
}


// ─── VITE DEV / PROD MIDDLEWARE INTEGRATION ───
async function startServer() {
  await seedDefaultData();

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
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
