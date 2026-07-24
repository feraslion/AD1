import { db } from '../database/index.ts';
import { products, categories, units, stockMoves, warehouses } from '../database/schema.ts';
import { eq, desc } from 'drizzle-orm';

export class ProductRepository {
  static async findAll(params?: { search?: string; category?: string }) {
    let list = await db.select().from(products);
    if (params?.category) {
      list = list.filter(p => p.category === params.category);
    }
    if (params?.search) {
      const term = params.search.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(term) || p.barcode.includes(term));
    }
    return list;
  }

  static async findById(id: string) {
    const result = await db.select().from(products).where(eq(products.id, id));
    return result[0] || null;
  }

  static async getProductHistory(productId: string) {
    const moves = await db
      .select({
        id: stockMoves.id,
        productId: stockMoves.productId,
        quantity: stockMoves.quantity,
        unitCost: stockMoves.unitCost,
        type: stockMoves.type,
        referenceId: stockMoves.referenceId,
        notes: stockMoves.notes,
        createdAt: stockMoves.createdAt,
        fromWarehouseId: stockMoves.fromWarehouseId,
        toWarehouseId: stockMoves.toWarehouseId,
      })
      .from(stockMoves)
      .where(eq(stockMoves.productId, productId))
      .orderBy(desc(stockMoves.createdAt));

    let runningStock = 0;
    const history = moves.map(m => {
      const qty = parseFloat(m.quantity || '0');
      const isIncrease = ['purchase', 'adjustment_in', 'initial', 'return'].includes(m.type) || (m.type === 'adjustment' && qty > 0);
      const qtyIn = isIncrease ? Math.abs(qty) : 0;
      const qtyOut = !isIncrease ? Math.abs(qty) : 0;
      
      let typeLabel = 'حركة مخزنية';
      if (m.type === 'sale') typeLabel = 'فاتورة مبيعات POS';
      else if (m.type === 'purchase') typeLabel = 'فاتورة توريد مشتريات';
      else if (m.type === 'transfer') typeLabel = 'تحويل بين المستودعات';
      else if (m.type === 'adjustment') typeLabel = 'تسوية مخزنية أسبوعية/سنوية';
      else if (m.type === 'initial') typeLabel = 'رصيد افتتاحي للمنتج';
      else if (m.type === 'return') typeLabel = 'مرتجع مبيعات/مشتريات';

      return {
        id: m.id,
        date: m.createdAt ? new Date(m.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        type: m.type,
        typeLabel,
        reference: m.referenceId || 'N/A',
        quantityIn: qtyIn,
        quantityOut: qtyOut,
        balanceAfter: 0, // Calculated client side or in accumulator
        unitPrice: parseFloat(m.unitCost || '0'),
        notes: m.notes || ''
      };
    });

    return history;
  }

  static async upsert(productData: any) {
    const existing = await this.findById(productData.id);
    const dbValue = {
      ...productData,
      price: productData.price !== undefined ? productData.price.toString() : '0',
      purchasePrice: productData.purchasePrice !== undefined ? productData.purchasePrice.toString() : '0',
      stock: productData.stock !== undefined ? productData.stock.toString() : '0',
      minStock: productData.minStock !== undefined ? productData.minStock.toString() : '0',
      taxRate: productData.taxRate !== undefined ? productData.taxRate.toString() : '15',
    };
    if (existing) {
      await db.update(products).set(dbValue).where(eq(products.id, productData.id));
    } else {
      await db.insert(products).values(dbValue);
    }
    return dbValue;
  }

  static async updateStock(id: string, newStock: number) {
    await db.update(products).set({ stock: newStock.toString() }).where(eq(products.id, id));
  }

  static async delete(id: string) {
    await db.delete(products).where(eq(products.id, id));
    return { success: true };
  }

  static async getCategories() {
    return await db.select().from(categories);
  }

  static async upsertCategory(data: any) {
    const existing = await db.select().from(categories).where(eq(categories.id, data.id));
    if (existing.length > 0) {
      await db.update(categories).set(data).where(eq(categories.id, data.id));
    } else {
      await db.insert(categories).values(data);
    }
    return data;
  }

  static async deleteCategory(id: string) {
    await db.delete(categories).where(eq(categories.id, id));
    return { success: true };
  }

  static async getUnits() {
    return await db.select().from(units);
  }

  static async upsertUnit(data: any) {
    const existing = await db.select().from(units).where(eq(units.id, data.id));
    if (existing.length > 0) {
      await db.update(units).set(data).where(eq(units.id, data.id));
    } else {
      await db.insert(units).values(data);
    }
    return data;
  }

  static async deleteUnit(id: string) {
    await db.delete(units).where(eq(units.id, id));
    return { success: true };
  }
}
