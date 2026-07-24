import { db } from '../database/index.ts';
import { 
  accounts, 
  journalEntries, 
  journalDetails,
  journalLines,
  expenses, 
  postingRules, 
  currencies, 
  taxes, 
  paymentMethods,
  cashboxes 
} from '../database/schema.ts';
import { eq, desc, inArray, and, gte, lte } from 'drizzle-orm';
import { CurrencyRepository } from './CurrencyRepository.ts';
import { AccountService } from '../services/AccountService.ts';
import { JournalEngine } from '../services/JournalEngine.ts';

export interface JournalLineInput {
  accountId: string;
  debit: number; // base currency debit amount
  credit: number; // base currency credit amount
  currency?: string; // transaction currency, default 'SAR'
  exchangeRate?: number; // exchange rate vs base currency, default 1.0
  foreignDebit?: number; // amount in transaction currency
  foreignCredit?: number; // amount in transaction currency
  description?: string;
}

export interface PostJournalEntryOptions {
  currency?: string; // e.g. 'USD'
  baseCurrency?: string; // e.g. 'SAR'
  exchangeRate?: number; // e.g. 3.75
  foreignAmount?: number;
  baseAmount?: number;
}

export class AccountingRepository {
  // 1. CHART OF ACCOUNTS & TREE
  static async getAccounts(filter?: { companyId?: string; type?: string; activeOnly?: boolean; search?: string }) {
    return await AccountService.getAccounts(filter);
  }

  static async getAccountsTree(companyId?: string) {
    return await AccountService.getAccountsTree(companyId);
  }

  static async findAccountById(id: string) {
    return await AccountService.getAccountById(id);
  }

  static async findAccountByCode(code: string) {
    return await AccountService.getAccountByCode(code);
  }

  static async upsertAccount(data: any) {
    return await AccountService.upsertAccount(data);
  }

  static async toggleAccountActive(id: string, isActive: boolean) {
    return await AccountService.toggleAccountActive(id, isActive);
  }

  static async deleteAccount(id: string) {
    return await AccountService.deleteAccount(id);
  }

  static async seedDefaultChartOfAccounts(companyId?: string) {
    return await AccountService.seedDefaultChartOfAccounts(companyId);
  }

  // 2. DOUBLE-ENTRY MULTI-CURRENCY POSTING ENGINE
  static async postJournalEntry(
    entryNumber: string, 
    description: string, 
    date: string, 
    lines: JournalLineInput[],
    options?: PostJournalEntryOptions & { reference?: string; status?: 'draft' | 'posted'; createdBy?: string }
  ) {
    return await JournalEngine.postJournalEntry(entryNumber, description, date, lines, options);
  }

