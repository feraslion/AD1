import React, { useState, useEffect, useRef } from 'react';
import { Product, Category, Customer, CartItem, StoreSettings, Invoice } from '../types';
import { ShoppingCart, Search, Plus, Minus, Trash2, UserPlus, CreditCard, DollarSign, Wallet, FileText, CheckCircle, X, Printer, QrCode, Scan, AlertCircle } from 'lucide-react';

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
  const [invoiceDiscount, setInvoiceDiscount] = useState<number>(0);
  const [invoiceDiscountType, setInvoiceDiscountType] = useState<'fixed' | 'percentage'>('fixed');

  // Scanner Simulator / Camera Simulator
  const [showScanner, setShowScanner] = useState<boolean>(false);
  const [scannerInput, setScannerInput] = useState<string>('');
  const [scanMessage, setScanMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Payment State
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'credit' | 'split'>('cash');
  const [receivedCash, setReceivedCash] = useState<string>('');
  const [splitCardAmount, setSplitCardAmount] = useState<string>('');
  const [splitCashAmount, setSplitCashAmount] = useState<string>('');

  // Receipt State
  const [lastInvoice, setLastInvoice] = useState<Invoice | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);

  // Customer Quick Add State
  const [showCustomerModal, setShowCustomerModal] = useState<boolean>(false);
  const [newCustName, setNewCustName] = useState<string>('');
  const [newCustPhone, setNewCustPhone] = useState<string>('');

  // Fast Barcode scanning (simulating hardware laser gun input)
  useEffect(() => {
    let barcodeBuffer = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      const currentTime = Date.now();
      
      // If the characters are coming fast (less than 30ms interval), it is likely a barcode scanner
      if (currentTime - lastKeyTime > 100) {
        barcodeBuffer = ''; // reset buffer if slow typing
      }
      
      lastKeyTime = currentTime;

      if (e.key === 'Enter') {
        if (barcodeBuffer.length >= 4) {
          handleBarcodeScan(barcodeBuffer);
          barcodeBuffer = '';
          e.preventDefault();
        }
      } else if (e.key !== 'Shift') {
        barcodeBuffer += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [products, cart]);

  // Handle direct scan or mock scan
  const handleBarcodeScan = (barcode: string) => {
    const prod = products.find(p => p.barcode === barcode);
    if (prod) {
      if (prod.stock <= 0 && prod.minStock > 0) {
        triggerScanMessage(`الصنف "${prod.name}" نفد من المخزن!`, 'error');
        return;
      }
      addToCart(prod);
      triggerScanMessage(`تم مسح وإضافة: ${prod.name}`, 'success');
    } else {
      triggerScanMessage(`كود الباركود (${barcode}) غير مسجل!`, 'error');
    }
  };

  const triggerScanMessage = (text: string, type: 'success' | 'error') => {
    setScanMessage({ text, type });
    setTimeout(() => setScanMessage(null), 3000);
  };

  // Cart operations
  const addToCart = (product: Product) => {
    setCart(prevCart => {
      const existing = prevCart.find(item => item.id === product.id);
      if (existing) {
        if (product.stock !== 999 && existing.quantity >= product.stock) {
          triggerScanMessage(`تنبيه: لا يوجد سوى ${product.stock} قطع في المخزون`, 'error');
          return prevCart;
        }
        return prevCart.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        if (product.stock !== 999 && product.stock <= 0) {
          triggerScanMessage(`المنتج غير متوفر بالمخزون`, 'error');
          return prevCart;
        }
        return [...prevCart, { id: product.id, product, quantity: 1, discount: 0, discountType: 'percentage' }];
      }
    });
  };

  const updateQuantity = (id: string, qty: number) => {
    const item = cart.find(i => i.id === id);
    if (!item) return;

    if (qty <= 0) {
      setCart(prev => prev.filter(i => i.id !== id));
      return;
    }

    if (item.product.stock !== 999 && qty > item.product.stock) {
      triggerScanMessage(`تنبيه: الحد الأقصى للمخزون هو ${item.product.stock}`, 'error');
      return;
    }

    setCart(prev => prev.map(i => i.id === id ? { ...i, quantity: qty } : i));
  };

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
  const subtotal = cart.reduce((acc, item) => {
    let itemPrice = item.product.price * item.quantity;
    let itemDiscount = 0;
    if (item.discount > 0) {
      if (item.discountType === 'percentage') {
        itemDiscount = itemPrice * (item.discount / 100);
      } else {
        itemDiscount = item.discount * item.quantity;
      }
    }
    return acc + (itemPrice - itemDiscount);
  }, 0);

  // General discount calculation
  const totalDiscount = (() => {
    let disc = 0;
    if (invoiceDiscount > 0) {
      if (invoiceDiscountType === 'percentage') {
        disc = subtotal * (invoiceDiscount / 100);
      } else {
        disc = invoiceDiscount;
      }
    }
    return parseFloat(disc.toFixed(2));
  })();

  const taxableAmount = Math.max(0, subtotal - totalDiscount);
  
  // Tax calculations (inclusive or exclusive? Standard KSA VAT is calculated on net)
  // Let's calculate VAT (15% by default) on the taxable amount
  const taxRate = settings.taxRate;
  const taxAmount = parseFloat((taxableAmount * (taxRate / 100)).toFixed(2));
  const grandTotal = parseFloat((taxableAmount + taxAmount).toFixed(2));

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
  };

  // Payment completion
  const handleCheckout = () => {
    if (cart.length === 0) return;
    
    // Default initial payment inputs
    setReceivedCash(grandTotal.toString());
    setSplitCashAmount((grandTotal / 2).toString());
    setSplitCardAmount((grandTotal / 2).toString());
    
    if (paymentMethod === 'credit' && !selectedCustomer) {
      // Must select customer for credit
      setPaymentMethod('cash');
    }
    
    setShowPaymentModal(true);
  };

  const submitInvoice = () => {
    const invoiceId = `inv-${Date.now()}`;
    const invoiceNo = `FT-${new Date().getFullYear()}${Math.floor(100000 + Math.random() * 900000)}`;

    const newInvoice: Invoice = {
      id: invoiceId,
      invoiceNumber: invoiceNo,
      date: new Date().toISOString(),
      items: cart.map(item => {
        let itemPrice = item.product.price;
        let discountVal = item.discount;
        let total = itemPrice * item.quantity;
        if (discountVal > 0) {
          if (item.discountType === 'percentage') {
            total -= total * (discountVal / 100);
          } else {
            total -= discountVal * item.quantity;
          }
        }
        return {
          productId: item.product.id,
          productName: item.product.name,
          price: itemPrice,
          quantity: item.quantity,
          discount: item.discount,
          discountType: item.discountType,
          total: parseFloat(total.toFixed(2)),
          taxAmount: parseFloat((total * (settings.taxRate / 100)).toFixed(2))
        };
      }),
      totalWithoutTax: parseFloat(taxableAmount.toFixed(2)),
      taxAmount: taxAmount,
      discountAmount: totalDiscount,
      grandTotal: grandTotal,
      paymentMethod: paymentMethod,
      paymentDetails: {
        cashAmount: paymentMethod === 'cash' ? grandTotal : paymentMethod === 'split' ? parseFloat(splitCashAmount) : 0,
        cardAmount: paymentMethod === 'card' ? grandTotal : paymentMethod === 'split' ? parseFloat(splitCardAmount) : 0
      },
      status: paymentMethod === 'credit' ? 'unpaid' : paymentMethod === 'split' ? 'paid' : 'paid',
      customerId: selectedCustomer?.id,
      customerName: selectedCustomer?.name || 'عميل نقدي سريع',
      taxNumber: settings.taxNumber,
      cashierName: 'أحمد الكاشير' // simulation session
    };

    // Update stocks and collect low stock alerts
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

    // Save invoice
    onAddInvoice(newInvoice);
    setLastInvoice(newInvoice);
    
    // Clear cart and close modal
    setCart([]);
    setSelectedCustomer(null);
    setInvoiceDiscount(0);
    setShowPaymentModal(false);
    
    // Trigger receipt preview
    setShowReceiptModal(true);

    // If some products fell below minStock, trigger an automatic system toast alert
    if (lowStockAlerts.length > 0) {
      setTimeout(() => {
        triggerScanMessage(`⚠️ تنبيه تلقائي: انخفض مخزون ${lowStockAlerts.join('، ')} عن حد إعادة الطلب المحدد!`, 'error');
      }, 1500);
    }
  };

  // Mock scan trigger
  const runMockScan = (product: Product) => {
    handleBarcodeScan(product.barcode);
  };

  // Helper for ZATCA (Fatoora) Compliant QR code generation mockup (returns a base64 or stylized QR code block representation)
  const renderZatcaQrMockup = (invoice: Invoice) => {
    return (
      <div className="flex flex-col items-center justify-center border border-slate-200 p-2.5 rounded bg-white w-32 h-32 mx-auto">
        <QrCode className="w-20 h-20 text-slate-800" />
        <span className="text-[9px] text-slate-400 mt-1 font-mono">فاتورة ضريبية مبسطة</span>
      </div>
    );
  };

  // Filter products by category and search
  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch = p.name.includes(searchQuery) || p.barcode.includes(searchQuery);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 h-[calc(100vh-130px)]">
      {/* Products Catalog - 7 cols on extra large screens */}
      <div className="xl:col-span-7 flex flex-col bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden h-full">
        {/* Header / Search Controls */}
        <div className="p-4 bg-slate-50 border-b border-slate-100 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search inputs */}
            <div className="relative flex-1">
              <Search className="absolute right-3.5 top-3 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="البحث عن منتج بالاسم أو الباركود..."
                className="w-full pr-11 pl-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-800 font-medium"
              />
            </div>

            {/* Quick Barcode Simulator Button */}
            <button 
              onClick={() => setShowScanner(!showScanner)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-semibold hover:bg-slate-700 transition"
            >
              <Scan className="w-4 h-4" />
              <span>محاكاة مسح الباركود</span>
            </button>
          </div>

          {/* Scan simulator drawer */}
          {showScanner && (
            <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-700 space-y-3 shadow-inner">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-300">أداة محاكاة باركود الأصناف</span>
                <button onClick={() => setShowScanner(false)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {products.slice(0, 7).map(p => (
                  <button
                    key={p.id}
                    onClick={() => runMockScan(p)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-emerald-600 border border-slate-700 text-xs rounded-lg transition text-right"
                  >
                    <div>{p.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">{p.barcode}</div>
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="أو اكتب الباركود يدوياً واضغط تم..."
                  value={scannerInput}
                  onChange={(e) => setScannerInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleBarcodeScan(scannerInput);
                      setScannerInput('');
                    }
                  }}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 text-left font-mono"
                />
                <button 
                  onClick={() => {
                    handleBarcodeScan(scannerInput);
                    setScannerInput('');
                  }}
                  className="px-4 bg-emerald-600 text-white font-bold rounded-lg text-xs hover:bg-emerald-500 transition"
                >
                  مسح
                </button>
              </div>
            </div>
          )}

          {/* Toast feedback for mock scans */}
          {scanMessage && (
            <div className={`p-3 rounded-lg text-xs font-bold flex items-center gap-2 animate-fade-in ${
              scanMessage.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
            }`}>
              {scanMessage.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>{scanMessage.text}</span>
            </div>
          )}

          {/* Category Navigation Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                selectedCategory === 'all' 
                  ? 'bg-emerald-600 text-white shadow-sm' 
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              📂 الكل ({products.length})
            </button>
            {categories.map(cat => {
              const catProdCount = products.filter(p => p.category === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                    selectedCategory === cat.id 
                      ? 'bg-emerald-600 text-white shadow-sm' 
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {cat.icon} {cat.name} ({catProdCount})
                </button>
              );
            })}
          </div>
        </div>

        {/* Catalog Grid */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50">
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400 space-y-2">
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
                    className={`bg-white border rounded-xl p-3 text-right flex flex-col justify-between h-36 transition hover:shadow-md hover:border-emerald-300 relative group active:scale-[0.98] ${
                      isOutOfStock ? 'opacity-50 cursor-not-allowed border-rose-200 bg-rose-50/20' : 'border-slate-200'
                    }`}
                  >
                    {/* Floating badges */}
                    {isOutOfStock && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 bg-rose-600 text-white text-[9px] rounded font-bold">منتهي</span>
                    )}
                    {isLowStock && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 bg-amber-500 text-white text-[9px] rounded font-bold">منخفض</span>
                    )}

                    <div>
                      <div className="text-[10px] text-slate-400 font-semibold mb-1">{p.barcode}</div>
                      <h4 className="font-bold text-slate-800 text-xs sm:text-sm line-clamp-2 leading-snug">{p.name}</h4>
                    </div>

                    <div className="mt-2 flex justify-between items-end w-full">
                      <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded font-bold text-slate-500">{p.unit}</span>
                      <div className="font-extrabold text-emerald-600 text-sm sm:text-base">
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

      {/* Shopping Cart Drawer - 5 cols on extra large screens */}
      <div className="xl:col-span-5 flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden h-full">
        {/* Cart Header */}
        <div className="p-4 bg-[#1e293b] text-white flex justify-between items-center border-b border-slate-700">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold">سلة المشتريات ({cart.length})</h3>
          </div>
          {cart.length > 0 && (
            <button 
              onClick={clearCart}
              className="text-xs text-rose-300 font-bold hover:text-rose-100 flex items-center gap-1 bg-rose-950/40 px-2 py-1 rounded"
            >
              <Trash2 className="w-3.5 h-3.5" /> سلة جديدة
            </button>
          )}
        </div>

        {/* Customer Selector */}
        <div className="p-3 bg-slate-50 border-b border-slate-100 flex gap-2 items-center">
          <select
            value={selectedCustomer ? selectedCustomer.id : ''}
            onChange={(e) => {
              const c = customers.find(cust => cust.id === e.target.value);
              setSelectedCustomer(c || null);
            }}
            className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
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
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-2">
              <ShoppingCart className="w-16 h-16" />
              <p className="font-bold text-sm">سلة المشتريات فارغة</p>
              <p className="text-xs text-slate-400">امسح الباركود أو اضغط على صنف للبدء</p>
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
                <div key={item.id} className="p-3 bg-white border border-slate-200 rounded-xl flex justify-between items-start gap-2 hover:border-slate-300 transition">
                  <div className="flex-1 space-y-1">
                    <h4 className="font-bold text-slate-800 text-xs sm:text-sm line-clamp-2 leading-snug">{item.product.name}</h4>
                    
                    {/* Item Unit and Price */}
                    <div className="text-xs text-slate-400 flex gap-2">
                      <span>السعر: {item.product.price.toFixed(2)}</span>
                      <span>•</span>
                      <span>الوحدة: {item.product.unit}</span>
                    </div>

                    {/* Quick discount control */}
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[10px] font-bold text-slate-500">خصم:</span>
                      <input 
                        type="number"
                        min="0"
                        placeholder="خصم"
                        value={item.discount || ''}
                        onChange={(e) => updateItemDiscount(item.id, Math.max(0, parseFloat(e.target.value) || 0), item.discountType)}
                        className="w-12 text-center bg-slate-50 border border-slate-200 rounded text-xs py-0.5 px-1 font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                      <select
                        value={item.discountType}
                        onChange={(e) => updateItemDiscount(item.id, item.discount, e.target.value as 'fixed' | 'percentage')}
                        className="bg-slate-50 border border-slate-200 rounded text-[10px] py-0.5 px-0.5 text-slate-600 focus:outline-none"
                      >
                        <option value="percentage">%</option>
                        <option value="fixed">{settings.currency}</option>
                      </select>
                    </div>
                  </div>

                  {/* Quantity and Actions */}
                  <div className="flex flex-col items-end justify-between h-full space-y-3 min-w-[100px]">
                    <div className="text-sm font-extrabold text-slate-800 font-mono">
                      {netItemPrice.toFixed(2)} {settings.currency}
                    </div>

                    <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-1 text-slate-500 hover:bg-white rounded transition"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-2.5 font-extrabold text-xs text-slate-800 font-mono">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-1 text-slate-500 hover:bg-white rounded transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Cart Calculations Summary */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-2.5">
          {/* General Invoice Discount */}
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 font-bold">خصم عام على الفاتورة</span>
            <div className="flex items-center gap-1.5">
              <input 
                type="number"
                min="0"
                placeholder="خصم عام"
                value={invoiceDiscount || ''}
                onChange={(e) => setInvoiceDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-16 text-center bg-white border border-slate-200 rounded-lg text-xs py-1 px-1.5 font-mono font-bold text-slate-800 focus:outline-none"
              />
              <select
                value={invoiceDiscountType}
                onChange={(e) => setInvoiceDiscountType(e.target.value as 'fixed' | 'percentage')}
                className="bg-white border border-slate-200 rounded-lg text-xs py-1 px-1 text-slate-600 focus:outline-none"
              >
                <option value="fixed">{settings.currency}</option>
                <option value="percentage">%</option>
              </select>
            </div>
          </div>

          <div className="border-t border-slate-100 my-2"></div>

          <div className="flex justify-between text-xs text-slate-600">
            <span>المجموع قبل الضريبة:</span>
            <span className="font-mono font-semibold">{taxableAmount.toFixed(2)} {settings.currency}</span>
          </div>

          <div className="flex justify-between text-xs text-slate-600">
            <span>الضريبة المضافة ({settings.taxRate}%):</span>
            <span className="font-mono font-semibold">{taxAmount.toFixed(2)} {settings.currency}</span>
          </div>

          {totalDiscount > 0 && (
            <div className="flex justify-between text-xs text-rose-600">
              <span>إجمالي الخصومات:</span>
              <span className="font-mono font-semibold">-{totalDiscount.toFixed(2)} {settings.currency}</span>
            </div>
          )}

          <div className="flex justify-between text-base font-extrabold text-slate-800 pt-1 border-t border-slate-200">
            <span>المجموع النهائي:</span>
            <span className="font-mono text-emerald-600 text-lg">{grandTotal.toFixed(2)} {settings.currency}</span>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <button 
              disabled={cart.length === 0}
              onClick={() => {
                setPaymentMethod('cash');
                handleCheckout();
              }}
              className="py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-bold shadow transition disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              💵 كاش سريع
            </button>

            <button 
              disabled={cart.length === 0}
              onClick={() => {
                setPaymentMethod('card');
                handleCheckout();
              }}
              className="py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold shadow transition disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              💳 دفع / فاتورة
            </button>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl border border-slate-200 overflow-hidden text-right">
            <div className="p-4 bg-[#1e293b] text-white flex justify-between items-center border-b border-slate-700">
              <h3 className="font-bold text-lg">اتمام العملية والفوترة</h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Payment Mode Toggles */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 block">طريقة الدفع</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setPaymentMethod('cash')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      paymentMethod === 'cash' ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-sm' : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    <span>نقدي / كاش</span>
                  </button>

                  <button
                    onClick={() => setPaymentMethod('card')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      paymentMethod === 'card' ? 'bg-blue-50 border-blue-500 text-blue-800 shadow-sm' : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 text-blue-600" />
                    <span>شبكة / مدى</span>
                  </button>

                  <button
                    onClick={() => {
                      if (!selectedCustomer) {
                        triggerScanMessage('يرجى اختيار عميل أولاً لإتاحة الدفع الآجل!', 'error');
                        return;
                      }
                      setPaymentMethod('credit');
                    }}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      paymentMethod === 'credit' ? 'bg-amber-50 border-amber-500 text-amber-800 shadow-sm' : 'border-slate-200 hover:bg-slate-50 opacity-60'
                    }`}
                  >
                    <Wallet className="w-4 h-4 text-amber-600" />
                    <span>بيع آجل (على الحساب)</span>
                  </button>

                  <button
                    onClick={() => setPaymentMethod('split')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      paymentMethod === 'split' ? 'bg-purple-50 border-purple-500 text-purple-800 shadow-sm' : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <QrCode className="w-4 h-4 text-purple-600" />
                    <span>مختلط (كاش + شبكة)</span>
                  </button>
                </div>
              </div>

              {/* Dynamic Inputs based on Payment Method */}
              {paymentMethod === 'cash' && (
                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-bold">المطلوب سداده:</span>
                    <span className="font-extrabold text-slate-800 font-mono text-base">{grandTotal.toFixed(2)} {settings.currency}</span>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">المبلغ المستلم من العميل:</label>
                    <input
                      type="number"
                      value={receivedCash}
                      onChange={(e) => setReceivedCash(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg py-2 px-3 text-sm font-mono text-slate-800 font-bold focus:outline-none text-left"
                    />
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-xs">
                    <span className="text-slate-500 font-bold">المتبقي (الخردة للعميل):</span>
                    <span className="font-extrabold text-emerald-600 font-mono text-sm">
                      {Math.max(0, (parseFloat(receivedCash) || 0) - grandTotal).toFixed(2)} {settings.currency}
                    </span>
                  </div>
                </div>
              )}

              {paymentMethod === 'split' && (
                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="text-xs font-bold text-slate-500 text-center mb-1">تقسيم قيمة الفاتورة: {grandTotal.toFixed(2)} {settings.currency}</div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500">المبلغ نقداً:</label>
                      <input
                        type="number"
                        value={splitCashAmount}
                        onChange={(e) => {
                          const cash = parseFloat(e.target.value) || 0;
                          setSplitCashAmount(e.target.value);
                          setSplitCardAmount(Math.max(0, grandTotal - cash).toFixed(2));
                        }}
                        className="w-full bg-white border border-slate-300 rounded-lg py-1.5 px-2 text-xs font-mono font-bold focus:outline-none text-left"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500">المبلغ شبكة:</label>
                      <input
                        type="number"
                        value={splitCardAmount}
                        onChange={(e) => {
                          const card = parseFloat(e.target.value) || 0;
                          setSplitCardAmount(e.target.value);
                          setSplitCashAmount(Math.max(0, grandTotal - card).toFixed(2));
                        }}
                        className="w-full bg-white border border-slate-300 rounded-lg py-1.5 px-2 text-xs font-mono font-bold focus:outline-none text-left"
                      />
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === 'credit' && selectedCustomer && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 space-y-1">
                  <p className="font-bold">✓ سيتم قيد العملية كمبيعات آجلة على العميل:</p>
                  <p className="font-extrabold text-slate-700">{selectedCustomer.name}</p>
                  <p className="mt-1">رصيد المديونية الحالي للعميل: {selectedCustomer.balance.toFixed(2)} {settings.currency}</p>
                </div>
              )}

              {/* Total final confirmation details */}
              <div className="border-t border-slate-100 pt-3 flex justify-between items-center text-sm">
                <span className="font-bold text-slate-600">القيمة النهائية:</span>
                <span className="font-extrabold text-emerald-600 text-lg font-mono">{grandTotal.toFixed(2)} {settings.currency}</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition"
              >
                إلغاء
              </button>
              <button
                onClick={submitInvoice}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1"
              >
                <CheckCircle className="w-4 h-4" />
                <span>تأكيد وطباعة الفاتورة</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Preview & Thermal Print Modal */}
      {showReceiptModal && lastInvoice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-xl border border-slate-200 overflow-hidden text-right my-8">
            <div className="p-4 bg-[#1e293b] text-white flex justify-between items-center border-b border-slate-700">
              <h3 className="font-bold text-base flex items-center gap-1.5">
                <Printer className="w-5 h-5 text-emerald-400" />
                <span>معاينة إيصال الطباعة الحرارية</span>
              </h3>
              <button onClick={() => setShowReceiptModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto max-h-[70vh]">
              {/* Thermal Receipt Styled Layout */}
              <div 
                id="thermal-receipt-print"
                className="bg-white text-slate-900 p-4 border border-dashed border-slate-300 rounded font-sans text-xs space-y-4 shadow-inner"
                style={{ width: '100%', direction: 'rtl' }}
              >
                {/* Store Header */}
                <div className="text-center space-y-1">
                  <div className="text-xl font-black">{settings.logo} {settings.name}</div>
                  <div className="text-[11px] text-slate-500">{settings.address}</div>
                  <div className="text-[11px] text-slate-500">جوال: {settings.phone}</div>
                  <div className="text-[11px] font-bold">الرقم الضريبي: {settings.taxNumber}</div>
                </div>

                <div className="border-t border-dashed border-slate-300 my-2"></div>

                {/* Invoice Metadata */}
                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span>رقم الفاتورة:</span>
                    <span className="font-bold">{lastInvoice.invoiceNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>التاريخ والوقت:</span>
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

                <div className="border-t border-slate-300 my-2"></div>

                {/* Table of items */}
                <table className="w-full text-right text-[11px]">
                  <thead>
                    <tr className="border-b border-slate-300 font-bold">
                      <th className="pb-1">الصنف</th>
                      <th className="pb-1 text-center">الكمية</th>
                      <th className="pb-1 text-left">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lastInvoice.items.map((it, idx) => (
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
                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span>المجموع الخاضع للضريبة:</span>
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
                  <div className="flex justify-between text-base font-extrabold pt-1 border-t border-slate-300">
                    <span>المجموع النهائي:</span>
                    <span>{lastInvoice.grandTotal.toFixed(2)} {settings.currency}</span>
                  </div>
                </div>

                <div className="border-t border-dashed border-slate-300 my-3"></div>

                {/* QR Code and Footer */}
                <div className="text-center space-y-3">
                  {renderZatcaQrMockup(lastInvoice)}
                  <div className="text-[10px] text-slate-500 leading-snug">
                    شكراً لزيارتكم • نسعد بتقديم أفضل خدمة لكم دائماً
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2">
              <button
                onClick={() => setShowReceiptModal(false)}
                className="flex-1 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition"
              >
                إغلاق النافذة
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة حرارية</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Quick Add Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <form onSubmit={handleCreateCustomer} className="bg-white rounded-2xl max-w-sm w-full shadow-xl border border-slate-200 overflow-hidden text-right">
            <div className="p-4 bg-[#1e293b] text-white flex justify-between items-center border-b border-slate-700">
              <h3 className="font-bold">إضافة عميل جديد بسرعة</h3>
              <button type="button" onClick={() => setShowCustomerModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">اسم العميل (مطلوب):</label>
                <input
                  type="text"
                  required
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="مثال: خالد محمد الشمري"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">رقم الهاتف:</label>
                <input
                  type="text"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  placeholder="مثال: 0555123456"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-left"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2">
              <button
                type="button"
                onClick={() => setShowCustomerModal(false)}
                className="flex-1 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition"
              >
                حفظ العميل
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
