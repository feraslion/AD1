import { Router } from 'express';
import { ReportsRepository } from '../../../repositories/ReportsRepository.ts';
import { authorize } from '../../middleware/rbac.ts';

const router = Router();

const reportAuth = authorize(['manager', 'accountant', 'view_reports']);

router.get('/sales', reportAuth, async (req, res, next) => {
  try {
    const filter = {
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string
    };
    const report = await ReportsRepository.getSalesReport(filter);
    res.json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
});

router.get('/purchases', reportAuth, async (req, res, next) => {
  try {
    const filter = {
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string
    };
    const report = await ReportsRepository.getPurchaseReport(filter);
    res.json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
});

router.get('/inventory', reportAuth, async (req, res, next) => {
  try {
    const report = await ReportsRepository.getInventoryReport();
    res.json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
});

router.get('/customers', reportAuth, async (req, res, next) => {
  try {
    const report = await ReportsRepository.getCustomerReport();
    res.json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
});

router.get('/suppliers', reportAuth, async (req, res, next) => {
  try {
    const report = await ReportsRepository.getSupplierReport();
    res.json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
});

router.get('/profit', reportAuth, async (req, res, next) => {
  try {
    const filter = {
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string
    };
    const report = await ReportsRepository.getProfitReport(filter);
    res.json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
});

router.get('/financial-statements', reportAuth, async (req, res, next) => {
  try {
    const filter = {
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      currency: req.query.currency as string
    };
    const report = await ReportsRepository.getFinancialStatements(filter);
    res.json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
});

export default router;
