import { db } from '../database/index.ts';
import { customers } from '../database/schema.ts';
import { eq, like, or } from 'drizzle-orm';

export class CustomerRepository {
  static async findAll(params?: { search?: string; page?: number; limit?: number }) {
    let query = db.select().from(customers);
    
    if (params?.search) {
      const searchTerm = `%${params.search}%`;
      query = query.where(
        or(
          like(customers.name, searchTerm),
          like(customers.phone, searchTerm)
        )
      ) as any;
    }

    const page = params?.page || 1;
    const limit = params?.limit || 50;
    const offset = (page - 1) * limit;

    const list = await query.limit(limit).offset(offset);
    return list;
  }

  static async findById(id: string) {
    const result = await db.select().from(customers).where(eq(customers.id, id));
    return result[0] || null;
  }

  static async upsert(customerData: any) {
    const existing = await this.findById(customerData.id);
    if (existing) {
      await db.update(customers).set(customerData).where(eq(customers.id, customerData.id));
    } else {
      await db.insert(customers).values(customerData);
    }
    return customerData;
  }

  static async updateBalance(id: string, newBalance: number) {
    await db.update(customers).set({ balance: newBalance.toString() }).where(eq(customers.id, id));
    return await this.findById(id);
  }

  static async adjustBalance(id: string, deltaAmount: number) {
    const customer = await this.findById(id);
    if (!customer) throw new Error('العميل غير موجود');
    const current = parseFloat(customer.balance || '0');
    const updated = current + deltaAmount;
    await this.updateBalance(id, updated);
    return updated;
  }

  static async delete(id: string) {
    await db.delete(customers).where(eq(customers.id, id));
    return { success: true };
  }
}
