import { Router } from 'express';
import { db } from '../../../database/index.ts';
import { eq, and } from 'drizzle-orm';
import { payments } from '../../../database/schema.ts';
import { CustomerRepository, SupplierRepository } from '../../../../core/repositories/index.ts';
import { sendResponse, sendError, authorize, getAccountByRule, postJournalEntry } from './helpers.ts';

const router = Router();

// Payments API
router.get('/payments/customer', authorize(['manager', 'cashier', 'accountant']), async (req, res) => {
  try {
    const { customerId } = req.query;
    let query = db.select().from(payments).where(eq(payments.type, 'receipt'));
    if (customerId) {
      query = db.select().from(payments).where(
        and(
          eq(payments.type, 'receipt'),
          eq(payments.partyId, customerId as string)
        )
      ) as any;
    }
    const list = await query;
    const mapped = list.map(p => ({
      id: p.id,
      receiptNumber: p.paymentNumber,
      customerId: p.partyId,
      amount: parseFloat(p.amount || '0'),
      paymentMethod: p.method,
      date: p.date,
      reference: p.reference || '',
      notes: p.notes || '',
      createdAt: p.createdAt
    }));
    sendResponse(res, mapped);
  } catch (error) {
    sendError(res, 'فشل جلب سندات القبض', error);
  }
});

router.post('/payments/customer', authorize(['manager', 'cashier', 'accountant']), async (req, res) => {
  try {
    const { customerId, amount, paymentMethod, date, receiptNumber, reference, notes, invoiceId } = req.body;
    if (!customerId || !amount || parseFloat(amount) <= 0) {
      return sendError(res, 'بيانات سند القبض غير كاملة أو غير صالحة', null, 400);
    }

    const customer = await CustomerRepository.findById(customerId);
    if (!customer) throw new Error('العميل غير موجود');

    const num = receiptNumber || `RCPT-${Date.now().toString().slice(-6)}`;
    const pmtDate = date || new Date().toISOString().split('T')[0];
    const pmtMethod = paymentMethod || 'cash';

    await CustomerRepository.adjustBalance(customerId, -amount);

    // Record in payments table
    await db.insert(payments).values({
      id: 'pay_' + Math.random().toString(36).substr(2, 9),
      companyId: customer.companyId || 'company_default',
      branchId: customer.branchId || 'branch_default',
      paymentNumber: num,
      date: pmtDate,
      type: 'receipt',
      partyId: customerId,
      partyType: 'customer',
      amount: amount.toString(),
      method: pmtMethod,
      reference: reference || invoiceId || '',
      notes: notes || `سند قبض من العميل: ${customer.name}`
    });

    // Accounting Entry
    const cashAcc = await getAccountByRule('payment_customer_debit_cash', 'acc_cash');
    const bankAcc = await getAccountByRule('payment_customer_debit_bank', 'acc_bank');
    const custCreditAcc = await getAccountByRule('payment_customer_credit', 'acc_receivable');

    const accountingLines = [];
    if (pmtMethod === 'cash') {
      accountingLines.push({ accountId: cashAcc, debit: amount, credit: 0 });
    } else {
      accountingLines.push({ accountId: bankAcc, debit: amount, credit: 0 });
    }
    accountingLines.push({ accountId: custCreditAcc, debit: 0, credit: amount });

    await postJournalEntry(
      `JE-RCPT-${num}`,
      `سند قبض عميل: ${customer.name} - ${num}`,
      pmtDate,
      accountingLines
    );

    sendResponse(res, { success: true, receiptNumber: num, customerName: customer.name });
  } catch (error) {
    sendError(res, 'فشل تسجيل سند القبض', error);
  }
});

router.post('/payments/supplier', authorize(['manager', 'inventory', 'accountant']), async (req, res) => {
  try {
    const { supplierId, amount, paymentMethod, date, paymentNumber, currency, exchangeRate } = req.body;
    if (!supplierId || !amount || parseFloat(amount) <= 0) {
      return sendError(res, 'بيانات سند الصرف غير كاملة أو غير صالحة', null, 400);
    }

    const supplier = await SupplierRepository.findById(supplierId);
    if (!supplier) throw new Error('المورد غير موجود');

    await SupplierRepository.adjustBalance(supplierId, -amount);

    const payDebAcc = await getAccountByRule('payment_supplier_debit', 'acc_payable');
    const cashAcc = await getAccountByRule('payment_supplier_credit_cash', 'acc_cash');
    const bankAcc = await getAccountByRule('payment_supplier_credit_bank', 'acc_bank');

    const accountingLines = [];
    accountingLines.push({ accountId: payDebAcc, debit: amount, credit: 0 });
    if (paymentMethod === 'cash') {
      accountingLines.push({ accountId: cashAcc, debit: 0, credit: amount });
    } else {
      accountingLines.push({ accountId: bankAcc, debit: 0, credit: amount });
    }

    await postJournalEntry(
      `JE-PAY-${paymentNumber}`,
      `سند صرف مورد: ${supplier.name}`,
      date,
      accountingLines,
      {
        currency: currency || 'SAR',
        exchangeRate: exchangeRate ? parseFloat(exchangeRate) : 1.0
      }
    );

    sendResponse(res, { success: true });
  } catch (error) {
    sendError(res, 'فشل تسجيل سند الصرف', error);
  }
});

export default router;
