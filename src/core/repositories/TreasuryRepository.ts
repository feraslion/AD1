import { db } from '../database/index.ts';
import { 
  cashboxes, 
  bankAccounts, 
  treasuryTransactions, 
  bankReconciliations,
  accounts 
} from '../database/schema.ts';
import { eq, desc, and } from 'drizzle-orm';
import { AccountingRepository } from './AccountingRepository.ts';

export interface CashboxInput {
  id?: string;
  name: string;
  status?: string;
  currentBalance?: number;
  accountId?: string;
}

export interface BankAccountInput {
  id?: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  iban?: string;
  swift?: string;
  branch?: string;
  currency?: string;
  currentBalance?: number;
  accountId?: string;
  status?: string;
}

export interface DepositInput {
  destinationType: 'cashbox' | 'bank_account';
  destinationId: string;
  sourceType: 'customer' | 'revenue' | 'capital' | 'other';
  sourceAccountId?: string;
  amount: number;
  currency?: string;
  exchangeRate?: number;
  date: string;
  referenceNumber?: string;
  description: string;
}

export interface WithdrawalInput {
  sourceType: 'cashbox' | 'bank_account';
  sourceId: string;
  destinationType: 'supplier' | 'expense' | 'owner_draw' | 'other';
  destinationAccountId?: string;
  amount: number;
  currency?: string;
  exchangeRate?: number;
  date: string;
  referenceNumber?: string;
  description: string;
}

export interface TransferInput {
  sourceType: 'cashbox' | 'bank_account';
  sourceId: string;
  destinationType: 'cashbox' | 'bank_account';
  destinationId: string;
  amount: number;
  transferFee?: number;
  currency?: string;
  exchangeRate?: number;
  date: string;
  referenceNumber?: string;
  description: string;
}

export interface BankReconciliationInput {
  bankAccountId: string;
  statementDate: string;
  statementEndingBalance: number;
  ledgerEndingBalance: number;
  matchedTransactionIds: string[];
  notes?: string;
}

export class TreasuryRepository {
  // ─── 1. CASHBOXES ───
  static async getCashboxes() {
    try {
      const list = await db.select().from(cashboxes);
      if (list.length === 0) {
        // Initialize default main cashbox if empty
        const defaultBox = {
          id: 'cashbox_main',
          name: 'الخزينة الرئيسية (صندوق النقدية)',
          status: 'open',
          currentBalance: '5000.00',
          lastOpenedAt: new Date().toISOString()
        };
        await db.insert(cashboxes).values(defaultBox);
        return [{ ...defaultBox, currentBalance: 5000 }];
      }
      return list.map(b => ({
        ...b,
        currentBalance: parseFloat(b.currentBalance || '0')
      }));
    } catch (e) {
      console.error('Error fetching cashboxes:', e);
      return [];
    }
  }

  static async upsertCashbox(data: CashboxInput) {
    const id = data.id || 'cashbox_' + Math.random().toString(36).substr(2, 9);
    const existing = await db.select().from(cashboxes).where(eq(cashboxes.id, id));

    const dbValue = {
      id,
      name: data.name,
      status: data.status || 'open',
      currentBalance: (data.currentBalance || 0).toString(),
      lastOpenedAt: new Date().toISOString()
    };

    if (existing.length > 0) {
      await db.update(cashboxes).set(dbValue).where(eq(cashboxes.id, id));
    } else {
      await db.insert(cashboxes).values(dbValue);
    }
    return { ...dbValue, currentBalance: data.currentBalance || 0 };
  }

  static async deleteCashbox(id: string) {
    await db.delete(cashboxes).where(eq(cashboxes.id, id));
    return { success: true };
  }

