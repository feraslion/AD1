import { db } from '../database/index.ts';
import { invoices, invoiceItems } from '../database/schema.ts';
import { eq, desc } from 'drizzle-orm';

export class SalesRepository {
  static async findAllInvoices() {
    const invoiceList = await db.select().from(invoices).orderBy(desc(invoices.createdAt));
    const itemsList = await db.select().from(invoiceItems);

    return invoiceList.map(inv => {
      const relatedItems = itemsList.filter(item => item.invoiceId === inv.id);
      return {
        ...inv,
        items: relatedItems
      };
    });
  }

  static async findInvoiceById(id: string) {
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
    for (const item of items) {
      await db.insert(invoiceItems).values(item);
    }
    return { ...invoiceData, items };
  }

  static async deleteInvoice(id: string) {
    await db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, id));
    await db.delete(invoices).where(eq(invoices.id, id));
    return { success: true };
  }
}
