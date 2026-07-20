import React, { useState } from 'react';
import { Invoice, StoreSettings } from '../../types';
import { Search, Printer, Calendar, ShieldAlert, Share2, Eye, Download, Mail, ArrowLeft, QrCode } from 'lucide-react';

interface InvoicesProps {
  invoices: Invoice[];
  settings: StoreSettings;
}

export default function Invoices({ invoices, settings }: InvoicesProps) {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Filters
  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.invoiceNumber.includes(searchQuery) || 
      (inv.customerName && inv.customerName.includes(searchQuery));
    
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleShareWhatsApp = (inv: Invoice) => {
    alert(`محاكاة: تم تحويل الفاتورة رقم ${inv.invoiceNumber} بصيغة PDF ومشاركتها عبر الواتساب بنجاح للهاتف المرتبط بالعميل.`);
  };

  const handleShareEmail = (inv: Invoice) => {
    alert(`محاكاة: تم إرسال الفاتورة الضريبية المبسطة ${inv.invoiceNumber} بنجاح إلى البريد الإلكتروني الخاص بالعميل.`);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
      {/* List Column - 7 cols */}
      <div className="xl:col-span-7 bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col h-[calc(100vh-130px)]">
        <div className="space-y-4 mb-4">
          <div className="flex justify-between items-center">
            <h3 className="font-extrabold text-slate-800 text-lg underline decoration-emerald-500/50 decoration-4 underline-offset-8">سجل الفواتير الضريبية</h3>
            <span className="text-xs bg-slate-100 px-3 py-1.5 rounded-lg text-slate-500 font-bold">إجمالي: {invoices.length} فواتير</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-3.5 top-3 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="البحث برقم الفاتورة أو اسم العميل..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-11 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold text-slate-800"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'paid' | 'unpaid')}
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-700 focus:outline-none"
            >
              <option value="all">📂 كل الفواتير</option>
              <option value="paid">🟢 الفواتير المدفوعة</option>
              <option value="unpaid">⏳ فواتير الآجل (المتبقي)</option>
            </select>
          </div>
        </div>

        {/* Table/List */}
        <div className="flex-1 overflow-y-auto space-y-2">
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <ShieldAlert className="w-12 h-12 mx-auto mb-2 text-slate-300" />
              <p className="font-bold">لا توجد فواتير مطابقة للبحث حالياً</p>
            </div>
          ) : (
            filteredInvoices.map((inv) => (
              <button
                key={inv.id}
                onClick={() => setSelectedInvoice(inv)}
                className={`w-full text-right p-4 rounded-xl border transition flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 active:scale-[0.99] ${
                  selectedInvoice?.id === inv.id 
                    ? 'border-emerald-500 bg-emerald-50/20 shadow-sm' 
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-800 text-sm sm:text-base">{inv.invoiceNumber}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      inv.status === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                    }`}>
                      {inv.status === 'paid' ? 'مدفوعة' : 'غير مدفوعة (آجل)'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 flex gap-2">
                    <span>{new Date(inv.date).toLocaleString('ar-SA')}</span>
                    <span>•</span>
                    <span>العميل: {inv.customerName || 'عميل نقدي'}</span>
                  </div>
                </div>

                <div className="flex sm:flex-col items-start sm:items-end justify-between w-full sm:w-auto gap-2 border-t sm:border-t-0 border-slate-100 pt-2 sm:pt-0">
                  <span className="text-[10px] text-slate-400 font-bold">المجموع مع VAT:</span>
                  <div className="font-extrabold text-emerald-600 font-mono text-sm sm:text-base">
                    {inv.grandTotal.toFixed(2)} {settings.currency}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Details/Preview Column - 5 cols */}
      <div className="xl:col-span-5 bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col h-[calc(100vh-130px)] overflow-hidden">
        {selectedInvoice ? (
          <div className="flex flex-col h-full overflow-hidden">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-4">
              <div>
                <h4 className="font-extrabold text-slate-800">فاتورة: {selectedInvoice.invoiceNumber}</h4>
                <p className="text-xs text-slate-400">{new Date(selectedInvoice.date).toLocaleString('ar-SA')}</p>
              </div>

              <div className="flex gap-1.5">
                <button
                  onClick={() => window.print()}
                  className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                  title="طباعة حرارية فورية"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleShareWhatsApp(selectedInvoice)}
                  className="p-2 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition"
                  title="إرسال واتساب للعميل"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleShareEmail(selectedInvoice)}
                  className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
                  title="إرسال بريد الكتروني"
                >
                  <Mail className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Thermal Receipt view simulated inside details container */}
            <div className="flex-1 overflow-y-auto pr-1">
              <div 
                id="thermal-receipt-print"
                className="bg-white text-slate-900 p-4 border border-dashed border-slate-300 rounded font-sans text-xs space-y-4 shadow-sm"
                style={{ direction: 'rtl' }}
              >
                {/* Store Header */}
                <div className="text-center space-y-1">
                  <div className="text-lg font-black">{settings.logo} {settings.name}</div>
                  <div className="text-[10px] text-slate-500">{settings.address}</div>
                  <div className="text-[10px] text-slate-500">جوال: {settings.phone}</div>
                  <div className="text-[10px] font-bold">الرقم الضريبي: {settings.taxNumber}</div>
                </div>

                <div className="border-t border-dashed border-slate-300 my-2"></div>

                {/* Invoice Metadata */}
                <div className="space-y-1 text-[10px]">
                  <div className="flex justify-between">
                    <span>رقم الفاتورة:</span>
                    <span className="font-bold">{selectedInvoice.invoiceNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>التاريخ والوقت:</span>
                    <span>{new Date(selectedInvoice.date).toLocaleString('ar-SA')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>الكاشير مسئول العملية:</span>
                    <span>{selectedInvoice.cashierName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>العميل المفوتر:</span>
                    <span className="font-bold">{selectedInvoice.customerName || 'عميل نقدي سريع'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>طريقة الدفع:</span>
                    <span className="font-bold">
                      {selectedInvoice.paymentMethod === 'cash' ? '💵 كاش' : 
                       selectedInvoice.paymentMethod === 'card' ? '💳 بطاقة شبكة' : 
                       selectedInvoice.paymentMethod === 'credit' ? '⏳ آجل' : '🔀 مختلط كاش/شبكة'}
                    </span>
                  </div>
                </div>

                <div className="border-t border-slate-300 my-2"></div>

                {/* Table of items */}
                <table className="w-full text-right text-[10px]">
                  <thead>
                    <tr className="border-b border-slate-300 font-bold">
                      <th className="pb-1">الصنف</th>
                      <th className="pb-1 text-center">الكمية</th>
                      <th className="pb-1 text-left">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInvoice.items.map((it, idx) => (
                      <tr key={idx} className="border-b border-dashed border-slate-100">
                        <td className="py-1">{it.productName}</td>
                        <td className="py-1 text-center font-bold">{it.quantity}</td>
                        <td className="py-1 text-left font-bold">{it.total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="border-t border-dashed border-slate-300 my-2"></div>

                {/* Financial Summary */}
                <div className="space-y-1 text-[10px]">
                  <div className="flex justify-between">
                    <span>المجموع الخاضع للضريبة:</span>
                    <span>{selectedInvoice.totalWithoutTax.toFixed(2)} {settings.currency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ضريبة القيمة المضافة ({settings.taxRate}%):</span>
                    <span>{selectedInvoice.taxAmount.toFixed(2)} {settings.currency}</span>
                  </div>
                  {selectedInvoice.discountAmount > 0 && (
                    <div className="flex justify-between text-rose-600 font-bold">
                      <span>إجمالي الخصم الممنوح:</span>
                      <span>-{selectedInvoice.discountAmount.toFixed(2)} {settings.currency}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-extrabold pt-1 border-t border-slate-300">
                    <span>المجموع النهائي شامل VAT:</span>
                    <span>{selectedInvoice.grandTotal.toFixed(2)} {settings.currency}</span>
                  </div>
                </div>

                <div className="border-t border-dashed border-slate-300 my-3"></div>

                {/* QR Code and Compliant Footer */}
                <div className="text-center space-y-3">
                  <div className="flex flex-col items-center justify-center border border-slate-200 p-2 rounded bg-white w-28 h-28 mx-auto">
                    <QrCode className="w-16 h-16 text-slate-800" />
                    <span className="text-[8px] text-slate-400 mt-1 font-mono">هيئة الزكاة والضريبة والجمارك</span>
                  </div>
                  <div className="text-[9px] text-slate-400 leading-snug">
                    فاتورة ضريبية مبسطة معتمدة للعميل • طبعت فوراً
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
            <Eye className="w-12 h-12 text-slate-300" />
            <p className="font-bold text-sm">لم يتم تحديد فاتورة</p>
            <p className="text-xs text-slate-400">انقر على أي فاتورة من القائمة المجاورة لمعاينتها بالتفصيل والطباعة</p>
          </div>
        )}
      </div>
    </div>
  );
}
