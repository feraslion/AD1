import { Router } from 'express';
import { db } from '../../../database/index.ts';
import { eq, and, or, like, sql } from 'drizzle-orm';
import { customers, suppliers } from '../../../database/schema.ts';
import { CustomerRepository, SupplierRepository, AccountingRepository } from '../../../../core/repositories/index.ts';
import { sendResponse, sendError, authorize } from './helpers.ts';

const router = Router();

// Validation helpers
function validateCustomer(c: any) {
  const errors = [];
  if (!c.name || typeof c.name !== 'string' || c.name.trim().length < 2) {
    errors.push('اسم العميل مطلوب ويجب أن يكون حرفين على الأقل');
  }
  return errors;
}

function validateSupplier(s: any) {
  const errors = [];
  if (!s.name || typeof s.name !== 'string' || s.name.trim().length < 2) {
    errors.push('اسم المورد مطلوب ويجب أن يكون حرفين على الأقل');
  }
  return errors;
}

// Customers API
router.get('/customers', async (req, res) => {
  try {
    const { page, limit, search } = req.query;
    const pageNum = page ? parseInt(page as string) : undefined;
    const limitNum = limit ? parseInt(limit as string) : undefined;

    const conditions = [];
    if (search) {
      conditions.push(
        or(
          like(customers.name, `%${search}%`),
          like(customers.phone, `%${search}%`)
        )
      );
    }

    let total = 0;
    if (pageNum || limitNum) {
      const countQuery = db.select({ count: sql<number>`count(*)` }).from(customers);
      const countResult = conditions.length > 0
        ? await countQuery.where(and(...conditions))
        : await countQuery;
      total = Number(countResult[0]?.count || 0);
    }

    let query = db.select().from(customers);
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    if (pageNum && limitNum) {
      const p = pageNum || 1;
      const l = limitNum || 10;
      query = query.limit(l).offset((p - 1) * l) as any;
    }

    const allCustomers = await query;
    const mapped = allCustomers.map(c => ({
      ...c,
      balance: parseFloat(c.balance || '0'),
      creditLimit: parseFloat(c.creditLimit || '5000'),
      openingBalance: parseFloat(c.openingBalance || '0')
    }));

    if (pageNum || limitNum) {
      const p = pageNum || 1;
      const l = limitNum || 10;
      sendResponse(res, mapped, 200, { page: p, limit: l, total });
    } else {
      sendResponse(res, mapped);
    }
  } catch (error) {
    sendError(res, 'فشل جلب العملاء', error);
  }
});

router.get('/customers/reports/aging', authorize(['manager', 'accountant']), async (req, res) => {
  try {
    const agingReport = await CustomerRepository.getDebtAging();
    sendResponse(res, agingReport);
  } catch (error) {
    sendError(res, 'فشل جلب تقرير أعمار الديون', error);
  }
});

router.get('/customers/:id/ledger', async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;
    const ledger = await CustomerRepository.getCustomerLedger(id, startDate as string, endDate as string);
    sendResponse(res, ledger);
  } catch (error) {
    sendError(res, 'فشل جلب كشف حساب العميل', error);
  }
});

router.post('/customers', authorize(['manager', 'cashier', 'accountant']), async (req, res) => {
  try {
    const c = req.body;
    const errors = validateCustomer(c);
    if (errors.length > 0) {
      return sendError(res, 'خطأ في التحقق من البيانات', errors, 400);
    }

    const id = c.id || 'cust_' + Math.random().toString(36).substr(2, 9);
    const dbValue = {
      id,
      name: c.name,
      phone: c.phone || '',
      email: c.email || '',
      balance: (c.balance ?? 0).toString(),
      creditLimit: (c.creditLimit ?? 5000).toString(),
      taxNumber: c.taxNumber || '',
      crNumber: c.crNumber || '',
      address: c.address || '',
      type: c.type || 'retail',
      status: c.status || 'active',
      notes: c.notes || '',
      openingBalance: (c.openingBalance ?? 0).toString()
    };

    const saved = await CustomerRepository.upsert(dbValue);
    sendResponse(res, saved);
  } catch (error) {
    sendError(res, 'فشل حفظ العميل', error);
  }
});