  // 3. CURRENCY REVALUATION ENGINE (إعادة تقييم العملات وإثبات الأرباح/الخسائر غير المحققة)
  static async revaluateForeignAccounts(currencyCode: string, newExchangeRate: number, revaluationDate: string) {
    const baseCurrencyCode = await CurrencyRepository.getBaseCurrencyCode();
    if (!currencyCode || currencyCode.toUpperCase() === baseCurrencyCode.toUpperCase()) {
      throw new Error(`لا تتطلب العملة الأساسية (${baseCurrencyCode}) عملية إعادة تقييم.`);
    }
    if (!newExchangeRate || newExchangeRate <= 0) {
      throw new Error('سعر الصرف الجديد يجب أن يكون أكبر من صفر.');
    }

    const allAccounts = await db.select().from(accounts);
    // Find all details for foreign accounts or where transactions were posted in currencyCode
    const allDetails = await db.select().from(journalDetails).where(eq(journalDetails.currency, currencyCode));

    const revaluedAccountsMap = new Map<string, { account: any; currentBaseBal: number; foreignBal: number; newBaseBal: number; difference: number }>();

    for (const acc of allAccounts) {
      const accDetails = allDetails.filter(d => d.accountId === acc.id);
      if (accDetails.length === 0 && acc.currency !== currencyCode) continue;

      const totalForeignDebit = accDetails.reduce((s, d) => s + parseFloat(d.foreignDebit || '0'), 0);
      const totalForeignCredit = accDetails.reduce((s, d) => s + parseFloat(d.foreignCredit || '0'), 0);
      const totalBaseDebit = accDetails.reduce((s, d) => s + parseFloat(d.debit || '0'), 0);
      const totalBaseCredit = accDetails.reduce((s, d) => s + parseFloat(d.credit || '0'), 0);

      const isDebitNormal = acc.type === 'asset' || acc.type === 'expense';
      const foreignBal = isDebitNormal ? (totalForeignDebit - totalForeignCredit) : (totalForeignCredit - totalForeignDebit);
      const currentBaseBal = isDebitNormal ? (totalBaseDebit - totalBaseCredit) : (totalBaseCredit - totalBaseDebit);

      if (Math.abs(foreignBal) < 0.0001) continue;

      // Calculate what the balance in base currency SHOULD be at the new rate
      const newBaseBal = foreignBal * newExchangeRate;
      const difference = newBaseBal - currentBaseBal;

      if (Math.abs(difference) >= 0.01) {
        revaluedAccountsMap.set(acc.id, {
          account: acc,
          currentBaseBal,
          foreignBal,
          newBaseBal,
          difference: Number(difference.toFixed(2))
        });
      }
    }

    if (revaluedAccountsMap.size === 0) {
      return {
        message: `لا توجد فروقات تقييم مطلوبة للعملة (${currencyCode}) عند سعر الصرف (${newExchangeRate}).`,
        revaluedAccountsCount: 0,
        postedEntry: null
      };
    }

    // Get gain & loss accounts
    let gainAcc = await this.findAccountByCode('4201');
    let lossAcc = await this.findAccountByCode('5202');

    if (!gainAcc) {
      gainAcc = await this.upsertAccount({
        code: '4201',
        name: 'أرباح فروق العملة (Gain on FX)',
        type: 'revenue',
        balance: '0'
      });
    }
    if (!lossAcc) {
      lossAcc = await this.upsertAccount({
        code: '5202',
        name: 'خسائر فروق العملة (Loss on FX)',
        type: 'expense',
        balance: '0'
      });
    }

    const journalLinesToPost: JournalLineInput[] = [];

    let totalGain = 0;
    let totalLoss = 0;

    for (const [accId, item] of revaluedAccountsMap.entries()) {
      const diff = item.difference;
      // Asset account: positive diff -> Gain (Debit Asset, Credit Gain)
      // Asset account: negative diff -> Loss (Debit Loss, Credit Asset)
      if (item.account.type === 'asset' || item.account.type === 'expense') {
        if (diff > 0) {
          journalLinesToPost.push({
            accountId: accId,
            debit: diff,
            credit: 0,
            currency: baseCurrencyCode,
            exchangeRate: 1.0,
            description: `إعادة تقييم عملة ${currencyCode} - زيادة قيمة الأصل`
          });
          totalGain += diff;
        } else {
          journalLinesToPost.push({
            accountId: accId,
            debit: 0,
            credit: Math.abs(diff),
            currency: baseCurrencyCode,
            exchangeRate: 1.0,
            description: `إعادة تقييم عملة ${currencyCode} - انخفاض قيمة الأصل`
          });
          totalLoss += Math.abs(diff);
        }
      } else {
        // Liability/Revenue: positive diff means liability increased in base currency -> Loss
        if (diff > 0) {
          journalLinesToPost.push({
            accountId: accId,
            debit: 0,
            credit: diff,
            currency: baseCurrencyCode,
            exchangeRate: 1.0,
            description: `إعادة تقييم عملة ${currencyCode} - زيادة الالتزام`
          });
          totalLoss += diff;
        } else {
          journalLinesToPost.push({
            accountId: accId,
            debit: Math.abs(diff),
            credit: 0,
            currency: baseCurrencyCode,
            exchangeRate: 1.0,
            description: `إعادة تقييم عملة ${currencyCode} - انخفاض الالتزام`
          });
          totalGain += Math.abs(diff);
        }
      }
    }

    if (totalGain > 0) {
      journalLinesToPost.push({
        accountId: gainAcc.id,
        debit: 0,
        credit: Number(totalGain.toFixed(2)),
        currency: baseCurrencyCode,
        exchangeRate: 1.0,
        description: `إجمالي أرباح إعادة تقييم العملة (${currencyCode})`
      });
    }

    if (totalLoss > 0) {
      journalLinesToPost.push({
        accountId: lossAcc.id,
        debit: Number(totalLoss.toFixed(2)),
        credit: 0,
        currency: baseCurrencyCode,
        exchangeRate: 1.0,
        description: `إجمالي خسائر إعادة تقييم العملة (${currencyCode})`
      });
    }

    const entryNum = 'REV-' + currencyCode + '-' + Math.random().toString(36).substr(2, 6).toUpperCase();
    const entryDesc = `قيد تسوية إعادة تقييم عملة ${currencyCode} بتاريخ ${revaluationDate} بسعر صرف ${newExchangeRate}`;

    const postedEntry = await this.postJournalEntry(
      entryNum,
      entryDesc,
      revaluationDate,
      journalLinesToPost,
      { currency: currencyCode, exchangeRate: newExchangeRate }
    );

    // Update current active currency exchange rate
    const currList = await db.select().from(currencies).where(eq(currencies.code, currencyCode));
    if (currList.length > 0) {
      await db.update(currencies)
        .set({ exchangeRate: newExchangeRate.toString(), updatedAt: new Date() })
        .where(eq(currencies.code, currencyCode));
    }

    return {
      message: `تمت عملية إعادة التقييم لعملة (${currencyCode}) بنجاح وإصدار قيد التسوية المحاسبي.`,
      revaluedAccountsCount: revaluedAccountsMap.size,
      revaluedAccounts: Array.from(revaluedAccountsMap.values()),
      postedEntry
    };
  }

