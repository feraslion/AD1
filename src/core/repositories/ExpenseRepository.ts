import { db } from '../database/index.ts';
import { 
  expenseCategories, 
  expenseRequests, 
  expenses,
  cashboxes, 
  bankAccounts 
} from '../database/schema.ts';
import { eq, desc, and } from 'drizzle-orm';
import { AccountingRepository } from './AccountingRepository.ts';

export interface ExpenseCategoryInput {
  id?: string;
  name: string;
  code?: string;
  description?: string;
  accountId?: string;
  budget?: number;
}

export interface ExpenseRequestInput {
  categoryId?: string;
  accountId?: string;
  title: string;
  description?: string;
  amount: number;
  taxAmount?: number;
  currency?: string;
  beneficiary?: string;
  paymentMethod?: 'cash' | 'bank' | 'payable';
  paymentAccountId?: string;
  requestedBy?: string;
  date?: string;
  receiptRef?: string;
}

export interface ExpensePaymentInput {
  paymentMethod: 'cash' | 'bank' | 'payable';
  paymentAccountId?: string;
  paidBy?: string;
}

export class ExpenseRepository {
  // ─── 1. EXPENSE CATEGORIES ───
  static async getCategories() {
    try {
      const list = await db.select().from(expenseCategories);
      if (list.length === 0) {
        // Initialize standard default categories
        const defaultCats = [
          { id: 'cat_admin', name: 'مصاريف إدارية ومكتبية', code: 'EXP-101', accountId: 'acc_expense', budget: '10000.00', description: 'أدوات مكتبية، مطبوعات، ولوازم إدارية' },
          { id: 'cat_oper', name: 'مصاريف تشغيلية', code: 'EXP-102', accountId: 'acc_expense', budget: '25000.00', description: 'مصاريف التشغيل اليومي والمستلزمات' },
          { id: 'cat_mktg', name: 'تسويق وإعلانات', code: 'EXP-103', accountId: 'acc_expense', budget: '15000.00', description: 'حملات إعلانية، تسويق رقمي، ومطبوعات ترقية' },
          { id: 'cat_maint', name: 'صيانة وإصلاحات', code: 'EXP-104', accountId: 'acc_expense', budget: '8000.00', description: 'صيانة الآلات، المعدات، والأصول' },
          { id: 'cat_util', name: 'منافع ومرافق (كهرباء وماء وثراء)', code: 'EXP-105', accountId: 'acc_expense', budget: '12000.00', description: 'فاتورة الكهرباء، المياه، والإنترنت' },
          { id: 'cat_rent', name: 'إيجارات وشغور', code: 'EXP-106', accountId: 'acc_expense', budget: '50000.00', description: 'إيجار المقرات والفروع' },
        ];

        for (const cat of defaultCats) {
          await db.insert(expenseCategories).values(cat);
        }
        return defaultCats.map(c => ({ ...c, budget: parseFloat(c.budget) }));
      }
      return list.map(c => ({
        ...c,
        budget: parseFloat(c.budget || '0')
      }));
    } catch (e) {
      console.error('Error fetching expense categories:', e);
      return [];
    }
  }

  static async upsertCategory(data: ExpenseCategoryInput) {
    const id = data.id || 'cat_' + Math.random().toString(36).substr(2, 9);
    const existing = await db.select().from(expenseCategories).where(eq(expenseCategories.id, id));

    const dbVal = {
      id,
      name: data.name,
      code: data.code || 'EXP-' + Math.floor(100 + Math.random() * 900),
      description: data.description || null,
      accountId: data.accountId || 'acc_expense',
      budget: (data.budget || 0).toString()
    };

    if (existing.length > 0) {
      await db.update(expenseCategories).set(dbVal).where(eq(expenseCategories.id, id));
    } else {
      await db.insert(expenseCategories).values(dbVal);
    }
    return { ...dbVal, budget: data.budget || 0 };
  }

  static async deleteCategory(id: string) {
    await db.delete(expenseCategories).where(eq(expenseCategories.id, id));
    return { success: true };
  }

