import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Printer, 
  Download, 
  Scale, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownLeft, 
  DollarSign, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar, 
  Filter, 
  RefreshCw,
  PieChart,
  Building2,
  Wallet
} from 'lucide-react';
import { ReportService } from '../../../core/api/api.ts';

interface Props {
  activeStatement?: 'trial' | 'income' | 'balance' | 'cashflow';
  baseCurrency?: string;
  onRefreshData?: () => void;
}

export const FinancialStatementsManager: React.FC<Props> = ({
  activeStatement = 'trial',
  baseCurrency = 'SAR',
  onRefreshData
}) => {
  const [currentTab, setCurrentTab] = useState<'trial' | 'income' | 'balance' | 'cashflow'>(activeStatement);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currencyFilter, setCurrencyFilter] = useState('ALL');

  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setCurrentTab(activeStatement);
  }, [activeStatement]);

  const fetchStatements = async () => {
    setLoading(true);
    try {
      const res = await ReportService.getFinancialStatements({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        currency: currencyFilter !== 'ALL' ? currencyFilter : undefined
      });
      setData(res);
    } catch (err) {
      console.error('Error fetching financial statements:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatements();
  }, [startDate, endDate, currencyFilter]);

  const setQuickPreset = (preset: 'today' | 'this_month' | 'this_year' | 'all') => {
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
      setStartDate(`${today.getFullYear()}-01-01`);
      setEndDate(`${today.getFullYear()}-12-31`);
    } else {
      setStartDate('');
      setEndDate('');
    }
  };

  const formatAmount = (val: number) => {
    return (val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!data) return;
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";

    if (currentTab === 'trial') {
      csvContent += `ميزان المراجعة المحاسبي (Trial Balance)\n`;
      csvContent += `رمز الحساب,اسم الحساب,نوع الحساب,مدين للفترة,دائن للفترة,الرصيد الصافي\n`;
      data.trialBalance.accounts.forEach((acc: any) => {
        csvContent += `${acc.code},"${acc.name}",${acc.type},${acc.periodDebit},${acc.periodCredit},${acc.netBalance}\n`;
      });
      csvContent += `الإجمالي,-,-,${data.trialBalance.totalDebit},${data.trialBalance.totalCredit},${data.trialBalance.isBalanced ? 'متزن' : 'غير متزن'}\n`;
    } else if (currentTab === 'income') {
      csvContent += `قائمة الدخل - الأرباح والخسائر (Income Statement)\n`;
      csvContent += `الإيرادات (Revenues),${data.incomeStatement.totalRevenues}\n`;
      csvContent += `تكلفة البضاعة المباعة (COGS),${data.incomeStatement.totalCOGS}\n`;
      csvContent += `مجمل الربح (Gross Profit),${data.incomeStatement.grossProfit}\n`;
      csvContent += `المصروفات التشغيلية (Operating Expenses),${data.incomeStatement.totalExpenses}\n`;
      csvContent += `صافي الربح (Net Profit),${data.incomeStatement.netProfit}\n`;
    } else if (currentTab === 'balance') {
      csvContent += `الميزانية العمومية (Balance Sheet)\n`;
      csvContent += `إجمالي الأصول (Assets),${data.balanceSheet.totalAssets}\n`;
      csvContent += `إجمالي الخصوم (Liabilities),${data.balanceSheet.totalLiabilities}\n`;
      csvContent += `حقوق الملكية والأرباح (Equity),${data.balanceSheet.totalEquity}\n`;
      csvContent += `معادلة الميزانية, الأصول = الخصوم + حقوق الملكية (${data.balanceSheet.equation.isBalanced ? 'متزنة' : 'غير متزنة'})\n`;
    } else {
      csvContent += `قائمة التدفقات النقدية (Cash Flow Statement)\n`;
      csvContent += `تدفقات الأنشطة التشغيلية,${data.cashFlowStatement.operating.net}\n`;
      csvContent += `تدفقات الأنشطة الاستثمارية,${data.cashFlowStatement.investing.net}\n`;
      csvContent += `تدفقات الأنشطة التمويلية,${data.cashFlowStatement.financing.net}\n`;
      csvContent += `صافي التغير في النقدية,${data.cashFlowStatement.netCashFlow}\n`;
      csvContent += `رصيد النقدية في نهاية الفترة,${data.cashFlowStatement.endingCashBalance}\n`;
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Financial_Statement_${currentTab}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Print Stylesheet */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-financial-statement, #printable-financial-statement * {
            visibility: visible;
          }
          #printable-financial-statement {
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

      {/* 1. Header Navigation & Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 no-print">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h3 className="font-black text-slate-900 text-base sm:text-lg flex items-center gap-2">
              <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <FileSpreadsheet className="w-5 h-5" />
              </span>
              محرك القوائم المالية والتقارير المحاسبية الختامية
            </h3>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">
              توليد القوائم المالية الأربعة المعتمدة (ميزان المراجعة، قائمة الدخل، الميزانية العمومية، التدفقات النقدية) مع التحقق التلقائي من معادلة الميزانية.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              disabled={!data}
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>طباعة القائمة</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              disabled={!data}
              className="px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>تصدير CSV / Excel</span>
            </button>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-3">
          <button
            type="button"
            onClick={() => setCurrentTab('trial')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition ${
              currentTab === 'trial'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>ميزان المراجعة (Trial Balance)</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentTab('income')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition ${
              currentTab === 'income'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>قائمة الدخل (Income Statement)</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentTab('balance')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition ${
              currentTab === 'balance'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>الميزانية العمومية (Balance Sheet)</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentTab('cashflow')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition ${
              currentTab === 'cashflow'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>التدفقات النقدية (Cash Flow)</span>
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-bold pt-1">
          <div className="space-y-1">
            <label className="block text-slate-600">من تاريخ</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-slate-600">إلى تاريخ</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-slate-600">عملة التقرير</label>
            <select
              value={currencyFilter}
              onChange={(e) => setCurrencyFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="ALL">جميع العملات (مجمعة بالريال {baseCurrency})</option>
              <option value="SAR">الريال السعودي (SAR)</option>
              <option value="USD">الدولار الأمريكي (USD)</option>
              <option value="SYP">الليرة السورية (SYP)</option>
              <option value="TRY">الليرة التركية (TRY)</option>
            </select>
          </div>
        </div>

        {/* Date Presets */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 font-bold ml-1">تصفية سريعة:</span>
          <button
            type="button"
            onClick={() => setQuickPreset('today')}
            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold transition"
          >
            اليوم
          </button>
          <button
            type="button"
            onClick={() => setQuickPreset('this_month')}
            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold transition"
          >
            هذا الشهر
          </button>
          <button
            type="button"
            onClick={() => setQuickPreset('this_year')}
            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold transition"
          >
            هذا العام
          </button>
          <button
            type="button"
            onClick={() => setQuickPreset('all')}
            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold transition"
          >
            الكلي
          </button>
        </div>
      </div>

      {/* 2. Main Content Card */}
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 font-bold text-sm">
          جاري توليد واحتساب أرقام القوائم المالية بدقة محاسبية متناهية...
        </div>
      ) : !data ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 font-bold text-sm">
          لا توجد بيانات متاحة لعرض القائمة المالية.
        </div>
      ) : (
        <div id="printable-financial-statement" className="space-y-5">
          {/* Statement Printable Header */}
          <div className="hidden print:block p-6 bg-white border-b border-slate-200 space-y-1 text-center">
            <h1 className="text-xl font-black text-slate-900">
              {currentTab === 'trial' ? 'ميزان المراجعة المحاسبي (Trial Balance)' :
               currentTab === 'income' ? 'قائمة الدخل - الأرباح والخسائر (Income Statement)' :
               currentTab === 'balance' ? 'الميزانية العمومية (Balance Sheet)' : 'قائمة التدفقات النقدية (Cash Flow Statement)'}
            </h1>
            <p className="text-xs text-slate-500 font-mono">
              تاريخ الطباعة: {new Date().toLocaleString('ar-SA')} | العملة: {baseCurrency}
            </p>
          </div>

          {/* TAB 1: TRIAL BALANCE */}
          {currentTab === 'trial' && (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs space-y-4 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">
                    ميزان المراجعة المزدوج بالأرصدة والحركات
                  </h4>
                  <p className="text-slate-500 text-xs">
                    مطابقة إجمالي المدين والدائن لضمان توازن دفتر اليومية العامة.
                  </p>
                </div>

                <div className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 border ${
                  data.trialBalance.isBalanced
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}>
                  {data.trialBalance.isBalanced ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>ميزان المراجعة متزن تماماً 🟢</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      <span>يوجد عدم اتزان في ميزان المراجعة 🔴</span>
                    </>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100/80 font-bold text-slate-700 border-b border-slate-200">
                      <th className="p-3 w-28">رمز الحساب</th>
                      <th className="p-3">اسم الحساب</th>
                      <th className="p-3 w-28 text-center">نوع الحساب</th>
                      <th className="p-3 w-32 text-left">مدين الفترة ({baseCurrency})</th>
                      <th className="p-3 w-32 text-left">دائن الفترة ({baseCurrency})</th>
                      <th className="p-3 w-36 text-left">الرصيد الصافي الحالي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {data.trialBalance.accounts.map((acc: any) => (
                      <tr key={acc.id} className="hover:bg-slate-50 transition">
                        <td className="p-3 font-mono font-bold text-slate-900">{acc.code}</td>
                        <td className="p-3 font-bold text-slate-800">{acc.name}</td>
                        <td className="p-3 text-center text-slate-500 font-bold">
                          {acc.type === 'asset' ? 'أصول' : acc.type === 'liability' ? 'خصوم' : acc.type === 'equity' ? 'حقوق ملكية' : acc.type === 'revenue' ? 'إيرادات' : 'مصاريف'}
                        </td>
                        <td className="p-3 text-left font-mono font-bold text-emerald-600">
                          {acc.periodDebit > 0 ? formatAmount(acc.periodDebit) : '-'}
                        </td>
                        <td className="p-3 text-left font-mono font-bold text-slate-600">
                          {acc.periodCredit > 0 ? formatAmount(acc.periodCredit) : '-'}
                        </td>
                        <td className="p-3 text-left font-mono font-black text-slate-900">
                          {formatAmount(acc.netBalance)} {baseCurrency}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-900 text-white font-extrabold text-xs">
                      <td colSpan={3} className="p-3.5">الإجمالي المحاسبي المترتب:</td>
                      <td className="p-3.5 text-left font-mono text-teal-300 text-sm font-black underline decoration-double">
                        {formatAmount(data.trialBalance.totalDebit)}
                      </td>
                      <td className="p-3.5 text-left font-mono text-teal-300 text-sm font-black underline decoration-double">
                        {formatAmount(data.trialBalance.totalCredit)}
                      </td>
                      <td className="p-3.5 text-left font-mono text-emerald-400 text-sm font-black">
                        {data.trialBalance.isBalanced ? 'متزن 🟢' : 'غير متزن 🔴'}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: INCOME STATEMENT */}
          {currentTab === 'income' && (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs p-6 space-y-6">
              <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                <div>
                  <h4 className="font-black text-slate-900 text-base">
                    قائمة الدخل والأرباح والخسائر (Income Statement)
                  </h4>
                  <p className="text-slate-500 text-xs">
                    قياس أداء المنشأة التجاري، صافي الربح التشغيلي، ومعدل الربحية عن الفترة.
                  </p>
                </div>
                <div className="px-4 py-2 bg-slate-900 text-emerald-400 rounded-xl font-mono font-black text-base">
                  صافي الربح: {formatAmount(data.incomeStatement.netProfit)} {baseCurrency}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4 text-xs sm:text-sm">
                  {/* 1. Revenues */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex justify-between items-center font-black text-slate-900 border-b border-slate-200 pb-2">
                      <span>1. إجمالي الإيرادات والمبيعات (Revenues)</span>
                      <span className="font-mono text-emerald-700 text-base">
                        +{formatAmount(data.incomeStatement.totalRevenues)} {baseCurrency}
                      </span>
                    </div>
                    {data.incomeStatement.revenues.map((r: any) => (
                      <div key={r.id} className="flex justify-between items-center text-slate-600 text-xs pr-3">
                        <span>{r.name} ({r.code})</span>
                        <span className="font-mono font-bold text-slate-800">
                          {formatAmount(r.periodCredit - r.periodDebit)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* 2. COGS */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex justify-between items-center font-black text-slate-900 border-b border-slate-200 pb-2">
                      <span>2. تكلفة البضاعة والخدمات المباعة (COGS)</span>
                      <span className="font-mono text-rose-600 text-base">
                        -{formatAmount(data.incomeStatement.totalCOGS)} {baseCurrency}
                      </span>
                    </div>
                    {data.incomeStatement.cogsAccounts.map((c: any) => (
                      <div key={c.id} className="flex justify-between items-center text-slate-600 text-xs pr-3">
                        <span>{c.name} ({c.code})</span>
                        <span className="font-mono font-bold text-slate-800">
                          {formatAmount(c.periodDebit - c.periodCredit)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Gross Profit Summary */}
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex justify-between items-center font-black text-emerald-900 text-sm">
                    <span>إجمالي مجمل الربح (Gross Profit) =</span>
                    <span className="font-mono text-lg text-emerald-800">
                      {formatAmount(data.incomeStatement.grossProfit)} {baseCurrency}
                    </span>
                  </div>

                  {/* 3. Operating Expenses */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex justify-between items-center font-black text-slate-900 border-b border-slate-200 pb-2">
                      <span>3. المصاريف والنفقات التشغيلية والعمومية</span>
                      <span className="font-mono text-rose-600 text-base">
                        -{formatAmount(data.incomeStatement.totalExpenses)} {baseCurrency}
                      </span>
                    </div>
                    {data.incomeStatement.operatingExpenses.map((e: any) => (
                      <div key={e.id} className="flex justify-between items-center text-slate-600 text-xs pr-3">
                        <span>{e.name} ({e.code})</span>
                        <span className="font-mono font-bold text-slate-800">
                          {formatAmount(e.periodDebit - e.periodCredit)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Net Profit Final */}
                  <div className="p-5 bg-slate-900 text-white rounded-2xl flex justify-between items-center font-black text-base shadow-md">
                    <span>صافي أرباح (خسائر) النشاط النهائية (Net Profit)</span>
                    <span className="font-mono text-2xl text-emerald-400">
                      {formatAmount(data.incomeStatement.netProfit)} {baseCurrency}
                    </span>
                  </div>
                </div>

                {/* Profit Gauge Card */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col justify-center items-center text-center space-y-4">
                  <h5 className="font-black text-slate-800 text-sm">نسبة هامش الربحية (Margin)</h5>
                  <div className="w-36 h-36 rounded-full border-8 border-emerald-500 bg-white flex flex-col items-center justify-center shadow-inner">
                    <span className="font-mono font-black text-2xl text-slate-900">
                      {data.incomeStatement.profitMargin.toFixed(1)}%
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold mt-1">هامش الأرباح</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed font-bold">
                    مؤشر يقيس قدرة النشاط على توليد أرباح صافية مقابل كل ريال مبيعات محقق.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BALANCE SHEET & ACCOUNTING EQUATION */}
          {currentTab === 'balance' && (
            <div className="space-y-5">
              {/* Accounting Equation Verification Banner */}
              <div className={`p-5 rounded-2xl border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                data.balanceSheet.equation.isBalanced
                  ? 'bg-emerald-900 text-white border-emerald-800'
                  : 'bg-rose-900 text-white border-rose-800'
              }`}>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 font-black text-sm sm:text-base">
                    <Scale className="w-5 h-5 text-emerald-400" />
                    <span>التحقق من معادلة الميزانية العمومية الأساسية (The Accounting Equation)</span>
                  </div>
                  <p className="text-xs text-slate-300 font-mono">
                    الأصول ({formatAmount(data.balanceSheet.totalAssets)}) = الخصوم ({formatAmount(data.balanceSheet.totalLiabilities)}) + حقوق الملكية والأرباح ({formatAmount(data.balanceSheet.totalEquity)})
                  </p>
                </div>

                <div className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 ${
                  data.balanceSheet.equation.isBalanced ? 'bg-emerald-500 text-slate-950' : 'bg-rose-500 text-white'
                }`}>
                  {data.balanceSheet.equation.isBalanced ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>المعادلة متزنة بنجاح 🟢 (الفرق: 0.00)</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4" />
                      <span>يوجد عدم اتزان 🔴 (الفرق: {formatAmount(data.balanceSheet.equation.difference)})</span>
                    </>
                  )}
                </div>
              </div>

              {/* Balance Sheet Columns */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Assets Column */}
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs space-y-3 p-5">
                  <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 flex justify-between items-center font-black text-blue-900 text-sm">
                    <span>1. جانب الأصول (Assets)</span>
                    <span className="font-mono text-base">{formatAmount(data.balanceSheet.totalAssets)} {baseCurrency}</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    {data.balanceSheet.assets.map((a: any) => (
                      <div key={a.id} className="flex justify-between items-center pb-2 border-b border-slate-100 font-bold text-slate-700">
                        <span>{a.name} ({a.code})</span>
                        <span className="font-mono text-slate-900">{formatAmount(a.currentBalance || a.netBalance)} {baseCurrency}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Liabilities & Equity Column */}
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs space-y-3 p-5">
                  <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100 flex justify-between items-center font-black text-purple-900 text-sm">
                    <span>2. الخصوم وحقوق الملكية (Liabilities & Equity)</span>
                    <span className="font-mono text-base">{formatAmount(data.balanceSheet.totalLiabilities + data.balanceSheet.totalEquity)} {baseCurrency}</span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="font-extrabold text-slate-900 border-b border-slate-200 pb-1">أولاً: الخصوم والالتزامات</div>
                    {data.balanceSheet.liabilities.map((l: any) => (
                      <div key={l.id} className="flex justify-between items-center pb-1 border-b border-slate-100 text-slate-700 font-bold">
                        <span>{l.name} ({l.code})</span>
                        <span className="font-mono">{formatAmount(l.currentBalance || l.netBalance)}</span>
                      </div>
                    ))}

                    <div className="font-extrabold text-slate-900 border-b border-slate-200 pb-1 pt-2">ثانياً: حقوق الملكية والأرباح</div>
                    {data.balanceSheet.equity.map((e: any) => (
                      <div key={e.id} className="flex justify-between items-center pb-1 border-b border-slate-100 text-slate-700 font-bold">
                        <span>{e.name} ({e.code})</span>
                        <span className="font-mono">{formatAmount(e.currentBalance || e.netBalance)}</span>
                      </div>
                    ))}

                    <div className="flex justify-between items-center pb-1 text-emerald-700 font-black bg-emerald-50 p-2 rounded-lg">
                      <span>أرباح الفترة الحالية المنقولة من قائمة الدخل</span>
                      <span className="font-mono">+{formatAmount(data.balanceSheet.netProfit)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CASH FLOW STATEMENT */}
          {currentTab === 'cashflow' && (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs p-6 space-y-6">
              <div>
                <h4 className="font-black text-slate-900 text-base">
                  قائمة التدفقات النقدية (Cash Flow Statement)
                </h4>
                <p className="text-slate-500 text-xs">
                  تتبع المقبوضات والمدفوعات النقدية الفعلية عبر الأنشطة التشغيلية، الاستثمارية، والتمويلية.
                </p>
              </div>

              <div className="space-y-4 text-xs sm:text-sm">
                {/* 1. Operating */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <h5 className="font-black text-slate-900 border-b border-slate-200 pb-2 text-xs">
                    1. التدفقات النقدية من الأنشطة التشغيلية (Operating Activities)
                  </h5>
                  <div className="flex justify-between items-center text-slate-700">
                    <span>النقدية المقبوضة (Inflows)</span>
                    <span className="font-mono font-bold text-emerald-600">+{formatAmount(data.cashFlowStatement.operating.inflows)}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-700">
                    <span>النقدية المدفوعة (Outflows)</span>
                    <span className="font-mono font-bold text-rose-600">-{formatAmount(data.cashFlowStatement.operating.outflows)}</span>
                  </div>
                  <div className="flex justify-between items-center font-black text-slate-900 border-t border-slate-200 pt-2">
                    <span>صافي النقد من الأنشطة التشغيلية =</span>
                    <span className="font-mono text-base">{formatAmount(data.cashFlowStatement.operating.net)} {baseCurrency}</span>
                  </div>
                </div>

                {/* 2. Investing */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <h5 className="font-black text-slate-900 border-b border-slate-200 pb-2 text-xs">
                    2. التدفقات النقدية من الأنشطة الاستثمارية (Investing Activities)
                  </h5>
                  <div className="flex justify-between items-center font-black text-slate-900">
                    <span>صافي النقد من الأنشطة الاستثمارية =</span>
                    <span className="font-mono text-base">{formatAmount(data.cashFlowStatement.investing.net)} {baseCurrency}</span>
                  </div>
                </div>

                {/* 3. Financing */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <h5 className="font-black text-slate-900 border-b border-slate-200 pb-2 text-xs">
                    3. التدفقات النقدية من الأنشطة التمويلية (Financing Activities)
                  </h5>
                  <div className="flex justify-between items-center font-black text-slate-900">
                    <span>صافي النقد من الأنشطة التمويلية =</span>
                    <span className="font-mono text-base">{formatAmount(data.cashFlowStatement.financing.net)} {baseCurrency}</span>
                  </div>
                </div>

                {/* Summary */}
                <div className="p-5 bg-slate-900 text-white rounded-2xl space-y-3 shadow-md">
                  <div className="flex justify-between items-center font-extrabold text-xs">
                    <span>رصيد النقدية في بداية الفترة:</span>
                    <span className="font-mono text-slate-300 text-sm">{formatAmount(data.cashFlowStatement.beginningCashBalance)} {baseCurrency}</span>
                  </div>
                  <div className="flex justify-between items-center font-extrabold text-xs">
                    <span>صافي التغير النقدي خلال الفترة:</span>
                    <span className="font-mono text-emerald-400 text-sm">{formatAmount(data.cashFlowStatement.netCashFlow)} {baseCurrency}</span>
                  </div>
                  <div className="flex justify-between items-center font-black text-sm pt-2 border-t border-slate-800">
                    <span>رصيد النقدية وما يعادلها في نهاية الفترة (الخزائن والبنوك):</span>
                    <span className="font-mono text-2xl text-emerald-400">{formatAmount(data.cashFlowStatement.endingCashBalance)} {baseCurrency}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