  // 4. GENERAL LEDGER
  static async getGeneralLedger(accountId: string, startDate?: string, endDate?: string, filterCurrency?: string) {
    const account = await this.findAccountById(accountId);
    if (!account) {
      throw new Error('الحساب غير موجود');
    }

    let details = await db.select().from(journalDetails).where(eq(journalDetails.accountId, accountId));
    if (filterCurrency && filterCurrency !== 'ALL') {
      details = details.filter(d => d.currency === filterCurrency);
    }

    const entryIds = Array.from(new Set(details.map(d => d.journalEntryId)));
    
    const allEntries = entryIds.length > 0
      ? await db.select().from(journalEntries).where(inArray(journalEntries.id, entryIds))
      : [];

    const entriesMap = new Map(allEntries.map(e => [e.id, e]));
    const defaultBaseCode = await CurrencyRepository.getBaseCurrencyCode();
    const isDebitNormal = account.type === 'asset' || account.type === 'expense';

    // Sort all details chronologically by entry date and number
    const sortedDetails = details
      .filter(d => entriesMap.has(d.journalEntryId))
      .map(d => ({
        detail: d,
        entry: entriesMap.get(d.journalEntryId)!
      }))
      .sort((a, b) => a.entry.date.localeCompare(b.entry.date) || a.entry.entryNumber.localeCompare(b.entry.entryNumber));

    let openingBaseBalance = 0;
    let openingForeignBalance = 0;
    const activeLines: any[] = [];

    for (const { detail: d, entry: parentEntry } of sortedDetails) {
      const debit = parseFloat(d.debit || '0');
      const credit = parseFloat(d.credit || '0');
      const foreignDebit = parseFloat(d.foreignDebit || '0');
      const foreignCredit = parseFloat(d.foreignCredit || '0');
      
      const baseChange = isDebitNormal ? (debit - credit) : (credit - debit);
      const foreignChange = isDebitNormal ? (foreignDebit - foreignCredit) : (foreignCredit - foreignDebit);

      if (startDate && parentEntry.date < startDate) {
        openingBaseBalance += baseChange;
        openingForeignBalance += foreignChange;
      } else if (!endDate || parentEntry.date <= endDate) {
        activeLines.push({
          id: d.id,
          journalEntryId: parentEntry.id,
          entryNumber: parentEntry.entryNumber,
          description: parentEntry.description,
          date: parentEntry.date,
          currency: d.currency || parentEntry.currency || defaultBaseCode,
          exchangeRate: parseFloat(d.exchangeRate || parentEntry.exchangeRate || '1.0'),
          foreignDebit,
          foreignCredit,
          debit,
          credit,
          baseChange,
          foreignChange
        });
      }
    }

    let cumulativeBaseBalance = openingBaseBalance;
    let cumulativeForeignBalance = openingForeignBalance;

    const lines = activeLines.map(l => {
      cumulativeBaseBalance += l.baseChange;
      cumulativeForeignBalance += l.foreignChange;

      return {
        ...l,
        runningBaseBalance: cumulativeBaseBalance,
        runningForeignBalance: cumulativeForeignBalance
      };
    });

    return {
      account: {
        ...account,
        balance: Number(account.balance) || 0,
        foreignBalance: Number(account.foreignBalance) || 0
      },
      openingBaseBalance,
      openingForeignBalance,
      lines,
      totalDebit: lines.reduce((s, l) => s + l.debit, 0),
      totalCredit: lines.reduce((s, l) => s + l.credit, 0),
      totalForeignDebit: lines.reduce((s, l) => s + l.foreignDebit, 0),
      totalForeignCredit: lines.reduce((s, l) => s + l.foreignCredit, 0),
      endingBaseBalance: cumulativeBaseBalance,
      endingForeignBalance: cumulativeForeignBalance
    };
  }

