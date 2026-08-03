import { Router, Response } from 'express';
import { db } from '../../../database/index.ts';
import { 
  products, 
  customers, 
  suppliers, 
  invoices, 
  journalEntries 
} from '../../../database/schema.ts';
import { like, or, eq, desc, and } from 'drizzle-orm';
import { authenticate, AuthenticatedRequest } from '../../middleware/auth.ts';

const router = Router();

// Arabic text normalization helper
export function normalizeArabicText(str: string): string {
  if (!str) return '';
  return str
    .trim()
    .toLowerCase()
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\u064B-\u0652]/g, '');
}

router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const rawQuery = (req.query.q as string || req.query.query as string || '').trim();
    if (!rawQuery) {
      return res.json({
        success: true,
        data: {
          products: [],
          customers: [],
          invoices: [],
          suppliers: [],
          journalEntries: []
        }
      });
    }

    const q = rawQuery.toLowerCase();
    const normalizedQ = normalizeArabicText(rawQuery);
    const pattern = `%${q}%`;
    const normPattern = `%${normalizedQ}%`;

    const userPerms = req.user?.permissions || [];
    const isManager = !req.user || req.user.role === 'manager' || req.user.role === 'admin';

    // Permissions check per module
    const canViewProducts = isManager || userPerms.some(p => ['inventory.view', 'manage_inventory', 'pos_access', 'sales.view'].includes(p));
    const canViewCustomers = isManager || userPerms.some(p => ['sales.view', 'pos_access', 'view_invoices', 'customers.view'].includes(p));
    const canViewInvoices = isManager || userPerms.some(p => ['sales.view', 'view_invoices', 'accounting.view'].includes(p));
    const canViewSuppliers = isManager || userPerms.some(p => ['purchases.view', 'view_purchases', 'suppliers.view'].includes(p));
    const canViewAccounting = isManager || userPerms.some(p => ['accounting.view', 'view_accounting'].includes(p));

    const [
      matchingProducts,
      matchingCustomers,
      matchingInvoices,
      matchingSuppliers,
      matchingJournals
    ] = await Promise.all([
      canViewProducts
        ? db
            .select()
            .from(products)
            .where(
              or(
                like(products.name, pattern),
                like(products.barcode, pattern),
                like(products.category, pattern)
              )
            )
            .limit(8)
        : Promise.resolve([]),

      canViewCustomers
        ? db
            .select()
            .from(customers)
            .where(
              or(
                like(customers.name, pattern),
                like(customers.phone, pattern),
                like(customers.email, pattern),
                like(customers.taxNumber, pattern)
              )
            )
            .limit(8)
        : Promise.resolve([]),

      canViewInvoices
        ? db
            .select()
            .from(invoices)
            .where(
              or(
                like(invoices.invoiceNumber, pattern),
                like(invoices.customerName, pattern),
                like(invoices.cashierName, pattern)
              )
            )
            .orderBy(desc(invoices.createdAt))
            .limit(8)
        : Promise.resolve([]),

      canViewSuppliers
        ? db
            .select()
            .from(suppliers)
            .where(
              or(
                like(suppliers.name, pattern),
                like(suppliers.phone, pattern),
                like(suppliers.email, pattern)
              )
            )
            .limit(8)
        : Promise.resolve([]),

      canViewAccounting
        ? db
            .select()
            .from(journalEntries)
            .where(
              or(
                like(journalEntries.entryNumber, pattern),
                like(journalEntries.description, pattern)
              )
            )
            .orderBy(desc(journalEntries.createdAt))
            .limit(8)
        : Promise.resolve([])
    ]);

    return res.json({
      success: true,
      data: {
        products: matchingProducts,
        customers: matchingCustomers,
        invoices: matchingInvoices,
        suppliers: matchingSuppliers,
        journalEntries: matchingJournals
      }
    });
  } catch (error: any) {
    console.error('[GlobalSearch Error]:', error);
    return res.status(500).json({
      success: false,
      error: 'حدث خطأ أثناء إجراء البحث الشامل',
      details: error?.message || error
    });
  }
});

export default router;
