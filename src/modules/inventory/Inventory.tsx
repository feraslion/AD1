import React, { useState, useEffect } from 'react';
import { Product, Category, Unit, StoreSettings } from '../../types';
import { 
  Plus, Search, Edit2, Trash2, Tag, Percent, ArrowLeft, RefreshCw, 
  Layers, AlertCircle, ShoppingCart, Warehouse as WarehouseIcon, 
  ArrowLeftRight, ClipboardCheck, History, DollarSign, FileText, CheckCircle2, TrendingUp
} from 'lucide-react';
import { InventoryService } from '../../services/InventoryService';

interface Warehouse {
  id: string;
  name: string;
  code: string;
  location?: string;
  companyId?: string;
}

interface InventoryProps {
  products: Product[];
  categories: Category[];
  units: Unit[];
  settings: StoreSettings;
  onAddProduct: (prod: Product) => void;
  onUpdateProduct: (prod: Product) => void;
  onDeleteProduct: (id: string) => void;
  onAddCategory: (cat: Category) => void;
  onDeleteCategory: (id: string) => void;
  onRefresh?: () => void;
}

export default function Inventory({ 
  products, 
  categories, 
  units, 
  settings, 
  onAddProduct, 
  onUpdateProduct, 
  onDeleteProduct, 
  onAddCategory, 
  onDeleteCategory,
  onRefresh 
}: InventoryProps) {
  const [activeSubTab, setActiveSubTab] = useState<'products' | 'movements' | 'warehouses' | 'transfers' | 'adjustments' | 'ledger' | 'valuation' | 'lowstock' | 'categories'>('products');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');

  // Valuation Method State (WAC vs FIFO)
  const [valuationMethod, setValuationMethod] = useState<'average' | 'fifo'>('average');

  // Manual Stock Movement State (أذونات حركة المخزون)
  const [moveProdId, setMoveProdId] = useState<string>('');
  const [moveWhId, setMoveWhId] = useState<string>('');
  const [moveType, setMoveType] = useState<'in' | 'out'>('in');
  const [moveQty, setMoveQty] = useState<string>('1');
  const [moveUnitCost, setMoveUnitCost] = useState<string>('');
  const [moveRef, setMoveRef] = useState<string>('');
  const [moveNotes, setMoveNotes] = useState<string>('');
  const [moveLoading, setMoveLoading] = useState<boolean>(false);

  // All Stock Moves list
  const [allStockMoves, setAllStockMoves] = useState<any[]>([]);
  const [stockMovesLoading, setStockMovesLoading] = useState<boolean>(false);

  // Low Stock Alerts State
  const [lowStockAlerts, setLowStockAlerts] = useState<any[]>([]);
  const [lowStockLoading, setLowStockLoading] = useState<boolean>(false);

  // Warehouses state
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [showWhModal, setShowWhModal] = useState<boolean>(false);
  const [editingWh, setEditingWh] = useState<Warehouse | null>(null);
  const [whName, setWhName] = useState<string>('');
  const [whCode, setWhCode] = useState<string>('');
  const [whLocation, setWhLocation] = useState<string>('');

  // Product Add/Edit Dialog state
  const [showProductModal, setShowProductModal] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form Fields
  const [prodName, setProdName] = useState<string>('');
  const [prodBarcode, setProdBarcode] = useState<string>('');
  const [prodPrice, setProdPrice] = useState<string>('');
  const [prodPurchasePrice, setProdPurchasePrice] = useState<string>('');
  const [prodStock, setProdStock] = useState<string>('');
  const [prodMinStock, setProdMinStock] = useState<string>('');
  const [prodCategory, setProdCategory] = useState<string>('');
  const [prodUnit, setProdUnit] = useState<string>('');

  // Category State
  const [newCatName, setNewCatName] = useState<string>('');
  const [newCatIcon, setNewCatIcon] = useState<string>('📦');

  // Transfers State
  const [transferProdId, setTransferProdId] = useState<string>('');
  const [fromWhId, setFromWhId] = useState<string>('');
  const [toWhId, setToWhId] = useState<string>('');
  const [transferQty, setTransferQty] = useState<string>('1');
  const [transferNotes, setTransferNotes] = useState<string>('');
  const [transferLoading, setTransferLoading] = useState<boolean>(false);

  // Adjustments State
  const [adjProdId, setAdjProdId] = useState<string>('');
  const [adjWhId, setAdjWhId] = useState<string>('');
  const [actualCount, setActualCount] = useState<string>('');
  const [adjNotes, setAdjNotes] = useState<string>('');
  const [adjLoading, setAdjLoading] = useState<boolean>(false);

  // Stock Ledger State
  const [ledgerProdId, setLedgerProdId] = useState<string>('');
  const [ledgerData, setLedgerData] = useState<any | null>(null);
  const [ledgerLoading, setLedgerLoading] = useState<boolean>(false);

  // Valuation State
  const [valuationData, setValuationData] = useState<any | null>(null);
  const [valuationLoading, setValuationLoading] = useState<boolean>(false);

  // Fetch Warehouses on Load
  useEffect(() => {
    fetchWarehouses();
  }, []);

  useEffect(() => {
    if (activeSubTab === 'valuation') {
      fetchValuation(valuationMethod);
    }
    if (activeSubTab === 'lowstock') {
      fetchLowStockAlerts();
    }
    if (activeSubTab === 'movements') {
      fetchStockMoves();
    }
  }, [activeSubTab, valuationMethod, products]);

  useEffect(() => {
    if (ledgerProdId) {
      fetchLedger(ledgerProdId);
    }
  }, [ledgerProdId]);

  const fetchLowStockAlerts = async () => {
    setLowStockLoading(true);
    try {
      const data = await InventoryService.getLowStockAlerts();
      setLowStockAlerts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLowStockLoading(false);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const list = await InventoryService.getWarehouses();
      setWarehouses(list);
      if (list.length > 0) {
        if (!fromWhId) setFromWhId(list[0].id);
        if (!toWhId && list.length > 1) setToWhId(list[1].id);
        if (!adjWhId) setAdjWhId(list[0].id);
        if (!moveWhId) setMoveWhId(list[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchValuation = async (method: 'average' | 'fifo' = 'average') => {
    setValuationLoading(true);
    try {
      const data = await InventoryService.getInventoryValuation(method);
      setValuationData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setValuationLoading(false);
    }
  };

  const fetchStockMoves = async () => {
    setStockMovesLoading(true);
    try {
      const moves = await InventoryService.getStockMoves();
      setAllStockMoves(moves);
    } catch (e) {
      console.error(e);
    } finally {
      setStockMovesLoading(false);
    }
  };

  const handleManualMoveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moveProdId || !moveWhId || !moveQty) return;

    setMoveLoading(true);
    try {
      const res = await InventoryService.recordManualStockMove({
        productId: moveProdId,
        warehouseId: moveWhId,
        type: moveType,
        quantity: parseFloat(moveQty),
        unitCost: moveUnitCost ? parseFloat(moveUnitCost) : undefined,
        referenceId: moveRef || undefined,
        notes: moveNotes || undefined
      });

      let msg = `تم تسجيل إذن الحركة المخزنية (${moveType === 'in' ? 'إضافة/توريد' : 'صرف/إتلاف'}) بنجاح!\nالرصيد الجديد: ${res.newStock}`;
      if (res.newAvgCost) {
        msg += `\nمتوسط سعر التكلفة المرجح WAC الجديد: ${res.newAvgCost} ${settings.currency}`;
      }
      if (res.journalEntry) {
        msg += `\n\nتم توليد القيد المحاسبي المزدوج الآلي رقم ${res.journalEntry.entryNumber} تلقائياً.`;
      }
      alert(msg);

      setMoveQty('1');
      setMoveUnitCost('');
      setMoveRef('');
      setMoveNotes('');
      fetchStockMoves();
      if (onRefresh) onRefresh();
    } catch (e: any) {
      alert(e.message || 'فشل تسجيل إذن الحركة المخزنية');
    } finally {
      setMoveLoading(false);
    }
  };

  const fetchLedger = async (pId: string) => {
    if (!pId) return;
    setLedgerLoading(true);
    try {
      const res = await InventoryService.getProductStockLedger(pId);
      setLedgerData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLedgerLoading(false);
    }
  };

  // Submit Warehouse Form
  const handleWhSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!whName.trim() || !whCode.trim()) return;

    try {
      await InventoryService.createWarehouse({
        id: editingWh ? editingWh.id : undefined,
        name: whName,
        code: whCode,
        location: whLocation
      });
      setShowWhModal(false);
      setEditingWh(null);
      setWhName('');
      setWhCode('');
      setWhLocation('');
      fetchWarehouses();
    } catch (e: any) {
      alert(e.message || 'فشل حفظ المستودع');
    }
  };

  const handleDeleteWh = async (id: string) => {
    if (!window.confirm('هل أنت أؤكد طلب حذف هذا المستودع؟')) return;
    try {
      await InventoryService.deleteWarehouse(id);
      fetchWarehouses();
    } catch (e: any) {
      alert(e.message || 'فشل حذف المستودع');
    }
  };

  // Submit Transfer Form
  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferProdId || !fromWhId || !toWhId || !transferQty) return;

    setTransferLoading(true);
    try {
      await InventoryService.transferStock({
        productId: transferProdId,
        fromWarehouseId: fromWhId,
        toWarehouseId: toWhId,
        quantity: parseFloat(transferQty),
        notes: transferNotes
      });
      alert('تم تنفيذ التحويل المخزني بين المستودعين بنجاح ونسخ الحركة بجدول الحركات المخزنية.');
      setTransferQty('1');
      setTransferNotes('');
      if (onRefresh) onRefresh();
    } catch (e: any) {
      alert(e.message || 'فشل تنفيذ تحويل المخزون');
    } finally {
      setTransferLoading(false);
    }
  };

  // Submit Physical Stock Adjustment
  const handleAdjustmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjProdId || !adjWhId || actualCount === '') return;

    setAdjLoading(true);
    try {
      const res = await InventoryService.adjustPhysicalStock({
        productId: adjProdId,
        warehouseId: adjWhId,
        actualQuantity: parseFloat(actualCount),
        notes: adjNotes
      });

      let msg = `تم تسجيل التسوية الجردية بنجاح!\nالرصيد السابق: ${res.previousStock}\nالرصيد الجديد: ${res.newStock}\nالفارق: ${res.delta}`;
      if (res.journalEntry) {
        msg += `\n\nتم إنشاء القيد المحاسبي المزدوج التلقائي رقم ${res.journalEntry.entryNumber} لربط الفارق المخزني بـ (${res.delta > 0 ? 'فائض زيادة/إيرادات' : 'عجز تالف/تكلفة المباعات'}).`;
      }
      alert(msg);

      setActualCount('');
      setAdjNotes('');
      if (onRefresh) onRefresh();
    } catch (e: any) {
      alert(e.message || 'فشل تنفيذ التسوية الجردية');
    } finally {
      setAdjLoading(false);
    }
  };

  // Open modal for editing product
  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setProdName(p.name);
    setProdBarcode(p.barcode);
    setProdPrice(p.price.toString());
    setProdPurchasePrice(p.purchasePrice.toString());
    setProdStock(p.stock.toString());
    setProdMinStock(p.minStock.toString());
    setProdCategory(p.category);
    setProdUnit(p.unit);
    setShowProductModal(true);
  };

  // Open modal for creating product
  const handleOpenCreate = () => {
    setEditingProduct(null);
    setProdName('');
    setProdBarcode(Math.floor(100000000000 + Math.random() * 900000000000).toString());
    setProdPrice('');
    setProdPurchasePrice('');
    setProdStock('');
    setProdMinStock('5');
    setProdCategory(categories[0]?.id || '');
    setProdUnit(units[0]?.name || 'حبة');
    setShowProductModal(true);
  };

  // Submit Product Form
  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim() || !prodBarcode.trim()) return;

    const productData: Product = {
      id: editingProduct ? editingProduct.id : `p-${Date.now()}`,
      name: prodName,
      barcode: prodBarcode,
      price: parseFloat(prodPrice) || 0,
      purchasePrice: parseFloat(prodPurchasePrice) || 0,
      stock: parseInt(prodStock) || 0,
      minStock: parseInt(prodMinStock) || 0,
      category: prodCategory,
      unit: prodUnit,
      taxRate: settings.taxRate
    };

    if (editingProduct) {
      onUpdateProduct(productData);
    } else {
      onAddProduct(productData);
    }

    setShowProductModal(false);
  };

  // Add Category
  const handleAddCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    const newCat: Category = {
      id: `cat-${Date.now()}`,
      name: newCatName,
      icon: newCatIcon
    };
    onAddCategory(newCat);
    setNewCatName('');
  };

  // Filters
  const filteredProducts = InventoryService.filterProducts(products, searchQuery, categoryFilter, stockFilter);

  // Selected product for adjustment calculation
  const selectedAdjProduct = products.find(p => p.id === adjProdId);
  const adjDelta = selectedAdjProduct && actualCount !== '' ? parseFloat(actualCount) - (selectedAdjProduct.stock || 0) : 0;
  const adjCostDiff = selectedAdjProduct ? Math.abs(adjDelta) * (selectedAdjProduct.purchasePrice || 0) : 0;

  return (
    <div className="space-y-6">
      {/* Sub Tabs */}
      <div className="flex border-b border-slate-200 gap-2 sm:gap-6 overflow-x-auto pb-1 text-xs sm:text-sm scrollbar-none">
        <button
          onClick={() => setActiveSubTab('products')}
          className={`pb-3 font-bold transition whitespace-nowrap relative ${
            activeSubTab === 'products' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          📦 الأصناف والمنتجات
          {activeSubTab === 'products' && <div className="absolute bottom-0 right-0 left-0 h-0.5 bg-emerald-500 rounded-full"></div>}
        </button>

        <button
          onClick={() => setActiveSubTab('movements')}
          className={`pb-3 font-bold transition whitespace-nowrap relative flex items-center gap-1 ${
            activeSubTab === 'movements' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>أذونات حركات المخزون</span>
          {activeSubTab === 'movements' && <div className="absolute bottom-0 right-0 left-0 h-0.5 bg-emerald-500 rounded-full"></div>}
        </button>

        <button
          onClick={() => setActiveSubTab('warehouses')}
          className={`pb-3 font-bold transition whitespace-nowrap relative flex items-center gap-1 ${
            activeSubTab === 'warehouses' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <WarehouseIcon className="w-4 h-4" />
          <span>المستودعات</span>
          {activeSubTab === 'warehouses' && <div className="absolute bottom-0 right-0 left-0 h-0.5 bg-emerald-500 rounded-full"></div>}
        </button>

        <button
          onClick={() => setActiveSubTab('transfers')}
          className={`pb-3 font-bold transition whitespace-nowrap relative flex items-center gap-1 ${
            activeSubTab === 'transfers' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <ArrowLeftRight className="w-4 h-4" />
          <span>التحويلات بين المستودعات</span>
          {activeSubTab === 'transfers' && <div className="absolute bottom-0 right-0 left-0 h-0.5 bg-emerald-500 rounded-full"></div>}
        </button>

        <button
          onClick={() => setActiveSubTab('adjustments')}
          className={`pb-3 font-bold transition whitespace-nowrap relative flex items-center gap-1 ${
            activeSubTab === 'adjustments' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <ClipboardCheck className="w-4 h-4" />
          <span>التسوية والجرد المخزني</span>
          {activeSubTab === 'adjustments' && <div className="absolute bottom-0 right-0 left-0 h-0.5 bg-emerald-500 rounded-full"></div>}
        </button>

        <button
          onClick={() => {
            setActiveSubTab('ledger');
            if (products.length > 0 && !ledgerProdId) {
              setLedgerProdId(products[0].id);
            }
          }}
          className={`pb-3 font-bold transition whitespace-nowrap relative flex items-center gap-1 ${
            activeSubTab === 'ledger' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <History className="w-4 h-4" />
          <span>دفتر استاد المخزون</span>
          {activeSubTab === 'ledger' && <div className="absolute bottom-0 right-0 left-0 h-0.5 bg-emerald-500 rounded-full"></div>}
        </button>

        <button
          onClick={() => setActiveSubTab('valuation')}
          className={`pb-3 font-bold transition whitespace-nowrap relative flex items-center gap-1 ${
            activeSubTab === 'valuation' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>تقييم المخزون المالي</span>
          {activeSubTab === 'valuation' && <div className="absolute bottom-0 right-0 left-0 h-0.5 bg-emerald-500 rounded-full"></div>}
        </button>

        <button
          onClick={() => setActiveSubTab('lowstock')}
          className={`pb-3 font-bold transition whitespace-nowrap relative flex items-center gap-1 ${
            activeSubTab === 'lowstock' ? 'text-rose-600 font-extrabold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <AlertCircle className="w-4 h-4 text-rose-500" />
          <span>تنبيهات نقص المخزون</span>
          {activeSubTab === 'lowstock' && <div className="absolute bottom-0 right-0 left-0 h-0.5 bg-rose-500 rounded-full"></div>}
        </button>

        <button
          onClick={() => setActiveSubTab('categories')}
          className={`pb-3 font-bold transition whitespace-nowrap relative ${
            activeSubTab === 'categories' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          📁 تصنيفات المنتجات
          {activeSubTab === 'categories' && <div className="absolute bottom-0 right-0 left-0 h-0.5 bg-emerald-500 rounded-full"></div>}
        </button>
      </div>

      {/* SUB TAB 1: PRODUCTS LIST */}
      {activeSubTab === 'products' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center gap-2 flex-1 max-w-md bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="ابحث بالاسم أو البارکود..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none text-xs sm:text-sm text-slate-700 focus:outline-none w-full"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
              >
                <option value="all">📁 جميع التصنيفات</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </select>

              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value as any)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
              >
                <option value="all">📦 كل المخزون</option>
                <option value="low">⚠️ مخزون منخفض</option>
                <option value="out">🚫 منتهي تماماً</option>
              </select>

              <button
                onClick={handleOpenCreate}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs sm:text-sm transition flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة صنف</span>
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs sm:text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                  <tr>
                    <th className="p-3.5">المنتج والبارکود</th>
                    <th className="p-3.5">التصنيف</th>
                    <th className="p-3.5">سعر التكلفة (الوسطي)</th>
                    <th className="p-3.5">سعر البيع</th>
                    <th className="p-3.5">الكمية بالمخزن</th>
                    <th className="p-3.5 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredProducts.map((p) => {
                    const isLow = InventoryService.isLowStock(p);
                    const isOut = InventoryService.isOutOfStock(p);
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-3.5">
                          <div className="font-bold text-slate-900">{p.name}</div>
                          <div className="text-[11px] text-slate-400 font-mono dir-ltr inline-block">{p.barcode}</div>
                        </td>
                        <td className="p-3.5">
                          <span className="bg-slate-100 text-slate-600 text-xs px-2.5 py-1 rounded-lg font-bold">
                            {categories.find(c => c.id === p.category)?.name || p.category}
                          </span>
                        </td>
                        <td className="p-3.5 font-bold text-slate-700">
                          {p.purchasePrice} {settings.currency}
                        </td>
                        <td className="p-3.5 font-bold text-emerald-600">
                          {p.price} {settings.currency}
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2.5 py-1 rounded-lg font-extrabold text-xs inline-flex items-center gap-1 ${
                            isOut ? 'bg-rose-100 text-rose-700' :
                            isLow ? 'bg-amber-100 text-amber-800' : 'bg-emerald-50 text-emerald-700'
                          }`}>
                            {p.stock} {p.unit}
                            {isLow && ' ⚠️'}
                            {isOut && ' 🚫'}
                          </span>
                        </td>
                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => {
                                setLedgerProdId(p.id);
                                setActiveSubTab('ledger');
                              }}
                              className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition"
                              title="دفتر استاد الصنف"
                            >
                              <History className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenEdit(p)}
                              className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition"
                              title="تعديل"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onDeleteProduct(p.id)}
                              className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition"
                              title="حذف"
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
        </div>
      )}

      {/* SUB TAB 1.5: STOCK MOVEMENTS (أذونات الحركات المخزنية اليدوية وسجل الحركات) */}
      {activeSubTab === 'movements' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm max-w-3xl mx-auto space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-base">تسجيل إذن حركة مخزنية (Stock Voucher)</h3>
                  <p className="text-xs text-slate-400">إضافة إذن توريد أو صرف يدوي للمخزون مع تحديث التكلفة والقيد الآلي</p>
                </div>
              </div>

              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setMoveType('in')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    moveType === 'in' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  📥 إذن توريد / إضافة (+)
                </button>
                <button
                  type="button"
                  onClick={() => setMoveType('out')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    moveType === 'out' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  📤 إذن صرف / إتلاف (-)
                </button>
              </div>
            </div>

            <form onSubmit={handleManualMoveSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">اختر الصنف / المنتج</label>
                <select
                  value={moveProdId}
                  onChange={(e) => {
                    setMoveProdId(e.target.value);
                    const p = products.find(x => x.id === e.target.value);
                    if (p) setMoveUnitCost(p.purchasePrice.toString());
                  }}
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="">-- اختر المنتج --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (المتوفّر: {p.stock} {p.unit} | التكلفة الحالية: {p.purchasePrice} {settings.currency})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">المستودع</label>
                  <select
                    value={moveWhId}
                    onChange={(e) => setMoveWhId(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 focus:outline-none"
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">الكمية</label>
                  <input
                    type="number"
                    min="0.01"
                    step="any"
                    value={moveQty}
                    onChange={(e) => setMoveQty(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">سعر التكلفة للوحدة ({settings.currency})</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="التكلفة الحالية"
                    value={moveUnitCost}
                    onChange={(e) => setMoveUnitCost(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">رقم المستند / أذن الإضافة والبدل</label>
                  <input
                    type="text"
                    placeholder="مثال: VOUCH-2026-001"
                    value={moveRef}
                    onChange={(e) => setMoveRef(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">سبب الحركة / البيان</label>
                  <input
                    type="text"
                    placeholder="مثال: توريد مواد من المورد / عينات ترويجية"
                    value={moveNotes}
                    onChange={(e) => setMoveNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={moveLoading}
                className={`w-full py-3 text-white font-bold rounded-xl text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-sm ${
                  moveType === 'in' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>
                  {moveLoading ? 'جاري حفظ حركة المخزون...' : moveType === 'in' ? 'اعتماد أذن التوريد / الإضافة' : 'اعتماد أذن الصرف / الإتلاف'}
                </span>
              </button>
            </form>
          </div>

          {/* Table of all stock movements */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm space-y-3 p-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div>
                <h4 className="font-extrabold text-slate-800 text-sm">سجل الأذونات والحركات المخزنية الأخيرة</h4>
                <p className="text-xs text-slate-400">عرض جميع حركات التوريد والتعديل والتحويلات والمبيعات</p>
              </div>
              <button
                onClick={fetchStockMoves}
                className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg text-xs font-bold flex items-center gap-1 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>تحديث</span>
              </button>
            </div>

            {stockMovesLoading ? (
              <div className="p-8 text-center text-slate-400 text-xs">جاري تحميل سجل الحركات...</div>
            ) : allStockMoves.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">لا توجد حركات مخزنية مسجلة حتى الآن.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">التاريخ والوقت</th>
                      <th className="p-3">نوع الحركة</th>
                      <th className="p-3">المنتج</th>
                      <th className="p-3">الكمية</th>
                      <th className="p-3">تكلّفة الحركة</th>
                      <th className="p-3">المرجع</th>
                      <th className="p-3">ملاحظات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {allStockMoves.slice(0, 30).map((m: any) => {
                      const prd = products.find(x => x.id === m.productId);
                      return (
                        <tr key={m.id} className="hover:bg-slate-50 transition">
                          <td className="p-3 text-slate-400 font-mono dir-ltr text-[11px]">
                            {m.createdAt ? new Date(m.createdAt).toLocaleString('ar-SA') : '-'}
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                              m.type === 'purchase' ? 'bg-emerald-100 text-emerald-800' :
                              m.type === 'sale' ? 'bg-blue-100 text-blue-800' :
                              m.type === 'transfer' ? 'bg-purple-100 text-purple-800' : 'bg-amber-100 text-amber-900'
                            }`}>
                              {m.type === 'purchase' ? 'إضافة / مشتريات' :
                               m.type === 'sale' ? 'صرف / مبيعات' :
                               m.type === 'transfer' ? 'تحويل مستودعي' : 'تسوية مخزنية'}
                            </span>
                          </td>
                          <td className="p-3 font-bold text-slate-900">{prd ? prd.name : m.productId}</td>
                          <td className="p-3 font-bold font-mono dir-ltr">{m.quantity}</td>
                          <td className="p-3 font-mono">{m.unitCost ? `${m.unitCost} ${settings.currency}` : '-'}</td>
                          <td className="p-3 font-mono dir-ltr text-slate-500">{m.referenceId || '-'}</td>
                          <td className="p-3 text-slate-500 max-w-xs truncate">{m.notes || '-'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB TAB 2: WAREHOUSES MANAGEMENT */}
      {activeSubTab === 'warehouses' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
            <div>
              <h3 className="font-extrabold text-slate-800">إدارة المستودعات والفروع المخزنية</h3>
              <p className="text-xs text-slate-400">إضافة وتحديد المستودعات الرئيسية والفرعية لمتابعة الكميات بشكل دقيق</p>
            </div>
            <button
              onClick={() => {
                setEditingWh(null);
                setWhName('');
                setWhCode('WH-' + Math.floor(10 + Math.random() * 90));
                setWhLocation('');
                setShowWhModal(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs sm:text-sm transition flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة مستودع جديد</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {warehouses.map((wh) => (
              <div key={wh.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3 relative hover:border-emerald-500/50 transition">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-bold">
                      <WarehouseIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-base">{wh.name}</h4>
                      <span className="text-xs text-slate-400 font-mono dir-ltr inline-block">{wh.code}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingWh(wh);
                        setWhName(wh.name);
                        setWhCode(wh.code);
                        setWhLocation(wh.location || '');
                        setShowWhModal(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {wh.id !== 'wh_main' && (
                      <button
                        onClick={() => handleDeleteWh(wh.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                {wh.location && (
                  <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    📍 الموقع: {wh.location}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB TAB 3: WAREHOUSE TRANSFERS */}
      {activeSubTab === 'transfers' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-base">تحويل كمية بين المستودعات</h3>
              <p className="text-xs text-slate-400">نقل مخزون صنف من مستودع مصدري إلى مستودع آخر مع تتبع الحركة</p>
            </div>
          </div>

          <form onSubmit={handleTransferSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">اختر المنتج المراد تحويله</label>
              <select
                value={transferProdId}
                onChange={(e) => setTransferProdId(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="">-- اختر الصنف --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (المتوفر بالكامل: {p.stock} {p.unit})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">المستودع المصدر (من)</label>
                <select
                  value={fromWhId}
                  onChange={(e) => setFromWhId(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">المستودع الهدف (إلى)</label>
                <select
                  value={toWhId}
                  onChange={(e) => setToWhId(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">الكمية المراد نقلها</label>
              <input
                type="number"
                min="0.01"
                step="any"
                value={transferQty}
                onChange={(e) => setTransferQty(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">ملاحظات التحويل (اختياري)</label>
              <input
                type="text"
                placeholder="مثال: إذن نقل رقم 104 بناءً على طلب الفرع الثاني"
                value={transferNotes}
                onChange={(e) => setTransferNotes(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={transferLoading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-sm"
            >
              <ArrowLeftRight className="w-4 h-4" />
              <span>{transferLoading ? 'جاري تنفيذ التحويل...' : 'تأكيد وحفظ أمر التحويل'}</span>
            </button>
          </form>
        </div>
      )}

      {/* SUB TAB 4: INVENTORY ADJUSTMENTS & RECONCILIATION */}
      {activeSubTab === 'adjustments' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-base">التسوية والجرد المخزني (Physical Stock Adjustment)</h3>
              <p className="text-xs text-slate-400">تعديل المخزون الفعلي ومطابقته للنظام مع توليد قيد محاسبي آلي للفارق</p>
            </div>
          </div>

          <form onSubmit={handleAdjustmentSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">اختر المنتج المخزني للجرد</label>
              <select
                value={adjProdId}
                onChange={(e) => {
                  setAdjProdId(e.target.value);
                  const p = products.find(x => x.id === e.target.value);
                  if (p) setActualCount(p.stock.toString());
                }}
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="">-- اختر الصنف للجرد --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (رصيد النظام الحلي: {p.stock} {p.unit})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">المستودع</label>
                <select
                  value={adjWhId}
                  onChange={(e) => setAdjWhId(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 focus:outline-none"
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">العدد/الكمية المكتشفة بالعد الفعلي (الجرد)</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="أدخل الكمية الفعلية بالمخزن"
                  value={actualCount}
                  onChange={(e) => setActualCount(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono font-bold"
                />
              </div>
            </div>

            {selectedAdjProduct && actualCount !== '' && (
              <div className={`p-4 rounded-xl border text-xs space-y-2 ${
                adjDelta > 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
                adjDelta < 0 ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
                <div className="flex justify-between items-center font-bold">
                  <span>فارق الجرد: {adjDelta > 0 ? `+${adjDelta}` : adjDelta} {selectedAdjProduct.unit}</span>
                  <span>النوع: {adjDelta > 0 ? 'فائض زيادة (+)' : adjDelta < 0 ? 'عجز / تلف (-)' : 'مطابق تماماً'}</span>
                </div>
                {adjDelta !== 0 && (
                  <div className="pt-2 border-t border-current/20 flex justify-between items-center text-[11px]">
                    <span>الأثر المالي المترتب والقيد الآلي:</span>
                    <span className="font-mono font-bold">
                      {adjCostDiff.toFixed(2)} {settings.currency} (بسعر التكلفة)
                    </span>
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">سبب التسوية / ملاحظات الجرد</label>
              <input
                type="text"
                placeholder="مثال: تلف أثناء التخزين / خطأ إدخال سابق"
                value={adjNotes}
                onChange={(e) => setAdjNotes(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={adjLoading}
              className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-sm"
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>{adjLoading ? 'جاري حفظ التسوية والقيد الآلي...' : 'اعتماد وتسجيل التسوية الجردية'}</span>
            </button>
          </form>
        </div>
      )}

      {/* SUB TAB 5: STOCK LEDGER */}
      {activeSubTab === 'ledger' && (
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="w-10 h-10 bg-slate-100 text-slate-700 rounded-xl flex items-center justify-center">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-800">دفتر استاد حركة المخزون</h3>
                <p className="text-xs text-slate-400">تتبع التسلسل الزمني الكامل لتدفق الصنف والرصيد التراكمي المستمر</p>
              </div>
            </div>

            <div className="w-full sm:w-72">
              <select
                value={ledgerProdId}
                onChange={(e) => setLedgerProdId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    📦 {p.name} ({p.barcode})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {ledgerLoading ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400 text-sm">
              جاري تحميل دفتر استاد الصنف...
            </div>
          ) : ledgerData ? (
            <div className="space-y-4">
              <div className="bg-slate-900 text-white rounded-2xl p-4 shadow flex flex-wrap justify-between items-center gap-4">
                <div>
                  <h4 className="font-extrabold text-base text-emerald-400">{ledgerData.product.name}</h4>
                  <p className="text-xs text-slate-400">بارکود: <span className="font-mono dir-ltr inline-block">{ledgerData.product.barcode}</span> | الوحدة: {ledgerData.product.unit}</p>
                </div>
                <div className="flex gap-6 text-center text-xs">
                  <div>
                    <span className="block text-slate-400 text-[10px]">الرصيد الفعلي الحالي</span>
                    <span className="font-extrabold text-lg text-emerald-300">{ledgerData.currentTotalStock} {ledgerData.product.unit}</span>
                  </div>
                  <div>
                    <span className="block text-slate-400 text-[10px]">متوسط سعر التكلفة</span>
                    <span className="font-extrabold text-lg text-slate-200">{ledgerData.product.purchasePrice} {settings.currency}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                      <tr>
                        <th className="p-3">التاريخ والوقت</th>
                        <th className="p-3">نوع الحركة</th>
                        <th className="p-3">من مستودع</th>
                        <th className="p-3">إلى مستودع</th>
                        <th className="p-3">المرجع</th>
                        <th className="p-3">الكمية (+/-)</th>
                        <th className="p-3 font-extrabold text-emerald-700">الرصيد التراكمي</th>
                        <th className="p-3">ملاحظات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {ledgerData.ledgerLines.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-slate-400">
                            لا توجد حركات مخزنية مسجلة لـ هذا الصنف بعد.
                          </td>
                        </tr>
                      ) : (
                        ledgerData.ledgerLines.map((line: any) => (
                          <tr key={line.id} className="hover:bg-slate-50/80 transition">
                            <td className="p-3 text-slate-500 dir-ltr font-mono text-[11px]">
                              {new Date(line.date).toLocaleString('ar-SA')}
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                                line.type === 'purchase' ? 'bg-blue-50 text-blue-700' :
                                line.type === 'sale' ? 'bg-amber-50 text-amber-700' :
                                line.type === 'transfer' ? 'bg-purple-50 text-purple-700' : 'bg-emerald-50 text-emerald-700'
                              }`}>
                                {line.typeLabel}
                              </span>
                            </td>
                            <td className="p-3 text-slate-600">{line.fromWarehouse}</td>
                            <td className="p-3 text-slate-600">{line.toWarehouse}</td>
                            <td className="p-3 font-mono dir-ltr text-slate-500">{line.referenceId}</td>
                            <td className={`p-3 font-extrabold font-mono ${
                              line.change > 0 ? 'text-emerald-600' : line.change < 0 ? 'text-rose-600' : 'text-slate-500'
                            }`}>
                              {line.change > 0 ? `+${line.change}` : line.change}
                            </td>
                            <td className="p-3 font-extrabold font-mono text-emerald-800 bg-emerald-50/50">
                              {line.runningStock}
                            </td>
                            <td className="p-3 text-slate-400 max-w-xs truncate">{line.notes}</td>
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

      {/* SUB TAB 6: INVENTORY VALUATION */}
      {activeSubTab === 'valuation' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="font-extrabold text-slate-800 text-base">تقييم المخزون المالي والتكلفة المحاسبية</h3>
              <p className="text-xs text-slate-400">حساب قيمة المخزون الدفتري وإجمالي الأرباح الكامنة حسب السياسة المحاسبية المعتمدة</p>
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setValuationMethod('average')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  valuationMethod === 'average' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                📊 المتوسط المرجح (WAC)
              </button>
              <button
                type="button"
                onClick={() => setValuationMethod('fifo')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  valuationMethod === 'fifo' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🔄 الوارد أولاً صادر أولاً (FIFO)
              </button>
            </div>
          </div>

          {/* Inventory Accounting Mapping Legend */}
          <div className="bg-slate-900 text-slate-200 rounded-2xl p-4 shadow-sm border border-slate-800">
            <h4 className="font-extrabold text-emerald-400 text-xs mb-2 flex items-center gap-1">
              <span>🏛️ ربط شجرة الحسابات المحاسبية الدفترية للمخزون (Inventory Accounting Ledger Integration)</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
              <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                <span className="block text-slate-400 text-[10px]">حساب المخزون (أصول متداولة)</span>
                <span className="font-bold text-white font-mono">1201 - المخزون السلعي</span>
              </div>
              <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                <span className="block text-slate-400 text-[10px]">حساب التكلفة (مصروفات)</span>
                <span className="font-bold text-amber-300 font-mono">5101 - تكلفة البضاعة المباعة (COGS)</span>
              </div>
              <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                <span className="block text-slate-400 text-[10px]">حساب عجز الجرد والتالف</span>
                <span className="font-bold text-rose-300 font-mono">5105 - خسائر عجز المخزون</span>
              </div>
              <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                <span className="block text-slate-400 text-[10px]">حساب فائض التسوية الجردية</span>
                <span className="font-bold text-emerald-300 font-mono">4202 - إيرادات تسوية مخزنية</span>
              </div>
            </div>
          </div>

          {valuationLoading ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400 text-sm">
              جاري حساب تقييم وتكلفة المخزون المالي بـ طريقة ({valuationMethod === 'fifo' ? 'الوارد أولاً صادر أولاً FIFO' : 'المتوسط المرجح WAC'})...
            </div>
          ) : valuationData ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
                  <span className="text-xs font-bold text-slate-400">
                    إجمالي التكلفة ({valuationMethod === 'fifo' ? 'حسب FIFO' : 'حسب المتوسط المرجح WAC'})
                  </span>
                  <div className="text-2xl font-black text-slate-900 font-mono">
                    {valuationData.totalCostSum.toFixed(2)} <span className="text-sm font-normal">{settings.currency}</span>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
                  <span className="text-xs font-bold text-slate-400">إجمالي قيمة البيع بالتجزئة</span>
                  <div className="text-2xl font-black text-emerald-600 font-mono">
                    {valuationData.totalSalesSum.toFixed(2)} <span className="text-sm font-normal">{settings.currency}</span>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
                  <span className="text-xs font-bold text-slate-400">إجمالي الأرباح الكامنة بالمخزن</span>
                  <div className="text-2xl font-black text-blue-600 font-mono">
                    {valuationData.totalPotentialProfitSum.toFixed(2)} <span className="text-sm font-normal">{settings.currency}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs sm:text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                      <tr>
                        <th className="p-3.5">اسم المنتج</th>
                        <th className="p-3.5">المخزون الحالي</th>
                        <th className="p-3.5">{valuationMethod === 'fifo' ? 'تكلفة FIFO للوحدة' : 'متوسط التكلفة WAC'}</th>
                        <th className="p-3.5">إجمالي قيمة التكلفة</th>
                        <th className="p-3.5">سعر البيع</th>
                        <th className="p-3.5">إجمالي قيمة البيع</th>
                        <th className="p-3.5 text-blue-600">الربح المتوقع</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {valuationData.items.map((item: any) => (
                        <tr key={item.id} className="hover:bg-slate-50/80 transition">
                          <td className="p-3.5 font-bold text-slate-900">{item.name}</td>
                          <td className="p-3.5 font-bold font-mono">{item.stock} {item.unit}</td>
                          <td className="p-3.5 font-mono">
                            {valuationMethod === 'fifo' ? item.fifoCost : item.avgCost} {settings.currency}
                          </td>
                          <td className="p-3.5 font-bold font-mono text-slate-800">{item.totalCostValue} {settings.currency}</td>
                          <td className="p-3.5 font-mono text-emerald-600">{item.sellingPrice} {settings.currency}</td>
                          <td className="p-3.5 font-bold font-mono text-emerald-700">{item.totalSalesValue} {settings.currency}</td>
                          <td className="p-3.5 font-bold font-mono text-blue-600">{item.potentialProfit} {settings.currency}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* SUB TAB 7: LOW STOCK ALERTS */}
      {activeSubTab === 'lowstock' && (
        <div className="space-y-6">
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 flex items-start gap-4">
            <div className="p-2.5 bg-rose-100 rounded-xl text-rose-700">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-rose-900 text-sm">نظام مراقبة وتنبيهات المخزون الحرج</h3>
              <p className="text-xs text-rose-700 mt-1 leading-relaxed">
                يعرض هذا القسم تلقائياً جميع الأصناف والمنتجات التي انخفض رصيدها عن الحد الأدنى المحدد، أو نفذت كميتها بالكامل لتسهيل إعادة الطلب والشراء.
              </p>
            </div>
          </div>

          {lowStockLoading ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400 text-sm">
              جاري فحص حالة المخزون وجلب التنبيهات...
            </div>
          ) : lowStockAlerts.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <div className="font-bold text-slate-800">لا توجد تنبيهات! جميع المنتجات بحالة مخزنية ممتازة.</div>
              <p className="text-xs text-slate-400">جميع الكميات الحالية أعلى من حد الطلب الأدنى.</p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs sm:text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                    <tr>
                      <th className="p-3.5">اسم المنتج والبارکود</th>
                      <th className="p-3.5">التصنيف</th>
                      <th className="p-3.5">المخزون الحالي</th>
                      <th className="p-3.5">الحد الأدنى المطلوب</th>
                      <th className="p-3.5">حالة النقص</th>
                      <th className="p-3.5">الكمية المقترحة للطلب</th>
                      <th className="p-3.5 text-center">الإجراء الموصى به</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {lowStockAlerts.map((item: any) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-3.5">
                          <div className="font-bold text-slate-900">{item.name}</div>
                          <div className="text-[11px] text-slate-400 font-mono dir-ltr inline-block">{item.barcode}</div>
                        </td>
                        <td className="p-3.5 font-bold text-slate-600">
                          {categories.find(c => c.id === item.category)?.name || item.category || 'عام'}
                        </td>
                        <td className="p-3.5 font-bold font-mono text-rose-600">
                          {item.stock} {item.unit}
                        </td>
                        <td className="p-3.5 font-bold font-mono text-slate-500">
                          {item.minStock} {item.unit}
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2.5 py-1 rounded-lg font-bold text-xs inline-flex items-center gap-1 ${
                            item.status === 'out_of_stock' 
                              ? 'bg-rose-100 text-rose-800' 
                              : 'bg-amber-100 text-amber-900'
                          }`}>
                            {item.statusLabel}
                          </span>
                        </td>
                        <td className="p-3.5 font-extrabold font-mono text-blue-600">
                          +{item.suggestedReorder} {item.unit}
                        </td>
                        <td className="p-3.5 text-center">
                          <button
                            onClick={() => {
                              setAdjProdId(item.id);
                              setActiveSubTab('adjustments');
                            }}
                            className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition"
                          >
                            تعديل/جرد سريع
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB TAB 8: CATEGORIES */}
      {activeSubTab === 'categories' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="font-extrabold text-slate-800 text-sm">إضافة تصنيف جديد</h3>
            <form onSubmit={handleAddCategorySubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">اسم التصنيف</label>
                <input
                  type="text"
                  placeholder="مثال: المعجنات"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">الأيقونة / الإيموجي</label>
                <input
                  type="text"
                  value={newCatIcon}
                  onChange={(e) => setNewCatIcon(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition"
              >
                إضافة التصنيف
              </button>
            </form>
          </div>

          <div className="md:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
            <h3 className="font-extrabold text-slate-800 text-sm">التصنيفات الحالية ({categories.length})</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {categories.map((cat) => (
                <div key={cat.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{cat.icon}</span>
                    <span className="font-bold text-slate-800 text-xs sm:text-sm">{cat.name}</span>
                  </div>
                  <button
                    onClick={() => onDeleteCategory(cat.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CREATE/EDIT WAREHOUSE MODAL */}
      {showWhModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 w-full max-w-md shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-800 text-base">
                {editingWh ? 'تعديل بيانات المستودع' : 'إضافة مستودع جديد'}
              </h3>
              <button onClick={() => setShowWhModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleWhSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">اسم المستودع</label>
                <input
                  type="text"
                  placeholder="مثال: مستودع جدة الرئيسي"
                  value={whName}
                  onChange={(e) => setWhName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">رمز / كود المستودع</label>
                <input
                  type="text"
                  placeholder="مثال: WH-JED"
                  value={whCode}
                  onChange={(e) => setWhCode(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">الموقع / الملاحظات (اختياري)</label>
                <input
                  type="text"
                  placeholder="مثال: المنطقة الصناعية - المستودع 4"
                  value={whLocation}
                  onChange={(e) => setWhLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowWhModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs"
                >
                  حفظ البيانات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE/EDIT PRODUCT MODAL */}
      {showProductModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 w-full max-w-lg shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-800 text-base">
                {editingProduct ? 'تعديل بيانات الصنف' : 'إضافة صنف جديد'}
              </h3>
              <button onClick={() => setShowProductModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleProductSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">اسم الصنف / المنتج</label>
                <input
                  type="text"
                  placeholder="مثال: حليب المراعي 1 لتر"
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">البارکود</label>
                <input
                  type="text"
                  value={prodBarcode}
                  onChange={(e) => setProdBarcode(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">سعر التكلفة ({settings.currency})</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={prodPurchasePrice}
                    onChange={(e) => setProdPurchasePrice(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">سعر البيع ({settings.currency})</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={prodPrice}
                    onChange={(e) => setProdPrice(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">الكمية الافتتاحية</label>
                  <input
                    type="number"
                    min="0"
                    value={prodStock}
                    onChange={(e) => setProdStock(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">حد أدنى تنبيه المخزون</label>
                  <input
                    type="number"
                    min="0"
                    value={prodMinStock}
                    onChange={(e) => setProdMinStock(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">التصنيف</label>
                  <select
                    value={prodCategory}
                    onChange={(e) => setProdCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">وحدة القياس</label>
                  <select
                    value={prodUnit}
                    onChange={(e) => setProdUnit(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 focus:outline-none"
                  >
                    {units.map((u) => (
                      <option key={u.id} value={u.name}>{u.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs"
                >
                  حفظ الصنف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
