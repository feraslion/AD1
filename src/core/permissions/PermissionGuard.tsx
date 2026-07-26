import React from 'react';
import { PermissionService, ModuleKey, UserSession } from './PermissionService';
import { ShieldAlert, Lock } from 'lucide-react';

interface PermissionGuardProps {
  children: React.ReactNode;
  user: UserSession | null;
  module?: ModuleKey;
  permission?: string;
  requiredRole?: string;
  fallback?: React.ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  user,
  module,
  permission,
  requiredRole,
  fallback
}) => {
  if (!user) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3" dir="rtl">
        <Lock className="w-8 h-8 text-slate-400 mx-auto" />
        <h3 className="font-extrabold text-slate-800 text-sm">تسجيل الدخول مطلوب</h3>
        <p className="text-xs text-slate-500">يرجى تسجيل الدخول للوصول إلى هذه الصفحة.</p>
      </div>
    );
  }

  // Managers always pass
  if (user.role === 'manager' || user.role === 'admin') {
    return <>{children}</>;
  }

  // Check role requirement if specified
  if (requiredRole && user.role !== requiredRole) {
    return (
      fallback || (
        <div className="p-8 text-center bg-rose-50 border border-rose-100 rounded-3xl space-y-3 max-w-lg mx-auto my-8" dir="rtl">
          <ShieldAlert className="w-10 h-10 text-rose-600 mx-auto" />
          <h3 className="font-extrabold text-rose-900 text-base">صلاحيات غير كافية</h3>
          <p className="text-xs text-rose-700 font-semibold">
            عذراً، الوصول إلى هذا القسم يتطلب دور <strong>({requiredRole})</strong>. دورك الحالي هو <strong>({user.role})</strong>.
          </p>
        </div>
      )
    );
  }

  // Check module level requirement if specified
  if (module && !PermissionService.canAccessModule(user.role, user.permissions, module)) {
    return (
      fallback || (
        <div className="p-8 text-center bg-rose-50 border border-rose-100 rounded-3xl space-y-3 max-w-lg mx-auto my-8" dir="rtl">
          <ShieldAlert className="w-10 h-10 text-rose-600 mx-auto" />
          <h3 className="font-extrabold text-rose-900 text-base">تم حظر الوصول للوحدة</h3>
          <p className="text-xs text-rose-700 font-semibold">
            عذراً، وحدة <strong>({module})</strong> غير مفعالة في صلاحيات حسابك.
          </p>
        </div>
      )
    );
  }

  // Check explicit granular permission code if specified
  if (permission && !PermissionService.hasPermission(user, permission)) {
    return (
      fallback || (
        <div className="p-8 text-center bg-rose-50 border border-rose-100 rounded-3xl space-y-3 max-w-lg mx-auto my-8" dir="rtl">
          <ShieldAlert className="w-10 h-10 text-rose-600 mx-auto" />
          <h3 className="font-extrabold text-rose-900 text-base">صلاحية غير متوفرة</h3>
          <p className="text-xs text-rose-700 font-semibold">
            عذراً، حسابك لا يملك كود الصلاحية المطلوب: <code className="bg-rose-100 px-2 py-0.5 rounded text-rose-900 font-mono text-[11px]">{permission}</code>
          </p>
        </div>
      )
    );
  }

  return <>{children}</>;
};
