import { Router } from 'express';
import { ReportsRepository } from '../../../../core/repositories/index.ts';
import { sendResponse, sendError } from './helpers.ts';

const router = Router();

// Reporting Engine API (محرك التقارير والشاشات التحليلية)
router.get('/reports/sales', async (req, res) => {
  try {
    const filter = {
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string
    };
    const report = await ReportsRepository.getSalesReport(filter);
    sendResponse(res, report);
  } catch (error) {
    sendError(res, 'فشل توليد تقرير المبيعات', error);
  }
});

router.get('/reports/purchases', async (req, res) => {
  try {
    const filter = {
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string
    };
    const report = await ReportsRepository.getPurchaseReport(filter);
    sendResponse(res, report);
  } catch (error) {
    sendError(res, 'فشل توليد تقرير المشتريات', error);
  }
});

router.get('/reports/inventory', async (req, res) => {
  try {
    const report = await ReportsRepository.getInventoryReport();
    sendResponse(res, report);
  } catch (error) {
    sendError(res, 'فشل توليد تقرير المخزون', error);
  }
});

router.get('/reports/customers', async (req, res) => {
  try {
    const report = await ReportsRepository.getCustomerReport();
    sendResponse(res, report);
  } catch (error) {
    sendError(res, 'فشل توليد تقرير العملاء', error);
  }
});

router.get('/reports/suppliers', async (req, res) => {
  try {
    const report = await ReportsRepository.getSupplierReport();
    sendResponse(res, report);
  } catch (error) {
    sendError(res, 'فشل توليد تقرير الموردين', error);
  }
});

router.get('/reports/profit', async (req, res) => {
  try {
    const filter = {
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string
    };
    const report = await ReportsRepository.getProfitReport(filter);
    sendResponse(res, report);
  } catch (error) {
    sendError(res, 'فشل توليد تقرير الأرباح والخسائر', error);
  }
});

router.get('/reports/financial-statements', async (req, res) => {
  try {
    const filter = {
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      currency: req.query.currency as string
    };
    const report = await ReportsRepository.getFinancialStatements(filter);
    sendResponse(res, report);
  } catch (error) {
    sendError(res, 'فشل توليد القوائم المالية المحاسبية', error);
  }
});

export default router;
