import { Router } from 'express';
import { db } from '../../../database/index.ts';
import { eq, inArray } from 'drizzle-orm';
import { accounts, journalEntries, journalLines } from '../../../database/schema.ts';
import { AccountRepository, AccountingRepository } from '../../../../core/repositories/index.ts';
import { JournalEngine } from '../../../../core/services/JournalEngine.ts';
import { sendResponse, sendError, authorize } from './helpers.ts';

const router = Router();

// Accounts & Accounting API
router.get(['/accounts', '/accounting/accounts'], authorize(['manager', 'accountant', 'cashier']), async (req, res) => {
  try {
    const { companyId, type, activeOnly, search } = req.query;
    const accountsList = await AccountRepository.getAccounts({
      companyId: companyId as string,
      type: type as string,
      activeOnly: activeOnly === 'true',
      search: search as string
    });
    sendResponse(res, accountsList);
  } catch (error) {
    sendError(res, 'فشل جلب دليل الحسابات', error);
  }
});

router.get('/accounts/tree', authorize(['manager', 'accountant', 'cashier']), async (req, res) => {
  try {
    const { companyId } = req.query;
    const tree = await AccountRepository.getAccountsTree(companyId as string);
    sendResponse(res, tree);
  } catch (error) {
    sendError(res, 'فشل جلب الشجرة الهرمية للحسابات', error);
  }
});

router.get('/accounts/suggest-code', authorize(['manager', 'accountant']), async (req, res) => {
  try {
    const { parentId } = req.query;
    if (!parentId) {
      return sendError(res, 'معرف الحساب الرئيسي parentId مطلوب', null, 400);
    }
    const suggestedCode = await AccountRepository.suggestChildCode(parentId as string);
    sendResponse(res, { suggestedCode });
  } catch (error: any) {
    sendError(res, error.message || 'فشل توليد رمز الحساب الفرعي', error, 400);
  }
});

router.get('/accounts/:id', authorize(['manager', 'accountant']), async (req, res) => {
  try {
    const { id } = req.params;
    const account = await AccountRepository.findAccountById(id);
    if (!account) {
      return sendError(res, 'الحساب المالي غير موجود', null, 404);
    }
    sendResponse(res, account);
  } catch (error) {
    sendError(res, 'فشل جلب تفاصيل الحساب', error);
  }
});

router.post(['/accounts', '/accounting/accounts'], authorize(['manager', 'accountant']), async (req, res) => {
  try {
    const { code, name, type } = req.body;
    if (!code || !name || !type) {
      return sendError(res, 'جميع الحقول الأساسية للحساب مطلوبة (الرمز، الاسم، النوع)', null, 400);
    }
    const saved = await AccountRepository.upsertAccount(req.body);
    sendResponse(res, saved);
  } catch (error: any) {
    sendError(res, error.message || 'فشل حفظ الحساب', error, 400);
  }
});

router.post('/accounts/:id/toggle-active', authorize(['manager', 'accountant']), async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    const updated = await AccountRepository.toggleAccountActive(id, isActive !== false);
    sendResponse(res, updated);
  } catch (error: any) {
    sendError(res, error.message || 'فشل تغيير حالة الحساب', error, 400);
  }
});

router.post('/accounts/seed', authorize(['manager', 'accountant']), async (req, res) => {
  try {
    const { companyId } = req.body;
    const result = await AccountRepository.seedDefaultChartOfAccounts(companyId);
    sendResponse(res, result);
  } catch (error: any) {
    sendError(res, error.message || 'فشل زرع دليل الحسابات القياسي', error);
  }
});

router.delete(['/accounts/:id', '/accounting/accounts/:id'], authorize(['manager', 'accountant']), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await AccountRepository.deleteAccount(id);
    sendResponse(res, result);
  } catch (error: any) {
    sendError(res, error.message || 'فشل حذف الحساب', error, 400);
  }
});

router.get('/accounting/ledger', authorize(['manager', 'accountant']), async (req, res) => {
  try {
    const { accountId, startDate, endDate, currency } = req.query;
    if (!accountId) {
      return sendError(res, 'يجب تحديد معرف الحساب accountId', null, 400);
    }
    const result = await AccountingRepository.getGeneralLedger(
      accountId as string,
      startDate as string,
      endDate as string,
      currency as string
    );
    sendResponse(res, result);
  } catch (error: any) {
    sendError(res, error.message || 'فشل جلب دفتر الأستاذ للحساب', error);
  }
});

router.get('/accounting/trial-balance', authorize(['manager', 'accountant']), async (req, res) => {
  try {
    const { currency } = req.query;
    const trialBalanceData = await AccountingRepository.getTrialBalance(currency as string);
    sendResponse(res, trialBalanceData);
  } catch (error) {
    sendError(res, 'فشل جلب ميزان المراجعة', error);
  }
});

router.get('/accounting/journal-entries', authorize(['manager', 'accountant']), async (req, res) => {
  try {
    const { search, date, currency, status } = req.query;
    const entries = await AccountingRepository.getJournalEntries(
      search as string,
      date as string,
      currency as string,
      status as string
    );
    sendResponse(res, entries);
  } catch (error) {
    sendError(res, 'فشل جلب قيود اليومية', error);
  }
});

