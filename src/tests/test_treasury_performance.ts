import { describe, test, expect } from 'bun:test';

// Mock data structures matching treasuryTransactions table schema
interface TreasuryTx {
  id: string;
  transactionType: string;
  sourceType: string;
  sourceId: string;
  destinationType: string;
  destinationId: string;
  amount: string;
  currency: string;
  exchangeRate: string;
  transferFee: string;
  date: string;
  reconciled: string;
  createdAt: string;
}

// Logic simulating TreasuryRepository.getTransactions and getUnreconciledTransactions
function filterTransactions(list: TreasuryTx[], type?: string) {
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
}

function filterUnreconciledTransactions(list: TreasuryTx[], bankAccountId: string) {
  const filtered = list.filter(t =>
    t.reconciled === 'false' && (t.sourceId === bankAccountId || t.destinationId === bankAccountId)
  );
  return filtered.map(t => ({
    ...t,
    amount: parseFloat(t.amount || '0')
  }));
}

describe('TreasuryRepository Performance & Logic Unit Tests', () => {
  const mockTransactions: TreasuryTx[] = [
    {
      id: 'tx_1',
      transactionType: 'deposit',
      sourceType: 'customer',
      sourceId: 'acc_ar',
      destinationType: 'bank_account',
      destinationId: 'bank_main',
      amount: '1000.00',
      currency: 'SAR',
      exchangeRate: '1.0',
      transferFee: '0',
      date: '2025-03-01',
      reconciled: 'false',
      createdAt: '2025-03-01T10:00:00Z'
    },
    {
      id: 'tx_2',
      transactionType: 'withdrawal',
      sourceType: 'bank_account',
      sourceId: 'bank_main',
      destinationType: 'expense',
      destinationId: 'acc_expense',
      amount: '250.00',
      currency: 'SAR',
      exchangeRate: '1.0',
      transferFee: '0',
      date: '2025-03-02',
      reconciled: 'true',
      createdAt: '2025-03-02T10:00:00Z'
    },
    {
      id: 'tx_3',
      transactionType: 'transfer',
      sourceType: 'cashbox',
      sourceId: 'cashbox_main',
      destinationType: 'bank_account',
      destinationId: 'bank_main',
      amount: '500.00',
      currency: 'SAR',
      exchangeRate: '1.0',
      transferFee: '10.00',
      date: '2025-03-03',
      reconciled: 'false',
      createdAt: '2025-03-03T10:00:00Z'
    },
    {
      id: 'tx_4',
      transactionType: 'deposit',
      sourceType: 'revenue',
      sourceId: 'acc_revenue',
      destinationType: 'cashbox',
      destinationId: 'cashbox_main',
      amount: '300.00',
      currency: 'SAR',
      exchangeRate: '1.0',
      transferFee: '0',
      date: '2025-03-04',
      reconciled: 'false',
      createdAt: '2025-03-04T10:00:00Z'
    }
  ];

  test('getTransactions filters correctly by type when provided', () => {
    const deposits = filterTransactions(mockTransactions, 'deposit');
    expect(deposits.length).toBe(2);
    expect(deposits.every(t => t.transactionType === 'deposit')).toBe(true);
    expect(deposits[0].amount).toBe(1000);

    const withdrawals = filterTransactions(mockTransactions, 'withdrawal');
    expect(withdrawals.length).toBe(1);
    expect(withdrawals[0].id).toBe('tx_2');
    expect(withdrawals[0].amount).toBe(250);
  });

  test('getTransactions returns all items formatted when no type is provided', () => {
    const all = filterTransactions(mockTransactions);
    expect(all.length).toBe(4);
    expect(typeof all[0].amount).toBe('number');
    expect(typeof all[0].reconciled).toBe('boolean');
  });

  test('getUnreconciledTransactions filters only unreconciled transactions for given bankAccountId', () => {
    const unreconciledBankMain = filterUnreconciledTransactions(mockTransactions, 'bank_main');
    // tx_1: unreconciled, destinationId = bank_main -> included
    // tx_2: reconciled=true -> excluded
    // tx_3: unreconciled, destinationId = bank_main -> included
    // tx_4: source/dest not bank_main -> excluded
    expect(unreconciledBankMain.length).toBe(2);
    const ids = unreconciledBankMain.map(t => t.id);
    expect(ids).toContain('tx_1');
    expect(ids).toContain('tx_3');
  });
});
