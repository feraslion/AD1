import { Router } from 'express';
import { WorkflowRepository, AuditRepository, NotificationRepository, BackupRepository } from '../../../repositories/index.ts';
import { authorize } from '../../middleware/rbac.ts';

const router = Router();

// 1. Workflows & Approvals (Restricted to 'manager' or 'accountant')
router.get('/workflows/rules', authorize(['manager', 'accountant']), (req, res) => {
  const rules = WorkflowRepository.getRules();
  res.json({ success: true, data: rules });
});

router.post('/workflows/rules', authorize(['manager', 'accountant']), (req, res) => {
  const newRule = WorkflowRepository.addRule(req.body);
  res.json({ success: true, data: newRule });
});

router.get('/workflows/approvals', authorize(['manager', 'accountant']), (req, res) => {
  const approvals = WorkflowRepository.getAllApprovals();
  res.json({ success: true, data: approvals });
});

router.post('/workflows/approvals/:id/approve', authorize(['manager', 'accountant']), async (req, res) => {
  try {
    const { approverName, notes } = req.body;
    const result = await WorkflowRepository.approveRequest(req.params.id, approverName || 'المدير', notes);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.post('/workflows/approvals/:id/reject', authorize(['manager', 'accountant']), async (req, res) => {
  try {
    const { approverName, notes } = req.body;
    const result = await WorkflowRepository.rejectRequest(req.params.id, approverName || 'المدير', notes);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 2. Audit Trail (Restricted to 'manager' or 'accountant')
router.get('/audit-logs', authorize(['manager', 'accountant']), async (req, res) => {
  const logs = await AuditRepository.getLogs();
  res.json({ success: true, data: logs });
});

router.post('/audit-logs', authorize(['manager', 'accountant']), async (req, res) => {
  const newLog = await AuditRepository.log(req.body);
  res.json({ success: true, data: newLog });
});

// 3. Notifications (Restricted to 'manager' or 'accountant')
router.get('/notifications', authorize(['manager', 'accountant']), async (req, res) => {
  await NotificationRepository.generateStockAlerts();
  await NotificationRepository.generateCreditLimitAlerts();
  const notifs = NotificationRepository.getNotifications();
  res.json({ success: true, data: notifs });
});

router.post('/notifications/read-all', authorize(['manager', 'accountant']), (req, res) => {
  NotificationRepository.markAllAsRead();
  res.json({ success: true });
});

// 4. Backup & Restore (Restricted strictly to 'manager')
router.get('/backup/export', authorize(['manager']), async (req, res) => {
  try {
    const backup = await BackupRepository.exportFullBackup();
    res.json({ success: true, data: backup });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/backup/restore', authorize(['manager']), async (req, res) => {
  try {
    const result = await BackupRepository.restoreFullBackup(req.body);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

export default router;
