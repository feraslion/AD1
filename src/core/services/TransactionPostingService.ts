import { db } from '../database/index.ts';
import { postingRules } from '../database/schema.ts';
import { eq } from 'drizzle-orm';
import { JournalEngine } from './JournalEngine.ts';

export class TransactionPostingService {
  /**
   * Helper to look up mapped account for a posting rule code or fallback
   */
  private static async getAccountForRule(ruleCode: string, defaultAccountId: string): Promise<string> {
    try {
      const [rule] = await db.select().from(postingRules).where(eq(postingRules.ruleCode, ruleCode));
      return rule ? rule.accountId : defaultAccountId;
    } catch {
      return defaultAccountId;
    }
  }

  /**
   * Post a Cash or Credit Sales Invoice to the General Ledger
   */
  static async recordSalesInvoice(invoice: {
    invoiceNumber: string;
    date: string;
    totalAmount: number;
    taxAmount: number;
    subtotal: number;
    paymentMethod: 'cash' | 'bank' | 'credit';
    customerName?: string;
    cogsAmount?: number;
    currency?: string;
    exchangeRate?: number;
  }) {
    const currency = invoice.currency || 'SAR';
    const exchangeRate = invoice.exchangeRate || 1.0;

    // Resolve accounts from posting rules
    let debitAccount = '';
    if (invoice.paymentMethod === 'cash') {
      debitAccount = await this.getAccountForRule('sales_cash_debit', 'acc_cash');
    } else if (invoice.paymentMethod === 'bank') {
      debitAccount = await this.getAccountForRule('sales_bank_debit', 'acc_bank');
    } else {
      debitAccount = await this.getAccountForRule('sales_credit_debit', 'acc_receivable');
    }

    const salesRevenueAccount = await this.getAccountForRule('sales_revenue_credit', 'acc_sales');
    const salesTaxAccount = await this.getAccountForRule('sales_tax_credit', 'acc_tax');

    const lines = [];

    // 1. Debit Cash/Bank/AR for Total Amount
    lines.push({
      accountId: debitAccount,
      debit: invoice.totalAmount,
      credit: 0,
      currency,
      exchangeRate,
      description: `مبيعات فاتورة رقم (${invoice.invoiceNumber}) - ${invoice.customerName || 'عميل نقدي'}`
    });

    // 2. Credit Revenue for Subtotal
    lines.push({
      accountId: salesRevenueAccount,
      debit: 0,
      credit: invoice.subtotal,
      currency,
      exchangeRate,
      description: `إيراد مبيعات فاتورة رقم (${invoice.invoiceNumber})`
    });

    // 3. Credit Tax for VAT amount if tax > 0
    if (invoice.taxAmount > 0) {
      lines.push({
        accountId: salesTaxAccount,
        debit: 0,
        credit: invoice.taxAmount,
        currency,
        exchangeRate,
        description: `ضريبة قيمة مضافة على فاتورة (${invoice.invoiceNumber})`
      });
    }

    // 4. COGS & Inventory movement entry if cogsAmount provided
    if (invoice.cogsAmount && invoice.cogsAmount > 0) {
      const cogsAccount = await this.getAccountForRule('sales_cogs_debit', 'acc_cogs');
      const inventoryAccount = await this.getAccountForRule('sales_inventory_credit', 'acc_inventory');

      lines.push({
        accountId: cogsAccount,
        debit: invoice.cogsAmount,
        credit: 0,
        currency,
        exchangeRate,
        description: `تكلفة البضاعة المباعة لفاتورة (${invoice.invoiceNumber})`
      });

      lines.push({
        accountId: inventoryAccount,
        debit: 0,
        credit: invoice.cogsAmount,
        currency,
        exchangeRate,
        description: `تخفيض المخزون للمبيعات لفاتورة (${invoice.invoiceNumber})`
      });
    }

    return await JournalEngine.postJournalEntry(
      `JE-INV-${invoice.invoiceNumber}`,
      `قيد مبيعات فاتورة رقم (${invoice.invoiceNumber}) - ${invoice.customerName || 'عميل'}`,
      invoice.date,
      lines,
      {
        reference: `INV-${invoice.invoiceNumber}`,
        currency,
        exchangeRate,
        status: 'posted'
      }
    );
  }

