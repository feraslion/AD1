import { Router } from 'express';
import { db } from '../../../database/index.ts';
import { eq, and, or, like, sql } from 'drizzle-orm';
import { products, categories, units } from '../../../database/schema.ts';
import { ProductRepository, InventoryRepository } from '../../../../core/repositories/index.ts';
import { ProductService } from '../../../services/ProductService.ts';
import { sendResponse, sendError, authorize } from './helpers.ts';

const router = Router();

// Validation helpers
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

// Products API
router.get('/products', async (req, res) => {
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

router.post('/products', authorize(['manager', 'inventory']), async (req, res) => {
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

router.delete('/products/:id', authorize(['manager', 'inventory']), async (req, res) => {
  try {
    await db.delete(products).where(eq(products.id, req.params.id));
    sendResponse(res, { success: true });
  } catch (error) {
    sendError(res, 'فشل حذف المنتج', error);
  }
});

router.get('/products/:id/history', async (req, res) => {
  try {
    const history = await ProductRepository.getProductHistory(req.params.id);
    sendResponse(res, history);
  } catch (error) {
    sendError(res, 'فشل جلب سجل حركة المنتج', error);
  }
});

// Categories API
router.get('/categories', async (req, res) => {
  try {
    const allCategories = await db.select().from(categories);
    sendResponse(res, allCategories);
  } catch (error) {
    sendError(res, 'فشل جلب التصنيفات', error);
  }
});

router.post('/categories', authorize(['manager', 'inventory']), async (req, res) => {
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

router.delete('/categories/:id', authorize(['manager', 'inventory']), async (req, res) => {
  try {
    await db.delete(categories).where(eq(categories.id, req.params.id));
    sendResponse(res, { success: true });
  } catch (error) {
    sendError(res, 'فشل حذف التصنيف', error);
  }
});

// Units API
router.get('/units', async (req, res) => {
  try {
    const allUnits = await db.select().from(units);
    sendResponse(res, allUnits);
  } catch (error) {
    sendError(res, 'فشل جلب الوحدات', error);
  }
});

router.post('/units', authorize(['manager', 'inventory', 'accountant']), async (req, res) => {
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

router.delete('/units/:id', authorize(['manager', 'inventory']), async (req, res) => {
  try {
    await db.delete(units).where(eq(units.id, req.params.id));
    sendResponse(res, { success: true });
  } catch (error) {
    sendError(res, 'فشل حذف الوحدة', error);
  }
});

// Warehouses & Inventory Engine API
router.get('/warehouses', async (req, res) => {
  try {
    const list = await InventoryRepository.getWarehouses();
    sendResponse(res, list);
  } catch (error) {
    sendError(res, 'فشل جلب المستودعات', error);
  }
});

router.post('/warehouses', authorize(['manager', 'inventory']), async (req, res) => {
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

router.delete('/warehouses/:id', authorize(['manager', 'inventory']), async (req, res) => {
  try {
    const result = await InventoryRepository.deleteWarehouse(req.params.id);
    sendResponse(res, result);
  } catch (error: any) {
    sendError(res, error.message || 'فشل حذف المستودع', error);
  }
});

// Stock Moves History API
router.get('/stock-moves', authorize(['manager', 'inventory', 'accountant']), async (req, res) => {
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
router.post('/stock-moves/manual', authorize(['manager', 'inventory']), async (req, res) => {
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

router.post('/stock-moves/transfer', authorize(['manager', 'inventory']), async (req, res) => {
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
router.post('/stock-moves/adjustment', authorize(['manager', 'inventory', 'accountant']), async (req, res) => {
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
router.get('/inventory/ledger/:productId', authorize(['manager', 'inventory', 'accountant']), async (req, res) => {
  try {
    const ledger = await InventoryRepository.getProductStockLedger(req.params.productId);
    sendResponse(res, ledger);
  } catch (error: any) {
    sendError(res, error.message || 'فشل جلب سجل استاد المنتج', error);
  }
});

// Inventory Valuation Report API
router.get('/inventory/valuation', authorize(['manager', 'inventory', 'accountant']), async (req, res) => {
  try {
    const method = (req.query.method === 'fifo' ? 'fifo' : 'average') as 'average' | 'fifo';
    const valuation = await InventoryRepository.getInventoryValuation(method);
    sendResponse(res, valuation);
  } catch (error) {
    sendError(res, 'فشل حساب تقييم المخزون', error);
  }
});

// Low Stock Alerts API
router.get('/inventory/low-stock', authorize(['manager', 'inventory', 'accountant']), async (req, res) => {
  try {
    const alerts = await InventoryRepository.getLowStockAlerts();
    sendResponse(res, alerts);
  } catch (error) {
    sendError(res, 'فشل جلب تنبيهات المخزون الحرج', error);
  }
});

export default router;
