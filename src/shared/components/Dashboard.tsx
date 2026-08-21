import React, { useState, useEffect } from 'react';
import { Invoice, Product, StoreSettings } from '../../types';
import { TrendingUp, ShoppingBag, AlertTriangle, FileText, Landmark, Users, Clock, ArrowLeft, RefreshCw, ChevronDown, ChevronUp, Check, Calendar, CheckSquare, Square, Plus, Trash2, ListTodo, CheckCircle2, PackageSearch, Warehouse, ReceiptText, BarChart3, Wallet, Truck, Settings2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import StatCard from './ui/StatCard';

interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
}

const DEFAULT_TODOS: TodoItem[] = [
  { id: '1', text: 'تنظيف وتجهيز المحل والممر الرئيسي', completed: true, createdAt: new Date().toISOString() },
  { id: '2', text: 'جرد رفوف العصائر والمشروبات سريعة الدوران', completed: false, createdAt: new Date().toISOString() },
  { id: '3', text: 'مراجعة وطباعة ملصقات الباركود للمنتجات الجديدة', completed: false, createdAt: new Date().toISOString() },
  { id: '4', text: 'فحص كشف النقدية ومطابقة رصيد الخزينة', completed: false, createdAt: new Date().toISOString() }
];

interface DashboardProps {
  invoices: Invoice[];
  products: Product[];
  settings: StoreSettings;
  onNavigate: (tab: string) => void;
  syncStatus: 'synced' | 'syncing' | 'offline';
  onForceSync: () => void;
  onUpdateProductStock?: (id: string, newStock: number) => void;
}

