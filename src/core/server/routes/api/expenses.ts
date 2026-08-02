import { Router } from 'express';
import { db } from '../../../database/index.ts';
import { eq, desc, and, sql } from 'drizzle-orm';
import { expenses } from '../../../database/schema.ts';
import { ExpenseRepository } from '../../../../core/repositories/index.ts';
import { sendResponse, sendError, authorize, getAccountByRule, postJournalEntry } from './helpers.ts';

const router = Router();

// Expenses API
router.get('/expenses', authorize(['manager', 'accountant', 'inventory']), async (req, res) => {
  try {
    const { date, page, limit } = req.query;
    const conditions = [];
    if (date) {
      conditions.push(eq(expenses.date, date as string));
    }
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    let total = 0;
    if (page || limit) {
      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(expenses)
        .where(whereClause);
      total = Number(countResult[0]?.count || 0);
    }

    let query = db.select().from(expenses).orderBy(desc(expenses.createdAt));
    if (whereClause) {
      query = query.where(whereClause) as any;
    }

    if (page && limit) {
      const p = parseInt(page as string) || 1;
      const l = parseInt(limit as string) || 10;
      query = query.limit(l).offset((p - 1) * l) as any;
    }

    const allExpenses = await query;
    const mapped = allExpenses.map(e => ({
      ...e,
      amount: parseFloat(e.amount)
    }));

    if (page || limit) {
      const p = parseInt(page as string) || 1;
      const l = parseInt(limit as string) || 10;
      sendResponse(res, mapped, 200, { page: p, limit: l, total });
    } else {
      sendResponse(res, mapped);
    }
  } catch (error) {
    sendError(res, 'فشل جلب المصاريف', error);
  }
});

router.post('/expenses', authorize(['manager', 'accountant']), async (req, res) => {
  try {
    const exp = req.body;
    if (!exp.description || !exp.amount || parseFloat(exp.amount) <= 0) {
      return sendError(res, 'بيانات المصروف غير صالحة', null, 400);
    }

    const id = 'exp_' + Math.random().toString(36).substr(2, 9);

    const expDeb = await getAccountByRule('expense_debit', 'acc_expense');
    const expCred = await getAccountByRule('expense_credit', 'acc_cash');

    await db.insert(expenses).values({
      id,
      description: exp.description,
      amount: exp.amount.toString(),
      accountId: expDeb,
      date: exp.date
    });

    await postJournalEntry(
      `JE-EXP-${id}`,
      `مصروف: ${exp.description}`,
      exp.date,
      [
        { accountId: expDeb, debit: parseFloat(exp.amount), credit: 0 },
        { accountId: expCred, debit: 0, credit: parseFloat(exp.amount) }
      ]
    );

    sendResponse(res, { success: true, id });
  } catch (error) {
    sendError(res, 'فشل تسجيل المصروف', error);
  }
});

router.delete('/expenses/:id', authorize(['manager', 'accountant']), async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(expenses).where(eq(expenses.id, id));
    sendResponse(res, { success: true });
  } catch (error) {
    sendError(res, 'فشل حذف المصروف', error);
  }
});

// Expense Management API (إدارة المصروفات والتصنيفات)
router.get('/expenses/categories', async (req, res) => {
  try {
    const list = await ExpenseRepository.getCategories();
    sendResponse(res, list);
  } catch (error) {
    sendError(res, 'فشل جلب تصنيفات المصروفات', error);
  }
});

router.post('/expenses/categories', authorize(['manager', 'accountant']), async (req, res) => {
  try {
    const cat = await ExpenseRepository.upsertCategory(req.body);
    sendResponse(res, cat);
  } catch (error) {
    sendError(res, 'فشل حفظ تصنيف المصروفات', error);
  }
});

router.delete('/expenses/categories/:id', authorize(['manager']), async (req, res) => {
  try {
    await ExpenseRepository.deleteCategory(req.params.id);
    sendResponse(res, { success: true });
  } catch (error) {
    sendError(res, 'فشل حذف تصنيف المصروفات', error);
  }
});

router.get('/expenses/requests', async (req, res) => {
  try {
    const statusFilter = req.query.status as string;
    const list = await ExpenseRepository.getRequests(statusFilter);
    sendResponse(res, list);
  } catch (error) {
    sendError(res, 'فشل جلب طلبات المصروفات', error);
  }
});

router.post('/expenses/requests', async (req, res) => {
  try {
    const item = await ExpenseRepository.createRequest(req.body);
    sendResponse(res, item);
  } catch (error: any) {
    sendError(res, error.message || 'فشل إنشاء طلب المصروف', error);
  }
});

router.post('/expenses/requests/:id/approve', authorize(['manager', 'accountant']), async (req, res) => {
  try {
    const approvedBy = req.body.approvedBy || (req as any).user?.name || 'مدير النظام';
    const result = await ExpenseRepository.approveRequest(req.params.id, approvedBy);
    sendResponse(res, result);
  } catch (error: any) {
    sendError(res, error.message || 'فشل الموافقة على طلب المصروف', error);
  }
});

router.post('/expenses/requests/:id/reject', authorize(['manager', 'accountant']), async (req, res) => {
  try {
    const reason = req.body.reason || 'تم رفض الطلب بواسطة الإدارة';
    const result = await ExpenseRepository.rejectRequest(req.params.id, reason);
    sendResponse(res, result);
  } catch (error: any) {
    sendError(res, error.message || 'فشل رفض طلب المصروف', error);
  }
});

router.post('/expenses/requests/:id/pay', authorize(['manager', 'accountant', 'cashier']), async (req, res) => {
  try {
    const result = await ExpenseRepository.payExpense(req.params.id, req.body);
    sendResponse(res, result);
  } catch (error: any) {
    sendError(res, error.message || 'فشل سداد المصروف القيد المحاسبي', error);
  }
});

router.get('/expenses/reports', async (req, res) => {
  try {
    const reports = await ExpenseRepository.getExpenseReports();
    sendResponse(res, reports);
  } catch (error) {
    sendError(res, 'فشل جلب تقرير المصروفات', error);
  }
});

export default router;
