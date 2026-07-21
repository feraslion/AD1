import { db } from '../database/index.ts';
import { suppliers } from '../database/schema.ts';
import { eq, like, or } from 'drizzle-orm';

export class SupplierRepository {
  static async findAll(search?: string) {
    if (search) {
      const term = `%${search}%`;
      return await db.select().from(suppliers).where(
        or(
          like(suppliers.name, term),
          like(suppliers.phone, term)
        )
      );
    }
    return await db.select().from(suppliers);
  }

  static async findById(id: string) {
    const result = await db.select().from(suppliers).where(eq(suppliers.id, id));
    return result[0] || null;
  }

  static async upsert(supplierData: any) {
    const existing = await this.findById(supplierData.id);
    if (existing) {
      await db.update(suppliers).set(supplierData).where(eq(suppliers.id, supplierData.id));
    } else {
      await db.insert(suppliers).values(supplierData);
    }
    return supplierData;
  }

  static async updateBalance(id: string, newBalance: number) {
    await db.update(suppliers).set({ balance: newBalance.toString() }).where(eq(suppliers.id, id));
  }

  static async delete(id: string) {
    await db.delete(suppliers).where(eq(suppliers.id, id));
    return { success: true };
  }
}
