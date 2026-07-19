import React, { useState, useEffect } from 'react';
import { StoreSettings } from '../types';
import { 
  Landmark, 
  FileSpreadsheet, 
  BookOpen, 
  Scale, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownLeft, 
  PlusCircle, 
  FileText, 
  Coins, 
  RefreshCw 
} from 'lucide-react';
import StatCard from './ui/StatCard';
import Badge from './ui/Badge';
import Modal from './ui/Modal';
import { AccountingService } from '../services/api';

interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
  balance: number;
}

interface JournalDetail {
  id: string;
  accountId: string;
  debit: number;
  credit: number;
}

interface JournalEntry {
  id: string;
  entryNumber: string;
  description: string;
  date: string;
  details: JournalDetail[];
}

interface AccountingProps {
  settings: StoreSettings;
}

export default function Accounting({ settings }: AccountingProps) {
  const [activeSubTab, setActiveSubTab] = useState<'chart' | 'entries' | 'ledger' | 'trial' | 'income' | 'balance' | 'cashflow'>('chart');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // For account manager modal
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [accCode, setAccCode] = useState('');
  const [accName, setAccName] = useState('');
  const [accType, setAccType] = useState('asset');
  const [accBalance, setAccBalance] = useState(0);
  const [accountError, setAccountError] = useState('');

  // For General Ledger tab
  const [selectedLedgerAccountId, setSelectedLedgerAccountId] = useState<string>('acc_cash');
  const [ledgerLines, setLedgerLines] = useState<any[]>([]);
  const [ledgerAccount, setLedgerAccount] = useState<Account | null>(null);
  const [ledgerLoading, setLedgerLoading] = useState(false);

  // For manual journal entry modal
  const [showManualModal, setShowManualModal] = useState(false);
  const [entryDesc, setEntryDesc] = useState('');
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [entryLines, setEntryLines] = useState<{ accountId: string; debit: number; credit: number }[]>([
    { accountId: 'acc_cash', debit: 0, credit: 0 },
    { accountId: 'acc_expense', debit: 0, credit: 0 }
  ]);
  const [modalError, setModalError] = useState('');

  const fetchAccountingData = async () => {
    setLoading(true);
    try {
      const accData = await AccountingService.getAccounts();
      setAccounts(accData);
      
      const entryData = await AccountingService.getJournalEntries();
      setEntries(entryData);
    } catch (e) {
      console.error("Error fetching accounting data:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchLedger = async (accountId: string) => {
    setLedgerLoading(true);
    try {
      const data = await AccountingService.getLedger(accountId);
      setLedgerLines(data.lines);
      setLedgerAccount(data.account);
    } catch (e) {
      console.error(e);
    } finally {
      setLedgerLoading(false);
    }
  };

  useEffect(() => {
    fetchAccountingData();
  }, []);

  useEffect(() => {
    if (activeSubTab === 'ledger' && selectedLedgerAccountId) {
      fetchLedger(selectedLedgerAccountId);
    }
  }, [activeSubTab, selectedLedgerAccountId]);

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setAccountError('');

    if (!accCode || !accName) {
      setAccountError('الرجاء تعبئة كافة الحقول المطلوبة.');
      return;
    }

    try {
      await AccountingService.createAccount({
        id: editingAccount?.id,
        code: accCode,
        name: accName,
        type: accType,
        balance: accBalance
      });
      setShowAccountModal(false);
      setEditingAccount(null);
      setAccCode('');
      setAccName('');
      setAccType('asset');
      setAccBalance(0);
      fetchAccountingData();
    } catch (e: any) {
      setAccountError(e.message || 'خطأ في الاتصال بالخادم.');
    }
  };

  const handleDeleteAccount = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الحساب؟')) return;
    try {
      await AccountingService.deleteAccount(id);
      fetchAccountingData();
    } catch (e: any) {
      alert(e.message || 'خطأ في الاتصال بالخادم.');
    }
  };

  // Accounting calculations
  const totalAssets = accounts.filter(a => a.type === 'asset').reduce((sum, a) => sum + a.balance, 0);
  const totalLiabilities = accounts.filter(a => a.type === 'liability').reduce((sum, a) => sum + a.balance, 0);
  const totalEquity = accounts.filter(a => a.type === 'equity').reduce((sum, a) => sum + a.balance, 0);
  
  const salesRevenue = accounts.filter(a => a.type === 'revenue').reduce((sum, a) => sum + a.balance, 0);
  const totalExpenses = accounts.filter(a => a.type === 'expense').reduce((sum, a) => sum + a.balance, 0);
  const cogs = accounts.find(a => a.code === '5101')?.balance || 0;
  const operatingExpenses = accounts.filter(a => a.type === 'expense' && a.code !== '5101').reduce((sum, a) => sum + a.balance, 0);
  const netProfit = salesRevenue - totalExpenses;

  // Manual entry submission
  const handleAddManualEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');

    // Validation: Total Debit must equal Total Credit
    const totalDebit = entryLines.reduce((sum, l) => sum + Number(l.debit), 0);
    const totalCredit = entryLines.reduce((sum, l) => sum + Number(l.credit), 0);

    if (totalDebit <= 0 || totalCredit <= 0) {
      setModalError('يجب إدخال قيم دائنة ومدينة أكبر من الصفر.');
      return;
    }

    if (totalDebit !== totalCredit) {
      setModalError(`القيد غير متزن! إجمالي المدين (${totalDebit} ${settings.currency}) لا يساوي إجمالي الدائن (${totalCredit} ${settings.currency}).`);
      return;
    }

    if (!entryDesc.trim()) {
      setModalError('الرجاء كتابة وصف القيد المحاسبي.');
      return;
    }

    try {
      await AccountingService.createJournalEntry({
        description: entryDesc,
        date: entryDate,
        lines: entryLines.map(l => ({
          accountId: l.accountId,
          debit: Number(l.debit),
          credit: Number(l.credit)
        }))
      });
      setShowManualModal(false);
      setEntryDesc('');
      setEntryLines([
        { accountId: 'acc_cash', debit: 0, credit: 0 },
        { accountId: 'acc_expense', debit: 0, credit: 0 }
      ]);
      fetchAccountingData();
    } catch (err: any) {
      setModalError(err.message || 'حدث خطأ في الاتصال بالخادم.');
    }
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-2">
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Landmark className="w-6 h-6" />
            </span>
            النظام المحاسبي ودفتر الأستاذ العام
          </h2>
          <p className="text-slate-500 text-xs mt-1.5 sm:text-sm">
            نظام محاسبة احترافي يسجل القيود اليومية ويدير دليل الحسابات وقوائم الدخل والميزانية العمومية تلقائياً.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button 
            onClick={() => setShowManualModal(true)}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            إنشاء قيد يدوي
          </button>
          <button 
            onClick={fetchAccountingData}
            className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl transition"
            title="تحديث البيانات"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Sales Card */}
        <StatCard
          title="إيراد المبيعات (4101)"
          value={`${salesRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })} ${settings.currency}`}
          subtitle="القيد التلقائي لمبيعات الكاش والشبكة والآجل"
          icon={<ArrowUpRight className="w-4 h-4" />}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />

        {/* Expenses Card */}
        <StatCard
          title="تكلفة البضاعة والمصاريف"
          value={`${(cogs + operatingExpenses).toLocaleString('en-US', { minimumFractionDigits: 2 })} ${settings.currency}`}
          subtitle={`تضم تكلفة المنتجات COGS ${cogs.toLocaleString()} والمصاريف ${operatingExpenses.toLocaleString()}`}
          icon={<ArrowDownLeft className="w-4 h-4" />}
          iconBg="bg-rose-50"
          iconColor="text-rose-600"
        />

        {/* Profit Card */}
        <StatCard
          title="صافي الربح المالي"
          value={`${netProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })} ${settings.currency}`}
          subtitle="صافي الفائض المالي بعد احتساب التكلفة والضريبة"
          icon={<TrendingUp className="w-4 h-4" />}
          iconBg={netProfit >= 0 ? 'bg-teal-50' : 'bg-red-50'}
          iconColor={netProfit >= 0 ? 'text-teal-600' : 'text-red-600'}
        />

        {/* Assets balance sheet indicator */}
        <StatCard
          title="إجمالي الأصول والسيولة"
          value={`${totalAssets.toLocaleString('en-US', { minimumFractionDigits: 2 })} ${settings.currency}`}
          subtitle="النقدية، البنك، الذمم المدينة، والمخزون"
          icon={<Coins className="w-4 h-4" />}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
      </div>

      {/* Sub tabs navigation */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-2.5">
        <button
          onClick={() => setActiveSubTab('chart')}
          className={`pb-3 text-xs sm:text-sm font-extrabold transition whitespace-nowrap px-2.5 ${
            activeSubTab === 'chart' 
              ? 'border-b-2 border-slate-900 text-slate-900' 
              : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-4 h-4" />
            <span>دليل الحسابات</span>
          </div>
        </button>

        <button
          onClick={() => setActiveSubTab('entries')}
          className={`pb-3 text-xs sm:text-sm font-extrabold transition whitespace-nowrap px-2.5 ${
            activeSubTab === 'entries' 
              ? 'border-b-2 border-slate-900 text-slate-900' 
              : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <FileText className="w-4 h-4" />
            <span>دفتر اليومية العامة</span>
          </div>
        </button>

        <button
          onClick={() => setActiveSubTab('ledger')}
          className={`pb-3 text-xs sm:text-sm font-extrabold transition whitespace-nowrap px-2.5 ${
            activeSubTab === 'ledger' 
              ? 'border-b-2 border-slate-900 text-slate-900' 
              : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-4 h-4" />
            <span>دفتر الأستاذ العام</span>
          </div>
        </button>

        <button
          onClick={() => setActiveSubTab('trial')}
          className={`pb-3 text-xs sm:text-sm font-extrabold transition whitespace-nowrap px-2.5 ${
            activeSubTab === 'trial' 
              ? 'border-b-2 border-slate-900 text-slate-900' 
              : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Scale className="w-4 h-4" />
            <span>ميزان المراجعة</span>
          </div>
        </button>

        <button
          onClick={() => setActiveSubTab('income')}
          className={`pb-3 text-xs sm:text-sm font-extrabold transition whitespace-nowrap px-2.5 ${
            activeSubTab === 'income' 
              ? 'border-b-2 border-slate-900 text-slate-900' 
              : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4" />
            <span>قائمة الدخل</span>
          </div>
        </button>

        <button
          onClick={() => setActiveSubTab('balance')}
          className={`pb-3 text-xs sm:text-sm font-extrabold transition whitespace-nowrap px-2.5 ${
            activeSubTab === 'balance' 
              ? 'border-b-2 border-slate-900 text-slate-900' 
              : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <FileSpreadsheet className="w-4 h-4" />
            <span>الميزانية العمومية</span>
          </div>
        </button>

        <button
          onClick={() => setActiveSubTab('cashflow')}
          className={`pb-3 text-xs sm:text-sm font-extrabold transition whitespace-nowrap px-2.5 ${
            activeSubTab === 'cashflow' 
              ? 'border-b-2 border-slate-900 text-slate-900' 
              : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Coins className="w-4 h-4" />
            <span>قائمة التدفقات النقدية</span>
          </div>
        </button>
      </div>

      {/* Content Rendering based on Sub Tab */}

      {/* 1. CHART OF ACCOUNTS */}
      {activeSubTab === 'chart' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="البحث برمز الحساب أو الاسم..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-3 pr-10 py-2 border border-slate-200 rounded-lg text-xs sm:text-sm text-right focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <span className="absolute right-3 top-2.5 text-slate-400">🔍</span>
            </div>
            <button
              onClick={() => {
                setEditingAccount(null);
                setAccCode('');
                setAccName('');
                setAccType('asset');
                setAccBalance(0);
                setShowAccountModal(true);
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs sm:text-sm font-bold flex items-center gap-1.5 transition"
            >
              <PlusCircle className="w-4 h-4" />
              إضافة حساب جديد
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100 text-xs font-bold text-slate-500">
                    <th className="p-4">رمز الحساب</th>
                    <th className="p-4">اسم الحساب</th>
                    <th className="p-4">نوع الحساب</th>
                    <th className="p-4">الرصيد الحالي</th>
                    <th className="p-4 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs sm:text-sm text-slate-700">
                  {accounts
                    .filter(acc => acc.name.includes(searchQuery) || acc.code.includes(searchQuery))
                    .map(acc => (
                      <tr key={acc.id} className="hover:bg-slate-50/50 transition">
                        <td className="p-4 font-mono font-bold text-slate-500">{acc.code}</td>
                        <td className="p-4 font-bold text-slate-800">{acc.name}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            acc.type === 'asset' ? 'bg-blue-50 text-blue-600' :
                            acc.type === 'liability' ? 'bg-purple-50 text-purple-600' :
                            acc.type === 'equity' ? 'bg-slate-100 text-slate-700' :
                            acc.type === 'revenue' ? 'bg-emerald-50 text-emerald-600' :
                            'bg-rose-50 text-rose-600'
                          }`}>
                            {acc.type === 'asset' ? 'أصول' :
                             acc.type === 'liability' ? 'خصوم/التزامات' :
                             acc.type === 'equity' ? 'حقوق ملكية' :
                             acc.type === 'revenue' ? 'إيرادات' :
                             'مصاريف'}
                          </span>
                        </td>
                        <td className="p-4 font-mono font-bold text-slate-900">
                          {acc.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })} {settings.currency}
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex justify-center gap-1.5">
                            <button
                              onClick={() => {
                                setEditingAccount(acc);
                                setAccCode(acc.code);
                                setAccName(acc.name);
                                setAccType(acc.type);
                                setAccBalance(acc.balance);
                                setShowAccountModal(true);
                              }}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-bold"
                            >
                              تعديل
                            </button>
                            {!['acc_cash', 'acc_bank', 'acc_receivable', 'acc_inventory', 'acc_payable', 'acc_tax', 'acc_equity', 'acc_sales', 'acc_cogs', 'acc_expense'].includes(acc.id) && (
                              <button
                                onClick={() => handleDeleteAccount(acc.id)}
                                className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded text-xs font-bold"
                              >
                                حذف
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. JOURNAL ENTRIES */}
      {activeSubTab === 'entries' && (
        <div className="space-y-4">
          {entries.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-slate-400 text-sm">
              لم يتم العثور على قيود محاسبية مسجلة في هذا اليوم.
            </div>
          ) : (
            entries.map(entry => {
              const totalDeb = entry.details.reduce((sum, d) => sum + d.debit, 0);
              const totalCred = entry.details.reduce((sum, d) => sum + d.credit, 0);
              
              return (
                <div key={entry.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  {/* Entry Header */}
                  <div className="bg-slate-50 p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className="px-2.5 py-1 bg-slate-900 text-white font-mono font-black text-xs rounded-lg">
                        {entry.entryNumber}
                      </span>
                      <h5 className="font-black text-slate-800 text-xs sm:text-sm">{entry.description}</h5>
                    </div>
                    <span className="font-mono text-slate-400 text-xs">{entry.date}</span>
                  </div>

                  {/* Details table */}
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="bg-slate-100/50 border-b border-slate-100 font-bold text-slate-500">
                        <th className="p-3">اسم الحساب</th>
                        <th className="p-3 text-left">مدين (Debit)</th>
                        <th className="p-3 text-left">دائن (Credit)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-slate-700">
                      {entry.details.map(d => {
                        const acc = accounts.find(a => a.id === d.accountId);
                        return (
                          <tr key={d.id} className="hover:bg-slate-50/50 transition">
                            <td className="p-3 font-semibold text-slate-800">
                              {acc ? `${acc.name} (${acc.code})` : d.accountId}
                            </td>
                            <td className="p-3 text-left font-mono text-emerald-600 font-bold">
                              {d.debit > 0 ? d.debit.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                            </td>
                            <td className="p-3 text-left font-mono text-slate-400 font-semibold">
                              {d.credit > 0 ? d.credit.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                            </td>
                          </tr>
                        );
                      })}
                      {/* Entry Totals */}
                      <tr className="bg-slate-50/30 font-bold border-t border-slate-100">
                        <td className="p-3 text-slate-500">إجمالي السند المتزن</td>
                        <td className="p-3 text-left font-mono text-slate-900 underline decoration-double">
                          {totalDeb.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 text-left font-mono text-slate-900 underline decoration-double">
                          {totalCred.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 2.5 GENERAL LEDGER */}
      {activeSubTab === 'ledger' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h4 className="font-extrabold text-slate-800 text-sm">كشف حساب الأستاذ العام (General Ledger Card)</h4>
              <p className="text-slate-400 text-xs mt-1">اختر الحساب لعرض كشف الحركة التفصيلي والرصيد التراكمي التفاعلي.</p>
            </div>
            <div className="w-full md:w-72">
              <select
                value={selectedLedgerAccountId}
                onChange={(e) => setSelectedLedgerAccountId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs sm:text-sm text-right focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
              >
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>{a.name} ({a.code})</option>
                ))}
              </select>
            </div>
          </div>

          {ledgerLoading ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-slate-400 text-sm">
              جاري تحميل حركة الحساب...
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center flex-wrap gap-2">
                <span className="font-black text-slate-800 text-sm">
                  حساب: {ledgerAccount?.name} ({ledgerAccount?.code})
                </span>
                <span className="px-3 py-1 bg-slate-900 text-white font-mono font-bold text-xs rounded-lg">
                  الرصيد الختامي: {ledgerAccount?.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })} {settings.currency}
                </span>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 font-bold text-slate-500">
                      <th className="p-4">التاريخ</th>
                      <th className="p-4">رقم القيد</th>
                      <th className="p-4">البيان / الوصف</th>
                      <th className="p-4 text-left">مدين (Debit)</th>
                      <th className="p-4 text-left">دائن (Credit)</th>
                      <th className="p-4 text-left">الرصيد التراكمي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    <tr className="bg-slate-50/50 font-semibold text-slate-500">
                      <td className="p-4" colSpan={3}>الرصيد الافتتاحي للبطاقة</td>
                      <td className="p-4 text-left font-mono">-</td>
                      <td className="p-4 text-left font-mono">-</td>
                      <td className="p-4 text-left font-mono font-bold text-slate-900">
                        {(0).toLocaleString('en-US', { minimumFractionDigits: 2 })} {settings.currency}
                      </td>
                    </tr>
                    {(() => {
                      let runningBal = 0;
                      return ledgerLines.map(line => {
                        const change = line.debit - line.credit;
                        if (ledgerAccount?.type === 'asset' || ledgerAccount?.type === 'expense') {
                          runningBal += change;
                        } else {
                          runningBal -= change;
                        }
                        return (
                          <tr key={line.id} className="hover:bg-slate-50/50 transition">
                            <td className="p-4 font-mono text-slate-500">{line.date}</td>
                            <td className="p-4 font-mono">
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-bold">
                                {line.entryNumber}
                              </span>
                            </td>
                            <td className="p-4 font-bold text-slate-800">{line.description}</td>
                            <td className="p-4 text-left font-mono text-emerald-600 font-bold">
                              {line.debit > 0 ? line.debit.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                            </td>
                            <td className="p-4 text-left font-mono text-slate-400 font-semibold">
                              {line.credit > 0 ? line.credit.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                            </td>
                            <td className="p-4 text-left font-mono font-black text-slate-900">
                              {runningBal.toLocaleString('en-US', { minimumFractionDigits: 2 })} {settings.currency}
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. TRIAL BALANCE */}
      {activeSubTab === 'trial' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50">
            <h4 className="font-extrabold text-slate-800 text-sm">ميزان المراجعة بالأرصدة (Trial Balance)</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 font-bold text-slate-500">
                  <th className="p-4">رمز الحساب</th>
                  <th className="p-4">اسم الحساب</th>
                  <th className="p-4 text-left">أرصدة مدينة</th>
                  <th className="p-4 text-left">أرصدة دائنة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {accounts.map(acc => {
                  const isDebitSide = acc.type === 'asset' || acc.type === 'expense';
                  return (
                    <tr key={acc.id} className="hover:bg-slate-50/50 transition">
                      <td className="p-4 font-mono font-bold text-slate-500">{acc.code}</td>
                      <td className="p-4 font-bold text-slate-800">{acc.name}</td>
                      <td className="p-4 text-left font-mono text-emerald-600 font-bold">
                        {isDebitSide ? acc.balance.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                      </td>
                      <td className="p-4 text-left font-mono text-blue-600 font-bold">
                        {!isDebitSide ? acc.balance.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                      </td>
                    </tr>
                  );
                })}
                {/* Total check Row */}
                {(() => {
                  const debitTotal = accounts
                    .filter(a => a.type === 'asset' || a.type === 'expense')
                    .reduce((sum, a) => sum + a.balance, 0);
                  const creditTotal = accounts
                    .filter(a => a.type === 'liability' || a.type === 'equity' || a.type === 'revenue')
                    .reduce((sum, a) => sum + a.balance, 0);

                  return (
                    <tr className="bg-slate-900 text-white font-black border-t border-slate-200">
                      <td className="p-4" colSpan={2}>المجموع والاتزان المالي</td>
                      <td className="p-4 text-left font-mono text-teal-400">
                        {debitTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })} {settings.currency}
                      </td>
                      <td className="p-4 text-left font-mono text-teal-400">
                        {creditTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })} {settings.currency}
                      </td>
                    </tr>
                  );
                })()}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. INCOME STATEMENT */}
      {activeSubTab === 'income' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm max-w-3xl mx-auto">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 text-center">
            <h4 className="font-black text-slate-900 text-base">{settings.name}</h4>
            <p className="text-slate-400 text-xs mt-1">قائمة الدخل للفترة المالية الحالية</p>
          </div>

          <div className="p-6 space-y-6 text-xs sm:text-sm">
            {/* Sales revenue */}
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <span className="font-bold text-slate-800">إجمالي المبيعات والإيرادات التشغيلية</span>
              <span className="font-mono font-black text-slate-950">
                {salesRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })} {settings.currency}
              </span>
            </div>

            {/* COGS */}
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 text-slate-600">
              <span className="font-semibold">تكلفة المبيعات والبضائع المباعة (-)</span>
              <span className="font-mono font-bold">
                {cogs.toLocaleString('en-US', { minimumFractionDigits: 2 })} {settings.currency}
              </span>
            </div>

            {/* Gross Profit */}
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 font-extrabold text-slate-800 bg-slate-50 p-2.5 rounded-lg">
              <span>إجمالي مجمل الربح</span>
              <span className="font-mono font-black text-slate-900">
                {(salesRevenue - cogs).toLocaleString('en-US', { minimumFractionDigits: 2 })} {settings.currency}
              </span>
            </div>

            {/* Operating Expenses */}
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 text-slate-600">
              <span>المصاريف التشغيلية العمومية (-)</span>
              <span className="font-mono font-semibold">
                {operatingExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })} {settings.currency}
              </span>
            </div>

            {/* Net Profit Summary */}
            <div className="flex justify-between items-center p-4 bg-slate-950 text-white rounded-xl font-extrabold">
              <span className="text-sm">صافي الأرباح (الخسائر) النهائية</span>
              <span className="font-mono font-black text-lg text-teal-400">
                {netProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })} {settings.currency}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 5. BALANCE SHEET */}
      {activeSubTab === 'balance' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Assets Column */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 bg-blue-50/50 border-b border-blue-100">
              <h5 className="font-black text-blue-900 text-sm">الأصول المتداولة والثابتة (Assets)</h5>
            </div>
            <div className="p-4 space-y-4 text-xs sm:text-sm">
              {accounts.filter(a => a.type === 'asset').map(a => (
                <div key={a.id} className="flex justify-between items-center pb-2 border-b border-slate-100 text-slate-700">
                  <span className="font-semibold">{a.name} ({a.code})</span>
                  <span className="font-mono font-bold">{a.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })} {settings.currency}</span>
                </div>
              ))}
              <div className="flex justify-between items-center p-3 bg-blue-50 text-blue-950 rounded-xl font-black">
                <span>إجمالي الأصول</span>
                <span className="font-mono text-base">{totalAssets.toLocaleString('en-US', { minimumFractionDigits: 2 })} {settings.currency}</span>
              </div>
            </div>
          </div>

          {/* Liabilities and Equity Column */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 bg-purple-50/50 border-b border-purple-100">
              <h5 className="font-black text-purple-900 text-sm">الالتزامات وحقوق الملكية (Liabilities & Equity)</h5>
            </div>
            <div className="p-4 space-y-4 text-xs sm:text-sm">
              {/* Liabilities */}
              {accounts.filter(a => a.type === 'liability').map(a => (
                <div key={a.id} className="flex justify-between items-center pb-2 border-b border-slate-100 text-slate-700">
                  <span className="font-semibold">{a.name} ({a.code})</span>
                  <span className="font-mono font-bold">{a.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })} {settings.currency}</span>
                </div>
              ))}
              {/* Equity */}
              {accounts.filter(a => a.type === 'equity').map(a => (
                <div key={a.id} className="flex justify-between items-center pb-2 border-b border-slate-100 text-slate-700">
                  <span className="font-semibold">{a.name} ({a.code})</span>
                  <span className="font-mono font-bold">{a.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })} {settings.currency}</span>
                </div>
              ))}
              {/* Retained Earnings */}
              <div className="flex justify-between items-center pb-2 border-b border-slate-100 text-teal-600 font-bold">
                <span>صافي أرباح الفترة الحالية (محتجزة)</span>
                <span className="font-mono">{netProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })} {settings.currency}</span>
              </div>

              <div className="flex justify-between items-center p-3 bg-purple-50 text-purple-950 rounded-xl font-black">
                <span>إجمالي الخصوم وحقوق الملكية</span>
                <span className="font-mono text-base">{(totalLiabilities + totalEquity + netProfit).toLocaleString('en-US', { minimumFractionDigits: 2 })} {settings.currency}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. CASH FLOW STATEMENT */}
      {activeSubTab === 'cashflow' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm max-w-3xl mx-auto">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 text-center">
            <h4 className="font-black text-slate-900 text-base">{settings.name}</h4>
            <p className="text-slate-400 text-xs mt-1">قائمة التدفقات النقدية (Direct Method) للفترة الحالية</p>
          </div>

          {(() => {
            let salesInflow = 0;
            let collectionInflow = 0;
            let otherInflow = 0;

            let expenseOutflow = 0;
            let inventoryOutflow = 0;
            let supplierOutflow = 0;
            let otherOutflow = 0;

            entries.forEach(entry => {
              const cashDetails = entry.details.filter(d => d.accountId === 'acc_cash' || d.accountId === 'acc_bank');
              if (cashDetails.length === 0) return;

              const entryInflow = cashDetails.reduce((sum, d) => sum + d.debit, 0);
              const entryOutflow = cashDetails.reduce((sum, d) => sum + d.credit, 0);

              if (entryInflow > 0) {
                const credits = entry.details.filter(d => d.credit > 0);
                credits.forEach(c => {
                  const acc = accounts.find(a => a.id === c.accountId);
                  if (acc?.type === 'revenue') {
                    salesInflow += c.credit;
                  } else if (c.accountId === 'acc_receivable') {
                    collectionInflow += c.credit;
                  } else {
                    otherInflow += c.credit;
                  }
                });
              }

              if (entryOutflow > 0) {
                const debits = entry.details.filter(d => d.debit > 0);
                debits.forEach(d => {
                  const acc = accounts.find(a => a.id === d.accountId);
                  if (acc?.type === 'expense' || d.accountId === 'acc_expense') {
                    expenseOutflow += d.debit;
                  } else if (d.accountId === 'acc_inventory') {
                    inventoryOutflow += d.debit;
                  } else if (d.accountId === 'acc_payable') {
                    supplierOutflow += d.debit;
                  } else {
                    otherOutflow += d.debit;
                  }
                });
              }
            });

            const totalInflow = salesInflow + collectionInflow + otherInflow;
            const totalOutflow = expenseOutflow + inventoryOutflow + supplierOutflow + otherOutflow;
            const netCashFlow = totalInflow - totalOutflow;

            const cashAtStart = 0;
            const cashAtEnd = accounts.filter(a => a.id === 'acc_cash' || a.id === 'acc_bank').reduce((sum, a) => sum + a.balance, 0);

            return (
              <div className="p-6 space-y-6 text-xs sm:text-sm">
                <div className="space-y-4">
                  <h5 className="font-extrabold text-slate-800 text-xs sm:text-sm border-b pb-2">1. التدفقات النقدية من الأنشطة التشغيلية (Inflows)</h5>
                  
                  <div className="flex justify-between items-center pb-2 text-slate-600 pl-4">
                    <span>النقد المقبوض من المبيعات الفورية</span>
                    <span className="font-mono font-bold text-emerald-600">
                      +{salesInflow.toLocaleString('en-US', { minimumFractionDigits: 2 })} {settings.currency}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pb-2 text-slate-600 pl-4">
                    <span>تحصيل المقبوضات من العملاء (المبيعات الآجلة)</span>
                    <span className="font-mono font-bold text-emerald-600">
                      +{collectionInflow.toLocaleString('en-US', { minimumFractionDigits: 2 })} {settings.currency}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pb-2 text-slate-600 pl-4">
                    <span>المقبوضات والتمويلات النقدية الأخرى</span>
                    <span className="font-mono font-bold text-emerald-600">
                      +{otherInflow.toLocaleString('en-US', { minimumFractionDigits: 2 })} {settings.currency}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <h5 className="font-extrabold text-slate-800 text-xs sm:text-sm border-b pb-2">2. التدفقات النقدية الخارجة للأنشطة التشغيلية (Outflows)</h5>
                  
                  <div className="flex justify-between items-center pb-2 text-slate-600 pl-4">
                    <span>النقد المدفوع لشراء مخزون البضائع</span>
                    <span className="font-mono font-bold text-rose-600">
                      -{inventoryOutflow.toLocaleString('en-US', { minimumFractionDigits: 2 })} {settings.currency}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pb-2 text-slate-600 pl-4">
                    <span>النقد المدفوع للموردين (سداد ذمم دائنة)</span>
                    <span className="font-mono font-bold text-rose-600">
                      -{supplierOutflow.toLocaleString('en-US', { minimumFractionDigits: 2 })} {settings.currency}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pb-2 text-slate-600 pl-4">
                    <span>النقد المدفوع مقابل المصاريف التشغيلية والعمومية</span>
                    <span className="font-mono font-bold text-rose-600">
                      -{expenseOutflow.toLocaleString('en-US', { minimumFractionDigits: 2 })} {settings.currency}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pb-2 text-slate-600 pl-4">
                    <span>المدفوعات النقدية الخارجة الأخرى</span>
                    <span className="font-mono font-bold text-rose-600">
                      -{otherOutflow.toLocaleString('en-US', { minimumFractionDigits: 2 })} {settings.currency}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center p-3.5 bg-slate-50 font-extrabold text-slate-800 rounded-lg">
                  <span>صافي الزيادة (النقص) في النقدية خلال الفترة</span>
                  <span className={`font-mono font-black ${netCashFlow >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {netCashFlow.toLocaleString('en-US', { minimumFractionDigits: 2 })} {settings.currency}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <div className="flex justify-between items-center text-slate-600">
                    <span>النقدية وما يعادلها في بداية الفترة</span>
                    <span className="font-mono font-bold">{cashAtStart.toLocaleString('en-US', { minimumFractionDigits: 2 })} {settings.currency}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-slate-900 text-white font-extrabold rounded-xl text-xs sm:text-sm">
                    <span>النقدية وما يعادلها في نهاية الفترة (الخزينة والبنك)</span>
                    <span className="font-mono font-black text-teal-400">
                      {cashAtEnd.toLocaleString('en-US', { minimumFractionDigits: 2 })} {settings.currency}
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Account Manager Modal */}
      {showAccountModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-5 bg-slate-900 text-white flex justify-between items-center">
              <h4 className="font-black text-xs sm:text-sm">
                {editingAccount ? 'تعديل الحساب المحاسبي' : 'إضافة حساب جديد لدليل الحسابات'}
              </h4>
              <button 
                onClick={() => {
                  setShowAccountModal(false);
                  setEditingAccount(null);
                }}
                className="text-slate-400 hover:text-white font-bold"
              >
                إغلاق
              </button>
            </div>

            <form onSubmit={handleSaveAccount} className="p-5 space-y-4">
              {accountError && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-bold">
                  ⚠️ {accountError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">رمز الحساب (Code)</label>
                <input 
                  type="text"
                  placeholder="مثال: 1104، 5202"
                  value={accCode}
                  onChange={(e) => setAccCode(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs sm:text-sm text-right focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">اسم الحساب العربي</label>
                <input 
                  type="text"
                  placeholder="مثال: ذمم موظفين، صيانة أصول..."
                  value={accName}
                  onChange={(e) => setAccName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs sm:text-sm text-right focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">نوع الحساب</label>
                <select
                  value={accType}
                  onChange={(e) => setAccType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs sm:text-sm text-right focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="asset">أصول (Asset)</option>
                  <option value="liability">خصوم/التزامات (Liability)</option>
                  <option value="equity">حقوق ملكية (Equity)</option>
                  <option value="revenue">إيرادات (Revenue)</option>
                  <option value="expense">مصاريف (Expense)</option>
                </select>
              </div>

              {!editingAccount && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">الرصيد الافتتاحي</label>
                  <input 
                    type="number"
                    value={accBalance}
                    onChange={(e) => setAccBalance(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs sm:text-sm text-right focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => {
                    setShowAccountModal(false);
                    setEditingAccount(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  إلغاء
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
                >
                  حفظ الحساب
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Entry Modal */}
      {showManualModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
            <div className="p-5 bg-slate-900 text-white flex justify-between items-center">
              <h4 className="font-black text-sm sm:text-base">إنشاء قيد محاسبي يدوي (Double-Entry)</h4>
              <button 
                onClick={() => setShowManualModal(false)}
                className="text-slate-400 hover:text-white font-bold"
              >
                إغلاق
              </button>
            </div>

            <form onSubmit={handleAddManualEntry} className="p-5 space-y-4">
              {modalError && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-bold">
                  ⚠️ {modalError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">تاريخ السند</label>
                  <input 
                    type="date"
                    value={entryDate}
                    onChange={(e) => setEntryDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs sm:text-sm text-right focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">وصف القيد العام</label>
                  <input 
                    type="text"
                    placeholder="مثال: سداد مصروف الصيانة، زيادة رأس مال..."
                    value={entryDesc}
                    onChange={(e) => setEntryDesc(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs sm:text-sm text-right focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              {/* Entry Lines */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-slate-700">بنود وتفاصيل القيد المتزن</span>
                  <button 
                    type="button"
                    onClick={() => setEntryLines(prev => [...prev, { accountId: 'acc_cash', debit: 0, credit: 0 }])}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
                  >
                    + إضافة سطر حساب
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {entryLines.map((line, idx) => (
                    <div key={idx} className="flex gap-2.5 items-center">
                      <select
                        value={line.accountId}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEntryLines(prev => prev.map((l, i) => i === idx ? { ...l, accountId: val } : l));
                        }}
                        className="flex-1 px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg text-right"
                      >
                        {accounts.map(a => (
                          <option key={a.id} value={a.id}>{a.name} ({a.code})</option>
                        ))}
                      </select>

                      <input 
                        type="number" 
                        placeholder="مدين"
                        value={line.debit || ''}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setEntryLines(prev => prev.map((l, i) => i === idx ? { ...l, debit: val, credit: 0 } : l));
                        }}
                        className="w-24 px-2 py-1.5 text-xs border border-slate-200 rounded-lg text-center font-mono font-bold"
                      />

                      <input 
                        type="number" 
                        placeholder="دائن"
                        value={line.credit || ''}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setEntryLines(prev => prev.map((l, i) => i === idx ? { ...l, credit: val, debit: 0 } : l));
                        }}
                        className="w-24 px-2 py-1.5 text-xs border border-slate-200 rounded-lg text-center font-mono font-bold"
                      />

                      {entryLines.length > 2 && (
                        <button 
                          type="button"
                          onClick={() => setEntryLines(prev => prev.filter((_, i) => i !== idx))}
                          className="text-red-500 hover:text-red-700 font-bold px-1"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setShowManualModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  إلغاء
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
                >
                  ترحيل القيد للميزانية
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