  // ─── 2. EXPENSE REQUESTS & APPROVAL WORKFLOW ───
  static async getRequests(statusFilter?: string) {
    try {
      const list = await db.select().from(expenseRequests).orderBy(desc(expenseRequests.createdAt));
      const categories = await this.getCategories();
      const catMap = new Map(categories.map(c => [c.id, c]));

      let filtered = list;
      if (statusFilter && statusFilter !== 'all') {
        filtered = list.filter(r => r.status === statusFilter);
      }

      return filtered.map(r => ({
        ...r,
        amount: parseFloat(r.amount || '0'),
        taxAmount: parseFloat(r.taxAmount || '0'),
        totalAmount: parseFloat(r.totalAmount || '0'),
        categoryName: r.categoryId ? catMap.get(r.categoryId)?.name || 'عام' : 'عام'
      }));
    } catch (e) {
      console.error('Error fetching expense requests:', e);
      return [];
    }
  }

  static async createRequest(input: ExpenseRequestInput) {
    if (!input.amount || input.amount <= 0) {
      throw new Error('مبلغ المصروف يجب أن يكون أكبر من صفر');
    }

    const reqId = 'expreq_' + Math.random().toString(36).substr(2, 9);
    const reqNum = 'EXP-REQ-' + Math.floor(10000 + Math.random() * 90000);
    const tax = input.taxAmount || 0;
    const total = input.amount + tax;
    const dateStr = input.date || new Date().toISOString().split('T')[0];

    const dbVal = {
      id: reqId,
      requestNumber: reqNum,
      categoryId: input.categoryId || 'cat_admin',
      accountId: input.accountId || 'acc_expense',
      title: input.title,
      description: input.description || null,
      amount: input.amount.toString(),
      taxAmount: tax.toString(),
      totalAmount: total.toString(),
      currency: input.currency || 'SAR',
      beneficiary: input.beneficiary || null,
      paymentMethod: input.paymentMethod || 'cash',
      paymentAccountId: input.paymentAccountId || null,
      requestedBy: input.requestedBy || 'المستخدم الحالي',
      status: 'pending',
      receiptRef: input.receiptRef || null,
      date: dateStr,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.insert(expenseRequests).values(dbVal);
    return { ...dbVal, amount: input.amount, taxAmount: tax, totalAmount: total };
  }

  static async approveRequest(id: string, approvedBy: string) {
    const [req] = await db.select().from(expenseRequests).where(eq(expenseRequests.id, id));
    if (!req) throw new Error('طلب المصروف غير موجود');

    await db.update(expenseRequests).set({
      status: 'approved',
      approvedBy,
      approvalDate: new Date().toISOString().split('T')[0],
      updatedAt: new Date()
    }).where(eq(expenseRequests.id, id));

    return { success: true };
  }

  static async rejectRequest(id: string, rejectionReason: string) {
    const [req] = await db.select().from(expenseRequests).where(eq(expenseRequests.id, id));
    if (!req) throw new Error('طلب المصروف غير موجود');

    await db.update(expenseRequests).set({
      status: 'rejected',
      rejectionReason,
      updatedAt: new Date()
    }).where(eq(expenseRequests.id, id));

    return { success: true };
  }

  // ─── 3. PAY EXPENSE & POST JOURNAL ENTRY ───
  static async payExpense(id: string, payment: ExpensePaymentInput) {
    const [req] = await db.select().from(expenseRequests).where(eq(expenseRequests.id, id));
    if (!req) throw new Error('طلب المصروف غير موجود');

    const amount = parseFloat(req.amount || '0');
    const tax = parseFloat(req.taxAmount || '0');
    const total = parseFloat(req.totalAmount || '0');
    const method = payment.paymentMethod || req.paymentMethod || 'cash';
    const dateStr = new Date().toISOString().split('T')[0];

    // Resolve Credit Account ID (Cash / Bank / Payable)
    let creditAccId = 'acc_cash';
    if (method === 'cash') {
      if (payment.paymentAccountId) {
        const [box] = await db.select().from(cashboxes).where(eq(cashboxes.id, payment.paymentAccountId));
        if (box) {
          const curBal = parseFloat(box.currentBalance || '0');
          await db.update(cashboxes).set({ currentBalance: (curBal - total).toString() }).where(eq(cashboxes.id, payment.paymentAccountId));
        }
      }
      creditAccId = 'acc_cash';
    } else if (method === 'bank') {
      if (payment.paymentAccountId) {
        const [bank] = await db.select().from(bankAccounts).where(eq(bankAccounts.id, payment.paymentAccountId));
        if (bank) {
          const curBal = parseFloat(bank.currentBalance || '0');
          await db.update(bankAccounts).set({ currentBalance: (curBal - total).toString() }).where(eq(bankAccounts.id, payment.paymentAccountId));
          creditAccId = bank.accountId || 'acc_bank';
        } else {
          creditAccId = 'acc_bank';
        }
      } else {
        creditAccId = 'acc_bank';
      }
    } else if (method === 'payable') {
      creditAccId = 'acc_ap'; // Accounts Payable
    }

    // Debit Account: Expense GL Account (e.g., acc_expense)
    const expenseAccId = req.accountId || 'acc_expense';

    // Double Entry Journal Lines
    const entryNumber = 'JV-EXP-' + Math.floor(10000 + Math.random() * 90000);
    const descText = `سداد مصروف: ${req.title} (${req.beneficiary || 'عام'})`;

    const journalLines: any[] = [
      { accountId: expenseAccId, debit: amount, credit: 0, currency: req.currency || 'SAR', exchangeRate: 1.0, description: req.title }
    ];

    if (tax > 0) {
      journalLines.push({ accountId: 'acc_vat_input', debit: tax, credit: 0, currency: req.currency || 'SAR', exchangeRate: 1.0, description: 'ضريبة مدخلات المصروف' });
    }

    journalLines.push({ accountId: creditAccId, debit: 0, credit: total, currency: req.currency || 'SAR', exchangeRate: 1.0 });

    // Post to GL
    const journalRes = await AccountingRepository.postJournalEntry(
      entryNumber,
      descText,
      dateStr,
      journalLines
    );

    // Also record in legacy expenses table for backward compat
    const expId = 'exp_' + Math.random().toString(36).substr(2, 9);
    await db.insert(expenses).values({
      id: expId,
      description: req.title + (req.beneficiary ? ` - ${req.beneficiary}` : ''),
      amount: total.toString(),
      accountId: expenseAccId,
      date: dateStr
    });

    // Update expense request status to paid
    await db.update(expenseRequests).set({
      status: 'paid',
      journalEntryId: journalRes?.id || null,
      paymentMethod: method,
      paymentAccountId: payment.paymentAccountId || null,
      updatedAt: new Date()
    }).where(eq(expenseRequests.id, id));

    return { success: true, journalEntry: journalRes };
  }

  // ─── 4. EXPENSE REPORTS & ANALYTICS ───
  static async getExpenseReports() {
    try {
      const requests = await db.select().from(expenseRequests);
      const categories = await this.getCategories();
      const catMap = new Map(categories.map(c => [c.id, c.name]));

      let totalExpenses = 0;
      let totalPending = 0;
      let totalApproved = 0;
      let totalPaid = 0;

      const categoryTotals: { [catId: string]: { name: string; amount: number; count: number } } = {};

      categories.forEach(c => {
        categoryTotals[c.id] = { name: c.name, amount: 0, count: 0 };
      });

      for (const req of requests) {
        const amt = parseFloat(req.totalAmount || '0');
        if (req.status === 'paid') {
          totalPaid += amt;
          totalExpenses += amt;
        } else if (req.status === 'approved') {
          totalApproved += amt;
        } else if (req.status === 'pending') {
          totalPending += amt;
        }

        const catId = req.categoryId || 'cat_admin';
        if (!categoryTotals[catId]) {
          categoryTotals[catId] = { name: catMap.get(catId) || 'عام', amount: 0, count: 0 };
        }
        categoryTotals[catId].amount += amt;
        categoryTotals[catId].count += 1;
      }

      return {
        totalExpenses,
        totalPending,
        totalApproved,
        totalPaid,
        count: requests.length,
        categoryBreakdown: Object.values(categoryTotals)
      };
    } catch (e) {
      console.error('Error fetching expense reports:', e);
      return { totalExpenses: 0, totalPending: 0, totalApproved: 0, totalPaid: 0, count: 0, categoryBreakdown: [] };
    }
  }
}
