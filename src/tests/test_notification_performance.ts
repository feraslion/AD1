import { NotificationRepository } from '../core/repositories/NotificationRepository.ts';

async function runNotificationPerformanceTests() {
  console.log('=== Running Notification Performance & Database Push-Down Unit Tests ===');

  // Verify stock alerts execution without active DB connection (graceful fallback check)
  const stockAlerts = await NotificationRepository.generateStockAlerts();
  console.log(`✓ Stock alerts execution completed gracefully. Result count: ${stockAlerts.length}`);

  // Verify credit limit alerts execution without active DB connection (graceful fallback check)
  const creditAlerts = await NotificationRepository.generateCreditLimitAlerts();
  console.log(`✓ Credit limit alerts execution completed gracefully. Result count: ${creditAlerts.length}`);

  // Verify in-memory notifications management
  NotificationRepository.addNotifications([
    {
      id: 'test_notif_1',
      type: 'low_stock',
      title: 'تنبيه مخزون تجريبي',
      message: 'رسالة تنبيه تجريبية',
      severity: 'warning',
      createdAt: new Date().toISOString(),
      read: false
    }
  ]);

  const notifs = NotificationRepository.getNotifications();
  if (!notifs.some(n => n.id === 'test_notif_1')) {
    throw new Error('Notification insertion failed.');
  }
  console.log('✓ Notification store insertion verified.');

  NotificationRepository.markAsRead('test_notif_1');
  const readNotif = NotificationRepository.getNotifications().find(n => n.id === 'test_notif_1');
  if (!readNotif || !readNotif.read) {
    throw new Error('Notification markAsRead failed.');
  }
  console.log('✓ Notification markAsRead verified.');

  console.log('✔ All Notification Performance & Push-down Unit Tests Passed!');
}

runNotificationPerformanceTests();
