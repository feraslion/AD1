import { db } from '../database/index.ts';
import { 
  accounts, 
  journalEntries, 
  journalDetails, 
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
  debit: number;
  credit: number;
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
    return dbValue;
  }

  static async deleteAccount(id: string) {
    const existingDetails = await db.select().from(journalDetails).where(eq(journalDetails.accountId, id));
    if (existingDetails.length > 0) {
      throw new Error('لا يمكن حذف الحساب نظراً لوجود قيود محاسبية مسجلة عليه.');
    }
    await db.delete(accounts).where(eq(accounts.id, id));
    return { success: true };
  }

  // 2. DOUBLE-ENTRY POSTING ENGINE (DEBIT = CREDIT ENFORCED)
  static async postJournalEntry(
    entryNumber: string, 
    description: string, 
    date: string, 
    lines: JournalLineInput[]
  ) {
    if (!lines || lines.length < 2) {
      throw new Error('يجب أن يحتوي القيد على سطرين محاسبيين على الأقل (مدين ودائن).');
    }

    const totalDebit = lines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
    const totalCredit = lines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0);
    
    const roundedDebit = Math.round(totalDebit * 100) / 100;
    const roundedCredit = Math.round(totalCredit * 100) / 100;

    if (Math.abs(roundedDebit - roundedCredit) > 0.01) {
      throw new Error(`القيد غير متزن! إجمالي المدين (${roundedDebit.toFixed(2)}) لا يساوي إجمالي الدائن (${roundedCredit.toFixed(2)}).`);
    }

    const entryId = 'je_' + Math.random().toString(36).substr(2, 9);
    
    await db.insert(journalEntries).values({
      id: entryId,
      entryNumber,
      description,
      date,
      status: 'posted'
    });

    const accountIds = Array.from(new Set(lines.map(line => line.accountId)));
    const accountsList = accountIds.length > 0 
      ? await db.select().from(accounts).where(inArray(accounts.id, accountIds))
      : [];

    const accountsMap = new Map(accountsList.map(acc => [acc.id, acc]));

    const detailValues = lines.map(line => ({
      id: 'jd_' + Math.random().toString(36).substr(2, 9),
      journalEntryId: entryId,
      accountId: line.accountId,
      debit: (line.debit || 0).toString(),
      credit: (line.credit || 0).toString()
    }));

    await db.insert(journalDetails).values(detailValues);

    // Update account balances atomically based on account types
    for (const line of lines) {
      const account = accountsMap.get(line.accountId);
      if (account) {
        let currentBal = parseFloat(account.balance || '0');
        const netChange = (line.debit || 0) - (line.credit || 0);
        
        // Debit increases assets and expenses; decreases liabilities, equity, and revenues
        if (account.type === 'asset' || account.type === 'expense') {
          currentBal += netChange;
        } else {
          currentBal -= netChange; 
        }

        await db.update(accounts)
          .set({ balance: currentBal.toString() })
          .where(eq(accounts.id, line.accountId));
      }
    }

    return { id: entryId, entryNumber, totalDebit: roundedDebit, totalCredit: roundedCredit };
  }

  // 3. GENERAL LEDGER
  static async getGeneralLedger(accountId: string, startDate?: string, endDate?: string) {
    const account = await this.findAccountById(accountId);
    if (!account) {
      throw new Error('الحساب غير موجود');
    }

    const details = await db.select().from(journalDetails).where(eq(journalDetails.accountId, accountId));
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

    let cumulativeBalance = 0;
    const isDebitNormal = account.type === 'asset' || account.type === 'expense';

    const lines = details
      .filter(d => entriesMap.has(d.journalEntryId))
      .map(d => {
        const parentEntry = entriesMap.get(d.journalEntryId)!;
        const debit = parseFloat(d.debit || '0');
        const credit = parseFloat(d.credit || '0');
        
        const change = isDebitNormal ? (debit - credit) : (credit - debit);
        cumulativeBalance += change;

        return {
          id: d.id,
          journalEntryId: parentEntry.id,
          entryNumber: parentEntry.entryNumber,
          description: parentEntry.description,
          date: parentEntry.date,
          debit,
          credit,
          runningBalance: cumulativeBalance
        };
      })
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      account: {
        ...account,
        balance: parseFloat(account.balance || '0')
      },
      lines,
      totalDebit: lines.reduce((s, l) => s + l.debit, 0),
      totalCredit: lines.reduce((s, l) => s + l.credit, 0),
      endingBalance: cumulativeBalance
    };
  }

  // 4. TRIAL BALANCE REPORT
  static async getTrialBalance() {
    const allAccounts = await db.select().from(accounts);
    const allDetails = await db.select().from(journalDetails);

    const trialBalanceRows = allAccounts.map(acc => {
      const accDetails = allDetails.filter(d => d.accountId === acc.id);
      const totalDebit = accDetails.reduce((sum, d) => sum + parseFloat(d.debit || '0'), 0);
      const totalCredit = accDetails.reduce((sum, d) => sum + parseFloat(d.credit || '0'), 0);
      
      const balance = parseFloat(acc.balance || '0');
      const isDebitSide = acc.type === 'asset' || acc.type === 'expense';

      return {
        id: acc.id,
        code: acc.code,
        name: acc.name,
        type: acc.type,
        parentId: acc.parentId,
        totalDebit,
        totalCredit,
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

  // 5. JOURNAL ENTRIES QUERY
  static async getJournalEntries(search?: string, date?: string) {
    let entries = await db.select().from(journalEntries).orderBy(desc(journalEntries.date));

    if (search) {
      const term = search.toLowerCase();
      entries = entries.filter(e => e.description.toLowerCase().includes(term) || e.entryNumber.toLowerCase().includes(term));
    }
    if (date) {
      entries = entries.filter(e => e.date === date);
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
        debit: parseFloat(d.debit || '0'),
        credit: parseFloat(d.credit || '0')
      }))
    }));
  }

  // 6. POSTING RULES
  static async getPostingRules() {
    return await db.select().from(postingRules);
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

  // 7. EXPENSES
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

  // 8. OTHER ENTITIES
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
