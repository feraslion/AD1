import React, { useState, useEffect } from 'react';
import { StoreSettings } from '../../types';
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
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  List,
  GitFork,
  CheckCircle2,
  XCircle,
  Database,
  Sparkles,
  Layers,
  Power
} from 'lucide-react';
import StatCard from '../../shared/components/ui/StatCard';
import Badge from '../../shared/components/ui/Badge';
import Modal from '../../shared/components/ui/Modal';
import { AccountingService } from '../../services/api';

import CurrencyManagement from './CurrencyManagement';
import { JournalEntriesManager } from './components/JournalEntriesManager';
import { GeneralLedgerManager } from './components/GeneralLedgerManager';
import { FinancialStatementsManager } from './components/FinancialStatementsManager';

interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
  balance: number;
  currency?: string;
  foreignBalance?: number;
  parentId?: string | null;
  isActive?: boolean;
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
  const [activeSubTab, setActiveSubTab] = useState<'chart' | 'entries' | 'ledger' | 'trial' | 'income' | 'balance' | 'cashflow' | 'postingRules' | 'currencies'>('chart');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [postingRulesList, setPostingRulesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Chart of accounts view mode & filters
  const [chartViewMode, setChartViewMode] = useState<'tree' | 'flat'>('tree');
  const [typeFilter, setTypeFilter] = useState<'all' | 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [expandedAccountIds, setExpandedAccountIds] = useState<Set<string>>(new Set(['acc_1', 'acc_11', 'acc_2', 'acc_21', 'acc_3', 'acc_4', 'acc_41', 'acc_5', 'acc_51', 'acc_52']));
  
  // For account manager modal
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [accCode, setAccCode] = useState('');
  const [accName, setAccName] = useState('');
  const [accType, setAccType] = useState('asset');
  const [accBalance, setAccBalance] = useState(0);
  const [accParentId, setAccParentId] = useState('');
  const [accCurrency, setAccCurrency] = useState('SAR');
  const [accIsActive, setAccIsActive] = useState(true);
  const [accountError, setAccountError] = useState('');

  // For General Ledger tab
  const [selectedLedgerAccountId, setSelectedLedgerAccountId] = useState<string>('acc_cash');
  const [ledgerLines, setLedgerLines] = useState<any[]>([]);
  const [ledgerAccount, setLedgerAccount] = useState<Account | null>(null);
  const [ledgerLoading, setLedgerLoading] = useState(false);

  // For manual journal entry modal
  const [currenciesList, setCurrenciesList] = useState<any[]>([]);
  const [showManualModal, setShowManualModal] = useState(false);
  const [entryDesc, setEntryDesc] = useState('');
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [entryCurrency, setEntryCurrency] = useState('USD');
  const [entryExchangeRate, setEntryExchangeRate] = useState<number>(1.0);
  const [entryLines, setEntryLines] = useState<{ accountId: string; debit: number; credit: number; foreignDebit?: number; foreignCredit?: number }[]>([
    { accountId: 'acc_cash', debit: 0, credit: 0, foreignDebit: 0, foreignCredit: 0 },
    { accountId: 'acc_expense', debit: 0, credit: 0, foreignDebit: 0, foreignCredit: 0 }
  ]);
  const [modalError, setModalError] = useState('');

  const fetchAccountingData = async () => {
    setLoading(true);
    try {
      const accData = await AccountingService.getAccounts();
      setAccounts(accData);
      
      const entryData = await AccountingService.getJournalEntries();
      setEntries(entryData);

      const rulesData = await AccountingService.getPostingRules();
      setPostingRulesList(rulesData);

      try {
        const curRes = await fetch('/api/currencies');
        const curJson = await curRes.json();
        if (curJson.success && Array.isArray(curJson.data)) {
          setCurrenciesList(curJson.data);
          const baseCurr = curJson.data.find((c: any) => c.isDefault === 'true' || c.isDefault === true || c.isDefault === '1');
          if (baseCurr) {
            setEntryCurrency(baseCurr.code);
            setEntryExchangeRate(1.0);
          }
        }
      } catch (err) {
        console.error('Failed to fetch currencies in Accounting:', err);
      }
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

  const handleParentChange = async (pId: string) => {
    setAccParentId(pId);
    if (!pId) return;
    const parentAcc = accounts.find(a => a.id === pId);
    if (parentAcc) {
      setAccType(parentAcc.type);
      if (!editingAccount) {
        try {
          const res = await AccountingService.suggestChildCode(pId);
          if (res && res.suggestedCode) {
            setAccCode(res.suggestedCode);
          }
        } catch (err) {
          console.error('Error suggesting child code:', err);
        }
      }
    }
  };

  const toggleExpandNode = (id: string) => {
    setExpandedAccountIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAllNodes = () => {
    const allIds = new Set(accounts.map(a => a.id));
    setExpandedAccountIds(allIds);
  };

  const collapseAllNodes = () => {
    setExpandedAccountIds(new Set());
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setAccountError('');

    if (!accCode || !accName) {
      setAccountError('الرجاء تعبئة كافة الحقول المطلوبة (الرمز، الاسم).');
      return;
    }

    try {
      await AccountingService.createAccount({
        id: editingAccount?.id,
        code: accCode,
        name: accName,
        type: accType,
        balance: accBalance,
        currency: accCurrency || settings.currency || 'SAR',
        parentId: accParentId || null,
        isActive: accIsActive
      });
      setShowAccountModal(false);
      setEditingAccount(null);
      setAccCode('');
      setAccName('');
      setAccType('asset');
      setAccBalance(0);
      setAccParentId('');
      setAccCurrency(settings.currency || 'SAR');
      setAccIsActive(true);
      fetchAccountingData();
    } catch (e: any) {
      setAccountError(e.message || 'خطأ في الاتصال بالخادم.');
    }
  };

  const handleToggleActiveAccount = async (id: string, currentStatus: boolean) => {
    try {
      await AccountingService.toggleAccountActive(id, !currentStatus);
      fetchAccountingData();
    } catch (e: any) {
      alert(e.message || 'فشل تغيير حالة الحساب');
    }
  };

  const handleSeedAccounts = async () => {
    if (!window.confirm('هل ترغب بزرع دليل الحسابات القياسي لنظام ERP (أصول، خصوم، ملكية، إيرادات، مصاريف)؟')) return;
    setLoading(true);
    try {
      const res = await AccountingService.seedDefaultAccounts();
      alert(`تم زرع دليل الحسابات بنجاح. تم إنشاء ${res.seededCount} حساب جديد.`);
      fetchAccountingData();
    } catch (err: any) {
      alert(err.message || 'فشل زرع دليل الحسابات');
    } finally {
      setLoading(false);
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
  const totalAssets = AccountingService.totalAssets(accounts);
  const totalLiabilities = AccountingService.totalLiabilities(accounts);
  const totalEquity = AccountingService.totalEquity(accounts);
  
  const salesRevenue = AccountingService.salesRevenue(accounts);
  const totalExpenses = AccountingService.totalExpenses(accounts);
  const cogs = AccountingService.cogs(accounts);
  const operatingExpenses = AccountingService.operatingExpenses(accounts);
  const netProfit = AccountingService.netProfit(accounts);

  // Manual entry submission
  const handleAddManualEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');

    const validationError = AccountingService.validateJournalEntry(entryLines, entryDesc, settings.currency);
    if (validationError) {
      setModalError(validationError);
      return;
    }

    try {
      await AccountingService.createJournalEntry({
        description: entryDesc,
        date: entryDate,
        currency: entryCurrency,
        baseCurrency: settings.currency || 'SAR',
        exchangeRate: entryExchangeRate,
        lines: entryLines.map(l => ({
          accountId: l.accountId,
          debit: Number(l.debit),
          credit: Number(l.credit),
          currency: entryCurrency,
          exchangeRate: entryExchangeRate,
          foreignDebit: Number(l.foreignDebit || 0),
          foreignCredit: Number(l.foreignCredit || 0)
        }))
      });
      setShowManualModal(false);
      setEntryDesc('');
      setEntryLines([
        { accountId: 'acc_cash', debit: 0, credit: 0, foreignDebit: 0, foreignCredit: 0 },
        { accountId: 'acc_expense', debit: 0, credit: 0, foreignDebit: 0, foreignCredit: 0 }
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

        <button
          onClick={() => setActiveSubTab('postingRules')}
          className={`pb-3 text-xs sm:text-sm font-extrabold transition whitespace-nowrap px-2.5 ${
            activeSubTab === 'postingRules' 
              ? 'border-b-2 border-slate-900 text-slate-900' 
              : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Scale className="w-4 h-4" />
            <span>قواعد الترحيل التلقائي</span>
          </div>
        </button>

        <button
          onClick={() => setActiveSubTab('currencies')}
          className={`pb-3 text-xs sm:text-sm font-extrabold transition whitespace-nowrap px-2.5 ${
            activeSubTab === 'currencies' 
              ? 'border-b-2 border-slate-900 text-slate-900' 
              : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Coins className="w-4 h-4 text-emerald-600" />
            <span>نظام العملات والصرف</span>
          </div>
        </button>
      </div>

      {/* Content Rendering based on Sub Tab */}

      {/* 1. CHART OF ACCOUNTS */}
      {activeSubTab === 'chart' && (
        <div className="space-y-4">
          {/* Top Bar: Search, Filters, View Switcher & Action Buttons */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              {/* Search input */}
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="البحث برمز الحساب أو الاسم..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-3 pr-10 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm text-right focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-semibold"
                />
                <span className="absolute right-3 top-2.5 text-slate-400">🔍</span>
              </div>

              {/* View Switcher & Seed / Add Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {/* View switcher */}
                <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setChartViewMode('tree')}
                    className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                      chartViewMode === 'tree' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <GitFork className="w-3.5 h-3.5 text-emerald-600" />
                    <span>عرض شجري</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartViewMode('flat')}
                    className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                      chartViewMode === 'flat' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <List className="w-3.5 h-3.5 text-blue-600" />
                    <span>عرض جدول</span>
                  </button>
                </div>

                {chartViewMode === 'tree' && (
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={expandAllNodes}
                      className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold transition"
                      title="توسيع كافة الفروع"
                    >
                      توسيع الكل
                    </button>
                    <button
                      type="button"
                      onClick={collapseAllNodes}
                      className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold transition"
                      title="طي كافة الفروع"
                    >
                      طي الكل
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleSeedAccounts}
                  className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                  title="زرع الدليل القياسي المعتمد"
                >
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>زرع الدليل القياسي</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEditingAccount(null);
                    setAccCode('');
                    setAccName('');
                    setAccType('asset');
                    setAccBalance(0);
                    setAccParentId('');
                    setAccCurrency(settings.currency || 'SAR');
                    setAccIsActive(true);
                    setShowAccountModal(true);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition shadow-sm"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>إضافة حساب جديد</span>
                </button>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs font-bold">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-slate-400 ml-1">تصفية حسب النوع:</span>
                {[
                  { key: 'all', label: 'الكل' },
                  { key: 'asset', label: 'أصول' },
                  { key: 'liability', label: 'خصوم' },
                  { key: 'equity', label: 'حقوق ملكية' },
                  { key: 'revenue', label: 'إيرادات' },
                  { key: 'expense', label: 'مصروفات' }
                ].map(item => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setTypeFilter(item.key as any)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                      typeFilter === item.key 
                        ? 'bg-slate-900 text-white shadow-xs' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 ml-1">الحالة:</span>
                {[
                  { key: 'all', label: 'الكل' },
                  { key: 'active', label: 'النشطة فقط' },
                  { key: 'inactive', label: 'المعطلة' }
                ].map(item => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setStatusFilter(item.key as any)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                      statusFilter === item.key 
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                        : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Accounts Rendering: TREE or FLAT */}
          {chartViewMode === 'tree' ? (
            <AccountTreeView
              accounts={accounts}
              searchQuery={searchQuery}
              typeFilter={typeFilter}
              statusFilter={statusFilter}
              expandedAccountIds={expandedAccountIds}
              toggleExpandNode={toggleExpandNode}
              currency={settings.currency}
              onEdit={(acc) => {
                setEditingAccount(acc);
                setAccCode(acc.code);
                setAccName(acc.name);
                setAccType(acc.type);
                setAccBalance(acc.balance);
                setAccParentId(acc.parentId || '');
                setAccCurrency(acc.currency || settings.currency || 'SAR');
                setAccIsActive(acc.isActive !== false);
                setShowAccountModal(true);
              }}
              onAddChild={async (parentAcc) => {
                setEditingAccount(null);
                setAccParentId(parentAcc.id);
                setAccType(parentAcc.type);
                setAccName('');
                setAccBalance(0);
                setAccCurrency(parentAcc.currency || settings.currency || 'SAR');
                setAccIsActive(true);
                try {
                  const res = await AccountingService.suggestChildCode(parentAcc.id);
                  if (res && res.suggestedCode) {
                    setAccCode(res.suggestedCode);
                  }
                } catch (e) {
                  setAccCode(`${parentAcc.code}01`);
                }
                setShowAccountModal(true);
              }}
              onToggleActive={(id, curr) => handleToggleActiveAccount(id, curr)}
              onDelete={(id) => handleDeleteAccount(id)}
            />
          ) : (
            <AccountFlatTableView
              accounts={accounts}
              searchQuery={searchQuery}
              typeFilter={typeFilter}
              statusFilter={statusFilter}
              currency={settings.currency}
              onEdit={(acc) => {
                setEditingAccount(acc);
                setAccCode(acc.code);
                setAccName(acc.name);
                setAccType(acc.type);
                setAccBalance(acc.balance);
                setAccParentId(acc.parentId || '');
                setAccCurrency(acc.currency || settings.currency || 'SAR');
                setAccIsActive(acc.isActive !== false);
                setShowAccountModal(true);
              }}
              onToggleActive={(id, curr) => handleToggleActiveAccount(id, curr)}
              onDelete={(id) => handleDeleteAccount(id)}
            />
          )}
        </div>
      )}

      {/* 2. JOURNAL ENTRIES */}
      {activeSubTab === 'entries' && (
        <JournalEntriesManager 
          accounts={accounts} 
          baseCurrency={settings.currency || 'SAR'} 
          onRefreshData={fetchAccountingData} 
        />
      )}

      {/* 2.5 GENERAL LEDGER */}
      {activeSubTab === 'ledger' && (
        <GeneralLedgerManager
          accounts={accounts}
          baseCurrency={settings.currency || 'SAR'}
          onRefreshData={fetchAccountingData}
        />
      )}

      {/* 3. FINANCIAL STATEMENTS ENGINE (Trial Balance, Income Statement, Balance Sheet, Cash Flow) */}
      {(activeSubTab === 'trial' || activeSubTab === 'income' || activeSubTab === 'balance' || activeSubTab === 'cashflow') && (
        <FinancialStatementsManager
          activeStatement={activeSubTab}
          baseCurrency={settings.currency || 'SAR'}
          onRefreshData={fetchAccountingData}
        />
      )}

      {activeSubTab === 'postingRules' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md">
            <div className="space-y-1">
              <h4 className="font-black text-lg flex items-center gap-2">
                <span className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg">⚙️</span>
                محرك الترحيل التلقائي وقواعد الحسابات
              </h4>
              <p className="text-slate-300 text-xs sm:text-sm">
                تحكم بالربط المحاسبي التلقائي للمعاملات والعمليات التشغيلية (فواتير، مشتريات، سندات، مصاريف) بـ دليل الحسابات العام لتوليد القيود بشكل فوري ودقيق بمستوى Odoo/SAP.
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100 text-xs font-bold text-slate-500">
                    <th className="p-4">الحدث المالي</th>
                    <th className="p-4">كود النظام الدولي</th>
                    <th className="p-4">الحساب المرتبط حالياً</th>
                    <th className="p-4">تحديث الربط</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs sm:text-sm text-slate-700">
                  {postingRulesList.map((rule) => {
                    const currentAcc = accounts.find(a => a.id === rule.accountId);
                    return (
                      <tr key={rule.id} className="hover:bg-slate-50/50 transition">
                        <td className="p-4 font-bold text-slate-900">{rule.description}</td>
                        <td className="p-4 font-mono text-xs text-slate-400">{rule.ruleCode}</td>
                        <td className="p-4">
                          {currentAcc ? (
                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded font-mono font-bold text-xs">
                                {currentAcc.code}
                              </span>
                              <span className="font-extrabold text-slate-800">{currentAcc.name}</span>
                            </div>
                          ) : (
                            <span className="text-rose-500 font-bold">غير مرتبط بحساب!</span>
                          )}
                        </td>
                        <td className="p-4">
                          <select
                            value={rule.accountId}
                            onChange={async (e) => {
                              const newAccId = e.target.value;
                              try {
                                await AccountingService.updatePostingRule(rule.ruleCode, newAccId);
                                // update local state
                                setPostingRulesList(prev => prev.map(item => 
                                  item.ruleCode === rule.ruleCode ? { ...item, accountId: newAccId } : item
                                ));
                                fetchAccountingData();
                              } catch (err) {
                                console.error("Error updating posting rule:", err);
                              }
                            }}
                            className="bg-slate-50 border border-slate-200 text-slate-800 font-bold text-xs rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          >
                            {accounts.map(acc => (
                              <option key={acc.id} value={acc.id}>
                                {acc.code} - {acc.name}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 9. CURRENCY & FOREX MANAGEMENT */}
      {activeSubTab === 'currencies' && (
        <CurrencyManagement />
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
                <label className="block text-xs font-bold text-slate-500 mb-1">الحساب الأب / الحساب الرئيسي (اختياري)</label>
                <select
                  value={accParentId}
                  onChange={(e) => handleParentChange(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs sm:text-sm text-right focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                >
                  <option value="">-- بدون حساب أب (حساب فرعي/رئيسي مستقل) --</option>
                  {accounts
                    .filter(a => a.id !== editingAccount?.id)
                    .map(a => (
                      <option key={a.id} value={a.id}>
                        {a.code} - {a.name} ({a.type === 'asset' ? 'أصول' : a.type === 'liability' ? 'خصوم' : a.type === 'equity' ? 'ملكية' : a.type === 'revenue' ? 'إيرادات' : 'مصاريف'})
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">رمز الحساب (Code)</label>
                  <input 
                    type="text"
                    placeholder="مثال: 1104، 5202"
                    value={accCode}
                    onChange={(e) => setAccCode(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs sm:text-sm text-right focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono font-bold"
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
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">اسم الحساب العربي</label>
                <input 
                  type="text"
                  placeholder="مثال: ذمم موظفين، صيانة أصول..."
                  value={accName}
                  onChange={(e) => setAccName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs sm:text-sm text-right focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">عملة الحساب المعرفية</label>
                  <select
                    value={accCurrency}
                    onChange={(e) => setAccCurrency(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs sm:text-sm text-right focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold"
                  >
                    {currenciesList.length > 0 ? (
                      currenciesList.map(c => (
                        <option key={c.code} value={c.code}>{c.name} ({c.code})</option>
                      ))
                    ) : (
                      <>
                        <option value="SAR">الريال السعودي (SAR)</option>
                        <option value="USD">الدولار الأمريكي (USD)</option>
                        <option value="SYP">الليرة السورية (SYP)</option>
                        <option value="TRY">الليرة التركية (TRY)</option>
                      </>
                    )}
                  </select>
                </div>

                {!editingAccount ? (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">الرصيد الافتتاحي</label>
                    <input 
                      type="number"
                      value={accBalance}
                      onChange={(e) => setAccBalance(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs sm:text-sm text-right focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono font-bold"
                    />
                  </div>
                ) : (
                  <div className="flex items-center pt-5">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                      <input 
                        type="checkbox"
                        checked={accIsActive}
                        onChange={(e) => setAccIsActive(e.target.checked)}
                        className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                      />
                      <span>حساب نشط ويستقبل قيود ترحيل</span>
                    </label>
                  </div>
                )}
              </div>

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
                  <label className="block text-xs font-bold text-slate-500 mb-1">تاريخ القيد</label>
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

              {/* Currency & Exchange Rate selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">عملة المعاملة (Transaction Currency)</label>
                  <select
                    value={entryCurrency}
                    onChange={(e) => {
                      const currCode = e.target.value;
                      setEntryCurrency(currCode);
                      const selectedObj = currenciesList.find(c => c.code === currCode);
                      if (selectedObj) {
                        setEntryExchangeRate(parseFloat(selectedObj.exchangeRate || '1.0'));
                      }
                    }}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold bg-white focus:outline-none"
                  >
                    {currenciesList.length > 0 ? (
                      currenciesList.map(c => (
                        <option key={c.id || c.code} value={c.code}>
                          {c.name} ({c.code}) {c.isDefault === 'true' || c.isDefault === true || c.isDefault === '1' ? ' - العملة الأساسية' : ''}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="USD">الدولار الأمريكي (USD)</option>
                        <option value="SYP">الليرة السورية (SYP)</option>
                        <option value="TRY">الليرة التركية (TRY)</option>
                        <option value="SAR">الريال السعودي (SAR)</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    سعر الصرف مقابل العملة الأساسية
                  </label>
                  <input 
                    type="number"
                    step="any"
                    value={entryExchangeRate}
                    onChange={(e) => setEntryExchangeRate(parseFloat(e.target.value) || 1.0)}
                    disabled={currenciesList.find(c => c.code === entryCurrency)?.isDefault === 'true' || currenciesList.find(c => c.code === entryCurrency)?.isDefault === true || currenciesList.find(c => c.code === entryCurrency)?.isDefault === '1'}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono font-bold bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Entry Lines */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-slate-700">بنود وتفاصيل القيد المتزن ({entryCurrency})</span>
                  <button 
                    type="button"
                    onClick={() => setEntryLines(prev => [...prev, { accountId: 'acc_cash', debit: 0, credit: 0, foreignDebit: 0, foreignCredit: 0 }])}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
                  >
                    + إضافة سطر حساب
                  </button>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {entryLines.map((line, idx) => {
                    const isBase = currenciesList.find(c => c.code === entryCurrency)?.isDefault === 'true' || currenciesList.find(c => c.code === entryCurrency)?.isDefault === true || currenciesList.find(c => c.code === entryCurrency)?.isDefault === '1';

                    return (
                      <div key={idx} className="flex flex-wrap sm:flex-nowrap gap-2 items-center bg-slate-50/50 p-2 rounded-xl border border-slate-100">
                        <select
                          value={line.accountId}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEntryLines(prev => prev.map((l, i) => i === idx ? { ...l, accountId: val } : l));
                          }}
                          className="flex-1 px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg text-right bg-white font-semibold"
                        >
                          {accounts.map(a => (
                            <option key={a.id} value={a.id}>{a.name} ({a.code})</option>
                          ))}
                        </select>

                        {!isBase && (
                          <input 
                            type="number" 
                            placeholder={`مدين (${entryCurrency})`}
                            value={line.foreignDebit || ''}
                            onChange={(e) => {
                              const fVal = parseFloat(e.target.value) || 0;
                              const bVal = fVal * entryExchangeRate;
                              setEntryLines(prev => prev.map((l, i) => i === idx ? { ...l, foreignDebit: fVal, foreignCredit: 0, debit: bVal, credit: 0 } : l));
                            }}
                            className="w-24 px-2 py-1.5 text-xs border border-emerald-200 bg-emerald-50/30 rounded-lg text-center font-mono font-bold text-emerald-800"
                          />
                        )}

                        <input 
                          type="number" 
                          placeholder="مدين (بالأساسية)"
                          value={line.debit || ''}
                          onChange={(e) => {
                            const bVal = parseFloat(e.target.value) || 0;
                            const fVal = entryExchangeRate > 0 ? bVal / entryExchangeRate : bVal;
                            setEntryLines(prev => prev.map((l, i) => i === idx ? { ...l, debit: bVal, credit: 0, foreignDebit: fVal, foreignCredit: 0 } : l));
                          }}
                          className="w-24 px-2 py-1.5 text-xs border border-slate-200 rounded-lg text-center font-mono font-bold bg-white"
                        />

                        {!isBase && (
                          <input 
                            type="number" 
                            placeholder={`دائن (${entryCurrency})`}
                            value={line.foreignCredit || ''}
                            onChange={(e) => {
                              const fVal = parseFloat(e.target.value) || 0;
                              const bVal = fVal * entryExchangeRate;
                              setEntryLines(prev => prev.map((l, i) => i === idx ? { ...l, foreignCredit: fVal, foreignDebit: 0, credit: bVal, debit: 0 } : l));
                            }}
                            className="w-24 px-2 py-1.5 text-xs border border-rose-200 bg-rose-50/30 rounded-lg text-center font-mono font-bold text-rose-800"
                          />
                        )}

                        <input 
                          type="number" 
                          placeholder="دائن (بالأساسية)"
                          value={line.credit || ''}
                          onChange={(e) => {
                            const bVal = parseFloat(e.target.value) || 0;
                            const fVal = entryExchangeRate > 0 ? bVal / entryExchangeRate : bVal;
                            setEntryLines(prev => prev.map((l, i) => i === idx ? { ...l, credit: bVal, debit: 0, foreignCredit: fVal, foreignDebit: 0 } : l));
                          }}
                          className="w-24 px-2 py-1.5 text-xs border border-slate-200 rounded-lg text-center font-mono font-bold bg-white"
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
                    );
                  })}
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

interface AccountTreeViewProps {
  accounts: Account[];
  searchQuery: string;
  typeFilter: string;
  statusFilter: string;
  expandedAccountIds: Set<string>;
  toggleExpandNode: (id: string) => void;
  currency: string;
  onEdit: (acc: Account) => void;
  onAddChild: (acc: Account) => void;
  onToggleActive: (id: string, current: boolean) => void;
  onDelete: (id: string) => void;
}

function AccountTreeView({
  accounts,
  searchQuery,
  typeFilter,
  statusFilter,
  expandedAccountIds,
  toggleExpandNode,
  currency,
  onEdit,
  onAddChild,
  onToggleActive,
  onDelete
}: AccountTreeViewProps) {
  const filterMatch = (acc: Account) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || acc.name.toLowerCase().includes(q) || acc.code.toLowerCase().includes(q);
    const matchesType = typeFilter === 'all' || acc.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? acc.isActive !== false : acc.isActive === false);
    return matchesSearch && matchesType && matchesStatus;
  };

  const accountMap = new Map<string, any>();
  const rootNodes: any[] = [];

  accounts.forEach(acc => {
    accountMap.set(acc.id, { ...acc, children: [] });
  });

  accounts.forEach(acc => {
    const node = accountMap.get(acc.id)!;
    if (acc.parentId && accountMap.has(acc.parentId)) {
      accountMap.get(acc.parentId)!.children.push(node);
    } else {
      rootNodes.push(node);
    }
  });

  const renderNode = (node: any, level: number = 1) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedAccountIds.has(node.id) || !!searchQuery || typeFilter !== 'all' || statusFilter !== 'all';

    const hasMatchingDescendants = (n: any): boolean => {
      if (filterMatch(n)) return true;
      return n.children.some((c: any) => hasMatchingDescendants(c));
    };

    if (!hasMatchingDescendants(node)) {
      return null;
    }

    const typeBadgeColor = 
      node.type === 'asset' ? 'bg-blue-50 text-blue-700 border-blue-200' :
      node.type === 'liability' ? 'bg-purple-50 text-purple-700 border-purple-200' :
      node.type === 'equity' ? 'bg-slate-100 text-slate-700 border-slate-300' :
      node.type === 'revenue' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
      'bg-rose-50 text-rose-700 border-rose-200';

    const typeLabel = 
      node.type === 'asset' ? 'أصول' :
      node.type === 'liability' ? 'خصوم' :
      node.type === 'equity' ? 'حقوق ملكية' :
      node.type === 'revenue' ? 'إيرادات' : 'مصروفات';

    return (
      <div key={node.id} className="border-b border-slate-100 last:border-0">
        <div 
          className={`flex flex-wrap sm:flex-nowrap items-center justify-between p-3 transition hover:bg-slate-50/80 ${
            node.isActive === false ? 'opacity-60 bg-slate-50/40' : ''
          }`}
          style={{ paddingRight: `${(level - 1) * 20 + 12}px` }}
        >
          <div className="flex items-center gap-2 min-w-[260px] flex-1">
            {hasChildren ? (
              <button 
                type="button"
                onClick={() => toggleExpandNode(node.id)}
                className="p-1 rounded-lg hover:bg-slate-200 text-slate-500 transition"
              >
                {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-700" /> : <ChevronRight className="w-4 h-4 text-slate-700" />}
              </button>
            ) : (
              <div className="w-6" />
            )}

            {hasChildren ? (
              isExpanded ? <FolderOpen className="w-4 h-4 text-amber-500" /> : <Folder className="w-4 h-4 text-amber-500" />
            ) : (
              <FileText className="w-4 h-4 text-slate-400" />
            )}

            <span className="font-mono font-black text-xs sm:text-sm bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md border border-slate-200">
              {node.code}
            </span>

            <span className={`text-xs sm:text-sm font-extrabold ${level === 1 ? 'text-slate-900 text-base' : 'text-slate-800'}`}>
              {node.name}
            </span>

            {hasChildren && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded-full">
                {node.children.length} فرعي
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5 mt-2 sm:mt-0 flex-wrap">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${typeBadgeColor}`}>
              {typeLabel}
            </span>

            <span className="text-[10px] font-mono font-bold text-slate-400">
              مستوى {level}
            </span>

            {node.isActive === false ? (
              <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-50 text-rose-600 rounded-full border border-rose-200 flex items-center gap-1">
                <XCircle className="w-3 h-3" /> معطل
              </span>
            ) : (
              <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> نشط
              </span>
            )}

            <span className="font-mono font-bold text-xs sm:text-sm text-slate-900 min-w-[90px] text-left dir-ltr">
              {(Number(node.balance) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} {node.currency || currency}
            </span>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onAddChild(node)}
                className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded text-[11px] font-bold transition flex items-center gap-1"
                title="إضافة حساب فرعي تحته"
              >
                <PlusCircle className="w-3 h-3" />
                <span>+ فرعي</span>
              </button>

              <button
                type="button"
                onClick={() => onEdit(node)}
                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-bold transition"
              >
                تعديل
              </button>

              <button
                type="button"
                onClick={() => onToggleActive(node.id, node.isActive !== false)}
                className={`p-1 rounded transition ${
                  node.isActive === false ? 'text-emerald-600 hover:bg-emerald-50' : 'text-slate-400 hover:bg-slate-100'
                }`}
                title={node.isActive === false ? 'تنشيط الحساب' : 'تعطيل الحساب'}
              >
                <Power className="w-3.5 h-3.5" />
              </button>

              {!['acc_cash', 'acc_bank', 'acc_receivable', 'acc_inventory', 'acc_payable', 'acc_tax', 'acc_equity', 'acc_sales', 'acc_cogs', 'acc_expense'].includes(node.id) && (
                <button
                  type="button"
                  onClick={() => onDelete(node.id)}
                  className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded text-[11px] font-bold transition"
                >
                  حذف
                </button>
              )}
            </div>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="border-r-2 border-emerald-500/20 mr-3">
            {node.children.map((child: any) => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="bg-slate-50 p-3.5 border-b border-slate-200 flex justify-between items-center text-xs font-black text-slate-600">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-600" />
          <span>دليل الحسابات الهرمي التفاعلي (Hierarchical Chart of Accounts)</span>
        </div>
        <span>إجمالي الحسابات: {accounts.length}</span>
      </div>
      <div className="divide-y divide-slate-100">
        {rootNodes.map(node => renderNode(node, 1))}
      </div>
    </div>
  );
}

function AccountFlatTableView({
  accounts,
  searchQuery,
  typeFilter,
  statusFilter,
  currency,
  onEdit,
  onToggleActive,
  onDelete
}: {
  accounts: Account[];
  searchQuery: string;
  typeFilter: string;
  statusFilter: string;
  currency: string;
  onEdit: (acc: Account) => void;
  onToggleActive: (id: string, curr: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const filtered = accounts.filter(acc => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || acc.name.toLowerCase().includes(q) || acc.code.toLowerCase().includes(q);
    const matchesType = typeFilter === 'all' || acc.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? acc.isActive !== false : acc.isActive === false);
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-500">
              <th className="p-4">رمز الحساب</th>
              <th className="p-4">اسم الحساب</th>
              <th className="p-4">الحساب الأب</th>
              <th className="p-4">نوع الحساب</th>
              <th className="p-4">الحالة</th>
              <th className="p-4">الرصيد الحالي</th>
              <th className="p-4 text-center">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs sm:text-sm text-slate-700">
            {filtered.map(acc => {
              const parentAcc = accounts.find(a => a.id === acc.parentId);
              return (
                <tr key={acc.id} className={`hover:bg-slate-50/50 transition ${acc.isActive === false ? 'opacity-60 bg-slate-50/30' : ''}`}>
                  <td className="p-4 font-mono font-bold text-slate-600">
                    <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-md">
                      {acc.code}
                    </span>
                  </td>
                  <td className="p-4 font-bold text-slate-800">{acc.name}</td>
                  <td className="p-4 font-mono text-xs text-slate-500">
                    {parentAcc ? `${parentAcc.code} - ${parentAcc.name}` : <span className="text-slate-300">رئيسي</span>}
                  </td>
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
                       acc.type === 'revenue' ? 'إيرادات' : 'مصروفات'}
                    </span>
                  </td>
                  <td className="p-4">
                    {acc.isActive === false ? (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-50 text-rose-600 rounded-full border border-rose-200">
                        معطل
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                        نشط
                      </span>
                    )}
                  </td>
                  <td className="p-4 font-mono font-bold text-slate-900 dir-ltr">
                    {(Number(acc.balance) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} {acc.currency || currency}
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex justify-center items-center gap-1.5">
                      <button
                        onClick={() => onEdit(acc)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-bold transition"
                      >
                        تعديل
                      </button>
                      <button
                        onClick={() => onToggleActive(acc.id, acc.isActive !== false)}
                        className={`p-1 rounded transition ${
                          acc.isActive === false ? 'text-emerald-600 hover:bg-emerald-50' : 'text-slate-400 hover:bg-slate-100'
                        }`}
                        title={acc.isActive === false ? 'تنشيط الحساب' : 'تعطيل الحساب'}
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>
                      {!['acc_cash', 'acc_bank', 'acc_receivable', 'acc_inventory', 'acc_payable', 'acc_tax', 'acc_equity', 'acc_sales', 'acc_cogs', 'acc_expense'].includes(acc.id) && (
                        <button
                          onClick={() => onDelete(acc.id)}
                          className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded text-xs font-bold transition"
                        >
                          حذف
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
