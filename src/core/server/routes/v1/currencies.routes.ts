import { Router } from 'express';
import { CurrencyRepository } from '../../../repositories/CurrencyRepository.ts';
import { DEFAULT_CURRENCIES, CurrencyService } from '../../../../services/CurrencyService.ts';
import { authorize } from '../../middleware/rbac.ts';
import { AuthenticatedRequest } from '../../middleware/auth.ts';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    let list = await CurrencyRepository.getCurrencies();
    if (list.length === 0) {
      for (const curr of DEFAULT_CURRENCIES) {
        await CurrencyRepository.upsertCurrency(curr);
      }
      list = await CurrencyRepository.getCurrencies();
    }
    res.json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
});

router.post('/seed', authorize(['manager', 'accountant']), async (req, res, next) => {
  try {
    for (const curr of DEFAULT_CURRENCIES) {
      const existing = await CurrencyRepository.findCurrencyByCode(curr.code);
      if (!existing) {
        await CurrencyRepository.upsertCurrency(curr);
      }
    }
    const list = await CurrencyRepository.getCurrencies();
    res.json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
});

router.post('/', authorize(['manager', 'accountant']), async (req, res, next) => {
  try {
    const saved = await CurrencyRepository.upsertCurrency(req.body);
    res.json({ success: true, data: saved });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/rate', authorize(['manager', 'accountant']), async (req: AuthenticatedRequest, res, next) => {
  try {
    const { exchangeRate } = req.body;
    const userName = req.user?.name || 'مدير النظام';
    const updated = await CurrencyRepository.updateRate(req.params.id, Number(exchangeRate), userName);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

router.get('/history', async (req, res, next) => {
  try {
    const { currencyId } = req.query;
    const history = await CurrencyRepository.getExchangeRateHistory(currencyId as string);
    res.json({ success: true, data: history });
  } catch (err) {
    next(err);
  }
});

router.post('/convert', async (req, res, next) => {
  try {
    const { amount, from, to } = req.body;
    const allCurrencies = await CurrencyRepository.getCurrencies();
    const mappedList = allCurrencies.map(c => ({
      ...c,
      exchangeRate: parseFloat(c.exchangeRate || '1')
    }));

    const result = CurrencyService.convertAmount(Number(amount), from, to, mappedList as any);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', authorize(['manager', 'accountant']), async (req, res, next) => {
  try {
    const result = await CurrencyRepository.deleteCurrency(req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.get('/historical-rate', async (req, res, next) => {
  try {
    const code = (req.query.code as string) || 'USD';
    const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
    const rate = await CurrencyService.getHistoricalRate(code, date);
    res.json({ success: true, data: { currencyCode: code, date, rate } });
  } catch (err) {
    next(err);
  }
});

router.post('/revalue', authorize(['manager', 'accountant']), async (req: AuthenticatedRequest, res, next) => {
  try {
    const { date, currencyCode, newRate } = req.body;
    const userName = req.user?.name || 'مدير النظام';
    const result = await CurrencyService.revalueForeignBalances({
      date,
      currencyCode,
      newRate: newRate ? Number(newRate) : undefined,
      createdBy: userName
    });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.post('/convert-invoice', async (req, res, next) => {
  try {
    const { invoice, targetCurrency, rate } = req.body;
    const result = CurrencyService.convertInvoice(invoice, targetCurrency, rate ? Number(rate) : undefined);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.post('/set-base', authorize(['manager', 'accountant']), async (req: AuthenticatedRequest, res, next) => {
  try {
    const { currencyId, currencyCode } = req.body;
    const target = currencyId || currencyCode;
    const userName = req.user?.name || 'مدير النظام';
    const updatedList = await CurrencyRepository.setBaseCurrency(target, userName);
    res.json({ success: true, data: updatedList });
  } catch (err) {
    next(err);
  }
});

export default router;
