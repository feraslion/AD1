// Enterprise Permission Checking Service & RBAC Layer
import { logger } from '../../shared/utils/logger';

export interface UserSession {
  id: string;
  name: string;
  email?: string;
  role: string;
  roleId?: string | null;
  code: string;
  permissions?: string[];
  token?: string;
}

// Module keys used across application navigation
export type ModuleKey = 
  | 'dashboard'
  | 'sales'
  | 'inventory'
  | 'purchases'
  | 'accounting'
  | 'reports'
  | 'settings'
  | 'users';

// Standard default permissions by role code
export const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  manager: [
    'dashboard.view', 'sales.view', 'sales.create', 'sales.delete',
    'inventory.view', 'inventory.manage', 'purchases.view', 'purchases.manage',
    'accounting.view', 'accounting.manage', 'reports.view', 'settings.manage', 'users.manage'
  ],
  accountant: [
    'dashboard.view', 'accounting.view', 'accounting.manage', 'reports.view',
    'sales.view', 'purchases.view'
  ],
  inventory: [
    'dashboard.view', 'inventory.view', 'inventory.manage',
    'purchases.view', 'purchases.manage'
  ],
  cashier: [
    'sales.view', 'sales.create'
  ]
};

// Module access mapping by role
export const ROLE_MODULE_ACCESS: Record<string, ModuleKey[]> = {
  manager: ['dashboard', 'sales', 'inventory', 'purchases', 'accounting', 'reports', 'settings', 'users'],
  accountant: ['accounting', 'dashboard', 'reports', 'sales', 'purchases'],
  inventory: ['inventory', 'purchases', 'dashboard'],
  cashier: ['sales']
};

export const PermissionService = {
  /**
   * Check if user role or permission list allows access to a specific module
   */
  canAccessModule: (userRole: string, userPermissions?: string[], moduleKey?: ModuleKey): boolean => {
    if (!userRole) return false;

    // Manager role has supreme access to all modules
    if (userRole === 'manager' || userRole === 'admin') {
      return true;
    }

    if (!moduleKey) return true;

    // Check custom permissions list if available
    if (userPermissions && userPermissions.length > 0) {
      const hasDirectPermission = userPermissions.some(p => p.startsWith(`${moduleKey}.`));
      if (hasDirectPermission) return true;
    }

    // Fallback to role-based module mapping
    const allowedModules = ROLE_MODULE_ACCESS[userRole] || [];
    return allowedModules.includes(moduleKey);
  },

  /**
   * Check if a user session holds a specific granular permission string (e.g. 'accounting.manage')
   */
  hasPermission: (user: UserSession | null, permissionCode: string): boolean => {
    if (!user || !user.role) return false;
    if (user.role === 'manager' || user.role === 'admin') return true;

    if (user.permissions && user.permissions.includes(permissionCode)) {
      return true;
    }

    const defaultPerms = DEFAULT_ROLE_PERMISSIONS[user.role] || [];
    return defaultPerms.includes(permissionCode);
  },

  /**
   * Get active user session from localStorage safely
   */
  getCurrentUser: (): UserSession | null => {
    try {
      const stored = localStorage.getItem('erp_active_user');
      if (!stored) return null;
      return JSON.parse(stored) as UserSession;
    } catch (e) {
      logger.error('PermissionService', 'Failed to read user session from storage', e);
      return null;
    }
  },

  /**
   * Set user session in storage
   */
  setCurrentUser: (user: UserSession): void => {
    try {
      localStorage.setItem('erp_active_user', JSON.stringify(user));
      logger.info('PermissionService', `User session stored for ${user.name} (${user.role})`);
    } catch (e) {
      logger.error('PermissionService', 'Failed to store user session', e);
    }
  },

  /**
   * Clear active session
   */
  clearSession: (): void => {
    localStorage.removeItem('erp_active_user');
    localStorage.removeItem('erp_auth_token');
    logger.info('PermissionService', 'User session cleared');
  }
};