router.delete('/customers/:id', authorize(['manager']), async (req, res) => {
  try {
    const result = await CustomerRepository.delete(req.params.id);
    sendResponse(res, result);
  } catch (error) {
    sendError(res, 'فشل حذف العميل', error);
  }
});

// Suppliers API
router.get('/suppliers', async (req, res) => {
  try {
    const allSuppliers = await SupplierRepository.findAll(req.query.search as string);
    const mapped = allSuppliers.map(s => ({
      ...s,
      balance: parseFloat(s.balance || '0')
    }));
    sendResponse(res, mapped);
  } catch (error) {
    sendError(res, 'فشل جلب الموردين', error);
  }
});

router.post('/suppliers', authorize(['manager', 'inventory', 'accountant']), async (req, res) => {
  try {
    const s = req.body;
    const errors = validateSupplier(s);
    if (errors.length > 0) {
      return sendError(res, 'خطأ في التحقق من البيانات', errors, 400);
    }

    const id = s.id || 'supp_' + Math.random().toString(36).substr(2, 9);
    const dbValue = {
      id,
      name: s.name,
      phone: s.phone || '',
      email: s.email || '',
      balance: (s.balance || 0).toString()
    };

    const saved = await SupplierRepository.upsert(dbValue);
    sendResponse(res, saved);
  } catch (error) {
    sendError(res, 'فشل حفظ المورد', error);
  }
});

router.delete('/suppliers/:id', authorize(['manager']), async (req, res) => {
  try {
    const result = await SupplierRepository.delete(req.params.id);
    sendResponse(res, result);
  } catch (error) {
    sendError(res, 'فشل حذف المورد', error);
  }
});

router.get('/suppliers/:id/ledger', async (req, res) => {
  try {
    const { id } = req.params;
    const supplier = await SupplierRepository.findById(id);
    if (!supplier) {
      return sendError(res, 'المورد غير موجود', null, 404);
    }

    const supplierPurchases = await SupplierRepository.getSupplierPurchases(id);

    const allEntries = await AccountingRepository.getJournalEntries();
    const supplierEntries = allEntries.filter(e =>
      e.description?.includes(supplier.name) ||
      e.entryNumber?.includes(`PAY-`) ||
      supplierPurchases.some(p => p.purchaseNumber && e.entryNumber?.includes(String(p.purchaseNumber)))
    );

    let runningBalance = 0;
    const ledgerLines = [];

    for (const pur of supplierPurchases) {
      const gTotal = parseFloat(pur.grandTotal || '0');
      if (pur.paymentMethod === 'credit') {
        runningBalance += gTotal;
        ledgerLines.push({
          id: `pur-${pur.id}`,
          date: pur.date,
          type: 'purchase_invoice',
          typeLabel: 'فاتورة مشتريات آجلة',
          reference: pur.purchaseNumber,
          invoiceNumber: pur.supplierInvoiceNumber || pur.purchaseNumber,
          debit: 0,
          credit: gTotal,
          runningBalance,
          notes: pur.notes || `فاتورة مشتريات رقم ${pur.purchaseNumber}`
        });
      }
    }

    // Process payments
    for (const entry of supplierEntries) {
      if (entry.entryNumber.startsWith('JE-PAY-') && entry.description.includes(supplier.name)) {
        const debitDetail = entry.details.find((d: any) => Number(d.debit || 0) > 0);
        const amount = debitDetail ? Number(debitDetail.debit || 0) : 0;
        if (amount > 0) {
          runningBalance -= amount;
          ledgerLines.push({
            id: `pay-${entry.id}`,
            date: entry.date,
            type: 'supplier_payment',
            typeLabel: 'سند صرف مورد',
            reference: entry.entryNumber.replace('JE-', ''),
            invoiceNumber: '-',
            debit: amount,
            credit: 0,
            runningBalance,
            notes: entry.description
          });
        }
      }
    }

    ledgerLines.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    sendResponse(res, {
      supplier: {
        ...supplier,
        balance: parseFloat(supplier.balance || '0')
      },
      currentBalance: parseFloat(supplier.balance || '0'),
      ledgerLines
    });
  } catch (error) {
    sendError(res, 'فشل جلب كشف حساب المورد', error);
  }
});

export default router;
