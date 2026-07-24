import React, { useState, useEffect } from 'react';
import { Customer, CustomerLedgerEntry, StoreSettings } from '../../types';
import { CustomerService } from '../../services/api';
import { X, Printer, Download, Calendar, Search, ArrowUpRight, ArrowDownLeft, FileText, Filter, CheckCircle2, AlertTriangle, Building2, Phone, Shield } from 'lucide-react';

interface CustomerLedgerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  settings: StoreSettings;
  onOpenPaymentModal?: (customer: Customer) => void;
}

export default function CustomerLedgerModal({
  isOpen,
  onClose,
  customer,
  settings,
  onOpenPaymentModal
}: CustomerLedgerModalProps) {
  const [ledgerData, setLedgerData] = useState<{
    customer: Customer;
    currentBalance: number;
    totalDebit: number;
    totalCredit: number;
    ledgerLines: CustomerLedgerEntry[];
  } | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    if (isOpen && customer) {
      loadLedger();
    } else {
      setLedgerData(null);
    }
  }, [isOpen, customer]);

  const loadLedger = async () => {
    if (!customer) return;
    setIsLoading(true);
    try {
      const data = await CustomerService.getCustomerLedger(customer.id, startDate, endDate);
      setLedgerData(data);
    } catch (err) {
      console.error('Error fetching customer ledger:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterApply = (e: React.FormEvent) => {
    e.preventDefault();
    loadLedger();
  };

  if (!isOpen || !customer) return null;

  // Filter lines locally by type or search term
  const filteredLines = (ledgerData?.ledgerLines || []).filter(line => {
    const matchesType = typeFilter === 'all' || line.type === typeFilter;
    const matchesSearch = !searchTerm || 
      line.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (line.notes && line.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesType && matchesSearch;
  });

  const handlePrint = () => {
    window.print();
  };

  const currentBal = ledgerData?.currentBalance ?? customer.balance;
  const creditLimit = customer.creditLimit || 5000;
  const isOverLimit = currentBal > creditLimit;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-5xl overflow-hidden flex flex-col max-h-[95vh] print:max-h-none print:shadow-none print:border-none print:rounded-none">
        
        {/* Header - Screen only */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base flex items-center gap-2">
                <span>كشف حساب تفصيلي: {customer.name}</span>
                {customer.taxNumber && (
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md font-mono">
                    الرقم الضريبي: {customer.taxNumber}
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400">سجل حركات المبيعات والمدفوعات والرصيد التراكمي</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenPaymentModal && (
              <button
                onClick={() => {
                  onClose();
                  onOpenPaymentModal(customer);
                }}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow-sm"
              >
                <span>+ سند قبض</span>
              </button>
            )}

            <button
              onClick={handlePrint}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition border border-slate-700"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              <span>طباعة كشف الحساب</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Print Header Logo & Details */}
        <div className="hidden print:block p-6 border-b border-slate-300 text-slate-900">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-black">{settings.name}</h1>
              <p className="text-xs text-slate-600 mt-1">{settings.address}</p>
              <p className="text-xs text-slate-600 font-mono">الرقم الضريبي: {settings.taxNumber}</p>
              <p className="text-xs text-slate-600">الهاتف: {settings.phone}</p>
            </div>

            <div className="text-left">
              <h2 className="text-xl font-bold text-emerald-800">كشف حساب عميل رسمي</h2>
              <p className="text-xs text-slate-600 font-mono mt-1">التاريخ: {new Date().toLocaleDateString('ar-SA')}</p>
            </div>
          </div>

          <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg flex justify-between text-xs">
            <div>
              <p className="font-bold text-sm">العميل: {customer.name}</p>
              <p>رقم الجوال: {customer.phone || 'غير مدخل'}</p>
              {customer.taxNumber && <p className="font-mono">الرقم الضريبي: {customer.taxNumber}</p>}
            </div>
            <div className="text-left font-bold">
              <p className="text-sm">الرصيد المستحق الحالي: {currentBal.toFixed(2)} {settings.currency}</p>
              <p className="text-slate-600 text-[11px]">سقف الائتمان: {creditLimit.toFixed(2)} {settings.currency}</p>
            </div>
          </div>
        </div>

        {/* Customer Quick Stats Strip */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 grid grid-cols-2 md:grid-cols-4 gap-4 print:hidden">
          <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            <span className="text-[11px] text-slate-500 font-bold">الرصيد المستحق (المديونية)</span>
            <div className={`text-base font-extrabold font-mono mt-0.5 ${currentBal > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600'}`}>
              {currentBal.toFixed(2)} <span className="text-xs font-normal">{settings.currency}</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            <span className="text-[11px] text-slate-500 font-bold">سقف الائتمان المسموح</span>
            <div className="text-base font-extrabold font-mono text-amber-600 dark:text-amber-400 mt-0.5">
              {creditLimit.toFixed(2)} <span className="text-xs font-normal">{settings.currency}</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            <span className="text-[11px] text-slate-500 font-bold">إجمالي المبيعات الآجلة (مدين)</span>
            <div className="text-base font-extrabold font-mono text-slate-800 dark:text-slate-200 mt-0.5">
              {(ledgerData?.totalDebit || 0).toFixed(2)} <span className="text-xs font-normal">{settings.currency}</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            <span className="text-[11px] text-slate-500 font-bold">إجمالي المسدد (دائن)</span>
            <div className="text-base font-extrabold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
              {(ledgerData?.totalCredit || 0).toFixed(2)} <span className="text-xs font-normal">{settings.currency}</span>
            </div>
          </div>
        </div>

        {/* Search & Date Filter Bar */}
        <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 print:hidden">
          <form onSubmit={handleFilterApply} className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>من:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent focus:outline-hidden font-mono"
              />
              <span>إلى:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent focus:outline-hidden font-mono"
              />
            </div>

            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
              <Filter className="w-4 h-4 text-slate-400" />
              <span>نوع الحركة:</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-transparent focus:outline-hidden font-bold text-slate-700 dark:text-slate-200"
              >
                <option value="all">الكل</option>
                <option value="sales_invoice">فواتير آجل (مدين)</option>
                <option value="receipt_payment">سندات قبض (دائن)</option>
                <option value="return_invoice">مرتجعات مبيعات (دائن)</option>
              </select>
            </div>

            <div className="flex-1 min-w-[200px] relative">
              <input
                type="text"
                placeholder="بحث برقم المرجع أو الملاحظات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-3 pr-9 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
              <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition"
            >
              تطبيق الفلتر
            </button>
          </form>
        </div>

        {/* Main Ledger Table */}
        <div className="p-6 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="py-20 text-center text-slate-500 text-sm">جاري تحميل بيانات كشف الحساب...</div>
          ) : filteredLines.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              لا توجد حركات مسجلة لهذا العميل بناءً على محددات البحث.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black border-b border-slate-200 dark:border-slate-700">
                    <th className="p-3">#</th>
                    <th className="p-3">التاريخ</th>
                    <th className="p-3">نوع الحركة</th>
                    <th className="p-3">رقم المرجع / الفاتورة</th>
                    <th className="p-3 text-rose-600 dark:text-rose-400">مدين (+)</th>
                    <th className="p-3 text-emerald-600 dark:text-emerald-400">دائن (-)</th>
                    <th className="p-3">الرصيد التراكمي</th>
                    <th className="p-3">الملاحظات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {filteredLines.map((line, idx) => {
                    const isDebit = line.debit > 0;
                    const isCredit = line.credit > 0;

                    return (
                      <tr key={line.id || idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                        <td className="p-3 text-slate-400 font-mono">{idx + 1}</td>
                        <td className="p-3 font-mono font-bold">{line.date}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                            line.type === 'sales_invoice' 
                              ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300' 
                              : line.type === 'receipt_payment'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                              : 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                          }`}>
                            {line.typeLabel || line.type}
                          </span>
                        </td>
                        <td className="p-3 font-mono font-bold text-slate-800 dark:text-slate-200">{line.reference}</td>
                        <td className="p-3 font-mono font-extrabold text-rose-600 dark:text-rose-400">
                          {isDebit ? line.debit.toFixed(2) : '-'}
                        </td>
                        <td className="p-3 font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                          {isCredit ? line.credit.toFixed(2) : '-'}
                        </td>
                        <td className="p-3 font-mono font-black text-slate-900 dark:text-slate-100">
                          {line.runningBalance.toFixed(2)} {settings.currency}
                        </td>
                        <td className="p-3 text-slate-500 dark:text-slate-400 max-w-xs truncate">{line.notes || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-900 text-white font-extrabold border-t-2 border-slate-700">
                    <td colSpan={4} className="p-3 text-left">إجمالي كشف الحساب للفترة المحدد:</td>
                    <td className="p-3 font-mono text-rose-400 font-black">
                      {filteredLines.reduce((acc, c) => acc + c.debit, 0).toFixed(2)}
                    </td>
                    <td className="p-3 font-mono text-emerald-400 font-black">
                      {filteredLines.reduce((acc, c) => acc + c.credit, 0).toFixed(2)}
                    </td>
                    <td className="p-3 font-mono text-amber-300 font-black" colSpan={2}>
                      الرصيد المستحق النهائي: {currentBal.toFixed(2)} {settings.currency}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* Statement Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs print:block print:bg-transparent">
          <div className="text-slate-500 font-medium">
            تاريخ استخراج كشف الحساب: <span className="font-mono font-bold">{new Date().toLocaleString('ar-SA')}</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition print:hidden"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}
