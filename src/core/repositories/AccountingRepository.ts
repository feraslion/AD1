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
  static async getAccounts() {
    return await db.select().from(accounts);
  }

  static async findAccountById(id: string) {
    const res = await db.select().from(accounts).where(eq(accounts.id, id));
    return res[0] || null;
  }

  static async findAccountByCode(code: string) {
    const res = await db.select().from(accounts).where(eq(accounts.code, code));
    return res[0] || null;
  }

  static async upsertAccount(data: any) {
    const accountId = data.id || 'acc_' + Math.random().toString(36).substr(2, 9);
    const dbValue = {
      id: accountId,
      code: data.code,
      name: data.name,
      type: data.type,
      balance: (data.balance || 0).toString(),
      currency: data.currency || 'SAR',
      foreignBalance: (data.foreignBalance || 0).toString(),
      parentId: data.parentId || null,
      companyId: data.companyId || null,
      branchId: data.branchId || null
    };

    const existing = await this.findAccountById(accountId);
    if (existing) {
      await db.update(accounts).set(dbValue).where(eq(accounts.id, accountId));
    } else {
      await db.insert(accounts).values(dbValue);
    }
    const updated = await this.findAccountById(accountId);
    return updated!;
  }

  static async deleteAccount(id: string) {
    const existingDetails = await db.select().from(journalDetails).where(eq(journalDetails.accountId, id));
    if (existingDetails.length > 0) {
      throw new Error('لا يمكن حذف الحساب نظراً لوجود قيود محاسبية مسجلة عليه.');
    }
    await db.delete(accounts).where(eq(accounts.id, id));
    return { success: true };
  }

  // 2. DOUBLE-ENTRY MULTI-CURRENCY POSTING ENGINE
  static async postJournalEntry(
    entryNumber: string, 
    description: string, 
    date: string, 
    lines: JournalLineInput[],
    options?: PostJournalEntryOptions
  ) {
    if (!lines || lines.length < 2) {
      throw new Error('يجب أن يحتوي القيد على سطرين محاسبيين على الأقل (مدين ودائن).');
    }

    const transactionCurrency = options?.currency || lines[0].currency || 'SAR';
    const baseCurrency = options?.baseCurrency || 'SAR';
    const globalRate = options?.exchangeRate || lines[0].exchangeRate || 1.0;

    // Calculate and validate base currency debit/credit totals
    let totalBaseDebit = 0;
    let totalBaseCredit = 0;
    let totalForeignDebit = 0;
    let totalForeignCredit = 0;

    const normalizedLines = lines.map(line => {
      const lineCurrency = line.currency || transactionCurrency;
      const rate = line.exchangeRate || globalRate;

      let fDebit = Number(line.foreignDebit) || 0;
      let fCredit = Number(line.foreignCredit) || 0;
      let bDebit = Number(line.debit) || 0;
      let bCredit = Number(line.credit) || 0;

      // Auto-compute base amount if foreign amount provided and base amount is zero
      if (fDebit > 0 && bDebit === 0) {
        bDebit = fDebit * rate;
      }
      if (fCredit > 0 && bCredit === 0) {
        bCredit = fCredit * rate;
      }

      // Auto-compute foreign amount if base amount provided and foreign amount is zero
      if (bDebit > 0 && fDebit === 0) {
        fDebit = rate > 0 ? bDebit / rate : bDebit;
      }
      if (bCredit > 0 && fCredit === 0) {
        fCredit = rate > 0 ? bCredit / rate : bCredit;
      }

      totalBaseDebit += bDebit;
      totalBaseCredit += bCredit;
      totalForeignDebit += fDebit;
      totalForeignCredit += fCredit;

      return {
        ...line,
        currency: lineCurrency,
        exchangeRate: rate,
        foreignDebit: fDebit,
        foreignCredit: fCredit,
        debit: bDebit,
        credit: bCredit
      };
    });

    const roundedBaseDebit = Math.round(totalBaseDebit * 100) / 100;
    const roundedBaseCredit = Math.round(totalBaseCredit * 100) / 100;

    // Strict Double-Entry Balance Enforcement in Base Currency
    if (Math.abs(roundedBaseDebit - roundedBaseCredit) > 0.01) {
      throw new Error(`القيد غير متزن بالعملة الأساسية! إجمالي المدين (${roundedBaseDebit.toFixed(2)} ${baseCurrency}) لا يساوي إجمالي الدائن (${roundedBaseCredit.toFixed(2)} ${baseCurrency}).`);
    }

    const entryId = 'je_' + Math.random().toString(36).substr(2, 9);
    
    await db.insert(journalEntries).values({
      id: entryId,
      entryNumber,
      description,
      date,
      status: 'posted',
      currency: transactionCurrency,
      baseCurrency,
      exchangeRate: globalRate.toString(),
      foreignAmount: Math.max(totalForeignDebit, totalForeignCredit).toString(),
      baseAmount: roundedBaseDebit.toString()
    });

    const accountIds = Array.from(new Set(normalizedLines.map(line => line.accountId)));
    const accountsList = accountIds.length > 0 
      ? await db.select().from(accounts).where(inArray(accounts.id, accountIds))
      : [];

    const accountsMap = new Map(accountsList.map(acc => [acc.id, acc]));

    const detailValues = normalizedLines.map(line => ({
      id: 'jd_' + Math.random().toString(36).substr(2, 9),
      journalEntryId: entryId,
      accountId: line.accountId,
      currency: line.currency,
      exchangeRate: line.exchangeRate.toString(),
      foreignDebit: line.foreignDebit.toString(),
      foreignCredit: line.foreignCredit.toString(),
      debit: line.debit.toString(),
      credit: line.credit.toString()
    }));

    await db.insert(journalDetails).values(detailValues);

    const lineValues = normalizedLines.map(line => ({
      id: 'jl_' + Math.random().toString(36).substr(2, 9),
      journalEntryId: entryId,
      accountId: line.accountId,
      currency: line.currency,
      exchangeRate: line.exchangeRate.toString(),
      foreignDebit: line.foreignDebit.toString(),
      foreignCredit: line.foreignCredit.toString(),
      debit: line.debit.toString(),
      credit: line.credit.toString(),
      description: line.description || description
    }));

    await db.insert(journalLines).values(lineValues);

    // Update account balances atomically (both base and foreign balances)
    for (const line of normalizedLines) {
      const account = accountsMap.get(line.accountId);
      if (account) {
        let currentBal = parseFloat(account.balance || '0');
        let currentForeignBal = parseFloat(account.foreignBalance || '0');

        const netBaseChange = line.debit - line.credit;
        const netForeignChange = line.foreignDebit - line.foreignCredit;
        
        if (account.type === 'asset' || account.type === 'expense') {
          currentBal += netBaseChange;
          currentForeignBal += netForeignChange;
        } else {
          currentBal -= netBaseChange; 
          currentForeignBal -= netForeignChange;
        }

        await db.update(accounts)
          .set({ 
            balance: currentBal.toString(),
            foreignBalance: currentForeignBal.toString()
          })
          .where(eq(accounts.id, line.accountId));
      }
    }

    return { 
      id: entryId, 
      entryNumber, 
      totalDebit: roundedBaseDebit, 
      totalCredit: roundedBaseCredit,
      currency: transactionCurrency,
      foreignAmount: Math.max(totalForeignDebit, totalForeignCredit)
    };
  }

  // 3. CURRENCY REVALUATION ENGINE (إعادة تقييم العملات وإثبات الأرباح/الخسائر غير المحققة)
  static async revaluateForeignAccounts(currencyCode: string, newExchangeRate: number, revaluationDate: string) {
    if (!currencyCode || currencyCode === 'SAR') {
      throw new Error('لا تتطلب العملة الأساسية (SAR) عملية إعادة تقييم.');
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
            currency: 'SAR',
            exchangeRate: 1.0,
            description: `إعادة تقييم عملة ${currencyCode} - زيادة قيمة الأصل`
          });
          totalGain += diff;
        } else {
          journalLinesToPost.push({
            accountId: accId,
            debit: 0,
            credit: Math.abs(diff),
            currency: 'SAR',
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
            currency: 'SAR',
            exchangeRate: 1.0,
            description: `إعادة تقييم عملة ${currencyCode} - زيادة الالتزام`
          });
          totalLoss += diff;
        } else {
          journalLinesToPost.push({
            accountId: accId,
            debit: Math.abs(diff),
            credit: 0,
            currency: 'SAR',
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
        currency: 'SAR',
        exchangeRate: 1.0,
        description: `إجمالي أرباح إعادة تقييم العملة (${currencyCode})`
      });
    }

    if (totalLoss > 0) {
      journalLinesToPost.push({
        accountId: lossAcc.id,
        debit: Number(totalLoss.toFixed(2)),
        credit: 0,
        currency: 'SAR',
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
    
    let entries = entryIds.length > 0
      ? await db.select().from(journalEntries).where(inArray(journalEntries.id, entryIds))
      : [];

    if (startDate) {
      entries = entries.filter(e => e.date >= startDate);
    }
    if (endDate) {
      entries = entries.filter(e => e.date <= endDate);
    }

    const entriesMap = new Map(entries.map(e => [e.id, e]));

    let cumulativeBaseBalance = 0;
    let cumulativeForeignBalance = 0;
    const isDebitNormal = account.type === 'asset' || account.type === 'expense';

    const lines = details
      .filter(d => entriesMap.has(d.journalEntryId))
      .map(d => {
        const parentEntry = entriesMap.get(d.journalEntryId)!;
        const debit = parseFloat(d.debit || '0');
        const credit = parseFloat(d.credit || '0');
        const foreignDebit = parseFloat(d.foreignDebit || '0');
        const foreignCredit = parseFloat(d.foreignCredit || '0');
        
        const baseChange = isDebitNormal ? (debit - credit) : (credit - debit);
        const foreignChange = isDebitNormal ? (foreignDebit - foreignCredit) : (foreignCredit - foreignDebit);
        
        cumulativeBaseBalance += baseChange;
        cumulativeForeignBalance += foreignChange;

        return {
          id: d.id,
          journalEntryId: parentEntry.id,
          entryNumber: parentEntry.entryNumber,
          description: parentEntry.description,
          date: parentEntry.date,
          currency: d.currency || parentEntry.currency || 'SAR',
          exchangeRate: parseFloat(d.exchangeRate || parentEntry.exchangeRate || '1.0'),
          foreignDebit,
          foreignCredit,
          debit,
          credit,
          runningBaseBalance: cumulativeBaseBalance,
          runningForeignBalance: cumulativeForeignBalance
        };
      })
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      account: {
        ...account,
        balance: parseFloat(account.balance || '0'),
        foreignBalance: parseFloat(account.foreignBalance || '0')
      },
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
        currency: acc.currency || 'SAR',
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
  static async getJournalEntries(search?: string, date?: string, currencyFilter?: string) {
    let entries = await db.select().from(journalEntries).orderBy(desc(journalEntries.date));

    if (search) {
      const term = search.toLowerCase();
      entries = entries.filter(e => (e.description && e.description.toLowerCase().includes(term)) || e.entryNumber.toLowerCase().includes(term));
    }
    if (date) {
      entries = entries.filter(e => e.date === date);
    }
    if (currencyFilter && currencyFilter !== 'ALL') {
      entries = entries.filter(e => e.currency === currencyFilter);
    }

    const entryIds = entries.map(e => e.id);
    const allDetails = entryIds.length > 0
      ? await db.select().from(journalDetails).where(inArray(journalDetails.journalEntryId, entryIds))
      : [];

    return entries.map(entry => ({
      ...entry,
      details: allDetails.filter(d => d.journalEntryId === entry.id).map(d => ({
        id: d.id,
        accountId: d.accountId,
        currency: d.currency || entry.currency || 'SAR',
        exchangeRate: parseFloat(d.exchangeRate || entry.exchangeRate || '1.0'),
        foreignDebit: parseFloat(d.foreignDebit || '0'),
        foreignCredit: parseFloat(d.foreignCredit || '0'),
        debit: parseFloat(d.debit || '0'),
        credit: parseFloat(d.credit || '0')
      }))
    }));
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
