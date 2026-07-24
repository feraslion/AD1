import React, { useState, useEffect } from 'react';
import { Customer, Invoice, StoreSettings } from '../../types';
import { InvoiceService } from '../../services/api';
import { X, ShoppingBag, Clock, FileText, CheckCircle, AlertCircle, DollarSign, Package } from 'lucide-react';

interface CustomerHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  settings: StoreSettings;
}

export default function CustomerHistoryModal({
  isOpen,
  onClose,
  customer,
  settings
}: CustomerHistoryModalProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (isOpen && customer) {
      loadHistory();
    }
  }, [isOpen, customer]);

  const loadHistory = async () => {
    if (!customer) return;
    setIsLoading(true);
    try {
      const list = await InvoiceService.getInvoices({ customerId: customer.id });
      setInvoices(list || []);
    } catch (err) {
      console.error('Error fetching customer invoice history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !customer) return null;

  const totalInvoicesCount = invoices.length;
  const totalSpent = invoices.reduce((acc, i) => acc + (i.grandTotal || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base">تاريخ تعاملات ومبيعات العميل: {customer.name}</h3>
              <p className="text-xs text-slate-400">سجل الفواتير والمشتريات السابقة والمبالغ المدفوعة</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Metrics */}
        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 grid grid-cols-3 gap-4 text-xs">
          <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-slate-500 font-bold block">عدد الفواتير الإجمالي</span>
            <span className="text-base font-black font-mono mt-1 text-slate-900 dark:text-slate-100">{totalInvoicesCount} فاتورة</span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-slate-500 font-bold block">إجمالي قيمة المشتريات</span>
            <span className="text-base font-black font-mono mt-1 text-emerald-600">
              {totalSpent.toFixed(2)} {settings.currency}
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-slate-500 font-bold block">الرصيد المتبقي حالياً</span>
            <span className="text-base font-black font-mono mt-1 text-rose-600">
              {customer.balance.toFixed(2)} {settings.currency}
            </span>
          </div>
        </div>

        {/* Invoices List */}
        <div className="p-6 overflow-y-auto flex-1 text-xs">
          {isLoading ? (
            <div className="py-16 text-center text-slate-500">جاري جلب سجل فواتير العميل...</div>
          ) : invoices.length === 0 ? (
            <div className="py-16 text-center text-slate-400">لا توجد فواتير سابقة لهذا العميل.</div>
          ) : (
            <div className="space-y-3">
              {invoices.map((inv) => (
                <div
                  key={inv.id}
                  className="p-4 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-wrap justify-between items-center gap-3 hover:border-emerald-500/50 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg">
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                        فاتورة #{inv.invoiceNumber}
                      </p>
                      <p className="text-slate-400 font-mono text-[11px] mt-0.5">
                        التاريخ: {inv.date ? inv.date.split('T')[0] : 'غير حدد'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-left">
                      <span className="font-mono font-black text-sm text-slate-900 dark:text-slate-100 block">
                        {inv.grandTotal.toFixed(2)} {settings.currency}
                      </span>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                        inv.status === 'paid' 
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                          : inv.status === 'unpaid' || inv.paymentMethod === 'credit'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}>
                        {inv.status === 'paid' ? 'مدفوعة كاملة 🟢' : inv.status === 'unpaid' ? 'آجلة غير مدفوعة 🔴' : 'جزئي / مرتجع'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}
