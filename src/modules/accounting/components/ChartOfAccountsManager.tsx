import React, { useState, useEffect } from 'react';
import {
  Folder,
  FolderOpen,
  PlusCircle,
  Edit3,
  Trash2,
  Power,
  Search,
  RefreshCw,
  GitFork,
  List,
  ChevronRight,
  ChevronDown,
  Database,
  CheckCircle2,
  AlertCircle,
  DollarSign,
  Coins,
  Building2,
  Layers,
  ShieldAlert,
  ArrowUpRight,
  BookOpen
} from 'lucide-react';
import Badge from '../../../shared/components/ui/Badge';
import Modal from '../../../shared/components/ui/Modal';

export interface AccountNode {
  id: string;
  code: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  foreignBalance: number;
  companyId?: string | null;
  branchId?: string | null;
  parentId?: string | null;
  isActive: boolean;
  level: number;
  children: AccountNode[];
}

interface ChartOfAccountsManagerProps {
  onSelectAccountForLedger?: (accountId: string) => void;
}

export const ChartOfAccountsManager: React.FC<ChartOfAccountsManagerProps> = ({
  onSelectAccountForLedger
}) => {
  const [treeData, setTreeData] = useState<AccountNode[]>([]);
  const [flatAccounts, setFlatAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'tree' | 'flat'>('tree');
  const [typeFilter, setTypeFilter] = useState<'all' | 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'>('all');
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Tree expansion state
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any | null>(null);

  // Form fields
  const [formParentId, setFormParentId] = useState<string>('');
  const [formCode, setFormCode] = useState<string>('');
  const [formName, setFormName] = useState<string>('');
  const [formType, setFormType] = useState<string>('asset');
  const [formCurrency, setFormCurrency] = useState<string>('SAR');
  const [formBalance, setFormBalance] = useState<number>(0);
  const [formForeignBalance, setFormForeignBalance] = useState<number>(0);
  const [formCompanyId, setFormCompanyId] = useState<string>('');
  const [formIsActive, setFormIsActive] = useState<boolean>(true);

  // Status feedback
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [suggestingCode, setSuggestingCode] = useState(false);

  // Inspector Drawer
  const [inspectAccount, setInspectAccount] = useState<any | null>(null);

  // Fetch Accounts
  const fetchAccounts = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      // 1. Fetch Flat List
      let url = '/api/accounts?';
      if (companyFilter !== 'all') url += `companyId=${companyFilter}&`;
      if (typeFilter !== 'all') url += `type=${typeFilter}&`;
      if (statusFilter === 'active') url += `activeOnly=true&`;

      const res = await fetch(url);
      const json = await res.json();
      const accountsList = json.data || json || [];
      setFlatAccounts(accountsList);

      // 2. Fetch Tree
      let treeUrl = '/api/accounts/tree';
      if (companyFilter !== 'all') treeUrl += `?companyId=${companyFilter}`;
      const treeRes = await fetch(treeUrl);
      const treeJson = await treeRes.json();
      const treeNodes = treeJson.data || treeJson || [];
      setTreeData(treeNodes);

      // Default expand level 1 and level 2 nodes
      const defaultExpanded = new Set<string>();
      const collectExpanded = (nodes: AccountNode[]) => {
        nodes.forEach(n => {
          if (n.level <= 2 || n.children?.length > 0) {
            defaultExpanded.add(n.id);
          }
          if (n.children) collectExpanded(n.children);
        });
      };
      collectExpanded(treeNodes);
      setExpandedNodes(defaultExpanded);

    } catch (err: any) {
      console.error('Failed to load accounts:', err);
      setErrorMsg('فشل في جلب دليل الحسابات من الخادم');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [companyFilter, typeFilter, statusFilter]);

  // Expand / Collapse Node
  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const expandAll = () => {
    const allIds = new Set<string>();
    flatAccounts.forEach(a => allIds.add(a.id));
    setExpandedNodes(allIds);
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  // Suggest Code when parent selected
  const handleParentChange = async (parentId: string) => {
    setFormParentId(parentId);
    if (!parentId) return;

    // Inherit type from parent
    const parentAcc = flatAccounts.find(a => a.id === parentId);
    if (parentAcc) {
      setFormType(parentAcc.type);
    }

    setSuggestingCode(true);
    try {
      const res = await fetch(`/api/accounts/suggest-code?parentId=${parentId}`);
      const json = await res.json();
      if (json.success && json.data?.suggestedCode) {
        setFormCode(json.data.suggestedCode);
      }
    } catch (e) {
      console.error('Failed to suggest code:', e);
    } finally {
      setSuggestingCode(false);
    }
  };

  // Open Modal for New Account
  const handleOpenAddModal = (presetParentId?: string) => {
    setEditingAccount(null);
    setFormParentId(presetParentId || '');
    setFormCode('');
    setFormName('');
    setFormType('asset');
    setFormCurrency('SAR');
    setFormBalance(0);
    setFormForeignBalance(0);
    setFormCompanyId('');
    setFormIsActive(true);
    setErrorMsg('');
    setShowModal(true);

    if (presetParentId) {
      handleParentChange(presetParentId);
    }
  };

  // Open Modal for Edit
  const handleOpenEditModal = (acc: any) => {
    setEditingAccount(acc);
    setFormParentId(acc.parentId || '');
    setFormCode(acc.code);
    setFormName(acc.name);
    setFormType(acc.type);
    setFormCurrency(acc.currency || 'SAR');
    setFormBalance(parseFloat(acc.balance || 0));
    setFormForeignBalance(parseFloat(acc.foreignBalance || 0));
    setFormCompanyId(acc.companyId || '');
    setFormIsActive(acc.isActive !== false);
    setErrorMsg('');
    setShowModal(true);
  };

  // Submit Account Upsert
  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCode.trim() || !formName.trim()) {
      setErrorMsg('رمز الحساب واسم الحساب حقول إجبارية');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    try {
      const payload = {
        id: editingAccount?.id,
        code: formCode.trim(),
        name: formName.trim(),
        type: formType,
        currency: formCurrency,
        balance: formBalance,
        foreignBalance: formForeignBalance,
        parentId: formParentId || null,
        companyId: formCompanyId || null,
        isActive: formIsActive
      };

      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'فشل حفظ الحساب');
      }

      setSuccessMsg(`تم ${editingAccount ? 'تعديل' : 'إضافة'} الحساب (${formName}) بنجاح`);
      setShowModal(false);
      fetchAccounts();

      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ أثناء حفظ بيانات الحساب');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle Active
  const handleToggleActive = async (acc: any) => {
    try {
      const nextStatus = !acc.isActive;
      const res = await fetch(`/api/accounts/${acc.id}/toggle-active`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: nextStatus })
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setSuccessMsg(`تم ${nextStatus ? 'تنشيط' : 'تعطيل'} الحساب (${acc.name})`);
        fetchAccounts();
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        alert(json.error || 'فشل تغيير حالة الحساب');
      }
    } catch (err: any) {
      alert('حدث خطأ في الشبكة');
    }
  };

  // Delete Account
  const handleDeleteAccount = async (acc: any) => {
    if (!window.confirm(`هل أنت تأكد من إرادة حذف الحساب (${acc.code} - ${acc.name})؟`)) {
      return;
    }

    try {
      const res = await fetch(`/api/accounts/${acc.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (res.ok && json.success) {
        setSuccessMsg(`تم حذف الحساب (${acc.name}) بنجاح`);
        fetchAccounts();
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        alert(json.error || 'لا يمكن حذف هذا الحساب');
      }
    } catch (e) {
      alert('فشل الاتصال بالخادم أثناء الحذف');
    }
  };

  // Seed Default Chart
  const handleSeedDefaultChart = async () => {
    if (!window.confirm('هل تريد زراعة دليل الحسابات القياسي المتكامل (شاملاً عملات USD, SYP, TRY, SAR)؟')) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/accounts/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId: companyFilter !== 'all' ? companyFilter : null })
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setSuccessMsg(`تم إنشاء ${json.data?.seededCount || 0} حسابات قياسية بنجاح`);
        fetchAccounts();
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg(json.error || 'فشل زراعة دليل الحسابات');
      }
    } catch (err) {
      setErrorMsg('خطأ في الشبكة');
    } finally {
      setLoading(false);
    }
  };

  // Filter helper for search
  const matchesSearch = (acc: any) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return acc.name?.toLowerCase().includes(q) || acc.code?.toLowerCase().includes(q);
  };

  // Render Single Tree Node Recursively
  const renderTreeNode = (node: AccountNode) => {
    if (!matchesSearch(node) && (!node.children || node.children.length === 0)) {
      // Check if any child matches
      const hasMatchingChild = (n: AccountNode): boolean => {
        if (matchesSearch(n)) return true;
        return (n.children || []).some(hasMatchingChild);
      };
      if (!hasMatchingChild(node)) return null;
    }

    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;

    const getTypeBadgeColor = (type: string) => {
      switch (type) {
        case 'asset': return 'bg-blue-50 text-blue-700 border-blue-200';
        case 'liability': return 'bg-amber-50 text-amber-700 border-amber-200';
        case 'equity': return 'bg-purple-50 text-purple-700 border-purple-200';
        case 'revenue': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
        case 'expense': return 'bg-rose-50 text-rose-700 border-rose-200';
        default: return 'bg-slate-50 text-slate-700 border-slate-200';
      }
    };

    const getTypeArabic = (type: string) => {
      switch (type) {
        case 'asset': return 'أصول';
        case 'liability': return 'خصوم';
        case 'equity': return 'حقوق ملكية';
        case 'revenue': return 'إيرادات';
        case 'expense': return 'مصروفات';
        default: return type;
      }
    };

    const indentPadding = (node.level - 1) * 20;

    return (
      <div key={node.id} className="select-none">
        <div
          className={`flex items-center justify-between p-2.5 my-1 rounded-2xl border transition-all duration-150 ${
            node.isActive
              ? 'bg-white hover:bg-slate-50 border-slate-200/80 shadow-xs'
              : 'bg-slate-50 border-slate-200 opacity-60'
          }`}
          style={{ marginRight: `${indentPadding}px` }}
        >
          <div className="flex items-center gap-2.5 overflow-hidden">
            {/* Expand / Collapse Button */}
            {hasChildren ? (
              <button
                onClick={() => toggleNode(node.id)}
                className="w-6 h-6 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
              >
                {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            ) : (
              <span className="w-6 h-6 flex items-center justify-center text-slate-300">
                •
              </span>
            )}

            {/* Folder / File Icon */}
            {hasChildren ? (
              isExpanded ? <FolderOpen className="w-4 h-4 text-amber-500" /> : <Folder className="w-4 h-4 text-amber-500" />
            ) : (
              <BookOpen className="w-4 h-4 text-slate-400" />
            )}

            {/* Code & Name */}
            <span className="font-mono font-black text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
              {node.code}
            </span>
            <span className="font-bold text-xs text-slate-800 truncate max-w-[200px] sm:max-w-xs">
              {node.name}
            </span>

            {/* Level Tag */}
            <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 hidden md:inline-block">
              المستوى {node.level}
            </span>
          </div>

          {/* Right Metrics & Quick Actions */}
          <div className="flex items-center gap-3">
            {/* Type Badge */}
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getTypeBadgeColor(node.type)}`}>
              {getTypeArabic(node.type)}
            </span>

            {/* Currency Tag */}
            <span className="text-[10px] font-extrabold font-mono px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md border border-slate-200">
              {node.currency || 'SAR'}
            </span>

            {/* Balance */}
            <div className="text-left font-mono font-bold text-xs text-slate-800 min-w-[90px]" dir="ltr">
              {node.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              {node.foreignBalance > 0 && (
                <span className="block text-[10px] text-indigo-600 font-semibold">
                  ({node.foreignBalance.toLocaleString()} {node.currency})
                </span>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100">
              <button
                onClick={() => handleOpenAddModal(node.id)}
                title="إضافة حساب فرعي"
                className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
              >
                <PlusCircle className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setInspectAccount(node)}
                title="معاينة التفاصيل"
                className="p-1 text-slate-600 hover:bg-slate-200 rounded-lg transition"
              >
                <Layers className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => handleOpenEditModal(node)}
                title="تعديل الحساب"
                className="p-1 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => handleToggleActive(node)}
                title={node.isActive ? 'تعطيل الحساب' : 'تنشيط الحساب'}
                className={`p-1 rounded-lg transition ${node.isActive ? 'text-emerald-600 hover:bg-emerald-50' : 'text-slate-400 hover:bg-slate-200'}`}
              >
                <Power className="w-3.5 h-3.5" />
              </button>

              {onSelectAccountForLedger && (
                <button
                  onClick={() => onSelectAccountForLedger(node.id)}
                  title="عرض دفتر الأستاذ"
                  className="p-1 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                onClick={() => handleDeleteAccount(node)}
                title="حذف الحساب"
                className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Render Children */}
        {hasChildren && isExpanded && (
          <div className="pr-2 border-r-2 border-slate-100 mr-3 my-1">
            {node.children.map(child => renderTreeNode(child))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6" dir="rtl">

      {/* Header Stat Banner */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100">
                <GitFork className="w-5 h-5" />
              </span>
              <h2 className="text-base font-black text-slate-900 tracking-tight">دليل الحسابات الشامل (Chart of Accounts)</h2>
            </div>
            <p className="text-xs text-slate-500 font-semibold mt-1">
              الهيكل المالي المحاسبي المتعدد الشركات والعملات (USD, SYP, TRY, SAR) مع الترقيم الهرمي الذكي.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <button
              onClick={handleSeedDefaultChart}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold rounded-xl transition flex items-center gap-1.5 border border-slate-200"
            >
              <Database className="w-3.5 h-3.5 text-indigo-600" />
              زرع الدليل القياسي
            </button>

            <button
              onClick={() => handleOpenAddModal()}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold rounded-xl transition shadow-md flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4 text-emerald-400" />
              إضافة حساب جديد
            </button>
          </div>
        </div>

        {/* Filter Controls & Search */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 mt-4">
          {/* Search */}
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="بحث برقم الحساب أو الاسم..."
              className="w-full pr-9 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-slate-900 focus:outline-none"
            />
          </div>

          {/* Account Type Filter */}
          <div>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none"
            >
              <option value="all">جميع أنواع الحسابات</option>
              <option value="asset">الأصول (Assets)</option>
              <option value="liability">الخصوم (Liabilities)</option>
              <option value="equity">حقوق الملكية (Equity)</option>
              <option value="revenue">الإيرادات (Revenues)</option>
              <option value="expense">المصروفات (Expenses)</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 font-bold text-xs">
            <button
              onClick={() => setViewMode('tree')}
              className={`flex-1 py-1.5 rounded-lg transition flex items-center justify-center gap-1 ${viewMode === 'tree' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}
            >
              <GitFork className="w-3.5 h-3.5" />
              شجرة هرمية
            </button>
            <button
              onClick={() => setViewMode('flat')}
              className={`flex-1 py-1.5 rounded-lg transition flex items-center justify-center gap-1 ${viewMode === 'flat' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}
            >
              <List className="w-3.5 h-3.5" />
              قائمة مسطحة
            </button>
          </div>

          {/* Expand/Collapse buttons for Tree */}
          {viewMode === 'tree' && (
            <div className="flex items-center gap-1">
              <button
                onClick={expandAll}
                className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-[11px] font-bold rounded-xl border border-slate-200"
              >
                توسيع الكل
              </button>
              <button
                onClick={collapseAll}
                className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-[11px] font-bold rounded-xl border border-slate-200"
              >
                طي الكل
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Alert Messages */}
      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-bold flex items-center gap-2 animate-shake">
          <ShieldAlert className="w-4 h-4 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Accounts List / Tree Container */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-5 min-h-[400px]">
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
            <span className="text-xs text-slate-500 font-bold block">جاري تحليل وبناء الهيكل الهرمي للحسابات...</span>
          </div>
        ) : flatAccounts.length === 0 ? (
          <div className="py-16 text-center space-y-4">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
            <div className="space-y-1">
              <h3 className="font-extrabold text-slate-800 text-sm">دليل الحسابات فارغ حالياً</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto font-medium">
                يمكنك البدء بضغط زر "زرع الدليل القياسي" لإنشاء الشجرة المعتمدة مع الدعم المتعدد للعملات مباشرة.
              </p>
            </div>
            <button
              onClick={handleSeedDefaultChart}
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-md transition"
            >
              زرع الدليل القياسي الشامل
            </button>
          </div>
        ) : viewMode === 'tree' ? (
          <div className="space-y-1">
            {treeData.map(node => renderTreeNode(node))}
          </div>
        ) : (
          /* Flat Table View */
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-extrabold">
                  <th className="p-3">رمز الحساب</th>
                  <th className="p-3">اسم الحساب</th>
                  <th className="p-3">النوع</th>
                  <th className="p-3">العملة</th>
                  <th className="p-3">الرصيد الأساسي</th>
                  <th className="p-3">الرصيد أجنبي</th>
                  <th className="p-3">الحالة</th>
                  <th className="p-3 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {flatAccounts.filter(matchesSearch).map(acc => (
                  <tr key={acc.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3 font-mono font-bold text-slate-900">{acc.code}</td>
                    <td className="p-3 font-extrabold text-slate-800">{acc.name}</td>
                    <td className="p-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-slate-100 text-slate-700">
                        {acc.type}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-bold">{acc.currency || 'SAR'}</td>
                    <td className="p-3 font-mono font-bold text-slate-900" dir="ltr">
                      {parseFloat(acc.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 font-mono font-semibold text-indigo-600" dir="ltr">
                      {parseFloat(acc.foreignBalance || 0) > 0 ? parseFloat(acc.foreignBalance).toLocaleString('en-US') : '-'}
                    </td>
                    <td className="p-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${acc.isActive !== false ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {acc.isActive !== false ? 'نشط' : 'معطل'}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => handleOpenEditModal(acc)} className="p-1 text-indigo-600 hover:bg-indigo-50 rounded-lg">
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDeleteAccount(acc)} className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Create / Edit Account */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={editingAccount ? `تعديل بيانات الحساب (${editingAccount.code})` : 'إضافة حساب جديد في الدليل'}
        >
          <form onSubmit={handleSaveAccount} className="space-y-4 text-right" dir="rtl">

            {/* Parent Account Select */}
            <div className="space-y-1">
              <label className="text-xs font-extrabold text-slate-700">الحساب الرئيسي (الأب):</label>
              <select
                value={formParentId}
                onChange={e => handleParentChange(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none"
              >
                <option value="">بدون حساب أب (حساب رئيسي في الجذر)</option>
                {flatAccounts.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.code} - {a.name} ({a.type})
                  </option>
                ))}
              </select>
            </div>

            {/* Account Code & Auto Suggest */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-extrabold text-slate-700 flex items-center justify-between">
                  <span>رمز الحساب (Code):</span>
                  {suggestingCode && <span className="text-[10px] text-indigo-600 animate-pulse">جاري اقتراح التسلسل...</span>}
                </label>
                <input
                  type="text"
                  value={formCode}
                  onChange={e => setFormCode(e.target.value)}
                  placeholder="مثال: 110105"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-extrabold text-slate-700">نوع الحساب:</label>
                <select
                  value={formType}
                  onChange={e => setFormType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none"
                  disabled={!!formParentId} // Locked to match parent type
                >
                  <option value="asset">أصول (Asset)</option>
                  <option value="liability">خصوم/التزامات (Liability)</option>
                  <option value="equity">حقوق ملكية (Equity)</option>
                  <option value="revenue">إيرادات (Revenue)</option>
                  <option value="expense">مصروفات (Expense)</option>
                </select>
              </div>
            </div>

            {/* Name */}
            <div className="space-y-1">
              <label className="text-xs font-extrabold text-slate-700">اسم الحساب المالي:</label>
              <input
                type="text"
                value={formName}
                onChange={e => setFormName(e.target.value)}
                placeholder="مثال: صندوق الدولار بفرع المبيعات"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none"
                required
              />
            </div>

            {/* Currency & Balances */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-extrabold text-slate-700">عملة الحساب:</label>
                <select
                  value={formCurrency}
                  onChange={e => setFormCurrency(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none"
                >
                  <option value="SAR">SAR - ريال سعودي</option>
                  <option value="USD">USD - دولار أمريكي</option>
                  <option value="SYP">SYP - ليرة سورية</option>
                  <option value="TRY">TRY - ليرة تركية</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-extrabold text-slate-700">الرصيد الأساسي:</label>
                <input
                  type="number"
                  step="0.01"
                  value={formBalance}
                  onChange={e => setFormBalance(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-extrabold text-slate-700">الرصيد بالعملة الأجنبية:</label>
                <input
                  type="number"
                  step="0.01"
                  value={formForeignBalance}
                  onChange={e => setFormForeignBalance(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            {/* Active Switch */}
            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="formIsActive"
                checked={formIsActive}
                onChange={e => setFormIsActive(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
              />
              <label htmlFor="formIsActive" className="text-xs font-bold text-slate-700 cursor-pointer">
                تنشيط الحساب وتفعيله في قيود اليومية والمعاملات
              </label>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    حفظ الحساب
                  </>
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Account Details Inspector Drawer */}
      {inspectAccount && (
        <Modal
          isOpen={!!inspectAccount}
          onClose={() => setInspectAccount(null)}
          title={`بطاقة الحساب المالي (${inspectAccount.code})`}
        >
          <div className="space-y-4 text-right" dir="rtl">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="flex justify-between items-center border-b pb-2 border-slate-200">
                <span className="text-xs text-slate-400 font-bold">اسم الحساب:</span>
                <span className="text-sm font-black text-slate-900">{inspectAccount.name}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2 border-slate-200">
                <span className="text-xs text-slate-400 font-bold">الرمز التسلسلي:</span>
                <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">{inspectAccount.code}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2 border-slate-200">
                <span className="text-xs text-slate-400 font-bold">نوع الحساب:</span>
                <span className="text-xs font-bold text-slate-800">{inspectAccount.type}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2 border-slate-200">
                <span className="text-xs text-slate-400 font-bold">العملة الرسمية:</span>
                <span className="text-xs font-mono font-bold">{inspectAccount.currency || 'SAR'}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2 border-slate-200">
                <span className="text-xs text-slate-400 font-bold">الرصيد القائم (أساسي):</span>
                <span className="text-sm font-mono font-black text-slate-900" dir="ltr">
                  {parseFloat(inspectAccount.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
              {parseFloat(inspectAccount.foreignBalance || 0) > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400 font-bold">الرصيد الأجنبي:</span>
                  <span className="text-xs font-mono font-extrabold text-indigo-600" dir="ltr">
                    {parseFloat(inspectAccount.foreignBalance).toLocaleString('en-US')} {inspectAccount.currency}
                  </span>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setInspectAccount(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                إغلاق
              </button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
};
