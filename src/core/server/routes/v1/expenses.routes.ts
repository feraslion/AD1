import { Router } from 'express';
import { ExpenseRepository } from '../../../repositories/ExpenseRepository.ts';
import { authorize } from '../../middleware/rbac.ts';
import { AuthenticatedRequest } from '../../middleware/auth.ts';

const router = Router();

router.get('/categories', authorize(['manager', 'accountant', 'cashier']), async (req, res, next) => {
  try {
    const list = await ExpenseRepository.getCategories();
    res.json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
});

router.post('/categories', authorize(['manager', 'accountant']), async (req, res, next) => {
  try {
    const cat = await ExpenseRepository.upsertCategory(req.body);
    res.json({ success: true, data: cat });
  } catch (err) {
    next(err);
  }
});

router.delete('/categories/:id', authorize(['manager']), async (req, res, next) => {
  try {
    await ExpenseRepository.deleteCategory(req.params.id);
    res.json({ success: true, data: { success: true } });
  } catch (err) {
    next(err);
  }
});

router.get('/requests', authorize(['manager', 'accountant', 'cashier']), async (req, res, next) => {
  try {
    const statusFilter = req.query.status as string;
    const list = await ExpenseRepository.getRequests(statusFilter);
    res.json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
});

router.post('/requests', authorize(['manager', 'accountant', 'cashier']), async (req, res, next) => {
  try {
    const item = await ExpenseRepository.createRequest(req.body);
    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
});

router.post('/requests/:id/approve', authorize(['manager', 'accountant']), async (req: AuthenticatedRequest, res, next) => {
  try {
    const approvedBy = req.body.approvedBy || req.user?.name || 'مدير النظام';
    const result = await ExpenseRepository.approveRequest(req.params.id, approvedBy);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.post('/requests/:id/reject', authorize(['manager', 'accountant']), async (req, res, next) => {
  try {
    const reason = req.body.reason || 'تم رفض الطلب بواسطة الإدارة';
    const result = await ExpenseRepository.rejectRequest(req.params.id, reason);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.post('/requests/:id/pay', authorize(['manager', 'accountant', 'cashier']), async (req, res, next) => {
  try {
    const result = await ExpenseRepository.payExpense(req.params.id, req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.get('/reports', authorize(['manager', 'accountant', 'view_reports']), async (req, res, next) => {
  try {
    const reports = await ExpenseRepository.getExpenseReports();
    res.json({ success: true, data: reports });
  } catch (err) {
    next(err);
  }
});

export default router;
