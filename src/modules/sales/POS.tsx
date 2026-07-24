import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Product, Category, Customer, CartItem, StoreSettings, Invoice } from '../../types';
import { 
  ShoppingCart, Search, Plus, Minus, Trash2, UserPlus, CreditCard, 
  DollarSign, Wallet, FileText, CheckCircle, X, Printer, QrCode, 
  Scan, AlertCircle, AlertTriangle, Wifi, WifiOff, RefreshCw, Settings, Calculator, 
  Zap, Percent, Tag, Scale, Volume2, Check, Monitor, RotateCcw, Lock, Unlock, Coins
} from 'lucide-react';
import { SalesService } from '../../services/SalesService';
import { playScannerSound } from '../../utils/audio';
import { generateZatcaQrDataUrl } from '../../utils/zatca';
import { OfflineQueue } from '../../utils/offlineQueue';
import { useBarcodeScanner } from '../../utils/scannerUtility';
import BarcodeScannerModal from './BarcodeScannerModal';

interface POSProps {
  products: Product[];
  categories: Category[];
  customers: Customer[];
  settings: StoreSettings;
  onAddInvoice: (invoice: Invoice) => void;
  onUpdateProductStock: (id: string, newStock: number) => void;
  onAddCustomer: (customer: Customer) => void;
}