  // ─── 2. BANK ACCOUNTS ───
  static async getBankAccounts() {
    try {
      const list = await db.select().from(bankAccounts);
      if (list.length === 0) {
        // Initialize default bank account if empty
        const defaultBank = {
          id: 'bank_main',
          bankName: 'مصرف الراجحي',
          accountName: 'الحساب الجاري الرئيسي',
          accountNumber: 'SA98800001234567890001',
          iban: 'SA98800001234567890001',
          swift: 'RJHIFA22',
          branch: 'الفرع الرئيسي - الرياض',
          currency: 'SAR',
          currentBalance: '25000.00',
          accountId: 'acc_bank',
          status: 'active'
        };
        await db.insert(bankAccounts).values(defaultBank);
        return [{ ...defaultBank, currentBalance: 25000 }];
      }
      return list.map(b => ({
        ...b,
        currentBalance: parseFloat(b.currentBalance || '0')
      }));
    } catch (e) {
      console.error('Error fetching bank accounts:', e);
      return [];
    }
  }

  static async upsertBankAccount(data: BankAccountInput) {
    const id = data.id || 'bank_' + Math.random().toString(36).substr(2, 9);
    const existing = await db.select().from(bankAccounts).where(eq(bankAccounts.id, id));

    const dbValue = {
      id,
      bankName: data.bankName,
      accountName: data.accountName,
      accountNumber: data.accountNumber,
      iban: data.iban || null,
      swift: data.swift || null,
      branch: data.branch || null,
      currency: data.currency || 'SAR',
      currentBalance: (data.currentBalance || 0).toString(),
      accountId: data.accountId || 'acc_bank',
      status: data.status || 'active',
      updatedAt: new Date()
    };

    if (existing.length > 0) {
      await db.update(bankAccounts).set(dbValue).where(eq(bankAccounts.id, id));
    } else {
      await db.insert(bankAccounts).values(dbValue);
    }
    return { ...dbValue, currentBalance: data.currentBalance || 0 };
  }

  static async deleteBankAccount(id: string) {
    await db.delete(bankAccounts).where(eq(bankAccounts.id, id));
    return { success: true };
  }

  // ─── 3. TRANSACTIONS LIST ───
  static async getTransactions(type?: string) {
    try {
      let query = db.select().from(treasuryTransactions).orderBy(desc(treasuryTransactions.createdAt));
      const list = await query;
      let filtered = list;
      if (type) {
        filtered = list.filter(t => t.transactionType === type);
      }
      return filtered.map(t => ({
        ...t,
        amount: parseFloat(t.amount || '0'),
        exchangeRate: parseFloat(t.exchangeRate || '1'),
        transferFee: parseFloat(t.transferFee || '0'),
        reconciled: t.reconciled === 'true'
      }));
    } catch (e) {
      console.error('Error fetching treasury transactions:', e);
      return [];
    }
  }

