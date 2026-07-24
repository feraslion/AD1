import React, { useState, useEffect } from 'react';
import { Product, Customer, StoreSettings } from '../../types';
import { PurchaseService } from '../../services/PurchaseService';
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
  Trash2,
  PackageCheck,
  FileText,
  Truck,
  ArrowRightLeft,
  ChevronRight,
  ClipboardList,
  CheckCircle2,
  Clock,
  ExternalLink
} from 'lucide-react';

interface Supplier {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  balance: number;
}

interface PurchaseRequest {
  id: string;
  requestNumber: string;
  requesterName?: string;
  department?: string;
  date: string;
  requiredDate?: string;
  subtotal: number;
  taxAmount: number;
  grandTotal: number;
  currency: string;
  exchangeRate: number;
  status: 'draft' | 'pending' | 'approved' | 'converted' | 'rejected';
  notes?: string;
  supplierId?: string;
  supplierName?: string;
  items: {
    id?: string;
    productId?: string;
    productName: string;
    estimatedPrice: number;
    quantity: number;
    total: number;
  }[];
}

interface PurchaseOrder {
  id: string;
  purchaseNumber: string;
  supplierInvoiceNumber?: string;
  date: string;
  subtotal: number;
  taxAmount: number;
  grandTotal: number;
  status: 'draft' | 'ordered' | 'received' | 'completed' | 'cancelled';
  paymentMethod: 'cash' | 'card' | 'credit';
  supplierId?: string;
  supplierName?: string;
  supplierPhone?: string;
  warehouseId?: string;
  notes?: string;
  currency?: string;
  exchangeRate?: number;
  items: {
    id?: string;
    productId: string;
    productName?: string;
    purchasePrice: number;
    quantity: number;
    total: number;
    taxAmount?: number;
  }[];
}

interface PurchasesProps {
  products: Product[];
  customers: Customer[];
  settings: StoreSettings;
  onRefreshData: () => Promise<void>;
}

