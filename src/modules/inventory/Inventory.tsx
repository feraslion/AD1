import React, { useState } from 'react';
import { Product, Category, Unit, StoreSettings } from '../../types';
import { Plus, Search, Edit2, Trash2, Tag, Percent, ArrowLeft, RefreshCw, Layers, AlertCircle, ShoppingCart } from 'lucide-react';
import { InventoryService } from '../../services/InventoryService';

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
  onDeleteCategory 
}: InventoryProps) {
  const [activeSubTab, setActiveSubTab] = useState<'products' | 'categories' | 'units'>('products');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');

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

  // Open modal for editing
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

  // Open modal for creating
  const handleOpenCreate = () => {
    setEditingProduct(null);
    setProdName('');
    // Auto-generate a dummy EAN barcode for fast creation
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

  // Calculate stats
  const totalStockItems = InventoryService.totalStockItems(products);
  const totalPurchaseVal = InventoryService.totalPurchaseValue(products);
  const totalSaleVal = InventoryService.totalSaleValue(products);

  return (
    <div className="space-y-6">
      {/* Sub Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveSubTab('products')}
          className={`pb-3 font-bold text-sm transition relative ${
            activeSubTab === 'products' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          📦 قائمة المنتجات والمخزن
          {activeSubTab === 'products' && <div className="absolute bottom-0 right-0 left-0 h-0.5 bg-emerald-500 rounded-full"></div>}
        </button>
        <button
          onClick={() => setActiveSubTab('categories')}
          className={`pb-3 font-bold text-sm transition relative ${
            activeSubTab === 'categories' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          📁 إدارة تصنيفات المنتجات
          {activeSubTab === 'categories' && <div className="absolute bottom-0 right-0 left-0 h-0.5 bg-emerald-500 rounded-full"></div>}
        </button>
      </div>

      {activeSubTab === 'products' && (
        <div className="space-y-6">
          {/* Inventory Overview Stats Card */}
          <div className="bg-[#1e293b] text-white rounded-2xl p-5 shadow flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border border-slate-700">
            <div className="space-y-1.5">
              <h3 className="font-extrabold text-lg text-emerald-400 underline decoration-emerald-500/50 decoration-4 underline-offset-8">تقييم المخزون المالي الحالي</h3>
              <p className="text-slate-400 text-xs mt-2">حسابات قيم الشراء والبيع والربحية الكامنة بالأصناف المتوفرة</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 w-full md:w-auto">
              <div className="space-y-1">
                <span className="text-slate-400 text-xs">إجمالي قيمة الشراء:</span>
                <div className="text-lg font-bold font-mono">{totalPurchaseVal.toLocaleString()} {settings.currency}</div>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 text-xs">إجمالي قيمة البيع:</span>
                <div className="text-lg font-bold font-mono text-emerald-400">{totalSaleVal.toLocaleString()} {settings.currency}</div>
              </div>
              <div className="space-y-1 col-span-2 sm:col-span-1">
                <span className="text-slate-400 text-xs">الربح المتوقع:</span>
                <div className="text-lg font-bold font-mono text-blue-400">{(totalSaleVal - totalPurchaseVal).toLocaleString()} {settings.currency}</div>
              </div>
            </div>
          </div>

          {/* Filters and Search Bar */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 space-y-3">
            <div className="flex flex-col lg:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute right-3.5 top-3 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="البحث بالاسم أو الباركود..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pr-11 pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                />
              </div>

              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 focus:outline-none"
              >
                <option value="all">📂 كل الفئات</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>

              {/* Stock Filter */}
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value as 'all' | 'low' | 'out')}
                className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 focus:outline-none"
              >
                <option value="all">📊 حالة المخزن (الكل)</option>
                <option value="low">⚠️ مخزون منخفض</option>
                <option value="out">🚫 نفد من المخزون</option>
              </select>

              {/* Create Product Button */}
              <button
                onClick={handleOpenCreate}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة منتج جديد</span>
              </button>
            </div>
          </div>

          {/* Products List Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right text-slate-500">
                <thead className="text-xs text-slate-700 bg-slate-50 rounded-lg">
                  <tr className="border-b border-slate-100">
                    <th className="px-4 py-3.5">الباركود</th>
                    <th className="px-4 py-3.5">اسم الصنف</th>
                    <th className="px-4 py-3.5">الفئة</th>
                    <th className="px-4 py-3.5">سعر الشراء</th>
                    <th className="px-4 py-3.5">سعر البيع</th>
                    <th className="px-4 py-3.5">المخزن الحالي</th>
                    <th className="px-4 py-3.5 text-center">العمليات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                        <AlertCircle className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                        <p className="font-bold">لا توجد منتجات مسجلة مطابقة للخيارات</p>
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((p) => {
                      const cat = categories.find(c => c.id === p.category);
                      const isOutOfStock = p.stock <= 0 && p.minStock > 0;
                      const isLowStock = p.stock <= p.minStock && p.stock > 0 && p.minStock > 0;
                      
                      return (
                        <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                          <td className="px-4 py-3.5 font-mono text-xs font-bold text-slate-400">{p.barcode}</td>
                          <td className="px-4 py-3.5">
                            <div className="font-bold text-slate-800">{p.name}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">الوحدة: {p.unit}</div>
                          </td>
                          <td className="px-4 py-3.5 font-medium text-slate-600">
                            {cat ? `${cat.icon} ${cat.name}` : 'غير مصنف'}
                          </td>
                          <td className="px-4 py-3.5 font-mono font-semibold text-slate-600">
                            {p.purchasePrice.toFixed(2)} {settings.currency}
                          </td>
                          <td className="px-4 py-3.5 font-mono font-bold text-emerald-600">
                            {p.price.toFixed(2)} {settings.currency}
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2">
                              <span className={`font-mono font-extrabold text-sm ${
                                isOutOfStock ? 'text-rose-600' : isLowStock ? 'text-amber-600' : 'text-slate-800'
                              }`}>
                                {p.stock}
                              </span>
                              {isOutOfStock ? (
                                <span className="px-1.5 py-0.5 bg-rose-50 text-rose-700 text-[9px] rounded font-extrabold">منفد</span>
                              ) : isLowStock ? (
                                <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 text-[9px] rounded font-extrabold">شبه نفذ</span>
                              ) : null}
                            </div>
                            <div className="text-[9px] text-slate-400">الحد الأدنى: {p.minStock}</div>
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleOpenEdit(p)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                title="تعديل المنتج"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`هل أنت متأكد من حذف الصنف "${p.name}" نهائياً؟`)) {
                                    onDeleteProduct(p.id);
                                  }
                                }}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                title="حذف المنتج"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'categories' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Add Category Card */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 h-fit space-y-4">
            <h3 className="font-extrabold text-slate-800 text-base">إضافة فئة جديدة</h3>
            <form onSubmit={handleAddCategorySubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">اسم الفئة:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: البسكويت والشوكولاتة"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">أيقونة تعبيرية (Emoji):</label>
                <select
                  value={newCatIcon}
                  onChange={(e) => setNewCatIcon(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs focus:outline-none text-slate-800"
                >
                  <option value="📦">📦 صندوق افتراضي</option>
                  <option value="🥫">🥫 معلبات</option>
                  <option value="🧴">🧴 منظفات / مرطبات</option>
                  <option value="💊">💊 كبسولات طبية</option>
                  <option value="☕">☕ قهوة ومشروبات ساخنة</option>
                  <option value="🍰">🍰 كيك وحلويات</option>
                  <option value="👑">👑 ذهب ومجوهرات</option>
                  <option value="🍎">🍎 خضار وفواكه</option>
                  <option value="⚡">⚡ أجهزة وإلكترونيات</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                حفظ تصنيف المنتجات
              </button>
            </form>
          </div>

          {/* Categories Grid List */}
          <div className="md:col-span-2 bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            <h3 className="font-extrabold text-slate-800 text-base">التصنيفات المتاحة حالياً ({categories.length})</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {categories.map(cat => {
                const countOfProds = products.filter(p => p.category === cat.id).length;
                return (
                  <div key={cat.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex justify-between items-center hover:shadow-sm transition">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{cat.icon}</span>
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">{cat.name}</h4>
                        <p className="text-xs text-slate-400">{countOfProds} أصناف مرتبطة</p>
                      </div>
                    </div>
                    {/* Delete category unless custom lock applies */}
                    <button
                      onClick={() => {
                        if (countOfProds > 0) {
                          alert('لا يمكن حذف الفئة لأنها تحتوي على أصناف مخزنة حالياً!');
                          return;
                        }
                        if (confirm(`هل تود بالتأكيد حذف فئة "${cat.name}"؟`)) {
                          onDeleteCategory(cat.id);
                        }
                      }}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Product Add/Edit Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
          <form onSubmit={handleProductSubmit} className="bg-white rounded-2xl max-w-lg w-full shadow-xl border border-slate-200 overflow-hidden text-right my-8">
            <div className="p-4 bg-[#1e293b] text-white flex justify-between items-center border-b border-slate-700">
              <h3 className="font-bold">{editingProduct ? 'تعديل بيانات الصنف' : 'إضافة صنف جديد للمخزن'}</h3>
              <button type="button" onClick={() => setShowProductModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Row 1: Name and Barcode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">اسم المنتج (مطلوب):</label>
                  <input
                    type="text"
                    required
                    value={prodName}
                    onChange={(e) => setProdName(e.target.value)}
                    placeholder="مثال: حليب كامل الدسم 1 لتر"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">الباركود (EAN / UPC / Code128):</label>
                  <input
                    type="text"
                    required
                    value={prodBarcode}
                    onChange={(e) => setProdBarcode(e.target.value)}
                    placeholder="امسح بمسدس الباركود أو اكتب يدوياً"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              {/* Row 2: Category and Unit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">الفئة التابع لها:</label>
                  <select
                    value={prodCategory}
                    onChange={(e) => setProdCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs focus:outline-none text-slate-800 font-bold"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">وحدة القياس:</label>
                  <select
                    value={prodUnit}
                    onChange={(e) => setProdUnit(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs focus:outline-none text-slate-800 font-bold"
                  >
                    {units.map(u => (
                      <option key={u.id} value={u.name}>{u.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 3: Prices */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">سعر الشراء (تكلفة الصنف):</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={prodPurchasePrice}
                    onChange={(e) => setProdPurchasePrice(e.target.value)}
                    placeholder="مثال: 12.50"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">سعر البيع (شامل VAT):</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={prodPrice}
                    onChange={(e) => setProdPrice(e.target.value)}
                    placeholder="مثال: 18.00"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              {/* Row 4: Stock details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">الكمية الافتتاحية للمخزن:</label>
                  <input
                    type="number"
                    required
                    value={prodStock}
                    onChange={(e) => setProdStock(e.target.value)}
                    placeholder="مثال: 150"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">الحد الأدنى للمخزون (تنبيه الطلب):</label>
                  <input
                    type="number"
                    required
                    value={prodMinStock}
                    onChange={(e) => setProdMinStock(e.target.value)}
                    placeholder="مثال: 10"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2">
              <button
                type="button"
                onClick={() => setShowProductModal(false)}
                className="flex-1 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition"
              >
                {editingProduct ? 'حفظ التعديلات' : 'إضافة إلى المخزن'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// Simple Helper for quick close icon
function X({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  );
}
