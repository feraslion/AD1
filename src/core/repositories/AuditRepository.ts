import { db } from '../database/index.ts';
import { auditLogs } from '../database/schema.ts';
import { desc, eq, gte, lte, and } from 'drizzle-orm';

export interface AuditLogItem {
  id: string;
  companyId: string;
  userId?: string;
  userName: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: string;
  ipAddress?: string;
  createdAt: string;
}

export class AuditRepository {
  static async log(data: {
    companyId?: string;
    userId?: string;
    userName?: string;
    action: string;
    entity: string;
    entityId?: string;
    details?: string;
    ipAddress?: string;
  }): Promise<AuditLogItem> {
    const id = `audit_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const compId = data.companyId || 'company-1';
    const userName = data.userName || 'النظام (System)';
    const nowStr = new Date().toISOString();

    const newLog: AuditLogItem = {
      id,
      companyId: compId,
      userId: data.userId,
      userName,
      action: data.action,
      entity: data.entity,
      entityId: data.entityId,
      details: data.details,
      ipAddress: data.ipAddress || '127.0.0.1',
      createdAt: nowStr
    };

    try {
      await db.insert(auditLogs).values({
        id,
        companyId: compId,
        userId: data.userId,
        userName,
        action: data.action,
        module: data.entity,
        recordId: data.entityId,
        details: data.details,
        ipAddress: data.ipAddress || '127.0.0.1',
        createdAt: new Date()
      });
    } catch (_) {
      // In case audit_logs table isn't created yet or mock fallback
    }

    return newLog;
  }

  static async getLogs(filter?: { entity?: string; action?: string; limit?: number }) {
    const limitVal = filter?.limit || 50;
    try {
      const logs = await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(limitVal);
      return logs;
    } catch (_) {
      return [];
    }
  }
}
