import { Request, Response, NextFunction } from 'express';
import { db } from '../../database/index.ts';
import { users, permissions, rolePermissions } from '../../database/schema.ts';
import { eq } from 'drizzle-orm';
import { TokenService } from '../../auth/TokenService.ts';

export interface AuthenticatedUser {
  id: string;
  uid: string;
  email: string;
  name: string;
  role: string;
  roleId?: string | null;
  companyId?: string | null;
  branchId?: string | null;
  permissions: string[];
  isVerified?: boolean;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

// Role default permission fallbacks (both snake_case and dot notation supported)
export const ROLE_DEFAULT_PERMISSIONS: Record<string, string[]> = {
  manager: [
    'view_dashboard', 'dashboard.view',
    'pos_access', 'sales.view', 'sales.create', 'sales.delete', 'view_invoices',
    'manage_inventory', 'inventory.view', 'inventory.manage',
    'view_purchases', 'purchases.view', 'purchases.manage',
    'view_accounting', 'accounting.view', 'accounting.manage',
    'view_reports', 'reports.view',
    'view_settings', 'settings.manage',
    'manage_users', 'users.manage',
    'manage_roles', 'treasury_access'
  ],
  accountant: [
    'view_dashboard', 'dashboard.view',
    'pos_access', 'sales.view', 'view_invoices',
    'view_purchases', 'purchases.view',
    'view_accounting', 'accounting.view', 'accounting.manage',
    'view_reports', 'reports.view',
    'treasury_access'
  ],
  inventory: [
    'view_dashboard', 'dashboard.view',
    'manage_inventory', 'inventory.view', 'inventory.manage',
    'view_purchases', 'purchases.view', 'purchases.manage'
  ],
  cashier: [
    'pos_access', 'sales.view', 'sales.create', 'view_invoices'
  ]
};

export async function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    let userRecord: any = null;
    let decodedPayload: any = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7).trim();

      // 1. Check if token is a valid JWT
      decodedPayload = TokenService.verifyAccessToken(token);

      if (decodedPayload) {
        // Fetch fresh user record from DB
        const [u] = await db.select().from(users).where(eq(users.id, decodedPayload.id));
        if (u) {
          userRecord = u;
        } else {
          // If deleted or not found in DB but JWT valid
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
        // 2. Fallback: direct code login (e.g. Bearer 001) for POS/PIN / Legacy test compatibility
        const [u] = await db.select().from(users).where(eq(users.id, token));
        if (u) {
          userRecord = u;
        }
      }
    }

    // 3. Fallback for unauthenticated requests or invalid/stale tokens in development
    if (!userRecord && process.env.NODE_ENV !== 'production') {
      const [master] = await db.select().from(users).where(eq(users.id, '001'));
      userRecord = master || {
        id: '001',
        uid: '001',
        email: 'manager@system.com',
        name: 'عبدالرحمن (المدير العام)',
        role: 'manager',
        roleId: 'role_manager'
      };
    }

    if (!userRecord) {
      return res.status(401).json({
        success: false,
        error: 'غير مصرح به - فشل التحقق من الهوية',
        statusCode: 401
      });
    }

    // 4. Load permissions from DB RBAC or fallbacks
    let userPermissions: string[] = [];
    if (userRecord.roleId) {
      try {
        const perms = await db
          .select({ code: permissions.code })
          .from(rolePermissions)
          .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
          .where(eq(rolePermissions.roleId, userRecord.roleId));
        userPermissions = perms.map(p => p.code);
      } catch (dbErr) {
        // Fallback
      }
    }

    const userRole = userRecord.role || 'cashier';
    const defaultPerms = ROLE_DEFAULT_PERMISSIONS[userRole] || ROLE_DEFAULT_PERMISSIONS.cashier;
    
    // Combine assigned and default permissions
    const mergedPermissions = Array.from(new Set([...userPermissions, ...defaultPerms]));

    req.user = {
      id: userRecord.id,
      uid: userRecord.uid || userRecord.id,
      email: userRecord.email,
      name: userRecord.name || 'User',
      role: userRole,
      roleId: userRecord.roleId,
      companyId: userRecord.companyId,
      branchId: userRecord.branchId,
      permissions: mergedPermissions,
      isVerified: userRecord.isEmailVerified ?? true
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'غير مصرح به - فشل التحقق من الهوية',
      statusCode: 401
    });
  }
}

/**
 * Permission Guard Middleware
 */
export function requirePermission(...requiredPermissions: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'غير مصرح به - يرجى تسجيل الدخول أولاً',
        statusCode: 401
      });
    }

    // Managers have full access
    if (req.user.role === 'manager' || req.user.role === 'admin') {
      return next();
    }

    const userPerms = req.user.permissions || [];
    const hasPermission = requiredPermissions.some(perm => {
      if (userPerms.includes(perm)) return true;
      // Handle dot vs snake notation (e.g. view_accounting <-> accounting.view)
      if (perm === 'view_accounting' && userPerms.includes('accounting.view')) return true;
      if (perm === 'accounting.view' && userPerms.includes('view_accounting')) return true;
      if (perm === 'manage_inventory' && userPerms.includes('inventory.manage')) return true;
      if (perm === 'inventory.manage' && userPerms.includes('manage_inventory')) return true;
      if (perm === 'view_purchases' && userPerms.includes('purchases.view')) return true;
      if (perm === 'purchases.view' && userPerms.includes('view_purchases')) return true;
      if (perm === 'view_invoices' && userPerms.includes('sales.view')) return true;
      if (perm === 'sales.view' && userPerms.includes('view_invoices')) return true;
      if (perm === 'pos_access' && userPerms.includes('sales.view')) return true;
      if (perm === 'view_reports' && userPerms.includes('reports.view')) return true;
      if (perm === 'reports.view' && userPerms.includes('view_reports')) return true;
      return false;
    });

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        error: `غير مصرح به - لا تملك الصلاحية الكافية (${requiredPermissions.join(', ')})`,
        statusCode: 403,
        requiredPermissions
      });
    }

    next();
  };
}

/**
 * Role Guard Middleware
 */
export function requireRole(...allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'غير مصرح به - يرجى تسجيل الدخول أولاً',
        statusCode: 401
      });
    }

    if (req.user.role === 'manager' || allowedRoles.includes(req.user.role)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      error: `غير مصرح به - دورك الحالي (${req.user.role}) لا يملك الإذن للوصول`,
      statusCode: 403,
      allowedRoles
    });
  };
}