  // 5. TRIAL BALANCE REPORT
  static async getTrialBalance(filterCurrency?: string) {
    const baseCode = await CurrencyRepository.getBaseCurrencyCode();
    const allAccounts = await db.select().from(accounts);
    let allDetails = await db.select().from(journalDetails);

    if (filterCurrency && filterCurrency !== 'ALL') {
      allDetails = allDetails.filter(d => d.currency === filterCurrency);
    }

    const trialBalanceRows = allAccounts.map(acc => {
      const accDetails = allDetails.filter(d => d.accountId === acc.id);
      const totalDebit = accDetails.reduce((sum, d) => sum + parseFloat(d.debit || '0'), 0);
      const totalCredit = accDetails.reduce((sum, d) => sum + parseFloat(d.credit || '0'), 0);
      const totalForeignDebit = accDetails.reduce((sum, d) => sum + parseFloat(d.foreignDebit || '0'), 0);
      const totalForeignCredit = accDetails.reduce((sum, d) => sum + parseFloat(d.foreignCredit || '0'), 0);
      
      const balance = parseFloat(acc.balance || '0');
      const isDebitSide = acc.type === 'asset' || acc.type === 'expense';

      return {
        id: acc.id,
        code: acc.code,
        name: acc.name,
        type: acc.type,
        currency: acc.currency || baseCode,
        parentId: acc.parentId,
        totalDebit,
        totalCredit,
        totalForeignDebit,
        totalForeignCredit,
        debitBalance: isDebitSide ? balance : 0,
        creditBalance: !isDebitSide ? balance : 0,
        netBalance: balance
      };
    });

    const totalDebitSum = trialBalanceRows.reduce((sum, r) => sum + r.debitBalance, 0);
    const totalCreditSum = trialBalanceRows.reduce((sum, r) => sum + r.creditBalance, 0);
    const isBalanced = Math.abs(totalDebitSum - totalCreditSum) < 0.01;

    return {
      rows: trialBalanceRows,
      totalDebit: totalDebitSum,
      totalCredit: totalCreditSum,
      isBalanced
    };
  }

