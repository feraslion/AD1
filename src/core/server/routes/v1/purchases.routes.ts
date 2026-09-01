import { Router } from 'express';
import { PurchaseRepository } from '../../../repositories/PurchaseRepository.ts';
import { authorize } from '../../middleware/rbac.ts';

const router = Router();

router.get('/requests', authorize(['manager', 'inventory', 'accountant']), async (req, res, next) => {
  try {
    const requests = await PurchaseRepository.findAllPurchaseRequests();
    res.json({ success: true, data: requests });
  } catch (err) {
    next(err);
  }
});

router.post('/requests', authorize(['manager', 'inventory', 'accountant']), async (req, res, next) => {
  try {
    const result = await PurchaseRepository.createPurchaseRequest(req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.post('/requests/:id/convert-order', authorize(['manager', 'inventory', 'accountant']), async (req, res, next) => {
  try {
    const result = await PurchaseRepository.convertRequestToOrder(req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.get('/', authorize(['manager', 'inventory', 'accountant']), async (req, res, next) => {
  try {
    const list = await PurchaseRepository.findAllPurchases();
    res.json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
});

router.post('/', authorize(['manager', 'inventory', 'accountant']), async (req, res, next) => {
  try {
    const result = await PurchaseRepository.createPurchaseOrder(req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/receive', authorize(['manager', 'inventory']), async (req, res, next) => {
  try {
    const result = await PurchaseRepository.receiveGoods(req.params.id, req.body || {});
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/invoice', authorize(['manager', 'accountant']), async (req, res, next) => {
  try {
    const result = await PurchaseRepository.issueSupplierInvoice(req.params.id, req.body || {});
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/return', authorize(['manager', 'accountant', 'inventory']), async (req, res, next) => {
  try {
    const result = await PurchaseRepository.returnPurchaseInvoice(req.params.id, req.body || {});
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

export default router;
