import React from 'react';
import { ModuleKey, PermissionService, UserSession } from '../permissions/PermissionService';
import { ShieldAlert, Lock, ArrowRight } from 'lucide-react';

interface ProtectedRouteProps {
  user: UserSession | null;
  module: ModuleKey;
  children: React.ReactNode;
  onNavigateToAllowed?: (targetModule: ModuleKey) => void;
  onLogout?: () => void;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  user,
  module,
  children,
  onNavigateToAllowed,
  onLogout
}) => {
  const hasAccess = PermissionService.canAccessModule(
    user?.role || '',
    user?.permissions,
    module
  );

  if (!hasAccess) {
    const roleTitle = 
      user?.role === 'manager' ? 'المدير العام' :
      user?.role === 'accountant' ? 'المحاسب المالي' :
      user?.role === 'inventory' ? 'أمين المستودع' :
      user?.role === 'cashier' ? 'موظف الكاشير' : user?.role;

    return (
      <div className="min-h-[60vh] bg-white border border-rose-200 shadow-sm rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-6 my-6">
        <div className="w-16 h-16 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-center text-rose-600 shadow-inner">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2 max-w-md">
          <h2 className="text-xl font-black text-slate-800">عفواً، لا تملك الصلاحية لدخول هذه الشاشة</h2>
          <p className="text-xs text-slate-500 leading-relaxed font-medium">
            دورك الحالي كـ (<span className="font-extrabold text-slate-800">{roleTitle}</span>) لا يتضمن صلاحية الوصول إلى وحدة (<span className="font-mono text-rose-600">{module}</span>). يرجى التواصل مع المشرف العام للترقية أو تبديل حساب الموظف.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 justify-center pt-2">
          {user?.role === 'cashier' && onNavigateToAllowed && (
            <button
              onClick={() => onNavigateToAllowed('sales')}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow flex items-center gap-2 transition"
            >
              <ArrowRight className="w-4 h-4" />
              <span>الذهاب إلى نقطة البيع (POS)</span>
            </button>
          )}

          {user?.role === 'inventory' && onNavigateToAllowed && (
            <button
              onClick={() => onNavigateToAllowed('inventory')}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow flex items-center gap-2 transition"
            >
              <ArrowRight className="w-4 h-4" />
              <span>الذهاب إلى إدارة المخزن</span>
            </button>
          )}

          {user?.role === 'accountant' && onNavigateToAllowed && (
            <button
              onClick={() => onNavigateToAllowed('accounting')}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow flex items-center gap-2 transition"
            >
              <ArrowRight className="w-4 h-4" />
              <span>الذهاب إلى الشاشة المحاسبية</span>
            </button>
          )}

          {onLogout && (
            <button
              onClick={onLogout}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-2 border border-slate-200"
            >
              <Lock className="w-4 h-4" />
              <span>تسجيل الخروج وتبديل الحساب</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
