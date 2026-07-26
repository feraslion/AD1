import { Router } from 'express';
import { AccountingRepository } from '../../../repositories/AccountingRepository.ts';
import { JournalEngine } from '../../../services/JournalEngine.ts';
import { authorize } from '../../middleware/rbac.ts';
import { AuthenticatedRequest } from '../../middleware/auth.ts';

const router = Router();

router.get('/ledger', authorize(['manager', 'accountant']), async (req, res, next) => {
  try {
    const { accountId, startDate, endDate, currency } = req.query;
    const ledger = await AccountingRepository.getGeneralLedger(
      accountId as string,
      startDate as string,
      endDate as string,
      currency as string
    );
    res.json({ success: true, data: ledger });
  } catch (err) {
    next(err);
  }
});

router.get('/trial-balance', authorize(['manager', 'accountant']), async (req, res, next) => {
  try {
    const { currency } = req.query;
    const tb = await AccountingRepository.getTrialBalance(currency as string);
    res.json({ success: true, data: tb });
  } catch (err) {
    next(err);
  }
});

router.get('/journal-entries', authorize(['manager', 'accountant']), async (req, res, next) => {
  try {
    const { search, date, currency, status } = req.query;
    const entries = await AccountingRepository.getJournalEntries(
      search as string,
      date as string,
      currency as string,
      status as string
    );
    res.json({ success: true, data: entries });
  } catch (err) {
    next(err);
  }
});

router.post('/journal-entries', authorize(['manager', 'accountant']), async (req: AuthenticatedRequest, res, next) => {
  try {
    const { description, date, reference, lines, currency, baseCurrency, exchangeRate, status } = req.body;
    const entryNum = 'JE-MAN-' + Math.floor(1000 + Math.random() * 9000);
    const createdBy = req.user?.name || 'المحاسب المالي';

    const result = await JournalEngine.postJournalEntry(
      entryNum,
      description,
      date,
      lines,
      {
        reference,
        currency,
        baseCurrency,
        exchangeRate: exchangeRate ? parseFloat(exchangeRate) : undefined,
        status: status || 'posted',
        createdBy
      }
    );
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.post('/journal-entries/:id/post', authorize(['manager', 'accountant']), async (req, res, next) => {
  try {
    const result = await JournalEngine.postDraftEntry(req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.post('/journal-entries/:id/reverse', authorize(['manager', 'accountant']), async (req: AuthenticatedRequest, res, next) => {
  try {
    const { reason } = req.body;
    const createdBy = req.user?.name || 'مدير التدقيق';
    const result = await JournalEngine.reverseJournalEntry(req.params.id, reason, createdBy);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.get('/audit-health', authorize(['manager', 'accountant']), async (req, res, next) => {
  try {
    const health = await JournalEngine.verifyAccountingIntegrity();
    res.json({ success: true, data: health });
  } catch (err) {
    next(err);
  }
});

router.get('/posting-rules', authorize(['manager', 'accountant']), async (req, res, next) => {
  try {
    const rules = await AccountingRepository.getPostingRules();
    res.json({ success: true, data: rules });
  } catch (err) {
    next(err);
  }
});

router.post('/posting-rules', authorize(['manager', 'accountant']), async (req, res, next) => {
  try {
    const { ruleCode, accountId } = req.body;
    const saved = await AccountingRepository.upsertPostingRule(ruleCode, accountId);
    res.json({ success: true, data: saved });
  } catch (err) {
    next(err);
  }
});

export default router;
