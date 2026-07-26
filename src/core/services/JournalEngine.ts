import { db } from '../database/index.ts';
import { 
  accounts, 
  journalEntries, 
  journalDetails,
  journalLines 
} from '../database/schema.ts';
import { eq, desc, inArray } from 'drizzle-orm';
import { CurrencyRepository } from '../repositories/CurrencyRepository.ts';

export interface JournalLineInput {
  accountId: string;
  debit: number; // Base currency debit amount
  credit: number; // Base currency credit amount
  currency?: string; // Transaction currency (USD, SYP, TRY, SAR)
  exchangeRate?: number; // Rate vs base currency
  foreignDebit?: number; // Amount in transaction currency
  foreignCredit?: number; // Amount in transaction currency
  description?: string;
}

export interface PostJournalOptions {
  reference?: string;
  currency?: string;
  baseCurrency?: string;
  exchangeRate?: number;
  foreignAmount?: number;
  baseAmount?: number;
  status?: 'draft' | 'posted';
  createdBy?: string;
}

export interface AccuracyTestResult {
  isTrialBalanceEqual: boolean;
  totalGLDebit: number;
  totalGLCredit: number;
  unbalancedEntriesCount: number;
  unbalancedEntries: any[];
  totalEntriesCount: number;
  postedEntriesCount: number;
  draftEntriesCount: number;
  reversedEntriesCount: number;
  activeAccountsCount: number;
  checkedAt: string;
}

export class JournalEngine {
  /**
   * Validate double entry arithmetic and account status
   */
  static async validateLines(lines: JournalLineInput[], options?: PostJournalOptions) {
    if (!lines || !Array.isArray(lines) || lines.length < 2) {
      throw new Error('يجب أن يحتوي القيد المحاسبي على سطرين على الأقل (مدين ودائن).');
    }

    const baseCurrency = options?.baseCurrency || await CurrencyRepository.getBaseCurrencyCode();
    const globalCurrency = options?.currency || lines[0]?.currency || baseCurrency;
    const globalRate = options?.exchangeRate || lines[0]?.exchangeRate || 1.0;

    let totalBaseDebit = 0;
    let totalBaseCredit = 0;
    let totalForeignDebit = 0;
    let totalForeignCredit = 0;

    const normalizedLines = [];

    for (const line of lines) {
      if (!line.accountId) {
        throw new Error('يجب تحديد الحساب المالي لكافة سطور القيد المحاسبي.');
      }

      const [acc] = await db.select().from(accounts).where(eq(accounts.id, line.accountId));
      if (!acc) {
        throw new Error(`الحساب المالي (ID: ${line.accountId}) غير موجود في شجرة الحسابات.`);
      }
      if (acc.isActive === false) {
        throw new Error(`الحساب المالي (${acc.name} - ${acc.code}) معطل ولا يمكن التسجيل عليه.`);
      }

      const lineCurrency = line.currency || globalCurrency;
      const rate = Number(line.exchangeRate) || Number(globalRate) || 1.0;

      let fDebit = Math.max(0, Number(line.foreignDebit) || 0);
      let fCredit = Math.max(0, Number(line.foreignCredit) || 0);
      let bDebit = Math.max(0, Number(line.debit) || 0);
      let bCredit = Math.max(0, Number(line.credit) || 0);

      // Auto compute conversion
      if (fDebit > 0 && bDebit === 0) bDebit = fDebit * rate;
      if (fCredit > 0 && bCredit === 0) bCredit = fCredit * rate;
      if (bDebit > 0 && fDebit === 0) fDebit = rate > 0 ? bDebit / rate : bDebit;
      if (bCredit > 0 && fCredit === 0) fCredit = rate > 0 ? bCredit / rate : bCredit;

      totalBaseDebit += bDebit;
      totalBaseCredit += bCredit;
      totalForeignDebit += fDebit;
      totalForeignCredit += fCredit;

      normalizedLines.push({
        ...line,
        currency: lineCurrency,
        exchangeRate: rate,
        foreignDebit: fDebit,
        foreignCredit: fCredit,
        debit: bDebit,
        credit: bCredit,
        accountCode: acc.code,
        accountName: acc.name,
        accountType: acc.type
      });
    }

    const roundedBaseDebit = Math.round(totalBaseDebit * 100) / 100;
    const roundedBaseCredit = Math.round(totalBaseCredit * 100) / 100;
    const difference = Math.abs(roundedBaseDebit - roundedBaseCredit);

    const isBalanced = difference <= 0.01;

    return {
      normalizedLines,
      baseCurrency,
      globalCurrency,
      globalRate,
      totalBaseDebit: roundedBaseDebit,
      totalBaseCredit: roundedBaseCredit,
      totalForeignDebit: Math.round(totalForeignDebit * 100) / 100,
      totalForeignCredit: Math.round(totalForeignCredit * 100) / 100,
      isBalanced,
      difference
    };
  }

