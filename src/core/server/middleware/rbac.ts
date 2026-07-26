import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';

export function authorize(requiredPermissionsOrRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'غير مصرح به - الرجاء تسجيل الدخول أولاً',
        statusCode: 401
      });
    }

    // Manager role always bypasses / has full permissions
    if (req.user.role === 'manager') {
      return next();
    }

    const hasPermission = requiredPermissionsOrRoles.some(reqStr => {
      // Direct role match
      if (reqStr === req.user?.role) return true;
      // Permission code match
      if (req.user?.permissions && req.user.permissions.includes(reqStr)) return true;
      return false;
    });

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        error: `صلاحيات غير كافية! هذه العملية تتطلب إحدى الصلاحيات التالية: ${requiredPermissionsOrRoles.join(', ')}`,
        statusCode: 403
      });
    }

    next();
  };
}
