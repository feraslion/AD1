import { Response, Request, NextFunction } from 'express';
import { db } from '../../../database/index.ts';
import { TokenService } from '../../../../core/auth/TokenService.ts';
import { ROLE_DEFAULT_PERMISSIONS } from '../../../../core/server/middleware/auth.ts';
import {
  users,
  permissions,
  rolePermissions,
  postingRules
} from '../../../database/schema.ts';
import { eq } from 'drizzle-orm';
import { AccountingRepository } from '../../../../core/repositories/index.ts';

export interface AuthenticatedUser {
  id: string;
  uid?: string;
  email?: string;
  name: string;
  role: string;
  roleId?: string | null;
  permissions?: string[];
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export function sendResponse(res: Response, data: unknown, status = 200, pagination?: unknown) {
  res.status(status).json({
    success: true,
    data,
    ...(pagination && { pagination })
  });
}

export function sendError(res: Response, message: string, details?: unknown, status = 500) {
  res.status(status).json({
    success: false,
    error: message,
    ...(details && { details })
  });
}

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    let userRecord: AuthenticatedUser | null = null;
    let decodedPayload: ReturnType<typeof TokenService.verifyAccessToken> = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7).trim();

      // 1. Verify JWT
      decodedPayload = TokenService.verifyAccessToken(token);

      if (decodedPayload) {
        const [u] = await db.select().from(users).where(eq(users.id, decodedPayload.id));
        if (u) {
          userRecord = u as AuthenticatedUser;
        } else {
          userRecord = {
            id: decodedPayload.id,
            uid: decodedPayload.uid || decodedPayload.id,
            email: decodedPayload.email,
            name: decodedPayload.name || 'User',
            role: decodedPayload.role || 'cashier',
            roleId: decodedPayload.roleId
          };
        }
      } else {
        // 2. Fallback to direct code login (e.g. Bearer 001, 002)
        const [u] = await db.select().from(users).where(eq(users.id, token));
        if (u) {
          userRecord = u as AuthenticatedUser;
        }
      }
    }

    // Default manager user fallback for dev/testing session
    if (!userRecord) {
      const [master] = await db.select().from(users).where(eq(users.id, '001'));
      userRecord = (master as AuthenticatedUser) || { id: '001', uid: '001', email: 'manager@system.com', name: 'عبدالرحمن (المدير العام)', role: 'manager', roleId: 'role_manager' };
    }

    // Load permissions for userRecord
    if (userRecord) {
      let userPermissions: string[] = [];
      try {
        if (userRecord.roleId) {
          const perms = await db
            .select({ code: permissions.code })
            .from(rolePermissions)
            .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
            .where(eq(rolePermissions.roleId, userRecord.roleId));
          userPermissions = perms.map(p => p.code);
        }
      } catch (dbErr) {
        console.error('Error fetching db permissions:', dbErr);
      }

      const userRole = userRecord.role || 'cashier';
      const defaultPerms = ROLE_DEFAULT_PERMISSIONS[userRole] || ROLE_DEFAULT_PERMISSIONS.cashier;
      userRecord.permissions = Array.from(new Set([...userPermissions, ...defaultPerms]));
    }

    req.user = userRecord;
    next();
  } catch (error) {
    sendError(res, 'غير مصرح به - فشل التحقق من الهوية', error, 401);
  }
}

export function authorize(requirements: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'غير مصرح به - الرجاء تسجيل الدخول أولاً'
      });
    }

    // Manager role always has all permissions/full bypass
    if (req.user.role === 'manager' || req.user.role === 'admin') {
      return next();
    }

    const userPerms = req.user.permissions || [];
    const userRole = req.user.role;
    const hasMatch = requirements.some(reqStr => {
      // Check if matches direct role
      if (reqStr === userRole) return true;
      // Check if matches a permission code directly or mapped
      if (userPerms.includes(reqStr)) return true;
      if (reqStr === 'view_accounting' && userPerms.includes('accounting.view')) return true;
      if (reqStr === 'manage_inventory' && userPerms.includes('inventory.manage')) return true;
      if (reqStr === 'view_purchases' && userPerms.includes('purchases.view')) return true;
      if (reqStr === 'view_invoices' && userPerms.includes('sales.view')) return true;
      if (reqStr === 'pos_access' && userPerms.includes('sales.view')) return true;
      if (reqStr === 'view_reports' && userPerms.includes('reports.view')) return true;
      return false;
    });

    if (!hasMatch) {
      return res.status(403).json({
        success: false,
        error: `صلاحيات غير كافية! هذه العملية تتطلب أحد الصلاحيات أو الأدوار التالية: ${requirements.join(' أو ')}`
      });
    }

    next();
  };
}

export async function postJournalEntry(
  entryNumber: string,
  description: string,
  date: string,
  lines: { accountId: string; debit: number; credit: number; currency?: string; exchangeRate?: number; foreignDebit?: number; foreignCredit?: number }[],
  options?: { currency?: string; exchangeRate?: number; baseCurrency?: string }
) {
  return await AccountingRepository.postJournalEntry(entryNumber, description, date, lines, options);
}

export async function getAccountByRule(ruleCode: string, defaultAccountId: string): Promise<string> {
  try {
    const [rule] = await db.select().from(postingRules).where(eq(postingRules.ruleCode, ruleCode));
    return rule ? rule.accountId : defaultAccountId;
  } catch (error) {
    console.error(`Error resolving account for rule ${ruleCode}:`, error);
    return defaultAccountId;
  }
}
