import { Router } from 'express';
import { SalesService } from '../../../services/SalesService.ts';
import { authorize } from '../../middleware/rbac.ts';
import { validateRequest } from '../../middleware/validator.ts';

const router = Router();

// Invoices
router.get('/invoices', async (req, res, next) => {
  try {
    const { page, limit, customerId, status, date, companyId, branchId } = req.query;
    const result = await SalesService.getInvoices({
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      customerId: customerId as string,
      status: status as string,
      date: date as string,
      companyId: companyId as string,
      branchId: branchId as string
    });
    res.json({ success: true, data: result.items, pagination: { page: page || 1, limit: limit || 10, total: result.total } });
  } catch (err) {
    next(err);
  }
});

router.get('/invoices/:id', async (req, res, next) => {
  try {
    const invoice = await SalesService.getInvoiceById(req.params.id);
    res.json({ success: true, data: invoice });
  } catch (err) {
    next(err);
  }
});

router.post(
  '/invoices',
  authorize(['manager', 'cashier']),
  validateRequest({
    body: [
      { field: 'invoiceNumber', required: true, type: 'string' },
      { field: 'date', required: true, type: 'string' },
      { field: 'items', required: true, type: 'array' }
    ]
  }),
  async (req, res, next) => {
    try {
      const created = await SalesService.createSaleInvoice(req.body);
      res.json({ success: true, data: created });
    } catch (err) {
      next(err);
    }
  }
);

router.post('/invoices/:id/return', authorize(['manager', 'cashier', 'accountant']), async (req, res, next) => {
  try {
    const returned = await SalesService.returnSaleInvoice(req.params.id);
    res.json({ success: true, data: returned });
  } catch (err) {
    next(err);
  }
});

// Quotations
router.get('/quotations', async (req, res, next) => {
  try {
    const quotes = await SalesService.getQuotations();
    res.json({ success: true, data: quotes });
  } catch (err) {
    next(err);
  }
});

router.post('/quotations', authorize(['manager', 'cashier', 'accountant']), async (req, res, next) => {
  try {
    const created = await SalesService.createQuotation(req.body);
    res.json({ success: true, data: created });
  } catch (err) {
    next(err);
  }
});

router.post('/quotations/:id/convert-order', authorize(['manager', 'cashier', 'accountant']), async (req, res, next) => {
  try {
    const result = await SalesService.convertQuotationToOrder(req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// Sales Orders
router.get('/orders', async (req, res, next) => {
  try {
    const orders = await SalesService.getSalesOrders();
    res.json({ success: true, data: orders });
  } catch (err) {
    next(err);
  }
});

router.post('/orders', authorize(['manager', 'cashier', 'accountant']), async (req, res, next) => {
  try {
    const created = await SalesService.createSalesOrder(req.body);
    res.json({ success: true, data: created });
  } catch (err) {
    next(err);
  }
});

router.post('/orders/:id/convert-invoice', authorize(['manager', 'cashier', 'accountant']), async (req, res, next) => {
  try {
    const { paymentMethod } = req.body;
    const result = await SalesService.convertOrderToInvoice(req.params.id, paymentMethod || 'credit');
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// Customer Payments
router.post('/payments', authorize(['manager', 'cashier', 'accountant']), async (req, res, next) => {
  try {
    const result = await SalesService.recordCustomerPayment(req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

export default router;
