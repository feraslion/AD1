import React, { useState, useEffect } from 'react';
import { StoreSettings } from '../../types';
import { ExpenseService, TreasuryService, AccountingService } from '../../services/api';
import { 
  Receipt, 
  PlusCircle, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  DollarSign, 
  PieChart, 
  FolderKanban, 
  FileText, 
  CreditCard, 
  Wallet, 
  Building2, 
  AlertCircle, 
  Tag, 
  RefreshCw, 
  Search, 
  X, 
  BarChart2, 
  Filter,
  Check,
  ShieldCheck,
  Ban
} from 'lucide-react';
import StatCard from '../../shared/components/ui/StatCard';
import Badge from '../../shared/components/ui/Badge';
import Modal from '../../shared/components/ui/Modal';

interface ExpensesProps {
  settings: StoreSettings;
}

export default function Expenses({ settings }: ExpensesProps) {
  const [activeTab, setActiveTab] = useState<'requests' | 'categories' | 'reports'>('requests');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Data States
  const [requests, setRequests] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [reports, setReports] = useState<any>(null);
  const [cashboxes, setCashboxes] = useState<any[]>([]);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

  // Forms
  const [selectedReq, setSelectedReq] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const [requestForm, setRequestForm] = useState({
    title: '',
    categoryId: 'cat_admin',
    accountId: 'acc_expense',
    amount: '',
    taxAmount: '0',
    currency: settings.currency || 'SAR',
    beneficiary: '',
    paymentMethod: 'cash' as 'cash' | 'bank' | 'payable',
    paymentAccountId: '',
    requestedBy: 'مدير النظام',
    description: '',
    receiptRef: ''
  });

  const [categoryForm, setCategoryForm] = useState({
    id: '',
    name: '',
    code: '',
    budget: '',
    accountId: 'acc_expense',
    description: ''
  });

  const [payForm, setPayForm] = useState({
    paymentMethod: 'cash' as 'cash' | 'bank' | 'payable',
    paymentAccountId: ''
  });

  const [formError, setFormError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const loadExpenseData = async () => {
    setLoading(true);
    try {
      const [reqs, cats, rep, cb, ba, accs] = await Promise.all([
        ExpenseService.getRequests(statusFilter),
        ExpenseService.getCategories(),
        ExpenseService.getReports(),
        TreasuryService.getCashboxes(),
        TreasuryService.getBankAccounts(),
        AccountingService.getAccounts()
      ]);

      setRequests(reqs);
      setCategories(cats);
      setReports(rep);
      setCashboxes(cb);
      setBankAccounts(ba);
      setAccounts(accs);

      if (cb.length > 0) {
        setPayForm(prev => ({ ...prev, paymentAccountId: cb[0].id }));
      }
    } catch (e) {
      console.error('Error loading expense data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenseData();
  }, [statusFilter]);

  const handleCreateRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!requestForm.title.trim()) {
      setFormError('يرجى كتابة عنوان المصروف');
      return;
    }
    const amt = parseFloat(requestForm.amount);
    if (isNaN(amt) || amt <= 0) {
      setFormError('يرجى إدخال مبلغ صحيح أكبر من صفر');
      return;
    }

    try {
      await ExpenseService.createRequest({
        ...requestForm,
        amount: amt,
        taxAmount: parseFloat(requestForm.taxAmount || '0')
      });
      setShowRequestModal(false);
      setActionSuccess('تم تقديم طلب المصروف بنجاح وهو الآن قيد المراجعة والاعتماد! 📋');
      setTimeout(() => setActionSuccess(''), 4000);
      loadExpenseData();
    } catch (err: any) {
      setFormError(err.message || 'حدث خطأ أثناء حفظ الطلب');
    }
  };

  const handleApproveRequest = async (reqId: string) => {
    try {
      await ExpenseService.approveRequest(reqId, 'مدير النظام');
      setActionSuccess('تمت الموافقة على طلب المصروف بنجاح وهو جاهز للصرف والسداد! ✓');
      setTimeout(() => setActionSuccess(''), 4000);
      loadExpenseData();
    } catch (err: any) {
      alert(err.message || 'فشلت عملية الموافقة');
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReq) return;
    try {
      await ExpenseService.rejectRequest(selectedReq.id, rejectionReason || 'تم رفض الطلب بواسطة الإدارة');
      setShowRejectModal(false);
      setSelectedReq(null);
      setRejectionReason('');
      setActionSuccess('تم رفض طلب المصروف وتسجيل سبب الرفض.');
      setTimeout(() => setActionSuccess(''), 4000);
      loadExpenseData();
    } catch (err: any) {
      alert(err.message || 'فشلت عملية الرفض');
    }
  };

  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReq) return;
    try {
      await ExpenseService.payExpense(selectedReq.id, payForm);
      setShowPayModal(false);
      setSelectedReq(null);
      setActionSuccess('تم سداد المصروف بنجاح وإنشاء قيد القيد المحاسبي المزدوج وتحديث الخزينة! 💳🟢');
      setTimeout(() => setActionSuccess(''), 4000);
      loadExpenseData();
    } catch (err: any) {
      alert(err.message || 'فشلت عملية سداد المصروف');
    }
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) return;
    try {
      await ExpenseService.createCategory({
        ...categoryForm,
        budget: parseFloat(categoryForm.budget || '0')
      });
      setShowCategoryModal(false);
      setActionSuccess('تم حفظ تصنيف المصروفات والميزانية المخصصة بنجاح!');
      setTimeout(() => setActionSuccess(''), 3000);
      loadExpenseData();
    } catch (err: any) {
      alert('خطأ أثناء حفظ التصنيف');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm('هل أنت تأكد من رغبتك في حذف هذا التصنيف؟')) return;
    try {
      await ExpenseService.deleteCategory(id);
      setActionSuccess('تم حذف التصنيف بنجاح.');
      setTimeout(() => setActionSuccess(''), 3000);
      loadExpenseData();
    } catch (err: any) {
      alert('فشل حذف التصنيف');
    }
  };

  const formatAmount = (val: number) => {
    return new Intl.NumberFormat('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val) + ' ' + (settings.currency || 'SAR');
  };

  const filteredRequests = requests.filter(r => 
    r.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.requestNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.beneficiary?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 space-y-6 bg-slate-50 min-h-screen text-right" dir="rtl">
      {/* Top Banner Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-rose-600 text-white rounded-2xl shadow-md shadow-rose-200">
            <Receipt className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">إدارة المصروفات والنفقات (Expense Management)</h1>
            <p className="text-xs text-slate-500 font-bold mt-0.5">تصنيفات المصروفات، طلبات الصرف، دورة الاعتمادات، القيد المحاسبي الآلي، والتقارير</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <button
            onClick={() => { setFormError(''); setShowRequestModal(true); }}
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black shadow-md shadow-rose-100 flex items-center gap-1.5 transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ تقديم طلب مصروف جديد</span>
          </button>

          <button
            onClick={() => {
              setCategoryForm({ id: '', name: '', code: '', budget: '', accountId: 'acc_expense', description: '' });
              setShowCategoryModal(true);
            }}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
          >
            <FolderKanban className="w-4 h-4" />
            <span>+ تصنيف مصروف جديد</span>
          </button>

          <button
            onClick={loadExpenseData}
            title="تحديث البيانات"
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition border border-slate-300"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Success Banner */}
      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-black flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess('')} className="text-emerald-600 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="إجمالي المصروفات المدفوعة"
          value={formatAmount(reports?.totalPaid || 0)}
          icon={<DollarSign className="w-5 h-5 text-rose-600" />}
          trendText="قيود محاسبية مرحلة"
          trendUp={false}
        />
        <StatCard
          title="طلبات قيد الانتظار"
          value={formatAmount(reports?.totalPending || 0)}
          icon={<Clock className="w-5 h-5 text-amber-600" />}
          trendText="بانتظار موافقة الإدارة"
          trendUp={true}
        />
        <StatCard
          title="معتمدة وبانتظار السداد"
          value={formatAmount(reports?.totalApproved || 0)}
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          trendText="جاهزة للصرف"
          trendUp={true}
        />
        <StatCard
          title="تصنيفات المصروفات"
          value={categories.length.toString()}
          icon={<Tag className="w-5 h-5 text-blue-600" />}
          trendText="ميزانيات معتمدة"
          trendUp={true}
        />
      </div>

      {/* Tabs Navigation */}
      <div className="flex overflow-x-auto gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'requests' ? 'bg-slate-900 text-white shadow' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>طلبات المصروفات والاعتمادات ({requests.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'categories' ? 'bg-slate-900 text-white shadow' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FolderKanban className="w-4 h-4" />
          <span>تصنيفات المصروفات والميزانيات ({categories.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'reports' ? 'bg-slate-900 text-white shadow' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <PieChart className="w-4 h-4 text-emerald-400" />
          <span>تقارير وتحليلات المصروفات</span>
        </button>
      </div>

      {/* Tab 1: Expense Requests */}
      {activeTab === 'requests' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
          {/* Controls bar */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4">
            {/* Status Filter Buttons */}
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'all', label: 'الكل' },
                { id: 'pending', label: 'قيد الانتظار ⏳' },
                { id: 'approved', label: 'معتمدة ✓' },
                { id: 'paid', label: 'مدفوعة 🟢' },
                { id: 'rejected', label: 'مرفوضة 🔴' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setStatusFilter(f.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    statusFilter === f.id ? 'bg-rose-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Search Box */}
            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="بحث برقم الطلب، العنوان، أو المستفيد..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pr-9 pl-3 py-2 text-xs font-bold focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>

          {/* Requests Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">رقم الطلب</th>
                  <th className="p-3">العنوان والبيان</th>
                  <th className="p-3">التصنيف</th>
                  <th className="p-3">المستفيد</th>
                  <th className="p-3">المبلغ الصافي</th>
                  <th className="p-3">الضريبة</th>
                  <th className="p-3">الإجمالي</th>
                  <th className="p-3">الحالة</th>
                  <th className="p-3 text-center">الإجراءات والاعتماد</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400 font-bold">لا توجد طلبات مصروفات مطابقة</td>
                  </tr>
                ) : (
                  filteredRequests.map(req => (
                    <tr key={req.id} className="hover:bg-slate-50 transition">
                      <td className="p-3 font-mono font-bold text-slate-800">{req.requestNumber}</td>
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{req.title}</div>
                        {req.description && <div className="text-[10px] text-slate-400 truncate max-w-xs">{req.description}</div>}
                      </td>
                      <td className="p-3 text-slate-700">{req.categoryName}</td>
                      <td className="p-3 text-slate-800 font-bold">{req.beneficiary || '-'}</td>
                      <td className="p-3 font-mono text-slate-800">{formatAmount(req.amount)}</td>
                      <td className="p-3 font-mono text-slate-500">{formatAmount(req.taxAmount)}</td>
                      <td className="p-3 font-mono font-black text-slate-900 text-sm">{formatAmount(req.totalAmount)}</td>
                      <td className="p-3">
                        {req.status === 'pending' && <Badge variant="warning">قيد الانتظار ⏳</Badge>}
                        {req.status === 'approved' && <Badge variant="info">معتمد (بانتظار السداد) ✓</Badge>}
                        {req.status === 'paid' && <Badge variant="success">مدفوع ومرحل 🟢</Badge>}
                        {req.status === 'rejected' && <Badge variant="danger">مرفوض 🔴</Badge>}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {req.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApproveRequest(req.id)}
                                title="اعتماد وموافقة"
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold shadow-sm flex items-center gap-1"
                              >
                                <Check className="w-3.5 h-3.5" /> موافقة
                              </button>

                              <button
                                onClick={() => { setSelectedReq(req); setShowRejectModal(true); }}
                                title="رفض الطلب"
                                className="px-2.5 py-1 bg-rose-100 text-rose-700 hover:bg-rose-200 rounded-lg text-[11px] font-bold flex items-center gap-1"
                              >
                                <X className="w-3.5 h-3.5" /> رفض
                              </button>
                            </>
                          )}

                          {req.status === 'approved' && (
                            <button
                              onClick={() => { setSelectedReq(req); setShowPayModal(true); }}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[11px] font-bold shadow-sm flex items-center gap-1"
                            >
                              <CreditCard className="w-3.5 h-3.5" /> سداد وصرف
                            </button>
                          )}

                          {req.status === 'paid' && (
                            <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                              تم السداد والقيد ✓
                            </span>
                          )}

                          {req.status === 'rejected' && (
                            <span className="text-[10px] text-rose-700 font-bold bg-rose-50 px-2 py-1 rounded">
                              مرفوض
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Expense Categories */}
      {activeTab === 'categories' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h2 className="font-bold text-base text-slate-900">تصنيفات المصروفات والميزانيات المخصصة</h2>
              <p className="text-xs text-slate-500 font-bold">ربط كل تصنيف بحساب الأستاذ العام وتحديد الميزانية التقديرية</p>
            </div>
            <button
              onClick={() => {
                setCategoryForm({ id: '', name: '', code: '', budget: '', accountId: 'acc_expense', description: '' });
                setShowCategoryModal(true);
              }}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow"
            >
              + إضافة تصنيف جديد
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map(cat => (
              <div key={cat.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3 relative hover:shadow-md transition">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">{cat.name}</h3>
                    <span className="text-[10px] font-mono font-bold text-slate-500">{cat.code || 'EXP-100'}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition"
                    title="حذف التصنيف"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {cat.description && <p className="text-xs text-slate-600 leading-relaxed">{cat.description}</p>}

                <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
                  <span className="text-xs text-slate-500 font-bold">الميزانية المخصصة:</span>
                  <span className="font-mono font-black text-sm text-emerald-700">{formatAmount(Number(cat.budget) || 0)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Reports & Analytics */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
            <div>
              <h2 className="font-bold text-base text-slate-900">تقرير توزيع المصروفات حسب التصنيف</h2>
              <p className="text-xs text-slate-500 font-bold">مقارنة إجمالي المصروفات الفعلية بالتصنيفات المعتمدة بالنظام</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Category Breakdown Table */}
              <div className="space-y-3">
                <h3 className="font-bold text-xs text-slate-800">تفاصيل الإنفاق بالتصنيف:</h3>
                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                  {reports?.categoryBreakdown?.map((cat: any, idx: number) => (
                    <div key={idx} className="p-3.5 bg-slate-50 flex justify-between items-center text-xs">
                      <div>
                        <div className="font-bold text-slate-900">{cat.name}</div>
                        <div className="text-[10px] text-slate-400">{cat.count} عمليات صرف</div>
                      </div>
                      <div className="font-mono font-black text-sm text-rose-700">
                        {formatAmount(cat.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status Summary */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                <h3 className="font-bold text-xs text-slate-800">ملخص حالة طلبات المصروفات:</h3>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-700">إجمالي الطلبات المدفوعة:</span>
                    <span className="font-mono font-black text-emerald-600">{formatAmount(reports?.totalPaid || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-700">معتمدة بانتظار السداد:</span>
                    <span className="font-mono font-black text-blue-600">{formatAmount(reports?.totalApproved || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-700">قيد الانتظار والمراجعة:</span>
                    <span className="font-mono font-black text-amber-600">{formatAmount(reports?.totalPending || 0)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Request Modal */}
      {showRequestModal && (
        <Modal title="تقديم طلب مصروف جديد (New Expense Request)" isOpen={showRequestModal} onClose={() => setShowRequestModal(false)}>
          <form onSubmit={handleCreateRequestSubmit} className="space-y-4 text-xs text-right">
            {formError && <div className="p-3 bg-rose-50 text-rose-700 rounded-xl font-bold">{formError}</div>}

            <div>
              <label className="font-bold text-slate-700 block mb-1">عنوان المصروف / البيان الرئيسي *</label>
              <input
                type="text"
                required
                placeholder="مثال: شراء مستلزمات مكتبية وطباعة فواتير"
                value={requestForm.title}
                onChange={(e) => setRequestForm(prev => ({ ...prev, title: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">تصنيف المصروف *</label>
                <select
                  value={requestForm.categoryId}
                  onChange={(e) => setRequestForm(prev => ({ ...prev, categoryId: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold"
                >
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">المستفيد / الجهة</label>
                <input
                  type="text"
                  placeholder="اسم الشخص أو الشركة المستفيدة"
                  value={requestForm.beneficiary}
                  onChange={(e) => setRequestForm(prev => ({ ...prev, beneficiary: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">المبلغ الصافي (غير شامل الضريبة) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={requestForm.amount}
                  onChange={(e) => setRequestForm(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono font-black text-rose-700"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">مبلغ ضريبة القيمة المضافة (15%)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={requestForm.taxAmount}
                  onChange={(e) => setRequestForm(prev => ({ ...prev, taxAmount: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono font-bold"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">تفاصيل وملاحظات إضافية</label>
              <textarea
                rows={2}
                placeholder="أدخل أي تفاصيل أخرى تخص الشراء أو الفاتورة..."
                value={requestForm.description}
                onChange={(e) => setRequestForm(prev => ({ ...prev, description: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowRequestModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold shadow"
              >
                تقديم الطلب
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Pay Expense Modal */}
      {showPayModal && selectedReq && (
        <Modal title={`سداد وصرف المصروف: ${selectedReq.title}`} isOpen={showPayModal} onClose={() => setShowPayModal(false)}>
          <form onSubmit={handlePaySubmit} className="space-y-4 text-xs text-right">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-1">
              <div className="font-bold text-blue-900">إجمالي المبلغ المطلوب صرفه:</div>
              <div className="font-mono font-black text-lg text-blue-700">{formatAmount(selectedReq.totalAmount)}</div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">طريقة وسيلة الصرف والسداد:</label>
              <select
                value={payForm.paymentMethod}
                onChange={(e) => setPayForm(prev => ({ ...prev, paymentMethod: e.target.value as any }))}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold"
              >
                <option value="cash">نقداً من الخزينة الصندوق</option>
                <option value="bank">تحويل بنكي / بطاقة من الحساب البنكي</option>
                <option value="payable">آجل / ذمم دائنة (حساب المورد/الدائن)</option>
              </select>
            </div>

            {payForm.paymentMethod !== 'payable' && (
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  اختر {payForm.paymentMethod === 'cash' ? 'الخزينة الصندوق:' : 'الحساب البنكي:'}
                </label>
                <select
                  value={payForm.paymentAccountId}
                  onChange={(e) => setPayForm(prev => ({ ...prev, paymentAccountId: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold"
                >
                  {payForm.paymentMethod === 'cash' ? (
                    cashboxes.map(c => <option key={c.id} value={c.id}>{c.name} ({formatAmount(Number(c.currentBalance) || 0)})</option>)
                  ) : (
                    bankAccounts.map(b => <option key={b.id} value={b.id}>{b.bankName} - {b.accountName}</option>)
                  )}
                </select>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowPayModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow"
              >
                تأكيد الصرف والتسجيل المحاسبي 🎯
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Reject Request Modal */}
      {showRejectModal && selectedReq && (
        <Modal title="رفض طلب المصروف" isOpen={showRejectModal} onClose={() => setShowRejectModal(false)}>
          <form onSubmit={handleRejectSubmit} className="space-y-4 text-xs text-right">
            <div>
              <label className="font-bold text-slate-700 block mb-1">سبب الرفض:</label>
              <textarea
                rows={3}
                required
                placeholder="يرجى كتابة سبب عدم اعتماد هذا المصروف..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-rose-600 text-white rounded-xl font-bold shadow"
              >
                تأكيد الرفض
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Create Category Modal */}
      {showCategoryModal && (
        <Modal title="إضافة/تعديل تصنيف مصروفات" isOpen={showCategoryModal} onClose={() => setShowCategoryModal(false)}>
          <form onSubmit={handleCategorySubmit} className="space-y-4 text-xs text-right">
            <div>
              <label className="font-bold text-slate-700 block mb-1">اسم التصنيف *</label>
              <input
                type="text"
                required
                placeholder="مثال: مصاريف صيانة ونظافة"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">كود التصنيف</label>
                <input
                  type="text"
                  placeholder="EXP-105"
                  value={categoryForm.code}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, code: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">الميزانية التقديرية (Budget)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={categoryForm.budget}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, budget: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono font-bold text-emerald-700"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">الوصف والتعليمات</label>
              <textarea
                rows={2}
                placeholder="توضيح لطبيعة المصاريف التابعة لهذا التصنيف..."
                value={categoryForm.description}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowCategoryModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-slate-900 text-white rounded-xl font-bold shadow"
              >
                حفظ التصنيف
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
