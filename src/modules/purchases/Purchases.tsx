import React, { useState, useEffect } from 'react';
import { Product, Customer, StoreSettings } from '../../types';
import { SupplierService, PurchaseService, PaymentService } from '../../services/api';
import { 
  PlusCircle, 
  Receipt, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Search, 
  Landmark, 
  RefreshCw, 
  Users, 
  Building, 
  Coins, 
  Wallet, 
  CreditCard, 
  CheckCircle, 
  Calendar, 
  AlertTriangle,
  Plus,
  Trash2
} from 'lucide-react';

interface Supplier {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  balance: number;
}

interface PurchasesProps {
  products: Product[];
  customers: Customer[];
  settings: StoreSettings;
  onRefreshData: () => Promise<void>;
}

export default function Purchases({ products, customers, settings, onRefreshData }: PurchasesProps) {
  const [activeSubTab, setActiveSubTab] = useState<'purchase_invoice' | 'customer_receipt' | 'supplier_payment' | 'directory'>('purchase_invoice');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Directory Search
  const [searchQuery, setSearchQuery] = useState('');
  const [partnerType, setPartnerType] = useState<'all' | 'customers' | 'suppliers'>('all');

  // Supplier Add Modal
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [newSuppName, setNewSuppName] = useState('');
  const [newSuppPhone, setNewSuppPhone] = useState('');
  const [newSuppEmail, setNewSuppEmail] = useState('');

  // 1. Purchase Invoice Form State
  const [purSupplierId, setPurSupplierId] = useState('');
  const [purPaymentMethod, setPurPaymentMethod] = useState<'cash' | 'card' | 'credit'>('cash');
  const [purInvoiceNumber, setPurInvoiceNumber] = useState('');
  const [purDate, setPurDate] = useState(new Date().toISOString().split('T')[0]);
  const [purItems, setPurItems] = useState<{ productId: string; purchasePrice: number; quantity: number }[]>([
    { productId: '', purchasePrice: 0, quantity: 1 }
  ]);

  // 2. Customer Receipt Form State
  const [rcptCustomerId, setRcptCustomerId] = useState('');
  const [rcptAmount, setRcptAmount] = useState('');
  const [rcptPaymentMethod, setRcptPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [rcptDate, setRcptDate] = useState(new Date().toISOString().split('T')[0]);
  const [rcptNumber, setRcptNumber] = useState('');

  // 3. Supplier Payment Form State
  const [paySupplierId, setPaySupplierId] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payPaymentMethod, setPayPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payNumber, setPayNumber] = useState('');

  const fetchSuppliers = async () => {
    setLoadingSuppliers(true);
    try {
      const data = await SupplierService.getSuppliers();
      setSuppliers(data);
    } catch (e) {
      console.error('Error fetching suppliers:', e);
    } finally {
      setLoadingSuppliers(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
    // Auto-generate transaction reference numbers
    setPurInvoiceNumber('PUR-' + Math.floor(100000 + Math.random() * 900000));
    setRcptNumber('RCPT-' + Math.floor(100000 + Math.random() * 900000));
    setPayNumber('PAY-' + Math.floor(100000 + Math.random() * 900000));
  }, []);

  // Inline Supplier Submission
  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSuppName.trim()) return;

    try {
      const data = await SupplierService.createSupplier({
        name: newSuppName,
        phone: newSuppPhone,
        email: newSuppEmail,
        balance: 0
      });

      await fetchSuppliers();
      if (data && data.id) {
        // Auto-select in form
        setPurSupplierId(data.id);
        setPaySupplierId(data.id);
      }
      setShowSupplierModal(false);
      setNewSuppName('');
      setNewSuppPhone('');
      setNewSuppEmail('');
    } catch (err) {
      console.error(err);
    }
  };

  // 1. Submit Purchase Invoice
  const handlePurchaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (purPaymentMethod === 'credit' && !purSupplierId) {
      setMessage({ type: 'error', text: 'الرجاء اختيار مورد للشراء على الحساب (الآجل).' });
      return;
    }

    const invalidItems = purItems.some(i => !i.productId || i.quantity <= 0 || i.purchasePrice < 0);
    if (invalidItems) {
      setMessage({ type: 'error', text: 'الرجاء ملء بيانات جميع أصناف المشتريات بشكل صحيح.' });
      return;
    }

    setSubmitting(true);
    try {
      // Calculate subtotals and VAT
      const totalWithoutTax = PurchaseService.calculatePurchaseSubtotal(purItems);
      const taxRateVal = settings.taxRate || 15;
      const taxAmount = PurchaseService.calculatePurchaseTax(totalWithoutTax, taxRateVal);
      const grandTotal = PurchaseService.calculatePurchaseGrandTotal(totalWithoutTax, taxAmount);

      await PurchaseService.createPurchase({
        supplierId: purSupplierId || null,
        date: purDate,
        items: purItems,
        paymentMethod: purPaymentMethod,
        invoiceNumber: purInvoiceNumber,
        taxAmount,
        totalWithoutTax,
        grandTotal
      });

      setMessage({ type: 'success', text: `تم تسجيل فاتورة المشتريات رقم ${purInvoiceNumber} بنجاح وقيدها آلياً في الأستاذ العام.` });
      setPurItems([{ productId: '', purchasePrice: 0, quantity: 1 }]);
      setPurInvoiceNumber('PUR-' + Math.floor(100000 + Math.random() * 900000));
      await onRefreshData();
      await fetchSuppliers();
    } catch (err) {
      setMessage({ type: 'error', text: 'خطأ في الاتصال بالخادم.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Add line to purchase invoice
  const addPurItemLine = () => {
    setPurItems([...purItems, { productId: '', purchasePrice: 0, quantity: 1 }]);
  };

  // Remove line from purchase invoice
  const removePurItemLine = (index: number) => {
    if (purItems.length === 1) return;
    setPurItems(purItems.filter((_, i) => i !== index));
  };

  const updatePurItem = (index: number, field: keyof typeof purItems[0], value: any) => {
    const updated = [...purItems];
    if (field === 'productId') {
      updated[index].productId = value;
      // Auto populate purchase price
      const prod = products.find(p => p.id === value);
      if (prod) {
        updated[index].purchasePrice = prod.purchasePrice;
      }
    } else {
      updated[index][field] = Number(value);
    }
    setPurItems(updated);
  };

  // 2. Submit Customer Receipt Payment
  const handleCustomerReceiptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const amt = parseFloat(rcptAmount);
    if (!rcptCustomerId || isNaN(amt) || amt <= 0) {
      setMessage({ type: 'error', text: 'الرجاء اختيار العميل وتحديد مبلغ السند.' });
      return;
    }

    setSubmitting(true);
    try {
      await PaymentService.payCustomer({
        customerId: rcptCustomerId,
        amount: amt,
        paymentMethod: rcptPaymentMethod,
        date: rcptDate,
        receiptNumber: rcptNumber
      });

      setMessage({ type: 'success', text: `تم تسجيل سند قبض العميل بقيمة ${rcptAmount} ${settings.currency} وتخفيض حسابه آلياً.` });
      setRcptAmount('');
      setRcptNumber('RCPT-' + Math.floor(100000 + Math.random() * 900000));
      await onRefreshData();
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'خطأ في تسجيل سند القبض.' });
    } finally {
      setSubmitting(false);
    }
  };

  // 3. Submit Supplier Payment
  const handleSupplierPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const amt = parseFloat(payAmount);
    if (!paySupplierId || isNaN(amt) || amt <= 0) {
      setMessage({ type: 'error', text: 'الرجاء اختيار المورد وتحديد مبلغ السند.' });
      return;
    }

    setSubmitting(true);
    try {
      await PaymentService.paySupplier({
        supplierId: paySupplierId,
        amount: amt,
        paymentMethod: payPaymentMethod,
        date: payDate,
        paymentNumber: payNumber
      });

      setMessage({ type: 'success', text: `تم تسجيل سند صرف المورد بقيمة ${payAmount} ${settings.currency} وتخفيض مستحقاته بنجاح.` });
      setPayAmount('');
      setPayNumber('PAY-' + Math.floor(100000 + Math.random() * 900000));
      await onRefreshData();
      await fetchSuppliers();
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'خطأ في تسجيل سند الصرف.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Partner directory list
  const getFilteredPartners = () => {
    const list: { id: string; name: string; phone?: string; email?: string; balance: number; type: 'customer' | 'supplier' }[] = [];

    if (partnerType === 'all' || partnerType === 'customers') {
      customers.forEach(c => {
        list.push({ id: c.id, name: c.name, phone: c.phone, balance: c.balance, type: 'customer' });
      });
    }

    if (partnerType === 'all' || partnerType === 'suppliers') {
      suppliers.forEach(s => {
        list.push({ id: s.id, name: s.name, phone: s.phone, email: s.email, balance: s.balance, type: 'supplier' });
      });
    }

    return list.filter(p => p.name.includes(searchQuery) || (p.phone && p.phone.includes(searchQuery)));
  };

  const handleQuickCollect = (customerId: string) => {
    setRcptCustomerId(customerId);
    const cust = customers.find(c => c.id === customerId);
    if (cust) {
      setRcptAmount(Math.max(0, cust.balance).toString());
    }
    setActiveSubTab('customer_receipt');
  };

  const handleQuickPay = (supplierId: string) => {
    setPaySupplierId(supplierId);
    const supp = suppliers.find(s => s.id === supplierId);
    if (supp) {
      setPayAmount(Math.max(0, supp.balance).toString());
    }
    setActiveSubTab('supplier_payment');
  };

  return (
    <div className="space-y-6 text-right" dir="rtl" id="purchases-module">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm" id="purchases-header">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-2">
            <span className="p-2 bg-slate-900 text-white rounded-xl">
              <Receipt className="w-6 h-6" />
            </span>
            دورة المشتريات وإدارة الحسابات الجارية
          </h2>
          <p className="text-slate-500 text-xs mt-1.5 sm:text-sm">
            شراء الأصناف المباشرة، سداد الموردين، تحصيل مديونيات العملاء الآجلة، وتأثيراتها اللحظية على الخزينة ودفاتر الحسابات.
          </p>
        </div>

        <div className="flex gap-2.5">
          <button 
            onClick={() => setShowSupplierModal(true)}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            مورد جديد
          </button>
          <button 
            onClick={fetchSuppliers}
            className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Message Alert */}
      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 border ${
          message.type === 'success' 
            ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
            : 'bg-rose-50 border-rose-100 text-rose-800'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : <AlertTriangle className="w-5 h-5 flex-shrink-0" />}
          <span className="text-xs sm:text-sm font-bold">{message.text}</span>
        </div>
      )}

      {/* Sub Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-2.5" id="purchases-tabs">
        <button
          onClick={() => { setActiveSubTab('purchase_invoice'); setMessage(null); }}
          className={`pb-3 text-xs sm:text-sm font-extrabold transition whitespace-nowrap px-2.5 ${
            activeSubTab === 'purchase_invoice' ? 'border-b-2 border-slate-900 text-slate-900' : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <PlusCircle className="w-4 h-4" />
            <span>فاتورة مشتريات جديدة</span>
          </div>
        </button>

        <button
          onClick={() => { setActiveSubTab('customer_receipt'); setMessage(null); }}
          className={`pb-3 text-xs sm:text-sm font-extrabold transition whitespace-nowrap px-2.5 ${
            activeSubTab === 'customer_receipt' ? 'border-b-2 border-slate-900 text-slate-900' : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <ArrowUpRight className="w-4 h-4" />
            <span>سند قبض عميل (تحصيل)</span>
          </div>
        </button>

        <button
          onClick={() => { setActiveSubTab('supplier_payment'); setMessage(null); }}
          className={`pb-3 text-xs sm:text-sm font-extrabold transition whitespace-nowrap px-2.5 ${
            activeSubTab === 'supplier_payment' ? 'border-b-2 border-slate-900 text-slate-900' : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <ArrowDownLeft className="w-4 h-4" />
            <span>سند صرف مورد (سداد)</span>
          </div>
        </button>

        <button
          onClick={() => { setActiveSubTab('directory'); setMessage(null); }}
          className={`pb-3 text-xs sm:text-sm font-extrabold transition whitespace-nowrap px-2.5 ${
            activeSubTab === 'directory' ? 'border-b-2 border-slate-900 text-slate-900' : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            <span>الحسابات الجارية للشركاء</span>
          </div>
        </button>
      </div>

      {/* Render sub-tabs */}

      {/* 1. PURCHASE INVOICE */}
      {activeSubTab === 'purchase_invoice' && (
        <form onSubmit={handlePurchaseSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Supplier select */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500">المورد</label>
              <select
                value={purSupplierId}
                onChange={(e) => setPurSupplierId(e.target.value)}
                className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-slate-900 outline-none"
              >
                <option value="">-- عميل/شراء نقدي عام --</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name} (المستحق: {Number(s.balance || 0).toLocaleString()} {settings.currency})</option>
                ))}
              </select>
            </div>

            {/* Payment Method */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500">طريقة الدفع</label>
              <select
                value={purPaymentMethod}
                onChange={(e) => setPurPaymentMethod(e.target.value as 'cash' | 'card' | 'credit')}
                className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-slate-900 outline-none"
              >
                <option value="cash">نقداً (كاش الصندوق)</option>
                <option value="card">بنكي (الشبكة / الحساب البنكي)</option>
                <option value="credit">على الحساب (آجل للمورد)</option>
              </select>
            </div>

            {/* Reference Invoice Number */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500">رقم الفاتورة (المرجع)</label>
              <input
                type="text"
                value={purInvoiceNumber}
                onChange={(e) => setPurInvoiceNumber(e.target.value)}
                required
                className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs sm:text-sm focus:ring-2 focus:ring-slate-900 outline-none"
              />
            </div>

            {/* Date */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500">تاريخ القيد</label>
              <input
                type="date"
                value={purDate}
                onChange={(e) => setPurDate(e.target.value)}
                required
                className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-slate-900 outline-none"
              />
            </div>
          </div>

          <div className="border-t border-slate-100 my-4"></div>

          {/* Items Lines */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">الأصناف المشتراة وتعديل كميات المخزن</h4>
              <button
                type="button"
                onClick={addPurItemLine}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition"
              >
                + إضافة صنف
              </button>
            </div>

            {purItems.map((item, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-slate-50 p-4 rounded-xl relative border border-slate-100 items-end">
                {/* Select Product */}
                <div className="md:col-span-5 flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400">الصنف</label>
                  <select
                    value={item.productId}
                    onChange={(e) => updatePurItem(index, 'productId', e.target.value)}
                    required
                    className="p-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-slate-800"
                  >
                    <option value="">-- اختر الصنف --</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} (الحالي: {p.stock})</option>
                    ))}
                  </select>
                </div>

                {/* Purchase Price */}
                <div className="md:col-span-3 flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400">سعر تكلفة الشراء ({settings.currency})</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={item.purchasePrice || ''}
                    onChange={(e) => updatePurItem(index, 'purchasePrice', e.target.value)}
                    required
                    className="p-2 bg-white border border-slate-200 rounded-lg text-xs font-mono outline-none focus:ring-1 focus:ring-slate-800 text-left"
                  />
                </div>

                {/* Quantity */}
                <div className="md:col-span-3 flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400">الكمية المضافة</label>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity || ''}
                    onChange={(e) => updatePurItem(index, 'quantity', e.target.value)}
                    required
                    className="p-2 bg-white border border-slate-200 rounded-lg text-xs font-mono outline-none focus:ring-1 focus:ring-slate-800 text-left"
                  />
                </div>

                {/* Delete Button */}
                <div className="md:col-span-1 flex justify-center pb-0.5">
                  <button
                    type="button"
                    onClick={() => removePurItemLine(index)}
                    disabled={purItems.length === 1}
                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition disabled:opacity-30"
                  >
                    <Trash2Icon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-100 my-4"></div>

          {/* Subtotals & Calculations */}
          {(() => {
            let subtotal = 0;
            purItems.forEach(i => {
              subtotal += (i.purchasePrice || 0) * (i.quantity || 0);
            });
            const tax = subtotal * ((settings.taxRate || 15) / 100);
            const total = subtotal + tax;

            return (
              <div className="flex flex-col items-end gap-2 text-slate-700">
                <div className="flex justify-between w-full max-w-xs text-xs font-semibold">
                  <span>إجمالي المشتريات (غير خاضع للضريبة):</span>
                  <span className="font-mono font-bold">{subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })} {settings.currency}</span>
                </div>
                <div className="flex justify-between w-full max-w-xs text-xs text-slate-500">
                  <span>ضريبة القيمة المضافة المدخلة ({settings.taxRate || 15}%):</span>
                  <span className="font-mono">{tax.toLocaleString('en-US', { minimumFractionDigits: 2 })} {settings.currency}</span>
                </div>
                <div className="flex justify-between w-full max-w-xs text-sm font-black text-slate-900 border-t border-slate-100 pt-2 bg-slate-50 p-2 rounded-lg">
                  <span>صافي الفاتورة الكلي:</span>
                  <span className="font-mono">{total.toLocaleString('en-US', { minimumFractionDigits: 2 })} {settings.currency}</span>
                </div>
              </div>
            );
          })()}

          {/* Submit Action */}
          <div className="flex justify-end pt-3">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 bg-slate-950 hover:bg-slate-800 text-white font-extrabold text-xs sm:text-sm rounded-xl transition flex items-center gap-2 shadow"
            >
              <CheckCircle className="w-4 h-4" />
              {submitting ? 'جاري الحفظ والترحيل...' : 'اعتماد وترحيل فاتورة المشتريات آلياً'}
            </button>
          </div>
        </form>
      )}

      {/* 2. CUSTOMER RECEIPT ( قبض ) */}
      {activeSubTab === 'customer_receipt' && (
        <form onSubmit={handleCustomerReceiptSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 max-w-2xl mx-auto">
          <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
            <Coins className="w-5 h-5 text-emerald-600" />
            <h3 className="font-black text-slate-800 text-sm">سند قبض نقدي/بنكي من عميل (تحصيل ديون مبيعات آجل)</h3>
          </div>

          <div className="space-y-4">
            {/* Customer */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500">العميل المدين</label>
              <select
                value={rcptCustomerId}
                onChange={(e) => {
                  setRcptCustomerId(e.target.value);
                  const cust = customers.find(c => c.id === e.target.value);
                  if (cust) {
                    setRcptAmount(Math.max(0, cust.balance).toString());
                  }
                }}
                required
                className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-slate-900 outline-none"
              >
                <option value="">-- اختر العميل --</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name} (الرصيد المستحق عليه: {Number(c.balance || 0).toLocaleString()} {settings.currency})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Receipt Amount */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500">مبلغ سند القبض ({settings.currency})</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0.00"
                  value={rcptAmount}
                  onChange={(e) => setRcptAmount(e.target.value)}
                  className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs sm:text-sm text-left focus:ring-2 focus:ring-slate-900 outline-none"
                />
              </div>

              {/* Payment Method */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500">حساب الإيداع المستلم</label>
                <select
                  value={rcptPaymentMethod}
                  onChange={(e) => setRcptPaymentMethod(e.target.value as 'cash' | 'card')}
                  className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                >
                  <option value="cash">نقداً (الصندوق الرئيسي)</option>
                  <option value="card">بنك (الحساب الجاري للشركة)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Receipt Number */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500">رقم السند</label>
                <input
                  type="text"
                  value={rcptNumber}
                  onChange={(e) => setRcptNumber(e.target.value)}
                  required
                  className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs sm:text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                />
              </div>

              {/* Date */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500">تاريخ القيد</label>
                <input
                  type="date"
                  value={rcptDate}
                  onChange={(e) => setRcptDate(e.target.value)}
                  required
                  className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 my-4"></div>

          {/* Submit receipt */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm rounded-xl transition flex items-center gap-2 shadow-md shadow-emerald-100"
            >
              <Coins className="w-4 h-4" />
              {submitting ? 'جاري ترحيل السند...' : 'حفظ وترحيل سند القبض تلقائياً'}
            </button>
          </div>
        </form>
      )}

      {/* 3. SUPPLIER PAYMENT ( صرف ) */}
      {activeSubTab === 'supplier_payment' && (
        <form onSubmit={handleSupplierPaymentSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 max-w-2xl mx-auto">
          <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-rose-600" />
            <h3 className="font-black text-slate-800 text-sm">سند صرف نقدي/بنكي لمورد (سداد فواتير مشتريات آجل)</h3>
          </div>

          <div className="space-y-4">
            {/* Supplier */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500">المورد المستلم</label>
              <select
                value={paySupplierId}
                onChange={(e) => {
                  setPaySupplierId(e.target.value);
                  const supp = suppliers.find(s => s.id === e.target.value);
                  if (supp) {
                    setPayAmount(Math.max(0, supp.balance).toString());
                  }
                }}
                required
                className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-slate-900 outline-none"
              >
                <option value="">-- اختر المورد --</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name} (الرصيد الذي نطالب به: {Number(s.balance || 0).toLocaleString()} {settings.currency})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Payment Amount */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500">مبلغ سند الصرف ({settings.currency})</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0.00"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs sm:text-sm text-left focus:ring-2 focus:ring-slate-900 outline-none"
                />
              </div>

              {/* Payment Method */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500">مصدر السيولة المدفوعة</label>
                <select
                  value={payPaymentMethod}
                  onChange={(e) => setPayPaymentMethod(e.target.value as 'cash' | 'card')}
                  className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                >
                  <option value="cash">نقداً (كاش الصندوق الرئيسي)</option>
                  <option value="card">بنك (الحساب الجاري للشركة)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Payment Number */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500">رقم سند الصرف</label>
                <input
                  type="text"
                  value={payNumber}
                  onChange={(e) => setPayNumber(e.target.value)}
                  required
                  className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs sm:text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                />
              </div>

              {/* Date */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500">تاريخ القيد</label>
                <input
                  type="date"
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                  required
                  className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 my-4"></div>

          {/* Submit payment */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs sm:text-sm rounded-xl transition flex items-center gap-2 shadow-md shadow-rose-100"
            >
              <Wallet className="w-4 h-4" />
              {submitting ? 'جاري ترحيل السند...' : 'حفظ وترحيل سند الصرف تلقائياً'}
            </button>
          </div>
        </form>
      )}

      {/* 4. DIRECTORY & BALANCES */}
      {activeSubTab === 'directory' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 bg-white p-4 border border-slate-200 rounded-xl shadow-sm">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute right-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="ابحث عن العميل أو المورد أو رقم الهاتف..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-9 pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            {/* Filter partner type */}
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl text-xs">
              <button
                onClick={() => setPartnerType('all')}
                className={`px-3.5 py-1.5 rounded-lg font-bold transition ${partnerType === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                الكل
              </button>
              <button
                onClick={() => setPartnerType('customers')}
                className={`px-3.5 py-1.5 rounded-lg font-bold transition ${partnerType === 'customers' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                العملاء
              </button>
              <button
                onClick={() => setPartnerType('suppliers')}
                className={`px-3.5 py-1.5 rounded-lg font-bold transition ${partnerType === 'suppliers' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                الموردين
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 font-bold text-slate-500">
                    <th className="p-4">اسم العميل / المورد</th>
                    <th className="p-4">النوع</th>
                    <th className="p-4">الهاتف</th>
                    <th className="p-4 text-left">الرصيد الجاري الحالي</th>
                    <th className="p-4 text-center">إجراءات مالية سريعة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {getFilteredPartners().length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-10 text-center text-slate-400 font-medium">
                        لا يوجد جهات اتصال متطابقة مع شروط البحث الحالي.
                      </td>
                    </tr>
                  ) : (
                    getFilteredPartners().map(p => (
                      <tr key={`${p.type}-${p.id}`} className="hover:bg-slate-50/50 transition">
                        <td className="p-4 font-bold text-slate-800">
                          {p.name}
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                            p.type === 'customer' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'
                          }`}>
                            {p.type === 'customer' ? 'عميل مدين' : 'مورد دائن'}
                          </span>
                        </td>
                        <td className="p-4 font-mono font-bold text-slate-500">
                          {p.phone || '-'}
                        </td>
                        <td className={`p-4 font-mono font-black text-left ${
                          p.balance > 0 
                            ? p.type === 'customer' ? 'text-blue-600' : 'text-orange-600'
                            : 'text-slate-400'
                        }`}>
                          {parseFloat(p.balance.toString() || '0').toLocaleString('en-US', { minimumFractionDigits: 2 })} {settings.currency}
                          {p.balance > 0 && (
                            <span className="text-[10px] font-bold block mt-0.5 opacity-80">
                              {p.type === 'customer' ? '(نطالبه بالدفع)' : '(يطلب منا سداد)'}
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex justify-center gap-2">
                            {p.type === 'customer' ? (
                              <button
                                onClick={() => handleQuickCollect(p.id)}
                                disabled={p.balance <= 0}
                                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-40 disabled:hover:bg-emerald-50 text-emerald-700 font-extrabold text-[11px] rounded-lg transition"
                              >
                                تحصيل دفعة
                              </button>
                            ) : (
                              <button
                                onClick={() => handleQuickPay(p.id)}
                                disabled={p.balance <= 0}
                                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 disabled:opacity-40 disabled:hover:bg-rose-50 text-rose-700 font-extrabold text-[11px] rounded-lg transition"
                              >
                                سداد دفعة للمورد
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Inline Add Supplier Modal */}
      {showSupplierModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl p-6 relative">
            <h3 className="font-black text-slate-800 text-base mb-4 flex items-center gap-1.5">
              <Building className="w-5 h-5 text-slate-600" />
              إضافة مورد جديد للشركة
            </h3>
            
            <form onSubmit={handleAddSupplier} className="space-y-4 text-xs sm:text-sm">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500">اسم المورد أو الشركة المستوردة *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: مصنع الرياض للمشروبات"
                  value={newSuppName}
                  onChange={(e) => setNewSuppName(e.target.value)}
                  className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500">رقم الهاتف</label>
                <input
                  type="text"
                  placeholder="مثال: 0501234567"
                  value={newSuppPhone}
                  onChange={(e) => setNewSuppPhone(e.target.value)}
                  className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500">البريد الإلكتروني</label>
                <input
                  type="email"
                  placeholder="supplier@example.com"
                  value={newSuppEmail}
                  onChange={(e) => setNewSuppEmail(e.target.value)}
                  className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-slate-900 font-mono text-left"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowSupplierModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs"
                >
                  حفظ المورد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Sub components with exact names to satisfy strict eslint rule
function Trash2Icon(props: React.SVGProps<SVGSVGElement>) {
  return <Trash2 className={props.className} />;
}
