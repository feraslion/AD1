import { db } from '../database/index.ts';
import { purchases, purchaseItems, suppliers, products } from '../database/schema.ts';
import { eq, desc } from 'drizzle-orm';

export class PurchaseRepository {
  static async findAllPurchases() {
    const purchaseList = await db.select().from(purchases).orderBy(desc(purchases.createdAt));
    const itemsList = await db.select().from(purchaseItems);
    const supplierList = await db.select().from(suppliers);
    const productList = await db.select().from(products);

    const suppliersMap = new Map(supplierList.map(s => [s.id, s]));
    const productsMap = new Map(productList.map(p => [p.id, p]));

    return purchaseList.map(pur => {
      const pItems = itemsList
        .filter(item => item.purchaseId === pur.id)
        .map(i => ({
          ...i,
          productName: productsMap.get(i.productId)?.name || i.productId,
          purchasePrice: parseFloat(i.purchasePrice || '0'),
          quantity: parseFloat(i.quantity || '0'),
          total: parseFloat(i.total || '0'),
          taxAmount: parseFloat(i.taxAmount || '0')
        }));

      const supp = pur.supplierId ? suppliersMap.get(pur.supplierId) : null;

      return {
        ...pur,
        subtotal: parseFloat(pur.subtotal || '0'),
        taxAmount: parseFloat(pur.taxAmount || '0'),
        grandTotal: parseFloat(pur.grandTotal || '0'),
        supplierName: supp ? supp.name : 'غير محدد',
        supplierPhone: supp ? supp.phone : '',
        items: pItems
      };
    });
  }

  static async findById(id: string) {
    const [pur] = await db.select().from(purchases).where(eq(purchases.id, id));
    if (!pur) return null;
    const items = await db.select().from(purchaseItems).where(eq(purchaseItems.purchaseId, id));
    return { ...pur, items };
  }

  static async createPurchaseOrder(purchaseData: any, items: any[]) {
    await db.insert(purchases).values(purchaseData);
    for (const item of items) {
      await db.insert(purchaseItems).values(item);
    }
    return { ...purchaseData, items };
  }

  static async updatePurchaseStatus(id: string, status: string, updates: Partial<typeof purchases.$inferInsert> = {}) {
    await db.update(purchases)
      .set({ status, updatedAt: new Date(), ...updates })
      .where(eq(purchases.id, id));
  }
}
