import { Router } from 'express';
import { db } from '../../../database/index.ts';
import { eq, and, sql } from 'drizzle-orm';
import { roles, rolePermissions, permissions, users, cashboxes } from '../../../database/schema.ts';
import { sendResponse, sendError, authorize } from './helpers.ts';

const router = Router();

// Validation helpers
function validateUser(u: any) {
  const errors = [];
  if (!u.email || !u.email.includes('@')) errors.push('البريد الإلكتروني غير صالح');
  if (!u.name || u.name.trim().length < 2) errors.push('الاسم مطلوب');
  const validRoles = ['manager', 'accountant', 'cashier', 'inventory'];
  if (!u.role || !validRoles.includes(u.role)) {
    errors.push('دور المستخدم غير صالح، يجب أن يكون أحد الأدوار المعتمدة');
  }
  return errors;
}

// Roles & Permissions APIs
router.get('/roles', authorize(['manager', 'manage_users']), async (req, res) => {
  try {
    const allRoles = await db.select().from(roles);

    // For each role, fetch its permissions
    const rolesWithPermissions = await Promise.all(
      allRoles.map(async (r) => {
        const rps = await db
          .select({
            id: permissions.id,
            code: permissions.code,
            name: permissions.name,
            module: permissions.module,
            description: permissions.description
          })
          .from(rolePermissions)
          .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
          .where(eq(rolePermissions.roleId, r.id));
        return {
          ...r,
          permissions: rps
        };
      })
    );

    sendResponse(res, rolesWithPermissions);
  } catch (error) {
    sendError(res, 'فشل جلب الأدوار والصلاحيات', error);
  }
});

router.post('/roles', authorize(['manager', 'manage_users']), async (req, res) => {
  try {
    const { id, name, code, description, permissionIds } = req.body;
    if (!name || !code) {
      return sendError(res, 'الاسم والرمز مطلوبان لتسجيل دور جديد', null, 400);
    }

    const roleId = id || 'role_' + Math.random().toString(36).substr(2, 9);
    const existing = await db.select().from(roles).where(eq(roles.id, roleId));

    const dbValue = {
      id: roleId,
      name,
      code,
      description,
      updatedAt: new Date()
    };

    if (existing.length > 0) {
      await db.update(roles).set(dbValue).where(eq(roles.id, roleId));
    } else {
      await db.insert(roles).values(dbValue);
    }

    // Update role permissions mappings
    if (Array.isArray(permissionIds)) {
      // Clear old permissions
      await db.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId));

      // Insert new ones
      if (permissionIds.length > 0) {
        const rpsValues = permissionIds.map((pId, idx) => ({
          id: `rp_${roleId}_${idx}_${Math.random().toString(36).substr(2, 5)}`,
          roleId,
          permissionId: pId
        }));
        await db.insert(rolePermissions).values(rpsValues);
      }
    }

    sendResponse(res, { id: roleId, name, code, description, permissionIds });
  } catch (error) {
    sendError(res, 'فشل حفظ الدور والصلاحيات', error);
  }
});

router.delete('/roles/:id', authorize(['manager', 'manage_users']), async (req, res) => {
  try {
    const { id } = req.params;
    if (['role_manager', 'role_accountant', 'role_inventory', 'role_cashier'].includes(id)) {
      return sendError(res, 'لا يمكن حذف الأدوار النظامية الأساسية للمؤسسة', null, 400);
    }
    await db.delete(roles).where(eq(roles.id, id));
    sendResponse(res, { success: true });
  } catch (error) {
    sendError(res, 'فشل حذف الدور', error);
  }
});

router.get('/permissions', authorize(['manager', 'manage_users']), async (req, res) => {
  try {
    const allPermissions = await db.select().from(permissions);
    sendResponse(res, allPermissions);
  } catch (error) {
    sendError(res, 'فشل جلب الصلاحيات', error);
  }
});

// Users API
router.get('/users', authorize(['manager', 'manage_users']), async (req, res) => {
  try {
    const { page, limit, role } = req.query;
    const conditions = [];
    if (role) {
      conditions.push(eq(users.role, role as string));
    }
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    let total = 0;
    if (page || limit) {
      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(whereClause);
      total = Number(countResult[0]?.count || 0);
    }

    let query = db
      .select({
        id: users.id,
        uid: users.uid,
        email: users.email,
        name: users.name,
        role: users.role,
        roleId: users.roleId,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        roleName: roles.name,
        roleCode: roles.code
      })
      .from(users)
      .leftJoin(roles, eq(users.roleId, roles.id));

    if (whereClause) {
      query = query.where(whereClause) as any;
    }

    if (page && limit) {
      const p = parseInt(page as string) || 1;
      const l = parseInt(limit as string) || 10;
      query = query.limit(l).offset((p - 1) * l) as any;
    }

    const allUsers = await query;

    if (page || limit) {
      const p = parseInt(page as string) || 1;
      const l = parseInt(limit as string) || 10;
      sendResponse(res, allUsers, 200, { page: p, limit: l, total });
    } else {
      sendResponse(res, allUsers);
    }
  } catch (error) {
    sendError(res, 'فشل جلب المستخدمين', error);
  }
});

