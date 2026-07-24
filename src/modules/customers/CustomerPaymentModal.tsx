import React, { useState, useEffect } from 'react';
import { Customer, StoreSettings, Invoice } from '../../types';
import { PaymentService, InvoiceService } from '../../services/api';
import { X, Receipt, CheckCircle, Printer, Save, CreditCard, Wallet, Landmark, Calendar, FileText, AlertTriangle } from 'lucide-react';

interface CustomerPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  settings: StoreSettings;
  onPaymentSuccess: () => void;
}

export default function CustomerPaymentModal({
  isOpen,
  onClose,
  customer,
  settings,
  onPaymentSuccess
}: CustomerPaymentModalProps) {
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank' | 'check' | 'card'>('cash');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [receiptNumber, setReceiptNumber] = useState<string>(`RCPT-${Date.now().toString().slice(-6)}`);
  const [reference, setReference] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [unpaidInvoices, setUnpaidInvoices] = useState<Invoice[]>([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [createdReceipt, setCreatedReceipt] = useState<any | null>(null);

  useEffect(() => {
    if (isOpen && customer) {
      setAmount('');
      setPaymentMethod('cash');
      setDate(new Date().toISOString().split('T')[0]);
      setReceiptNumber(`RCPT-${Math.floor(100000 + Math.random() * 900000)}`);
      setReference('');
      setNotes('');
      setCreatedReceipt(null);
      setErrorMsg('');
      loadCustomerInvoices();
    }
  }, [isOpen, customer]);

  const loadCustomerInvoices = async () => {
    if (!customer) return;
    try {
      const allInvoices = await InvoiceService.getInvoices({ customerId: customer.id });
      const unpaid = allInvoices.filter(i => i.status === 'unpaid' || i.status === 'partially_paid' || i.paymentMethod === 'credit');
      setUnpaidInvoices(unpaid);
    } catch (e) {
      console.error('Error fetching unpaid customer invoices:', e);
    }
  };

  if (!isOpen || !customer) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setErrorMsg('يرجى إدخال مبلغ صحيح لسند القبض');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');

      const res = await PaymentService.payCustomer({
        customerId: customer.id,
        amount: numericAmount,
        paymentMethod,
        date,
        receiptNumber,
        reference: selectedInvoiceId ? `فاتورة #${selectedInvoiceId}` : reference,
        notes: notes || `سند قبض مقابل مديونية العميل: ${customer.name}`,
        invoiceId: selectedInvoiceId
      });

      setCreatedReceipt({
        receiptNumber: res.receiptNumber || receiptNumber,
        customerName: customer.name,
        customerPhone: customer.phone,
        customerTaxNumber: customer.taxNumber,
        amount: numericAmount,
        paymentMethod,
        date,
        reference,
        notes,
        newBalance: Math.max(0, customer.balance - numericAmount)
      });

      onPaymentSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'فشل إتمام عملية تسجيل سند القبض');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:rounded-none">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base">إصدار سند قبض عميل (استلام دفعة)</h3>
              <p className="text-xs text-slate-400">تحصيل مبالغ مالية وتحديث رصيد العميل والقيد المحاسبي</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Print Layout for Receipt Voucher */}
        {createdReceipt && (
          <div className="hidden print:block p-8 bg-white text-slate-900 font-sans">
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-6">
              <div>
                <h1 className="text-2xl font-black text-slate-900">{settings.name}</h1>
                <p className="text-xs text-slate-600 mt-1">{settings.address}</p>
                <p className="text-xs text-slate-600 font-mono">الرقم الضريبي: {settings.taxNumber}</p>
              </div>

              <div className="text-left">
                <div className="inline-block bg-slate-900 text-white px-4 py-1 rounded-md text-base font-black">
                  سند قبض مالي
                </div>
                <p className="text-xs font-mono font-bold mt-2">رقم السند: {createdReceipt.receiptNumber}</p>
                <p className="text-xs text-slate-600 font-mono">التاريخ: {createdReceipt.date}</p>
              </div>
            </div>

            <div className="space-y-4 text-sm font-medium mb-8">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex justify-between">
                  <span>استلمنا من السيد / السادة:</span>
                  <span className="font-extrabold text-base">{createdReceipt.customerName}</span>
                </div>
                {createdReceipt.customerTaxNumber && (
                  <div className="flex justify-between text-xs text-slate-600 font-mono">
                    <span>الرقم الضريبي للعميل:</span>
                    <span>{createdReceipt.customerTaxNumber}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>مبلغ وقدره:</span>
                  <span className="font-black text-lg text-emerald-800 font-mono">
                    {createdReceipt.amount.toFixed(2)} {settings.currency}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>طريقة السداد:</span>
                  <span className="font-bold">
                    {createdReceipt.paymentMethod === 'cash' ? 'نقداً (كاش)' : createdReceipt.paymentMethod === 'bank' ? 'تحويل بنكي' : createdReceipt.paymentMethod === 'card' ? 'بطاقة مدى / POS' : 'شيك بنكي'}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>وذلك عن:</span>
                  <span className="font-bold">{createdReceipt.notes || 'سداد جزء من المديونية المستحقة'}</span>
                </div>
              </div>

              <div className="flex justify-between text-xs p-3 bg-slate-100 rounded-lg">
                <span>الرصيد المتبقي على العميل بعد الدفعة:</span>
                <span className="font-mono font-bold text-slate-900">{createdReceipt.newBalance.toFixed(2)} {settings.currency}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 text-center text-xs font-bold pt-8 border-t border-slate-300">
              <div>
                <p className="mb-8">المستلم / الكاشير</p>
                <p className="text-slate-400">التوقيع: ....................</p>
              </div>
              <div>
                <p className="mb-8">توقيع العميل / الخزينة</p>
                <p className="text-slate-400">التوقيع: ....................</p>
              </div>
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 text-xs print:hidden">
          {createdReceipt ? (
            <div className="space-y-6 text-center py-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle className="w-10 h-10" />
              </div>

              <div>
                <h4 className="text-lg font-black text-slate-900 dark:text-slate-100">تم تسجيل سند القبض بنجاح!</h4>
                <p className="text-slate-500 mt-1">تمت خصم الدفعة من حساب العميل وإنشاء القيد المحاسبي التلقائي.</p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-right space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">رقم السند:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{createdReceipt.receiptNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">اسم العميل:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{createdReceipt.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">المبلغ المحصل:</span>
                  <span className="font-mono font-extrabold text-emerald-600 text-sm">
                    {createdReceipt.amount.toFixed(2)} {settings.currency}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">الرصيد المتبقي:</span>
                  <span className="font-mono font-bold text-rose-600">
                    {createdReceipt.newBalance.toFixed(2)} {settings.currency}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 justify-center">
                <button
                  onClick={handlePrint}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة سند القبض</span>
                </button>

                <button
                  onClick={onClose}
                  className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition"
                >
                  إغلاق
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Customer Info Card */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <div>
                  <p className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{customer.name}</p>
                  <p className="text-slate-500 text-[11px] font-mono mt-0.5">الجوال: {customer.phone || 'غير مدخل'}</p>
                </div>
                <div className="text-left">
                  <span className="text-[10px] text-slate-400 font-bold block">الرصيد الحالي المستحق</span>
                  <span className="font-mono text-base font-black text-rose-600 dark:text-rose-400">
                    {customer.balance.toFixed(2)} {settings.currency}
                  </span>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Amount & Receipt Number */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold mb-1.5 text-slate-700 dark:text-slate-300">
                    مبلغ الدفعة (ر.س) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      required
                      min="0.01"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full pl-3 pr-9 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono font-black text-base text-emerald-600"
                    />
                    <Wallet className="w-4 h-4 absolute right-3 top-3.5 text-slate-400" />
                  </div>
                  {customer.balance > 0 && (
                    <button
                      type="button"
                      onClick={() => setAmount(customer.balance.toString())}
                      className="mt-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                    >
                      تسديد إجمالي المديونية بالكامل ({customer.balance.toFixed(2)})
                    </button>
                  )}
                </div>

                <div>
                  <label className="block font-bold mb-1.5 text-slate-700 dark:text-slate-300">
                    رقم سند القبض
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={receiptNumber}
                      onChange={(e) => setReceiptNumber(e.target.value)}
                      className="w-full pl-3 pr-9 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono font-bold"
                    />
                    <Receipt className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
                  </div>
                </div>
              </div>

              {/* Payment Method & Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold mb-1.5 text-slate-700 dark:text-slate-300">
                    طريقة الدفع
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-bold"
                  >
                    <option value="cash">نقداً (كاش)</option>
                    <option value="card">بطاقة مدى / شبكة POS</option>
                    <option value="bank">تحويل بنكي</option>
                    <option value="check">شيك بنكي</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1.5 text-slate-700 dark:text-slate-300">
                    تاريخ السند
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full pl-3 pr-9 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono"
                    />
                    <Calendar className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
                  </div>
                </div>
              </div>

              {/* Allocate to Invoice (Optional) */}
              {unpaidInvoices.length > 0 && (
                <div>
                  <label className="block font-bold mb-1.5 text-slate-700 dark:text-slate-300">
                    تخصيص السداد لفاتورة معينة (اختياري)
                  </label>
                  <select
                    value={selectedInvoiceId}
                    onChange={(e) => {
                      setSelectedInvoiceId(e.target.value);
                      const selected = unpaidInvoices.find(i => i.id === e.target.value);
                      if (selected) {
                        setAmount(selected.grandTotal.toString());
                      }
                    }}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    <option value="">خصم عام من رصيد الحساب الشامل</option>
                    {unpaidInvoices.map(inv => (
                      <option key={inv.id} value={inv.id}>
                        فاتورة #{inv.invoiceNumber} - بتاريخ {inv.date.split('T')[0]} - المتبقي: {inv.grandTotal} {settings.currency}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block font-bold mb-1.5 text-slate-700 dark:text-slate-300">
                  ملاحظات / البيان
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="مثال: دفعة تحت الحساب / تسديد الفاتورة رقم..."
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition"
                >
                  إلغاء
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSubmitting ? 'جاري التسجيل...' : 'حفظ وإصدار سند القبض'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
