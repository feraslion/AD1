import { Router } from 'express';
import { PurchaseRepository } from '../../../../core/repositories/index.ts';
import { sendResponse, sendError, authorize } from './helpers.ts';

const router = Router();

// Purchasing API (ERP Procurement Workflow)
router.get('/purchase-requests', async (req, res) => {
  try {
    const list = await PurchaseRepository.findAllPurchaseRequests();
    sendResponse(res, list);
  } catch (error) {
    sendError(res, 'فشل جلب طلبات الشراء', error);
  }
});

router.post('/purchase-requests', authorize(['manager', 'inventory', 'accountant']), async (req, res) => {
  try {
    const result = await PurchaseRepository.createPurchaseRequest(req.body);
    sendResponse(res, result);
  } catch (error) {
    sendError(res, 'فشل إنشاء طلب الشراء', error);
  }
});

router.post('/purchase-requests/:id/convert-order', authorize(['manager', 'inventory', 'accountant']), async (req, res) => {
  try {
    const result = await PurchaseRepository.convertRequestToOrder(req.params.id);
    sendResponse(res, result);
  } catch (error: any) {
    sendError(res, error.message || 'فشل تحويل طلب الشراء إلى أمر شراء', error);
  }
});

router.get('/purchases', async (req, res) => {
  try {
    const list = await PurchaseRepository.findAllPurchases();
    sendResponse(res, list);
  } catch (error) {
    sendError(res, 'فشل جلب قائمة المشتريات وأوامر الشراء', error);
  }
});

router.post('/purchases', authorize(['manager', 'inventory', 'accountant']), async (req, res) => {
  try {
    const { items, invoiceNumber, purchaseNumber } = req.body;
    if ((!invoiceNumber && !purchaseNumber) || !items || items.length === 0) {
      return sendError(res, 'بيانات المشتريات غير مكتملة', null, 400);
    }
    const result = await PurchaseRepository.createPurchaseOrder(req.body);
    sendResponse(res, result);
  } catch (error) {
    sendError(res, 'فشل تسجيل فاتورة أو أمر المشتريات', error);
  }
});

// Receive Goods for a Purchase Order (إذن استلام البضائع)
router.post('/purchases/:id/receive', authorize(['manager', 'inventory']), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await PurchaseRepository.receiveGoods(id, req.body || {});
    sendResponse(res, result);
  } catch (error: any) {
    sendError(res, error.message || 'فشل استلام البضائع', error);
  }
});

// Issue Supplier Invoice & Post Accounting for a Received Purchase Order
router.post('/purchases/:id/invoice', authorize(['manager', 'accountant']), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await PurchaseRepository.issueSupplierInvoice(id, req.body || {});
    sendResponse(res, result);
  } catch (error: any) {
    sendError(res, error.message || 'فشل إصدار فاتورة المورد', error);
  }
});

// Return Purchase Invoice & Post Accounting Reversal
router.post('/purchases/:id/return', authorize(['manager', 'accountant', 'inventory']), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await PurchaseRepository.returnPurchaseInvoice(id, req.body || {});
    sendResponse(res, result);
  } catch (error: any) {
    sendError(res, error.message || 'فشل تسجيل مرتجع المشتريات والترحيل المحاسبي', error);
  }
});

export default router;
