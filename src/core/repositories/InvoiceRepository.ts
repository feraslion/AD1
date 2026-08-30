import { db } from '../database/index.ts';
import { invoices, invoiceItems, customers, products } from '../database/schema.ts';
import { eq, desc, inArray, like, or } from 'drizzle-orm';
import { CustomerRepository } from './CustomerRepository.ts';
import { ProductRepository } from './ProductRepository.ts';

export class InvoiceRepository {
  static async findAll(params?: { search?: string; customerId?: string; status?: string }) {
    let query = db.select().from(invoices).orderBy(desc(invoices.createdAt));
    let list = await query;

    if (params?.search) {
      const term = params.search.toLowerCase();
      list = list.filter(inv => 
        inv.invoiceNumber.toLowerCase().includes(term) ||
        inv.customerName?.toLowerCase().includes(term)
      );
    }

    if (params?.customerId) {
      list = list.filter(inv => inv.customerId === params.customerId);
    }

    if (params?.status && params.status !== 'all') {
      list = list.filter(inv => inv.status === params.status);
    }

    const invoiceIds = list.map(i => i.id);
    const allItems = invoiceIds.length > 0
      ? await db.select().from(invoiceItems).where(inArray(invoiceItems.invoiceId, invoiceIds))
      : [];

    // Performance Optimization (Bolt): Pre-group invoice items by invoiceId into an in-memory Map lookup.
    // This reduces parent-child record assembly complexity from O(N * M) nested array filtering to O(N + M).
    const itemsByInvoiceId = new Map<string, typeof allItems>();
    for (const item of allItems) {
      if (!item.invoiceId) continue;
      const existingItems = itemsByInvoiceId.get(item.invoiceId) || [];
      existingItems.push(item);
      itemsByInvoiceId.set(item.invoiceId, existingItems);
    }

    return list.map(inv => ({
      ...inv,
      items: itemsByInvoiceId.get(inv.id) || []
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
