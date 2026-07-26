import { Router } from 'express';
import { UserRepository } from '../../../repositories/UserRepository.ts';
import { authorize } from '../../middleware/rbac.ts';
import { AuthenticatedRequest } from '../../middleware/auth.ts';

const router = Router();

router.get('/roles', authorize(['manager', 'manage_users']), async (req, res, next) => {
  try {
    const roles = await UserRepository.getRolesWithPermissions();
    res.json({ success: true, data: roles });
  } catch (err) {
    next(err);
  }
});

router.post('/roles', authorize(['manager', 'manage_users']), async (req, res, next) => {
  try {
    const saved = await UserRepository.saveRole(req.body);
    res.json({ success: true, data: saved });
  } catch (err) {
    next(err);
  }
});

router.delete('/roles/:id', authorize(['manager', 'manage_users']), async (req, res, next) => {
  try {
    await UserRepository.deleteRole(req.params.id);
    res.json({ success: true, data: { success: true } });
  } catch (err) {
    next(err);
  }
});

router.get('/permissions', authorize(['manager', 'manage_users']), async (req, res, next) => {
  try {
    const permissions = await UserRepository.getAllPermissions();
    res.json({ success: true, data: permissions });
  } catch (err) {
    next(err);
  }
});

router.get('/users', authorize(['manager', 'manage_users']), async (req, res, next) => {
  try {
    const { page, limit, role } = req.query;
    const result = await UserRepository.getUsers({
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      role: role as string
    });
    res.json({ success: true, data: result.items || result, pagination: result.pagination });
  } catch (err) {
    next(err);
  }
});

router.post('/users', authorize(['manager', 'manage_users']), async (req, res, next) => {
  try {
    const saved = await UserRepository.saveUser(req.body);
    res.json({ success: true, data: saved });
  } catch (err) {
    next(err);
  }
});

router.delete('/users/:id', authorize(['manager', 'manage_users']), async (req: AuthenticatedRequest, res, next) => {
  try {
    if (req.params.id === '001' || req.params.id === req.user?.id) {
      return res.status(400).json({ success: false, error: 'غير مسموح بحذف الحساب الإداري الرئيسي أو حسابك النشط حالياً.', statusCode: 400 });
    }
    await UserRepository.deleteUser(req.params.id);
    res.json({ success: true, data: { success: true } });
  } catch (err) {
    next(err);
  }
});

export default router;
