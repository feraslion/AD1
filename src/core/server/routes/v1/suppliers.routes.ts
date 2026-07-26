import { Router } from 'express';
import { SupplierService } from '../../../services/SupplierService.ts';
import { authorize } from '../../middleware/rbac.ts';
import { validateRequest } from '../../middleware/validator.ts';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const { search } = req.query;
    const suppliers = await SupplierService.getSuppliers(search as string);
    res.json({ success: true, data: suppliers });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const supplier = await SupplierService.getSupplierById(req.params.id);
    res.json({ success: true, data: supplier });
  } catch (err) {
    next(err);
  }
});

router.get('/:id/purchases', async (req, res, next) => {
  try {
    const purchases = await SupplierService.getSupplierPurchases(req.params.id);
    res.json({ success: true, data: purchases });
  } catch (err) {
    next(err);
  }
});

router.post(
  '/',
  authorize(['manager', 'inventory', 'accountant']),
  validateRequest({
    body: [
      { field: 'name', required: true, type: 'string', minLength: 2 }
    ]
  }),
  async (req, res, next) => {
    try {
      const saved = await SupplierService.saveSupplier(req.body);
      res.json({ success: true, data: saved });
    } catch (err) {
      next(err);
    }
  }
);

router.delete('/:id', authorize(['manager']), async (req, res, next) => {
  try {
    const result = await SupplierService.deleteSupplier(req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

export default router;
