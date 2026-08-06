import { db } from '../database/index.ts';
import { invoices, invoiceItems, customers, products } from '../database/schema.ts';
import { eq, desc, inArray, like, or, and } from 'drizzle-orm';
import { CustomerRepository } from './CustomerRepository.ts';
import { ProductRepository } from './ProductRepository.ts';

export class InvoiceRepository {
  static async findAll(params?: { search?: string; customerId?: string; status?: string }) {
    // ⚡ Bolt Performance Optimization:
    // Filter at the database level using Drizzle ORM query builders (where, and, or, eq, like)
    // instead of fetching all records and filtering them in-memory using JavaScript array filter.
    // This avoids high CPU usage and reduces memory overhead as the invoices table grows.
    const conditions = [];

    if (params?.search) {
      conditions.push(
        or(
          like(invoices.invoiceNumber, `%${params.search}%`),
          like(invoices.customerName, `%${params.search}%`)
        )
      );
    }

    if (params?.customerId) {
      conditions.push(eq(invoices.customerId, params.customerId));
    }

    if (params?.status && params.status !== 'all') {
      conditions.push(eq(invoices.status, params.status));
    }

    let query = db.select().from(invoices);
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const list = await query.orderBy(desc(invoices.createdAt));

    const invoiceIds = list.map(i => i.id);
    const allItems = invoiceIds.length > 0
      ? await db.select().from(invoiceItems).where(inArray(invoiceItems.invoiceId, invoiceIds))
      : [];

    return list.map(inv => ({
      ...inv,
      items: allItems.filter(item => item.invoiceId === inv.id)
    }));
  }

  static async findById(id: string) {
    const inv = await db.select().from(invoices).where(eq(invoices.id, id));
    if (inv.length === 0) return null;
    const items = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, id));
    return {
      ...inv[0],
      items
    };
  }

  static async createInvoice(invoiceData: any, items: any[]) {
    await db.insert(invoices).values(invoiceData);
    if (items && items.length > 0) {
      for (const item of items) {
        await db.insert(invoiceItems).values(item);
      }
    }
    return { ...invoiceData, items };
  }

  static async updateStatus(id: string, status: string) {
    await db.update(invoices).set({ status }).where(eq(invoices.id, id));
    return await this.findById(id);
  }

  static async deleteInvoice(id: string) {
    await db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, id));
    await db.delete(invoices).where(eq(invoices.id, id));
    return { success: true };
  }
}
