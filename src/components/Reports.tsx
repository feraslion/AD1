import React, { useState } from 'react';
import { Invoice, Product, Category, StoreSettings } from '../types';
import { Calendar, Download, TrendingUp, DollarSign, ShoppingCart, Percent, Tag, ArrowUpRight, ArrowDownRight, Layers, FileSpreadsheet } from 'lucide-react';

interface ReportsProps {
  invoices: Invoice[];
  products: Product[];
  categories: Category[];
  settings: StoreSettings;
}

export default function Reports({ invoices, products, categories, settings }: ReportsProps) {
  const [reportRange, setReportRange] = useState<'7' | '30' | 'all'>('30');

  // Filter invoices based on date range
  const filterByRange = (invs: Invoice[]) => {
    const now = new Date();
    if (reportRange === '7') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);
      return invs.filter(inv => new Date(inv.date) >= sevenDaysAgo);
    } else if (reportRange === '30') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);
      return invs.filter(inv => new Date(inv.date) >= thirtyDaysAgo);
    }
    return invs; // all
  };

  const activeInvoices = filterByRange(invoices);

  // General metrics
  const totalSalesVal = activeInvoices.reduce((acc, inv) => acc + inv.grandTotal, 0);
  const totalTaxAmount = activeInvoices.reduce((acc, inv) => acc + inv.taxAmount, 0);
  const totalInvsCount = activeInvoices.length;
  
  // Profits calculation
  const totalProfitsVal = activeInvoices.reduce((acc, inv) => {
    let cost = 0;
    inv.items.forEach(item => {
      const prod = products.find(p => p.id === item.productId);
      const purchasePrice = prod ? prod.purchasePrice : item.price * 0.7; // default fallback cost
      cost += purchasePrice * item.quantity;
    });
    return acc + (inv.grandTotal - inv.taxAmount - cost);
  }, 0);

  // Average ticket value
  const avgTicketValue = totalInvsCount > 0 ? (totalSalesVal / totalInvsCount) : 0;

  // Category sales performance distribution
  const categorySales = categories.map(cat => {
    let salesTotal = 0;
    activeInvoices.forEach(inv => {
      inv.items.forEach(item => {
        const prod = products.find(p => p.id === item.productId);
        if (prod && prod.category === cat.id) {
          salesTotal += item.total;
        }
      });
    });
    return {
      ...cat,
      totalSales: salesTotal
    };
  }).sort((a, b) => b.totalSales - a.totalSales);

  const maxCategorySales = Math.max(...categorySales.map(c => c.totalSales), 1);

  // Stock alert stats
  const lowStockProducts = products.filter(p => p.stock <= p.minStock && p.minStock > 0);
  const outOfStockCount = products.filter(p => p.stock <= 0 && p.minStock > 0).length;

  const handleExportSpreadsheet = (format: 'Excel' | 'CSV') => {
    alert(`محاكاة: تم إعداد وتصدير تقرير المبيعات والأرباح والضريبة للفترة المحددة بنجاح بصيغة ${format}.\n\nاسم الملف: sales_report_${reportRange}_days.${format === 'Excel' ? 'xlsx' : 'csv'}`);
  };

  return (
    <div className="space-y-6">
      {/* Upper header with filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-200 gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 underline decoration-emerald-500/50 decoration-4 underline-offset-8">التقارير المالية والتحليلات</h2>
          <p className="text-slate-500 text-xs mt-3">كشوفات تفصيلية للمبيعات، الأرباح، التكلفة، وإقرارات ضريبة القيمة المضافة مبوبة</p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={reportRange}
            onChange={(e) => setReportRange(e.target.value as '7' | '30' | 'all')}
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 focus:outline-none"
          >
            <option value="7">📅 آخر 7 أيام</option>
            <option value="30">📅 آخر 30 يوماً</option>
            <option value="all">📂 كل الفترات المسجلة</option>
          </select>

          <button
            onClick={() => handleExportSpreadsheet('Excel')}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>تصدير Excel</span>
          </button>
        </div>
      </div>

      {/* Main KPIs Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-2">
          <div className="flex justify-between items-center text-slate-400 text-xs font-bold">
            <span>إجمالي المبيعات (شامل الضريبة)</span>
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-800 font-mono">
            {totalSalesVal.toLocaleString(undefined, { minimumFractionDigits: 2 })} {settings.currency}
          </div>
          <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" />
            تحديث فوري وتجميع تلقائي للفواتير
          </p>
        </div>

        {/* KPI 2 */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-2">
          <div className="flex justify-between items-center text-slate-400 text-xs font-bold">
            <span>صافي الأرباح المحققة</span>
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-emerald-600 font-mono">
            {totalProfitsVal.toLocaleString(undefined, { minimumFractionDigits: 2 })} {settings.currency}
          </div>
          <p className="text-[10px] text-slate-500 font-medium">
            هامش ربح البيع مخصوماً منه ضريبة VAT والتكلفة
          </p>
        </div>

        {/* KPI 3 */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-2">
          <div className="flex justify-between items-center text-slate-400 text-xs font-bold">
            <span>الالتزام الضريبي (الضريبة المستحقة)</span>
            <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-rose-600 font-mono">
            {totalTaxAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} {settings.currency}
          </div>
          <p className="text-[10px] text-rose-600 font-semibold">
            جاهزة لإقرار الزكاة والضريبة والجمارك KSA
          </p>
        </div>

        {/* KPI 4 */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-2">
          <div className="flex justify-between items-center text-slate-400 text-xs font-bold">
            <span>معدل الفاتورة الصادرة</span>
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-blue-600 font-mono">
            {avgTicketValue.toLocaleString(undefined, { minimumFractionDigits: 2 })} {settings.currency}
          </div>
          <p className="text-[10px] text-slate-500 font-semibold">
            متوسط قيمة سلة المشتريات للفاتورة الواحدة
          </p>
        </div>
      </div>

      {/* Categories performance comparison list */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Performance */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-extrabold text-slate-800 text-base">مبيعات المنتجات حسب التصنيف</h3>
            <span className="text-xs text-slate-400">الفترة المحددة</span>
          </div>

          <div className="space-y-4">
            {categorySales.map(cat => {
              const pct = (cat.totalSales / maxCategorySales) * 100;
              return (
                <div key={cat.id} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-700">{cat.icon} {cat.name}</span>
                    <span className="text-slate-900 font-mono">{cat.totalSales.toFixed(2)} {settings.currency}</span>
                  </div>
                  {/* Progress Bar Graphic */}
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      style={{ width: `${pct}%` }}
                      className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500"
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Operational Inventory Health list */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-slate-800 text-base">تقرير فحص صحة وتأمين المخزون</h3>
            <p className="text-xs text-slate-400 mb-4">كشف سريع لحماية الفروع من العجز والتأمين المبكر للطلب</p>

            <div className="space-y-3.5">
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">🚨</span>
                  <span className="text-xs font-bold text-slate-700">منتجات منتهية من المخزن تماماً:</span>
                </div>
                <span className="font-extrabold text-rose-600 text-sm font-mono">{outOfStockCount} صنف</span>
              </div>

              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">⚠️</span>
                  <span className="text-xs font-bold text-slate-700">أصناف تحت حد الطلب الأدنى:</span>
                </div>
                <span className="font-extrabold text-amber-600 text-sm font-mono">{lowStockProducts.length - outOfStockCount} صنف</span>
              </div>

              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">✅</span>
                  <span className="text-xs font-bold text-slate-700">مخزون مغطى ومؤمن تماماً:</span>
                </div>
                <span className="font-extrabold text-emerald-600 text-sm font-mono">
                  {products.length - lowStockProducts.length} صنف
                </span>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 mt-4 text-xs space-y-2 text-slate-500">
            <div className="flex justify-between">
              <span>إجمالي قيمة الأصناف تحت التهديد بالتكلفة:</span>
              <span className="font-bold text-slate-800 font-mono">
                {lowStockProducts.reduce((acc, p) => acc + (p.stock * p.purchasePrice), 0).toLocaleString()} {settings.currency}
              </span>
            </div>
            <p className="text-[10px] text-slate-400">توصية النظام: يوصى بإنشاء أمر توريد شراء فوري للأصناف ذات المخزون شبه المنتهي لتأمين مبيعات الأسبوع القادم.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
