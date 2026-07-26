import { Router } from 'express';
import { AccountService } from '../../../services/AccountService.ts';
import { AccountRepository } from '../../../repositories/AccountRepository.ts';
import { authorize } from '../../middleware/rbac.ts';

const router = Router();

router.get('/', authorize(['manager', 'accountant', 'cashier']), async (req, res, next) => {
  try {
    const { companyId, type, activeOnly, search } = req.query;
    const list = await AccountService.getAccounts({
      companyId: companyId as string,
      type: type as string,
      activeOnly: activeOnly === 'true',
      search: search as string
    });
    res.json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
});

router.get('/tree', authorize(['manager', 'accountant', 'cashier']), async (req, res, next) => {
  try {
    const { companyId } = req.query;
    const tree = await AccountService.getAccountsTree(companyId as string);
    res.json({ success: true, data: tree });
  } catch (err) {
    next(err);
  }
});

router.get('/suggest-code', authorize(['manager', 'accountant']), async (req, res, next) => {
  try {
    const { parentId } = req.query;
    const suggestedCode = await AccountRepository.suggestChildCode(parentId as string);
    res.json({ success: true, data: { suggestedCode } });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', authorize(['manager', 'accountant']), async (req, res, next) => {
  try {
    const account = await AccountRepository.findAccountById(req.params.id);
    res.json({ success: true, data: account });
  } catch (err) {
    next(err);
  }
});

router.post('/', authorize(['manager', 'accountant']), async (req, res, next) => {
  try {
    const saved = await AccountRepository.upsertAccount(req.body);
    res.json({ success: true, data: saved });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/toggle-active', authorize(['manager', 'accountant']), async (req, res, next) => {
  try {
    const { isActive } = req.body;
    const updated = await AccountRepository.toggleAccountActive(req.params.id, isActive !== false);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

router.post('/seed', authorize(['manager', 'accountant']), async (req, res, next) => {
  try {
    const { companyId } = req.body;
    const result = await AccountRepository.seedDefaultChartOfAccounts(companyId);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', authorize(['manager', 'accountant']), async (req, res, next) => {
  try {
    const result = await AccountRepository.deleteAccount(req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

export default router;
