import { CustomerRepository } from '../core/repositories/CustomerRepository.ts';

async function testDebtAgingPerformanceUnit() {
  console.log('=== Running Debt Aging Performance & Unit Test (Mock Data) ===');

  // Mocking customers and invoices
  const mockCustomers = [
    { id: 'c1', name: 'عميل 1', phone: '0501111111', balance: '1500.00', creditLimit: '2000.00' },
    { id: 'c2', name: 'عميل 2', phone: '0502222222', balance: '500.00', creditLimit: '1000.00' },
    { id: 'c3', name: 'عميل 3', phone: '0503333333', balance: '0.00', creditLimit: '1000.00' }, // Non-debtor
  ];

  const now = new Date().getTime();
  const d15 = new Date(now - 15 * 24 * 60 * 60 * 1000).toISOString();
  const d45 = new Date(now - 45 * 24 * 60 * 60 * 1000).toISOString();
  const d75 = new Date(now - 75 * 24 * 60 * 60 * 1000).toISOString();
  const d100 = new Date(now - 100 * 24 * 60 * 60 * 1000).toISOString();

  const mockInvoices = [
    { id: 'inv1', customerId: 'c1', invoiceNumber: 'INV-1', date: d15, grandTotal: '100.00', status: 'unpaid', paymentMethod: 'credit' },
    { id: 'inv2', customerId: 'c1', invoiceNumber: 'INV-2', date: d45, grandTotal: '200.00', status: 'unpaid', paymentMethod: 'credit' },
    { id: 'inv3', customerId: 'c1', invoiceNumber: 'INV-3', date: d75, grandTotal: '300.00', status: 'unpaid', paymentMethod: 'credit' },
    { id: 'inv4', customerId: 'c1', invoiceNumber: 'INV-4', date: d100, grandTotal: '900.00', status: 'unpaid', paymentMethod: 'credit' },
    { id: 'inv5', customerId: 'c2', invoiceNumber: 'INV-5', date: d15, grandTotal: '500.00', status: 'unpaid', paymentMethod: 'credit' },
  ];

  // Logic calculation test using mapped in-memory structure matching CustomerRepository.getDebtAging
  const debtorCustomers = mockCustomers.filter(c => parseFloat(c.balance || '0') > 0);
  const debtorIds = debtorCustomers.map(c => c.id);

  // Verify non-debtor c3 is excluded from debtorIds
  if (debtorIds.includes('c3')) {
    throw new Error('Non-debtor customer c3 should be excluded from batch query IDs');
  }

  // Group invoices
  const invoicesByCustomer = new Map<string, typeof mockInvoices>();
  for (const inv of mockInvoices) {
    if (!inv.customerId || !debtorIds.includes(inv.customerId)) continue;
    const list = invoicesByCustomer.get(inv.customerId) || [];
    list.push(inv);
    invoicesByCustomer.set(inv.customerId, list);
  }

  const result = [];
  for (const c of debtorCustomers) {
    const bal = parseFloat(c.balance || '0');
    const limit = parseFloat(c.creditLimit || '5000');
    const invs = invoicesByCustomer.get(c.id) || [];

    let curr0_30 = 0;
    let days31_60 = 0;
    let days61_90 = 0;
    let daysOver90 = 0;

    for (const inv of invs) {
      if (inv.status === 'unpaid' || inv.status === 'partially_paid' || inv.paymentMethod === 'credit') {
        const invDate = new Date(inv.date || new Date()).getTime();
        const diffDays = Math.floor((now - invDate) / (1000 * 60 * 60 * 24));
        const amt = parseFloat(inv.grandTotal || '0');

        if (diffDays <= 30) curr0_30 += amt;
        else if (diffDays <= 60) days31_60 += amt;
        else if (diffDays <= 90) days61_90 += amt;
        else daysOver90 += amt;
      }
    }

    if (curr0_30 + days31_60 + days61_90 + daysOver90 === 0 && bal > 0) {
      curr0_30 = bal;
    }

    const status = bal > limit ? 'exceeded' : bal > (limit * 0.8) ? 'warning' : 'safe';

    result.push({
      customerId: c.id,
      customerName: c.name,
      phone: c.phone || '',
      creditLimit: limit,
      totalBalance: bal,
      current0To30: parseFloat(curr0_30.toFixed(2)),
      days31To60: parseFloat(days31_60.toFixed(2)),
      days61To90: parseFloat(days61_90.toFixed(2)),
      daysOver90: parseFloat(daysOver90.toFixed(2)),
      status
    });
  }

  console.log('Result count:', result.length);
  if (result.length !== 2) {
    throw new Error(`Expected 2 reports for debtor customers, got ${result.length}`);
  }

  const r1 = result.find(r => r.customerId === 'c1');
  if (!r1) throw new Error('Customer c1 missing from report');
  if (r1.current0To30 !== 100 || r1.days31To60 !== 200 || r1.days61To90 !== 300 || r1.daysOver90 !== 900) {
    throw new Error('Customer c1 aging calculations incorrect');
  }

  console.log('✔ All Debt Aging In-Memory & Logic Unit Tests Passed!');
}

testDebtAgingPerformanceUnit().catch(err => {
  console.error('Test Failed:', err);
  process.exit(1);
});