  // ─── 4. CREATE DEPOSIT (إيداع) ───
  static async createDeposit(input: DepositInput) {
    if (!input.amount || input.amount <= 0) {
      throw new Error('مبلغ الإيداع يجب أن يكون أكبر من صفر');
    }

    const txId = 'dep_' + Math.random().toString(36).substr(2, 9);
    const dateStr = input.date || new Date().toISOString().split('T')[0];
    const rate = input.exchangeRate || 1.0;
    const baseAmount = input.amount * rate;

    // Resolve Destination Account ID
    let destAccId = 'acc_cash';
    if (input.destinationType === 'cashbox') {
      const [box] = await db.select().from(cashboxes).where(eq(cashboxes.id, input.destinationId));
      if (box) {
        const newBal = parseFloat(box.currentBalance || '0') + input.amount;
        await db.update(cashboxes).set({ currentBalance: newBal.toString() }).where(eq(cashboxes.id, input.destinationId));
      }
      destAccId = 'acc_cash';
    } else if (input.destinationType === 'bank_account') {
      const [bank] = await db.select().from(bankAccounts).where(eq(bankAccounts.id, input.destinationId));
      if (bank) {
        const newBal = parseFloat(bank.currentBalance || '0') + input.amount;
        await db.update(bankAccounts).set({ currentBalance: newBal.toString() }).where(eq(bankAccounts.id, input.destinationId));
        destAccId = bank.accountId || 'acc_bank';
      }
    }

    // Resolve Source Account ID
    let sourceAccId = input.sourceAccountId || 'acc_revenue';
    if (input.sourceType === 'customer') {
      sourceAccId = 'acc_ar'; // Accounts Receivable
    } else if (input.sourceType === 'capital') {
      sourceAccId = 'acc_capital';
    }

    // Double-Entry Accounting Posting
    const entryNumber = 'JV-DEP-' + Math.floor(10000 + Math.random() * 90000);
    const descText = `إيداع مقبول: ${input.description || 'إيداع نقدية/بنك'}`;

    const journalRes = await AccountingRepository.postJournalEntry(
      entryNumber,
      descText,
      dateStr,
      [
        { accountId: destAccId, debit: baseAmount, credit: 0, currency: input.currency || 'SAR', exchangeRate: rate },
        { accountId: sourceAccId, debit: 0, credit: baseAmount, currency: input.currency || 'SAR', exchangeRate: rate }
      ]
    );

    // Record Treasury Transaction
    const dbTx = {
      id: txId,
      transactionType: 'deposit',
      sourceType: input.sourceType,
      sourceId: sourceAccId,
      destinationType: input.destinationType,
      destinationId: input.destinationId,
      amount: input.amount.toString(),
      currency: input.currency || 'SAR',
      exchangeRate: rate.toString(),
      transferFee: '0',
      date: dateStr,
      referenceNumber: input.referenceNumber || entryNumber,
      description: input.description,
      journalEntryId: journalRes?.id || null,
      reconciled: 'false'
    };

    await db.insert(treasuryTransactions).values(dbTx);
    return { ...dbTx, amount: input.amount, journalEntry: journalRes };
  }

  // ─── 5. CREATE WITHDRAWAL (سحب / مصروف) ───
  static async createWithdrawal(input: WithdrawalInput) {
    if (!input.amount || input.amount <= 0) {
      throw new Error('مبلغ السحب يجب أن يكون أكبر من صفر');
    }

    const txId = 'wth_' + Math.random().toString(36).substr(2, 9);
    const dateStr = input.date || new Date().toISOString().split('T')[0];
    const rate = input.exchangeRate || 1.0;
    const baseAmount = input.amount * rate;

    // Resolve Source Account ID and update balance
    let sourceAccId = 'acc_cash';
    if (input.sourceType === 'cashbox') {
      const [box] = await db.select().from(cashboxes).where(eq(cashboxes.id, input.sourceId));
      if (box) {
        const curBal = parseFloat(box.currentBalance || '0');
        const newBal = curBal - input.amount;
        await db.update(cashboxes).set({ currentBalance: newBal.toString() }).where(eq(cashboxes.id, input.sourceId));
      }
      sourceAccId = 'acc_cash';
    } else if (input.sourceType === 'bank_account') {
      const [bank] = await db.select().from(bankAccounts).where(eq(bankAccounts.id, input.sourceId));
      if (bank) {
        const curBal = parseFloat(bank.currentBalance || '0');
        const newBal = curBal - input.amount;
        await db.update(bankAccounts).set({ currentBalance: newBal.toString() }).where(eq(bankAccounts.id, input.sourceId));
        sourceAccId = bank.accountId || 'acc_bank';
      }
    }

    // Resolve Destination Account ID
    let destAccId = input.destinationAccountId || 'acc_expense';
    if (input.destinationType === 'supplier') {
      destAccId = 'acc_ap'; // Accounts Payable
    } else if (input.destinationType === 'owner_draw') {
      destAccId = 'acc_drawings';
    }

    // Double-Entry Accounting Posting
    const entryNumber = 'JV-WTH-' + Math.floor(10000 + Math.random() * 90000);
    const descText = `سحب/صرف: ${input.description || 'مصروف/سحب نقدية'}`;

    const journalRes = await AccountingRepository.postJournalEntry(
      entryNumber,
      descText,
      dateStr,
      [
        { accountId: destAccId, debit: baseAmount, credit: 0, currency: input.currency || 'SAR', exchangeRate: rate },
        { accountId: sourceAccId, debit: 0, credit: baseAmount, currency: input.currency || 'SAR', exchangeRate: rate }
      ]
    );

    // Record Treasury Transaction
    const dbTx = {
      id: txId,
      transactionType: 'withdrawal',
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      destinationType: input.destinationType,
      destinationId: destAccId,
      amount: input.amount.toString(),
      currency: input.currency || 'SAR',
      exchangeRate: rate.toString(),
      transferFee: '0',
      date: dateStr,
      referenceNumber: input.referenceNumber || entryNumber,
      description: input.description,
      journalEntryId: journalRes?.id || null,
      reconciled: 'false'
    };

    await db.insert(treasuryTransactions).values(dbTx);
    return { ...dbTx, amount: input.amount, journalEntry: journalRes };
  }