  // 6. JOURNAL ENTRIES QUERY
  static async getJournalEntries(search?: string, date?: string, currencyFilter?: string, statusFilter?: string) {
    const baseCode = await CurrencyRepository.getBaseCurrencyCode();
    let entries = await db.select().from(journalEntries).orderBy(desc(journalEntries.date), desc(journalEntries.createdAt));

    if (search) {
      const term = search.toLowerCase();
      entries = entries.filter(e => 
        (e.description && e.description.toLowerCase().includes(term)) || 
        e.entryNumber.toLowerCase().includes(term) ||
        (e.reference && e.reference.toLowerCase().includes(term))
      );
    }
    if (date) {
      entries = entries.filter(e => e.date === date);
    }
    if (currencyFilter && currencyFilter !== 'ALL') {
      entries = entries.filter(e => e.currency === currencyFilter);
    }
    if (statusFilter && statusFilter !== 'ALL') {
      entries = entries.filter(e => e.status === statusFilter);
    }

    const entryIds = entries.map(e => e.id);
    const allLines = entryIds.length > 0
      ? await db.select().from(journalLines).where(inArray(journalLines.journalEntryId, entryIds))
      : [];

    const accountIds = Array.from(new Set(allLines.map(l => l.accountId)));
    const accountsList = accountIds.length > 0
      ? await db.select().from(accounts).where(inArray(accounts.id, accountIds))
      : [];
    const accountsMap = new Map(accountsList.map(a => [a.id, a]));

    return entries.map(entry => {
      const entryLines = allLines.filter(l => l.journalEntryId === entry.id).map(l => {
        const acc = accountsMap.get(l.accountId);
        return {
          id: l.id,
          accountId: l.accountId,
          accountCode: acc?.code || '',
          accountName: acc?.name || '',
          accountType: acc?.type || '',
          currency: l.currency || entry.currency || baseCode,
          exchangeRate: parseFloat(l.exchangeRate || entry.exchangeRate || '1.0'),
          foreignDebit: parseFloat(l.foreignDebit || '0'),
          foreignCredit: parseFloat(l.foreignCredit || '0'),
          debit: parseFloat(l.debit || '0'),
          credit: parseFloat(l.credit || '0'),
          description: l.description || entry.description
        };
      });

      return {
        ...entry,
        foreignAmount: parseFloat(entry.foreignAmount || '0'),
        baseAmount: parseFloat(entry.baseAmount || '0'),
        exchangeRate: parseFloat(entry.exchangeRate || '1.0'),
        lines: entryLines,
        details: entryLines // backward compatibility
      };
    });
  }

  // 7. POSTING RULES
  static async getPostingRules() {
    return await db.select().from(postingRules);
  }

  static async findPostingRuleByCode(ruleCode: string) {
    const res = await db.select().from(postingRules).where(eq(postingRules.ruleCode, ruleCode));
    return res[0] || null;
  }

  static async upsertPostingRule(ruleCode: string, accountId: string) {
    const existing = await db.select().from(postingRules).where(eq(postingRules.ruleCode, ruleCode));
    if (existing.length > 0) {
      await db.update(postingRules).set({ accountId }).where(eq(postingRules.ruleCode, ruleCode));
    } else {
      await db.insert(postingRules).values({
        id: 'pr_' + Math.random().toString(36).substr(2, 9),
        ruleCode,
        description: ruleCode,
        accountId
      });
    }
    return { ruleCode, accountId };
  }

  // 8. EXPENSES
  static async getExpenses() {
    return await db.select().from(expenses);
  }

  static async createExpense(data: any) {
    await db.insert(expenses).values(data);
    return data;
  }

  static async deleteExpense(id: string) {
    await db.delete(expenses).where(eq(expenses.id, id));
    return { success: true };
  }

  // 9. OTHER ENTITIES
  static async getCurrencies() {
    return await db.select().from(currencies);
  }

  static async getTaxes() {
    return await db.select().from(taxes);
  }

  static async getPaymentMethods() {
    return await db.select().from(paymentMethods);
  }

  static async getCashboxes() {
    return await db.select().from(cashboxes);
  }
}
