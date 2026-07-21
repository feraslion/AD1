import { Invoice } from '../types';

const OFFLINE_QUEUE_KEY = 'pos_offline_invoices_queue_v1';

export const OfflineQueue = {
  // Get all pending offline invoices
  getQueue: (): Invoice[] => {
    try {
      const data = localStorage.getItem(OFFLINE_QUEUE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  // Save invoice to offline queue
  enqueue: (invoice: Invoice): void => {
    try {
      const current = OfflineQueue.getQueue();
      current.push(invoice);
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(current));
    } catch (e) {
      console.error('Failed to enqueue offline invoice', e);
    }
  },

  // Clear or remove synced invoices
  remove: (invoiceId: string): void => {
    try {
      const current = OfflineQueue.getQueue();
      const updated = current.filter(inv => inv.id !== invoiceId);
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to update offline queue', e);
    }
  },

  clear: (): void => {
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
  },

  // Sync all queued invoices with the server backend API
  syncWithServer: async (
    postInvoiceApi: (inv: Invoice) => Promise<any>
  ): Promise<{ syncedCount: number; failedCount: number }> => {
    const queue = OfflineQueue.getQueue();
    if (queue.length === 0) return { syncedCount: 0, failedCount: 0 };

    let syncedCount = 0;
    let failedCount = 0;

    for (const inv of queue) {
      try {
        await postInvoiceApi(inv);
        OfflineQueue.remove(inv.id);
        syncedCount++;
      } catch (err) {
        console.error(`Failed to sync invoice ${inv.id}`, err);
        failedCount++;
      }
    }

    return { syncedCount, failedCount };
  }
};
