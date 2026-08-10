import { OfflineQueue } from '../utils/offlineQueue';
import { Invoice } from '../types';

// Mock localStorage
const store: { [key: string]: string } = {};
let setItemCallCount = 0;

global.localStorage = {
  getItem: (key: string) => store[key] || null,
  setItem: (key: string, value: string) => {
    store[key] = value;
    setItemCallCount++;
  },
  removeItem: (key: string) => {
    delete store[key];
  },
  clear: () => {
    for (const key in store) {
      delete store[key];
    }
  },
  length: 0,
  key: (index: number) => null,
} as unknown as Storage;

console.log("=== Running OfflineQueue Optimization Verification Unit Tests ===");

// 1. Verify basic enqueue and getQueue
OfflineQueue.clear();
const mockInvoice = (id: string): Invoice => ({
  id,
  invoiceNumber: `INV-${id}`,
  date: new Date().toISOString(),
  items: [],
  totalWithoutTax: 100,
  taxAmount: 15,
  discountAmount: 0,
  grandTotal: 115,
  paymentMethod: 'cash',
  paymentDetails: {
    cashAmount: 115,
    cardAmount: 0
  },
  status: 'paid',
  customerName: 'Test Client',
  taxNumber: '123456789',
  cashierName: 'Test Cashier'
});

OfflineQueue.enqueue(mockInvoice('1'));
OfflineQueue.enqueue(mockInvoice('2'));
OfflineQueue.enqueue(mockInvoice('3'));

let queue = OfflineQueue.getQueue();
if (queue.length !== 3) {
  console.error(`❌ Test failed: Queue length is ${queue.length}, expected 3`);
  process.exit(1);
}
console.log("✔ Test 1 Passed: Enqueue and getQueue work correctly.");

// 2. Verify syncWithServer with batch-update optimization
setItemCallCount = 0; // reset counter

const postInvoiceMock = async (inv: Invoice) => {
  // Mock successful sync for 1 and 2, but fail on 3
  if (inv.id === '3') {
    throw new Error('Network error');
  }
  return { success: true };
};

const result = await OfflineQueue.syncWithServer(postInvoiceMock);

if (result.syncedCount !== 2 || result.failedCount !== 1) {
  console.error(`❌ Test failed: Synced count ${result.syncedCount} (expected 2), failed count ${result.failedCount} (expected 1)`);
  process.exit(1);
}

const remainingQueue = OfflineQueue.getQueue();
if (remainingQueue.length !== 1 || remainingQueue[0].id !== '3') {
  console.error(`❌ Test failed: Remaining queue is incorrect`, remainingQueue);
  process.exit(1);
}

// setItem should only be called EXACTLY ONCE for updating the synced items at the end of syncWithServer!
// Before optimization, it would be called 2 times (one for each successful sync) inside the loop.
if (setItemCallCount !== 1) {
  console.error(`❌ Test failed: localStorage.setItem was called ${setItemCallCount} times, expected exactly 1 (batch update)`);
  process.exit(1);
}

console.log(`✔ Test 2 Passed: Batch update logic works and executes exactly 1 setItem write.`);

// 3. Performance Benchmark Simulation
console.log("=== Running Performance Benchmark: Syncing 500 Offline Invoices ===");
OfflineQueue.clear();
for (let i = 0; i < 500; i++) {
  OfflineQueue.enqueue(mockInvoice(`perf-${i}`));
}

const start = performance.now();
setItemCallCount = 0;
const perfResult = await OfflineQueue.syncWithServer(async (inv) => ({ success: true }));
const duration = performance.now() - start;

console.log(`⏱️ Successfully synced ${perfResult.syncedCount} invoices in ${duration.toFixed(2)}ms.`);
console.log(`⏱️ localStorage.setItem calls during sync: ${setItemCallCount}.`);

if (setItemCallCount !== 1) {
  console.error(`❌ Test failed: localStorage.setItem was called ${setItemCallCount} times, expected exactly 1 (batch update)`);
  process.exit(1);
}

console.log("=== All OfflineQueue Optimization Unit Tests Passed Successfully! ===");
