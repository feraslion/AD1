import { db } from '../database/index.ts';
import { products, categories, units } from '../database/schema.ts';
import { eq } from 'drizzle-orm';

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
