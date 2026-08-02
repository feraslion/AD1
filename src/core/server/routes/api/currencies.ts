import { Router } from 'express';
import { db } from '../../../database/index.ts';
import { eq } from 'drizzle-orm';
import { taxes, paymentMethods, settings } from '../../../database/schema.ts';
import { CurrencyRepository } from '../../../../core/repositories/index.ts';
import { CurrencyService, DEFAULT_CURRENCIES } from '../../../../services/CurrencyService.ts';
import { sendResponse, sendError, authorize } from './helpers.ts';

const router = Router();

// Currencies API
router.get('/currencies', async (req, res) => {
  try {
    let list = await CurrencyRepository.getCurrencies();
    if (list.length === 0) {
      for (const curr of DEFAULT_CURRENCIES) {
        await CurrencyRepository.upsertCurrency(curr);
      }
      list = await CurrencyRepository.getCurrencies();
    }
    sendResponse(res, list);
  } catch (error) {
    sendError(res, 'فشل جلب العملات', error);
  }
});

router.post('/currencies/seed', authorize(['manager', 'accountant']), async (req, res) => {
  try {
    for (const curr of DEFAULT_CURRENCIES) {
      const existing = await CurrencyRepository.findCurrencyByCode(curr.code);
      if (!existing) {
        await CurrencyRepository.upsertCurrency(curr);
      }
    }
    const updatedList = await CurrencyRepository.getCurrencies();
    sendResponse(res, updatedList);
  } catch (error) {
    sendError(res, 'فشل بذر بيانات العملات', error);
  }
});

router.post('/currencies', authorize(['manager', 'accountant']), async (req, res) => {
  try {
    const data = req.body;
    if (!data.code || !data.name || !data.symbol) {
      return sendError(res, 'كود واسم ورمز العملة مطلوبة', null, 400);
    }
    const saved = await CurrencyRepository.upsertCurrency(data);
    sendResponse(res, saved);
  } catch (error) {
    sendError(res, 'فشل حفظ العملة', error);
  }
});

router.post('/currencies/:id/rate', authorize(['manager', 'accountant']), async (req, res) => {
  try {
    const { id } = req.params;
    const { exchangeRate } = req.body;
    if (!exchangeRate || isNaN(Number(exchangeRate))) {
      return sendError(res, 'سعر الصرف الجديد مطلوب برقم صحيح', null, 400);
    }
    const userName = (req as any).user?.name || 'مدير النظام';
    const updated = await CurrencyRepository.updateRate(id, Number(exchangeRate), userName);
    sendResponse(res, updated);
  } catch (error) {
    sendError(res, 'فشل تحديث سعر الصرف', error);
  }
});

router.get('/currencies/history', async (req, res) => {
  try {
    const { currencyId } = req.query;
    const history = await CurrencyRepository.getExchangeRateHistory(currencyId as string);
    sendResponse(res, history);
  } catch (error) {
    sendError(res, 'فشل جلب سجل تغيير أسعار الصرف', error);
  }
});

router.post('/currencies/convert', async (req, res) => {
  try {
    const { amount, from, to } = req.body;
    if (amount === undefined || !from || !to) {
      return sendError(res, 'المبلغ وعملة المصدر وعملة الهدف مطلوبة', null, 400);
    }
    const allCurrencies = await CurrencyRepository.getCurrencies();
    const mappedList = allCurrencies.map(c => ({
      ...c,
      exchangeRate: parseFloat(c.exchangeRate || '1')
    }));
    const result = CurrencyService.convertAmount(
      Number(amount),
      from,
      to,
      mappedList as any
    );
    sendResponse(res, result);
  } catch (error) {
    sendError(res, 'فشل حساب تحويل العملة', error);
  }
});

router.delete('/currencies/:id', authorize(['manager', 'accountant']), async (req, res) => {
  try {
    const result = await CurrencyRepository.deleteCurrency(req.params.id);
    sendResponse(res, result);
  } catch (error) {
    sendError(res, 'فشل حذف العملة', error);
  }
});

router.post('/currencies/set-base', authorize(['manager', 'accountant']), async (req, res) => {
  try {
    const { currencyId, currencyCode } = req.body;
    const target = currencyId || currencyCode;
    if (!target) {
      return sendError(res, 'معرف أو كود العملة مطلوب', null, 400);
    }
    const userName = (req as any).user?.name || 'مدير النظام';
    const updatedList = await CurrencyRepository.setBaseCurrency(target, userName);

    // Also sync default currency in settings if exists
    try {
      const baseCode = await CurrencyRepository.getBaseCurrencyCode();
      const baseObj = await CurrencyRepository.findCurrencyByCode(baseCode);
      if (baseObj) {
        await db.update(settings).set({ currency: baseObj.symbol || baseCode }).where(eq(settings.id, 'default_settings'));
      }
    } catch (e) {
      // ignore if settings not initialized
    }
    sendResponse(res, updatedList);
  } catch (error: any) {
    sendError(res, error.message || 'فشل تغيير العملة الأساسية للشركة', error, 400);
  }
});

