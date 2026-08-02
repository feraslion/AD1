import { Router } from 'express';
import { SalesRepository } from '../../../../core/repositories/index.ts';
import { sendResponse, sendError, authorize } from './helpers.ts';

const router = Router();

// Validation helpers
function validateInvoice(inv: any) {
  const errors = [];
  if (!inv.invoiceNumber) errors.push('رقم الفاتورة مطلوب');
  if (!inv.date) errors.push('تاريخ الفاتورة مطلوب');
  if (!inv.items || !Array.isArray(inv.items) || inv.items.length === 0) {
    errors.push('يجب إضافة منتج واحد على الأقل في الفاتورة');
  }
  return errors;
}

// Invoices & POS Sales API (With pagination and filtration)
router.get('/invoices', async (req, res) => {
  try {
    const { page, limit, customerId, status, date } = req.query;
    const p = page ? parseInt(page as string) : undefined;
    const l = limit ? parseInt(limit as string) : undefined;

    const result = await SalesRepository.findAllInvoices({
      page: p,
      limit: l,
      customerId: customerId as string,
      status: status as string,
      date: date as string
    });

    if (p || l) {
      sendResponse(res, result.items, 200, { page: p || 1, limit: l || 10, total: result.total });
    } else {
      sendResponse(res, result.items);
    }
  } catch (error) {
    sendError(res, 'فشل جلب الفواتير', error);
  }
});

router.post('/invoices', authorize(['manager', 'cashier']), async (req, res) => {
  try {
    const inv = req.body;
    const errors = validateInvoice(inv);
    if (errors.length > 0) {
      return sendError(res, 'خطأ في التحقق من البيانات', errors, 400);
    }

    const result = await SalesRepository.createSaleInvoice(inv);
    sendResponse(res, result);
  } catch (error) {
    sendError(res, 'فشل إنشاء الفاتورة', error);
  }
});

router.post('/invoices/:id/return', authorize(['manager', 'cashier', 'accountant']), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await SalesRepository.returnSaleInvoice(id);
    sendResponse(res, result);
  } catch (error: any) {
    sendError(res, error.message || 'فشل معالجة مرتجع الفاتورة', error);
  }
});

// Quotations API
router.get('/quotations', async (req, res) => {
  try {
    const quotes = await SalesRepository.findAllQuotations();
    sendResponse(res, quotes);
  } catch (error) {
    sendError(res, 'فشل جلب عروض الأسعار', error);
  }
});

router.post('/quotations', authorize(['manager', 'cashier', 'accountant']), async (req, res) => {
  try {
    const result = await SalesRepository.createQuotation(req.body);
    sendResponse(res, result);
  } catch (error) {
    sendError(res, 'فشل إنشاء عرض السعر', error);
  }
});

router.post('/quotations/:id/convert-order', authorize(['manager', 'cashier', 'accountant']), async (req, res) => {
  try {
    const result = await SalesRepository.convertQuotationToOrder(req.params.id);
    sendResponse(res, result);
  } catch (error: any) {
    sendError(res, error.message || 'فشل تحويل عرض السعر إلى أمر مبيعات', error);
  }
});

// Sales Orders API
router.get('/sales-orders', async (req, res) => {
  try {
    const orders = await SalesRepository.findAllSalesOrders();
    sendResponse(res, orders);
  } catch (error) {
    sendError(res, 'فشل جلب أوامر المبيعات', error);
  }
});

router.post('/sales-orders', authorize(['manager', 'cashier', 'accountant']), async (req, res) => {
  try {
    const result = await SalesRepository.createSalesOrder(req.body);
    sendResponse(res, result);
  } catch (error) {
    sendError(res, 'فشل إنشاء أمر المبيعات', error);
  }
});

router.post('/sales-orders/:id/convert-invoice', authorize(['manager', 'cashier', 'accountant']), async (req, res) => {
  try {
    const { paymentMethod } = req.body;
    const result = await SalesRepository.convertOrderToInvoice(req.params.id, paymentMethod || 'credit');
    sendResponse(res, result);
  } catch (error: any) {
    sendError(res, error.message || 'فشل تحويل أمر المبيعات إلى فاتورة', error);
  }
});

// Customer Payments API (تحصيل سندات المبيعات)
router.post('/customer-payments', authorize(['manager', 'cashier', 'accountant']), async (req, res) => {
  try {
    const result = await SalesRepository.recordCustomerPayment(req.body);
    sendResponse(res, result);
  } catch (error: any) {
    sendError(res, error.message || 'فشل تسجيل تحصيل دفعة العميل', error);
  }
});

export default router;
