import { Router } from 'express';
import { WorkflowRepository, AuditRepository, NotificationRepository, BackupRepository } from '../../../repositories/index.ts';

const router = Router();

// 1. Workflows & Approvals
router.get('/workflows/rules', (req, res) => {
  const rules = WorkflowRepository.getRules();
  res.json({ success: true, data: rules });
});

router.post('/workflows/rules', (req, res) => {
  const newRule = WorkflowRepository.addRule(req.body);
  res.json({ success: true, data: newRule });
});

router.get('/workflows/approvals', (req, res) => {
  const approvals = WorkflowRepository.getAllApprovals();
  res.json({ success: true, data: approvals });
});

router.post('/workflows/approvals/:id/approve', async (req, res) => {
  try {
    const { approverName, notes } = req.body;
    const result = await WorkflowRepository.approveRequest(req.params.id, approverName || 'المدير', notes);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.post('/workflows/approvals/:id/reject', async (req, res) => {
  try {
    const { approverName, notes } = req.body;
    const result = await WorkflowRepository.rejectRequest(req.params.id, approverName || 'المدير', notes);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 2. Audit Trail
router.get('/audit-logs', async (req, res) => {
  const logs = await AuditRepository.getLogs();
  res.json({ success: true, data: logs });
});

router.post('/audit-logs', async (req, res) => {
  const newLog = await AuditRepository.log(req.body);
  res.json({ success: true, data: newLog });
});

// 3. Notifications
router.get('/notifications', async (req, res) => {
  await NotificationRepository.generateStockAlerts();
  await NotificationRepository.generateCreditLimitAlerts();
  const notifs = NotificationRepository.getNotifications();
  res.json({ success: true, data: notifs });
});

router.post('/notifications/read-all', (req, res) => {
  NotificationRepository.markAllAsRead();
  res.json({ success: true });
});

// 4. Backup & Restore
router.get('/backup/export', async (req, res) => {
  try {
    const backup = await BackupRepository.exportFullBackup();
    res.json({ success: true, data: backup });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/backup/restore', async (req, res) => {
  try {
    const result = await BackupRepository.restoreFullBackup(req.body);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

export default router;
