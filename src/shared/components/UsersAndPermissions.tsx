import React, { useState, useEffect } from 'react';
import { UserService } from '../../services/api';
import { Save, Plus, ShieldCheck, Users, Key, Trash2, Edit2, CheckSquare, Square, RefreshCw, AlertCircle } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  roleId: string | null;
  roleName?: string;
  roleCode?: string;
}

interface Role {
  id: string;
  name: string;
  code: string;
  description: string;
  permissions: Permission[];
}

interface Permission {
  id: string;
  name: string;
  code: string;
  module: string;
  description: string;
}

export default function UsersAndPermissions() {
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'roles'>('users');
  const [usersList, setUsersList] = useState<User[]>([]);
  const [rolesList, setRolesList] = useState<Role[]>([]);
  const [permissionsList, setPermissionsList] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // User Form State
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userRoleId, setUserRoleId] = useState('');

  // Role Form State
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleNameInput, setRoleNameInput] = useState('');
  const [roleCodeInput, setRoleCodeInput] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [uRes, rRes, pRes] = await Promise.all([
        UserService.getUsers(),
        UserService.getRoles(),
        UserService.getPermissions()
      ]);
      setUsersList(uRes);
      setRolesList(rRes);
      setPermissionsList(pRes);
    } catch (err: any) {
      console.error('Error fetching security data:', err);
      setError(err.message || 'حدث خطأ أثناء تحميل صلاحيات وموظفي المؤسسة');
    } finally {
      setLoading(false);
    }
  };

  // --- USER HANDLERS ---
  const handleOpenUserModal = (user: User | null = null) => {
    if (user) {
      setEditingUser(user);
      setUserName(user.name);
      setUserEmail(user.email);
      setUserRoleId(user.roleId || '');
    } else {
      setEditingUser(null);
      setUserName('');
      setUserEmail('');
      setUserRoleId(rolesList[0]?.id || '');
    }
    setShowUserModal(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !userEmail.trim()) {
      alert('الرجاء تعبئة كافة الحقول المطلوبة');
      return;
    }

    try {
      const userData = {
        id: editingUser?.id,
        name: userName,
        email: userEmail,
        roleId: userRoleId || null
      };
      await UserService.createUser(userData);
      setShowUserModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'فشل حفظ بيانات الموظف');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (confirm('هل تود بالتأكيد حذف حساب هذا الموظف وسحب كافة صلاحياته؟')) {
      try {
        await UserService.deleteUser(id);
        fetchData();
      } catch (err: any) {
        alert(err.message || 'فشل حذف الموظف');
      }
    }
  };

  // --- ROLE HANDLERS ---
  const handleOpenRoleModal = (role: Role | null = null) => {
    if (role) {
      setEditingRole(role);
      setRoleNameInput(role.name);
      setRoleCodeInput(role.code);
      setRoleDescription(role.description);
      setSelectedPermissionIds(role.permissions.map(p => p.id));
    } else {
      setEditingRole(null);
      setRoleNameInput('');
      setRoleCodeInput('');
      setRoleDescription('');
      setSelectedPermissionIds([]);
    }
    setShowRoleModal(true);
  };

  const handleTogglePermission = (pId: string) => {
    setSelectedPermissionIds(prev => 
      prev.includes(pId) ? prev.filter(id => id !== pId) : [...prev, pId]
    );
  };

  const handleSelectAllInModule = (module: string) => {
    const modulePermIds = permissionsList.filter(p => p.module === module).map(p => p.id);
    const allSelected = modulePermIds.every(id => selectedPermissionIds.includes(id));

    if (allSelected) {
      setSelectedPermissionIds(prev => prev.filter(id => !modulePermIds.includes(id)));
    } else {
      setSelectedPermissionIds(prev => {
        const unique = new Set([...prev, ...modulePermIds]);
        return Array.from(unique);
      });
    }
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleNameInput.trim() || !roleCodeInput.trim()) {
      alert('الرجاء إدخال اسم الدور ورمز الدور المعتمد');
      return;
    }

    try {
      const roleData = {
        id: editingRole?.id,
        name: roleNameInput,
        code: roleCodeInput.toLowerCase().trim(),
        description: roleDescription,
        permissionIds: selectedPermissionIds
      };
      await UserService.createRole(roleData);
      setShowRoleModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'فشل حفظ الدور البرمجي للمؤسسة');
    }
  };

  const handleDeleteRole = async (id: string) => {
    if (['role_manager', 'role_accountant', 'role_inventory', 'role_cashier'].includes(id)) {
      alert('لا يمكن حذف الأدوار الافتراضية المحمية في نظام المؤسسة.');
      return;
    }
    if (confirm('تحذير: سيؤدي حذف هذا الدور إلى تجريد الموظفين المنسوبين إليه من الصلاحيات. هل تود الاستمرار؟')) {
      try {
        await UserService.deleteRole(id);
        fetchData();
      } catch (err: any) {
        alert(err.message || 'فشل حذف الدور');
      }
    }
  };

  const getModuleTitle = (mod: string) => {
    switch (mod) {
      case 'dashboard': return 'لوحة التحكم والإحصائيات';
      case 'sales': return 'المبيعات ونقاط البيع POS';
      case 'inventory': return 'إدارة المخزن والمنتجات';
      case 'purchases': return 'المشتريات والموردين';
      case 'accounting': return 'القيود والحسابات والقيود المالية';
      case 'settings': return 'إعدادات النظام والضريبة والمنشأة';
      case 'users': return 'الموظفين وصلاحيات الأمان';
      default: return mod;
    }
  };

  // Group permissions by module
  const modules: string[] = Array.from(new Set(permissionsList.map(p => p.module)));

  return (
    <div className="space-y-6">
      {/* Title Header with custom visual decorations */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl"></div>
        <div className="space-y-1.5 z-10">
          <h2 className="text-xl sm:text-2xl font-black text-slate-100 flex items-center gap-3">
            <ShieldCheck className="w-7 h-7 text-emerald-400" />
            <span>نظام الحماية والأمان المؤسسي (Enterprise RBAC)</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            إدارة الموظفين والوصول المعتمد للأدوار الوظيفية ومصفوفة الصلاحيات المتقدمة لحفظ نزاهة بياناتك
          </p>
        </div>
        <button
          onClick={fetchData}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-2 border border-slate-700 hover:text-white"
        >
          <RefreshCw className="w-4 h-4" />
          <span>تحديث مصفوفة الصلاحيات</span>
        </button>
      </div>

      {error && (
        <div className="bg-rose-950/40 border border-rose-800 text-rose-300 p-4 rounded-xl flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Primary Sub-Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveSubTab('users')}
          className={`py-3 px-6 font-extrabold text-sm transition-all flex items-center gap-2 border-b-2 ${
            activeSubTab === 'users'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>إدارة الموظفين والمستخدمين ({usersList.length})</span>
        </button>
        <button
          onClick={() => setActiveSubTab('roles')}
          className={`py-3 px-6 font-extrabold text-sm transition-all flex items-center gap-2 border-b-2 ${
            activeSubTab === 'roles'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Key className="w-4 h-4" />
          <span>أدوار النظام ومصفوفة الصلاحيات ({rolesList.length})</span>
        </button>
      </div>

      {loading ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center space-y-4">
          <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
          <span className="text-slate-500 text-sm font-bold">جاري تحميل بيانات الأمان والصلاحيات...</span>
        </div>
      ) : activeSubTab === 'users' ? (
        /* ==================== USERS TAB ==================== */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-5">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-slate-800 text-base">👥 قائمة الموظفين النشطين بالـ ERP</h3>
              <p className="text-xs text-slate-400">توزيع صلاحيات العمل على الموظفين وربطهم بالأدوار المحددة</p>
            </div>
            <button
              onClick={() => handleOpenUserModal(null)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow flex items-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>إضافة موظف جديد</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50">
                  <th className="py-3 px-4">رقم الموظف</th>
                  <th className="py-3 px-4">الاسم الكامل</th>
                  <th className="py-3 px-4">البريد الإلكتروني</th>
                  <th className="py-3 px-4">الدور المحاسبي والوظيفي</th>
                  <th className="py-3 px-4">الصلاحيات الفعالة</th>
                  <th className="py-3 px-4 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-700">{u.id}</td>
                    <td className="py-3.5 px-4 font-extrabold text-slate-800">{u.name}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">{u.email}</td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${
                        u.role === 'manager' 
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                          : u.role === 'accountant'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : u.role === 'inventory'
                          ? 'bg-amber-50 text-amber-700 border border-amber-100'
                          : 'bg-blue-50 text-blue-700 border border-blue-100'
                      }`}>
                        {u.roleName || (u.role === 'manager' ? 'المدير العام' : u.role === 'accountant' ? 'المحاسب المالي' : u.role === 'inventory' ? 'أمين المستودع' : 'موظف الكاشير')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs truncate">
                      <span className="text-[11px] text-slate-400 font-bold">
                        {u.role === 'manager' 
                          ? 'كامل صلاحيات الإدارة العليا والتحكم بالصلاحيات' 
                          : 'صلاحيات مخصصة حسب الدور المربوط'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex justify-center items-center gap-2">
                        <button
                          onClick={() => handleOpenUserModal(u)}
                          className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 rounded-lg transition"
                          title="تعديل الموظف"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition"
                          title="حذف الموظف"
                          disabled={u.id === '001'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ==================== ROLES TAB ==================== */
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-slate-800 text-base">🔑 أدوار النظام وصلاحياتها</h3>
                <p className="text-xs text-slate-400">تعديل الصلاحيات الممنوحة للأدوار الحالية أو إضافة أدوار جديدة مخصصة</p>
              </div>
              <button
                onClick={() => handleOpenRoleModal(null)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow flex items-center gap-1.5 transition"
              >
                <Plus className="w-4 h-4 text-white" />
                <span>إضافة دور وظيفي جديد</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rolesList.map((r) => (
                <div key={r.id} className="border border-slate-200 hover:border-emerald-500/40 p-4 rounded-xl space-y-3 transition hover:shadow-sm bg-slate-50/50">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-black text-slate-800 text-sm">{r.name}</h4>
                        <span className="text-[10px] bg-slate-200 text-slate-600 font-mono px-2 py-0.5 rounded-lg">{r.code}</span>
                      </div>
                      <p className="text-xs text-slate-500">{r.description || 'لا يوجد وصف لهذا الدور'}</p>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleOpenRoleModal(r)}
                        className="p-1.5 text-slate-500 hover:text-emerald-600 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 shadow-sm transition"
                        title="تعديل الدور والصلاحيات"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteRole(r.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 shadow-sm transition"
                        title="حذف الدور"
                        disabled={['role_manager', 'role_accountant', 'role_inventory', 'role_cashier'].includes(r.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-2.5">
                    <span className="text-[11px] font-bold text-slate-500 block mb-1.5">الصلاحيات الممنوحة ({r.permissions.length}):</span>
                    <div className="flex flex-wrap gap-1">
                      {r.code === 'manager' ? (
                        <span className="text-[10px] bg-indigo-50 border border-indigo-100 text-indigo-700 px-2 py-0.5 rounded-md font-bold">
                          المشرف العام (كامل الصلاحيات دون قيود)
                        </span>
                      ) : r.permissions.length === 0 ? (
                        <span className="text-[10px] text-slate-400 italic font-bold">لا توجد صلاحيات مخصصة</span>
                      ) : (
                        r.permissions.map((p) => (
                          <span key={p.id} className="text-[10px] bg-emerald-50 border border-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-bold" title={p.description}>
                            {p.name}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================== USER FORM MODAL ==================== */}
      {showUserModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden text-right">
            <div className="bg-slate-900 p-4 border-b border-slate-800 text-white flex justify-between items-center">
              <h3 className="font-black text-sm sm:text-base">
                {editingUser ? '✏️ تعديل بيانات الموظف والصلاحيات' : '👤 إضافة موظف جديد لـ ERP'}
              </h3>
              <button 
                onClick={() => setShowUserModal(false)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">اسم الموظف الكامل:</label>
                <input
                  type="text"
                  required
                  placeholder="الاسم الأول والأخير"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">البريد الإلكتروني (لتسجيل الدخول):</label>
                <input
                  type="email"
                  required
                  placeholder="employee@system.com"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs focus:outline-none font-mono text-left focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">تخصيص الدور الوظيفي (الصلاحيات المدمجة):</label>
                <select
                  value={userRoleId}
                  onChange={(e) => setUserRoleId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold"
                >
                  {rolesList.map(r => (
                    <option key={r.id} value={r.id}>{r.name} ({r.code})</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow transition flex items-center justify-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>حفظ وإرسال</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== ROLE FORM MODAL (RBAC MASTER MATRIX) ==================== */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-2xl w-full overflow-hidden text-right flex flex-col max-h-[90vh]">
            <div className="bg-slate-900 p-4 border-b border-slate-800 text-white flex justify-between items-center shrink-0">
              <h3 className="font-black text-sm sm:text-base">
                {editingRole ? '✏️ تعديل الدور ومصفوفة الصلاحيات' : '🔑 تسجيل دور جديد ومصفوفة صلاحياته'}
              </h3>
              <button 
                onClick={() => setShowRoleModal(false)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSaveRole} className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">اسم الدور الوظيفي:</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: مدير المشتريات، كاتب حسابات"
                    value={roleNameInput}
                    onChange={(e) => setRoleNameInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">رمز الدور (Code):</label>
                  <input
                    type="text"
                    required
                    disabled={editingRole && ['role_manager', 'role_accountant', 'role_inventory', 'role_cashier'].includes(editingRole.id)}
                    placeholder="مثال: purchasing_manager"
                    value={roleCodeInput}
                    onChange={(e) => setRoleCodeInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs focus:outline-none font-mono focus:ring-1 focus:ring-emerald-500 disabled:bg-slate-100 disabled:text-slate-400"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">الوصف العام للدور:</label>
                <input
                  type="text"
                  placeholder="شرح الصلاحيات والمهام وقيود الصلاحية لهذا الدور"
                  value={roleDescription}
                  onChange={(e) => setRoleDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Advanced Permissions Checklist segmented by modules */}
              <div className="space-y-3.5 border-t border-slate-100 pt-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>تحديد صلاحيات الدور الوظيفي:</span>
                  </h4>
                  <span className="text-xs text-slate-400 font-bold">تم اختيار {selectedPermissionIds.length} صلاحية</span>
                </div>

                {roleCodeInput.toLowerCase().trim() === 'manager' ? (
                  <div className="p-4 bg-indigo-50 border border-indigo-200 text-indigo-800 rounded-xl text-xs font-bold leading-relaxed">
                    الدور الإداري العام (manager) يمتلك تجاوز صلاحيات كامل وتلقائي على كافة كتل النظام وواجهات الاستخدام بطبيعة دوره، لا حاجة لضبط صلاحيات تفصيلية.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {modules.map((mod: string) => {
                      const modPerms = permissionsList.filter(p => p.module === mod);
                      const allInModuleSelected = modPerms.every(p => selectedPermissionIds.includes(p.id));

                      return (
                        <div key={mod} className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/40">
                          <div className="bg-slate-100 p-2.5 px-3.5 flex justify-between items-center border-b border-slate-200">
                            <span className="text-xs font-extrabold text-slate-700">{getModuleTitle(mod)}</span>
                            <button
                              type="button"
                              onClick={() => handleSelectAllInModule(mod)}
                              className="text-[10px] text-emerald-600 hover:text-emerald-700 font-bold"
                            >
                              {allInModuleSelected ? 'إلغاء تحديد الكل' : 'تحديد الكل بالقسم'}
                            </button>
                          </div>
                          <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2 bg-white">
                            {modPerms.map((p) => {
                              const isChecked = selectedPermissionIds.includes(p.id);
                              return (
                                <button
                                  key={p.id}
                                  type="button"
                                  onClick={() => handleTogglePermission(p.id)}
                                  className={`p-2.5 rounded-lg border text-right flex items-start gap-2.5 transition ${
                                    isChecked 
                                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-sm' 
                                      : 'border-slate-100 hover:bg-slate-50 text-slate-700'
                                  }`}
                                >
                                  {isChecked ? (
                                    <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                  ) : (
                                    <Square className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
                                  )}
                                  <div className="space-y-0.5">
                                    <span className="text-xs font-bold block">{p.name}</span>
                                    <span className="text-[10px] text-slate-400 block leading-tight">{p.description}</span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100 shrink-0">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow transition flex items-center justify-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>حفظ الدور والصلاحيات المحدثة</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowRoleModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
