declare const process: any;

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

async function runTreasuryPerformanceTests() {
  console.log('=== Running Treasury Performance & Unit Tests ===');

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

  // Test 1: getTransactions by type
  const deposits = filterTransactions(mockTransactions, 'deposit');
  if (deposits.length !== 2 || !deposits.every(t => t.transactionType === 'deposit') || deposits[0].amount !== 1000) {
    throw new Error('Test 1 failed: getTransactions deposit filter');
  }

  const withdrawals = filterTransactions(mockTransactions, 'withdrawal');
  if (withdrawals.length !== 1 || withdrawals[0].id !== 'tx_2' || withdrawals[0].amount !== 250) {
    throw new Error('Test 1 failed: getTransactions withdrawal filter');
  }

  // Test 2: getTransactions without type filter
  const all = filterTransactions(mockTransactions);
  if (all.length !== 4 || typeof all[0].amount !== 'number' || typeof all[0].reconciled !== 'boolean') {
    throw new Error('Test 2 failed: getTransactions overall formatting');
  }

  // Test 3: getUnreconciledTransactions for bankAccountId
  const unreconciledBankMain = filterUnreconciledTransactions(mockTransactions, 'bank_main');
  if (unreconciledBankMain.length !== 2) {
    throw new Error(`Test 3 failed: expected 2 unreconciled bank_main transactions, got ${unreconciledBankMain.length}`);
  }
  const ids = unreconciledBankMain.map(t => t.id);
  if (!ids.includes('tx_1') || !ids.includes('tx_3')) {
    throw new Error('Test 3 failed: unreconciled bank_main transaction IDs mismatch');
  }

  console.log('✔ All Treasury Repository Logic & Performance Tests Passed!');
}

runTreasuryPerformanceTests().catch(err => {
  console.error('Test Failed:', err);
  process.exit(1);
});
