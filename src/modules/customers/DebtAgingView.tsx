import React, { useState, useEffect } from 'react';
import { DebtAgingItem, StoreSettings, Customer } from '../../types';
import { CustomerService } from '../../services/api';
import { AlertCircle, Clock, DollarSign, ShieldAlert, CheckCircle2, Search, Filter, RefreshCw, FileText } from 'lucide-react';

interface DebtAgingViewProps {
  settings: StoreSettings;
  onOpenLedger: (customer: Customer) => void;
  onOpenPayment: (customer: Customer) => void;
}

export default function DebtAgingView({ settings, onOpenLedger, onOpenPayment }: DebtAgingViewProps) {
  const [agingData, setAgingData] = useState<DebtAgingItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadAging();
  }, []);

  const loadAging = async () => {
    setIsLoading(true);
    try {
      const list = await CustomerService.getDebtAging();
      setAgingData(list || []);
    } catch (err) {
      console.error('Error fetching debt aging:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredItems = agingData.filter(item => {
    const matchesSearch = !searchTerm || 
      item.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.phone.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const grandTotalDebt = agingData.reduce((acc, i) => acc + i.totalBalance, 0);
  const total0To30 = agingData.reduce((acc, i) => acc + i.current0To30, 0);
  const total31To60 = agingData.reduce((acc, i) => acc + i.days31To60, 0);
  const total61To90 = agingData.reduce((acc, i) => acc + i.days61To90, 0);
  const totalOver90 = agingData.reduce((acc, i) => acc + i.daysOver90, 0);

  return (
    <div className="space-y-6 text-xs">
      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[11px] text-slate-500 font-bold block mb-1">إجمالي الديون المستحقة</span>
          <div className="text-lg font-black font-mono text-slate-900 dark:text-slate-100">
            {grandTotalDebt.toFixed(2)} <span className="text-xs font-normal">{settings.currency}</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">لجميع العملاء المدينين</span>
        </div>

        <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 shadow-2xs">
          <span className="text-[11px] text-emerald-800 dark:text-emerald-300 font-bold block mb-1">حديثة (0 - 30 يوم)</span>
          <div className="text-lg font-black font-mono text-emerald-700 dark:text-emerald-400">
            {total0To30.toFixed(2)} <span className="text-xs font-normal">{settings.currency}</span>
          </div>
          <span className="text-[10px] text-emerald-600/80 mt-1 block">
            {grandTotalDebt > 0 ? ((total0To30 / grandTotalDebt) * 100).toFixed(1) : 0}% من الديون
          </span>
        </div>

        <div className="bg-blue-50/50 dark:bg-blue-950/20 p-4 rounded-2xl border border-blue-200 dark:border-blue-900/50 shadow-2xs">
          <span className="text-[11px] text-blue-800 dark:text-blue-300 font-bold block mb-1">مستحقة (31 - 60 يوم)</span>
          <div className="text-lg font-black font-mono text-blue-700 dark:text-blue-400">
            {total31To60.toFixed(2)} <span className="text-xs font-normal">{settings.currency}</span>
          </div>
          <span className="text-[10px] text-blue-600/80 mt-1 block">تتطلب متابعة سريعة</span>
        </div>

        <div className="bg-amber-50/50 dark:bg-amber-950/20 p-4 rounded-2xl border border-amber-200 dark:border-amber-900/50 shadow-2xs">
          <span className="text-[11px] text-amber-800 dark:text-amber-300 font-bold block mb-1">متأخرة (61 - 90 يوم)</span>
          <div className="text-lg font-black font-mono text-amber-700 dark:text-amber-400">
            {total61To90.toFixed(2)} <span className="text-xs font-normal">{settings.currency}</span>
          </div>
          <span className="text-[10px] text-amber-600/80 mt-1 block">مخاطر متوسطة التحصيل</span>
        </div>

        <div className="bg-rose-50/50 dark:bg-rose-950/20 p-4 rounded-2xl border border-rose-200 dark:border-rose-900/50 shadow-2xs">
          <span className="text-[11px] text-rose-800 dark:text-rose-300 font-bold block mb-1">عالية الخطورة (+90 يوم)</span>
          <div className="text-lg font-black font-mono text-rose-700 dark:text-rose-400">
            {totalOver90.toFixed(2)} <span className="text-xs font-normal">{settings.currency}</span>
          </div>
          <span className="text-[10px] text-rose-600/80 mt-1 block">تتطلب إجراء حظر أو إخطار</span>
        </div>
      </div>

      {/* Filter and Refresh Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="بحث باسم العميل أو رقم الجوال..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-3 pr-9 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
            <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
          </div>

          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent focus:outline-hidden font-bold"
            >
              <option value="all">جميع مستويات المديونية</option>
              <option value="exceeded">متجاوز لسقف الائتمان 🔴</option>
              <option value="warning">قريب من السقف (80%+) 🟠</option>
              <option value="safe">ضمن الحدود الآمنة 🟢</option>
            </select>
          </div>
        </div>

        <button
          onClick={loadAging}
          className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl flex items-center gap-2 transition"
        >
          <RefreshCw className="w-4 h-4 text-emerald-500" />
          <span>تحديث التقرير</span>
        </button>
      </div>

      {/* Main Aging Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
        {isLoading ? (
          <div className="py-20 text-center text-slate-500">جاري تحليل أعمار ديون العملاء...</div>
        ) : filteredItems.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            لا توجد ديون مطابقة للمحددات حالياً. جميع حسابات العملاء المحددة منتظمة.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-black border-b border-slate-200 dark:border-slate-700">
                  <th className="p-3">اسم العميل</th>
                  <th className="p-3">سقف الائتمان</th>
                  <th className="p-3">إجمالي المديونية</th>
                  <th className="p-3 text-emerald-600">0 - 30 يوم</th>
                  <th className="p-3 text-blue-600">31 - 60 يوم</th>
                  <th className="p-3 text-amber-600">61 - 90 يوم</th>
                  <th className="p-3 text-rose-600">+90 يوم</th>
                  <th className="p-3">الحالة الائتمانية</th>
                  <th className="p-3 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredItems.map(item => {
                  const customerObj: Customer = {
                    id: item.customerId,
                    name: item.customerName,
                    phone: item.phone,
                    balance: item.totalBalance,
                    creditLimit: item.creditLimit
                  };

                  return (
                    <tr key={item.customerId} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                      <td className="p-3">
                        <p className="font-extrabold text-slate-900 dark:text-slate-100">{item.customerName}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{item.phone}</p>
                      </td>
                      <td className="p-3 font-mono text-slate-600 dark:text-slate-400">
                        {item.creditLimit.toFixed(2)} {settings.currency}
                      </td>
                      <td className="p-3 font-mono font-black text-rose-600 dark:text-rose-400 text-sm">
                        {item.totalBalance.toFixed(2)} {settings.currency}
                      </td>
                      <td className="p-3 font-mono font-bold text-emerald-600">
                        {item.current0To30 > 0 ? item.current0To30.toFixed(2) : '-'}
                      </td>
                      <td className="p-3 font-mono font-bold text-blue-600">
                        {item.days31To60 > 0 ? item.days31To60.toFixed(2) : '-'}
                      </td>
                      <td className="p-3 font-mono font-bold text-amber-600">
                        {item.days61To90 > 0 ? item.days61To90.toFixed(2) : '-'}
                      </td>
                      <td className="p-3 font-mono font-black text-rose-600 bg-rose-50/30 dark:bg-rose-950/20">
                        {item.daysOver90 > 0 ? item.daysOver90.toFixed(2) : '-'}
                      </td>
                      <td className="p-3">
                        {item.status === 'exceeded' ? (
                          <span className="px-2 py-0.5 bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 rounded-md text-[10px] font-extrabold flex items-center gap-1 w-fit">
                            <ShieldAlert className="w-3 h-3 text-rose-600" />
                            متجاوز للسقف!
                          </span>
                        ) : item.status === 'warning' ? (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 rounded-md text-[10px] font-extrabold flex items-center gap-1 w-fit">
                            <AlertCircle className="w-3 h-3 text-amber-600" />
                            قريب من السقف
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded-md text-[10px] font-extrabold flex items-center gap-1 w-fit">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            حدود آمنة
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => onOpenPayment(customerObj)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] transition shadow-2xs"
                          >
                            + سند قبض
                          </button>
                          <button
                            onClick={() => onOpenLedger(customerObj)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-bold text-[11px] transition"
                          >
                            كشف الحساب
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