export default function Dashboard({ invoices, products, settings, onNavigate, syncStatus, onForceSync, onUpdateProductStock }: DashboardProps) {
  const [isLowStockExpanded, setIsLowStockExpanded] = useState(false);
  const [replenishQty, setReplenishQty] = useState<Record<string, string>>({});
  const [successItems, setSuccessItems] = useState<Record<string, boolean>>({});

  // To-Do List state with localStorage persistence
  const [todos, setTodos] = useState<TodoItem[]>(() => {
    const saved = localStorage.getItem('erp_daily_todos');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return DEFAULT_TODOS;
  });

  const [newTodoInput, setNewTodoInput] = useState('');

  useEffect(() => {
    localStorage.setItem('erp_daily_todos', JSON.stringify(todos));
  }, [todos]);

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoInput.trim()) return;
    const newItem: TodoItem = {
      id: Date.now().toString(),
      text: newTodoInput.trim(),
      completed: false,
      createdAt: new Date().toISOString()
    };
    setTodos([newItem, ...todos]);
    setNewTodoInput('');
  };

  const handleToggleTodo = (id: string) => {
    setTodos(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const handleDeleteTodo = (id: string) => {
    setTodos(todos.filter(t => t.id !== id));
  };

  const handleClearCompleted = () => {
    setTodos(todos.filter(t => !t.completed));
  };

  // Memoize all complex dashboard calculations to avoid O(N) or O(N*M) on every render!
  const calculations = React.useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Create an O(1) dictionary for product lookups
    const productMap = new Map(products.map(p => [p.id, p]));

    const todayInvoices = invoices.filter(inv => {
      const invDate = inv.date.split('T')[0];
      return invDate === todayStr;
    });

    const todaySales = todayInvoices.reduce((acc, inv) => 
      acc + (inv.status === 'paid' || inv.status === 'partially_paid' ? inv.grandTotal : 0)
    , 0);

    const totalInvoicesCount = invoices.length;
    
    // Low stock alert
    const lowStockProducts = products.filter(p => p.stock <= p.minStock && p.minStock > 0);

    // Total inventory valuation
    const inventoryValue = products.reduce((acc, p) => acc + (p.stock * p.purchasePrice), 0);
    const inventorySaleValue = products.reduce((acc, p) => acc + (p.stock * p.price), 0);
    const potentialProfit = inventorySaleValue - inventoryValue;

    // Accrued VAT tax
    const accruedTax = invoices.reduce((acc, inv) => acc + inv.taxAmount, 0);

    // O(I * L) profit calculation using the O(1) lookups
    const totalProfits = invoices.reduce((acc, inv) => {
      let cost = 0;
      inv.items.forEach(item => {
        const prod = productMap.get(item.productId);
        const purchasePrice = prod ? prod.purchasePrice : item.price * 0.7; // default fallback cost
        cost += purchasePrice * item.quantity;
      });
      return acc + (inv.grandTotal - inv.taxAmount - cost);
    }, 0);

    // Chart calculation (last 7 days of sales)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    const salesData7Days = last7Days.map(dateStr => {
      const dayInvs = invoices.filter(inv => inv.date.split('T')[0] === dateStr);
      const daySales = dayInvs.reduce((acc, inv) => acc + inv.grandTotal, 0);
      const label = new Date(dateStr).toLocaleDateString('ar-SA', { weekday: 'short' });
      return { date: dateStr, label, amount: daySales };
    });

    const maxAmount = Math.max(...salesData7Days.map(d => d.amount), 100);

    return {
      todayInvoices,
      todaySales,
      totalInvoicesCount,
      lowStockProducts,
      inventoryValue,
      potentialProfit,
      accruedTax,
      totalProfits,
      salesData7Days,
      maxAmount
    };
  }, [invoices, products]);

  const {
    todayInvoices,
    todaySales,
    totalInvoicesCount,
    lowStockProducts,
    inventoryValue,
    potentialProfit,
    accruedTax,
    totalProfits,
    salesData7Days,
    maxAmount
  } = calculations;

  return (
    <div className="space-y-6">
      {/* Upper Sync/Status banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-5 rounded-2xl shadow-sm border border-slate-200 gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 underline decoration-emerald-500 decoration-4 underline-offset-8">أهلاً بك في {settings.name}</h2>
          <p className="text-slate-500 text-xs mt-3.5">لوحة التحكم والمحاسبة الفورية • {new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Offline first indicator */}
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            محلي أولاً (Offline-First)
          </span>

          {syncStatus === 'synced' && (
            <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100 flex items-center gap-1.5">
              ✓ متزامن مع السحابة
            </span>
          )}
          {syncStatus === 'syncing' && (
            <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100 flex items-center gap-1.5">
              <RefreshCw className="w-3 h-3 animate-spin" /> جاري المزامنة...
            </span>
          )}

          <button 
            onClick={onForceSync}
            aria-label="تحديث البيانات والمزامنة"
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            title="تحديث البيانات والمزامنة"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* First-page module launcher */}
      <section className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-5">
          <div>
            <p className="text-[11px] font-extrabold tracking-[.14em] text-rose-500 uppercase">مساحات العمل</p>
            <h3 className="font-black text-slate-800 text-lg mt-1">إلى أين تريد أن تبدأ اليوم؟</h3>
          </div>
          <p className="text-xs text-slate-400">اختر الوحدة المناسبة للوصول المباشر إلى أدواتها.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
          {[
            { label: 'نقطة البيع', hint: 'بيع سريع وفواتير', tab: 'pos', icon: ShoppingBag, tone: 'bg-rose-50 text-rose-600 group-hover:bg-rose-500' },
            { label: 'المنتجات', hint: 'الكتالوج والأسعار', tab: 'products', icon: PackageSearch, tone: 'bg-amber-50 text-amber-600 group-hover:bg-amber-500' },
            { label: 'المخزون', hint: 'الأرصدة والحركات', tab: 'inventory', icon: Warehouse, tone: 'bg-teal-50 text-teal-600 group-hover:bg-teal-500' },
            { label: 'الفواتير', hint: 'المبيعات والضرائب', tab: 'invoices', icon: ReceiptText, tone: 'bg-blue-50 text-blue-600 group-hover:bg-blue-500' },
            { label: 'المشتريات', hint: 'الموردون والطلبات', tab: 'purchases', icon: Truck, tone: 'bg-violet-50 text-violet-600 group-hover:bg-violet-500' },
            { label: 'العملاء', hint: 'الأرصدة والعلاقات', tab: 'customers', icon: Users, tone: 'bg-pink-50 text-pink-600 group-hover:bg-pink-500' },
            { label: 'الحسابات', hint: 'القيود والأستاذ', tab: 'accounting', icon: Landmark, tone: 'bg-slate-100 text-slate-700 group-hover:bg-slate-700' },
            { label: 'الخزينة', hint: 'النقد والبنوك', tab: 'treasury', icon: Wallet, tone: 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-500' },
            { label: 'التقارير', hint: 'مؤشرات وقرارات', tab: 'reports', icon: BarChart3, tone: 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-500' },
            { label: 'الإعدادات', hint: 'النظام والضريبة', tab: 'settings', icon: Settings2, tone: 'bg-orange-50 text-orange-600 group-hover:bg-orange-500' },
          ].map(({ label, hint, tab, icon: Icon, tone }) => (
            <button
              key={tab}
              onClick={() => onNavigate(tab)}
              className="group flex items-center gap-3 p-3.5 bg-slate-50/80 hover:bg-white border border-slate-100 hover:border-rose-200 rounded-2xl text-right transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center transition-colors ${tone} group-hover:text-white`}>
                <Icon className="w-5 h-5" />
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-black text-slate-800 truncate">{label}</span>
                <span className="block text-[10px] text-slate-400 mt-0.5 truncate">{hint}</span>
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Main stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Sales Card */}
        <StatCard
          title="مبيعات اليوم"
          value={`${todaySales.toLocaleString(undefined, { minimumFractionDigits: 2 })} ${settings.currency}`}
          trendText={`${todayInvoices.length} فواتير جديدة`}
          trendUp={true}
          icon={<ShoppingBag className="w-6 h-6" />}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />

        {/* Net Profit Card */}
        <StatCard
          title="صافي الأرباح المقدرة"
          value={`${totalProfits.toLocaleString(undefined, { minimumFractionDigits: 2 })} ${settings.currency}`}
          subtitle="إجمالي الهامش المالي المكتسب"
          icon={<Landmark className="w-6 h-6" />}
          iconBg="bg-slate-50"
          iconColor="text-slate-600"
        />

        {/* Inventory Valuation Card */}
        <StatCard
          title="قيمة المخزون الحالي"
          value={`${inventoryValue.toLocaleString(undefined, { minimumFractionDigits: 2 })} ${settings.currency}`}
          subtitle={`أرباح محتملة: +${potentialProfit.toLocaleString()} ${settings.currency}`}
          icon={<FileText className="w-6 h-6" />}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />

        {/* Tax Card */}
        <StatCard
          title="الضريبة المستحقة (VAT)"
          value={`${accruedTax.toLocaleString(undefined, { minimumFractionDigits: 2 })} ${settings.currency}`}
          subtitle="مستندة للرقم الضريبي الحالي"
          icon={<Users className="w-6 h-6" />}
          iconBg="bg-rose-50"
          iconColor="text-rose-600"
        />
      </div>

      {/* Warning/Alarm section if low stock exists */}
      {lowStockProducts.length > 0 && (
        <div className="bg-white border border-red-200 rounded-2xl shadow-sm overflow-hidden">
          {/* Header Bar */}
          <div className="bg-red-50/50 p-5 border-b border-red-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-red-100 rounded-xl text-red-600 mt-0.5">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h4 className="font-extrabold text-red-950 text-sm sm:text-base">تنبيه تلقائي: المخزون تحت حد إعادة الطلب!</h4>
                <p className="text-slate-500 text-xs mt-1">
                  يوجد <span className="font-bold text-red-600">{lowStockProducts.length} منتجات</span> انخفضت كميتها الحالية عن "حد إعادة الطلب" المحدد في إعداداتها.
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <button 
                onClick={() => setIsLowStockExpanded(!isLowStockExpanded)}
                aria-expanded={isLowStockExpanded}
                className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              >
                <span>{isLowStockExpanded ? 'إخفاء التفاصيل' : 'تفاصيل المنتجات وإعادة التعبئة'}</span>
                {isLowStockExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" aria-hidden="true" /> : <ChevronDown className="w-4 h-4 text-slate-500" aria-hidden="true" />}
              </button>
              <button 
                onClick={() => onNavigate('inventory')}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                المستودع الكامل
              </button>
            </div>
          </div>

          {/* Collapsible content with list of low stock products */}
          {isLowStockExpanded && (
            <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto bg-slate-50/30">
              {lowStockProducts.map(p => {
                const qtyVal = replenishQty[p.id] || '';
                const hasSuccess = successItems[p.id];
                
                return (
                  <div key={p.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition">
                    <div className="flex items-center gap-3 min-w-[200px]">
                      <span className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center font-bold text-sm">
                        ⚠️
                      </span>
                      <div>
                        <h5 className="font-bold text-slate-800 text-xs sm:text-sm">{p.name}</h5>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">الباركود: {p.barcode} • حد الإنباه: {p.minStock}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                      {/* Quantities indicator */}
                      <div className="flex items-center gap-4">
                        <div className="text-center bg-red-50/80 px-3 py-1.5 rounded-lg border border-red-100 min-w-[80px]">
                          <span className="block text-[9px] text-red-500 font-bold">الكمية الحالية</span>
                          <span className="font-mono font-black text-xs text-red-700">{p.stock} {p.unit}</span>
                        </div>

                        <div className="text-center bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 min-w-[80px]">
                          <span className="block text-[9px] text-slate-400 font-bold">حد إعادة الطلب</span>
                          <span className="font-mono font-black text-xs text-slate-600">{p.minStock} {p.unit}</span>
                        </div>
                      </div>

                      {/* Replenish Quick Action */}
                      {onUpdateProductStock && (
                        <div className="flex items-center gap-2">
                          <div className="relative flex items-center">
                            <input 
                              type="number" 
                              placeholder="إضافة كمية" 
                              aria-label={`كمية التعبئة لـ ${p.name}`}
                              value={qtyVal}
                              onChange={(e) => {
                                const val = e.target.value;
                                setReplenishQty(prev => ({ ...prev, [p.id]: val }));
                              }}
                              className="w-24 px-2 py-1.5 text-xs border border-slate-200 rounded-lg text-center font-bold focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                            />
                          </div>

                          <button
                            onClick={() => {
                              const qtyToAdd = parseInt(qtyVal);
                              if (isNaN(qtyToAdd) || qtyToAdd <= 0) return;
                              onUpdateProductStock(p.id, p.stock + qtyToAdd);
                              setReplenishQty(prev => ({ ...prev, [p.id]: '' }));
                              setSuccessItems(prev => ({ ...prev, [p.id]: true }));
                              setTimeout(() => {
                                setSuccessItems(prev => ({ ...prev, [p.id]: false }));
                              }, 2000);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                              hasSuccess 
                                ? 'bg-emerald-600 text-white' 
                                : 'bg-slate-800 hover:bg-slate-700 text-white'
                            }`}
                          >
                            {hasSuccess ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>تمت التعبئة!</span>
                              </>
                            ) : (
                              <span>إمداد سريع</span>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Main Grid: Chart and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Column (2 cols wide on desktop) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-800 text-lg underline decoration-emerald-500 decoration-4 underline-offset-8 flex items-center gap-2">
                تطور المبيعات اليومية خلال الأسبوع الحالي
              </h3>
              <p className="text-xs text-slate-400 mt-2">رسم بياني تفاعلي (Area Chart) يعكس الأداء المالي اليومي وحركة الفواتير</p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>إجمالي الأسبوع: {salesData7Days.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} {settings.currency}</span>
              </div>
            </div>
          </div>

          {/* Interactive Recharts Area Chart */}
          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={salesData7Days}
                margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="label" 
                  tickLine={false} 
                  axisLine={{ stroke: '#cbd5e1' }}
                  tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} 
                />
                <YAxis 
                  tickLine={false} 
                  axisLine={false}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickFormatter={(val) => `${val}`}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const dataItem = payload[0].payload;
                      return (
                        <div className="bg-slate-900/95 backdrop-blur-md text-white p-3 rounded-2xl shadow-xl text-xs border border-slate-700/80 font-sans space-y-1">
                          <p className="font-bold text-slate-300 text-[11px] flex items-center justify-between gap-4">
                            <span>{label}</span>
                            <span className="text-slate-400 font-mono">{dataItem.date}</span>
                          </p>
                          <p className="text-base font-black text-emerald-400">
                            {Number(payload[0].value).toLocaleString(undefined, { minimumFractionDigits: 2 })} {settings.currency}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  name="المبيعات" 
                  stroke="#059669" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#salesGradient)" 
                  activeDot={{ r: 7, stroke: '#047857', strokeWidth: 3, fill: '#ffffff' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick actions Panel */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-base underline decoration-emerald-500 decoration-4 underline-offset-8">الوصول السريع والعمليات</h3>
            <p className="text-xs text-slate-400 mt-2">إجراءات سريعة لتسريع العمل اليومي للكاشير والمخازن</p>

            <div className="grid grid-cols-2 gap-3 pt-4">
              <button 
                onClick={() => onNavigate('pos')}
                className="flex flex-col items-center gap-2.5 p-4 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 rounded-2xl text-slate-700 hover:text-emerald-800 transition text-center group"
              >
                <div className="p-2 bg-slate-100 group-hover:bg-emerald-600 group-hover:text-white rounded-xl transition-all">
                  <ShoppingBag className="w-5 h-5 text-slate-600 group-hover:text-white" />
                </div>
                <span className="font-bold text-xs">نقطة البيع (POS)</span>
              </button>

              <button 
                onClick={() => onNavigate('inventory')}
                className="flex flex-col items-center gap-2.5 p-4 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-2xl text-slate-700 hover:text-blue-800 transition text-center group"
              >
                <div className="p-2 bg-slate-100 group-hover:bg-blue-600 group-hover:text-white rounded-xl transition-all">
                  <FileText className="w-5 h-5 text-slate-600 group-hover:text-white" />
                </div>
                <span className="font-bold text-xs">إضافة منتج</span>
              </button>

              <button 
                onClick={() => onNavigate('invoices')}
                className="flex flex-col items-center gap-2.5 p-4 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 rounded-2xl text-slate-700 hover:text-emerald-800 transition text-center group"
              >
                <div className="p-2 bg-slate-100 group-hover:bg-emerald-600 group-hover:text-white rounded-xl transition-all">
                  <Clock className="w-5 h-5 text-slate-600 group-hover:text-white" />
                </div>
                <span className="font-bold text-xs">الفواتير الضريبية</span>
              </button>

              <button 
                onClick={() => onNavigate('reports')}
                className="flex flex-col items-center gap-2.5 p-4 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-2xl text-slate-700 hover:text-rose-800 transition text-center group"
              >
                <div className="p-2 bg-slate-100 group-hover:bg-rose-600 group-hover:text-white rounded-xl transition-all">
                  <TrendingUp className="w-5 h-5 text-slate-600 group-hover:text-white" />
                </div>
                <span className="font-bold text-xs">التقارير المالية</span>
              </button>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 mt-4 space-y-2.5">
            <h4 className="font-bold text-slate-700 text-xs">إحصائيات الأصناف والمخازن</h4>
            <div className="flex justify-between text-xs text-slate-500">
              <span>إجمالي فئات المنتجات:</span>
              <span className="font-bold text-slate-800">
                {Array.from(new Set(products.map(p => p.category))).length} فئات
              </span>
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>إجمالي المنتجات المسجلة:</span>
              <span className="font-bold text-slate-800">{products.length} صنف</span>
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>المخزون الإجمالي للقطع:</span>
              <span className="font-bold text-slate-800">
                {products.reduce((acc, p) => acc + (p.stock || 0), 0)} وحدة
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom section: Recent Activity & Daily To-Do List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Invoices Table (2 cols wide on desktop) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 dark:bg-slate-800 dark:border-slate-700 space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-700">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base underline decoration-emerald-500 decoration-4 underline-offset-8">أحدث العمليات والفواتير</h3>
              <p className="text-xs text-slate-400 mt-2">الفواتير الأخيرة الصادرة فوراً من نقطة البيع</p>
            </div>
            <button 
              onClick={() => onNavigate('invoices')}
              className="text-xs text-emerald-600 font-bold hover:underline flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-full hover:bg-emerald-100 transition-all"
            >
              عرض الكل <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right text-slate-500 dark:text-slate-400">
              <thead className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/60 rounded-lg">
                <tr>
                  <th className="px-4 py-3">رقم الفاتورة</th>
                  <th className="px-4 py-3">التاريخ والوقت</th>
                  <th className="px-4 py-3">العميل</th>
                  <th className="px-4 py-3">طريقة الدفع</th>
                  <th className="px-4 py-3">المجموع الكلي</th>
                  <th className="px-4 py-3">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {invoices.slice(0, 5).map((inv) => (
                  <tr key={inv.id} className="border-b border-slate-100 dark:border-slate-700/60 hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                    <td className="px-4 py-3.5 font-bold text-slate-800 dark:text-slate-200">{inv.invoiceNumber}</td>
                    <td className="px-4 py-3.5 text-xs text-slate-500 dark:text-slate-400">
                      {new Date(inv.date).toLocaleString('ar-SA')}
                    </td>
                    <td className="px-4 py-3.5 font-medium text-slate-700 dark:text-slate-300">{inv.customerName || 'عميل نقدي'}</td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold">
                        {inv.paymentMethod === 'cash' ? '💵 نقدي' : 
                         inv.paymentMethod === 'card' ? '💳 شبكة' : 
                         inv.paymentMethod === 'credit' ? '⏳ آجل' : '🔀 مختلط'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-black text-slate-800 dark:text-slate-200">
                      {inv.grandTotal.toFixed(2)} {settings.currency}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                        inv.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                        inv.status === 'unpaid' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                        'bg-amber-50 text-amber-700 border border-amber-100'
                      }`}>
                        {inv.status === 'paid' ? 'مدفوعة' :
                         inv.status === 'unpaid' ? 'غير مدفوعة (آجل)' :
                         'مدفوعة جزئياً'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* To-Do List Widget (1 col wide) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 dark:bg-slate-800 dark:border-slate-700 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base underline decoration-emerald-500 decoration-4 underline-offset-8 flex items-center gap-2">
                  <ListTodo className="w-5 h-5 text-emerald-600" />
                  قائمة المهام اليومية
                </h3>
                <p className="text-xs text-slate-400 mt-2">تسجيل وإدارة المهام التشغيلية للمحل والرفوف</p>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 rounded-full border border-emerald-200/60 font-mono">
                {todos.filter(t => t.completed).length} / {todos.length}
              </span>
            </div>

            {/* Add Todo Form */}
            <form onSubmit={handleAddTodo} className="flex items-center gap-2 mt-4">
              <input
                type="text"
                value={newTodoInput}
                onChange={(e) => setNewTodoInput(e.target.value)}
                placeholder="أضف مهمة جديدة (مثلاً: تنظيف الرفوف...)"
                className="flex-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              />
              <button
                type="submit"
                aria-label="إضافة المهمة"
                className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition shadow-sm flex items-center justify-center shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                title="إضافة المهمة"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
              </button>
            </form>

            {/* Todo List Items */}
            <div className="space-y-2 mt-4 max-h-72 overflow-y-auto pr-1">
              {todos.length === 0 ? (
                <div className="text-center py-8 text-slate-400 dark:text-slate-500 space-y-1">
                  <CheckCircle2 className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                  <p className="text-xs font-bold">لا توجد مهام حالياً!</p>
                  <p className="text-[11px]">قم بإضافة مهمة جديدة لمتابعة العمل اليومي.</p>
                </div>
              ) : (
                todos.map((todo) => (
                  <div
                    key={todo.id}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition duration-150 ${
                      todo.completed
                        ? 'bg-emerald-50/40 border-emerald-200/60 dark:bg-emerald-950/20 dark:border-emerald-800/40'
                        : 'bg-slate-50/60 border-slate-200/80 dark:bg-slate-900/40 dark:border-slate-700/60 hover:border-slate-300'
                    }`}
                  >
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={todo.completed}
                      aria-label={`تحديد مهمة: ${todo.text}`}
                      onClick={() => handleToggleTodo(todo.id)}
                      className="flex items-center gap-2.5 text-right flex-1 min-w-0 rounded-lg p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                    >
                      {todo.completed ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" aria-hidden="true" />
                      )}
                      <span
                        className={`text-xs font-bold truncate ${
                          todo.completed
                            ? 'line-through text-slate-400 dark:text-slate-500'
                            : 'text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        {todo.text}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteTodo(todo.id)}
                      aria-label={`حذف المهمة: ${todo.text}`}
                      className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition shrink-0 opacity-80 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                      title="حذف المهمة"
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Clear completed action */}
          {todos.some(t => t.completed) && (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-end">
              <button
                type="button"
                onClick={handleClearCompleted}
                className="text-[11px] font-bold text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 transition flex items-center gap-1 rounded-lg px-1.5 py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
              >
                <Trash2 className="w-3 h-3" aria-hidden="true" />
                تنظيف المهام المكتملة
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
