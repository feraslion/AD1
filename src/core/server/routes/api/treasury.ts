import { Router } from 'express';
import { TreasuryRepository } from '../../../../core/repositories/index.ts';
import { sendResponse, sendError, authorize } from './helpers.ts';

const router = Router();

// Treasury & Banking API (الخزينة والبنوك)
router.get('/treasury/cashboxes', async (req, res) => {
  try {
    const list = await TreasuryRepository.getCashboxes();
    sendResponse(res, list);
  } catch (error) {
    sendError(res, 'فشل جلب صناديق الخزينة', error);
  }
});

router.post('/treasury/cashboxes', authorize(['manager', 'accountant']), async (req, res) => {
  try {
    const item = await TreasuryRepository.upsertCashbox(req.body);
    sendResponse(res, item);
  } catch (error) {
    sendError(res, 'فشل حفظ صندوق الخزينة', error);
  }
});

router.delete('/treasury/cashboxes/:id', authorize(['manager']), async (req, res) => {
  try {
    await TreasuryRepository.deleteCashbox(req.params.id);
    sendResponse(res, { success: true });
  } catch (error) {
    sendError(res, 'فشل حذف الخزينة', error);
  }
});

router.get('/treasury/bank-accounts', async (req, res) => {
  try {
    const list = await TreasuryRepository.getBankAccounts();
    sendResponse(res, list);
  } catch (error) {
    sendError(res, 'فشل جلب الحسابات البنكية', error);
  }
});

router.post('/treasury/bank-accounts', authorize(['manager', 'accountant']), async (req, res) => {
  try {
    const item = await TreasuryRepository.upsertBankAccount(req.body);
    sendResponse(res, item);
  } catch (error) {
    sendError(res, 'فشل حفظ الحساب البنكي', error);
  }
});

router.delete('/treasury/bank-accounts/:id', authorize(['manager']), async (req, res) => {
  try {
    await TreasuryRepository.deleteBankAccount(req.params.id);
    sendResponse(res, { success: true });
  } catch (error) {
    sendError(res, 'فشل حذف الحساب البنكي', error);
  }
});

router.get('/treasury/transactions', async (req, res) => {
  try {
    const type = req.query.type as string;
    const list = await TreasuryRepository.getTransactions(type);
    sendResponse(res, list);
  } catch (error) {
    sendError(res, 'فشل جلب معاملات الخزينة والبنوك', error);
  }
});

router.post('/treasury/deposits', authorize(['manager', 'accountant', 'cashier']), async (req, res) => {
  try {
    const result = await TreasuryRepository.createDeposit(req.body);
    sendResponse(res, result);
  } catch (error: any) {
    sendError(res, error.message || 'فشل تسجيل الإيداع', error);
  }
});

router.post('/treasury/withdrawals', authorize(['manager', 'accountant']), async (req, res) => {
  try {
    const result = await TreasuryRepository.createWithdrawal(req.body);
    sendResponse(res, result);
  } catch (error: any) {
    sendError(res, error.message || 'فشل تسجيل السحب/المصروف', error);
  }
});

router.post('/treasury/transfers', authorize(['manager', 'accountant']), async (req, res) => {
  try {
    const result = await TreasuryRepository.createTransfer(req.body);
    sendResponse(res, result);
  } catch (error: any) {
    sendError(res, error.message || 'فشل تنفيذ التحويل المالي', error);
  }
});

router.get('/treasury/reconciliations/:bankAccountId', async (req, res) => {
  try {
    const list = await TreasuryRepository.getBankReconciliations(req.params.bankAccountId);
    sendResponse(res, list);
  } catch (error) {
    sendError(res, 'فشل جلب سجل التسويات البنكية', error);
  }
});

router.get('/treasury/unreconciled/:bankAccountId', async (req, res) => {
  try {
    const list = await TreasuryRepository.getUnreconciledTransactions(req.params.bankAccountId);
    sendResponse(res, list);
  } catch (error) {
    sendError(res, 'فشل جلب المعاملات غير المسواة', error);
  }
});

router.post('/treasury/reconcile', authorize(['manager', 'accountant']), async (req, res) => {
  try {
    const result = await TreasuryRepository.executeBankReconciliation(req.body);
    sendResponse(res, result);
  } catch (error: any) {
    sendError(res, error.message || 'فشل إتمام التسوية البنكية', error);
  }
});

export default router;