router.get('/accounting/journal-entries/:id', authorize(['manager', 'accountant']), async (req, res) => {
  try {
    const { id } = req.params;
    const [entry] = await db.select().from(journalEntries).where(eq(journalEntries.id, id));
    if (!entry) return sendError(res, 'القيد المحاسبي غير موجود', null, 404);

    const lines = await db.select().from(journalLines).where(eq(journalLines.journalEntryId, id));
    const accountIds = Array.from(new Set(lines.map(l => l.accountId)));
    const accs = accountIds.length > 0 ? await db.select().from(accounts).where(inArray(accounts.id, accountIds)) : [];
    const accMap = new Map(accs.map(a => [a.id, a]));

    const mappedLines = lines.map(l => {
      const acc = accMap.get(l.accountId);
      return {
        id: l.id,
        accountId: l.accountId,
        accountCode: acc?.code || '',
        accountName: acc?.name || '',
        accountType: acc?.type || '',
        currency: l.currency || entry.currency || 'SAR',
        exchangeRate: parseFloat(l.exchangeRate || '1.0'),
        foreignDebit: parseFloat(l.foreignDebit || '0'),
        foreignCredit: parseFloat(l.foreignCredit || '0'),
        debit: parseFloat(l.debit || '0'),
        credit: parseFloat(l.credit || '0'),
        description: l.description || entry.description
      };
    });

    sendResponse(res, {
      ...entry,
      foreignAmount: parseFloat(entry.foreignAmount || '0'),
      baseAmount: parseFloat(entry.baseAmount || '0'),
      exchangeRate: parseFloat(entry.exchangeRate || '1.0'),
      lines: mappedLines
    });
  } catch (error) {
    sendError(res, 'فشل جلب تفاصيل القيد المحاسبي', error);
  }
});

router.post('/accounting/journal-entries', authorize(['manager', 'accountant']), async (req: any, res) => {
  try {
    const { description, date, reference, lines, currency, baseCurrency, exchangeRate, status } = req.body;
    if (!description || !date || !lines || !Array.isArray(lines) || lines.length === 0) {
      return sendError(res, 'بيانات قيد اليومية غير مكتملة', null, 400);
    }
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
    sendResponse(res, { success: true, ...result });
  } catch (error: any) {
    sendError(res, error.message || 'فشل حفظ القيد المحاسبي اليدوي', error, 400);
  }
});

router.post('/accounting/journal-entries/:id/post', authorize(['manager', 'accountant']), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await JournalEngine.postDraftEntry(id);
    sendResponse(res, result);
  } catch (error: any) {
    sendError(res, error.message || 'فشل ترحيل قيد المسودة', error, 400);
  }
});

router.post('/accounting/journal-entries/:id/reverse', authorize(['manager', 'accountant']), async (req: any, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    if (!reason || !reason.trim()) {
      return sendError(res, 'يجب كتابة سبب عكس وتعديل القيد المحاسبي لأغراض التدقيق', null, 400);
    }
    const createdBy = req.user?.name || 'مدير التدقيق المحاسبي';
    const result = await JournalEngine.reverseJournalEntry(id, reason, createdBy);
    sendResponse(res, result);
  } catch (error: any) {
    sendError(res, error.message || 'فشل عكس القيد المحاسبي', error, 400);
  }
});

router.get('/accounting/audit-health', authorize(['manager', 'accountant']), async (req, res) => {
  try {
    const health = await JournalEngine.verifyAccountingIntegrity();
    sendResponse(res, health);
  } catch (error) {
    sendError(res, 'فشل تنفيذ فحص التدقيق المحاسبي', error);
  }
});

router.post('/currencies/revaluate', authorize(['manager', 'accountant']), async (req, res) => {
  try {
    const { currencyCode, newExchangeRate, revaluationDate } = req.body;
    if (!currencyCode || !newExchangeRate) {
      return sendError(res, 'رمز العملة وسعر الصرف الجديد مطلوبان', null, 400);
    }
    const dateToUse = revaluationDate || new Date().toISOString().split('T')[0];
    const result = await AccountingRepository.revaluateForeignAccounts(
      currencyCode,
      parseFloat(newExchangeRate),
      dateToUse
    );
    sendResponse(res, result);
  } catch (error: any) {
    sendError(res, error.message || 'فشل تنفيذ عملية إعادة تقييم العملة', error, 400);
  }
});

// Posting Rules APIs
router.get('/accounting/posting-rules', authorize(['manager', 'accountant']), async (req, res) => {
  try {
    const rules = await AccountingRepository.getPostingRules();
    sendResponse(res, rules);
  } catch (error) {
    sendError(res, 'فشل جلب قواعد الترحيل المحاسبي', error);
  }
});

router.post('/accounting/posting-rules', authorize(['manager', 'accountant']), async (req, res) => {
  try {
    const { ruleCode, accountId } = req.body;
    if (!ruleCode || !accountId) {
      return sendError(res, 'رمز القاعدة ومعرف الحساب مطلوبان', null, 400);
    }

    const saved = await AccountingRepository.upsertPostingRule(ruleCode, accountId);
    sendResponse(res, { success: true, ...saved });
  } catch (error) {
    sendError(res, 'فشل تحديث قاعدة الترحيل', error);
  }
});

export default router;
