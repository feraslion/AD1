import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Search, 
  Filter, 
  Calendar, 
  DollarSign, 
  Printer, 
  Download, 
  Eye, 
  Scale, 
  RefreshCw, 
  ArrowUpLeft, 
  ArrowDownRight, 
  FileText,
  Building2,
  CheckCircle2,
  Info
} from 'lucide-react';
import { AccountingService } from '../../../services/AccountingService.ts';

interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
  balance: number;
  currency?: string;
  isActive?: boolean;
}

interface LedgerLine {
  id: string;
  journalEntryId: string;
  entryNumber: string;
  description: string;
  date: string;
  currency: string;
  exchangeRate: number;
  debit: number;
  credit: number;
  foreignDebit?: number;
  foreignCredit?: number;
  runningBaseBalance: number;
  runningForeignBalance?: number;
}

interface LedgerResponse {
  account: Account;
  openingBaseBalance: number;
  openingForeignBalance: number;
  lines: LedgerLine[];
  totalDebit: number;
  totalCredit: number;
  totalForeignDebit: number;
  totalForeignCredit: number;
  endingBaseBalance: number;
  endingForeignBalance: number;
}

interface Props {
  accounts: Account[];
  baseCurrency: string;
  onRefreshData: () => void;
}

export const GeneralLedgerManager: React.FC<Props> = ({
  accounts,
  baseCurrency,
  onRefreshData
}) => {
  const [selectedAccountId, setSelectedAccountId] = useState<string>(accounts[0]?.id || '');
  const [accountSearch, setAccountSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currencyFilter, setCurrencyFilter] = useState('ALL');

  const [ledgerData, setLedgerData] = useState<LedgerResponse | null>(null);
  const [loading, setLoading] = useState(false);

  // Modal for Viewing Full Journal Entry Details
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [journalEntryModalData, setJournalEntryModalData] = useState<any | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Update selected account if list changes and none selected
  useEffect(() => {
    if (!selectedAccountId && accounts.length > 0) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts]);

  const fetchLedger = async () => {
    if (!selectedAccountId) return;
    setLoading(true);
    try {
      const res = await AccountingService.getLedger({
        accountId: selectedAccountId,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        currency: currencyFilter !== 'ALL' ? currencyFilter : undefined
      });
      setLedgerData(res);
    } catch (err) {
      console.error('Error fetching general ledger:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, [selectedAccountId, startDate, endDate, currencyFilter]);

  // Open Journal Entry Detail
  const handleOpenEntryDetails = async (entryId: string) => {
    setSelectedEntryId(entryId);
    setModalLoading(true);
    try {
      const data = await AccountingService.getJournalEntryById(entryId);
      setJournalEntryModalData(data);
    } catch (err) {
      alert('فشل جلب تفاصيل القيد المحاسبي');
    } finally {
      setModalLoading(false);
    }
  };

  // Filtered Account Dropdown options
  const filteredAccounts = accounts.filter(a => 
    a.name.toLowerCase().includes(accountSearch.toLowerCase()) ||
    a.code.toLowerCase().includes(accountSearch.toLowerCase())
  );

  // Date Quick Presets
  const setQuickDateRange = (preset: 'today' | 'this_month' | 'this_year' | 'all') => {
    const today = new Date();
    if (preset === 'today') {
      const str = today.toISOString().split('T')[0];
      setStartDate(str);
      setEndDate(str);
    } else if (preset === 'this_month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
      setStartDate(firstDay);
      setEndDate(lastDay);
    } else if (preset === 'this_year') {
      const firstDay = `${today.getFullYear()}-01-01`;
      const lastDay = `${today.getFullYear()}-12-31`;
      setStartDate(firstDay);
      setEndDate(lastDay);
    } else {
      setStartDate('');
      setEndDate('');
    }
  };

  // Print Report Handler
  const handlePrint = () => {
    window.print();
  };

  // Export CSV Handler
  const handleExportCSV = () => {
    if (!ledgerData) return;
    const { account, openingBaseBalance, lines, totalDebit, totalCredit, endingBaseBalance } = ledgerData;

    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    csvContent += `كشف حساب الأستاذ العام - ${account.name} (${account.code})\n`;
    csvContent += `التاريخ,رقم القيد,البيان / الوصف,مدين (${baseCurrency}),دائن (${baseCurrency}),الرصيد المستمر (${baseCurrency})\n`;

    csvContent += `-,الرصيد الافتتاحي,الرصيد المنقول قبل الفترة,-,-,${openingBaseBalance}\n`;

    lines.forEach(l => {
      const descStr = `"${l.description.replace(/"/g, '""')}"`;
      csvContent += `${l.date},${l.entryNumber},${descStr},${l.debit},${l.credit},${l.runningBaseBalance}\n`;
    });

    csvContent += `الإجمالي,-,إجمالي حركات الفترة,${totalDebit},${totalCredit},${endingBaseBalance}\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `General_Ledger_${account.code}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const accountInfo = ledgerData?.account;
  const isDebitAccount = accountInfo?.type === 'asset' || accountInfo?.type === 'expense';

  return (
    <div className="space-y-5 text-right" dir="rtl">
      {/* Print Stylesheet Injection */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-ledger-card, #printable-ledger-card * {
            visibility: visible;
          }
          #printable-ledger-card {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* 1. Header Controls & Filtering Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 no-print">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h3 className="font-black text-slate-900 text-base sm:text-lg flex items-center gap-2">
              <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <BookOpen className="w-5 h-5" />
              </span>
              بطاقة دفتر الأستاذ العام التفاعلية (General Ledger Engine)
            </h3>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">
              استعراض كافة الحركات المعتمدة لكل حساب مالي من اليومية العامة، احتساب الرصيد المنقول المستمر، التفلترة والتصدير الطباعي.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              disabled={!ledgerData}
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>طباعة كشف الحساب</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              disabled={!ledgerData}
              className="px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>تصدير CSV / Excel</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-slate-100 text-xs font-bold">
          {/* Account Selector */}
          <div className="space-y-1">
            <label className="block text-slate-600">اختر الحساب المالي *</label>
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {filteredAccounts.map(acc => (
                <option key={acc.id} value={acc.id}>
                  {acc.code} - {acc.name} ({acc.type === 'asset' ? 'أصول' : acc.type === 'liability' ? 'خصوم' : acc.type === 'equity' ? 'حقوق ملكية' : acc.type === 'revenue' ? 'إيرادات' : 'مصاريف'})
                </option>
              ))}
            </select>
          </div>

          {/* Date From */}
          <div className="space-y-1">
            <label className="block text-slate-600">من تاريخ</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Date To */}
          <div className="space-y-1">
            <label className="block text-slate-600">إلى تاريخ</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Currency Filter */}
          <div className="space-y-1">
            <label className="block text-slate-600">عملة الحركات</label>
            <select
              value={currencyFilter}
              onChange={(e) => setCurrencyFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">جميع العملات</option>
              <option value="SAR">الريال السعودي (SAR)</option>
              <option value="USD">الدولار الأمريكي (USD)</option>
              <option value="SYP">الليرة السورية (SYP)</option>
              <option value="TRY">الليرة التركية (TRY)</option>
            </select>
          </div>
        </div>

        {/* Quick Range Presets */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-slate-400 font-bold ml-1">فترات سريعة:</span>
          <button
            type="button"
            onClick={() => setQuickDateRange('today')}
            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold transition"
          >
            اليوم
          </button>
          <button
            type="button"
            onClick={() => setQuickDateRange('this_month')}
            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold transition"
          >
            هذا الشهر
          </button>
          <button
            type="button"
            onClick={() => setQuickDateRange('this_year')}
            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold transition"
          >
            هذا العام
          </button>
          <button
            type="button"
            onClick={() => setQuickDateRange('all')}
            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold transition"
          >
            جميع الفترات
          </button>
        </div>
      </div>

      {/* 2. Main Ledger Display Container */}
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 font-bold text-sm">
          جاري جلب كشف حساب الأستاذ العام والرصيد التراكمي المستمر...
        </div>
      ) : !ledgerData ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 text-sm">
          يرجى اختيار حساب مالي لعرض كشف الحركة.
        </div>
      ) : (
        <div id="printable-ledger-card" className="space-y-4">
          {/* Printable Watermark Header */}
          <div className="hidden print:block p-6 bg-white border-b border-slate-200 space-y-2">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-xl font-black text-slate-900">كشف حساب الأستاذ العام (General Ledger)</h1>
                <p className="text-xs text-slate-500 font-mono">تاريخ الطباعة: {new Date().toLocaleString('ar-SA')}</p>
              </div>
              <div className="text-left font-mono text-xs">
                <div className="font-bold text-slate-800">{accountInfo?.name}</div>
                <div className="text-slate-500">رمز الحساب: {accountInfo?.code}</div>
              </div>
            </div>
          </div>

          {/* Ledger Account Summary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {/* KPI 1: Account Info */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-slate-500 text-xs font-bold block">اسم رمز الحساب</span>
              <div className="font-black text-slate-900 text-sm truncate">
                {accountInfo?.name}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 bg-slate-100 font-mono font-bold text-slate-700 text-[11px] rounded">
                  {accountInfo?.code}
                </span>
                <span className="text-[11px] text-slate-500 font-bold">
                  {isDebitAccount ? 'حساب طبيعته مدين' : 'حساب طبيعته دائن'}
                </span>
              </div>
            </div>

            {/* KPI 2: Total Debit */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-slate-500 text-xs font-bold block">إجمالي حركات المدين</span>
              <div className="font-mono font-black text-emerald-600 text-base sm:text-lg">
                {ledgerData.totalDebit.toLocaleString('en-US', { minimumFractionDigits: 2 })} {baseCurrency}
              </div>
              <span className="text-[11px] text-slate-400 font-bold block">
                {ledgerData.lines.length} حركات مسجلة
              </span>
            </div>

            {/* KPI 3: Total Credit */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-slate-500 text-xs font-bold block">إجمالي حركات الدائن</span>
              <div className="font-mono font-black text-slate-700 text-base sm:text-lg">
                {ledgerData.totalCredit.toLocaleString('en-US', { minimumFractionDigits: 2 })} {baseCurrency}
              </div>
              <span className="text-[11px] text-slate-400 font-bold block">
                مجموع الدائن المعتمد
              </span>
            </div>

            {/* KPI 4: Ending Running Balance */}
            <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-xs space-y-1">
              <span className="text-slate-400 text-xs font-bold block">الرصيد النهائي الحالي</span>
              <div className="font-mono font-black text-emerald-400 text-base sm:text-lg">
                {ledgerData.endingBaseBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })} {baseCurrency}
              </div>
              <span className="text-[11px] text-slate-400 font-bold block">
                {isDebitAccount 
                  ? (ledgerData.endingBaseBalance >= 0 ? 'رصيد مدين' : 'رصيد دائن بالماينس')
                  : (ledgerData.endingBaseBalance >= 0 ? 'رصيد دائن' : 'رصيد مدين بالماينس')}
              </span>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-800 text-sm">
                  تفاصيل السطور والحركات المعتمدة ({ledgerData.lines.length} حركات)
                </span>
                {startDate && (
                  <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-[11px] font-mono font-bold rounded-lg border border-indigo-100">
                    الفترة من: {startDate} إلى: {endDate || 'الآن'}
                  </span>
                )}
              </div>

              <div className="text-xs text-slate-500 font-mono font-bold">
                الرصيد الافتتاحي قبل الفترة: {ledgerData.openingBaseBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })} {baseCurrency}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/70 border-b border-slate-200 font-bold text-slate-600">
                    <th className="p-3 w-28">التاريخ</th>
                    <th className="p-3 w-32">رقم القيد</th>
                    <th className="p-3">البيان والشرح التوضيحي</th>
                    <th className="p-3 w-28 text-center">العملة والافتراضي</th>
                    <th className="p-3 w-36 text-left">مدين (Debit - {baseCurrency})</th>
                    <th className="p-3 w-36 text-left">دائن (Credit - {baseCurrency})</th>
                    <th className="p-3 w-40 text-left">الرصيد المستمر ({baseCurrency})</th>
                    <th className="p-3 w-16 text-center no-print">عرض</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {/* Opening Balance Row */}
                  <tr className="bg-indigo-50/30 font-bold text-slate-600">
                    <td className="p-3 font-mono">{startDate || '-'}</td>
                    <td className="p-3 font-mono text-slate-400">-</td>
                    <td className="p-3 font-extrabold text-indigo-900">
                      الرصيد المنقول / الافتتاحي قبل الفترة (Opening Balance)
                    </td>
                    <td className="p-3 text-center font-mono text-slate-400">{baseCurrency}</td>
                    <td className="p-3 text-left font-mono text-slate-400">-</td>
                    <td className="p-3 text-left font-mono text-slate-400">-</td>
                    <td className="p-3 text-left font-mono font-black text-slate-900 text-sm">
                      {ledgerData.openingBaseBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })} {baseCurrency}
                    </td>
                    <td className="p-3 text-center no-print">-</td>
                  </tr>

                  {/* Transaction Lines */}
                  {ledgerData.lines.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400 font-bold">
                        لا توجد حركات مسجلة لهذا الحساب خلال الفترة المحددة.
                      </td>
                    </tr>
                  ) : (
                    ledgerData.lines.map(line => (
                      <tr key={line.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-3 font-mono text-slate-500 font-bold">
                          {line.date}
                        </td>
                        <td className="p-3 font-mono">
                          <button
                            type="button"
                            onClick={() => handleOpenEntryDetails(line.journalEntryId)}
                            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-[11px] font-black transition cursor-pointer"
                          >
                            {line.entryNumber}
                          </button>
                        </td>
                        <td className="p-3 font-bold text-slate-800">
                          {line.description}
                        </td>
                        <td className="p-3 text-center font-mono text-[11px] text-slate-500">
                          {line.currency !== baseCurrency ? (
                            <span className="px-1.5 py-0.5 bg-amber-50 text-amber-800 rounded font-bold border border-amber-200">
                              {line.currency} ({line.exchangeRate})
                            </span>
                          ) : (
                            <span>{baseCurrency}</span>
                          )}
                        </td>
                        <td className="p-3 text-left font-mono text-emerald-600 font-black text-sm">
                          {line.debit > 0 ? line.debit.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                        </td>
                        <td className="p-3 text-left font-mono text-slate-500 font-black text-sm">
                          {line.credit > 0 ? line.credit.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                        </td>
                        <td className="p-3 text-left font-mono font-black text-slate-900 text-sm">
                          {line.runningBaseBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })} {baseCurrency}
                        </td>
                        <td className="p-3 text-center no-print">
                          <button
                            type="button"
                            onClick={() => handleOpenEntryDetails(line.journalEntryId)}
                            className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition"
                            title="عرض القيد المحاسبي الكامل"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}

                  {/* Totals & Ending Balance Row */}
                  <tr className="bg-slate-900 text-white font-extrabold text-xs">
                    <td className="p-3.5" colSpan={3}>
                      إجمالي الحركة والرصيد الختامي لحساب ({accountInfo?.name})
                    </td>
                    <td className="p-3.5 text-center font-mono">{baseCurrency}</td>
                    <td className="p-3.5 text-left font-mono text-teal-400 font-black text-sm underline decoration-double">
                      {ledgerData.totalDebit.toLocaleString('en-US', { minimumFractionDigits: 2 })} {baseCurrency}
                    </td>
                    <td className="p-3.5 text-left font-mono text-teal-400 font-black text-sm underline decoration-double">
                      {ledgerData.totalCredit.toLocaleString('en-US', { minimumFractionDigits: 2 })} {baseCurrency}
                    </td>
                    <td className="p-3.5 text-left font-mono text-emerald-400 font-black text-sm underline decoration-double">
                      {ledgerData.endingBaseBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })} {baseCurrency}
                    </td>
                    <td className="p-3.5 text-center no-print">-</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. Modal: Journal Entry Full Details */}
      {selectedEntryId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
            <div className="p-5 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="font-black text-sm flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                تفاصيل القيد المحاسبي المزدوج الكامل
              </h3>
              <button onClick={() => setSelectedEntryId(null)} className="text-slate-400 hover:text-white font-bold">
                ✕
              </button>
            </div>

            {modalLoading ? (
              <div className="p-10 text-center text-slate-400 font-bold text-xs">
                جاري تحميل تفاصيل القيد من محرك المحاسبة...
              </div>
            ) : journalEntryModalData ? (
              <div className="p-6 space-y-4 text-xs">
                {/* Header info */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-wrap justify-between gap-3 font-bold">
                  <div>
                    <span className="text-slate-500 block text-[11px]">رقم القيد:</span>
                    <span className="font-mono text-slate-900 font-black text-sm">{journalEntryModalData.entryNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">التاريخ:</span>
                    <span className="font-mono text-slate-900">{journalEntryModalData.date}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">المرجع:</span>
                    <span className="font-mono text-slate-900">{journalEntryModalData.reference || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">الحالة:</span>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
                      {journalEntryModalData.status === 'posted' ? 'مرحّل أصولاً' : journalEntryModalData.status}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 font-bold block mb-1">البيان / الشرح التفصيلي:</span>
                  <p className="p-3 bg-slate-50 rounded-xl border border-slate-100 font-extrabold text-slate-800">
                    {journalEntryModalData.description}
                  </p>
                </div>

                {/* Lines Table */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="bg-slate-100 font-bold text-slate-600 border-b border-slate-200">
                        <th className="p-2.5">رمز وقيم الحساب</th>
                        <th className="p-2.5 text-left">مدين</th>
                        <th className="p-2.5 text-left">دائن</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                      {journalEntryModalData.lines.map((l: any) => (
                        <tr key={l.id} className="hover:bg-slate-50">
                          <td className="p-2.5 font-bold">
                            <div>{l.accountName}</div>
                            <div className="font-mono text-[10px] text-slate-400">{l.accountCode}</div>
                          </td>
                          <td className="p-2.5 text-left font-mono font-bold text-emerald-600">
                            {l.debit > 0 ? l.debit.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                          </td>
                          <td className="p-2.5 text-left font-mono font-bold text-slate-500">
                            {l.credit > 0 ? l.credit.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end pt-3">
                  <button
                    type="button"
                    onClick={() => setSelectedEntryId(null)}
                    className="px-5 py-2 bg-slate-900 text-white rounded-xl font-bold transition text-xs"
                  >
                    إغلاق التفاصيل
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