  /**
   * Record a Purchase Invoice in the General Ledger
   */
  static async recordPurchaseInvoice(purchase: {
    purchaseNumber: string;
    invoiceNumber?: string;
    date: string;
    subtotal: number;
    taxAmount: number;
    totalAmount: number;
    paymentMethod: 'cash' | 'bank' | 'credit';
    supplierName?: string;
    currency?: string;
    exchangeRate?: number;
  }) {
    const currency = purchase.currency || 'SAR';
    const exchangeRate = purchase.exchangeRate || 1.0;

    const inventoryAccount = await this.getAccountForRule('purchase_inventory_debit', 'acc_inventory');
    const inputTaxAccount = await this.getAccountForRule('purchase_tax_debit', 'acc_tax');

    let creditAccount = '';
    if (purchase.paymentMethod === 'cash') {
      creditAccount = await this.getAccountForRule('purchase_cash_credit', 'acc_cash');
    } else if (purchase.paymentMethod === 'bank') {
      creditAccount = await this.getAccountForRule('purchase_bank_credit', 'acc_bank');
    } else {
      creditAccount = await this.getAccountForRule('purchase_credit_credit', 'acc_payable');
    }

    const lines = [];

    // Debit Inventory for Subtotal
    lines.push({
      accountId: inventoryAccount,
      debit: purchase.subtotal,
      credit: 0,
      currency,
      exchangeRate,
      description: `إثبات مشتريات بضاعة - فاتورة مورد (${purchase.invoiceNumber || purchase.purchaseNumber})`
    });

    // Debit Tax if VAT > 0
    if (purchase.taxAmount > 0) {
      lines.push({
        accountId: inputTaxAccount,
        debit: purchase.taxAmount,
        credit: 0,
        currency,
        exchangeRate,
        description: `ضريبة مدخلات مشتريات فاتورة (${purchase.purchaseNumber})`
      });
    }

    // Credit Cash / Bank / AP for Total
    lines.push({
      accountId: creditAccount,
      debit: 0,
      credit: purchase.totalAmount,
      currency,
      exchangeRate,
      description: `مستحقات مشتريات للمورد (${purchase.supplierName || 'مورد'})`
    });

    return await JournalEngine.postJournalEntry(
      `JE-PUR-${purchase.purchaseNumber}`,
      `قيد مشتريات فاتورة رقم (${purchase.purchaseNumber}) - ${purchase.supplierName || 'مورد'}`,
      purchase.date,
      lines,
      {
        reference: `PUR-${purchase.purchaseNumber}`,
        currency,
        exchangeRate,
        status: 'posted'
      }
    );
  }

  /**
   * Record Customer Payment Receipt
   */
  static async recordCustomerReceipt(payment: {
    receiptNumber: string;
    date: string;
    amount: number;
    method: 'cash' | 'bank';
    customerName: string;
    currency?: string;
    exchangeRate?: number;
  }) {
    const currency = payment.currency || 'SAR';
    const exchangeRate = payment.exchangeRate || 1.0;

    const debitAccount = payment.method === 'cash' 
      ? await this.getAccountForRule('payment_customer_debit_cash', 'acc_cash')
      : await this.getAccountForRule('payment_customer_debit_bank', 'acc_bank');

    const arAccount = await this.getAccountForRule('payment_customer_credit', 'acc_receivable');

    const lines = [
      {
        accountId: debitAccount,
        debit: payment.amount,
        credit: 0,
        currency,
        exchangeRate,
        description: `سند قبض نقدي/بنكي من العميل: ${payment.customerName}`
      },
      {
        accountId: arAccount,
        debit: 0,
        credit: payment.amount,
        currency,
        exchangeRate,
        description: `تسوية حساب العميل: ${payment.customerName}`
      }
    ];

    return await JournalEngine.postJournalEntry(
      `JE-RCPT-${payment.receiptNumber}`,
      `سند قبض عميل: ${payment.customerName} - رقم ${payment.receiptNumber}`,
      payment.date,
      lines,
      {
        reference: `RCPT-${payment.receiptNumber}`,
        currency,
        exchangeRate,
        status: 'posted'
      }
    );
  }

  /**
   * Record Supplier Payment Voucher
   */
  static async recordSupplierPayment(payment: {
    paymentNumber: string;
    date: string;
    amount: number;
    method: 'cash' | 'bank';
    supplierName: string;
    currency?: string;
    exchangeRate?: number;
  }) {
    const currency = payment.currency || 'SAR';
    const exchangeRate = payment.exchangeRate || 1.0;

    const apAccount = await this.getAccountForRule('payment_supplier_debit', 'acc_payable');

    const creditAccount = payment.method === 'cash'
      ? await this.getAccountForRule('payment_supplier_credit_cash', 'acc_cash')
      : await this.getAccountForRule('payment_supplier_credit_bank', 'acc_bank');

    const lines = [
      {
        accountId: apAccount,
        debit: payment.amount,
        credit: 0,
        currency,
        exchangeRate,
        description: `سند صرف وتسديد للمورد: ${payment.supplierName}`
      },
      {
        accountId: creditAccount,
        debit: 0,
        credit: payment.amount,
        currency,
        exchangeRate,
        description: `سداد من ${payment.method === 'cash' ? 'الصندوق' : 'البنك'}`
      }
    ];

    return await JournalEngine.postJournalEntry(
      `JE-PAY-${payment.paymentNumber}`,
      `سند صرف للمورد: ${payment.supplierName} - رقم ${payment.paymentNumber}`,
      payment.date,
      lines,
      {
        reference: `PAY-${payment.paymentNumber}`,
        currency,
        exchangeRate,
        status: 'posted'
      }
    );
  }
}
