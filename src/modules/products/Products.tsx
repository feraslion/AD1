import React, { useState, useEffect, useMemo } from 'react';
import { 
  Package, Plus, Search, Filter, Grid, List, Edit2, Trash2, History, 
  Barcode, Layers, Tag, DollarSign, Percent, AlertTriangle, CheckCircle, 
  RefreshCw, Printer, ArrowUpDown, Eye, Sliders, FileText, ChevronRight, 
  Scale, Globe, Check, X, Building, ArrowUpRight, ArrowDownRight, Box, AlertCircle
} from 'lucide-react';
import { Product, Category, Unit, StoreSettings, ProductBarcode, ProductVariant, ProductHistoryEntry } from '../../types';
import { ProductService, CategoryService, UnitService, CurrencyService } from '../../services/api';

interface ProductsProps {
  settings: StoreSettings;
  onNavigateToInventory?: () => void;
}

export default function Products({ settings, onNavigateToInventory }: ProductsProps) {
  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Views
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStockFilter, setSelectedStockFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'stock' | 'margin'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Modals state
  const [showProductModal, setShowProductModal] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [showCategoriesModal, setShowCategoriesModal] = useState<boolean>(false);
  const [showUnitsModal, setShowUnitsModal] = useState<boolean>(false);

  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [selectedHistoryProduct, setSelectedHistoryProduct] = useState<Product | null>(null);
  const [productHistory, setProductHistory] = useState<ProductHistoryEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

  const [showBarcodeModal, setShowBarcodeModal] = useState<boolean>(false);
  const [selectedBarcodeProduct, setSelectedBarcodeProduct] = useState<Product | null>(null);
  const [barcodePrintCount, setBarcodePrintCount] = useState<number>(10);
  const [barcodeLabelSize, setBarcodeLabelSize] = useState<'50x25' | '38x25' | 'a4'>('50x25');
  const [showPriceOnLabel, setShowPriceOnLabel] = useState<boolean>(true);
  const [showStoreNameOnLabel, setShowStoreNameOnLabel] = useState<boolean>(true);

  // Active currency view selector
  const [displayCurrency, setDisplayCurrency] = useState<string>('SAR');
  const [currencyExchangeRate, setCurrencyExchangeRate] = useState<number>(1);

  // Load Data
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [prodsData, catsData, unitsData, currData] = await Promise.all([
        ProductService.getProducts(),
        CategoryService.getCategories(),
        UnitService.getUnits(),
        CurrencyService.getCurrencies().catch(() => [])
      ]);
      setProducts(prodsData || []);
      setCategories(catsData || []);
      setUnits(unitsData || []);
      setCurrencies(currData || []);
    } catch (err: any) {
      console.error('Error loading products data:', err);
      setError('حدث خطأ أثناء تحميل بيانات المنتجات والخدمات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // Search
      const searchLower = searchTerm.toLowerCase().trim();
      const matchSearch = !searchLower || (
        p.name.toLowerCase().includes(searchLower) ||
        p.barcode.toLowerCase().includes(searchLower) ||
        (p.sku && p.sku.toLowerCase().includes(searchLower)) ||
        (p.barcodes && p.barcodes.some(b => b.barcode.toLowerCase().includes(searchLower)))
      );

      // Category
      const matchCategory = selectedCategory === 'all' || p.category === selectedCategory;

      // Stock status
      const stockVal = p.stock || 0;
      const minStockVal = p.minStock || 0;
      let matchStock = true;
      if (selectedStockFilter === 'in_stock') {
        matchStock = stockVal > minStockVal;
      } else if (selectedStockFilter === 'low_stock') {
        matchStock = stockVal > 0 && stockVal <= minStockVal;
      } else if (selectedStockFilter === 'out_of_stock') {
        matchStock = stockVal <= 0;
      }

      return matchSearch && matchCategory && matchStock;
    }).sort((a, b) => {
      let valA: any = a.name;
      let valB: any = b.name;

      if (sortBy === 'price') {
        valA = a.price || 0;
        valB = b.price || 0;
      } else if (sortBy === 'stock') {
        valA = a.stock || 0;
        valB = b.stock || 0;
      } else if (sortBy === 'margin') {
        valA = a.price > 0 ? ((a.price - a.purchasePrice) / a.price) * 100 : 0;
        valB = b.price > 0 ? ((b.price - b.purchasePrice) / b.price) * 100 : 0;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [products, searchTerm, selectedCategory, selectedStockFilter, sortBy, sortOrder]);

  // KPIs
  const stats = useMemo(() => {
    const totalCount = products.length;
    let totalSalesVal = 0;
    let totalCostVal = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    products.forEach(p => {
      const stock = p.stock || 0;
      const price = p.price || 0;
      const cost = p.purchasePrice || 0;

      totalSalesVal += stock * price;
      totalCostVal += stock * cost;

      if (stock <= 0) {
        outOfStockCount++;
      } else if (stock <= (p.minStock || 0)) {
        lowStockCount++;
      }
    });

    const expectedProfit = totalSalesVal - totalCostVal;
    const marginPct = totalSalesVal > 0 ? (expectedProfit / totalSalesVal) * 100 : 0;

    return {
      totalCount,
      totalSalesVal,
      totalCostVal,
      expectedProfit,
      marginPct,
      lowStockCount,
      outOfStockCount
    };
  }, [products]);

  // Open Product History
  const handleOpenHistory = async (product: Product) => {
    setSelectedHistoryProduct(product);
    setShowHistoryModal(true);
    setLoadingHistory(true);
    try {
      const history = await ProductService.getProductHistory(product.id);
      setProductHistory(history || []);
    } catch (err) {
      console.error('Failed to load product history:', err);
      setProductHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Open Barcode Generator
  const handleOpenBarcode = (product: Product) => {
    setSelectedBarcodeProduct(product);
    setShowBarcodeModal(true);
  };

  // Delete Product
  const handleDeleteProduct = async (id: string, name: string) => {
    if (!window.confirm(`هل أنت تأكد من رغبتك في حذف المنتج: "${name}"؟`)) return;
    try {
      await ProductService.deleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (err: any) {
      alert('فشل حذف المنتج: ' + (err.message || 'خطأ غير معروف'));
    }
  };

  // Save Product (Create / Update)
  const handleSaveProduct = async (productData: Product) => {
    try {
      const saved = await ProductService.createProduct(productData);
      setProducts(prev => {
        const idx = prev.findIndex(p => p.id === saved.id);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = { ...saved, ...productData };
          return copy;
        }
        return [saved, ...prev];
      });
      setShowProductModal(false);
      setEditingProduct(null);
    } catch (err: any) {
      alert('فشل حفظ المنتج: ' + (err.message || 'خطأ في الاتصال بالخادم'));
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-slate-900 text-slate-100 min-h-screen dir-rtl" dir="rtl">
      
      {/* HEADER TITLE & TOP ACTIONS */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-800/80 p-5 rounded-2xl border border-slate-700/60 shadow-lg backdrop-blur-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <Package className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide">كتالوج المنتجات والخدمات (ERP Product Catalog)</h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                إدارة شاملة للمنتجات، التصنيفات، وحدات القياس، الباركوادت، هامش الربح، والربط المخزني
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => { setEditingProduct(null); setShowProductModal(true); }}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة منتج جديد</span>
          </button>

          <button
            onClick={() => setShowCategoriesModal(true)}
            className="px-3.5 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs sm:text-sm rounded-xl transition-all border border-slate-600 flex items-center gap-2"
          >
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>التصنيفات ({categories.length})</span>
          </button>

          <button
            onClick={() => setShowUnitsModal(true)}
            className="px-3.5 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs sm:text-sm rounded-xl transition-all border border-slate-600 flex items-center gap-2"
          >
            <Scale className="w-4 h-4 text-cyan-400" />
            <span>الوحدات ({units.length})</span>
          </button>

          {products.length > 0 && (
            <button
              onClick={() => handleOpenBarcode(products[0])}
              className="px-3.5 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs sm:text-sm rounded-xl transition-all border border-slate-600 flex items-center gap-2"
            >
              <Barcode className="w-4 h-4 text-amber-400" />
              <span>طابعة الباركود</span>
            </button>
          )}

          <button
            onClick={fetchData}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-all"
            title="تحديث البيانات"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI DASHBOARD CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Products */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 shadow-sm hover:border-slate-600 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold">إجمالي المنتجات</span>
            <Package className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">{stats.totalCount}</div>
          <p className="text-[11px] text-slate-400 mt-1">منتج وخدمة مسجلة بالنظام</p>
        </div>

        {/* Sales Value */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 shadow-sm hover:border-slate-600 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold">قيمة المخزون (سعر البيع)</span>
            <DollarSign className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-400">
            {stats.totalSalesVal.toLocaleString('ar-SA', { minimumFractionDigits: 2 })} <span className="text-xs text-slate-400 font-normal">{settings.currency}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">القيمة الإجمالية المتوقعة للمبيعات</p>
        </div>

        {/* Cost Value */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 shadow-sm hover:border-slate-600 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold">تكلفة البضائع (سعر الشراء)</span>
            <Tag className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-300">
            {stats.totalCostVal.toLocaleString('ar-SA', { minimumFractionDigits: 2 })} <span className="text-xs text-slate-400 font-normal">{settings.currency}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">إجمالي التكلفة الشاملة للمخزون</p>
        </div>

        {/* Expected Profit & Margin */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 shadow-sm hover:border-slate-600 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold">الأرباح المتوقعة والهامش</span>
            <Percent className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">
            {stats.expectedProfit.toLocaleString('ar-SA', { minimumFractionDigits: 2 })} <span className="text-xs text-slate-400 font-normal">{settings.currency}</span>
          </div>
          <p className="text-[11px] text-emerald-400/90 font-bold mt-1">
            هامش الربح الإجمالي: {stats.marginPct.toFixed(1)}%
          </p>
        </div>

        {/* Low / Out of Stock */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 shadow-sm hover:border-slate-600 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold">تنبيهات المخزون</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl font-black text-amber-400">{stats.lowStockCount}</div>
            <span className="text-xs text-slate-400">منخفض</span>
            <div className="text-lg font-extrabold text-rose-400 mr-2">{stats.outOfStockCount}</div>
            <span className="text-xs text-slate-400">نفد</span>
          </div>
          <p className="text-[11px] text-amber-400/80 mt-1">تتطلب إعادة طلب وتوريد قريب</p>
        </div>
      </div>

      {/* ACCOUNTING & INVENTORY INTEGRATION BADGE */}
      <div className="bg-slate-800/60 border border-slate-700/70 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs text-slate-300">
        <div className="flex items-center gap-3">
          <Building className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <span className="font-extrabold text-white">الربط التلقائي للمنتجات مع القيود والمخزن:</span>
            <span className="text-slate-400 mr-1.5">
              يتم قيد المشتريات على حساب المخزون (1201) وقيد تكلفة المبيعات عند كل عملية بيع كاشير على حساب COGS (5101).
            </span>
          </div>
        </div>
        {onNavigateToInventory && (
          <button
            onClick={onNavigateToInventory}
            className="self-start md:self-auto px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-emerald-400 font-bold rounded-lg transition-all flex items-center gap-1.5 shrink-0"
          >
            <span>الانتقال لإدارة المستودعات والتحركات</span>
            <ChevronRight className="w-4 h-4 rotate-180" />
          </button>
        )}
      </div>

      {/* SEARCH, FILTERING & VIEW TOOLBAR */}
      <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث باسم المنتج، الباركود الرئيسي أو الثانوي، أو SKU..."
              className="w-full pr-10 pl-4 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div className="w-full md:w-52">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full py-2.5 px-3 bg-slate-900/90 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500 transition-all"
            >
              <option value="all">جميع التصنيفات ({categories.length})</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
          </div>

          {/* Stock Filter */}
          <div className="w-full md:w-48">
            <select
              value={selectedStockFilter}
              onChange={(e: any) => setSelectedStockFilter(e.target.value)}
              className="w-full py-2.5 px-3 bg-slate-900/90 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500 transition-all"
            >
              <option value="all">جميع حالات المخزون</option>
              <option value="in_stock">متوفر بالسعة الكاملة</option>
              <option value="low_stock">منخفض (تنبيه الطلب)</option>
              <option value="out_of_stock">منتهي / غير متوفر</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-700 rounded-xl p-1 shrink-0">
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="py-1.5 px-2 bg-transparent text-xs text-white focus:outline-none cursor-pointer"
            >
              <option value="name">ترتيب بالاسم</option>
              <option value="price">ترتيب بالسعر</option>
              <option value="stock">ترتيب بالكمية</option>
              <option value="margin">ترتيب بنسبة الربح</option>
            </select>
            <button
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all"
              title="تغيير الاتجاه"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Grid vs Table Mode Toggle */}
          <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-700 rounded-xl p-1 shrink-0">
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                viewMode === 'table' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">جدول</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                viewMode === 'grid' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Grid className="w-4 h-4" />
              <span className="hidden sm:inline">بطاقات</span>
            </button>
          </div>

        </div>

        {/* Active Filter Badges */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
          <div>
            عرض <span className="font-extrabold text-white">{filteredProducts.length}</span> من أصل <span className="font-extrabold text-white">{products.length}</span> منتج
          </div>
          {(searchTerm || selectedCategory !== 'all' || selectedStockFilter !== 'all') && (
            <button
              onClick={() => { setSearchTerm(''); setSelectedCategory('all'); setSelectedStockFilter('all'); }}
              className="text-emerald-400 hover:underline font-bold"
            >
              إعادة ضبط الفلاتر
            </button>
          )}
        </div>
      </div>

      {/* PRODUCTS DISPLAY LIST */}
      {loading ? (
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-12 text-center text-slate-400 space-y-3">
          <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
          <p className="font-bold text-sm">جاري تحميل دليل المنتجات والأسعار...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-12 text-center text-slate-400 space-y-3">
          <Package className="w-12 h-12 text-slate-600 mx-auto" />
          <p className="font-bold text-white text-base">لم يتم العثور على أي منتجات مطابقة لخيارات البحث</p>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            تأكد من كتابة الاسم أو الباركود بشكل صحيح، أو أضف منتج جديد للكتالوج الخاص بك.
          </p>
          <button
            onClick={() => { setEditingProduct(null); setShowProductModal(true); }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all"
          >
            إضافة أول منتج الآن
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs sm:text-sm text-slate-200">
              <thead className="bg-slate-900/80 text-slate-400 font-extrabold border-b border-slate-700/80 uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">الصورة والمنتج</th>
                  <th className="py-3.5 px-4">الباركود & SKU</th>
                  <th className="py-3.5 px-4">التصنيف والوحدة</th>
                  <th className="py-3.5 px-4">سعر التكلفة</th>
                  <th className="py-3.5 px-4">سعر البيع</th>
                  <th className="py-3.5 px-4">هامش الربح %</th>
                  <th className="py-3.5 px-4">الضريبة %</th>
                  <th className="py-3.5 px-4">الكمية المتوفرة</th>
                  <th className="py-3.5 px-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {filteredProducts.map((p) => {
                  const categoryObj = categories.find(c => c.id === p.category);
                  const price = p.price || 0;
                  const cost = p.purchasePrice || 0;
                  const margin = price > 0 ? ((price - cost) / price) * 100 : 0;
                  const profitVal = price - cost;
                  const stock = p.stock || 0;
                  const minStock = p.minStock || 0;

                  let stockBadgeClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
                  let stockText = 'متوفر';
                  if (stock <= 0) {
                    stockBadgeClass = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
                    stockText = 'نفد المخزون';
                  } else if (stock <= minStock) {
                    stockBadgeClass = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
                    stockText = 'منخفض';
                  }

                  return (
                    <tr key={p.id} className="hover:bg-slate-700/30 transition-all">
                      {/* Name & Image */}
                      <td className="py-3 px-4 font-bold text-white">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                            {p.image ? (
                              <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-5 h-5 text-slate-500" />
                            )}
                          </div>
                          <div>
                            <div className="font-extrabold text-white text-sm">{p.name}</div>
                            {p.description && (
                              <p className="text-[11px] text-slate-400 line-clamp-1">{p.description}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Barcode & SKU */}
                      <td className="py-3 px-4">
                        <div className="font-mono text-xs text-slate-300 flex items-center gap-1.5">
                          <Barcode className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>{p.barcode}</span>
                        </div>
                        {p.barcodes && p.barcodes.length > 0 && (
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            +{p.barcodes.length} باركود فرعي
                          </div>
                        )}
                        {p.sku && (
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            SKU: {p.sku}
                          </div>
                        )}
                      </td>

                      {/* Category & Unit */}
                      <td className="py-3 px-4">
                        <div className="text-xs font-bold text-slate-200 flex items-center gap-1">
                          <span>{categoryObj?.icon || '📦'}</span>
                          <span>{categoryObj?.name || p.category}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          الوحدة: <span className="text-slate-300 font-semibold">{p.unit}</span>
                        </div>
                      </td>

                      {/* Cost Price */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-300">
                        {cost.toFixed(2)} <span className="text-[10px] text-slate-500">{settings.currency}</span>
                      </td>

                      {/* Selling Price */}
                      <td className="py-3 px-4 font-mono font-black text-emerald-400 text-sm">
                        {price.toFixed(2)} <span className="text-[10px] text-slate-400 font-normal">{settings.currency}</span>
                      </td>

                      {/* Profit Margin */}
                      <td className="py-3 px-4">
                        <div className={`font-mono font-bold text-xs ${margin >= 20 ? 'text-emerald-400' : margin > 0 ? 'text-amber-400' : 'text-rose-400'}`}>
                          {margin.toFixed(1)}%
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          +{profitVal.toFixed(2)} {settings.currency}
                        </div>
                      </td>

                      {/* Tax Rate */}
                      <td className="py-3 px-4 text-xs font-semibold text-slate-300">
                        {p.taxRate ?? 15}%
                        {p.isTaxInclusive && (
                          <span className="block text-[9px] text-emerald-400 font-bold">شامل الضريبة</span>
                        )}
                      </td>

                      {/* Stock Quantity */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${stockBadgeClass}`}>
                            {stock} {p.unit} ({stockText})
                          </span>
                        </div>
                        {stock <= minStock && stock > 0 && (
                          <div className="text-[10px] text-amber-400 mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            <span>وصل حد الطلب ({minStock})</span>
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenHistory(p)}
                            className="p-1.5 bg-slate-700/80 hover:bg-slate-600 text-blue-400 rounded-lg transition-all"
                            title="سجل حركة المنتج"
                          >
                            <History className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleOpenBarcode(p)}
                            className="p-1.5 bg-slate-700/80 hover:bg-slate-600 text-amber-400 rounded-lg transition-all"
                            title="طباعة الباركود"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => { setEditingProduct(p); setShowProductModal(true); }}
                            className="p-1.5 bg-slate-700/80 hover:bg-slate-600 text-emerald-400 rounded-lg transition-all"
                            title="تعديل البيانات"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDeleteProduct(p.id, p.name)}
                            className="p-1.5 bg-slate-700/80 hover:bg-rose-600 text-rose-400 hover:text-white rounded-lg transition-all"
                            title="حذف المنتج"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GRID CARDS VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((p) => {
            const categoryObj = categories.find(c => c.id === p.category);
            const price = p.price || 0;
            const cost = p.purchasePrice || 0;
            const margin = price > 0 ? ((price - cost) / price) * 100 : 0;
            const stock = p.stock || 0;
            const minStock = p.minStock || 0;

            let stockBadgeClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            let stockText = 'متوفر';
            if (stock <= 0) {
              stockBadgeClass = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
              stockText = 'نفد المخزون';
            } else if (stock <= minStock) {
              stockBadgeClass = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
              stockText = 'منخفض';
            }

            return (
              <div 
                key={p.id}
                className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 shadow-lg hover:border-slate-600 transition-all flex flex-col justify-between space-y-3 group"
              >
                <div>
                  {/* Top Image & Category */}
                  <div className="relative h-36 rounded-xl bg-slate-900 border border-slate-700/60 overflow-hidden mb-3 flex items-center justify-center">
                    {p.image ? (
                      <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <Package className="w-12 h-12 text-slate-600" />
                    )}
                    <div className="absolute top-2 right-2 bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-700 text-[10px] font-bold text-slate-200 flex items-center gap-1">
                      <span>{categoryObj?.icon || '📦'}</span>
                      <span>{categoryObj?.name || p.category}</span>
                    </div>

                    <div className={`absolute bottom-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold border ${stockBadgeClass}`}>
                      {stock} {p.unit} ({stockText})
                    </div>
                  </div>

                  {/* Title & Barcode */}
                  <h3 className="font-extrabold text-white text-base line-clamp-1">{p.name}</h3>
                  <div className="text-xs text-slate-400 font-mono flex items-center gap-1.5 mt-1">
                    <Barcode className="w-3.5 h-3.5 text-amber-400" />
                    <span>{p.barcode}</span>
                  </div>

                  {/* Prices & Margin */}
                  <div className="mt-3 pt-3 border-t border-slate-700/60 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">سعر التكلفة:</span>
                      <span className="font-mono font-bold text-slate-300">{cost.toFixed(2)} {settings.currency}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">سعر البيع:</span>
                      <span className="font-mono font-black text-emerald-400 text-sm">{price.toFixed(2)} {settings.currency}</span>
                    </div>
                  </div>

                  <div className="mt-2 text-[11px] flex items-center justify-between text-slate-400 bg-slate-900/60 px-2.5 py-1.5 rounded-lg border border-slate-800">
                    <span>الهامش: <strong className={margin >= 20 ? 'text-emerald-400' : 'text-amber-400'}>{margin.toFixed(1)}%</strong></span>
                    <span>الضريبة: <strong className="text-slate-200">{p.taxRate ?? 15}%</strong></span>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between gap-1">
                  <button
                    onClick={() => handleOpenHistory(p)}
                    className="p-2 bg-slate-700/70 hover:bg-slate-600 text-blue-400 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                    title="سجل حركة المنتج"
                  >
                    <History className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">السجل</span>
                  </button>

                  <button
                    onClick={() => handleOpenBarcode(p)}
                    className="p-2 bg-slate-700/70 hover:bg-slate-600 text-amber-400 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                    title="طباعة الباركود"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">باركود</span>
                  </button>

                  <button
                    onClick={() => { setEditingProduct(p); setShowProductModal(true); }}
                    className="p-2 bg-slate-700/70 hover:bg-slate-600 text-emerald-400 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                    title="تعديل المنتج"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">تعديل</span>
                  </button>

                  <button
                    onClick={() => handleDeleteProduct(p.id, p.name)}
                    className="p-2 bg-slate-700/70 hover:bg-rose-600 text-rose-400 hover:text-white rounded-xl transition-all"
                    title="حذف"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================= */}
      {/* 1. ADD / EDIT PRODUCT MODAL */}
      {/* ========================================================= */}
      {showProductModal && (
        <ProductFormModal
          product={editingProduct}
          categories={categories}
          units={units}
          settings={settings}
          currencies={currencies}
          onClose={() => { setShowProductModal(false); setEditingProduct(null); }}
          onSave={handleSaveProduct}
        />
      )}

      {/* ========================================================= */}
      {/* 2. CATEGORIES MODAL */}
      {/* ========================================================= */}
      {showCategoriesModal && (
        <CategoriesManagerModal
          categories={categories}
          products={products}
          onClose={() => setShowCategoriesModal(false)}
          onUpdateCategories={setCategories}
        />
      )}

      {/* ========================================================= */}
      {/* 3. UNITS MODAL */}
      {/* ========================================================= */}
      {showUnitsModal && (
        <UnitsManagerModal
          units={units}
          onClose={() => setShowUnitsModal(false)}
          onUpdateUnits={setUnits}
        />
      )}

      {/* ========================================================= */}
      {/* 4. PRODUCT MOVEMENT HISTORY MODAL */}
      {/* ========================================================= */}
      {showHistoryModal && selectedHistoryProduct && (
        <ProductHistoryViewModal
          product={selectedHistoryProduct}
          history={productHistory}
          loading={loadingHistory}
          settings={settings}
          onClose={() => { setShowHistoryModal(false); setSelectedHistoryProduct(null); }}
        />
      )}

      {/* ========================================================= */}
      {/* 5. BARCODE LABEL GENERATOR & PRINT MODAL */}
      {/* ========================================================= */}
      {showBarcodeModal && selectedBarcodeProduct && (
        <BarcodePrintModal
          product={selectedBarcodeProduct}
          settings={settings}
          printCount={barcodePrintCount}
          setPrintCount={setBarcodePrintCount}
          labelSize={barcodeLabelSize}
          setLabelSize={setBarcodeLabelSize}
          showPrice={showPriceOnLabel}
          setShowPrice={setShowPriceOnLabel}
          showStoreName={showStoreNameOnLabel}
          setShowStoreName={setShowStoreNameOnLabel}
          onClose={() => { setShowBarcodeModal(false); setSelectedBarcodeProduct(null); }}
        />
      )}

    </div>
  );
}

/* ==================================================================== */
/* PRODUCT FORM MODAL COMPONENT (ADD & EDIT WITH MARGIN & TAX)         */
/* ==================================================================== */
function ProductFormModal({
  product,
  categories,
  units,
  settings,
  currencies,
  onClose,
  onSave
}: {
  product: Product | null;
  categories: Category[];
  units: Unit[];
  settings: StoreSettings;
  currencies: any[];
  onClose: () => void;
  onSave: (p: Product) => void;
}) {
  const [activeTab, setActiveTab] = useState<'basic' | 'pricing' | 'barcodes' | 'variants'>('basic');

  // Form Fields
  const [name, setName] = useState<string>(product?.name || '');
  const [barcode, setBarcode] = useState<string>(product?.barcode || '');
  const [sku, setSku] = useState<string>(product?.sku || '');
  const [category, setCategory] = useState<string>(product?.category || (categories[0]?.id || 'cat-1'));
  const [unit, setUnit] = useState<string>(product?.unit || (units[0]?.name || 'حبة'));
  const [price, setPrice] = useState<number>(product?.price || 0);
  const [purchasePrice, setPurchasePrice] = useState<number>(product?.purchasePrice || 0);
  const [minSellingPrice, setMinSellingPrice] = useState<number>(product?.minSellingPrice || 0);
  const [stock, setStock] = useState<number>(product?.stock || 0);
  const [minStock, setMinStock] = useState<number>(product?.minStock || 5);
  const [taxRate, setTaxRate] = useState<number>(product?.taxRate ?? settings.taxRate ?? 15);
  const [isTaxInclusive, setIsTaxInclusive] = useState<boolean>(product?.isTaxInclusive ?? true);
  const [image, setImage] = useState<string>(product?.image || '');
  const [description, setDescription] = useState<string>(product?.description || '');

  // Secondary Barcodes
  const [secondaryBarcodes, setSecondaryBarcodes] = useState<ProductBarcode[]>(product?.barcodes || []);
  const [newBarcodeVal, setNewBarcodeVal] = useState<string>('');
  const [newBarcodeLabel, setNewBarcodeLabel] = useState<string>('');

  // Variants
  const [variants, setVariants] = useState<ProductVariant[]>(product?.variants || []);
  const [newVariantName, setNewVariantName] = useState<string>('');
  const [newVariantPrice, setNewVariantPrice] = useState<number>(0);
  const [newVariantStock, setNewVariantStock] = useState<number>(0);

  // Auto Profit Calculations
  const profitAmount = price - purchasePrice;
  const marginPercentage = price > 0 ? (profitAmount / price) * 100 : 0;

  // Tax Breakdown Calculation
  const basePriceExclTax = isTaxInclusive ? price / (1 + taxRate / 100) : price;
  const computedTaxAmount = isTaxInclusive ? price - basePriceExclTax : price * (taxRate / 100);
  const totalPriceInclTax = isTaxInclusive ? price : price + computedTaxAmount;

  // Barcode Auto Generator EAN-13
  const handleGenerateBarcode = () => {
    const randomCode = '629' + Math.floor(100000000 + Math.random() * 900000000).toString();
    setBarcode(randomCode);
  };

  // Add Secondary Barcode
  const handleAddSecondaryBarcode = () => {
    if (!newBarcodeVal.trim()) return;
    setSecondaryBarcodes(prev => [
      ...prev,
      {
        id: 'bc_' + Math.random().toString(36).substr(2, 7),
        productId: product?.id || '',
        barcode: newBarcodeVal.trim(),
        label: newBarcodeLabel.trim() || 'باركود إضافي'
      }
    ]);
    setNewBarcodeVal('');
    setNewBarcodeLabel('');
  };

  // Add Variant
  const handleAddVariant = () => {
    if (!newVariantName.trim()) return;
    setVariants(prev => [
      ...prev,
      {
        id: 'var_' + Math.random().toString(36).substr(2, 7),
        productId: product?.id || '',
        name: newVariantName.trim(),
        price: newVariantPrice || price,
        purchasePrice: purchasePrice,
        stock: newVariantStock
      }
    ]);
    setNewVariantName('');
    setNewVariantPrice(0);
    setNewVariantStock(0);
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('يرجى إدخال اسم المنتج بشكل صحيح');
      return;
    }
    if (!barcode.trim()) {
      alert('يرجى إدخال رمز الباركود أو إنشاء رمز تلقائي');
      return;
    }

    const payload: Product = {
      id: product?.id || 'prod_' + Math.random().toString(36).substr(2, 9),
      name: name.trim(),
      barcode: barcode.trim(),
      sku: sku.trim() || undefined,
      category,
      unit,
      price: Number(price),
      purchasePrice: Number(purchasePrice),
      minSellingPrice: Number(minSellingPrice),
      stock: Number(stock),
      minStock: Number(minStock),
      taxRate: Number(taxRate),
      isTaxInclusive,
      image: image.trim() || undefined,
      description: description.trim() || undefined,
      barcodes: secondaryBarcodes,
      variants: variants
    };

    onSave(payload);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="bg-slate-800/90 p-4 px-6 border-b border-slate-700/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-black text-white text-base">
                {product ? `تعديل البيانات: ${product.name}` : 'تسجيل منتج / خدمة جديدة بالكتالوج'}
              </h2>
              <p className="text-xs text-slate-400">أدخل الأسعار، الضرائب، وحدات القياس، والباركوادت</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/80">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="bg-slate-950 px-6 pt-3 border-b border-slate-800 flex items-center gap-2 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('basic')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all flex items-center gap-1.5 border-b-2 ${
              activeTab === 'basic'
                ? 'bg-slate-800 text-emerald-400 border-emerald-500'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>البيانات الأساسية</span>
          </button>

          <button
            onClick={() => setActiveTab('pricing')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all flex items-center gap-1.5 border-b-2 ${
              activeTab === 'pricing'
                ? 'bg-slate-800 text-emerald-400 border-emerald-500'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>الأسعار، التكلفة والضرائب</span>
          </button>

          <button
            onClick={() => setActiveTab('barcodes')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all flex items-center gap-1.5 border-b-2 ${
              activeTab === 'barcodes'
                ? 'bg-slate-800 text-emerald-400 border-emerald-500'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <Barcode className="w-4 h-4" />
            <span>الباركوادت المتعددة ({secondaryBarcodes.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('variants')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all flex items-center gap-1.5 border-b-2 ${
              activeTab === 'variants'
                ? 'bg-slate-800 text-emerald-400 border-emerald-500'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>المتغيرات والأصناف ({variants.length})</span>
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
          
          {/* TAB 1: BASIC INFO */}
          {activeTab === 'basic' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Product Name */}
                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-xs font-extrabold text-slate-300 mb-1">
                    اسم المنتج / الخدمة بالكامل <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثال: حليب المراعي كامل الدسم 1 لتر"
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Main Barcode & Generator */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-300 mb-1">
                    الباركود الرئيسي <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      placeholder="629110001002"
                      className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={handleGenerateBarcode}
                      className="px-3 py-2.5 bg-slate-700 hover:bg-slate-600 text-amber-400 text-xs font-bold rounded-xl transition-all shrink-0 border border-slate-600"
                      title="إنشاء رمز تجاري تلقائياً"
                    >
                      توليد EAN
                    </button>
                  </div>
                </div>

                {/* SKU Code */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-300 mb-1">
                    رمز SKU / المرجع الفرعي
                  </label>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="MILK-1L-001"
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-300 mb-1">
                    التصنيف الرئيسي <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Unit */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-300 mb-1">
                    وحدة القياس <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    {units.map(u => (
                      <option key={u.id} value={u.name}>{u.name}</option>
                    ))}
                  </select>
                </div>

                {/* Stock Quantity */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-300 mb-1">
                    الرصيد/الكمية الحالية
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={stock}
                    onChange={(e) => setStock(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Min Stock Alert */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-300 mb-1">
                    حد إعادة الطلب (Min Stock)
                  </label>
                  <input
                    type="number"
                    value={minStock}
                    onChange={(e) => setMinStock(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Image URL */}
                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-xs font-extrabold text-slate-300 mb-1">
                    رابط صورة المنتج (URL)
                  </label>
                  <input
                    type="url"
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Description */}
                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-xs font-extrabold text-slate-300 mb-1">
                    الوصف أو التاصيل الإضافية
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="تفاصيل المكونات أو طريقة الاستخدام..."
                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PRICING & TAXES */}
          {activeTab === 'pricing' && (
            <div className="space-y-5">
              
              {/* Cost & Selling Prices */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-300 mb-1">
                    سعر الشراء / التكلفة ({settings.currency})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-mono font-bold text-purple-300 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-300 mb-1">
                    سعر البيع الافتراضي ({settings.currency})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={price}
                    onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-mono font-black text-emerald-400 focus:outline-none focus:border-emerald-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-300 mb-1">
                    الحد الأدنى لسعر البيع
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={minSellingPrice}
                    onChange={(e) => setMinSellingPrice(parseFloat(e.target.value) || 0)}
                    placeholder="الحد الأدنى للمبيعات"
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-mono text-slate-300 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Profit Margin Automated Live Calculation Box */}
              <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-300 flex items-center gap-1.5">
                    <Percent className="w-4 h-4 text-emerald-400" />
                    <span>تحليل هامش الربح والربحية للوحدة:</span>
                  </span>
                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md border ${
                    marginPercentage >= 20 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                      : marginPercentage > 0
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  }`}>
                    هامش الربح: {marginPercentage.toFixed(1)}%
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs pt-1">
                  <div>
                    <span className="text-slate-400">مبلغ الربح الصافي للقطعة:</span>
                    <p className={`font-mono font-extrabold text-sm ${profitAmount >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {profitAmount.toFixed(2)} {settings.currency}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">تقييم الربحية:</span>
                    <p className="text-slate-200 font-bold">
                      {marginPercentage >= 25 ? 'ممتازة جداً 🚀' : marginPercentage >= 10 ? 'جيدة ومناسبة 👍' : 'منخفضة/خسارة ⚠️'}
                    </p>
                  </div>
                </div>

                {price < purchasePrice && (
                  <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>تحذير: سعر البيع أقل من سعر الشراء والتكلفة!</span>
                  </div>
                )}
              </div>

              {/* TAX SETTINGS */}
              <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 space-y-4">
                <h3 className="text-xs font-extrabold text-white flex items-center gap-2">
                  <Tag className="w-4 h-4 text-cyan-400" />
                  <span>إعدادات الضريبة على القيمة المضافة (VAT)</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-300 mb-1">
                      نسبة الضريبة المطبقة %
                    </label>
                    <select
                      value={taxRate}
                      onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value={15}>15% (الضريبة الأساسية VAT)</option>
                      <option value={5}>5% (ضريبة مخفضة)</option>
                      <option value={0}>0% (معفى من الضريبة)</option>
                    </select>
                  </div>

                  <div className="flex items-center pt-5">
                    <label className="relative inline-flex items-center cursor-pointer gap-2">
                      <input
                        type="checkbox"
                        checked={isTaxInclusive}
                        onChange={(e) => setIsTaxInclusive(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                      <span className="text-xs font-extrabold text-slate-200">
                        السعر المدخل يشمل الضريبة المضافة
                      </span>
                    </label>
                  </div>
                </div>

                {/* Tax Breakdown Preview */}
                <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-xs space-y-1">
                  <div className="flex justify-between text-slate-400">
                    <span>السعر الأساسي بدون ضريبة:</span>
                    <span className="font-mono text-white font-bold">{basePriceExclTax.toFixed(2)} {settings.currency}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>مبلغ الضريبة ({taxRate}%):</span>
                    <span className="font-mono text-cyan-400 font-bold">{computedTaxAmount.toFixed(2)} {settings.currency}</span>
                  </div>
                  <div className="flex justify-between text-slate-200 pt-1 border-t border-slate-800 font-bold">
                    <span>السعر النهائي بعد الضريبة:</span>
                    <span className="font-mono text-emerald-400 text-sm">{totalPriceInclTax.toFixed(2)} {settings.currency}</span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: SECONDARY BARCODES */}
          {activeTab === 'barcodes' && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs rounded-xl">
                يدعم النظام ربط أكثر من باركود بنفس المنتج (مثلاً باركود الحبة، باركود الكرتونة، باركود المورد البديل) لسهولة المسح في POS.
              </div>

              {/* Add Barcode Input */}
              <div className="flex flex-col sm:flex-row gap-2 bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                <input
                  type="text"
                  value={newBarcodeVal}
                  onChange={(e) => setNewBarcodeVal(e.target.value)}
                  placeholder="رمز الباركود الإضافي..."
                  className="px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-white flex-1"
                />
                <input
                  type="text"
                  value={newBarcodeLabel}
                  onChange={(e) => setNewBarcodeLabel(e.target.value)}
                  placeholder="وصف (مثلاً: كرتونة 12 حبة)..."
                  className="px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white flex-1"
                />
                <button
                  type="button"
                  onClick={handleAddSecondaryBarcode}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة باركود</span>
                </button>
              </div>

              {/* Barcodes List */}
              <div className="space-y-2">
                <div className="p-2.5 bg-slate-800 rounded-xl border border-slate-700 flex justify-between items-center text-xs font-mono text-emerald-400">
                  <div className="flex items-center gap-2">
                    <Barcode className="w-4 h-4" />
                    <span>{barcode}</span>
                  </div>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-md font-sans">الباركود الرئيسي</span>
                </div>

                {secondaryBarcodes.map((bc, idx) => (
                  <div key={bc.id || idx} className="p-2.5 bg-slate-800/60 rounded-xl border border-slate-700 flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <Barcode className="w-4 h-4 text-amber-400" />
                      <span className="font-mono text-white">{bc.barcode}</span>
                      <span className="text-slate-400 text-[11px]">({bc.label})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSecondaryBarcodes(prev => prev.filter((_, i) => i !== idx))}
                      className="p-1 text-rose-400 hover:text-rose-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: VARIANTS */}
          {activeTab === 'variants' && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs rounded-xl">
                إضافة أصناف ومتغيرات خاصة بالمنتج (مثلاً الحجم، اللون، الوزن) مع إمكانية تخصيص السعر والكمية لكل متغير.
              </div>

              {/* Add Variant Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                <input
                  type="text"
                  value={newVariantName}
                  onChange={(e) => setNewVariantName(e.target.value)}
                  placeholder="اسم المتغير (مثلاً: أحمر / XL)"
                  className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                />
                <input
                  type="number"
                  step="0.01"
                  value={newVariantPrice}
                  onChange={(e) => setNewVariantPrice(parseFloat(e.target.value) || 0)}
                  placeholder="سعر البيع"
                  className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono"
                />
                <input
                  type="number"
                  value={newVariantStock}
                  onChange={(e) => setNewVariantStock(parseFloat(e.target.value) || 0)}
                  placeholder="الكمية"
                  className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono"
                />
                <button
                  type="button"
                  onClick={handleAddVariant}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة صنف</span>
                </button>
              </div>

              {/* Variants List */}
              <div className="space-y-2">
                {variants.map((v, idx) => (
                  <div key={v.id || idx} className="p-3 bg-slate-800 rounded-xl border border-slate-700 flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-white block">{v.name}</span>
                      <span className="text-slate-400 text-[11px]">الكمية المتوفرة: {v.stock}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-emerald-400">{v.price.toFixed(2)} {settings.currency}</span>
                      <button
                        type="button"
                        onClick={() => setVariants(prev => prev.filter((_, i) => i !== idx))}
                        className="p-1 text-rose-400 hover:text-rose-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Modal Footer Controls */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs sm:text-sm rounded-xl transition-all"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-lg flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>{product ? 'حفظ التعديلات' : 'إضافة المنتج للكتالوج'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}

/* ==================================================================== */
/* CATEGORIES MANAGER MODAL                                             */
/* ==================================================================== */
function CategoriesManagerModal({
  categories,
  products,
  onClose,
  onUpdateCategories
}: {
  categories: Category[];
  products: Product[];
  onClose: () => void;
  onUpdateCategories: React.Dispatch<React.SetStateAction<Category[]>>;
}) {
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('📦');

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    const newCat: Category = {
      id: 'cat_' + Math.random().toString(36).substr(2, 7),
      name: newCatName.trim(),
      icon: newCatIcon || '📦'
    };
    try {
      await CategoryService.createCategory(newCat);
      onUpdateCategories(prev => [...prev, newCat]);
      setNewCatName('');
    } catch (err: any) {
      alert('فشل حفظ التصنيف: ' + err.message);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm('هل أنت تأكد من حذف هذا التصنيف؟')) return;
    try {
      await CategoryService.deleteCategory(id);
      onUpdateCategories(prev => prev.filter(c => c.id !== id));
    } catch (err: any) {
      alert('فشل حذف التصنيف: ' + err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl space-y-4 p-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="font-black text-white text-base flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-400" />
            <span>إدارة التصنيفات الرئيسية</span>
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        {/* Add Category */}
        <div className="flex gap-2 bg-slate-800/80 p-3 rounded-xl border border-slate-700">
          <input
            type="text"
            value={newCatIcon}
            onChange={(e) => setNewCatIcon(e.target.value)}
            className="w-12 text-center py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm"
            maxLength={2}
          />
          <input
            type="text"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            placeholder="اسم التصنيف الجديد..."
            className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
          />
          <button
            onClick={handleAddCategory}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all"
          >
            إضافة
          </button>
        </div>

        {/* Categories List */}
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {categories.map(c => {
            const count = products.filter(p => p.category === c.id).length;
            return (
              <div key={c.id} className="p-3 bg-slate-800 rounded-xl border border-slate-700 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{c.icon}</span>
                  <span className="font-bold text-white">{c.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded-md">
                    {count} منتج
                  </span>
                  <button
                    onClick={() => handleDeleteCategory(c.id)}
                    className="p-1 text-rose-400 hover:text-rose-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-2 text-left">
          <button onClick={onClose} className="px-5 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl">
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}

/* ==================================================================== */
/* UNITS MANAGER MODAL                                                  */
/* ==================================================================== */
function UnitsManagerModal({
  units,
  onClose,
  onUpdateUnits
}: {
  units: Unit[];
  onClose: () => void;
  onUpdateUnits: React.Dispatch<React.SetStateAction<Unit[]>>;
}) {
  const [newUnitName, setNewUnitName] = useState('');

  const handleAddUnit = async () => {
    if (!newUnitName.trim()) return;
    const newU: Unit = {
      id: 'unit_' + Math.random().toString(36).substr(2, 7),
      name: newUnitName.trim()
    };
    try {
      await UnitService.createUnit(newU);
      onUpdateUnits(prev => [...prev, newU]);
      setNewUnitName('');
    } catch (err: any) {
      alert('فشل حفظ الوحدة: ' + err.message);
    }
  };

  const handleDeleteUnit = async (id: string) => {
    if (!window.confirm('هل أنت تأكد من حذف هذه الوحدة؟')) return;
    try {
      await UnitService.deleteUnit(id);
      onUpdateUnits(prev => prev.filter(u => u.id !== id));
    } catch (err: any) {
      alert('فشل حذف الوحدة: ' + err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl space-y-4 p-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="font-black text-white text-base flex items-center gap-2">
            <Scale className="w-5 h-5 text-cyan-400" />
            <span>إدارة وحدات القياس القياسية</span>
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        {/* Add Unit */}
        <div className="flex gap-2 bg-slate-800/80 p-3 rounded-xl border border-slate-700">
          <input
            type="text"
            value={newUnitName}
            onChange={(e) => setNewUnitName(e.target.value)}
            placeholder="اسم الوحدة الجديد (مثلاً: طقم، علبة)..."
            className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
          />
          <button
            onClick={handleAddUnit}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all"
          >
            إضافة
          </button>
        </div>

        {/* Units Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
          {units.map(u => (
            <div key={u.id} className="p-2.5 bg-slate-800 rounded-xl border border-slate-700 flex items-center justify-between text-xs">
              <span className="font-bold text-white">{u.name}</span>
              <button
                onClick={() => handleDeleteUnit(u.id)}
                className="p-1 text-rose-400 hover:text-rose-300"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        <div className="pt-2 text-left">
          <button onClick={onClose} className="px-5 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl">
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}

/* ==================================================================== */
/* PRODUCT MOVEMENT HISTORY VIEW MODAL                                  */
/* ==================================================================== */
function ProductHistoryViewModal({
  product,
  history,
  loading,
  settings,
  onClose
}: {
  product: Product;
  history: ProductHistoryEntry[];
  loading: boolean;
  settings: StoreSettings;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="bg-slate-800/90 p-4 px-6 border-b border-slate-700/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-black text-white text-base">سجل حركة وتاريخ المنتج: {product.name}</h2>
              <p className="text-xs text-slate-400 font-mono">الباركود: {product.barcode} | الرصيد الحالي: {product.stock} {product.unit}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        {/* Content Table */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {loading ? (
            <div className="text-center py-10 text-slate-400 space-y-2">
              <RefreshCw className="w-6 h-6 text-blue-400 animate-spin mx-auto" />
              <p className="text-xs font-bold">جاري تحميل سجل الحركة المخزنية...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-10 text-slate-400 space-y-2">
              <Package className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-white">لا توجد تحركات مسجلة لهذا المنتج بعد</p>
              <p className="text-xs text-slate-500">ستظهر المبيعات والمشتريات والتحويلات المخزنية هنا تلقائياً</p>
            </div>
          ) : (
            <div className="bg-slate-800/80 border border-slate-700 rounded-xl overflow-hidden">
              <table className="w-full text-right text-xs text-slate-200">
                <thead className="bg-slate-900/90 text-slate-400 font-extrabold border-b border-slate-700/80">
                  <tr>
                    <th className="py-3 px-3">التاريخ</th>
                    <th className="py-3 px-3">نوع العملية</th>
                    <th className="py-3 px-3">المرجع / رقم الفاتورة</th>
                    <th className="py-3 px-3 text-center">وارد (+)</th>
                    <th className="py-3 px-3 text-center">صادر (-)</th>
                    <th className="py-3 px-3">سعر التكلفة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50 font-mono">
                  {history.map((h, idx) => (
                    <tr key={h.id || idx} className="hover:bg-slate-700/30 transition-all">
                      <td className="py-2.5 px-3 font-sans text-slate-300">{h.date}</td>
                      <td className="py-2.5 px-3 font-sans font-bold">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] ${
                          h.quantityIn > 0 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {h.quantityIn > 0 ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                          <span>{h.typeLabel}</span>
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">{h.reference}</td>
                      <td className="py-2.5 px-3 text-center font-bold text-emerald-400">
                        {h.quantityIn > 0 ? `+${h.quantityIn}` : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-rose-400">
                        {h.quantityOut > 0 ? `-${h.quantityOut}` : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">
                        {h.unitPrice ? h.unitPrice.toFixed(2) : '0.00'} {settings.currency}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-800/80 border-t border-slate-700 flex justify-end">
          <button onClick={onClose} className="px-5 py-2 bg-slate-700 text-slate-200 text-xs font-bold rounded-xl">
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
}

/* ==================================================================== */
/* BARCODE PRINT & GENERATOR MODAL                                      */
/* ==================================================================== */
function BarcodePrintModal({
  product,
  settings,
  printCount,
  setPrintCount,
  labelSize,
  setLabelSize,
  showPrice,
  setShowPrice,
  showStoreName,
  setShowStoreName,
  onClose
}: {
  product: Product;
  settings: StoreSettings;
  printCount: number;
  setPrintCount: (n: number) => void;
  labelSize: '50x25' | '38x25' | 'a4';
  setLabelSize: (s: '50x25' | '38x25' | 'a4') => void;
  showPrice: boolean;
  setShowPrice: (b: boolean) => void;
  showStoreName: boolean;
  setShowStoreName: (b: boolean) => void;
  onClose: () => void;
}) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl space-y-4 p-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-amber-400" />
            <h2 className="font-black text-white text-base">طباعة ملصقات الباركود للمنتج</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        {/* Customization Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-bold text-slate-300 mb-1">عدد نسخ الطباعة المطلوب:</label>
            <input
              type="number"
              min="1"
              max="200"
              value={printCount}
              onChange={(e) => setPrintCount(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-300 mb-1">مقاس ملصق الطباعة:</label>
            <select
              value={labelSize}
              onChange={(e: any) => setLabelSize(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold"
            >
              <option value="50x25">50 × 25 مم (قياسي حراري)</option>
              <option value="38x25">38 × 25 مم (صغير)</option>
              <option value="a4">صفحة A4 متعددة الملصقات</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="showPrice"
              checked={showPrice}
              onChange={(e) => setShowPrice(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700"
            />
            <label htmlFor="showPrice" className="text-slate-200 font-bold">إظهار السعر والعملة على الملصق</label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="showStore"
              checked={showStoreName}
              onChange={(e) => setShowStoreName(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700"
            />
            <label htmlFor="showStore" className="text-slate-200 font-bold">إظهار اسم المتجر والمؤسسة</label>
          </div>
        </div>

        {/* Live SVG Barcode Label Preview Card */}
        <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col items-center justify-center space-y-2 text-center my-2">
          <span className="text-[10px] text-slate-500 font-bold">معاينة الملصق المطبوع</span>
          
          <div className="bg-white text-black p-3 rounded-lg shadow-md max-w-xs w-full text-center space-y-1 font-sans">
            {showStoreName && (
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-0.5">
                {settings.name}
              </div>
            )}
            
            <div className="font-black text-xs text-slate-900 line-clamp-1">{product.name}</div>
            
            {/* Synthetic Code128 SVG Lines Barcode Visual */}
            <div className="py-1 flex items-center justify-center gap-0.5 h-10 overflow-hidden px-4">
              {[2,1,3,1,2,3,1,2,1,3,2,1,3,1,2,1,2,3,1,2,3,1,2].map((w, idx) => (
                <div key={idx} style={{ width: `${w * 1.5}px` }} className="h-full bg-slate-900" />
              ))}
            </div>

            <div className="font-mono text-[11px] font-bold tracking-widest text-slate-800">
              {product.barcode}
            </div>

            {showPrice && (
              <div className="text-xs font-black text-slate-900 pt-0.5 border-t border-slate-200">
                السعر: {product.price.toFixed(2)} {settings.currency} <span className="text-[9px] font-normal">(شامل الضريبة)</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-2">
          <button onClick={onClose} className="px-5 py-2.5 bg-slate-800 text-slate-300 font-bold text-xs rounded-xl">
            إلغاء
          </button>
          <button
            onClick={handlePrint}
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl transition-all flex items-center gap-2 shadow-lg"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة الملصقات الآن ({printCount} نسـخة)</span>
          </button>
        </div>

      </div>
    </div>
  );
}
