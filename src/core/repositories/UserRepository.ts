import { db } from '../database/index.ts';
import { users, roles, permissions, rolePermissions } from '../database/schema.ts';
import { eq, sql, and } from 'drizzle-orm';

export class UserRepository {
  static async findAll() {
    return await db.select().from(users);
  }

  static async findById(id: string) {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0] || null;
  }

  static async findByUid(uid: string) {
    const result = await db.select().from(users).where(eq(users.uid, uid));
    return result[0] || null;
  }

  static async findByEmail(email: string) {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0] || null;
  }

  static async create(userData: any) {
    await db.insert(users).values(userData);
    return userData;
  }

  static async update(id: string, userData: any) {
    await db.update(users).set(userData).where(eq(users.id, id));
    return { id, ...userData };
  }

  static async delete(id: string) {
    await db.delete(users).where(eq(users.id, id));
    return { success: true };
  }

  static async getRolesWithPermissions() {
    const allRoles = await db.select().from(roles);
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
    return rolesWithPermissions;
  }

  static async saveRole(data: any) {
    const { id, name, code, description, permissionIds } = data;
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

    if (Array.isArray(permissionIds)) {
      await db.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId));
      if (permissionIds.length > 0) {
        const rpsValues = permissionIds.map((pId, idx) => ({
          id: `rp_${roleId}_${idx}_${Math.random().toString(36).substr(2, 5)}`,
          roleId,
          permissionId: pId
        }));
        await db.insert(rolePermissions).values(rpsValues);
      }
    }

    return { id: roleId, name, code, description, permissionIds };
  }

  static async deleteRole(id: string) {
    if (['role_manager', 'role_accountant', 'role_inventory', 'role_cashier'].includes(id)) {
      throw new Error('لا يمكن حذف الأدوار النظامية الأساسية للمؤسسة');
    }
    await db.delete(roles).where(eq(roles.id, id));
    return { success: true };
  }

  static async getAllPermissions() {
    return await db.select().from(permissions);
  }

  static async getUsers(options?: { page?: number; limit?: number; role?: string }) {
    const conditions = [];
    if (options?.role) {
      conditions.push(eq(users.role, options.role));
    }
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    let total = 0;
    if (options?.page || options?.limit) {
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

    if (options?.page && options?.limit) {
      const p = options.page || 1;
      const l = options.limit || 10;
      query = query.limit(l).offset((p - 1) * l) as any;
    }

    const items = await query;
    return { items, pagination: options?.page || options?.limit ? { page: options.page || 1, limit: options.limit || 10, total } : undefined };
  }

  static async saveUser(u: any) {
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
    return dbValue;
  }

  static async deleteUser(id: string) {
    await db.delete(users).where(eq(users.id, id));
    return { success: true };
  }
}