  // ─── 6. CREATE TRANSFER (تحويل بين الخزائن والبنوك) ───
  static async createTransfer(input: TransferInput) {
    if (!input.amount || input.amount <= 0) {
      throw new Error('مبلغ التحويل يجب أن يكون أكبر من صفر');
    }

    const txId = 'trf_' + Math.random().toString(36).substr(2, 9);
    const dateStr = input.date || new Date().toISOString().split('T')[0];
    const rate = input.exchangeRate || 1.0;
    const baseAmount = input.amount * rate;
    const fee = input.transferFee || 0;
    const baseFee = fee * rate;

    // Deduct from Source
    let sourceAccId = 'acc_cash';
    if (input.sourceType === 'cashbox') {
      const [box] = await db.select().from(cashboxes).where(eq(cashboxes.id, input.sourceId));
      if (box) {
        const newBal = parseFloat(box.currentBalance || '0') - (input.amount + fee);
        await db.update(cashboxes).set({ currentBalance: newBal.toString() }).where(eq(cashboxes.id, input.sourceId));
      }
      sourceAccId = 'acc_cash';
    } else if (input.sourceType === 'bank_account') {
      const [bank] = await db.select().from(bankAccounts).where(eq(bankAccounts.id, input.sourceId));
      if (bank) {
        const newBal = parseFloat(bank.currentBalance || '0') - (input.amount + fee);
        await db.update(bankAccounts).set({ currentBalance: newBal.toString() }).where(eq(bankAccounts.id, input.sourceId));
        sourceAccId = bank.accountId || 'acc_bank';
      }
    }

    // Add to Destination
    let destAccId = 'acc_bank';
    if (input.destinationType === 'cashbox') {
      const [box] = await db.select().from(cashboxes).where(eq(cashboxes.id, input.destinationId));
      if (box) {
        const newBal = parseFloat(box.currentBalance || '0') + input.amount;
        await db.update(cashboxes).set({ currentBalance: newBal.toString() }).where(eq(cashboxes.id, input.destinationId));
      }
      destAccId = 'acc_cash';
    } else if (input.destinationType === 'bank_account') {
      const [bank] = await db.select().from(bankAccounts).where(eq(bankAccounts.id, input.destinationId));
      if (bank) {
        const newBal = parseFloat(bank.currentBalance || '0') + input.amount;
        await db.update(bankAccounts).set({ currentBalance: newBal.toString() }).where(eq(bankAccounts.id, input.destinationId));
        destAccId = bank.accountId || 'acc_bank';
      }
    }

    // Double-Entry Journal Lines
    const entryNumber = 'JV-TRF-' + Math.floor(10000 + Math.random() * 90000);
    const descText = `تحويل مالي: ${input.description || 'تحويل بين حسابات الخزينة/البنك'}`;

    const journalLines: any[] = [
      { accountId: destAccId, debit: baseAmount, credit: 0, currency: input.currency || 'SAR', exchangeRate: rate }
    ];

    if (baseFee > 0) {
      journalLines.push({ accountId: 'acc_expense', debit: baseFee, credit: 0, currency: input.currency || 'SAR', exchangeRate: rate, description: 'عمولة تحويل بنكي' });
    }

    journalLines.push({ accountId: sourceAccId, debit: 0, credit: baseAmount + baseFee, currency: input.currency || 'SAR', exchangeRate: rate });

    const journalRes = await AccountingRepository.postJournalEntry(entryNumber, descText, dateStr, journalLines);

    // Record Treasury Transaction
    const dbTx = {
      id: txId,
      transactionType: 'transfer',
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      destinationType: input.destinationType,
      destinationId: input.destinationId,
      amount: input.amount.toString(),
      currency: input.currency || 'SAR',
      exchangeRate: rate.toString(),
      transferFee: fee.toString(),
      date: dateStr,
      referenceNumber: input.referenceNumber || entryNumber,
      description: input.description,
      journalEntryId: journalRes?.id || null,
      reconciled: 'false'
    };

    await db.insert(treasuryTransactions).values(dbTx);
    return { ...dbTx, amount: input.amount, journalEntry: journalRes };
  }

