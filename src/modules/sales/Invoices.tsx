import React, { useState, useEffect } from 'react';
import { Invoice, StoreSettings, Customer, Product, Quotation, SalesOrder } from '../../types';
import { 
  Search, Printer, Calendar, ShieldAlert, Share2, Eye, Download, Mail, ArrowLeft, QrCode, RotateCcw, 
  FileText, Plus, CheckCircle2, DollarSign, Layers, Send, CreditCard, Coins, RefreshCw, X, ArrowUpRight
} from 'lucide-react';
import { SalesService } from '../../services/SalesService';
import { CurrencyService } from '../../core/api/api';

interface InvoicesProps {
  invoices: Invoice[];
  settings: StoreSettings;
  customers?: Customer[];
  products?: Product[];
  onRefresh?: () => void;
}

export default function Invoices({ invoices, settings, customers = [], products = [], onRefresh }: InvoicesProps) {
  // Main module tab
  const [activeSubTab, setActiveSubTab] = useState<'invoices' | 'quotations' | 'salesOrders' | 'payments' | 'currencies'>('invoices');

  // Invoices Tab State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'unpaid' | 'returned'>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isReturning, setIsReturning] = useState<boolean>(false);

  // Quotations Tab State
  const [quotationsList, setQuotationsList] = useState<Quotation[]>([]);
  const [showQuotationModal, setShowQuotationModal] = useState<boolean>(false);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  
  // Sales Orders Tab State
  const [salesOrdersList, setSalesOrdersList] = useState<SalesOrder[]>([]);
  const [showOrderModal, setShowOrderModal] = useState<boolean>(false);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);

  // Customer Payment / Receipt State
  const [paymentCustomerId, setPaymentCustomerId] = useState<string>('');
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank' | 'check'>('cash');
  const [paymentReference, setPaymentReference] = useState<string>('');
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState<boolean>(false);
  const [paymentCurrency, setPaymentCurrency] = useState<string>('SAR');

  // Multi-Currency Rates State
  const [currenciesList, setCurrenciesList] = useState<any[]>([
    { code: 'SAR', name: 'ريال سعودي', symbol: 'ر.س', exchangeRate: 1.0, isDefault: true },
    { code: 'USD', name: 'دولار أمريكي', symbol: '$', exchangeRate: 0.27, isDefault: false },
    { code: 'SYP', name: 'ليرة سورية', symbol: 'ل.س', exchangeRate: 3600.0, isDefault: false },
    { code: 'TRY', name: 'ليرة تركية', symbol: '₺', exchangeRate: 8.8, isDefault: false },
  ]);

  // New Quotation / Order Form State
  const [formCustomerId, setFormCustomerId] = useState<string>('');
  const [formCurrency, setFormCurrency] = useState<string>('SAR');
  const [formValidUntil, setFormValidUntil] = useState<string>('');
  const [formDeliveryDate, setFormDeliveryDate] = useState<string>('');
  const [formNotes, setFormNotes] = useState<string>('');
  const [formItems, setFormItems] = useState<{ productId: string; quantity: number; price: number }[]>([]);

  // Fetch Quotations, Orders, Currencies on mount / tab change
  useEffect(() => {
    fetchQuotations();
    fetchSalesOrders();
    fetchCurrencies();
  }, []);

  const fetchQuotations = async () => {
    try {
      const res = await SalesService.getQuotations();
      setQuotationsList(res || []);
    } catch (err) {
      console.error('Error fetching quotations:', err);
    }
  };

  const fetchSalesOrders = async () => {
    try {
      const res = await SalesService.getSalesOrders();
      setSalesOrdersList(res || []);
    } catch (err) {
      console.error('Error fetching sales orders:', err);
    }
  };

  const fetchCurrencies = async () => {
    try {
      const res = await CurrencyService.getCurrencies();
      if (res && res.length > 0) {
        setCurrenciesList(res);
      }
    } catch (err) {
      console.error('Error fetching currencies:', err);
    }
  };

  // Handlers for Invoices
  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.invoiceNumber.includes(searchQuery) || 
      (inv.customerName && inv.customerName.includes(searchQuery));
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleReturnInvoice = async (inv: Invoice) => {
    if (inv.status === 'returned') return;
    if (!window.confirm(`هل أنت أؤكد طلب مرتجع الفاتورة رقم ${inv.invoiceNumber}؟ سيتم تحديث المخزون وقيد العكس المحاسبي وإلغاء رصيد الآجل إن وجد.`)) {
      return;
    }

    setIsReturning(true);
    try {
      await SalesService.returnInvoice(inv.id);
      alert(`تم تسجيل مرتجع المبيعات للفاتورة ${inv.invoiceNumber} بنجاح وقيد العكس المحاسبي القيدي لتقليل المبيعات وإعادة المخزون.`);
      if (selectedInvoice && selectedInvoice.id === inv.id) {
        setSelectedInvoice({ ...selectedInvoice, status: 'returned' });
      }
      if (onRefresh) onRefresh();
    } catch (e: any) {
      alert(e.message || 'فشل معالجة مرتجع الفاتورة');
    } finally {
      setIsReturning(false);
    }
  };

  // Create Quotation
  const handleAddItemToForm = () => {
    if (products.length === 0) return;
    setFormItems([...formItems, { productId: products[0].id, quantity: 1, price: products[0].price }]);
  };

  const handleCreateQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formItems.length === 0) {
      alert('يرجى إضافة صنف واحد على الأقل للعرض');
      return;
    }

    const cust = customers.find(c => c.id === formCustomerId);
    const curr = currenciesList.find(c => c.code === formCurrency) || { exchangeRate: 1.0 };

    let subtotal = 0;
    const items = formItems.map(i => {
      const p = products.find(prod => prod.id === i.productId);
      const name = p ? p.name : 'منتج غير محدد';
      const tot = i.price * i.quantity;
      subtotal += tot;
      return {
        productId: i.productId,
        productName: name,
        price: i.price,
        quantity: i.quantity,
        total: tot,
        taxAmount: tot * ((settings.taxRate || 15) / 100)
      };
    });

    const taxAmount = subtotal * ((settings.taxRate || 15) / 100);
    const grandTotal = subtotal + taxAmount;

    try {
      await SalesService.createQuotation({
        customerId: formCustomerId || null,
        customerName: cust ? cust.name : 'عميل غير محدد',
        date: new Date().toISOString().split('T')[0],
        validUntil: formValidUntil || null,
        subtotal,
        taxAmount,
        discountAmount: 0,
        grandTotal,
        currency: formCurrency,
        exchangeRate: curr.exchangeRate,
        notes: formNotes,
        items
      });
      alert('تم إنشاء عرض السعر بنجاح!');
      setShowQuotationModal(false);
      setFormItems([]);
      fetchQuotations();
    } catch (err: any) {
      alert(err.message || 'فشل إنشاء عرض السعر');
    }
  };

  // Convert Quotation -> Order
  const handleConvertQuotationToOrder = async (quoteId: string) => {
    try {
      await SalesService.convertQuotationToSalesOrder(quoteId);
      alert('تم تحويل عرض السعر إلى أمر مبيعات مؤكد بنجاح!');
      fetchQuotations();
      fetchSalesOrders();
    } catch (err: any) {
      alert(err.message || 'فشل تحويل عرض السعر');
    }
  };

  // Create Sales Order
  const handleCreateSalesOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formItems.length === 0) {
      alert('يرجى إضافة صنف واحد على الأقل لأمر المبيعات');
      return;
    }

    const cust = customers.find(c => c.id === formCustomerId);
    const curr = currenciesList.find(c => c.code === formCurrency) || { exchangeRate: 1.0 };

    let subtotal = 0;
    const items = formItems.map(i => {
      const p = products.find(prod => prod.id === i.productId);
      const name = p ? p.name : 'منتج غير محدد';
      const tot = i.price * i.quantity;
      subtotal += tot;
      return {
        productId: i.productId,
        productName: name,
        price: i.price,
        quantity: i.quantity,
        total: tot,
        taxAmount: tot * ((settings.taxRate || 15) / 100)
      };
    });

    const taxAmount = subtotal * ((settings.taxRate || 15) / 100);
    const grandTotal = subtotal + taxAmount;

    try {
      await SalesService.createSalesOrder({
        customerId: formCustomerId || null,
        customerName: cust ? cust.name : 'عميل غير محدد',
        date: new Date().toISOString().split('T')[0],
        deliveryDate: formDeliveryDate || null,
        subtotal,
        taxAmount,
        discountAmount: 0,
        grandTotal,
        currency: formCurrency,
        exchangeRate: curr.exchangeRate,
        notes: formNotes,
        items
      });
      alert('تم إنشاء أمر المبيعات بنجاح!');
      setShowOrderModal(false);
      setFormItems([]);
      fetchSalesOrders();
    } catch (err: any) {
      alert(err.message || 'فشل إنشاء أمر المبيعات');
    }
  };

  // Convert Sales Order -> Invoice
  const handleConvertOrderToInvoice = async (orderId: string, payMethod: string) => {
    try {
      await SalesService.convertSalesOrderToInvoice(orderId, payMethod);
      alert('تم تحويل أمر المبيعات إلى فاتورة ضريبية وتحديث المخزون وإصدار القيد المحاسبي بنجاح!');
      fetchSalesOrders();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert(err.message || 'فشل تحويل أمر المبيعات إلى فاتورة');
    }
  };

  // Customer Payment Submission
  const handleCustomerPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentCustomerId) {
      alert('يرجى اختيار العميل أولاً');
      return;
    }
    const amt = parseFloat(paymentAmount);
    if (isNaN(amt) || amt <= 0) {
      alert('يرجى أدخال مبلغ صحيح لتحصيل الدفعة');
      return;
    }

    const cust = customers.find(c => c.id === paymentCustomerId);

    setIsSubmittingPayment(true);
    try {
      await SalesService.recordCustomerPayment({
        customerId: paymentCustomerId,
        customerName: cust?.name,
        amount: amt,
        method: paymentMethod,
        currency: paymentCurrency,
        reference: paymentReference,
        notes: paymentNotes
      });

      alert(`تم تسجيل سند القبض بمبلغ ${amt} بنجاح! تم الخصم من رصيد العميل وإنشاء القيد المحاسبي المزدوج تلقائياً.`);
      setPaymentAmount('');
      setPaymentReference('');
      setPaymentNotes('');
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert(err.message || 'فشل تسجيل تحصيل الدفعة');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Sales Cycle Tabs Navigation */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
            <Layers className="w-6 h-6 text-emerald-600" />
            <span>دورة المبيعات الكاملة والمستندات (Sales Cycle)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            إدارة عروض الأسعار ← أوامر المبيعات ← الفواتير الضريبية ← سداد الدفعات ← المرتجعات الربط الآلي بالمخزون والمحاسبة
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 bg-slate-100 p-1.5 rounded-xl text-xs font-bold w-full md:w-auto">
          <button
            onClick={() => setActiveSubTab('invoices')}
            className={`px-3.5 py-2 rounded-lg transition flex items-center gap-1.5 ${
              activeSubTab === 'invoices' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>الفواتير الضريبية ({invoices.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('quotations')}
            className={`px-3.5 py-2 rounded-lg transition flex items-center gap-1.5 ${
              activeSubTab === 'quotations' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>عروض الأسعار ({quotationsList.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('salesOrders')}
            className={`px-3.5 py-2 rounded-lg transition flex items-center gap-1.5 ${
              activeSubTab === 'salesOrders' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>أوامر المبيعات ({salesOrdersList.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('payments')}
            className={`px-3.5 py-2 rounded-lg transition flex items-center gap-1.5 ${
              activeSubTab === 'payments' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>تحصيل سندات الدفع</span>
          </button>

          <button
            onClick={() => setActiveSubTab('currencies')}
            className={`px-3.5 py-2 rounded-lg transition flex items-center gap-1.5 ${
              activeSubTab === 'currencies' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Coins className="w-4 h-4 text-amber-500" />
            <span>العملات والأسعار</span>
          </button>
        </div>
      </div>

      {/* ==================== TAB 1: INVOICES & RETURNS ==================== */}
      {activeSubTab === 'invoices' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* List Column - 7 cols */}
          <div className="xl:col-span-7 bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col h-[calc(100vh-210px)]">
            <div className="space-y-4 mb-4">
              <div className="flex justify-between items-center">
                <h3 className="font-extrabold text-slate-800 text-lg">سجل الفواتير الضريبية والمبيعات</h3>
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
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-700 focus:outline-none"
                >
                  <option value="all">📂 كل الفواتير</option>
                  <option value="paid">🟢 الفواتير المدفوعة (كاش/شبكة)</option>
                  <option value="unpaid">⏳ فواتير الآجل (على الحساب)</option>
                  <option value="returned">🔴 مرتجع مبيعات</option>
                </select>
              </div>
            </div>

            {/* List */}
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
                          inv.status === 'returned' ? 'bg-rose-100 text-rose-800' :
                          inv.status === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {inv.status === 'returned' ? 'مرتجع مبيعات' :
                           inv.status === 'paid' ? 'مدفوعة' : 'غير مدفوعة (آجل)'}
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

          {/* Details Column - 5 cols */}
          <div className="xl:col-span-5 bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col h-[calc(100vh-210px)] overflow-hidden">
            {selectedInvoice ? (
              <div className="flex flex-col h-full overflow-hidden">
                <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-4">
                  <div>
                    <h4 className="font-extrabold text-slate-800">فاتورة: {selectedInvoice.invoiceNumber}</h4>
                    <p className="text-xs text-slate-400">{new Date(selectedInvoice.date).toLocaleString('ar-SA')}</p>
                  </div>

                  <div className="flex gap-1.5 items-center">
                    {selectedInvoice.status !== 'returned' && (
                      <button
                        onClick={() => handleReturnInvoice(selectedInvoice)}
                        disabled={isReturning}
                        className="p-1.5 px-2.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition flex items-center gap-1"
                        title="إرجاع الفاتورة بالكامل (مرتجع مبيعات)"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>مرتجع</span>
                      </button>
                    )}
                    <button
                      onClick={() => window.print()}
                      className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                      title="طباعة حرارية فورية"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto pr-1">
                  <div 
                    id="thermal-receipt-print"
                    className="bg-white text-slate-900 p-4 border border-dashed border-slate-300 rounded font-sans text-xs space-y-4 shadow-sm"
                    style={{ direction: 'rtl' }}
                  >
                    <div className="text-center space-y-1">
                      <div className="flex items-center justify-center gap-1.5 text-lg font-black">
                        <span>{settings.name}</span>
                      </div>
                      <div className="text-[10px] text-slate-500">{settings.address}</div>
                      <div className="text-[10px] font-bold">الرقم الضريبي: {settings.taxNumber}</div>
                    </div>

                    <div className="border-t border-dashed border-slate-300 my-2"></div>

                    <div className="space-y-1 text-[10px]">
                      <div className="flex justify-between">
                        <span>رقم الفاتورة:</span>
                        <span className="font-bold">{selectedInvoice.invoiceNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>العميل المفوتر:</span>
                        <span className="font-bold">{selectedInvoice.customerName || 'عميل نقدي'}</span>
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

                    <div className="space-y-1 text-[10px]">
                      <div className="flex justify-between">
                        <span>المجموع الخاضع للضريبة:</span>
                        <span>{selectedInvoice.totalWithoutTax.toFixed(2)} {settings.currency}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>ضريبة القيمة المضافة ({settings.taxRate}%):</span>
                        <span>{selectedInvoice.taxAmount.toFixed(2)} {settings.currency}</span>
                      </div>
                      <div className="flex justify-between text-sm font-extrabold pt-1 border-t border-slate-300">
                        <span>المجموع النهائي شامل VAT:</span>
                        <span>{selectedInvoice.grandTotal.toFixed(2)} {settings.currency}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
                <Eye className="w-12 h-12 text-slate-300" />
                <p className="font-bold text-sm">لم يتم تحديد فاتورة</p>
                <p className="text-xs text-slate-400">انقر على أي فاتورة من القائمة المجاورة لمعاينتها</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== TAB 2: QUOTATIONS (عروض الأسعار) ==================== */}
      {activeSubTab === 'quotations' && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-slate-800 text-lg">سجل عروض الأسعار المقدمة للعملاء</h3>
              <p className="text-xs text-slate-500">إنشاء ومتابعة عروض الأسعار وتحويلها إلى أوامر مبيعات بنقرة واحدة</p>
            </div>
            <button
              onClick={() => {
                setShowQuotationModal(true);
                setFormItems([]);
                handleAddItemToForm();
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>إنشاء عرض سعر جديد</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50 border-y border-slate-200 text-slate-600 font-bold">
                  <th className="p-3">رقم عرض السعر</th>
                  <th className="p-3">العميل</th>
                  <th className="p-3">التاريخ</th>
                  <th className="p-3">صلاحية العرض</th>
                  <th className="p-3">العملة</th>
                  <th className="p-3">المجموع النهائي</th>
                  <th className="p-3">الحالة</th>
                  <th className="p-3 text-center">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {quotationsList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      لا توجد عروض أسعار مسجلة حتى الآن. اضغط فوق "إنشاء عرض سعر جديد" للبدء.
                    </td>
                  </tr>
                ) : (
                  quotationsList.map((q) => (
                    <tr key={q.id} className="hover:bg-slate-50 transition">
                      <td className="p-3 font-bold text-slate-800">{q.quotationNumber}</td>
                      <td className="p-3">{q.customerName || 'عام'}</td>
                      <td className="p-3 text-slate-500">{q.date}</td>
                      <td className="p-3 text-slate-500">{q.validUntil || 'غير محدد'}</td>
                      <td className="p-3 font-bold text-amber-600">{q.currency || 'SAR'}</td>
                      <td className="p-3 font-bold text-emerald-600 font-mono">{q.grandTotal.toFixed(2)}</td>
                      <td className="p-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          q.status === 'converted' ? 'bg-emerald-100 text-emerald-800' :
                          q.status === 'sent' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {q.status === 'converted' ? 'تم تحويله لأمر مبيعات' :
                           q.status === 'sent' ? 'تم إرساله للعميل' : 'مسودة'}
                        </span>
                      </td>
                      <td className="p-3 text-center space-x-2 space-x-reverse">
                        {q.status !== 'converted' && (
                          <button
                            onClick={() => handleConvertQuotationToOrder(q.id)}
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold px-3 py-1.5 rounded-lg text-[11px] transition inline-flex items-center gap-1"
                          >
                            <ArrowUpRight className="w-3.5 h-3.5" />
                            <span>تحويل لأمر مبيعات</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== TAB 3: SALES ORDERS (أوامر المبيعات) ==================== */}
      {activeSubTab === 'salesOrders' && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-slate-800 text-lg">سجل أوامر المبيعات المعتمدة (Sales Orders)</h3>
              <p className="text-xs text-slate-500">متابعة أوامر توريد المبيعات وتحويلها تلقائياً إلى فواتير ضريبية مبيعات مع خصم المخزن</p>
            </div>
            <button
              onClick={() => {
                setShowOrderModal(true);
                setFormItems([]);
                handleAddItemToForm();
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>إنشاء أمر مبيعات جديد</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50 border-y border-slate-200 text-slate-600 font-bold">
                  <th className="p-3">رقم الأمر</th>
                  <th className="p-3">العميل</th>
                  <th className="p-3">التاريخ</th>
                  <th className="p-3">تاريخ التسليم المتوقع</th>
                  <th className="p-3">العملة</th>
                  <th className="p-3">الإجمالي</th>
                  <th className="p-3">الحالة</th>
                  <th className="p-3 text-center">إصدار الفاتورة الضريبية</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {salesOrdersList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      لا توجد أوامر مبيعات مسجلة حالياً.
                    </td>
                  </tr>
                ) : (
                  salesOrdersList.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50 transition">
                      <td className="p-3 font-bold text-slate-800">{o.orderNumber}</td>
                      <td className="p-3">{o.customerName || 'عام'}</td>
                      <td className="p-3 text-slate-500">{o.date}</td>
                      <td className="p-3 text-slate-500">{o.deliveryDate || 'فوري'}</td>
                      <td className="p-3 font-bold text-amber-600">{o.currency || 'SAR'}</td>
                      <td className="p-3 font-bold text-emerald-600 font-mono">{o.grandTotal.toFixed(2)}</td>
                      <td className="p-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          o.status === 'converted' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {o.status === 'converted' ? 'تم الفوترة وتحديث المخزون' : 'أمر مؤكد جاهز للفوترة'}
                        </span>
                      </td>
                      <td className="p-3 text-center space-x-2 space-x-reverse">
                        {o.status !== 'converted' && (
                          <div className="inline-flex gap-1.5">
                            <button
                              onClick={() => handleConvertOrderToInvoice(o.id, 'cash')}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1 rounded text-[10px] transition"
                            >
                              فوترة كاش
                            </button>
                            <button
                              onClick={() => handleConvertOrderToInvoice(o.id, 'credit')}
                              className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-2.5 py-1 rounded text-[10px] transition"
                            >
                              فوترة آجل
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== TAB 4: PAYMENTS (سندات تحصيل المبيعات) ==================== */}
      {activeSubTab === 'payments' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-800 text-lg flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                <span>تسجيل سند قبض تحصيل دفعة مبيعات</span>
              </h3>
              <p className="text-xs text-slate-500">سداد الدفعات النقدية أو البنكية للعملاء وتقليل رصيد الذمم والربط بالقيد المحاسبي</p>
            </div>

            <form onSubmit={handleCustomerPayment} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">اختر العميل المفوتر:</label>
                <select
                  value={paymentCustomerId}
                  onChange={(e) => setPaymentCustomerId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  required
                >
                  <option value="">-- اختر عميل من القائمة --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} (رصيد الآجل المتبقي: {c.balance} SAR)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">المبلغ المحصل:</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">عملة التحصيل:</label>
                  <select
                    value={paymentCurrency}
                    onChange={(e) => setPaymentCurrency(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  >
                    {currenciesList.map(curr => (
                      <option key={curr.code} value={curr.code}>
                        {curr.name} ({curr.symbol})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">طريقة القبض:</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  >
                    <option value="cash">💵 الصندوق النقدي (الكاش)</option>
                    <option value="bank">🏦 تحويل بنكي / مدى</option>
                    <option value="check">📜 شيك مقبول الدفع</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">رقم المرجع / الشيك:</label>
                  <input
                    type="text"
                    placeholder="مثال: TRX-9981"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">ملاحظات وقيد السند:</label>
                <textarea
                  rows={2}
                  placeholder="ملاحظات توضيحية لسند القبض..."
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingPayment}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold p-3 rounded-xl transition text-sm shadow-md flex justify-center items-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>حفظ سند القبض وترحيل القيد المحاسبي</span>
              </button>
            </form>
          </div>

          <div className="lg:col-span-6 bg-slate-900 text-white p-6 rounded-2xl shadow-sm border border-slate-800 space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-emerald-400 text-base flex items-center gap-2">
                <ShieldAlert className="w-5 h-5" />
                <span>دليل الربط الآلي بالقيد المحاسبي لسند القبض</span>
              </h3>
              <p className="text-xs text-slate-400">عند ترحيل سند القبض يقوم المحرك المحاسبي بإنشاء القيد الآلي المزدوج:</p>
            </div>

            <div className="bg-slate-800/80 p-4 rounded-xl space-y-3 text-xs font-mono border border-slate-700">
              <div className="flex justify-between items-center text-emerald-400">
                <span>[مدين Debit] حساب النقدية / البنك (1110)</span>
                <span>+المبلغ المحصل</span>
              </div>
              <div className="flex justify-between items-center text-rose-400">
                <span>[دائن Credit] حساب الذمم المدينة العميل (1120)</span>
                <span>-تقليل المديونية</span>
              </div>
            </div>

            <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
              <p>🟢 يتم التحديث اللحظي لكشف حساب العميل ورصيد الذمم الآجلة.</p>
              <p>🟢 القيد يدعم التحويل التلقائي لأسعار الصرف للعملات متعددة الأطراف (USD, SYP, TRY).</p>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 5: MULTI-CURRENCY (العملات وأسعار الصرف) ==================== */}
      {activeSubTab === 'currencies' && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="font-extrabold text-slate-800 text-lg flex items-center gap-2">
              <Coins className="w-5 h-5 text-amber-500" />
              <span>دعم العملات المتعددة وأسعار الصرف (Multi-Currency Support)</span>
            </h3>
            <p className="text-xs text-slate-500">يدعم النظام الشراء والبيع وعروض الأسعار بالعملات الرئيسية: USD, SYP, TRY, SAR مع ربطها بالسعر الأساسي للشركة</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {currenciesList.map((curr) => (
              <div key={curr.code} className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-slate-800 text-lg">{curr.name} ({curr.symbol})</span>
                  <span className="text-xs font-mono font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">{curr.code}</span>
                </div>
                <div className="text-xs text-slate-500 font-bold">
                  سعر الصرف مقابل SAR: <span className="text-emerald-700 font-mono text-sm">{curr.exchangeRate}</span>
                </div>
                {curr.isDefault && (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full inline-block">
                    العملة الأساسية للنظام
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================== MODAL: CREATE QUOTATION ==================== */}
      {showQuotationModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-base">إنشاء عرض سعر جديد للعميل</h3>
              <button onClick={() => setShowQuotationModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateQuotation} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">العميل المستهدف:</label>
                  <select
                    value={formCustomerId}
                    onChange={(e) => setFormCustomerId(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    <option value="">-- عميل عام / غير محدد --</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">العملة:</label>
                  <select
                    value={formCurrency}
                    onChange={(e) => setFormCurrency(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    {currenciesList.map(c => <option key={c.code} value={c.code}>{c.name} ({c.symbol})</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">صلاحية العرض حتى تاريخ:</label>
                <input
                  type="date"
                  value={formValidUntil}
                  onChange={(e) => setFormValidUntil(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>

              {/* Items List */}
              <div className="space-y-2 border-t border-slate-100 pt-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-800">أصناف عرض السعر:</span>
                  <button
                    type="button"
                    onClick={handleAddItemToForm}
                    className="text-emerald-600 font-bold hover:underline"
                  >
                    + إضافة صنف
                  </button>
                </div>

                {formItems.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-center bg-slate-50 p-2 rounded-xl">
                    <select
                      value={item.productId}
                      onChange={(e) => {
                        const pid = e.target.value;
                        const p = products.find(prod => prod.id === pid);
                        const newItems = [...formItems];
                        newItems[idx] = { productId: pid, quantity: item.quantity, price: p ? p.price : item.price };
                        setFormItems(newItems);
                      }}
                      className="flex-1 p-1.5 bg-white border border-slate-200 rounded-lg font-bold"
                    >
                      {products.map(p => <option key={p.id} value={p.id}>{p.name} - ({p.price} SAR)</option>)}
                    </select>

                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => {
                        const newItems = [...formItems];
                        newItems[idx].quantity = parseInt(e.target.value) || 1;
                        setFormItems(newItems);
                      }}
                      className="w-16 p-1.5 bg-white border border-slate-200 rounded-lg text-center font-bold"
                    />

                    <input
                      type="number"
                      step="0.01"
                      value={item.price}
                      onChange={(e) => {
                        const newItems = [...formItems];
                        newItems[idx].price = parseFloat(e.target.value) || 0;
                        setFormItems(newItems);
                      }}
                      className="w-24 p-1.5 bg-white border border-slate-200 rounded-lg text-center font-bold font-mono"
                    />
                  </div>
                ))}
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold p-2.5 rounded-xl transition mt-4"
              >
                حفظ وحفظ عرض السعر
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: CREATE SALES ORDER ==================== */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-base">إنشاء أمر مبيعات معتمد جديد</h3>
              <button onClick={() => setShowOrderModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSalesOrder} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">العميل:</label>
                  <select
                    value={formCustomerId}
                    onChange={(e) => setFormCustomerId(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    <option value="">-- عميل عام / غير محدد --</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">تاريخ التسليم المتوقع:</label>
                  <input
                    type="date"
                    value={formDeliveryDate}
                    onChange={(e) => setFormDeliveryDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2 border-t border-slate-100 pt-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-800">أصناف أمر المبيعات:</span>
                  <button
                    type="button"
                    onClick={handleAddItemToForm}
                    className="text-emerald-600 font-bold hover:underline"
                  >
                    + إضافة صنف
                  </button>
                </div>

                {formItems.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-center bg-slate-50 p-2 rounded-xl">
                    <select
                      value={item.productId}
                      onChange={(e) => {
                        const pid = e.target.value;
                        const p = products.find(prod => prod.id === pid);
                        const newItems = [...formItems];
                        newItems[idx] = { productId: pid, quantity: item.quantity, price: p ? p.price : item.price };
                        setFormItems(newItems);
                      }}
                      className="flex-1 p-1.5 bg-white border border-slate-200 rounded-lg font-bold"
                    >
                      {products.map(p => <option key={p.id} value={p.id}>{p.name} - ({p.price} SAR)</option>)}
                    </select>

                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => {
                        const newItems = [...formItems];
                        newItems[idx].quantity = parseInt(e.target.value) || 1;
                        setFormItems(newItems);
                      }}
                      className="w-16 p-1.5 bg-white border border-slate-200 rounded-lg text-center font-bold"
                    />

                    <input
                      type="number"
                      step="0.01"
                      value={item.price}
                      onChange={(e) => {
                        const newItems = [...formItems];
                        newItems[idx].price = parseFloat(e.target.value) || 0;
                        setFormItems(newItems);
                      }}
                      className="w-24 p-1.5 bg-white border border-slate-200 rounded-lg text-center font-bold font-mono"
                    />
                  </div>
                ))}
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold p-2.5 rounded-xl transition mt-4"
              >
                إنشاء واعتماد أمر المبيعات
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
