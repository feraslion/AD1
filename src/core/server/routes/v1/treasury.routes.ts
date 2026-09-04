import { Router } from 'express';
import { TreasuryRepository } from '../../../repositories/TreasuryRepository.ts';
import { authorize } from '../../middleware/rbac.ts';

const router = Router();

router.get('/cashboxes', authorize(['manager', 'accountant', 'cashier']), async (req, res, next) => {
  try {
    const list = await TreasuryRepository.getCashboxes();
    res.json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
});

router.post('/cashboxes', authorize(['manager', 'accountant']), async (req, res, next) => {
  try {
    const item = await TreasuryRepository.upsertCashbox(req.body);
    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
});

router.delete('/cashboxes/:id', authorize(['manager']), async (req, res, next) => {
  try {
    await TreasuryRepository.deleteCashbox(req.params.id);
    res.json({ success: true, data: { success: true } });
  } catch (err) {
    next(err);
  }
});

router.get('/bank-accounts', authorize(['manager', 'accountant']), async (req, res, next) => {
  try {
    const list = await TreasuryRepository.getBankAccounts();
    res.json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
});

router.post('/bank-accounts', authorize(['manager', 'accountant']), async (req, res, next) => {
  try {
    const item = await TreasuryRepository.upsertBankAccount(req.body);
    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
});

router.delete('/bank-accounts/:id', authorize(['manager']), async (req, res, next) => {
  try {
    await TreasuryRepository.deleteBankAccount(req.params.id);
    res.json({ success: true, data: { success: true } });
  } catch (err) {
    next(err);
  }
});

router.get('/transactions', authorize(['manager', 'accountant', 'cashier']), async (req, res, next) => {
  try {
    const type = req.query.type as string;
    const list = await TreasuryRepository.getTransactions(type);
    res.json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
});

router.post('/deposits', authorize(['manager', 'accountant', 'cashier']), async (req, res, next) => {
  try {
    const result = await TreasuryRepository.createDeposit(req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.post('/withdrawals', authorize(['manager', 'accountant']), async (req, res, next) => {
  try {
    const result = await TreasuryRepository.createWithdrawal(req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.post('/transfers', authorize(['manager', 'accountant']), async (req, res, next) => {
  try {
    const result = await TreasuryRepository.createTransfer(req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.get('/reconciliations/:bankAccountId', authorize(['manager', 'accountant']), async (req, res, next) => {
  try {
    const list = await TreasuryRepository.getBankReconciliations(req.params.bankAccountId);
    res.json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
});

router.get('/unreconciled/:bankAccountId', authorize(['manager', 'accountant']), async (req, res, next) => {
  try {
    const list = await TreasuryRepository.getUnreconciledTransactions(req.params.bankAccountId);
    res.json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
});

router.post('/reconcile', authorize(['manager', 'accountant']), async (req, res, next) => {
  try {
    const result = await TreasuryRepository.executeBankReconciliation(req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

export default router;
