import { db } from '../database/index.ts';
import { products, customers, suppliers } from '../database/schema.ts';
import { lte, gte, eq } from 'drizzle-orm';

export interface SystemNotification {
  id: string;
  type: 'low_stock' | 'credit_limit' | 'approval_required' | 'payment_due' | 'system_alert';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  createdAt: string;
  read: boolean;
  link?: string;
}

let notificationStore: SystemNotification[] = [];

export class NotificationRepository {
  static async generateStockAlerts(): Promise<SystemNotification[]> {
    try {
      const allProducts = await db.select().from(products);
      const lowStockProds = allProducts.filter(p => {
        const stock = Number(p.stock) || 0;
        const minStock = Number(p.minStock) || 5;
        return stock <= minStock;
      });

      const alerts: SystemNotification[] = lowStockProds.map(p => ({
        id: `notif_stock_${p.id}`,
        type: 'low_stock',
        title: 'تنبيه مخزون منخفض',
        message: `المنتج "${p.name}" وصل إلى الحد الأدنى للمخزون (${p.stock} قطعة متبقية).`,
        severity: 'warning',
        createdAt: new Date().toISOString(),
        read: false,
        link: '/inventory'
      }));

      this.addNotifications(alerts);
      return alerts;
    } catch (_) {
      return [];
    }
  }

  static async generateCreditLimitAlerts(): Promise<SystemNotification[]> {
    try {
      const allCusts = await db.select().from(customers);
      const overLimit = allCusts.filter(c => {
        const bal = Number(c.balance) || 0;
        const limit = Number(c.creditLimit) || 0;
        return limit > 0 && bal >= limit;
      });

      const alerts: SystemNotification[] = overLimit.map(c => ({
        id: `notif_credit_${c.id}`,
        type: 'credit_limit',
        title: 'تجاوز حد الائتمان',
        message: `العميل "${c.name}" تجاوز الحد الائتماني المسموح به (الرصيد: ${c.balance} ريال / الحد: ${c.creditLimit} ريال).`,
        severity: 'error',
        createdAt: new Date().toISOString(),
        read: false,
        link: '/customers'
      }));

      this.addNotifications(alerts);
      return alerts;
    } catch (_) {
      return [];
    }
  }

  static addNotifications(notifs: SystemNotification[]) {
    notifs.forEach(n => {
      if (!notificationStore.some(existing => existing.id === n.id)) {
        notificationStore.unshift(n);
      }
    });
  }

  static getNotifications(): SystemNotification[] {
    return notificationStore;
  }

  static markAsRead(id: string) {
    const n = notificationStore.find(x => x.id === id);
    if (n) n.read = true;
  }

  static markAllAsRead() {
    notificationStore.forEach(x => x.read = true);
  }
}
