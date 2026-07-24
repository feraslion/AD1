import { AccountingService as RawAccountingService } from '../core/api/api';

export interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
  balance: number;
  currency?: string;
  foreignBalance?: number;
  parentId?: string | null;
  companyId?: string | null;
  isActive?: boolean;
}

export interface AccountTreeNode extends Account {
  level: number;
  children: AccountTreeNode[];
}

export interface JournalLine {
  accountId: string;
  debit: number;
  credit: number;
  currency?: string;
  exchangeRate?: number;
  foreignDebit?: number;
  foreignCredit?: number;
  description?: string;
}

export const AccountingService = {
  // Underlying API services proxy
  getAccounts: RawAccountingService.getAccounts,
  getAccountsTree: RawAccountingService.getAccountsTree,
  suggestChildCode: RawAccountingService.suggestChildCode,
  createAccount: RawAccountingService.createAccount,
  toggleAccountActive: RawAccountingService.toggleAccountActive,
  seedDefaultAccounts: RawAccountingService.seedDefaultAccounts,
  deleteAccount: RawAccountingService.deleteAccount,
  getLedger: RawAccountingService.getLedger,
  getJournalEntries: RawAccountingService.getJournalEntries,
  getJournalEntryById: RawAccountingService.getJournalEntryById,
  createJournalEntry: RawAccountingService.createJournalEntry,
  postDraftJournalEntry: RawAccountingService.postDraftJournalEntry,
  reverseJournalEntry: RawAccountingService.reverseJournalEntry,
  getAuditHealth: RawAccountingService.getAuditHealth,
  getTrialBalance: RawAccountingService.getTrialBalance,
  getPostingRules: RawAccountingService.getPostingRules,
  updatePostingRule: RawAccountingService.updatePostingRule,

  // Financial reporting & accounting calculations
  totalAssets: (accounts: Account[]): number => {
    return accounts.filter(a => a.type === 'asset').reduce((sum, a) => sum + (Number(a.balance) || 0), 0);
  },

  totalLiabilities: (accounts: Account[]): number => {
    return accounts.filter(a => a.type === 'liability').reduce((sum, a) => sum + (Number(a.balance) || 0), 0);
  },

  totalEquity: (accounts: Account[]): number => {
    return accounts.filter(a => a.type === 'equity').reduce((sum, a) => sum + (Number(a.balance) || 0), 0);
  },

  salesRevenue: (accounts: Account[]): number => {
    return accounts.filter(a => a.type === 'revenue').reduce((sum, a) => sum + (Number(a.balance) || 0), 0);
  },

  totalExpenses: (accounts: Account[]): number => {
    return accounts.filter(a => a.type === 'expense').reduce((sum, a) => sum + (Number(a.balance) || 0), 0);
  },

  cogs: (accounts: Account[]): number => {
    const cogsAccount = accounts.find(a => a.code === '5101');
    return cogsAccount ? (Number(cogsAccount.balance) || 0) : 0;
  },

  operatingExpenses: (accounts: Account[]): number => {
    return accounts.filter(a => a.type === 'expense' && a.code !== '5101').reduce((sum, a) => sum + (Number(a.balance) || 0), 0);
  },

  netProfit: (accounts: Account[]): number => {
    return AccountingService.salesRevenue(accounts) - AccountingService.totalExpenses(accounts);
  },

  validateJournalEntry: (
    entryLines: JournalLine[],
    entryDesc: string,
    currency: string = 'SAR'
  ): string | null => {
    const totalDebit = entryLines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
    const totalCredit = entryLines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0);

    if (totalDebit <= 0 || totalCredit <= 0) {
      return 'يجب إدخال قيم دائنة ومدينة أكبر من الصفر.';
    }

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return `القيد غير متزن! إجمالي المدين (${totalDebit.toFixed(2)} ${currency}) لا يساوي إجمالي الدائن (${totalCredit.toFixed(2)} ${currency}).`;
    }

    if (!entryDesc.trim()) {
      return 'الرجاء كتابة وصف القيد المحاسبي.';
    }

    return null;
  }
};