  // ─── 7. BANK RECONCILIATION ───
  static async getBankReconciliations(bankAccountId: string) {
    try {
      const list = await db.select().from(bankReconciliations).where(eq(bankReconciliations.bankAccountId, bankAccountId)).orderBy(desc(bankReconciliations.createdAt));
      return list.map(r => ({
        ...r,
        statementEndingBalance: parseFloat(r.statementEndingBalance || '0'),
        ledgerEndingBalance: parseFloat(r.ledgerEndingBalance || '0'),
        difference: parseFloat(r.difference || '0'),
        matchedCount: parseInt(r.matchedCount || '0')
      }));
    } catch (e) {
      console.error('Error fetching reconciliations:', e);
      return [];
    }
  }

  static async getUnreconciledTransactions(bankAccountId: string) {
    try {
      const list = await db.select().from(treasuryTransactions)
        .where(and(
          eq(treasuryTransactions.reconciled, 'false')
        ))
        .orderBy(desc(treasuryTransactions.date));

      // Filter transactions related to this bank account (either as source or destination)
      const filtered = list.filter(t => t.sourceId === bankAccountId || t.destinationId === bankAccountId);
      return filtered.map(t => ({
        ...t,
        amount: parseFloat(t.amount || '0')
      }));
    } catch (e) {
      console.error('Error fetching unreconciled transactions:', e);
      return [];
    }
  }

  static async executeBankReconciliation(input: BankReconciliationInput) {
    const recId = 'rec_' + Math.random().toString(36).substr(2, 9);
    const diff = Math.abs(input.statementEndingBalance - input.ledgerEndingBalance);

    // Save Reconciliation
    const recRecord = {
      id: recId,
      bankAccountId: input.bankAccountId,
      statementDate: input.statementDate,
      statementEndingBalance: input.statementEndingBalance.toString(),
      ledgerEndingBalance: input.ledgerEndingBalance.toString(),
      difference: diff.toString(),
      matchedCount: input.matchedTransactionIds.length.toString(),
      status: diff < 0.01 ? 'completed' : 'completed_with_diff',
      notes: input.notes || 'تسوية بنكية معتمدة',
    };

    await db.insert(bankReconciliations).values(recRecord);

    // Mark matched transactions as reconciled
    for (const txId of input.matchedTransactionIds) {
      await db.update(treasuryTransactions)
        .set({ reconciled: 'true', reconciliationId: recId })
        .where(eq(treasuryTransactions.id, txId));
    }

    return recRecord;
  }
}
