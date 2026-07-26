import { Router } from 'express';
import { CustomerService } from '../../../services/CustomerService.ts';
import { authorize } from '../../middleware/rbac.ts';
import { validateRequest } from '../../middleware/validator.ts';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const { search } = req.query;
    const customers = await CustomerService.getCustomers(search as string);
    res.json({ success: true, data: customers });
  } catch (err) {
    next(err);
  }
});

router.get('/reports/aging', authorize(['manager', 'accountant']), async (req, res, next) => {
  try {
    const report = await CustomerService.getDebtAging();
    res.json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const customer = await CustomerService.getCustomerById(req.params.id);
    res.json({ success: true, data: customer });
  } catch (err) {
    next(err);
  }
});

router.get('/:id/ledger', async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const ledger = await CustomerService.getCustomerLedger(req.params.id, startDate as string, endDate as string);
    res.json({ success: true, data: ledger });
  } catch (err) {
    next(err);
  }
});

router.post(
  '/',
  authorize(['manager', 'cashier', 'accountant']),
  validateRequest({
    body: [
      { field: 'name', required: true, type: 'string', minLength: 2 }
    ]
  }),
  async (req, res, next) => {
    try {
      const saved = await CustomerService.saveCustomer(req.body);
      res.json({ success: true, data: saved });
    } catch (err) {
      next(err);
    }
  }
);

router.delete('/:id', authorize(['manager']), async (req, res, next) => {
  try {
    const result = await CustomerService.deleteCustomer(req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

export default router;