router.post('/users', authorize(['manager', 'manage_users']), async (req, res) => {
  try {
    const u = req.body;
    const errors = validateUser(u);
    if (errors.length > 0) {
      return sendError(res, 'خطأ في التحقق من البيانات', errors, 400);
    }

    const id = u.id || 'user_' + Math.random().toString(36).substr(2, 9);
    const existing = await db.select().from(users).where(eq(users.id, id));

    let finalRole = u.role || 'cashier';
    if (u.roleId) {
      const [r] = await db.select().from(roles).where(eq(roles.id, u.roleId));
      if (r) {
        finalRole = r.code;
      }
    }

    const dbValue = {
      id,
      uid: u.uid || id,
      email: u.email,
      name: u.name,
      role: finalRole,
      roleId: u.roleId || null,
      updatedAt: new Date()
    };

    if (existing.length > 0) {
      await db.update(users).set(dbValue).where(eq(users.id, id));
    } else {
      await db.insert(users).values(dbValue);
    }
    sendResponse(res, dbValue);
  } catch (error) {
    sendError(res, 'فشل حفظ المستخدم', error);
  }
});

router.delete('/users/:id', authorize(['manager', 'manage_users']), async (req: any, res) => {
  try {
    const { id } = req.params;
    if (id === '001' || id === req.user.id) {
      return sendError(res, 'غير مسموح بحذف الحساب الإداري الرئيسي أو حسابك النشط حالياً.', null, 400);
    }
    await db.delete(users).where(eq(users.id, id));
    sendResponse(res, { success: true });
  } catch (error) {
    sendError(res, 'فشل حذف المستخدم', error);
  }
});

// Cashboxes API
router.get('/cashboxes', async (req, res) => {
  try {
    const boxes = await db.select().from(cashboxes);
    const mapped = boxes.map(b => ({
      ...b,
      currentBalance: parseFloat(b.currentBalance || '0')
    }));
    sendResponse(res, mapped);
  } catch (error) {
    sendError(res, 'فشل جلب صناديق النقدية', error);
  }
});

router.post('/cashboxes', authorize(['manager']), async (req, res) => {
  try {
    const box = req.body;
    if (!box.name || box.name.trim() === '') {
      return sendError(res, 'اسم الصندوق مطلوب', null, 400);
    }
    const id = box.id || 'cashbox_' + Math.random().toString(36).substr(2, 9);
    const existing = await db.select().from(cashboxes).where(eq(cashboxes.id, id));

    const dbValue = {
      id,
      name: box.name,
      status: box.status || 'closed',
      currentBalance: (box.currentBalance || 0).toString(),
      lastOpenedAt: box.lastOpenedAt || null,
      lastClosedAt: box.lastClosedAt || null
    };

    if (existing.length > 0) {
      await db.update(cashboxes).set(dbValue).where(eq(cashboxes.id, id));
    } else {
      await db.insert(cashboxes).values(dbValue);
    }
    sendResponse(res, dbValue);
  } catch (error) {
    sendError(res, 'فشل حفظ صندوق النقدية', error);
  }
});

router.post('/cashboxes/open', authorize(['manager', 'cashier']), async (req, res) => {
  try {
    const { id, startBalance } = req.body;
    if (!id) return sendError(res, 'معرف الصندوق مطلوب', null, 400);

    const [box] = await db.select().from(cashboxes).where(eq(cashboxes.id, id));
    if (!box) return sendError(res, 'الصندوق غير موجود', null, 404);

    const updated = {
      status: 'open',
      currentBalance: (startBalance || 0).toString(),
      lastOpenedAt: new Date().toISOString()
    };
    await db.update(cashboxes).set(updated).where(eq(cashboxes.id, id));
    sendResponse(res, { success: true, box: { ...box, ...updated } });
  } catch (error) {
    sendError(res, 'فشل فتح الصندوق', error);
  }
});

router.post('/cashboxes/close', authorize(['manager', 'cashier']), async (req, res) => {
  try {
    const { id, endBalance } = req.body;
    if (!id) return sendError(res, 'معرف الصندوق مطلوب', null, 400);

    const [box] = await db.select().from(cashboxes).where(eq(cashboxes.id, id));
    if (!box) return sendError(res, 'الصندوق غير موجود', null, 404);

    const updated = {
      status: 'closed',
      currentBalance: (endBalance || 0).toString(),
      lastClosedAt: new Date().toISOString()
    };
    await db.update(cashboxes).set(updated).where(eq(cashboxes.id, id));
    sendResponse(res, { success: true, box: { ...box, ...updated } });
  } catch (error) {
    sendError(res, 'فشل إغلاق الصندوق', error);
  }
});

export default router;