export default function POS({ products, categories, customers, settings, onAddInvoice, onUpdateProductStock, onAddCustomer }: POSProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  
  // Discounts
  const [invoiceDiscount, setInvoiceDiscount] = useState<number>(0);
  const [invoiceDiscountType, setInvoiceDiscountType] = useState<'fixed' | 'percentage'>('fixed');

  // Scanner Modal & Fast Laser Mode
  const [showScannerModal, setShowScannerModal] = useState<boolean>(false);
  const [showScanner, setShowScanner] = useState<boolean>(false);
  const [scannerInput, setScannerInput] = useState<string>('');
  const [scanMessage, setScanMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [scalePrefix, setScalePrefix] = useState<string>('20'); // Standard Scale Barcode Prefix

  // Network / Offline State
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(OfflineQueue.getQueue().length);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Printer & Thermal Settings
  const [printerPaperWidth, setPrinterPaperWidth] = useState<'80mm' | '58mm'>(settings.thermalPrinterWidth || '80mm');
  const [autoPrintAfterCheckout, setAutoPrintAfterCheckout] = useState<boolean>(false);
  const [zatcaQrImage, setZatcaQrImage] = useState<string>('');

  // Payment State
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'credit' | 'split'>('cash');
  const [receivedCash, setReceivedCash] = useState<string>('');
  const [splitCashAmount, setSplitCashAmount] = useState<string>('');
  const [splitCardAmount, setSplitCardAmount] = useState<string>('');
  const [splitCreditAmount, setSplitCreditAmount] = useState<string>('');

  // Receipt & Thermal Modal State
  const [lastInvoice, setLastInvoice] = useState<Invoice | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);

  // Customer Quick Add Modal
  const [showCustomerModal, setShowCustomerModal] = useState<boolean>(false);
  const [newCustName, setNewCustName] = useState<string>('');
  const [newCustPhone, setNewCustPhone] = useState<string>('');

  // Multi-currency State
  const [posCurrency, setPosCurrency] = useState<string>(settings.currency || 'SAR');
  const [currencyRates] = useState<{ [key: string]: number }>({
    SAR: 1,
    USD: 3.75,
    EUR: 4.10,
    SYP: 13000,
    TRY: 32.5
  });

  // Cash Drawer & Shift State
  const [showCashDrawerModal, setShowCashDrawerModal] = useState<boolean>(false);
  const [cashDrawerOpen, setCashDrawerOpen] = useState<boolean>(false);
  const [shiftStartBalance] = useState<number>(500);
  const [shiftCurrentCash] = useState<number>(0);

  // Returns / Refunds State
  const [showReturnsModal, setShowReturnsModal] = useState<boolean>(false);
  const [returnSearchQuery, setReturnSearchQuery] = useState<string>('');
  const [selectedReturnInvoice, setSelectedReturnInvoice] = useState<Invoice | null>(null);
  const [returnQuantities, setReturnQuantities] = useState<{ [productId: string]: number }>({});
  const [isProcessingReturn, setIsProcessingReturn] = useState<boolean>(false);

  // Customer Display Modal State
  const [showCustomerDisplay, setShowCustomerDisplay] = useState<boolean>(false);

  // Fast Touch Numpad / Calculator Drawer
  const [showNumpad, setShowNumpad] = useState<boolean>(false);
  const [numpadValue, setNumpadValue] = useState<string>('');
  const [activeCartItemId, setActiveCartItemId] = useState<string | null>(null);

  const convertFromSAR = useCallback((amountInSAR: number, targetCurrency: string = posCurrency) => {
    const rate = currencyRates[targetCurrency] || 1;
    return amountInSAR / rate;
  }, [currencyRates, posCurrency]);

  const formatAmount = useCallback((amountInSAR: number) => {
    const converted = convertFromSAR(amountInSAR, posCurrency);
    return `${converted.toFixed(2)} ${posCurrency}`;
  }, [convertFromSAR, posCurrency]);

  const handleTriggerCashDrawer = () => {
    setCashDrawerOpen(true);
    playScannerSound('success');
    triggerScanMessage('🔓 تم إرسال نبضة فتح درج النقدية ESC/POS Pulse بنجاح', 'success');
    setTimeout(() => setCashDrawerOpen(false), 2000);
  };

  const triggerScanMessage = useCallback((text: string, type: 'success' | 'error' | 'info') => {
    setScanMessage({ text, type });
    setTimeout(() => setScanMessage(null), 3500);
  }, []);

  // Monitor network status online / offline
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      triggerScanMessage('🟢 تم استعادة الاتصال بالشبكة! يمكنك مزامنة الفواتير الآن.', 'success');
      handleSyncOfflineQueue();
    };
    const handleOffline = () => {
      setIsOnline(false);
      triggerScanMessage('🟠 تم الانقطاع عن الشبكة! يعمل النمط غير المتصل (أوفلاين) تلقائياً.', 'info');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [triggerScanMessage]);

  // Sync offline queue with server
  const handleSyncOfflineQueue = async () => {
    const queue = OfflineQueue.getQueue();
    if (queue.length === 0) return;

    setIsSyncing(true);
    const { syncedCount, failedCount } = await OfflineQueue.syncWithServer(async (inv) => {
      await SalesService.createInvoice(inv);
    });
    setIsSyncing(false);

    setPendingSyncCount(OfflineQueue.getQueue().length);
    if (syncedCount > 0) {
      triggerScanMessage(`✅ تمت مزامنة ${syncedCount} فاتورة معلقة مع الخادم بنجاح!`, 'success');
      playScannerSound('success');
    }
    if (failedCount > 0) {
      triggerScanMessage(`⚠️ تعذر مزامنة ${failedCount} فاتورة. سيتم المحاولة لاحقاً.`, 'error');
    }
  };

  // Cart operations
  const addToCart = useCallback((product: Product, quantity: number = 1) => {
    setCart(prevCart => {
      const existing = prevCart.find(item => item.id === product.id);
      if (existing) {
        const targetQty = existing.quantity + quantity;
        if (product.stock !== 999 && targetQty > product.stock) {
          playScannerSound('error');
          triggerScanMessage(`تنبيه: لا يوجد سوى ${product.stock} قطع في المخزون`, 'error');
          return prevCart;
        }
        return prevCart.map(item => 
          item.id === product.id ? { ...item, quantity: parseFloat(targetQty.toFixed(3)) } : item
        );
      } else {
        if (product.stock !== 999 && product.stock <= 0) {
          playScannerSound('error');
          triggerScanMessage(`المنتج غير متوفر بالمخزون`, 'error');
          return prevCart;
        }
        return [...prevCart, { id: product.id, product, quantity: parseFloat(quantity.toFixed(3)), discount: 0, discountType: 'percentage' }];
      }
    });
  }, [triggerScanMessage]);

  const updateQuantity = useCallback((id: string, qty: number) => {
    setCart(prevCart => {
      const item = prevCart.find(i => i.id === id);
      if (!item) return prevCart;

      if (qty <= 0) {
        return prevCart.filter(i => i.id !== id);
      }

      if (item.product.stock !== 999 && qty > item.product.stock) {
        playScannerSound('error');
        triggerScanMessage(`تنبيه: الحد الأقصى للمخزون هو ${item.product.stock}`, 'error');
        return prevCart;
      }

      return prevCart.map(i => i.id === id ? { ...i, quantity: parseFloat(qty.toFixed(3)) } : i);
    });
  }, [triggerScanMessage]);

  // Integrated USB / Bluetooth Barcode Scanner Utility
  const {
    config: scannerConfig,
    setConfig: setScannerConfig,
    scanHistory,
    clearHistory: clearScanHistory,
    processBarcode: handleBarcodeScan
  } = useBarcodeScanner({
    products,
    cart,
    onAddToCart: addToCart,
    onUpdateQuantity: updateQuantity,
    onScanMessage: triggerScanMessage,
    config: { scalePrefix }
  });

  const updateItemDiscount = (id: string, discount: number, type: 'fixed' | 'percentage') => {
    setCart(prev => prev.map(i => i.id === id ? { ...i, discount, discountType: type } : i));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(i => i.id !== id));
  };

  const clearCart = () => {
    setCart([]);
    setSelectedCustomer(null);
    setInvoiceDiscount(0);
  };

  // Calculations
  const subtotal = SalesService.calculateSubtotal(cart);
  const totalDiscount = SalesService.calculateTotalDiscount(subtotal, invoiceDiscount, invoiceDiscountType);
  const taxableAmount = SalesService.calculateTaxableAmount(subtotal, totalDiscount);
  const taxRate = settings.taxRate || 15;
  const taxAmount = SalesService.calculateTaxAmount(taxableAmount, taxRate);
  const grandTotal = SalesService.calculateGrandTotal(taxableAmount, taxAmount);

  // Handle quick customer creation
  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) return;
    const newCust: Customer = {
      id: `cust-${Date.now()}`,
      name: newCustName,
      phone: newCustPhone,
      balance: 0
    };
    onAddCustomer(newCust);
    setSelectedCustomer(newCust);
    setShowCustomerModal(false);
    setNewCustName('');
    setNewCustPhone('');
    triggerScanMessage(`تمت إضافة العميل "${newCust.name}" بنجاح`, 'success');
  };

  // Return / Refund Handlers
  const handleSearchReturnInvoice = async () => {
    if (!returnSearchQuery.trim()) return;
    try {
      const list = await SalesService.getInvoices();
      const found = (list || []).find((i: Invoice) => 
        i.invoiceNumber.toLowerCase().includes(returnSearchQuery.trim().toLowerCase()) ||
        i.id === returnSearchQuery.trim()
      );
      if (found) {
        setSelectedReturnInvoice(found);
        const initialQtys: { [key: string]: number } = {};
        found.items.forEach(item => {
          initialQtys[item.productId] = item.quantity;
        });
        setReturnQuantities(initialQtys);
        triggerScanMessage(`تم العثور على الفاتورة: ${found.invoiceNumber}`, 'success');
      } else {
        triggerScanMessage('لم يتم العثور على فاتورة بهذا الرقم', 'error');
      }
    } catch (err) {
      console.error('Error fetching invoices:', err);
    }
  };

  const handleExecuteReturn = async () => {
    if (!selectedReturnInvoice) return;
    setIsProcessingReturn(true);
    try {
      await SalesService.returnInvoice(selectedReturnInvoice.id);
      
      // Restore inventory stock locally
      selectedReturnInvoice.items.forEach(item => {
        const retQty = returnQuantities[item.productId] || item.quantity;
        const targetProd = products.find(p => p.id === item.productId);
        if (targetProd && targetProd.stock !== 999) {
          onUpdateProductStock(item.productId, targetProd.stock + retQty);
        }
      });

      triggerScanMessage(`✅ تم تسجيل إرجاع الفاتورة ${selectedReturnInvoice.invoiceNumber} وعكس القيد والمخزون بنجاح!`, 'success');
      setSelectedReturnInvoice(null);
      setReturnSearchQuery('');
      setShowReturnsModal(false);
      playScannerSound('success');
    } catch (err: any) {
      triggerScanMessage(err.message || 'فشل معالجة الإرجاع', 'error');
    } finally {
      setIsProcessingReturn(false);
    }
  };

  // Payment checkout opening
  const handleCheckout = () => {
    if (cart.length === 0) return;
    
    // Auto populate default amounts for split and cash
    setReceivedCash(grandTotal.toFixed(2));
    const half = (grandTotal / 2).toFixed(2);
    setSplitCashAmount(half);
    setSplitCardAmount((grandTotal - parseFloat(half)).toFixed(2));
    setSplitCreditAmount('0.00');
    
    if (paymentMethod === 'credit' && !selectedCustomer) {
      setPaymentMethod('cash');
    }
    
    setShowPaymentModal(true);
  };

  // Invoice submission with Offline Queue support & ZATCA QR Code
  const submitInvoice = async () => {
    const invoiceId = `inv-${Date.now()}`;
    const invoiceNo = `FT-${new Date().getFullYear()}${Math.floor(100000 + Math.random() * 900000)}`;

    let cashP = 0;
    let cardP = 0;
    let creditP = 0;

    if (paymentMethod === 'cash') {
      cashP = grandTotal;
    } else if (paymentMethod === 'card') {
      cardP = grandTotal;
    } else if (paymentMethod === 'credit') {
      creditP = grandTotal;
    } else if (paymentMethod === 'split') {
      cashP = parseFloat(splitCashAmount) || 0;
      cardP = parseFloat(splitCardAmount) || 0;
      creditP = parseFloat(splitCreditAmount) || 0;
    }

    const newInvoice: Invoice = {
      id: invoiceId,
      invoiceNumber: invoiceNo,
      date: new Date().toISOString(),
      items: SalesService.prepareInvoiceItems(cart, settings.taxRate),
      totalWithoutTax: parseFloat(taxableAmount.toFixed(2)),
      taxAmount: taxAmount,
      discountAmount: totalDiscount,
      grandTotal: grandTotal,
      paymentMethod: paymentMethod,
      paymentDetails: {
        cashAmount: cashP,
        cardAmount: cardP,
        creditAmount: creditP
      },
      status: paymentMethod === 'credit' ? 'unpaid' : creditP > 0 ? 'partially_paid' : 'paid',
      customerId: selectedCustomer?.id,
      customerName: selectedCustomer?.name || 'عميل نقدي سريع',
      taxNumber: settings.taxNumber,
      cashierName: 'أحمد الكاشير'
    };

    // Update stocks locally
    const lowStockAlerts: string[] = [];
    cart.forEach(item => {
      if (item.product.stock !== 999) {
        const newStock = Math.max(0, item.product.stock - item.quantity);
        onUpdateProductStock(item.product.id, newStock);
        if (newStock <= item.product.minStock && item.product.minStock > 0) {
          lowStockAlerts.push(`"${item.product.name}" (المتبقي: ${newStock})`);
        }
      }
    });

    // Generate ZATCA Phase-2 Base64 QR Code
    const qrDataUrl = await generateZatcaQrDataUrl(
      settings.name || 'متجرنا التجاري',
      settings.taxNumber || '300000000000003',
      newInvoice.date,
      newInvoice.grandTotal,
      newInvoice.taxAmount
    );
    setZatcaQrImage(qrDataUrl);

    // Save to App State / Backend or Enqueue if Offline
    if (isOnline) {
      onAddInvoice(newInvoice);
    } else {
      OfflineQueue.enqueue(newInvoice);
      onAddInvoice(newInvoice); // keep local UI reactive
      setPendingSyncCount(OfflineQueue.getQueue().length);
      triggerScanMessage('📦 تم حفظ الفاتورة محلياً (أوفلاين) وسوف تتم مزامنتها فور توفر الشبكة', 'info');
    }

    setLastInvoice(newInvoice);
    
    // Clear cart and close modal
    setCart([]);
    setSelectedCustomer(null);
    setInvoiceDiscount(0);
    setShowPaymentModal(false);
    
    // Trigger receipt modal
    setShowReceiptModal(true);

    if (autoPrintAfterCheckout) {
      setTimeout(() => window.print(), 300);
    }

    playScannerSound('success');

    if (lowStockAlerts.length > 0) {
      setTimeout(() => {
        triggerScanMessage(`⚠️ تنبيه المخزون: انخفض مخزون ${lowStockAlerts.join('، ')} عن حد الطلب!`, 'error');
      }, 1200);
    }
  };

  // Mock scan trigger
  const runMockScan = (product: Product) => {
    handleBarcodeScan(product.barcode);
  };

  // Filter products by category and search
  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch = p.name.includes(searchQuery) || p.barcode.includes(searchQuery);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-120px)]">
      {/* Top Status & POS Command Bar */}
      <div className="bg-slate-900 text-white rounded-2xl p-3 px-4 shadow-sm border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Connection Status & Offline Queue Indicator */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {isOnline ? (
            <div className="flex items-center gap-1.5 bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 px-3 py-1.5 rounded-xl font-bold">
              <Wifi className="w-4 h-4 animate-pulse text-emerald-400" />
              <span>أونلاين</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-amber-950/90 border border-amber-500/50 text-amber-300 px-3 py-1.5 rounded-xl font-bold animate-pulse">
              <WifiOff className="w-4 h-4 text-amber-400" />
              <span>أوفلاين (محلي)</span>
            </div>
          )}

          {pendingSyncCount > 0 && (
            <button
              onClick={handleSyncOfflineQueue}
              disabled={!isOnline || isSyncing}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-xl font-bold transition disabled:opacity-50"
              title="مزامنة الفواتير غير المحفوظة بالخادم"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>مزامنة ({pendingSyncCount})</span>
            </button>
          )}

          {/* Multi-Currency Selector */}
          <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-xl">
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400 font-bold hidden sm:inline">العملة:</span>
            <select
              value={posCurrency}
              onChange={(e) => setPosCurrency(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-amber-400 rounded px-2 py-0.5 font-bold focus:outline-none text-[11px]"
            >
              <option value="SAR">SAR (ر.س)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="SYP">SYP (ل.س)</option>
              <option value="TRY">TRY (₺)</option>
            </select>
          </div>
        </div>

        {/* Professional Hardware Tools: Cash Drawer, Returns, Customer Display, Thermal Printer */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Cash Drawer Button */}
          <button
            onClick={handleTriggerCashDrawer}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition border ${
              cashDrawerOpen
                ? 'bg-emerald-600 border-emerald-400 text-white animate-bounce'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
            }`}
            title="فتح درج النقدية يدوياً"
          >
            <Unlock className="w-3.5 h-3.5 text-emerald-400" />
            <span>درج النقدية 🔓</span>
          </button>

          {/* Shift Cash Balance Modal Trigger */}
          <button
            onClick={() => setShowCashDrawerModal(true)}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-3 py-1.5 rounded-xl font-bold text-xs transition"
            title="تقرير الصندوق والوردية"
          >
            <DollarSign className="w-3.5 h-3.5 text-amber-400" />
            <span>الوردية</span>
          </button>

          {/* Sales Return / Refund Button */}
          <button
            onClick={() => setShowReturnsModal(true)}
            className="flex items-center gap-1.5 bg-rose-950/80 hover:bg-rose-900 border border-rose-800/60 text-rose-300 px-3 py-1.5 rounded-xl font-bold text-xs transition"
            title="إرجاع واسترداد فاتورة مبيعات"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
            <span>مرتجع الفواتير</span>
          </button>

          {/* Customer Dual Screen Display Button */}
          <button
            onClick={() => setShowCustomerDisplay(true)}
            className="flex items-center gap-1.5 bg-blue-950/80 hover:bg-blue-900 border border-blue-800/60 text-blue-300 px-3 py-1.5 rounded-xl font-bold text-xs transition"
            title="شاشة العرض الثانوية المزدوجة للعميل"
          >
            <Monitor className="w-3.5 h-3.5 text-blue-400" />
            <span>شاشة العميل 🖥️</span>
          </button>

          {/* Quick Thermal Printer Settings */}
          <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-xl">
            <Printer className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={printerPaperWidth}
              onChange={(e) => setPrinterPaperWidth(e.target.value as '80mm' | '58mm')}
              className="bg-slate-900 border border-slate-700 text-white rounded px-2 py-0.5 font-bold focus:outline-none text-[11px]"
            >
              <option value="80mm">80mm</option>
              <option value="58mm">58mm</option>
            </select>
          </div>

          <label className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-xl cursor-pointer hover:bg-slate-700 transition">
            <input
              type="checkbox"
              checked={autoPrintAfterCheckout}
              onChange={(e) => setAutoPrintAfterCheckout(e.target.checked)}
              className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0 w-3.5 h-3.5"
            />
            <span className="font-semibold text-slate-300 hidden md:inline">طباعة تلقائية</span>
          </label>
        </div>
      </div>

      {/* Main Grid: Products Catalog vs Shopping Cart */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 flex-1 overflow-hidden">
        {/* Products Catalog - 7 cols */}
        <div className="xl:col-span-7 flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden h-full">
          {/* Search & Scanner Controls */}
          <div className="p-4 bg-slate-50/80 border-b border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row gap-2.5">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="absolute right-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث بالاسم أو الباركود... (أو امسح بالليزر مباشرة)"
                  className="w-full pr-10 pl-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 placeholder-slate-400"
                />
              </div>

              {/* Laser Scanner & Touch Keypad Buttons */}
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowScannerModal(true)}
                  className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                  title="إدارة وحدة القارئ الضوئي USB / Bluetooth"
                >
                  <Scan className="w-4 h-4 text-white animate-pulse" />
                  <span>القارئ الضوئي ⚡</span>
                </button>

                <button 
                  onClick={() => setShowScanner(!showScanner)}
                  className={`flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                    showScanner ? 'bg-emerald-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-white'
                  }`}
                  title="شريط القارئ السريع"
                >
                  <Zap className="w-4 h-4" />
                  <span>شريط سريع</span>
                </button>

                <button
                  onClick={() => setShowNumpad(!showNumpad)}
                  className="flex items-center justify-center gap-1 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold transition"
                  title="لوحة أرقام سريعة"
                >
                  <Calculator className="w-4 h-4" />
                  <span>آلة حاسبة</span>
                </button>
              </div>
            </div>

            {/* Barcode Simulator Drawer */}
            {showScanner && (
              <div className="bg-slate-900 text-white p-3.5 rounded-xl border border-slate-700 space-y-3 shadow-inner text-xs animate-fade-in">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span className="font-bold text-slate-200">أداة مسح الباركود السريعة وميزان الأغذية</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-mono">بادئة الميزان:</span>
                    <input 
                      type="text" 
                      value={scalePrefix}
                      onChange={(e) => setScalePrefix(e.target.value)}
                      className="w-10 bg-slate-800 border border-slate-700 text-center rounded text-[11px] font-mono text-emerald-400 font-bold"
                    />
                    <button onClick={() => setShowScanner(false)} className="text-slate-400 hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {products.slice(0, 8).map(p => (
                    <button
                      key={p.id}
                      onClick={() => runMockScan(p)}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-emerald-600 border border-slate-700 text-[11px] rounded-lg transition text-right"
                    >
                      <div className="font-bold">{p.name}</div>
                      <div className="text-[9px] text-slate-400 font-mono">{p.barcode}</div>
                    </button>
                  ))}
                  {/* Mock Scale Barcode Button */}
                  <button
                    onClick={() => handleBarcodeScan(`${scalePrefix}00001015003`)}
                    className="px-2.5 py-1.5 bg-amber-950/80 border border-amber-600 text-amber-300 text-[11px] rounded-lg hover:bg-amber-800 transition"
                  >
                    <div className="font-bold">⚖️ ميزان تجريبي (1.5 كجم)</div>
                    <div className="text-[9px] font-mono">{scalePrefix}00001015003</div>
                  </button>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="ادخل الباركود يدوياً واضغط Enter..."
                    value={scannerInput}
                    onChange={(e) => setScannerInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleBarcodeScan(scannerInput);
                        setScannerInput('');
                      }
                    }}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-left font-mono text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <button 
                    onClick={() => {
                      handleBarcodeScan(scannerInput);
                      setScannerInput('');
                    }}
                    className="px-4 bg-emerald-600 text-white font-bold rounded-lg text-xs hover:bg-emerald-500 transition"
                  >
                    إدخال
                  </button>
                </div>
              </div>
            )}

            {/* Notification Toast Message */}
            {scanMessage && (
              <div className={`p-3 rounded-xl text-xs font-bold flex items-center justify-between gap-2 shadow-sm animate-fade-in ${
                scanMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                scanMessage.type === 'error' ? 'bg-rose-50 text-rose-800 border border-rose-200' :
                'bg-indigo-50 text-indigo-800 border border-indigo-200'
              }`}>
                <div className="flex items-center gap-2">
                  {scanMessage.type === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-600" /> :
                   scanMessage.type === 'error' ? <AlertCircle className="w-4 h-4 text-rose-600" /> :
                   <Wifi className="w-4 h-4 text-indigo-600" />}
                  <span>{scanMessage.text}</span>
                </div>
                <button onClick={() => setScanMessage(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Category Tabs */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  selectedCategory === 'all' 
                    ? 'bg-emerald-600 text-white shadow-sm' 
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                📂 الكل ({products.length})
              </button>
              {categories.map(cat => {
                const count = products.filter(p => p.category === cat.id).length;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                      selectedCategory === cat.id 
                        ? 'bg-emerald-600 text-white shadow-sm' 
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {cat.icon} {cat.name} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Catalog Grid */}
          <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50">
            {filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-52 text-slate-400 space-y-2">
                <Search className="w-12 h-12 text-slate-300" />
                <p className="font-bold text-sm">لا توجد منتجات مطابقة للبحث</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {filteredProducts.map(p => {
                  const isOutOfStock = p.stock <= 0 && p.minStock > 0;
                  const isLowStock = p.stock <= p.minStock && p.stock > 0 && p.minStock > 0;
                  return (
                    <button
                      key={p.id}
                      disabled={isOutOfStock}
                      onClick={() => addToCart(p)}
                      className={`bg-white border rounded-xl p-3 text-right flex flex-col justify-between h-36 transition hover:shadow-md hover:border-emerald-400 relative group active:scale-[0.98] ${
                        isOutOfStock ? 'opacity-50 cursor-not-allowed border-rose-200 bg-rose-50/20' : 'border-slate-200'
                      }`}
                    >
                      {/* Floating badges */}
                      {isOutOfStock && (
                        <span className="absolute top-2 left-2 px-1.5 py-0.5 bg-rose-600 text-white text-[9px] rounded font-bold">منتهي</span>
                      )}
                      {isLowStock && (
                        <span className="absolute top-2 left-2 px-1.5 py-0.5 bg-amber-500 text-white text-[9px] rounded font-bold">منخفض</span>
                      )}

                      <div>
                        <div className="text-[10px] text-slate-400 font-semibold mb-0.5 font-mono">{p.barcode}</div>
                        <h4 className="font-bold text-slate-800 text-xs sm:text-sm line-clamp-2 leading-snug">{p.name}</h4>
                      </div>

                      <div className="mt-2 flex justify-between items-end w-full border-t border-slate-100 pt-2">
                        <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded font-bold text-slate-500">{p.unit}</span>
                        <div className="font-extrabold text-emerald-600 text-xs sm:text-sm font-mono">
                          {p.price.toFixed(2)} <span className="text-[10px] font-bold text-slate-400">{settings.currency}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Shopping Cart Drawer - 5 cols */}
        <div className="xl:col-span-5 flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden h-full">
          {/* Cart Header */}
          <div className="p-3.5 bg-[#1e293b] text-white flex justify-between items-center border-b border-slate-700">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-sm">سلة الفاتورة الحالية ({cart.length})</h3>
            </div>
            {cart.length > 0 && (
              <button 
                onClick={clearCart}
                className="text-xs text-rose-300 font-bold hover:text-rose-100 flex items-center gap-1 bg-rose-950/50 border border-rose-800/40 px-2.5 py-1 rounded-lg transition"
              >
                <Trash2 className="w-3.5 h-3.5" /> تفريغ
              </button>
            )}
          </div>

          {/* Customer Selection bar */}
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex gap-2 items-center">
            <select
              value={selectedCustomer ? selectedCustomer.id : ''}
              onChange={(e) => {
                const c = customers.find(cust => cust.id === e.target.value);
                setSelectedCustomer(c || null);
              }}
              className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">👤 عميل نقدي سريع (افتراضي)</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  👤 {c.name} {c.phone ? `(${c.phone})` : ''} {c.balance > 0 ? `[آجل: ${c.balance} ر.س]` : ''}
                </option>
              ))}
            </select>

            <button 
              onClick={() => setShowCustomerModal(true)}
              className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-xl hover:bg-emerald-100 transition"
              title="إضافة عميل جديد"
            >
              <UserPlus className="w-4 h-4" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50/30">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-2 py-10">
                <ShoppingCart className="w-14 h-14 text-slate-200" />
                <p className="font-bold text-xs text-slate-400">سلة الفاتورة فارغة</p>
                <p className="text-[11px] text-slate-400">امسح الباركود أو انقر على صنف لإضافته</p>
              </div>
            ) : (
              cart.map(item => {
                let itemPrice = item.product.price * item.quantity;
                let itemDiscount = 0;
                if (item.discount > 0) {
                  if (item.discountType === 'percentage') {
                    itemDiscount = itemPrice * (item.discount / 100);
                  } else {
                    itemDiscount = item.discount * item.quantity;
                  }
                }
                const netItemPrice = itemPrice - itemDiscount;

                return (
                  <div key={item.id} className="p-3 bg-white border border-slate-200 rounded-xl flex justify-between items-start gap-2 hover:border-slate-300 transition shadow-2xs">
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-slate-800 text-xs line-clamp-2 leading-snug">{item.product.name}</h4>
                        <button 
                          onClick={() => removeFromCart(item.id)}
                          className="text-slate-300 hover:text-rose-500 p-0.5 transition"
                          title="حذف"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      
                      {/* Price & Unit Details */}
                      <div className="text-[11px] text-slate-500 flex items-center gap-2">
                        <span>سعر الوحدة: {item.product.price.toFixed(2)}</span>
                        <span>•</span>
                        <span>{item.product.unit}</span>
                      </div>

                      {/* Item-level Discount Control */}
                      <div className="flex items-center gap-1.5 mt-1 pt-1 border-t border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-0.5">
                          <Tag className="w-3 h-3" /> خصم:
                        </span>
                        <input 
                          type="number"
                          min="0"
                          placeholder="0"
                          value={item.discount || ''}
                          onChange={(e) => updateItemDiscount(item.id, Math.max(0, parseFloat(e.target.value) || 0), item.discountType)}
                          className="w-12 text-center bg-slate-50 border border-slate-200 rounded text-xs py-0.5 px-1 font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold"
                        />
                        <select
                          value={item.discountType}
                          onChange={(e) => updateItemDiscount(item.id, item.discount, e.target.value as 'fixed' | 'percentage')}
                          className="bg-slate-50 border border-slate-200 rounded text-[10px] py-0.5 px-0.5 text-slate-600 focus:outline-none font-bold"
                        >
                          <option value="percentage">%</option>
                          <option value="fixed">{settings.currency}</option>
                        </select>
                      </div>
                    </div>

                    {/* Quantity Adjustment Controls & Net Subtotal */}
                    <div className="flex flex-col items-end justify-between h-full space-y-2 min-w-[90px]">
                      <div className="text-xs font-extrabold text-emerald-600 font-mono">
                        {netItemPrice.toFixed(2)} {settings.currency}
                      </div>

                      <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1 text-slate-600 hover:bg-white rounded transition"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <input
                          type="number"
                          step="0.01"
                          min="0.001"
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.id, parseFloat(e.target.value) || 0)}
                          className="w-10 text-center font-extrabold text-xs text-slate-800 font-mono bg-transparent border-none p-0 focus:outline-none"
                        />
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1 text-slate-600 hover:bg-white rounded transition"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Cart Totals & General Discount Box */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-2">
            {/* General Invoice Discount */}
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-600 font-bold flex items-center gap-1">
                <Percent className="w-3.5 h-3.5 text-emerald-600" /> خصم إجمالي على الفاتورة:
              </span>
              <div className="flex items-center gap-1.5">
                <input 
                  type="number"
                  min="0"
                  placeholder="0"
                  value={invoiceDiscount || ''}
                  onChange={(e) => setInvoiceDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-16 text-center bg-white border border-slate-300 rounded-lg text-xs py-1 px-1.5 font-mono font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <select
                  value={invoiceDiscountType}
                  onChange={(e) => setInvoiceDiscountType(e.target.value as 'fixed' | 'percentage')}
                  className="bg-white border border-slate-300 rounded-lg text-xs py-1 px-1 text-slate-700 font-bold focus:outline-none"
                >
                  <option value="fixed">{settings.currency}</option>
                  <option value="percentage">%</option>
                </select>
              </div>
            </div>

            <div className="border-t border-slate-200 my-1"></div>

            <div className="flex justify-between text-xs text-slate-600">
              <span>المجموع قبل الضريبة:</span>
              <span className="font-mono font-bold">{formatAmount(taxableAmount)}</span>
            </div>

            <div className="flex justify-between text-xs text-slate-600">
              <span>ضريبة القيمة المضافة ({taxRate}%):</span>
              <span className="font-mono font-bold">{formatAmount(taxAmount)}</span>
            </div>

            {totalDiscount > 0 && (
              <div className="flex justify-between text-xs text-rose-600 font-bold">
                <span>إجمالي الخصم:</span>
                <span className="font-mono">-{formatAmount(totalDiscount)}</span>
              </div>
            )}

            <div className="flex justify-between text-sm font-extrabold text-slate-800 pt-2 border-t border-slate-300">
              <span>الإجمالي النهائي المستحق:</span>
              <span className="font-mono text-emerald-600 text-base sm:text-lg">{formatAmount(grandTotal)}</span>
            </div>

            {/* Quick Action Checkout Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button 
                disabled={cart.length === 0}
                onClick={() => {
                  setPaymentMethod('cash');
                  handleCheckout();
                }}
                className="py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow transition disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                💵 كاش سريع
              </button>

              <button 
                disabled={cart.length === 0}
                onClick={() => {
                  setPaymentMethod('card');
                  handleCheckout();
                }}
                className="py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow transition disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                💳 اختيار طريقة الدفع
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Options Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden text-right">
            <div className="p-4 bg-[#1e293b] text-white flex justify-between items-center border-b border-slate-700">
              <h3 className="font-bold text-base flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-400" />
                <span>إتمام عملية الدفع والفوترة</span>
              </h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Grand Total Highlight */}
              <div className="bg-slate-900 text-white rounded-xl p-3 text-center space-y-0.5">
                <div className="text-slate-400 text-[11px] font-bold">إجمالي المبلغ المطلوب</div>
                <div className="text-2xl font-black font-mono text-emerald-400">
                  {grandTotal.toFixed(2)} {settings.currency}
                </div>
              </div>

              {/* Payment Method Selector Grid */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 block">طريقة الدفع الفردية أو المتعددة:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setPaymentMethod('cash')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      paymentMethod === 'cash' ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs' : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    <span>نقدي / كاش</span>
                  </button>

                  <button
                    onClick={() => setPaymentMethod('card')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      paymentMethod === 'card' ? 'bg-blue-50 border-blue-500 text-blue-800 shadow-xs' : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 text-blue-600" />
                    <span>شبكة / مدى</span>
                  </button>

                  <button
                    onClick={() => {
                      if (!selectedCustomer) {
                        triggerScanMessage('يرجى اختيار عميل أولاً لإتاحة البيع الآجل!', 'error');
                        return;
                      }
                      setPaymentMethod('credit');
                    }}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      paymentMethod === 'credit' ? 'bg-amber-50 border-amber-500 text-amber-800 shadow-xs' : 'border-slate-200 hover:bg-slate-50 opacity-80'
                    }`}
                  >
                    <Wallet className="w-4 h-4 text-amber-600" />
                    <span>آجل (على الحساب)</span>
                  </button>

                  <button
                    onClick={() => setPaymentMethod('split')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      paymentMethod === 'split' ? 'bg-purple-50 border-purple-500 text-purple-800 shadow-xs' : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <QrCode className="w-4 h-4 text-purple-600" />
                    <span>تقسيم متعدد</span>
                  </button>
                </div>
              </div>

              {/* Dynamic Inputs per Method */}
              {paymentMethod === 'cash' && (
                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">المبلغ المستلم من العميل:</label>
                    <input
                      type="number"
                      step="0.01"
                      value={receivedCash}
                      onChange={(e) => setReceivedCash(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg py-2 px-3 text-sm font-mono text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500 text-left"
                    />
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-xs">
                    <span className="text-slate-600 font-bold">المتبقي (الخردة للعميل):</span>
                    <span className="font-extrabold text-emerald-600 font-mono text-sm">
                      {Math.max(0, (parseFloat(receivedCash) || 0) - grandTotal).toFixed(2)} {settings.currency}
                    </span>
                  </div>
                </div>
              )}

              {paymentMethod === 'split' && (
                <div className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                  <div className="text-slate-500 font-bold text-center">تقسيم الدفع بين الكاش والشبكة والآجل:</div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-600">💵 نقداً:</span>
                      <input
                        type="number"
                        step="0.01"
                        value={splitCashAmount}
                        onChange={(e) => setSplitCashAmount(e.target.value)}
                        className="w-28 bg-white border border-slate-300 rounded-lg py-1 px-2 font-mono font-bold text-left focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-600">💳 شبكة / مدى:</span>
                      <input
                        type="number"
                        step="0.01"
                        value={splitCardAmount}
                        onChange={(e) => setSplitCardAmount(e.target.value)}
                        className="w-28 bg-white border border-slate-300 rounded-lg py-1 px-2 font-mono font-bold text-left focus:outline-none"
                      />
                    </div>

                    {selectedCustomer && (
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-slate-600">🏛️ آجل على الحساب:</span>
                        <input
                          type="number"
                          step="0.01"
                          value={splitCreditAmount}
                          onChange={(e) => setSplitCreditAmount(e.target.value)}
                          className="w-28 bg-white border border-slate-300 rounded-lg py-1 px-2 font-mono font-bold text-left focus:outline-none text-amber-600"
                        />
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-[11px]">
                    <span>المجموع المقسم:</span>
                    <span className="font-mono text-emerald-600">
                      {((parseFloat(splitCashAmount)||0) + (parseFloat(splitCardAmount)||0) + (parseFloat(splitCreditAmount)||0)).toFixed(2)} / {grandTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {paymentMethod === 'credit' && selectedCustomer && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 space-y-1">
                  <p className="font-bold">✓ سيتم قيد الفاتورة كبيع آجل لحساب العميل:</p>
                  <p className="font-extrabold text-slate-800">{selectedCustomer.name}</p>
                  <div className="flex justify-between text-[11px] pt-1">
                    <span>الرصيد الحالي: {selectedCustomer.balance.toFixed(2)}</span>
                    <span>سقف الائتمان: {(selectedCustomer.creditLimit || 5000).toFixed(2)} {settings.currency}</span>
                  </div>
                </div>
              )}

              {/* Credit Limit Warning Alert */}
              {selectedCustomer && (paymentMethod === 'credit' || (paymentMethod === 'split' && parseFloat(splitCreditAmount) > 0)) && (
                (() => {
                  const creditPart = paymentMethod === 'credit' ? grandTotal : (parseFloat(splitCreditAmount) || 0);
                  const newBal = (selectedCustomer.balance || 0) + creditPart;
                  const limit = selectedCustomer.creditLimit || 5000;
                  if (newBal > limit) {
                    return (
                      <div className="p-3 bg-rose-50 border border-rose-300 text-rose-900 rounded-xl text-xs space-y-1">
                        <div className="font-extrabold flex items-center gap-1.5 text-rose-800">
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>تحذير: تجاوز سقف الائتمان المسموح!</span>
                        </div>
                        <p className="text-[11px] text-rose-700">
                          رصيد العميل بعد الفاتورة ({newBal.toFixed(2)}) سيصبح متجاوزاً سقف الائتمان ({limit.toFixed(2)} {settings.currency}).
                        </p>
                      </div>
                    );
                  }
                  return null;
                })()
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-2">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition"
              >
                إلغاء
              </button>
              <button
                onClick={submitInvoice}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow"
              >
                <CheckCircle className="w-4 h-4" />
                <span>تأكيد الفاتورة والطباعة</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt & Thermal Print Modal */}
      {showReceiptModal && lastInvoice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200 overflow-hidden text-right my-8">
            <div className="p-4 bg-[#1e293b] text-white flex justify-between items-center border-b border-slate-700">
              <h3 className="font-bold text-sm flex items-center gap-1.5">
                <Printer className="w-4 h-4 text-emerald-400" />
                <span>إيصال الطباعة الحرارية ({printerPaperWidth})</span>
              </h3>
              <button onClick={() => setShowReceiptModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto max-h-[70vh] bg-slate-100 flex justify-center">
              {/* Thermal Receipt Print Area */}
              <div 
                id="thermal-receipt-print"
                className={`bg-white text-slate-900 p-3 border border-slate-300 font-mono text-[11px] space-y-3 shadow-inner ${
                  printerPaperWidth === '58mm' ? 'w-[58mm]' : 'w-[80mm]'
                }`}
                style={{ direction: 'rtl' }}
              >
                {/* Store Header */}
                <div className="text-center space-y-1">
                  <div className="flex items-center justify-center gap-1 text-base font-black">
                    {settings.logo && (settings.logo.startsWith('http') || settings.logo.startsWith('/') || settings.logo.startsWith('data:image')) ? (
                      <img src={settings.logo} alt="Logo" className="w-6 h-6 object-contain" referrerPolicy="no-referrer" />
                    ) : (
                      settings.logo
                    )}
                    <span>{settings.name}</span>
                  </div>
                  <div className="text-[10px] text-slate-500">{settings.address}</div>
                  <div className="text-[10px] text-slate-500">جوال: {settings.phone}</div>
                  <div className="text-[10px] font-bold">الرقم الضريبي: {settings.taxNumber}</div>
                </div>

                <div className="border-t border-dashed border-slate-400 my-1"></div>

                {/* Metadata */}
                <div className="space-y-0.5 text-[10px]">
                  <div className="flex justify-between">
                    <span>رقم الفاتورة:</span>
                    <span className="font-bold">{lastInvoice.invoiceNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>التاريخ:</span>
                    <span>{new Date(lastInvoice.date).toLocaleString('ar-SA')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>الكاشير:</span>
                    <span>{lastInvoice.cashierName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>العميل:</span>
                    <span className="font-bold">{lastInvoice.customerName}</span>
                  </div>
                </div>

                <div className="border-t border-slate-400 my-1"></div>

                {/* Table of items */}
                <table className="w-full text-right text-[10px]">
                  <thead>
                    <tr className="border-b border-slate-400 font-bold">
                      <th className="pb-1">الصنف</th>
                      <th className="pb-1 text-center">الكمية</th>
                      <th className="pb-1 text-left">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lastInvoice.items.map((it, idx) => (
                      <tr key={idx} className="border-b border-dashed border-slate-200">
                        <td className="py-1 line-clamp-1">{it.productName}</td>
                        <td className="py-1 text-center font-bold">{it.quantity}</td>
                        <td className="py-1 text-left font-bold">{it.total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="border-t border-dashed border-slate-400 my-1"></div>

                {/* Totals */}
                <div className="space-y-0.5 text-[10px]">
                  <div className="flex justify-between">
                    <span>المجموع قبل الضريبة:</span>
                    <span>{lastInvoice.totalWithoutTax.toFixed(2)} {settings.currency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ضريبة القيمة المضافة ({settings.taxRate}%):</span>
                    <span>{lastInvoice.taxAmount.toFixed(2)} {settings.currency}</span>
                  </div>
                  {lastInvoice.discountAmount > 0 && (
                    <div className="flex justify-between text-rose-600 font-bold">
                      <span>إجمالي الخصم:</span>
                      <span>-{lastInvoice.discountAmount.toFixed(2)} {settings.currency}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs font-black pt-1 border-t border-slate-400">
                    <span>الإجمالي النهائي:</span>
                    <span>{lastInvoice.grandTotal.toFixed(2)} {settings.currency}</span>
                  </div>
                </div>

                <div className="border-t border-dashed border-slate-400 my-2"></div>

                {/* ZATCA Phase-2 Compliant QR Code */}
                <div className="text-center space-y-2 flex flex-col items-center">
                  {zatcaQrImage ? (
                    <img src={zatcaQrImage} alt="ZATCA QR" className="w-28 h-28 border border-slate-300 p-1 bg-white rounded" />
                  ) : (
                    <QrCode className="w-20 h-20 text-slate-800" />
                  )}
                  <div className="text-[9px] text-slate-500 font-sans">
                    فاتورة ضريبية مبسطة conforme ZATCA
                  </div>
                  <div className="text-[9px] text-slate-400 leading-tight">
                    شكراً لزيارتكم • نسعد بخدمتكم دائماً
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-2">
              <button
                onClick={() => setShowReceiptModal(false)}
                className="flex-1 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition"
              >
                إغلاق
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة إيصال thermal</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Quick Add Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <form onSubmit={handleCreateCustomer} className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200 overflow-hidden text-right">
            <div className="p-4 bg-[#1e293b] text-white flex justify-between items-center border-b border-slate-700">
              <h3 className="font-bold text-sm">إضافة عميل جديد بسرعة</h3>
              <button type="button" onClick={() => setShowCustomerModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">اسم العميل (مطلوب):</label>
                <input
                  type="text"
                  required
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="مثال: خالد محمد الشمري"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">رقم الهاتف:</label>
                <input
                  type="text"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  placeholder="مثال: 0555123456"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-left"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-2">
              <button
                type="button"
                onClick={() => setShowCustomerModal(false)}
                className="flex-1 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow"
              >
                حفظ العميل
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sales Return / Refund Modal */}
      {showReturnsModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden text-right flex flex-col max-h-[90vh]">
            <div className="p-4 bg-rose-900 text-white flex justify-between items-center border-b border-rose-800">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-rose-300" />
                <h3 className="font-bold text-sm">مرتجع ومسترجعات المبيعات (Refund & Returns)</h3>
              </div>
              <button onClick={() => { setShowReturnsModal(false); setSelectedReturnInvoice(null); }} className="text-rose-200 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              {/* Search Invoice */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute right-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={returnSearchQuery}
                    onChange={(e) => setReturnSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchReturnInvoice()}
                    placeholder="أدخل رقم الفاتورة للبحث (مثال: FT-1002)..."
                    className="w-full pr-10 pl-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono"
                  />
                </div>
                <button
                  onClick={handleSearchReturnInvoice}
                  className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition shadow-sm"
                >
                  بحث عن الفاتورة
                </button>
              </div>

              {/* Selected Invoice Details */}
              {selectedReturnInvoice ? (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                    <div>
                      <span className="font-mono font-bold text-rose-700 text-sm">{selectedReturnInvoice.invoiceNumber}</span>
                      <span className="text-xs text-slate-500 mr-2">({new Date(selectedReturnInvoice.date).toLocaleDateString('ar-SA')})</span>
                    </div>
                    <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full">
                      العميل: {selectedReturnInvoice.customerName || 'عميل نقدي'}
                    </span>
                  </div>

                  {/* Items List */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-700">الأصناف القابلة للإرجاع:</h4>
                    {selectedReturnInvoice.items.map((item) => (
                      <div key={item.id} className="bg-white p-3 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
                        <div>
                          <div className="font-bold text-xs text-slate-800">{item.productName}</div>
                          <div className="text-[11px] text-slate-500">
                            السعر: {item.price.toFixed(2)} | الكمية الأصلية: {item.quantity}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-600">كمية الإرجاع:</span>
                          <input
                            type="number"
                            min="1"
                            max={item.quantity}
                            value={returnQuantities[item.productId] ?? item.quantity}
                            onChange={(e) => {
                              const val = Math.min(item.quantity, Math.max(1, parseFloat(e.target.value) || 1));
                              setReturnQuantities(prev => ({ ...prev, [item.productId]: val }));
                            }}
                            className="w-16 text-center bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold p-1"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center text-xs font-bold text-slate-700 pt-2 border-t border-slate-200">
                    <span>إجمالي قيمة الفاتورة الأصلية:</span>
                    <span className="text-rose-700 font-mono text-sm">{formatAmount(selectedReturnInvoice.grandTotal)}</span>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 bg-slate-50 border border-dashed border-slate-300 rounded-xl space-y-2">
                  <RotateCcw className="w-10 h-10 mx-auto text-slate-300" />
                  <p className="text-xs font-bold">يرجى البحث عن رقم الفاتورة لعرض محتوياتها وتنفيذ عملية المرتجع</p>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-100 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => { setShowReturnsModal(false); setSelectedReturnInvoice(null); }}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition"
              >
                إلغاء
              </button>
              {selectedReturnInvoice && (
                <button
                  onClick={handleExecuteReturn}
                  disabled={isProcessingReturn}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition shadow disabled:opacity-50 flex items-center gap-1.5"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>تأكيد الإرجاع واسترداد المبلغ</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Secondary Customer Dual Screen Display Modal */}
      {showCustomerDisplay && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex flex-col animate-fade-in text-white p-6">
          <div className="flex justify-between items-center border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                <Monitor className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight">{settings.name || 'مرحباً بكم في متجرنا'}</h2>
                <p className="text-xs text-slate-400">شاشة العميل المزدوجة - المعاينة المباشرة</p>
              </div>
            </div>
            <button
              onClick={() => setShowCustomerDisplay(false)}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 flex-1 my-6 overflow-hidden">
            {/* Live Order Items */}
            <div className="md:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col">
              <h3 className="text-sm font-bold text-slate-400 border-b border-slate-800 pb-3 mb-3 flex justify-between">
                <span>قائمة المشتريات الحالية ({cart.length})</span>
                <span>العملة: {posCurrency}</span>
              </h3>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-3">
                    <ShoppingCart className="w-16 h-16 text-slate-700" />
                    <p className="text-base font-bold">بانتظار إضافة المنتجات بالصندوق...</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.id} className="p-4 bg-slate-800/80 border border-slate-700/60 rounded-xl flex justify-between items-center">
                      <div>
                        <h4 className="font-bold text-base text-white">{item.product.name}</h4>
                        <div className="text-xs text-slate-400 font-mono mt-1">
                          الكمية: {item.quantity} × {formatAmount(item.product.price)}
                        </div>
                      </div>
                      <div className="text-lg font-mono font-extrabold text-emerald-400">
                        {formatAmount(item.product.price * item.quantity)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Total Display & QR Code */}
            <div className="md:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="bg-emerald-950/60 border border-emerald-500/30 p-5 rounded-2xl text-center">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest block mb-1">المبلغ الإجمالي المستحق</span>
                  <div className="text-3xl lg:text-4xl font-extrabold font-mono text-emerald-400">
                    {formatAmount(grandTotal)}
                  </div>
                </div>

                <div className="space-y-2 text-xs text-slate-300 bg-slate-800/60 p-4 rounded-xl border border-slate-700/50">
                  <div className="flex justify-between">
                    <span>المجموع الفرعي:</span>
                    <span className="font-mono font-bold">{formatAmount(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ضريبة القيمة المضافة ({settings.taxRate || 15}%):</span>
                    <span className="font-mono font-bold">{formatAmount(taxAmount)}</span>
                  </div>
                  {totalDiscount > 0 && (
                    <div className="flex justify-between text-rose-400">
                      <span>الخصم الخاطف:</span>
                      <span className="font-mono font-bold">-{formatAmount(totalDiscount)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* ZATCA QR Code Simulation for Trust */}
              <div className="text-center pt-4 border-t border-slate-800 flex flex-col items-center gap-2">
                {zatcaQrImage ? (
                  <img src={zatcaQrImage} alt="ZATCA QR" className="w-28 h-28 bg-white p-1.5 rounded-xl border border-slate-700" />
                ) : (
                  <QrCode className="w-20 h-20 text-slate-700" />
                )}
                <span className="text-[10px] text-slate-400 font-bold">فاتورة ضريبية مبسطة معتمدة زكاة ودخل (ZATCA)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cash Register Shift & Drawer Balance Modal */}
      {showCashDrawerModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden text-right">
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center border-b border-slate-800">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm">تقرير الصندوق والوردية الحالية</h3>
              </div>
              <button onClick={() => setShowCashDrawerModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-2">
                <div className="flex justify-between font-bold text-slate-700">
                  <span>رصيد افتتاح الصندوق:</span>
                  <span className="font-mono">{shiftStartBalance.toFixed(2)} SAR</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>إجمالي المبيعات النقدية بالشيفت:</span>
                  <span className="font-mono text-emerald-600 font-bold">+{shiftCurrentCash.toFixed(2)} SAR</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>إجمالي مبيعات شبكة / مدى:</span>
                  <span className="font-mono text-blue-600 font-bold">+0.00 SAR</span>
                </div>
                <div className="border-t border-slate-200 pt-2 flex justify-between font-extrabold text-sm text-slate-900">
                  <span>النقدية المتوقعة بالصندوق:</span>
                  <span className="font-mono text-emerald-700">{(shiftStartBalance + shiftCurrentCash).toFixed(2)} SAR</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleTriggerCashDrawer}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition flex items-center justify-center gap-1.5 shadow"
                >
                  <Unlock className="w-4 h-4" />
                  <span>فتح درج النقدية 🔓</span>
                </button>
              </div>
            </div>

            <div className="p-4 bg-slate-100 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowCashDrawerModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* USB / Bluetooth Barcode Scanner Management Modal */}
      <BarcodeScannerModal
        isOpen={showScannerModal}
        onClose={() => setShowScannerModal(false)}
        config={scannerConfig}
        onUpdateConfig={(newCfg) => setScannerConfig(prev => ({ ...prev, ...newCfg }))}
        scanHistory={scanHistory}
        onClearHistory={clearScanHistory}
        onScanBarcode={handleBarcodeScan}
        products={products}
      />
    </div>
  );
}
