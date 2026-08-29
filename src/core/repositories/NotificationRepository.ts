import { db } from '../database/index.ts';
import { products, customers } from '../database/schema.ts';
import { lte, gte, gt, and } from 'drizzle-orm';

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
  /**
   * Generates low stock notifications.
   * Performance Optimization: Pushes filtering down to the SQL database level (where stock <= minStock)
   * instead of loading all products into memory and running Array.prototype.filter.
   */
  static async generateStockAlerts(): Promise<SystemNotification[]> {
    try {
      const lowStockProds = await db.select().from(products).where(lte(products.stock, products.minStock));

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

  /**
   * Generates credit limit breach notifications for customers.
   * Performance Optimization: Pushes filtering down to the SQL database level (where creditLimit > 0 and balance >= creditLimit)
   * instead of loading all customers into memory and running Array.prototype.filter.
   */
  static async generateCreditLimitAlerts(): Promise<SystemNotification[]> {
    try {
      const overLimit = await db.select().from(customers).where(
        and(
          gt(customers.creditLimit, '0'),
          gte(customers.balance, customers.creditLimit)
        )
      );

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
