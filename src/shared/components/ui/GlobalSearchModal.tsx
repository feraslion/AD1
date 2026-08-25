import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Package, 
  User, 
  Receipt, 
  X, 
  CornerDownLeft, 
  ArrowUp, 
  ArrowDown, 
  Filter, 
  ShoppingBag, 
  Tag, 
  Phone, 
  Calendar, 
  DollarSign, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ChevronLeft 
} from 'lucide-react';
import { Product, Customer, Invoice, StoreSettings } from '../../types';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  customers: Customer[];
  invoices: Invoice[];
  settings: StoreSettings;
  onNavigateTab: (tab: string) => void;
  onSelectProduct?: (product: Product) => void;
  onSelectCustomer?: (customer: Customer) => void;
  onSelectInvoice?: (invoice: Invoice) => void;
}

type CategoryFilter = 'all' | 'products' | 'customers' | 'invoices';

export default function GlobalSearchModal({
  isOpen,
  onClose,
  products = [],
  customers = [],
  invoices = [],
  settings,
  onNavigateTab,
  onSelectProduct,
  onSelectCustomer,
  onSelectInvoice
}: GlobalSearchModalProps) {
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<CategoryFilter>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [apiResults, setApiResults] = useState<{ products: Product[]; customers: Customer[]; invoices: Invoice[] } | null>(null);
  const [isSearchingApi, setIsSearchingApi] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Auto-focus on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setApiResults(null);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Debounced API Search
  useEffect(() => {
    if (!query.trim()) {
      setApiResults(null);
      setIsSearchingApi(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingApi(true);
      try {
        const token = localStorage.getItem('erp_active_user_token') || localStorage.getItem('erp_active_user');
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`/api/v1/search?q=${encodeURIComponent(query.trim())}`, { headers });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setApiResults({
              products: json.data.products || [],
              customers: json.data.customers || [],
              invoices: json.data.invoices || []
            });
          }
        }
      } catch (err) {
        // Fallback to local filtering on error
      } finally {
        setIsSearchingApi(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Filter Products
  const matchingProducts = apiResults?.products.length 
    ? apiResults.products 
    : products.filter(p => {
        if (!query.trim()) return true;
        const q = query.toLowerCase().trim();
        return (
          p.name?.toLowerCase().includes(q) ||
          p.barcode?.toLowerCase().includes(q) ||
          p.sku?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q) ||
          p.barcodes?.some(b => b.barcode.toLowerCase().includes(q))
        );
      }).slice(0, 15);

  // Filter Customers
  const matchingCustomers = apiResults?.customers.length 
    ? apiResults.customers 
    : customers.filter(c => {
        if (!query.trim()) return true;
        const q = query.toLowerCase().trim();
        return (
          c.name?.toLowerCase().includes(q) ||
          c.phone?.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q) ||
          c.taxNumber?.toLowerCase().includes(q)
        );
      }).slice(0, 15);

  // Filter Invoices
  const matchingInvoices = apiResults?.invoices.length 
    ? apiResults.invoices 
    : invoices.filter(inv => {
        if (!query.trim()) return true;
        const q = query.toLowerCase().trim();
        return (
          inv.invoiceNumber?.toLowerCase().includes(q) ||
          inv.customerName?.toLowerCase().includes(q) ||
          inv.cashierName?.toLowerCase().includes(q) ||
          inv.grandTotal?.toString().includes(q) ||
          inv.status?.toLowerCase().includes(q) ||
          inv.date?.includes(q)
        );
      }).slice(0, 15);

  // Combine results according to filter
  type ResultItem = 
    | { type: 'product'; data: Product }
    | { type: 'customer'; data: Customer }
    | { type: 'invoice'; data: Invoice };

  const combinedResults: ResultItem[] = [];

  if (activeFilter === 'all' || activeFilter === 'products') {
    matchingProducts.forEach(p => combinedResults.push({ type: 'product', data: p }));
  }
  if (activeFilter === 'all' || activeFilter === 'customers') {
    matchingCustomers.forEach(c => combinedResults.push({ type: 'customer', data: c }));
  }
  if (activeFilter === 'all' || activeFilter === 'invoices') {
    matchingInvoices.forEach(inv => combinedResults.push({ type: 'invoice', data: inv }));
  }

  const handleSelectResult = (item: ResultItem) => {
    onClose();
    if (item.type === 'product') {
      if (onSelectProduct) {
        onSelectProduct(item.data);
      } else {
        onNavigateTab('inventory');
      }
    } else if (item.type === 'customer') {
      if (onSelectCustomer) {
        onSelectCustomer(item.data);
      } else {
        onNavigateTab('customers');
      }
    } else if (item.type === 'invoice') {
      if (onSelectInvoice) {
        onSelectInvoice(item.data);
      } else {
        onNavigateTab('invoices');
      }
    }
  };

  // Keyboard Navigation inside Modal
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < combinedResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : combinedResults.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (combinedResults[selectedIndex]) {
        handleSelectResult(combinedResults[selectedIndex]);
      }
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-slate-900/70 backdrop-blur-md flex items-start justify-center pt-10 sm:pt-20 px-4 z-50 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="global-search-modal-title"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] text-right"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <h2 id="global-search-modal-title" className="sr-only">
          البحث الشامل في النظام
        </h2>

        {/* Search Header Bar */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="ابحث عن منتج، عميل، بركود، أو رقم فاتورة..."
            aria-label="ابحث عن منتج، عميل، بركود، أو رقم فاتورة"
            aria-expanded={combinedResults.length > 0}
            aria-autocomplete="list"
            aria-controls="global-search-results"
            className="flex-1 bg-transparent border-none text-slate-800 dark:text-slate-100 placeholder-slate-400 font-bold text-sm sm:text-base focus:outline-none focus:ring-0"
          />
          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono font-bold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-md border border-slate-300 dark:border-slate-700">
              <kbd>ESC</kbd> لإلغاء
            </span>
            <button 
              type="button"
              onClick={onClose}
              aria-label="إغلاق البحث"
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-200/80 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-950/50 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 transition focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none"
              title="إغلاق (ESC)"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Filter Category Tabs */}
        <div
          role="tablist"
          aria-label="تصنيفات البحث"
          className="px-4 py-2.5 bg-slate-100/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeFilter === 'all'}
            onClick={() => { setActiveFilter('all'); setSelectedIndex(0); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap min-h-[36px] focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none ${
              activeFilter === 'all'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <span>🔍 الكل</span>
            <span className="text-[10px] bg-black/10 dark:bg-white/10 px-1.5 py-0.5 rounded-md font-mono font-bold">
              {matchingProducts.length + matchingCustomers.length + matchingInvoices.length}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeFilter === 'products'}
            onClick={() => { setActiveFilter('products'); setSelectedIndex(0); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap min-h-[36px] focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none ${
              activeFilter === 'products'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Package className="w-3.5 h-3.5" aria-hidden="true" />
            <span>المنتجات</span>
            <span className="text-[10px] bg-black/10 dark:bg-white/10 px-1.5 py-0.5 rounded-md font-mono font-bold">
              {matchingProducts.length}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeFilter === 'customers'}
            onClick={() => { setActiveFilter('customers'); setSelectedIndex(0); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap min-h-[36px] focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none ${
              activeFilter === 'customers'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <User className="w-3.5 h-3.5" aria-hidden="true" />
            <span>العملاء</span>
            <span className="text-[10px] bg-black/10 dark:bg-white/10 px-1.5 py-0.5 rounded-md font-mono font-bold">
              {matchingCustomers.length}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeFilter === 'invoices'}
            onClick={() => { setActiveFilter('invoices'); setSelectedIndex(0); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap min-h-[36px] focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none ${
              activeFilter === 'invoices'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" aria-hidden="true" />
            <span>الفواتير</span>
            <span className="text-[10px] bg-black/10 dark:bg-white/10 px-1.5 py-0.5 rounded-md font-mono font-bold">
              {matchingInvoices.length}
            </span>
          </button>
        </div>

        {/* Results List */}
        <div id="global-search-results" role="listbox" aria-label="نتائج البحث" ref={listRef} className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {combinedResults.length === 0 ? (
            <div className="py-12 px-4 text-center text-slate-400 dark:text-slate-500 space-y-2">
              <Search className="w-12 h-12 mx-auto stroke-1 text-slate-300 dark:text-slate-700" />
              <p className="font-bold text-sm">لم يتم العثور على نتائج تطابق "{query}"</p>
              <p className="text-xs text-slate-400">جرّب البحث باسم المنتجات، الباركود، اسم العميل، أو رقم الفاتورة.</p>
            </div>
          ) : (
            combinedResults.map((item, idx) => {
              const isSelected = idx === selectedIndex;

              if (item.type === 'product') {
                const product = item.data;
                const isLowStock = product.stock <= (product.minStock || 5);
                return (
                  <div
                    key={`prod_${product.id}`}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelectResult(item)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 shadow-xs'
                        : 'bg-white dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 hover:border-emerald-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                        {product.image ? (
                          <img src={product.image} alt="" className="w-full h-full object-cover rounded-xl" />
                        ) : (
                          <Package className="w-5 h-5" aria-hidden="true" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 dark:text-slate-100 text-xs sm:text-sm truncate">
                            {product.name}
                          </span>
                          <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-[10px] font-bold rounded-md shrink-0">
                            منتج
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5 font-mono">
                          {product.barcode && <span>باركود: {product.barcode}</span>}
                          {product.sku && <span>• SKU: {product.sku}</span>}
                          {product.category && <span>• {product.category}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="text-left shrink-0">
                      <div className="font-mono font-extrabold text-xs sm:text-sm text-emerald-600 dark:text-emerald-400">
                        {product.price.toFixed(2)} {settings.currency}
                      </div>
                      <div className={`text-[10px] font-bold mt-0.5 ${isLowStock ? 'text-rose-500' : 'text-slate-500 dark:text-slate-400'}`}>
                        المخزون: {product.stock} {product.unit}
                      </div>
                    </div>
                  </div>
                );
              }

              if (item.type === 'customer') {
                const customer = item.data;
                const hasBalance = customer.balance !== 0;
                return (
                  <div
                    key={`cust_${customer.id}`}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelectResult(item)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 shadow-xs'
                        : 'bg-white dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0">
                        <User className="w-5 h-5" aria-hidden="true" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 dark:text-slate-100 text-xs sm:text-sm truncate">
                            {customer.name}
                          </span>
                          <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-[10px] font-bold rounded-md shrink-0">
                            عميل
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5 font-mono">
                          {customer.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {customer.phone}</span>}
                          {customer.taxNumber && <span>• ضريبي: {customer.taxNumber}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="text-left shrink-0">
                      <div className={`font-mono font-extrabold text-xs sm:text-sm ${
                        customer.balance > 0 ? 'text-amber-600 dark:text-amber-400' : customer.balance < 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'
                      }`}>
                        الرصيد: {customer.balance.toFixed(2)} {settings.currency}
                      </div>
                      <div className="text-[10px] text-slate-400 font-bold mt-0.5">
                        {customer.type ? `فئة: ${customer.type}` : 'عميل مسجل'}
                      </div>
                    </div>
                  </div>
                );
              }

              if (item.type === 'invoice') {
                const invoice = item.data;
                const getStatusBadge = (status: string) => {
                  switch (status) {
                    case 'paid':
                      return <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded text-[10px] font-bold">مدفوعة</span>;
                    case 'partially_paid':
                      return <span className="px-2 py-0.5 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 rounded text-[10px] font-bold">جزئي</span>;
                    case 'returned':
                      return <span className="px-2 py-0.5 bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 rounded text-[10px] font-bold">مرتجعة</span>;
                    default:
                      return <span className="px-2 py-0.5 bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 rounded text-[10px] font-bold">غير مدفوعة</span>;
                  }
                };

                return (
                  <div
                    key={`inv_${invoice.id}`}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelectResult(item)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-500 shadow-xs'
                        : 'bg-white dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 hover:border-purple-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 flex items-center justify-center shrink-0">
                        <Receipt className="w-5 h-5" aria-hidden="true" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-800 dark:text-slate-100 text-xs sm:text-sm truncate">
                            {invoice.invoiceNumber}
                          </span>
                          {getStatusBadge(invoice.status)}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>العميل: {invoice.customerName || 'عميل نقدي'}</span>
                          <span>•</span>
                          <span className="font-mono flex items-center gap-0.5"><Calendar className="w-3 h-3" /> {new Date(invoice.date).toLocaleDateString('ar-SA')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-left shrink-0">
                      <div className="font-mono font-extrabold text-xs sm:text-sm text-purple-700 dark:text-purple-300">
                        {invoice.grandTotal.toFixed(2)} {settings.currency}
                      </div>
                      <div className="text-[10px] text-slate-400 font-bold mt-0.5">
                        طريقة الدفع: {invoice.paymentMethod === 'cash' ? 'نقداً' : invoice.paymentMethod === 'card' ? 'بطاقة' : 'آجل'}
                      </div>
                    </div>
                  </div>
                );
              }

              return null;
            })
          )}
        </div>

        {/* Keyboard Quick Navigation Footer */}
        <div className="p-3 bg-slate-100 dark:bg-slate-800/90 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between font-bold">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="bg-white dark:bg-slate-700 px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-600 font-mono text-[10px]">↑</kbd>
              <kbd className="bg-white dark:bg-slate-700 px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-600 font-mono text-[10px]">↓</kbd>
              <span>للتنقل</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="bg-white dark:bg-slate-700 px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-600 font-mono text-[10px]">↵</kbd>
              <span>لاختيار العنصر</span>
            </span>
          </div>

          <div className="text-[10px] text-slate-400">
            البحث الشامل لـ AD1 ERP
          </div>
        </div>
      </div>
    </div>
  );
}
