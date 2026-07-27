import { db } from '../database/index.ts';
import { 
  products, categories, customers, suppliers, warehouses, 
  invoices, invoiceItems, purchases, purchaseItems, accounts, journalEntries 
} from '../database/schema.ts';

export class BackupRepository {
  static async exportFullBackup(): Promise<{
    version: string;
    exportedAt: string;
    data: {
      products: any[];
      categories: any[];
      customers: any[];
      suppliers: any[];
      warehouses: any[];
      invoices: any[];
      invoiceItems: any[];
      purchases: any[];
      purchaseItems: any[];
      accounts: any[];
    };
  }> {
    const [
      prods, cats, custs, supps, whs, invs, invItems, purs, purItems, accs
    ] = await Promise.all([
      db.select().from(products).catch(() => []),
      db.select().from(categories).catch(() => []),
      db.select().from(customers).catch(() => []),
      db.select().from(suppliers).catch(() => []),
      db.select().from(warehouses).catch(() => []),
      db.select().from(invoices).catch(() => []),
      db.select().from(invoiceItems).catch(() => []),
      db.select().from(purchases).catch(() => []),
      db.select().from(purchaseItems).catch(() => []),
      db.select().from(accounts).catch(() => [])
    ]);

    return {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      data: {
        products: prods,
        categories: cats,
        customers: custs,
        suppliers: supps,
        warehouses: whs,
        invoices: invs,
        invoiceItems: invItems,
        purchases: purs,
        purchaseItems: purItems,
        accounts: accs
      }
    };
  }

  static async restoreFullBackup(backupData: any): Promise<{ success: boolean; restoredCounts: Record<string, number> }> {
    if (!backupData || !backupData.data) {
      throw new Error('صيغة النسخة الاحتياطية غير صالحة');
    }

    const { products: prods = [], customers: custs = [], suppliers: supps = [] } = backupData.data;

    let restoredProducts = 0;
    let restoredCustomers = 0;
    let restoredSuppliers = 0;

    for (const p of prods) {
      try {
        await db.insert(products).values(p).onConflictDoNothing();
        restoredProducts++;
      } catch (_) {}
    }

    for (const c of custs) {
      try {
        await db.insert(customers).values(c).onConflictDoNothing();
        restoredCustomers++;
      } catch (_) {}
    }

    for (const s of supps) {
      try {
        await db.insert(suppliers).values(s).onConflictDoNothing();
        restoredSuppliers++;
      } catch (_) {}
    }

    return {
      success: true,
      restoredCounts: {
        products: restoredProducts,
        customers: restoredCustomers,
        suppliers: restoredSuppliers
      }
    };
  }
}