  /**
   * Post or save a journal entry with strict double-entry balance check
   */
  static async postJournalEntry(
    entryNumber: string,
    description: string,
    date: string,
    lines: JournalLineInput[],
    options?: PostJournalOptions
  ) {
    const status = options?.status || 'posted';

    const validation = await this.validateLines(lines, options);

    if (status === 'posted' && !validation.isBalanced) {
      throw new Error(
        `القيد غير متزن! إجمالي المدين (${validation.totalBaseDebit.toFixed(2)} ${validation.baseCurrency}) لا يساوي إجمالي الدائن (${validation.totalBaseCredit.toFixed(2)} ${validation.baseCurrency}). الفرق: ${validation.difference.toFixed(2)}`
      );
    }

    const entryId = 'je_' + Math.random().toString(36).substr(2, 9);
    const foreignAmount = Math.max(validation.totalForeignDebit, validation.totalForeignCredit);
    const baseAmount = validation.totalBaseDebit;

    await db.insert(journalEntries).values({
      id: entryId,
      entryNumber,
      reference: options?.reference || null,
      description,
      date,
      status,
      currency: validation.globalCurrency,
      baseCurrency: validation.baseCurrency,
      exchangeRate: validation.globalRate.toString(),
      foreignAmount: foreignAmount.toString(),
      baseAmount: baseAmount.toString(),
      createdBy: options?.createdBy || 'المحاسب المالي'
    });

    const detailValues = validation.normalizedLines.map(line => ({
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

    const lineValues = validation.normalizedLines.map(line => ({
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

    // Update account balances only if entry status is 'posted'
    if (status === 'posted') {
      await this.updateAccountBalances(validation.normalizedLines);
    }

    return {
      id: entryId,
      entryNumber,
      reference: options?.reference || null,
      description,
      date,
      status,
      totalDebit: validation.totalBaseDebit,
      totalCredit: validation.totalBaseCredit,
      currency: validation.globalCurrency,
      baseCurrency: validation.baseCurrency,
      foreignAmount,
      baseAmount
    };
  }

  /**
   * Post a draft entry (transitions status from 'draft' to 'posted' and updates GL account balances)
   */
  static async postDraftEntry(entryId: string) {
    const [entry] = await db.select().from(journalEntries).where(eq(journalEntries.id, entryId));
    if (!entry) throw new Error('القيد غير موجود');
    if (entry.status !== 'draft') {
      throw new Error(`القيد بالحالة (${entry.status}) ولا يمكن ترحيله كقيد مسودة.`);
    }

    const lines = await db.select().from(journalLines).where(eq(journalLines.journalEntryId, entryId));
    const linesInput: JournalLineInput[] = lines.map(l => ({
      accountId: l.accountId,
      debit: parseFloat(l.debit || '0'),
      credit: parseFloat(l.credit || '0'),
      currency: l.currency || entry.currency || 'SAR',
      exchangeRate: parseFloat(l.exchangeRate || '1.0'),
      foreignDebit: parseFloat(l.foreignDebit || '0'),
      foreignCredit: parseFloat(l.foreignCredit || '0'),
      description: l.description || entry.description || ''
    }));

    const validation = await this.validateLines(linesInput, {
      currency: entry.currency || 'SAR',
      baseCurrency: entry.baseCurrency || 'SAR',
      exchangeRate: parseFloat(entry.exchangeRate || '1.0')
    });

    if (!validation.isBalanced) {
      throw new Error(`القيد المسودة غير متزن! المدين: ${validation.totalBaseDebit} والدائن: ${validation.totalBaseCredit}`);
    }

    // Update status to posted
    await db.update(journalEntries)
      .set({ status: 'posted', updatedAt: new Date() })
      .where(eq(journalEntries.id, entryId));

    // Update account balances
    await this.updateAccountBalances(validation.normalizedLines);

    return { success: true, entryId, status: 'posted' };
  }

  /**
   * Safely reverse a posted journal entry with strict audit trail
   */
  static async reverseJournalEntry(entryId: string, reason: string, createdBy?: string) {
    const [entry] = await db.select().from(journalEntries).where(eq(journalEntries.id, entryId));
    if (!entry) throw new Error('القيد المحاسبي غير موجود.');
    if (entry.status !== 'posted') {
      throw new Error('يمكن عكس القيود المحاسبية المرحّلة فقط.');
    }

    const originalLines = await db.select().from(journalLines).where(eq(journalLines.journalEntryId, entryId));
    if (originalLines.length === 0) {
      throw new Error('سطور القيد المحاسبي غير موجودة.');
    }

    // Swap Debits and Credits
    const reversingLines: JournalLineInput[] = originalLines.map(line => ({
      accountId: line.accountId,
      debit: parseFloat(line.credit || '0'), // Original credit becomes debit
      credit: parseFloat(line.debit || '0'), // Original debit becomes credit
      foreignDebit: parseFloat(line.foreignCredit || '0'),
      foreignCredit: parseFloat(line.foreignDebit || '0'),
      currency: line.currency || entry.currency || 'SAR',
      exchangeRate: parseFloat(line.exchangeRate || '1.0'),
      description: `عكس قيد رقم (${entry.entryNumber}) - ${reason}`
    }));

    const revEntryNum = `REV-${entry.entryNumber}`;
    const revDesc = `قيد عكسي للقيد رقم (${entry.entryNumber}) - السبب: ${reason}`;

    // Post the reversing entry
    const reversingResult = await this.postJournalEntry(
      revEntryNum,
      revDesc,
      new Date().toISOString().split('T')[0],
      reversingLines,
      {
        reference: `REF-REV-${entry.entryNumber}`,
        currency: entry.currency || 'SAR',
        baseCurrency: entry.baseCurrency || 'SAR',
        exchangeRate: parseFloat(entry.exchangeRate || '1.0'),
        status: 'posted',
        createdBy: createdBy || 'نظام الرقابة والتأقيق'
      }
    );

    // Update original entry status to 'reversed' and set reversedEntryId link
    await db.update(journalEntries)
      .set({ 
        status: 'reversed', 
        reversedEntryId: reversingResult.id,
        updatedAt: new Date() 
      })
      .where(eq(journalEntries.id, entryId));

    return {
      success: true,
      originalEntryId: entryId,
      reversingEntry: reversingResult,
      message: `تم إلغاء وعكس القيد المحاسبي (${entry.entryNumber}) بنجاح بقيد عكسي (${revEntryNum}).`
    };
  }

  /**
   * Internal helper to update account balances on posting
   */
  private static async updateAccountBalances(normalizedLines: any[]) {
    const accountIds = Array.from(new Set(normalizedLines.map(line => line.accountId)));
    const accountsList = await db.select().from(accounts).where(inArray(accounts.id, accountIds));
    const accountsMap = new Map(accountsList.map(a => [a.id, a]));

    for (const line of normalizedLines) {
      const acc = accountsMap.get(line.accountId);
      if (acc) {
        let bal = parseFloat(acc.balance || '0');
        let foreignBal = parseFloat(acc.foreignBalance || '0');

        const baseNet = line.debit - line.credit;
        const foreignNet = line.foreignDebit - line.foreignCredit;

        // Assets and Expenses have debit normal balance
        if (acc.type === 'asset' || acc.type === 'expense') {
          bal += baseNet;
          foreignBal += foreignNet;
        } else {
          bal -= baseNet;
          foreignBal -= foreignNet;
        }

        await db.update(accounts)
          .set({
            balance: bal.toString(),
            foreignBalance: foreignBal.toString(),
            updatedAt: new Date()
          })
          .where(eq(accounts.id, line.accountId));
      }
    }
  }

  /**
   * Run complete accounting accuracy & audit check
   */
  static async verifyAccountingIntegrity(): Promise<AccuracyTestResult> {
    const allEntries = await db.select().from(journalEntries);
    const allLines = await db.select().from(journalLines);
    const allAccounts = await db.select().from(accounts);

    let totalGLDebit = 0;
    let totalGLCredit = 0;

    for (const l of allLines) {
      const d = parseFloat(l.debit || '0');
      const c = parseFloat(l.credit || '0');
      totalGLDebit += d;
      totalGLCredit += c;
    }

    const isTrialBalanceEqual = Math.abs(totalGLDebit - totalGLCredit) <= 0.01;

    const unbalancedEntries: any[] = [];

    for (const entry of allEntries) {
      const entryLines = allLines.filter(l => l.journalEntryId === entry.id);
      const entryDebit = entryLines.reduce((s, l) => s + parseFloat(l.debit || '0'), 0);
      const entryCredit = entryLines.reduce((s, l) => s + parseFloat(l.credit || '0'), 0);

      if (Math.abs(entryDebit - entryCredit) > 0.01) {
        unbalancedEntries.push({
          id: entry.id,
          entryNumber: entry.entryNumber,
          description: entry.description,
          debit: entryDebit,
          credit: entryCredit,
          diff: Math.abs(entryDebit - entryCredit)
        });
      }
    }

    return {
      isTrialBalanceEqual,
      totalGLDebit: Math.round(totalGLDebit * 100) / 100,
      totalGLCredit: Math.round(totalGLCredit * 100) / 100,
      unbalancedEntriesCount: unbalancedEntries.length,
      unbalancedEntries,
      totalEntriesCount: allEntries.length,
      postedEntriesCount: allEntries.filter(e => e.status === 'posted').length,
      draftEntriesCount: allEntries.filter(e => e.status === 'draft').length,
      reversedEntriesCount: allEntries.filter(e => e.status === 'reversed').length,
      activeAccountsCount: allAccounts.filter(a => a.isActive !== false).length,
      checkedAt: new Date().toISOString()
    };
  }
}
