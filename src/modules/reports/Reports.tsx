import React, { useState, useEffect } from 'react';
import { StoreSettings } from '../../types';
import { ReportService } from '../../services/api';
import { exportToExcel, exportToPDF } from '../../shared/utils/exportUtils';
import { 
  BarChart3, 
  TrendingUp, 
  Receipt, 
  ShoppingBag, 
  Package, 
  Users, 
  Building2, 
  DollarSign, 
  FileSpreadsheet, 
  FileText, 
  Calendar, 
  RefreshCw, 
  PieChart, 
  AlertTriangle, 
  Scale, 
  Search, 
  Download, 
  Printer, 
  CheckCircle2, 
  ArrowUpRight, 
  ArrowDownLeft 
} from 'lucide-react';
import StatCard from '../../shared/components/ui/StatCard';
import Badge from '../../shared/components/ui/Badge';

interface ReportsProps {
  settings: StoreSettings;
}

export default function Reports({ settings }: ReportsProps) {
  const [activeTab, setActiveTab] = useState<
    'sales' | 'purchases' | 'inventory' | 'customers' | 'suppliers' | 'profit' | 'financials'
  >('sales');

  // Filters
  const [startDate, setStartDate] = useState<string>(
    new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 10)
  );
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().slice(0, 10));

  // Data States
  const [salesReport, setSalesReport] = useState<any>(null);
  const [purchaseReport, setPurchaseReport] = useState<any>(null);
  const [inventoryReport, setInventoryReport] = useState<any>(null);
  const [customerReport, setCustomerReport] = useState<any>(null);
  const [supplierReport, setSupplierReport] = useState<any>(null);
  const [profitReport, setProfitReport] = useState<any>(null);
  const [financialsReport, setFinancialsReport] = useState<any>(null);

  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadCurrentTabReport = async () => {
    setLoading(true);
    try {
      if (activeTab === 'sales') {
        const data = await ReportService.getSalesReport({ startDate, endDate });
        setSalesReport(data);
      } else if (activeTab === 'purchases') {
        const data = await ReportService.getPurchaseReport({ startDate, endDate });
        setPurchaseReport(data);
      } else if (activeTab === 'inventory') {
        const data = await ReportService.getInventoryReport();
        setInventoryReport(data);
      } else if (activeTab === 'customers') {
        const data = await ReportService.getCustomerReport();
        setCustomerReport(data);
      } else if (activeTab === 'suppliers') {
        const data = await ReportService.getSupplierReport();
        setSupplierReport(data);
      } else if (activeTab === 'profit') {
        const data = await ReportService.getProfitReport({ startDate, endDate });
        setProfitReport(data);
      } else if (activeTab === 'financials') {
        const data = await ReportService.getFinancialStatements();
        setFinancialsReport(data);
      }
    } catch (e) {
      console.error('Error loading report:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCurrentTabReport();
  }, [activeTab, startDate, endDate]);

  const formatAmount = (val: number) => {
    return new Intl.NumberFormat('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val || 0) + ' ' + (settings.currency || 'SAR');
  };

  // Export Helpers
  const handleExportSalesExcel = () => {
    if (!salesReport) return;
    const headers = ['رقم الفاتورة', 'المستفيد', 'المبلغ الصافي', 'الضريبة', 'الإجمالي', 'الحالة', 'طريقة الدفع'];
    const rows = salesReport.invoicesList.map((inv: any) => [
      inv.invoiceNumber,
      inv.customerName || 'عميل نقدي',
      inv.totalWithoutTax || 0,
      inv.taxAmount || 0,
      inv.grandTotal || 0,
      inv.status === 'paid' ? 'مدفوع' : 'غير مدفوع',
      inv.paymentMethod || 'cash'
    ]);
    exportToExcel('تقرير_المبيعات', headers, rows);
  };

  const handleExportSalesPDF = () => {
    if (!salesReport) return;
    const headers = ['رقم الفاتورة', 'المستفيد', 'المبلغ الصافي', 'الضريبة', 'الإجمالي', 'الحالة'];
    const rows = salesReport.invoicesList.map((inv: any) => [
      inv.invoiceNumber,
      inv.customerName || 'عميل نقدي',
      formatAmount(inv.totalWithoutTax || 0),
      formatAmount(inv.taxAmount || 0),
      formatAmount(inv.grandTotal || 0),
      inv.status === 'paid' ? 'مدفوع' : 'غير مدفوع'
    ]);
    const summaryText = `إجمالي المبيعات: ${formatAmount(salesReport.summary.totalSales)} | ضريبة المخرجات: ${formatAmount(salesReport.summary.totalTax)} | عدد الفواتير: ${salesReport.summary.totalInvoices}`;
    exportToPDF('تقرير المبيعات والتحصيلات', headers, rows, summaryText, settings.name);
  };

  const handleExportPurchasesExcel = () => {
    if (!purchaseReport) return;
    const headers = ['رقم الأمر', 'المورد', 'الإجمالي', 'ضريبة المدخلات', 'الحالة', 'التاريخ'];
    const rows = purchaseReport.ordersList.map((po: any) => [
      po.purchaseNumber,
      po.supplierName || '-',
      po.grandTotal || 0,
      po.taxAmount || 0,
      po.status === 'received' || po.status === 'completed' ? 'مستلم' : 'قيد الانتظار',
      po.date
    ]);
    exportToExcel('تقرير_المشتريات', headers, rows);
  };

  const handleExportPurchasesPDF = () => {
    if (!purchaseReport) return;
    const headers = ['رقم الأمر', 'المورد', 'الإجمالي', 'ضريبة المدخلات', 'الحالة'];
    const rows = purchaseReport.ordersList.map((po: any) => [
      po.purchaseNumber,
      po.supplierName || '-',
      formatAmount(po.grandTotal || 0),
      formatAmount(po.taxAmount || 0),
      po.status === 'received' || po.status === 'completed' ? 'مستلم' : 'قيد الانتظار'
    ]);
    const summaryText = `إجمالي المشتريات: ${formatAmount(purchaseReport.summary.totalPurchases)} | ضريبة المدخلات: ${formatAmount(purchaseReport.summary.totalTax)} | عدد الأوامر: ${purchaseReport.summary.totalPOCount}`;
    exportToPDF('تقرير المشتريات والتوريدات', headers, rows, summaryText, settings.name);
  };

  const handleExportInventoryExcel = () => {
    if (!inventoryReport) return;
    const headers = ['التصنيف', 'عدد الأصناف', 'إجمالي الكميات', 'القيمة التكلفية', 'القيمة البيعية'];
    const rows = inventoryReport.categoryBreakdown.map((cat: any) => [
      cat.category,
      cat.count,
      cat.stock,
      cat.costVal,
      cat.saleVal
    ]);
    exportToExcel('تقرير_تقييم_المخزون', headers, rows);
  };

  const handleExportInventoryPDF = () => {
    if (!inventoryReport) return;
    const headers = ['التصنيف', 'عدد الأصناف', 'إجمالي الكميات', 'القيمة التكلفية', 'القيمة البيعية'];
    const rows = inventoryReport.categoryBreakdown.map((cat: any) => [
      cat.category,
      cat.count,
      cat.stock,
      formatAmount(cat.costVal),
      formatAmount(cat.saleVal)
    ]);
    const summaryText = `إجمالي تقييم المخزون بالتكلفة: ${formatAmount(inventoryReport.summary.totalValuationCost)} | بالقيمة البيعية: ${formatAmount(inventoryReport.summary.totalValuationSale)} | الربح المتوقع: ${formatAmount(inventoryReport.summary.potentialProfit)}`;
    exportToPDF('تقرير تقييم وحركة المخزون', headers, rows, summaryText, settings.name);
  };

  const handleExportFinancialsPDF = () => {
    if (!financialsReport) return;
    const headers = ['رمز الحساب', 'اسم الحساب', 'نوع الحساب', 'مدين', 'دائن', 'الرصيد الصافي'];
    const rows = financialsReport.trialBalance.accounts.map((acc: any) => [
      acc.code,
      acc.name,
      acc.type,
      formatAmount(acc.totalDebit),
      formatAmount(acc.totalCredit),
      formatAmount(acc.netBalance)
    ]);
    const summaryText = `إجمالي مدين: ${formatAmount(financialsReport.trialBalance.totalDebit)} | إجمالي دائن: ${formatAmount(financialsReport.trialBalance.totalCredit)} | حالة الاتزان: ${financialsReport.trialBalance.isBalanced ? 'متزن 🟢' : 'غير متزن 🔴'}`;
    exportToPDF('ميزان المراجعة والقوائم المالية المحاسبية', headers, rows, summaryText, settings.name);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 bg-slate-50 min-h-screen text-right" dir="rtl">
      {/* Top Banner Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-md shadow-blue-200">
            <BarChart3 className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">محرك التقارير المالية والتشغيلية (Reporting Engine)</h1>
            <p className="text-xs text-slate-500 font-bold mt-0.5">تقارير المبيعات، المشتريات، المخزون، العملاء، الموردين، الأرباح والخسائر، والقوائم المالية</p>
          </div>
        </div>

        {/* Date Filters & Actions */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {['sales', 'purchases', 'profit'].includes(activeTab) && (
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
              <Calendar className="w-4 h-4 text-slate-500 mr-1" />
              <span>من:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-slate-800"
              />
              <span>إلى:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-slate-800"
              />
            </div>
          )}

          <button
            onClick={loadCurrentTabReport}
            title="تحديث التقرير"
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition border border-slate-300"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex overflow-x-auto gap-2 border-b border-slate-200 pb-2">
        {[
          { id: 'sales', label: 'تقارير المبيعات', icon: Receipt },
          { id: 'purchases', label: 'تقارير المشتريات', icon: ShoppingBag },
          { id: 'inventory', label: 'تقارير المخزون', icon: Package },
          { id: 'customers', label: 'تقارير العملاء', icon: Users },
          { id: 'suppliers', label: 'تقارير الموردين', icon: Building2 },
          { id: 'profit', label: 'الأرباح والخسائر', icon: TrendingUp },
          { id: 'financials', label: 'القوائم المالية', icon: Scale },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-2 ${
                isActive ? 'bg-slate-900 text-white shadow' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 1. SALES REPORT TAB */}
      {activeTab === 'sales' && salesReport && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="إجمالي قيمة المبيعات"
              value={formatAmount(salesReport.summary.totalSales)}
              icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
              trendText={`عدد الفواتير: ${salesReport.summary.totalInvoices}`}
              trendUp={true}
            />
            <StatCard
              title="ضريبة المخرجات (VAT)"
              value={formatAmount(salesReport.summary.totalTax)}
              icon={<FileText className="w-5 h-5 text-blue-600" />}
              trendText="ضريبة القيمة المضافة"
              trendUp={true}
            />
            <StatCard
              title="الفواتير المدفوعة"
              value={salesReport.summary.paidInvoices.toString()}
              icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
              trendText="تحصيل فوري"
              trendUp={true}
            />
            <StatCard
              title="الفواتير الآجلة"
              value={salesReport.summary.pendingInvoices.toString()}
              icon={<AlertTriangle className="w-5 h-5 text-amber-600" />}
              trendText="مستحقات آجلة"
              trendUp={false}
            />
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h2 className="font-bold text-base text-slate-900">سجل فواتير المبيعات التفصيلي</h2>
              <div className="flex gap-2">
                <button
                  onClick={handleExportSalesExcel}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm"
                >
                  <FileSpreadsheet className="w-4 h-4" /> تصدير Excel
                </button>
                <button
                  onClick={handleExportSalesPDF}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm"
                >
                  <Printer className="w-4 h-4" /> طباعة PDF
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">رقم الفاتورة</th>
                    <th className="p-3">المستفيد/العميل</th>
                    <th className="p-3">المبلغ الصافي</th>
                    <th className="p-3">الضريبة</th>
                    <th className="p-3">الإجمالي</th>
                    <th className="p-3">الحالة</th>
                    <th className="p-3">التاريخ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {salesReport.invoicesList.map((inv: any) => (
                    <tr key={inv.id} className="hover:bg-slate-50 transition">
                      <td className="p-3 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                      <td className="p-3 font-bold text-slate-800">{inv.customerName || 'عميل نقدي'}</td>
                      <td className="p-3 font-mono text-slate-700">{formatAmount(inv.totalWithoutTax || 0)}</td>
                      <td className="p-3 font-mono text-slate-500">{formatAmount(inv.taxAmount || 0)}</td>
                      <td className="p-3 font-mono font-black text-slate-900">{formatAmount(inv.grandTotal || 0)}</td>
                      <td className="p-3">
                        <Badge variant={inv.status === 'paid' ? 'success' : 'warning'}>
                          {inv.status === 'paid' ? 'مدفوع 🟢' : 'آجل ⏳'}
                        </Badge>
                      </td>
                      <td className="p-3 text-slate-500 font-mono">{inv.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. PURCHASE REPORT TAB */}
      {activeTab === 'purchases' && purchaseReport && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard
              title="إجمالي قيمة المشتريات"
              value={formatAmount(purchaseReport.summary.totalPurchases)}
              icon={<ShoppingBag className="w-5 h-5 text-indigo-600" />}
              trendText={`عدد الأوامر: ${purchaseReport.summary.totalPOCount}`}
              trendUp={true}
            />
            <StatCard
              title="ضريبة المدخلات (Input VAT)"
              value={formatAmount(purchaseReport.summary.totalTax)}
              icon={<FileText className="w-5 h-5 text-blue-600" />}
              trendText="ضريبة المشتريات المستردة"
              trendUp={true}
            />
            <StatCard
              title="الأوامر المستلمة"
              value={purchaseReport.summary.receivedOrders.toString()}
              icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
              trendText="توريد مكتمل"
              trendUp={true}
            />
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h2 className="font-bold text-base text-slate-900">أوامر الشراء والتوريدات التفصيلية</h2>
              <div className="flex gap-2">
                <button
                  onClick={handleExportPurchasesExcel}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm"
                >
                  <FileSpreadsheet className="w-4 h-4" /> تصدير Excel
                </button>
                <button
                  onClick={handleExportPurchasesPDF}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm"
                >
                  <Printer className="w-4 h-4" /> طباعة PDF
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">رقم الأمر</th>
                    <th className="p-3">المورد</th>
                    <th className="p-3">الإجمالي</th>
                    <th className="p-3">الضريبة</th>
                    <th className="p-3">الحالة</th>
                    <th className="p-3">التاريخ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {purchaseReport.ordersList.map((po: any) => (
                    <tr key={po.id} className="hover:bg-slate-50 transition">
                      <td className="p-3 font-mono font-bold text-slate-900">{po.purchaseNumber}</td>
                      <td className="p-3 font-bold text-slate-800">{po.supplierName || '-'}</td>
                      <td className="p-3 font-mono font-black text-slate-900">{formatAmount(po.grandTotal || 0)}</td>
                      <td className="p-3 font-mono text-slate-500">{formatAmount(po.taxAmount || 0)}</td>
                      <td className="p-3">
                        <Badge variant={po.status === 'received' || po.status === 'completed' ? 'success' : 'warning'}>
                          {po.status === 'received' || po.status === 'completed' ? 'مستلم 🟢' : 'قيد الانتظار ⏳'}
                        </Badge>
                      </td>
                      <td className="p-3 text-slate-500 font-mono">{po.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. INVENTORY REPORT TAB */}
      {activeTab === 'inventory' && inventoryReport && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="تقييم المخزون بالتكلفة"
              value={formatAmount(inventoryReport.summary.totalValuationCost)}
              icon={<Package className="w-5 h-5 text-blue-600" />}
              trendText={`إجمالي الأصناف: ${inventoryReport.summary.totalItemsCount}`}
              trendUp={true}
            />
            <StatCard
              title="تقييم المخزون بالبيع"
              value={formatAmount(inventoryReport.summary.totalValuationSale)}
              icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
              trendText="القيمة السوقية التقديرية"
              trendUp={true}
            />
            <StatCard
              title="هامش الربح المتوقع"
              value={formatAmount(inventoryReport.summary.potentialProfit)}
              icon={<TrendingUp className="w-5 h-5 text-indigo-600" />}
              trendText="الأرباح الكامنة بالمخزون"
              trendUp={true}
            />
            <StatCard
              title="أصناف وصلت الحد الأدنى"
              value={inventoryReport.summary.lowStockCount.toString()}
              icon={<AlertTriangle className="w-5 h-5 text-rose-600" />}
              trendText="تتطلب إعادات طلب"
              trendUp={false}
            />
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h2 className="font-bold text-base text-slate-900">تقييم وحركة المخزون حسب التصنيف</h2>
              <div className="flex gap-2">
                <button
                  onClick={handleExportInventoryExcel}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm"
                >
                  <FileSpreadsheet className="w-4 h-4" /> تصدير Excel
                </button>
                <button
                  onClick={handleExportInventoryPDF}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm"
                >
                  <Printer className="w-4 h-4" /> طباعة PDF
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">اسم التصنيف</th>
                    <th className="p-3">عدد الأصناف</th>
                    <th className="p-3">إجمالي الكميات المتوفرة</th>
                    <th className="p-3">القيمة بالتكلفة</th>
                    <th className="p-3">القيمة بسعر البيع</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {inventoryReport.categoryBreakdown.map((cat: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50 transition">
                      <td className="p-3 font-bold text-slate-900">{cat.category}</td>
                      <td className="p-3 font-bold text-slate-700">{cat.count} صنف</td>
                      <td className="p-3 font-mono font-bold text-slate-800">{cat.stock} قطعة</td>
                      <td className="p-3 font-mono text-slate-700">{formatAmount(cat.costVal)}</td>
                      <td className="p-3 font-mono font-black text-emerald-700">{formatAmount(cat.saleVal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. CUSTOMER REPORT TAB */}
      {activeTab === 'customers' && customerReport && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h2 className="font-bold text-base text-slate-900">كشف حسابات وديون العملاء (Aging Receivables)</h2>
              <p className="text-xs text-slate-500 font-bold">إجمالي مبيعات وديون كل عميل</p>
            </div>
            <div className="font-mono font-black text-rose-700 text-sm bg-rose-50 p-2 rounded-xl border border-rose-200">
              إجمالي ديون العملاء: {formatAmount(customerReport.summary.totalDebts)}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">اسم العميل</th>
                  <th className="p-3">الشركة / الهاتف</th>
                  <th className="p-3">إجمالي الشراء</th>
                  <th className="p-3">عدد الفواتير</th>
                  <th className="p-3">المبلغ المسدد</th>
                  <th className="p-3">الديون المتبقية</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customerReport.customers.map((c: any) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-bold text-slate-900">{c.name}</td>
                    <td className="p-3 text-slate-600">{c.companyName} / {c.phone}</td>
                    <td className="p-3 font-mono text-slate-800">{formatAmount(c.totalPurchases)}</td>
                    <td className="p-3 font-bold text-slate-700">{c.invoiceCount}</td>
                    <td className="p-3 font-mono text-emerald-700">{formatAmount(c.paidAmount)}</td>
                    <td className="p-3 font-mono font-black text-rose-700">{formatAmount(c.remainingDebt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. SUPPLIER REPORT TAB */}
      {activeTab === 'suppliers' && supplierReport && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h2 className="font-bold text-base text-slate-900">كشف التزامات ومستحقات الموردين (Aging Payables)</h2>
              <p className="text-xs text-slate-500 font-bold">إجمالي المشتريات والمبالغ المتبقية لكل مورد</p>
            </div>
            <div className="font-mono font-black text-indigo-700 text-sm bg-indigo-50 p-2 rounded-xl border border-indigo-200">
              إجمالي التزامات الموردين: {formatAmount(supplierReport.summary.totalPayables)}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">اسم المورد</th>
                  <th className="p-3">الشركة / الهاتف</th>
                  <th className="p-3">إجمالي التوريدات</th>
                  <th className="p-3">عدد الأوامر</th>
                  <th className="p-3">المسدد للمورد</th>
                  <th className="p-3">المستحق للمورد</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {supplierReport.suppliers.map((s: any) => (
                  <tr key={s.id} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-bold text-slate-900">{s.name}</td>
                    <td className="p-3 text-slate-600">{s.companyName} / {s.phone}</td>
                    <td className="p-3 font-mono text-slate-800">{formatAmount(s.totalPurchases)}</td>
                    <td className="p-3 font-bold text-slate-700">{s.totalOrders}</td>
                    <td className="p-3 font-mono text-emerald-700">{formatAmount(s.paidAmount)}</td>
                    <td className="p-3 font-mono font-black text-indigo-700">{formatAmount(s.remainingPayables)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. PROFIT & LOSS TAB */}
      {activeTab === 'profit' && profitReport && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div>
            <h2 className="font-bold text-base text-slate-900">تقرير الأرباح والخسائر الشامل (Profit & Loss Statement)</h2>
            <p className="text-xs text-slate-500 font-bold">تحليل الإيرادات، تكلفة المبيعات، المصروفات التشغيلية، وصافي الربح</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex justify-between items-center">
                <span className="font-bold text-slate-700 text-xs">إجمالي الإيرادات (المبيعات):</span>
                <span className="font-mono font-black text-base text-slate-900">{formatAmount(profitReport.totalRevenue)}</span>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex justify-between items-center">
                <span className="font-bold text-slate-700 text-xs">تكلفة البضاعة المباعة (COGS):</span>
                <span className="font-mono font-bold text-base text-rose-600">- {formatAmount(profitReport.totalCOGS)}</span>
              </div>

              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex justify-between items-center">
                <span className="font-black text-emerald-900 text-xs">الربح الإجمالي (Gross Profit):</span>
                <span className="font-mono font-black text-lg text-emerald-700">{formatAmount(profitReport.grossProfit)}</span>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex justify-between items-center">
                <span className="font-bold text-slate-700 text-xs">المصروفات والنفقات التشغيلية:</span>
                <span className="font-mono font-bold text-base text-rose-600">- {formatAmount(profitReport.totalOperatingExpenses)}</span>
              </div>

              <div className="p-5 bg-slate-900 text-white rounded-2xl flex justify-between items-center shadow-lg">
                <span className="font-black text-sm">صافي الربح النهائي (Net Profit):</span>
                <span className="font-mono font-black text-xl text-emerald-400">{formatAmount(profitReport.netProfit)}</span>
              </div>
            </div>

            {/* Margin gauge */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col justify-center items-center text-center space-y-4">
              <h3 className="font-black text-slate-800 text-sm">هامش صافي الربح (Profit Margin)</h3>
              <div className="w-36 h-36 rounded-full border-8 border-emerald-500 bg-white flex flex-col items-center justify-center shadow-inner">
                <span className="font-mono font-black text-2xl text-slate-900">{profitReport.profitMarginPercentage.toFixed(1)}%</span>
                <span className="text-[10px] text-slate-400 font-bold mt-1">نسبة الربحية</span>
              </div>
              <p className="text-xs text-slate-500 max-w-xs font-bold leading-relaxed">
                تقيس هذه النسبة مدى كفاءة النشاط التجاري في تحويل المبيعات إلى أرباح صافية بعد استقطاع كافة التكاليف والمصاريف.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 7. FINANCIAL STATEMENTS TAB */}
      {activeTab === 'financials' && financialsReport && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h2 className="font-bold text-base text-slate-900">ميزان المراجعة المحاسبي (Trial Balance)</h2>
                <p className="text-xs text-slate-500 font-bold">التحقق من اتزان الأرصدة والعمليات بالحسابات العامة</p>
              </div>
              <button
                onClick={handleExportFinancialsPDF}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow"
              >
                <Printer className="w-4 h-4" /> طباعة الميزان القوائم PDF
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">رمز الحساب</th>
                    <th className="p-3">اسم الحساب</th>
                    <th className="p-3">نوع الحساب</th>
                    <th className="p-3">مدين</th>
                    <th className="p-3">دائن</th>
                    <th className="p-3">الرصيد الصافي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {financialsReport.trialBalance.accounts.map((acc: any) => (
                    <tr key={acc.id} className="hover:bg-slate-50 transition">
                      <td className="p-3 font-bold text-slate-900">{acc.code}</td>
                      <td className="p-3 font-bold font-sans text-slate-800">{acc.name}</td>
                      <td className="p-3 font-sans text-slate-500">{acc.type}</td>
                      <td className="p-3 text-slate-800">{formatAmount(acc.totalDebit)}</td>
                      <td className="p-3 text-slate-800">{formatAmount(acc.totalCredit)}</td>
                      <td className="p-3 font-black text-slate-900">{formatAmount(acc.netBalance)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-900 text-white font-mono font-black text-xs">
                  <tr>
                    <td colSpan={3} className="p-3 font-sans">الإجمالي المحاسبي:</td>
                    <td className="p-3 text-emerald-400">{formatAmount(financialsReport.trialBalance.totalDebit)}</td>
                    <td className="p-3 text-emerald-400">{formatAmount(financialsReport.trialBalance.totalCredit)}</td>
                    <td className="p-3 font-sans text-emerald-300">
                      {financialsReport.trialBalance.isBalanced ? 'متزن 🟢' : 'غير متزن 🔴'}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