// Taxes API
router.get('/taxes', async (req, res) => {
  try {
    const list = await db.select().from(taxes);
    sendResponse(res, list);
  } catch (error) {
    sendError(res, 'فشل جلب الضرائب', error);
  }
});

router.post('/taxes', authorize(['manager', 'accountant']), async (req, res) => {
  try {
    const data = req.body;
    if (!data.name || !data.code || data.rate === undefined) {
      return sendError(res, 'اسم وكود ونسبة الضريبة مطلوبة', null, 400);
    }
    const id = data.id || 'tax_' + Math.random().toString(36).substr(2, 9);
    const dbValue = {
      id,
      name: data.name,
      code: data.code,
      rate: data.rate.toString(),
      isInclusive: data.isInclusive ? 'true' : 'false',
      companyId: data.companyId || null
    };
    const existing = await db.select().from(taxes).where(eq(taxes.id, id));
    if (existing.length > 0) {
      await db.update(taxes).set(dbValue).where(eq(taxes.id, id));
    } else {
      await db.insert(taxes).values(dbValue);
    }
    sendResponse(res, dbValue);
  } catch (error) {
    sendError(res, 'فشل حفظ الضريبة', error);
  }
});

router.delete('/taxes/:id', authorize(['manager', 'accountant']), async (req, res) => {
  try {
    await db.delete(taxes).where(eq(taxes.id, req.params.id));
    sendResponse(res, { success: true });
  } catch (error) {
    sendError(res, 'فشل حذف الضريبة', error);
  }
});

// Payment Methods API
router.get('/payment-methods', async (req, res) => {
  try {
    const list = await db.select().from(paymentMethods);
    sendResponse(res, list);
  } catch (error) {
    sendError(res, 'فشل جلب طرق الدفع', error);
  }
});

router.post('/payment-methods', authorize(['manager', 'accountant']), async (req, res) => {
  try {
    const data = req.body;
    if (!data.name || !data.code) {
      return sendError(res, 'اسم وكود طريقة الدفع مطلوبة', null, 400);
    }
    const id = data.id || 'pm_' + Math.random().toString(36).substr(2, 9);
    const dbValue = {
      id,
      code: data.code,
      name: data.name,
      accountId: data.accountId || null,
      companyId: data.companyId || null
    };
    const existing = await db.select().from(paymentMethods).where(eq(paymentMethods.id, id));
    if (existing.length > 0) {
      await db.update(paymentMethods).set(dbValue).where(eq(paymentMethods.id, id));
    } else {
      await db.insert(paymentMethods).values(dbValue);
    }
    sendResponse(res, dbValue);
  } catch (error) {
    sendError(res, 'فشل حفظ طريقة الدفع', error);
  }
});

router.delete('/payment-methods/:id', authorize(['manager', 'accountant']), async (req, res) => {
  try {
    await db.delete(paymentMethods).where(eq(paymentMethods.id, req.params.id));
    sendResponse(res, { success: true });
  } catch (error) {
    sendError(res, 'فشل حذف طريقة الدفع', error);
  }
});

// Store Settings API
router.get('/settings', async (req, res) => {
  try {
    const existing = await db.select().from(settings);
    if (existing.length === 0) {
      const defaultSettings = {
        id: 'global_settings',
        name: 'مطعم ومقهى السحاب',
        logo: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=100&h=100&fit=crop',
        address: 'الرياض، طريق الملك فهد',
        phone: '0501234567',
        taxNumber: '310234567800003',
        taxRate: '15',
        currency: 'ر.س',
        thermalPrinterWidth: '80mm'
      };
      await db.insert(settings).values(defaultSettings);
      return sendResponse(res, {
        ...defaultSettings,
        taxRate: parseFloat(defaultSettings.taxRate)
      });
    }
    const current = existing[0];
    sendResponse(res, {
      ...current,
      taxRate: parseFloat(current.taxRate || '15')
    });
  } catch (error) {
    sendError(res, 'فشل جلب إعدادات المتجر', error);
  }
});

router.post('/settings', authorize(['manager']), async (req, res) => {
  try {
    const s = req.body;
    const dbValue = {
      id: 'global_settings',
      name: s.name,
      logo: s.logo || '',
      address: s.address || '',
      phone: s.phone || '',
      taxNumber: s.taxNumber || '',
      taxRate: (s.taxRate ?? 15).toString(),
      currency: s.currency || 'ر.س',
      thermalPrinterWidth: s.thermalPrinterWidth || '80mm'
    };
    const existing = await db.select().from(settings).where(eq(settings.id, 'global_settings'));
    if (existing.length > 0) {
      await db.update(settings).set(dbValue).where(eq(settings.id, 'global_settings'));
    } else {
      await db.insert(settings).values(dbValue);
    }
    sendResponse(res, dbValue);
  } catch (error) {
    sendError(res, 'فشل تحديث الإعدادات', error);
  }
});

export default router;
