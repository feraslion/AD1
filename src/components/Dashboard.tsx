import React, { useState } from 'react';
import { Invoice, Product, StoreSettings } from '../types';
import { TrendingUp, ShoppingBag, AlertTriangle, FileText, Landmark, Users, Clock, ArrowLeft, RefreshCw, ChevronDown, ChevronUp, Check } from 'lucide-react';

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

  // Calculations
  const todayStr = new Date().toISOString().split('T')[0];
  
  const todayInvoices = invoices.filter(inv => {
    const invDate = inv.date.split('T')[0];
    return invDate === todayStr;
  });

  const todaySales = todayInvoices.reduce((acc, inv) => acc + (inv.status === 'paid' || inv.status === 'partially_paid' ? inv.grandTotal : 0), 0);
  const totalInvoicesCount = invoices.length;
  
  // Low stock alert
  const lowStockProducts = products.filter(p => p.stock <= p.minStock && p.minStock > 0);

  // Total inventory valuation
  const inventoryValue = products.reduce((acc, p) => acc + (p.stock * p.purchasePrice), 0);
  const inventorySaleValue = products.reduce((acc, p) => acc + (p.stock * p.price), 0);
  const potentialProfit = inventorySaleValue - inventoryValue;

  // Accrued VAT tax
  const accruedTax = invoices.reduce((acc, inv) => acc + inv.taxAmount, 0);

  // Profit calculation from all invoices
  const totalProfits = invoices.reduce((acc, inv) => {
    let cost = 0;
    inv.items.forEach(item => {
      const prod = products.find(p => p.id === item.productId);
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
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
            title="تحديث البيانات والمزامنة"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Sales Card */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-slate-400 text-xs font-bold block">مبيعات اليوم</span>
            <div className="text-2xl font-black text-slate-800">
              {todaySales.toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-sm font-normal text-slate-400">{settings.currency}</span>
            </div>
            <span className="text-emerald-600 text-xs font-bold flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              {todayInvoices.length} فواتير جديدة
            </span>
          </div>
          <div className="bg-emerald-50 p-3.5 rounded-xl text-emerald-600">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </div>

        {/* Net Profit Card */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-slate-400 text-xs font-bold block">صافي الأرباح المقدرة</span>
            <div className="text-2xl font-black text-emerald-600">
              {totalProfits.toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-xs font-normal text-slate-400">{settings.currency}</span>
            </div>
            <span className="text-slate-500 text-[10px] font-semibold">إجمالي الهامش المالي المكتسب</span>
          </div>
          <div className="bg-slate-50 p-3.5 rounded-xl text-slate-600">
            <Landmark className="w-6 h-6" />
          </div>
        </div>

        {/* Inventory Valuation Card */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between border-r-4 border-r-emerald-500">
          <div className="space-y-1">
            <span className="text-slate-400 text-xs font-bold block">قيمة المخزون الحالي</span>
            <div className="text-2xl font-black text-slate-800">
              {inventoryValue.toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-sm font-normal text-slate-400">{settings.currency}</span>
            </div>
            <span className="text-blue-500 text-[10px] font-bold">
              أرباح محتملة: +{potentialProfit.toLocaleString()} {settings.currency}
            </span>
          </div>
          <div className="bg-blue-50 p-3.5 rounded-xl text-blue-600">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        {/* Tax Card */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-slate-400 text-xs font-bold block">الضريبة المستحقة (VAT)</span>
            <div className="text-2xl font-black text-rose-600">
              {accruedTax.toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-sm font-normal text-rose-400">{settings.currency}</span>
            </div>
            <span className="text-slate-500 text-[10px] font-semibold">مستندة للرقم الضريبي الحالي</span>
          </div>
          <div className="bg-rose-50 p-3.5 rounded-xl text-rose-600">
            <Users className="w-6 h-6" />
          </div>
        </div>
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
                className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              >
                <span>{isLowStockExpanded ? 'إخفاء التفاصيل' : 'تفاصيل المنتجات وإعادة التعبئة'}</span>
                {isLowStockExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
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
                              value={qtyVal}
                              onChange={(e) => {
                                const val = e.target.value;
                                setReplenishQty(prev => ({ ...prev, [p.id]: val }));
                              }}
                              className="w-24 px-2 py-1.5 text-xs border border-slate-200 rounded-lg text-center font-bold focus:outline-none focus:ring-1 focus:ring-red-500 bg-white"
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
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-800 text-lg underline decoration-emerald-500 decoration-4 underline-offset-8">حركة مبيعات الـ 7 أيام الأخيرة</h3>
              <p className="text-xs text-slate-400 mt-2">تحديث فوري للمبيعات والمؤشرات</p>
            </div>
            <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-3 py-1 rounded border border-slate-200">مؤشر أداء المبيعات</span>
          </div>

          {/* SVG Custom High-Fidelity Chart */}
          <div className="h-64 w-full relative pt-2">
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[10px] text-slate-400 font-bold">
              <div className="border-b border-dashed border-slate-100 pb-1 flex justify-between">
                <span>{(maxAmount).toFixed(0)} {settings.currency}</span>
              </div>
              <div className="border-b border-dashed border-slate-100 pb-1 flex justify-between">
                <span>{(maxAmount * 0.66).toFixed(0)} {settings.currency}</span>
              </div>
              <div className="border-b border-dashed border-slate-100 pb-1 flex justify-between">
                <span>{(maxAmount * 0.33).toFixed(0)} {settings.currency}</span>
              </div>
              <div className="flex justify-between">
                <span>0 {settings.currency}</span>
              </div>
            </div>

            {/* Bars container */}
            <div className="h-full flex items-end justify-between relative z-10 pt-4 px-6">
              {salesData7Days.map((d, index) => {
                const heightPercentage = Math.max(8, (d.amount / maxAmount) * 80);
                const isCurrentDay = index === 4; // Mock layout highlighting Wednesday like the theme
                return (
                  <div key={d.date} className="flex flex-col items-center group relative w-12">
                    {/* Tooltip on hover */}
                    <div className="absolute -top-10 bg-slate-800 text-white text-xs px-2.5 py-1 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition duration-200 pointer-events-none whitespace-nowrap z-30 font-bold">
                      {d.amount.toFixed(2)} {settings.currency}
                    </div>

                    {/* Bar graphic */}
                    <div 
                      style={{ height: `${heightPercentage}%` }} 
                      className={`w-full rounded-t-lg transition-all duration-500 hover:scale-105 ${
                        d.amount === 0 
                          ? 'bg-slate-100' 
                          : isCurrentDay
                            ? 'bg-emerald-700 shadow-md shadow-emerald-200'
                            : 'bg-emerald-500 hover:bg-emerald-600'
                      }`}
                    ></div>

                    {/* X Axis Label */}
                    <span className={`text-[10px] font-bold mt-2.5 block ${isCurrentDay ? 'text-emerald-700 font-extrabold' : 'text-slate-500'}`}>{d.label}</span>
                  </div>
                );
              })}
            </div>
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

      {/* Bottom recent activity table */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-800 text-base underline decoration-emerald-500 decoration-4 underline-offset-8">أحدث العمليات والفواتير</h3>
            <p className="text-xs text-slate-400 mt-2">الفواتير الأخيرة الصادرة فوراً من نقطة البيع</p>
          </div>
          <button 
            onClick={() => onNavigate('invoices')}
            className="text-xs text-emerald-600 font-bold hover:underline flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-full hover:bg-emerald-100 transition-all"
          >
            عرض الكل <ArrowLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right text-slate-500">
            <thead className="text-xs text-slate-700 bg-slate-50 rounded-lg">
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
                <tr key={inv.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                  <td className="px-4 py-3.5 font-bold text-slate-800">{inv.invoiceNumber}</td>
                  <td className="px-4 py-3.5 text-xs text-slate-500">
                    {new Date(inv.date).toLocaleString('ar-SA')}
                  </td>
                  <td className="px-4 py-3.5 font-medium text-slate-700">{inv.customerName || 'عميل نقدي'}</td>
                  <td className="px-4 py-3.5">
                    <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-bold">
                      {inv.paymentMethod === 'cash' ? '💵 نقدي' : 
                       inv.paymentMethod === 'card' ? '💳 شبكة' : 
                       inv.paymentMethod === 'credit' ? '⏳ آجل' : '🔀 مختلط'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-black text-slate-800">
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
    </div>
  );
}