export default function Purchases({ products, customers, settings, onRefreshData }: PurchasesProps) {
  const [activeSubTab, setActiveSubTab] = useState<'requests' | 'orders' | 'purchase_invoice' | 'supplier_payment' | 'ledger' | 'directory'>('requests');
  
  // Data state
  const [requestsList, setRequestsList] = useState<PurchaseRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [purchasesList, setPurchasesList] = useState<PurchaseOrder[]>([]);
  const [loadingPurchases, setLoadingPurchases] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Multi-currency list
  const currenciesList = [
    { code: 'SAR', name: 'ريال سعودي', symbol: 'ر.س', rate: 1.0 },
    { code: 'USD', name: 'دولار أمريكي', symbol: '$', rate: 3.75 },
    { code: 'SYP', name: 'ليرة سورية', symbol: 'ل.س', rate: 13000 },
    { code: 'TRY', name: 'ليرة تركية', symbol: '₺', rate: 32.5 },
  ];

  // Directory & Search Search
  const [searchQuery, setSearchQuery] = useState('');
  const [partnerType, setPartnerType] = useState<'all' | 'customers' | 'suppliers'>('all');

  // Purchase Request Modal & Form
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [reqSupplierId, setReqSupplierId] = useState('');
  const [reqRequesterName, setReqRequesterName] = useState('إدارة المشتريات');
  const [reqDepartment, setReqDepartment] = useState('المخازن والمشتريات');
  const [reqDate, setReqDate] = useState(new Date().toISOString().split('T')[0]);
  const [reqRequiredDate, setReqRequiredDate] = useState(new Date().toISOString().split('T')[0]);
  const [reqCurrency, setReqCurrency] = useState('SAR');
  const [reqExchangeRate, setReqExchangeRate] = useState(1.0);
  const [reqNotes, setReqNotes] = useState('');
  const [reqItems, setReqItems] = useState<{ productId: string; productName: string; estimatedPrice: number; quantity: number }[]>([
    { productId: '', productName: '', estimatedPrice: 0, quantity: 1 }
  ]);

  // Supplier Add Modal
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [newSuppName, setNewSuppName] = useState('');
  const [newSuppPhone, setNewSuppPhone] = useState('');
  const [newSuppEmail, setNewSuppEmail] = useState('');

  // Purchase Order / Invoice Form State
  const [purSupplierId, setPurSupplierId] = useState('');
  const [purPaymentMethod, setPurPaymentMethod] = useState<'cash' | 'card' | 'credit'>('credit');
  const [purInvoiceNumber, setPurInvoiceNumber] = useState('');
  const [purDate, setPurDate] = useState(new Date().toISOString().split('T')[0]);
  const [purStatus, setPurStatus] = useState<'ordered' | 'completed'>('ordered');
  const [purCurrency, setPurCurrency] = useState('SAR');
  const [purExchangeRate, setPurExchangeRate] = useState(1.0);
  const [purNotes, setPurNotes] = useState('');
  const [purItems, setPurItems] = useState<{ productId: string; purchasePrice: number; quantity: number }[]>([
    { productId: '', purchasePrice: 0, quantity: 1 }
  ]);

  // Supplier Payment Form State
  const [paySupplierId, setPaySupplierId] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payPaymentMethod, setPayPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [payCurrency, setPayCurrency] = useState('SAR');
  const [payExchangeRate, setPayExchangeRate] = useState(1.0);
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payNumber, setPayNumber] = useState('');

  // Receiving Goods Modal State
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [selectedOrderForReceive, setSelectedOrderForReceive] = useState<PurchaseOrder | null>(null);
  const [receiveWarehouseId, setReceiveWarehouseId] = useState('wh_main');
  const [receiveNotes, setReceiveNotes] = useState('');
  const [receivingLoading, setReceivingLoading] = useState(false);

  // Supplier Invoice Posting Modal State
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<PurchaseOrder | null>(null);
  const [supplierInvoiceNo, setSupplierInvoiceNo] = useState('');
  const [invoicePayMethod, setInvoicePayMethod] = useState<'cash' | 'card' | 'credit'>('credit');
  const [invoicePostingLoading, setInvoicePostingLoading] = useState(false);

  // Supplier Ledger State
  const [selectedLedgerSupplierId, setSelectedLedgerSupplierId] = useState('');
  const [supplierLedgerData, setSupplierLedgerData] = useState<any | null>(null);
  const [ledgerLoading, setLedgerLoading] = useState(false);

  const fetchRequests = async () => {
    setLoadingRequests(true);
    try {
      const data = await PurchaseService.getPurchaseRequests();
      setRequestsList(data);
    } catch (e) {
      console.error('Error fetching purchase requests:', e);
    } finally {
      setLoadingRequests(false);
    }
  };

  const fetchSuppliers = async () => {
    setLoadingSuppliers(true);
    try {
      const data = await PurchaseService.getSuppliers();
      setSuppliers(data);
      if (data.length > 0 && !selectedLedgerSupplierId) {
        setSelectedLedgerSupplierId(data[0].id);
      }
    } catch (e) {
      console.error('Error fetching suppliers:', e);
    } finally {
      setLoadingSuppliers(false);
    }
  };

  const fetchPurchases = async () => {
    setLoadingPurchases(true);
    try {
      const data = await PurchaseService.getPurchases();
      setPurchasesList(data);
    } catch (e) {
      console.error('Error fetching purchases:', e);
    } finally {
      setLoadingPurchases(false);
    }
  };

  const fetchLedger = async (suppId: string) => {
    if (!suppId) return;
    setLedgerLoading(true);
    try {
      const res = await PurchaseService.getSupplierLedger(suppId);
      setSupplierLedgerData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLedgerLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchSuppliers();
    fetchPurchases();
    // Auto-generate reference numbers
    setPurInvoiceNumber('PO-' + Math.floor(100000 + Math.random() * 900000));
    setPayNumber('PAY-' + Math.floor(100000 + Math.random() * 900000));
  }, []);

  useEffect(() => {
    if (selectedLedgerSupplierId && activeSubTab === 'ledger') {
      fetchLedger(selectedLedgerSupplierId);
    }
  }, [selectedLedgerSupplierId, activeSubTab]);

  // Handle PR creation
  const handleCreatePRSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const invalidItems = reqItems.some(i => (!i.productId && !i.productName) || i.quantity <= 0);
    if (invalidItems) {
      setMessage({ type: 'error', text: 'الرجاء تحديد بيانات أصناف طلب الشراء بشكل صحيح.' });
      return;
    }

    setSubmitting(true);
    try {
      const subtotal = reqItems.reduce((sum, item) => sum + (item.estimatedPrice * item.quantity), 0);
      const taxRateVal = settings.taxRate || 15;
      const taxAmount = (subtotal * taxRateVal) / 100;
      const grandTotal = subtotal + taxAmount;

      await PurchaseService.createPurchaseRequest({
        supplierId: reqSupplierId || null,
        requesterName: reqRequesterName,
        department: reqDepartment,
        date: reqDate,
        requiredDate: reqRequiredDate,
        currency: reqCurrency,
        exchangeRate: reqExchangeRate,
        subtotal,
        taxAmount,
        grandTotal,
        notes: reqNotes,
        items: reqItems.map(i => {
          const prod = products.find(p => p.id === i.productId);
          return {
            productId: i.productId || null,
            productName: i.productName || (prod ? prod.name : 'صنف غير محدد'),
            estimatedPrice: i.estimatedPrice,
            quantity: i.quantity
          };
        })
      });

      setMessage({
        type: 'success',
        text: 'تم حفظ طلب الشراء بنجاح وهو في انتظار المراجعة والتحويل إلى أمر شراء.'
      });

      setShowRequestModal(false);
      setReqItems([{ productId: '', productName: '', estimatedPrice: 0, quantity: 1 }]);
      setReqNotes('');

      await fetchRequests();
      if (onRefreshData) await onRefreshData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'حدث خطأ أثناء حفظ طلب الشراء.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Convert Purchase Request to Purchase Order
  const handleConvertPRToOrder = async (prId: string) => {
    try {
      const res = await PurchaseService.convertRequestToOrder(prId);
      alert(`تم تحويل طلب الشراء إلى أمر شراء برقم (${res.purchaseNumber}) بنجاح!`);
      await fetchRequests();
      await fetchPurchases();
      if (onRefreshData) await onRefreshData();
    } catch (e: any) {
      alert(e.message || 'فشل تحويل طلب الشراء إلى أمر شراء');
    }
  };

  // Handle Supplier Creation
  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSuppName.trim()) return;

    try {
      const data = await PurchaseService.createSupplier({
        name: newSuppName,
        phone: newSuppPhone,
        email: newSuppEmail,
        balance: 0
      });

      await fetchSuppliers();
      if (data && data.id) {
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

  // Submit New Purchase Order / Invoice
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
        currency: purCurrency,
        exchangeRate: purExchangeRate,
        taxAmount,
        totalWithoutTax,
        grandTotal,
        status: purStatus, // 'ordered' (order) or 'completed' (direct invoice)
        notes: purNotes
      });

      setMessage({
        type: 'success',
        text: purStatus === 'ordered' 
          ? `تم إنشاء أمر الشراء رقم (${purInvoiceNumber}) بنجاح وفي انتظار الاستلام.`
          : `تم تسجيل فاتورة المشتريات رقم (${purInvoiceNumber}) وتحديث المخزون والقيد المحاسبي المزدوج آلياً.`
      });

      // Reset form
      setPurInvoiceNumber('PO-' + Math.floor(100000 + Math.random() * 900000));
      setPurNotes('');
      setPurItems([{ productId: '', purchasePrice: 0, quantity: 1 }]);

      await fetchSuppliers();
      await fetchPurchases();
      if (onRefreshData) await onRefreshData();
    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: err.message || 'حدث خطأ أثناء حفظ الشراء.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Execute Goods Receiving Note (إذن الاستلام المخزني)
  const handleReceiveGoods = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForReceive) return;

    setReceivingLoading(true);
    try {
      await PurchaseService.receiveGoods(selectedOrderForReceive.id, {
        warehouseId: receiveWarehouseId,
        notes: receiveNotes
      });

      alert(`تم تسجيل إذن الاستلام المخزني لأمر الشراء ${selectedOrderForReceive.purchaseNumber} وتحديث أرخص التكلفة والمخزون بنجاح!`);
      setShowReceiveModal(false);
      setSelectedOrderForReceive(null);
      setReceiveNotes('');

      await fetchPurchases();
      if (onRefreshData) await onRefreshData();
    } catch (e: any) {
      alert(e.message || 'فشل تسجيل إذن الاستلام المخزني');
    } finally {
      setReceivingLoading(false);
    }
  };

  // Post Supplier Invoice (إصدار فاتورة المورد والقيد المحاسبي)
  const handleIssueSupplierInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForInvoice) return;

    setInvoicePostingLoading(true);
    try {
      await PurchaseService.issueSupplierInvoice(selectedOrderForInvoice.id, {
        supplierInvoiceNumber: supplierInvoiceNo || selectedOrderForInvoice.purchaseNumber,
        paymentMethod: invoicePayMethod,
        date: new Date().toISOString().split('T')[0]
      });

      alert(`تم إنشاء فاتورة المورد وتطبيق القيد المحاسبي وتأكيد المستحقات بنجاح!`);
      setShowInvoiceModal(false);
      setSelectedOrderForInvoice(null);
      setSupplierInvoiceNo('');

      await fetchSuppliers();
      await fetchPurchases();
      if (onRefreshData) await onRefreshData();
    } catch (e: any) {
      alert(e.message || 'فشل إصدار فاتورة المورد');
    } finally {
      setInvoicePostingLoading(false);
    }
  };

  // Submit Supplier Payment Voucher
  const handleSupplierPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const numericAmount = parseFloat(payAmount);
    if (!paySupplierId || isNaN(numericAmount) || numericAmount <= 0) {
      setMessage({ type: 'error', text: 'الرجاء اختيار المورد وإدخال مبلغ صحيح لسند الصرف.' });
      return;
    }

    setSubmitting(true);
    try {
      await PurchaseService.paySupplier({
        supplierId: paySupplierId,
        amount: numericAmount,
        paymentMethod: payPaymentMethod,
        date: payDate,
        paymentNumber: payNumber
      });

      setMessage({ type: 'success', text: `تم تسجيل سند الصرف رقم (${payNumber}) بنجاح وتحديث رصيد المورد القائم.` });

      setPayAmount('');
      setPayNumber('PAY-' + Math.floor(100000 + Math.random() * 900000));

      await fetchSuppliers();
      if (onRefreshData) await onRefreshData();
    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: err.message || 'حدث خطأ أثناء تسجيل سند الصرف.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Helper calculation for new purchase order
  const purSubtotal = PurchaseService.calculatePurchaseSubtotal(purItems);
  const purTax = PurchaseService.calculatePurchaseTax(purSubtotal, settings.taxRate || 15);
  const purGrandTotal = PurchaseService.calculatePurchaseGrandTotal(purSubtotal, purTax);

  // Status Badge Renderer
  const renderStatusBadge = (status: PurchaseOrder['status']) => {
    switch (status) {
      case 'ordered':
        return (
          <span className="bg-amber-50 text-amber-800 border border-amber-200 text-xs px-2.5 py-1 rounded-lg font-bold inline-flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>أمر شراء معتمد (في انتظار الاستلام)</span>
          </span>
        );
      case 'received':
        return (
          <span className="bg-blue-50 text-blue-800 border border-blue-200 text-xs px-2.5 py-1 rounded-lg font-bold inline-flex items-center gap-1">
            <Truck className="w-3.5 h-3.5 text-blue-600" />
            <span>تم استلام البضائع (في انتظار الفلترة)</span>
          </span>
        );
      case 'completed':
        return (
          <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs px-2.5 py-1 rounded-lg font-bold inline-flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>مكتمل ومرحل محاسبياً</span>
          </span>
        );
      case 'draft':
        return (
          <span className="bg-slate-100 text-slate-700 border border-slate-200 text-xs px-2.5 py-1 rounded-lg font-bold">
            مسودة أمر شراء
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* PURCHASING LIFECYCLE STEPPER HEADER */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-black flex items-center gap-2">
              <Truck className="w-5 h-5 text-emerald-400" />
              <span>دورة المشتريات وإدارة الموردين الشاملة</span>
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              ربط متكامل من أمر الشراء ← الاستلام المخزني ← فاتورة المورد ← القيد المحاسبي المزدوج ← السداد
            </p>
          </div>
          <button
            onClick={() => setShowSupplierModal(true)}
            className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black px-4 py-2 rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>مورد جديد</span>
          </button>
        </div>

        {/* Workflow Visual Pipeline */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 pt-2 border-t border-slate-700/60 text-[11px] font-bold">
          <div className="bg-slate-800/80 p-2 rounded-xl border border-slate-700 text-center space-y-0.5">
            <span className="text-slate-400 text-[10px] block">1. طلب الشراء</span>
            <span className="text-cyan-400">PR Request</span>
          </div>
          <div className="bg-slate-800/80 p-2 rounded-xl border border-slate-700 text-center space-y-0.5">
            <span className="text-slate-400 text-[10px] block">2. المورد</span>
            <span className="text-emerald-400">Supplier</span>
          </div>
          <div className="bg-slate-800/80 p-2 rounded-xl border border-slate-700 text-center space-y-0.5">
            <span className="text-slate-400 text-[10px] block">3. أمر الشراء</span>
            <span className="text-amber-400">Purchase Order</span>
          </div>
          <div className="bg-slate-800/80 p-2 rounded-xl border border-slate-700 text-center space-y-0.5">
            <span className="text-slate-400 text-[10px] block">4. الاستلام</span>
            <span className="text-blue-400">Receiving</span>
          </div>
          <div className="bg-slate-800/80 p-2 rounded-xl border border-slate-700 text-center space-y-0.5">
            <span className="text-slate-400 text-[10px] block">5. المخزون</span>
            <span className="text-indigo-400">Inventory Update</span>
          </div>
          <div className="bg-slate-800/80 p-2 rounded-xl border border-slate-700 text-center space-y-0.5">
            <span className="text-slate-400 text-[10px] block">6. فاتورة المورد</span>
            <span className="text-purple-400">Supplier Invoice</span>
          </div>
          <div className="bg-slate-800/80 p-2 rounded-xl border border-slate-700 text-center space-y-0.5">
            <span className="text-slate-400 text-[10px] block">7. القيد المحاسبي</span>
            <span className="text-teal-400">Accounting Entry</span>
          </div>
          <div className="bg-slate-800/80 p-2 rounded-xl border border-slate-700 text-center space-y-0.5">
            <span className="text-slate-400 text-[10px] block">8. السداد</span>
            <span className="text-emerald-300">Payment</span>
          </div>
        </div>
      </div>

      {/* Main Sub Tabs */}
      <div className="flex border-b border-slate-200 gap-2 sm:gap-6 overflow-x-auto pb-1 text-xs sm:text-sm scrollbar-none">
        <button
          onClick={() => setActiveSubTab('requests')}
          className={`pb-3 font-extrabold transition whitespace-nowrap relative flex items-center gap-1.5 ${
            activeSubTab === 'requests' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>طلبات الشراء ({requestsList.length})</span>
          {activeSubTab === 'requests' && <div className="absolute bottom-0 right-0 left-0 h-0.5 bg-emerald-500 rounded-full"></div>}
        </button>

        <button
          onClick={() => setActiveSubTab('orders')}
          className={`pb-3 font-extrabold transition whitespace-nowrap relative flex items-center gap-1.5 ${
            activeSubTab === 'orders' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>أوامر الشراء ({purchasesList.length})</span>
          {activeSubTab === 'orders' && <div className="absolute bottom-0 right-0 left-0 h-0.5 bg-emerald-500 rounded-full"></div>}
        </button>

        <button
          onClick={() => setActiveSubTab('purchase_invoice')}
          className={`pb-3 font-extrabold transition whitespace-nowrap relative flex items-center gap-1.5 ${
            activeSubTab === 'purchase_invoice' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          <span>إصدار أمر / فاتورة شراء</span>
          {activeSubTab === 'purchase_invoice' && <div className="absolute bottom-0 right-0 left-0 h-0.5 bg-emerald-500 rounded-full"></div>}
        </button>

        <button
          onClick={() => setActiveSubTab('supplier_payment')}
          className={`pb-3 font-extrabold transition whitespace-nowrap relative flex items-center gap-1.5 ${
            activeSubTab === 'supplier_payment' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <ArrowUpRight className="w-4 h-4" />
          <span>سندات الصرف للموردين</span>
          {activeSubTab === 'supplier_payment' && <div className="absolute bottom-0 right-0 left-0 h-0.5 bg-emerald-500 rounded-full"></div>}
        </button>

        <button
          onClick={() => setActiveSubTab('ledger')}
          className={`pb-3 font-extrabold transition whitespace-nowrap relative flex items-center gap-1.5 ${
            activeSubTab === 'ledger' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>كشف حساب المورد</span>
          {activeSubTab === 'ledger' && <div className="absolute bottom-0 right-0 left-0 h-0.5 bg-emerald-500 rounded-full"></div>}
        </button>

        <button
          onClick={() => setActiveSubTab('directory')}
          className={`pb-3 font-extrabold transition whitespace-nowrap relative flex items-center gap-1.5 ${
            activeSubTab === 'directory' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>دليل الموردين والعملاء</span>
          {activeSubTab === 'directory' && <div className="absolute bottom-0 right-0 left-0 h-0.5 bg-emerald-500 rounded-full"></div>}
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertTriangle className="w-5 h-5 text-rose-600" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* SUB TAB 0: PURCHASE REQUESTS (طلبات الشراء) */}
      {activeSubTab === 'requests' && (
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
            <div>
              <h3 className="font-extrabold text-slate-800 text-base">سجل طلبات الشراء الداخلية (Purchase Requests)</h3>
              <p className="text-xs text-slate-400">إدارة طلبات الشراء الواردة من الأقسام والمستودع وتحويلها لأوامر شراء</p>
            </div>
            <button
              onClick={() => setShowRequestModal(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs sm:text-sm transition flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>طلب شراء جديد</span>
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs sm:text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                  <tr>
                    <th className="p-3.5">رقم الطلب</th>
                    <th className="p-3.5">التاريخ / الاحتياج</th>
                    <th className="p-3.5">الطالب / القسم</th>
                    <th className="p-3.5">المورد المقترح</th>
                    <th className="p-3.5">المبلغ التقديري</th>
                    <th className="p-3.5">العملة</th>
                    <th className="p-3.5">حالة الطلب</th>
                    <th className="p-3.5 text-center">الإجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {requestsList.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        لا توجد طلبات شراء مسجلة بالنظام بعد.
                      </td>
                    </tr>
                  ) : (
                    requestsList.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-3.5">
                          <div className="font-extrabold text-slate-900 font-mono">{req.requestNumber}</div>
                        </td>
                        <td className="p-3.5 font-mono text-slate-500">
                          <div>{req.date}</div>
                          {req.requiredDate && <div className="text-[10px] text-amber-600">مطلوب لغاية: {req.requiredDate}</div>}
                        </td>
                        <td className="p-3.5">
                          <div className="font-bold text-slate-800">{req.requesterName || 'غير محدد'}</div>
                          <div className="text-[10px] text-slate-400">{req.department}</div>
                        </td>
                        <td className="p-3.5 text-slate-700">{req.supplierName || 'غير محدد'}</td>
                        <td className="p-3.5 font-mono font-bold text-slate-900">
                          {req.grandTotal.toFixed(2)}
                        </td>
                        <td className="p-3.5 font-bold">
                          <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] text-slate-700">
                            {req.currency || 'SAR'} {req.exchangeRate && req.exchangeRate !== 1 ? `(${req.exchangeRate})` : ''}
                          </span>
                        </td>
                        <td className="p-3.5">
                          {req.status === 'converted' ? (
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs px-2.5 py-1 rounded-lg font-bold">
                              تم التحويل لأمر شراء
                            </span>
                          ) : req.status === 'approved' ? (
                            <span className="bg-blue-50 text-blue-700 border border-blue-200 text-xs px-2.5 py-1 rounded-lg font-bold">
                              معتمد
                            </span>
                          ) : (
                            <span className="bg-amber-50 text-amber-700 border border-amber-200 text-xs px-2.5 py-1 rounded-lg font-bold">
                              قيد المراجعة
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-center">
                          {req.status !== 'converted' ? (
                            <button
                              onClick={() => handleConvertPRToOrder(req.id)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-1 mx-auto"
                            >
                              <PlusCircle className="w-3.5 h-3.5" />
                              <span>تحويل لأمر شراء</span>
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400 font-bold">مكتمل</span>
                          )}
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

      {/* SUB TAB 1: PURCHASE ORDERS WORKFLOW LIST */}
      {activeSubTab === 'orders' && (
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
            <div>
              <h3 className="font-extrabold text-slate-800 text-base">سجل دورة المشتريات ومتابعة الأوامر</h3>
              <p className="text-xs text-slate-400">تتبع استلام الشحنات وتطبيق فواتير المورد والقيد المحاسبي المزدوج</p>
            </div>
            <button
              onClick={() => setActiveSubTab('purchase_invoice')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs sm:text-sm transition flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>إنشاء أمر شراء جديد</span>
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs sm:text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                  <tr>
                    <th className="p-3.5">رقم الأمر / الفاتورة</th>
                    <th className="p-3.5">التاريخ</th>
                    <th className="p-3.5">المورد</th>
                    <th className="p-3.5">المبلغ الإجمالي</th>
                    <th className="p-3.5">طريقة الدفع</th>
                    <th className="p-3.5">حالة الدورة المخزنية والمحاسبية</th>
                    <th className="p-3.5 text-center">إجراءات الدورة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {purchasesList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        لا توجد أوامر مشتريات مسجلة بالنظام بعد.
                      </td>
                    </tr>
                  ) : (
                    purchasesList.map((pur) => (
                      <tr key={pur.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-3.5">
                          <div className="font-extrabold text-slate-900 font-mono dir-ltr inline-block">{pur.purchaseNumber}</div>
                          {pur.supplierInvoiceNumber && pur.supplierInvoiceNumber !== pur.purchaseNumber && (
                            <div className="text-[11px] text-slate-400">فاتورة مورد: {pur.supplierInvoiceNumber}</div>
                          )}
                        </td>
                        <td className="p-3.5 font-mono text-slate-500">{pur.date}</td>
                        <td className="p-3.5 font-bold text-slate-800">{pur.supplierName || 'غير محدد'}</td>
                        <td className="p-3.5 font-black text-emerald-600 font-mono">
                          {pur.grandTotal} {settings.currency}
                        </td>
                        <td className="p-3.5">
                          <span className="bg-slate-100 text-slate-700 text-xs px-2.5 py-1 rounded-lg font-bold">
                            {pur.paymentMethod === 'credit' ? 'آجل (على الحساب)' : pur.paymentMethod === 'cash' ? 'نقداً' : 'بطاقة شبكة'}
                          </span>
                        </td>
                        <td className="p-3.5">
                          {renderStatusBadge(pur.status)}
                        </td>
                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {pur.status === 'ordered' && (
                              <button
                                onClick={() => {
                                  setSelectedOrderForReceive(pur);
                                  setShowReceiveModal(true);
                                }}
                                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-1 shadow-sm"
                              >
                                <PackageCheck className="w-3.5 h-3.5" />
                                <span>استلام بالمخزن</span>
                              </button>
                            )}

                            {(pur.status === 'ordered' || pur.status === 'received') && (
                              <button
                                onClick={() => {
                                  setSelectedOrderForInvoice(pur);
                                  setSupplierInvoiceNo(pur.supplierInvoiceNumber || pur.purchaseNumber);
                                  setInvoicePayMethod(pur.paymentMethod);
                                  setShowInvoiceModal(true);
                                }}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-1 shadow-sm"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <span>فاتورة المورد وقيد المشتريات</span>
                              </button>
                            )}

                            {pur.status === 'completed' && (
                              <span className="text-xs text-slate-400 font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                <span>مكتمل بالكامل</span>
                              </span>
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

      {/* SUB TAB 2: CREATE PURCHASE ORDER OR DIRECT INVOICE */}
      {activeSubTab === 'purchase_invoice' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-extrabold text-slate-800 text-base">إنشاء أمر شراء أو فاتورة مشتريات مباشرة</h3>
              <p className="text-xs text-slate-400">حدد المورد والمنتجات لتوجيهها إما كأمر شراء لمتابعة الاستلام أو فاتورة فورية</p>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-500">نوع المستند:</label>
              <select
                value={purStatus}
                onChange={(e) => setPurStatus(e.target.value as any)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800"
              >
                <option value="ordered">📋 أمر شراء معتمد (Purchase Order)</option>
                <option value="completed">⚡ فاتورة مشتريات مباشرة (استلام وقيد فوري)</option>
              </select>
            </div>
          </div>

          <form onSubmit={handlePurchaseSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">المورد</label>
                <select
                  value={purSupplierId}
                  onChange={(e) => setPurSupplierId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 focus:outline-none"
                >
                  <option value="">-- نقدي / بدون مورد محدد --</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name} (الرصيد: {s.balance} {settings.currency})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">طريقة الشراء والدفع</label>
                <select
                  value={purPaymentMethod}
                  onChange={(e) => setPurPaymentMethod(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 focus:outline-none"
                >
                  <option value="credit">آجل (على حساب المورد)</option>
                  <option value="cash">نقداً (خزينة)</option>
                  <option value="card">بطاقة / بنك</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">رقم أمر الشراء</label>
                <input
                  type="text"
                  value={purInvoiceNumber}
                  onChange={(e) => setPurInvoiceNumber(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono text-slate-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">التاريخ</label>
                <input
                  type="date"
                  value={purDate}
                  onChange={(e) => setPurDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono text-slate-700 focus:outline-none"
                />
              </div>
            </div>

            {/* Item Rows */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-slate-700 text-xs">أصناف الشراء</h4>
                <button
                  type="button"
                  onClick={() => setPurItems([...purItems, { productId: '', purchasePrice: 0, quantity: 1 }])}
                  className="text-emerald-600 hover:text-emerald-700 text-xs font-bold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>إضافة صنف</span>
                </button>
              </div>

              {purItems.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                  <div className="col-span-5">
                    <label className="block text-[10px] font-bold text-slate-400 mb-0.5">المنتج</label>
                    <select
                      value={item.productId}
                      onChange={(e) => {
                        const next = [...purItems];
                        const prod = products.find(p => p.id === e.target.value);
                        next[idx].productId = e.target.value;
                        if (prod) next[idx].purchasePrice = prod.purchasePrice || 0;
                        setPurItems(next);
                      }}
                      required
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none"
                    >
                      <option value="">-- اختر صنف الشراء --</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name} (التكلفة الحالية: {p.purchasePrice} {settings.currency})</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-3">
                    <label className="block text-[10px] font-bold text-slate-400 mb-0.5">سعر تكلفة الوحدة</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={item.purchasePrice}
                      onChange={(e) => {
                        const next = [...purItems];
                        next[idx].purchasePrice = parseFloat(e.target.value) || 0;
                        setPurItems(next);
                      }}
                      required
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white font-mono text-slate-700 focus:outline-none"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 mb-0.5">الكمية</label>
                    <input
                      type="number"
                      step="any"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => {
                        const next = [...purItems];
                        next[idx].quantity = parseFloat(e.target.value) || 1;
                        setPurItems(next);
                      }}
                      required
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white font-mono text-slate-700 focus:outline-none"
                    />
                  </div>

                  <div className="col-span-2 flex items-center justify-between pt-4">
                    <span className="font-bold font-mono text-slate-800">
                      {(item.purchasePrice * item.quantity).toFixed(2)}
                    </span>
                    {purItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setPurItems(purItems.filter((_, i) => i !== idx))}
                        className="text-rose-500 hover:text-rose-700 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Totals Summary */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-bold text-slate-700">
              <div className="flex gap-6">
                <div>
                  <span className="text-slate-400 block text-[10px]">المجموع قبل الضريبة</span>
                  <span className="font-mono text-base">{purSubtotal.toFixed(2)} {settings.currency}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">ضريبة القيمة المضافة ({settings.taxRate || 15}%)</span>
                  <span className="font-mono text-base text-amber-600">{purTax.toFixed(2)} {settings.currency}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">الإجمالي الشامل</span>
                  <span className="font-mono text-lg text-emerald-600">{purGrandTotal.toFixed(2)} {settings.currency}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{submitting ? 'جاري الحفظ...' : purStatus === 'ordered' ? 'تأكيد وإصدار أمر الشراء' : 'اعتماد وترحيل فاتورة المشتريات'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SUB TAB 3: SUPPLIER PAYMENT VOUCHERS */}
      {activeSubTab === 'supplier_payment' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-base">سند صرف وسداد مستحقات مورد (Payment Voucher)</h3>
              <p className="text-xs text-slate-400">خصم من رصيد المورد القائم وإنشاء قيد محاسبي تلقائي (مدينة للمورد / دائنة الخزينة أو البنك)</p>
            </div>
          </div>

          <form onSubmit={handleSupplierPaymentSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">اختر المورد المراد سداده</label>
              <select
                value={paySupplierId}
                onChange={(e) => setPaySupplierId(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 focus:outline-none"
              >
                <option value="">-- اختر المورد --</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name} (الرصيد المستحق الحالي: {s.balance} {settings.currency})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">طريقة السداد</label>
                <select
                  value={payPaymentMethod}
                  onChange={(e) => setPayPaymentMethod(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 focus:outline-none"
                >
                  <option value="cash">نقداً (من الصندوق / الخزينة)</option>
                  <option value="card">تحويل بنكي / بطاقة شبكة</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">مبلغ السداد</label>
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  placeholder="0.00"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono font-bold text-slate-700 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">رقم سند الصرف</label>
                <input
                  type="text"
                  value={payNumber}
                  onChange={(e) => setPayNumber(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono text-slate-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">التاريخ</label>
                <input
                  type="date"
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono text-slate-700 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-sm"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>{submitting ? 'جاري حفظ السند...' : 'اعتماد وتسجيل سند الصرف'}</span>
            </button>
          </form>
        </div>
      )}

      {/* SUB TAB 4: SUPPLIER LEDGER STATEMENT */}
      {activeSubTab === 'ledger' && (
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="font-extrabold text-slate-800 text-base">كشف حساب المورد (Supplier Statement of Account)</h3>
              <p className="text-xs text-slate-400">تتبع التسلسل الزمني لجميع فواتير المشتريات الآجلة وسندات الصرف ورصيد المستحقات</p>
            </div>

            <div className="w-full sm:w-72">
              <select
                value={selectedLedgerSupplierId}
                onChange={(e) => setSelectedLedgerSupplierId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
              >
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>
                    👤 {s.name} (الرصيد: {s.balance} {settings.currency})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {ledgerLoading ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400 text-sm">
              جاري تحميل كشف حساب المورد...
            </div>
          ) : supplierLedgerData ? (
            <div className="space-y-4">
              <div className="bg-slate-900 text-white rounded-2xl p-5 shadow flex flex-wrap justify-between items-center gap-4">
                <div>
                  <h4 className="font-extrabold text-lg text-emerald-400">{supplierLedgerData.supplier.name}</h4>
                  <p className="text-xs text-slate-400">هاتف: {supplierLedgerData.supplier.phone || 'غير مسجل'} | إيميل: {supplierLedgerData.supplier.email || 'غير مسجل'}</p>
                </div>
                <div className="text-left bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700">
                  <span className="block text-slate-400 text-[10px] font-bold">إجمالي رصيد المستحقات المتبقية</span>
                  <span className="font-black text-xl text-emerald-300 font-mono">
                    {supplierLedgerData.currentBalance.toFixed(2)} {settings.currency}
                  </span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                      <tr>
                        <th className="p-3">التاريخ</th>
                        <th className="p-3">نوع الحركة</th>
                        <th className="p-3">المرجع</th>
                        <th className="p-3">رقم فاتورة المورد</th>
                        <th className="p-3 text-emerald-600">مدين (سداد -)</th>
                        <th className="p-3 text-rose-600">دائن (مشتريات +)</th>
                        <th className="p-3 font-black text-slate-800">الرصيد التراكمي</th>
                        <th className="p-3">ملاحظات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {supplierLedgerData.ledgerLines.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-slate-400">
                            لا توجد حركات مسجلة في كشف حساب هذا المورد.
                          </td>
                        </tr>
                      ) : (
                        supplierLedgerData.ledgerLines.map((line: any) => (
                          <tr key={line.id} className="hover:bg-slate-50/80 transition">
                            <td className="p-3 font-mono text-slate-500">{line.date}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                                line.type === 'purchase_invoice' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
                              }`}>
                                {line.typeLabel}
                              </span>
                            </td>
                            <td className="p-3 font-mono text-slate-600">{line.reference}</td>
                            <td className="p-3 font-mono text-slate-600">{line.invoiceNumber}</td>
                            <td className="p-3 font-mono font-bold text-emerald-600">
                              {line.debit > 0 ? line.debit.toFixed(2) : '-'}
                            </td>
                            <td className="p-3 font-mono font-bold text-rose-600">
                              {line.credit > 0 ? line.credit.toFixed(2) : '-'}
                            </td>
                            <td className="p-3 font-mono font-black text-slate-900 bg-slate-50">
                              {line.runningBalance.toFixed(2)}
                            </td>
                            <td className="p-3 text-slate-400">{line.notes}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* SUB TAB 5: SUPPLIERS DIRECTORY */}
      {activeSubTab === 'directory' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center gap-2 flex-1 max-w-md bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="ابحث باسم المورد أو رقم الهاتف..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none text-xs sm:text-sm text-slate-700 focus:outline-none w-full"
              />
            </div>

            <button
              onClick={() => setShowSupplierModal(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs sm:text-sm transition flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة مورد جديد</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {suppliers
              .filter(s => !searchQuery || s.name.toLowerCase().includes(searchQuery.toLowerCase()) || (s.phone && s.phone.includes(searchQuery)))
              .map(s => (
                <div key={s.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3 relative hover:border-emerald-500/50 transition">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-bold">
                        <Building className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-800 text-base">{s.name}</h4>
                        <span className="text-xs text-slate-400 dir-ltr inline-block">{s.phone || 'لا يوجد هاتف'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-bold">رصيد المستحقات القائم:</span>
                    <span className="font-mono font-black text-emerald-600 text-sm">
                      {s.balance} {settings.currency}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedLedgerSupplierId(s.id);
                      setActiveSubTab('ledger');
                    }}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>عرض كشف الحساب والعمليات</span>
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* RECEIVING GOODS MODAL */}
      {showReceiveModal && selectedOrderForReceive && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                <PackageCheck className="w-5 h-5 text-blue-600" />
                <span>إذن استلام مخزني لأمر الشراء {selectedOrderForReceive.purchaseNumber}</span>
              </h3>
              <button onClick={() => setShowReceiveModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleReceiveGoods} className="space-y-4">
              <p className="text-xs text-slate-500">
                سيؤدي الاستلام لتسجيل كميات البضائع بالمستودع المحدد وتحديث متوسط تكلفة الشراء المرجح للأصناف آلياً.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">المستودع المستلم</label>
                <select
                  value={receiveWarehouseId}
                  onChange={(e) => setReceiveWarehouseId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-700"
                >
                  <option value="wh_main">المستودع الرئيسي (Main Warehouse)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">ملاحظات الاستلام</label>
                <input
                  type="text"
                  placeholder="مثال: تم الاستلام والتفتيش بسلامة"
                  value={receiveNotes}
                  onChange={(e) => setReceiveNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-700"
                />
              </div>

              <button
                type="submit"
                disabled={receivingLoading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition"
              >
                {receivingLoading ? 'جاري تحديث المخزون...' : 'تأكيد وإتمام الاستلام المخزني'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SUPPLIER INVOICE POSTING MODAL */}
      {showInvoiceModal && selectedOrderForInvoice && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                <span>إصدار فاتورة المورد والتسجيل المحاسبي</span>
              </h3>
              <button onClick={() => setShowInvoiceModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleIssueSupplierInvoice} className="space-y-4">
              <p className="text-xs text-slate-500">
                سيتم إصدار الفاتورة وتوليد القيد المحاسبي المزدوج الآلي لربط حساب المخزون وضريبة القيمة المضافة بمستحقات المورد.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">رقم فاتورة المورد</label>
                <input
                  type="text"
                  value={supplierInvoiceNo}
                  onChange={(e) => setSupplierInvoiceNo(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono text-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">طريقة الشراء / الدفع</label>
                <select
                  value={invoicePayMethod}
                  onChange={(e) => setInvoicePayMethod(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-700"
                >
                  <option value="credit">آجل (على حساب المورد +)</option>
                  <option value="cash">نقداً (من الخزينة)</option>
                  <option value="card">بنك / بطاقة شبكة</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={invoicePostingLoading}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition"
              >
                {invoicePostingLoading ? 'جاري الرحيل المحاسبي...' : 'اعتماد وترحيل القيد المحاسبي'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CREATE SUPPLIER MODAL */}
      {showSupplierModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-800 text-sm">إضافة مورد جديد</h3>
              <button onClick={() => setShowSupplierModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleAddSupplier} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">اسم الشركة / المورد</label>
                <input
                  type="text"
                  required
                  placeholder="شركة التوريدات العامة"
                  value={newSuppName}
                  onChange={(e) => setNewSuppName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">رقم الهاتف</label>
                <input
                  type="text"
                  placeholder="0500000000"
                  value={newSuppPhone}
                  onChange={(e) => setNewSuppPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">البريد الإلكتروني</label>
                <input
                  type="email"
                  placeholder="supplier@example.com"
                  value={newSuppEmail}
                  onChange={(e) => setNewSuppEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-700"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition"
              >
                حفظ بيانات المورد
              </button>
            </form>
          </div>
        </div>
      )}

      {/* NEW PURCHASE REQUEST MODAL */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                <span>إنشاء طلب شراء جديد (New Purchase Request)</span>
              </h3>
              <button onClick={() => setShowRequestModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleCreatePRSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">اسم الطالب</label>
                  <input
                    type="text"
                    value={reqRequesterName}
                    onChange={(e) => setReqRequesterName(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">القسم / الإدارة</label>
                  <input
                    type="text"
                    value={reqDepartment}
                    onChange={(e) => setReqDepartment(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">تاريخ الطلب</label>
                  <input
                    type="date"
                    value={reqDate}
                    onChange={(e) => setReqDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">تاريخ الاحتياج المطلوب</label>
                  <input
                    type="date"
                    value={reqRequiredDate}
                    onChange={(e) => setReqRequiredDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">المورد المقترح (اختياري)</label>
                  <select
                    value={reqSupplierId}
                    onChange={(e) => setReqSupplierId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-700"
                  >
                    <option value="">-- غير محدد --</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">العملة وسعر الصرف</label>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={reqCurrency}
                      onChange={(e) => {
                        const curr = e.target.value;
                        setReqCurrency(curr);
                        const found = currenciesList.find(c => c.code === curr);
                        if (found) setReqExchangeRate(found.rate);
                      }}
                      className="w-full px-2 py-2 border border-slate-200 rounded-xl text-xs text-slate-700 font-bold"
                    >
                      {currenciesList.map(c => (
                        <option key={c.code} value={c.code}>{c.name} ({c.code})</option>
                      ))}
                    </select>

                    <input
                      type="number"
                      step="any"
                      min="0.0001"
                      value={reqExchangeRate}
                      onChange={(e) => setReqExchangeRate(parseFloat(e.target.value) || 1)}
                      className="w-full px-2 py-2 border border-slate-200 rounded-xl text-xs font-mono text-slate-700"
                      placeholder="سعر الصرف"
                    />
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-extrabold text-slate-700">الأصناف والكميات المطلوبة</span>
                  <button
                    type="button"
                    onClick={() => setReqItems([...reqItems, { productId: '', productName: '', estimatedPrice: 0, quantity: 1 }])}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>إضافة صنف</span>
                  </button>
                </div>

                {reqItems.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2 rounded-xl">
                    <div className="col-span-5">
                      <select
                        value={item.productId}
                        onChange={(e) => {
                          const next = [...reqItems];
                          const prod = products.find(p => p.id === e.target.value);
                          next[idx].productId = e.target.value;
                          if (prod) {
                            next[idx].productName = prod.name;
                            next[idx].estimatedPrice = prod.purchasePrice || 0;
                          }
                          setReqItems(next);
                        }}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs"
                      >
                        <option value="">-- اختر صنف المخزون --</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-3">
                      <input
                        type="number"
                        step="any"
                        placeholder="السعر التقديري"
                        value={item.estimatedPrice}
                        onChange={(e) => {
                          const next = [...reqItems];
                          next[idx].estimatedPrice = parseFloat(e.target.value) || 0;
                          setReqItems(next);
                        }}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-mono"
                      />
                    </div>

                    <div className="col-span-2">
                      <input
                        type="number"
                        step="any"
                        placeholder="الكمية"
                        value={item.quantity}
                        onChange={(e) => {
                          const next = [...reqItems];
                          next[idx].quantity = parseFloat(e.target.value) || 1;
                          setReqItems(next);
                        }}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-mono"
                      />
                    </div>

                    <div className="col-span-2 text-center">
                      {reqItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setReqItems(reqItems.filter((_, i) => i !== idx))}
                          className="text-rose-500 hover:text-rose-700 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">ملاحظات أو مبررات طلب الشراء</label>
                <textarea
                  rows={2}
                  value={reqNotes}
                  onChange={(e) => setReqNotes(e.target.value)}
                  placeholder="مثال: استكمال النقص بمنتجات قسم الضيافة"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-700"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition"
              >
                {submitting ? 'جاري الحفظ...' : 'حفظ وإرسال طلب الشراء'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
