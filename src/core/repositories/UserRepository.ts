import { db } from '../database/index.ts';
import { users, roles, permissions } from '../database/schema.ts';
import { eq } from 'drizzle-orm';

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

  static async getRoles() {
    return await db.select().from(roles);
  }

  static async createRole(roleData: any) {
    await db.insert(roles).values(roleData);
    return roleData;
  }

  static async getPermissions() {
    return await db.select().from(permissions);
  }
}
