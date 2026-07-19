import React, { useState, useEffect } from 'react';
import { Product, Category, Customer, Unit, StoreSettings, Invoice } from './types';
import { INITIAL_SETTINGS, INITIAL_UNITS, DEMO_DATASETS, GENERATE_INITIAL_INVOICES } from './data';
import Dashboard from './components/Dashboard';
import POS from './components/POS';
import Inventory from './components/Inventory';
import Invoices from './components/Invoices';
import Reports from './components/Reports';
import Settings from './components/Settings';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Warehouse, 
  Receipt, 
  BarChart3, 
  Settings2, 
  RefreshCw, 
  DollarSign,
  Briefcase,
  Bell,
  AlertTriangle
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline'>('synced');
  const [showNotifications, setShowNotifications] = useState<boolean>(false);

  // Core State
  const [settings, setSettings] = useState<StoreSettings>(INITIAL_SETTINGS);
  const [units, setUnits] = useState<Unit[]>(INITIAL_UNITS);
  const [categories, setCategories] = useState<Category[]>(DEMO_DATASETS.supermarket.categories);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  // Load Initial State from LocalStorage or Fallbacks
  useEffect(() => {
    // Settings
    const storedSettings = localStorage.getItem('cashier_settings');
    if (storedSettings) {
      try { setSettings(JSON.parse(storedSettings)); } catch(e) { console.error(e); }
    } else {
      localStorage.setItem('cashier_settings', JSON.stringify(INITIAL_SETTINGS));
    }

    // Units
    const storedUnits = localStorage.getItem('cashier_units');
    if (storedUnits) {
      try { setUnits(JSON.parse(storedUnits)); } catch(e) { console.error(e); }
    } else {
      localStorage.setItem('cashier_units', JSON.stringify(INITIAL_UNITS));
    }

    // Categories
    const storedCategories = localStorage.getItem('cashier_categories');
    let loadedCategories: Category[] = DEMO_DATASETS.supermarket.categories;
    if (storedCategories) {
      try { 
        loadedCategories = JSON.parse(storedCategories);
        setCategories(loadedCategories); 
      } catch(e) { console.error(e); }
    } else {
      localStorage.setItem('cashier_categories', JSON.stringify(DEMO_DATASETS.supermarket.categories));
    }

    // Products
    const storedProducts = localStorage.getItem('cashier_products');
    let loadedProducts: Product[] = DEMO_DATASETS.supermarket.products;
    if (storedProducts) {
      try { 
        loadedProducts = JSON.parse(storedProducts);
        setProducts(loadedProducts); 
      } catch(e) { console.error(e); }
    } else {
      setProducts(DEMO_DATASETS.supermarket.products);
      localStorage.setItem('cashier_products', JSON.stringify(DEMO_DATASETS.supermarket.products));
    }

    // Customers
    const storedCustomers = localStorage.getItem('cashier_customers');
    if (storedCustomers) {
      try { setCustomers(JSON.parse(storedCustomers)); } catch(e) { console.error(e); }
    } else {
      setCustomers(DEMO_DATASETS.supermarket.customers);
      localStorage.setItem('cashier_customers', JSON.stringify(DEMO_DATASETS.supermarket.customers));
    }

    // Invoices
    const storedInvoices = localStorage.getItem('cashier_invoices');
    if (storedInvoices) {
      try { setInvoices(JSON.parse(storedInvoices)); } catch(e) { console.error(e); }
    } else {
      // Seed 12 gorgeous invoices to make reports and charts pop!
      const initialInvs = GENERATE_INITIAL_INVOICES(loadedProducts);
      setInvoices(initialInvs);
      localStorage.setItem('cashier_invoices', JSON.stringify(initialInvs));
    }
  }, []);

  // Sync helpers
  const handleForceSync = () => {
    setSyncStatus('syncing');
    setTimeout(() => {
      setSyncStatus('synced');
    }, 1200);
  };

  const handleUpdateSettings = (newSettings: StoreSettings) => {
    setSettings(newSettings);
    localStorage.setItem('cashier_settings', JSON.stringify(newSettings));
  };

  const handleAddUnit = (u: Unit) => {
    setUnits(prev => {
      const next = [...prev, u];
      localStorage.setItem('cashier_units', JSON.stringify(next));
      return next;
    });
  };

  const handleDeleteUnit = (id: string) => {
    setUnits(prev => {
      const next = prev.filter(u => u.id !== id);
      localStorage.setItem('cashier_units', JSON.stringify(next));
      return next;
    });
  };

  const handleAddProduct = (p: Product) => {
    setProducts(prev => {
      const next = [p, ...prev];
      localStorage.setItem('cashier_products', JSON.stringify(next));
      return next;
    });
  };

  const handleUpdateProduct = (p: Product) => {
    setProducts(prev => {
      const next = prev.map(item => item.id === p.id ? p : item);
      localStorage.setItem('cashier_products', JSON.stringify(next));
      return next;
    });
  };

  const handleUpdateProductStock = (id: string, newStock: number) => {
    setProducts(prev => {
      const next = prev.map(item => item.id === id ? { ...item, stock: newStock } : item);
      localStorage.setItem('cashier_products', JSON.stringify(next));
      return next;
    });
  };

  const handleDeleteProduct = (id: string) => {
    setProducts(prev => {
      const next = prev.filter(item => item.id !== id);
      localStorage.setItem('cashier_products', JSON.stringify(next));
      return next;
    });
  };

  const handleAddCategory = (c: Category) => {
    setCategories(prev => {
      const next = [...prev, c];
      localStorage.setItem('cashier_categories', JSON.stringify(next));
      return next;
    });
  };

  const handleDeleteCategory = (id: string) => {
    setCategories(prev => {
      const next = prev.filter(item => item.id !== id);
      localStorage.setItem('cashier_categories', JSON.stringify(next));
      return next;
    });
  };

  const handleAddCustomer = (c: Customer) => {
    setCustomers(prev => {
      const next = [c, ...prev];
      localStorage.setItem('cashier_customers', JSON.stringify(next));
      return next;
    });
  };

  const handleAddInvoice = (inv: Invoice) => {
    setInvoices(prev => {
      const next = [inv, ...prev];
      localStorage.setItem('cashier_invoices', JSON.stringify(next));
      return next;
    });

    // If it is credit (آجل), update customer balance
    if (inv.paymentMethod === 'credit' && inv.customerId) {
      setCustomers(prevCust => {
        const nextCust = prevCust.map(c => 
          c.id === inv.customerId ? { ...c, balance: c.balance + inv.grandTotal } : c
        );
        localStorage.setItem('cashier_customers', JSON.stringify(nextCust));
        return nextCust;
      });
    }
  };

  // Sector Loader
  const handleLoadDemoDataset = (sectorKey: string) => {
    const dataset = DEMO_DATASETS[sectorKey];
    if (dataset) {
      setCategories(dataset.categories);
      setProducts(dataset.products);
      setCustomers(dataset.customers);

      // Save to localStorage
      localStorage.setItem('cashier_categories', JSON.stringify(dataset.categories));
      localStorage.setItem('cashier_products', JSON.stringify(dataset.products));
      localStorage.setItem('cashier_customers', JSON.stringify(dataset.customers));

      // Re-seed invoices appropriate for new products
      const newInvs = GENERATE_INITIAL_INVOICES(dataset.products);
      setInvoices(newInvs);
      localStorage.setItem('cashier_invoices', JSON.stringify(newInvs));

      // Update store name appropriately
      let sectorName = "";
      let sectorAddress = "";
      if (sectorKey === 'supermarket') {
        sectorName = "سوبرماركت الخيرات";
        sectorAddress = "الرياض، السليمانية";
      } else if (sectorKey === 'pharmacy') {
        sectorName = "صيدلية الترياق الطبية";
        sectorAddress = "جدة، شارع فلسطين";
      } else if (sectorKey === 'cafe') {
        sectorName = "مقهى ومحمصة مزاج القهوة";
        sectorAddress = "الدمام، الكورنيش";
      } else if (sectorKey === 'gold') {
        sectorName = "مجوهرات وبريق الذهب";
        sectorAddress = "الرياض، سوق طيبة للذهب";
      }

      const updatedSettings = {
        ...settings,
        name: sectorName,
        address: sectorAddress
      };
      setSettings(updatedSettings);
      localStorage.setItem('cashier_settings', JSON.stringify(updatedSettings));

      setActiveTab('dashboard');
    }
  };

  const handleRestoreDefaults = () => {
    localStorage.removeItem('cashier_settings');
    localStorage.removeItem('cashier_units');
    localStorage.removeItem('cashier_categories');
    localStorage.removeItem('cashier_products');
    localStorage.removeItem('cashier_customers');
    localStorage.removeItem('cashier_invoices');
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased">
      {/* Upper Navigation Header bar */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 shadow-sm text-slate-800">
        <div className="flex items-center gap-3">
          <span className="text-2xl w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200 shadow-sm">{settings.logo}</span>
          <div>
            <h1 className="font-extrabold text-sm sm:text-base text-slate-800 leading-tight">{settings.name}</h1>
            <span className="text-[10px] text-slate-500 font-bold block">نظام الكاشير والمحاسبة الذكي (VAT 15%)</span>
          </div>
        </div>

        {/* Sync / State indications */}
        <div className="flex items-center gap-4">
          {/* Real-time alert bell */}
          {(() => {
            const lowStockProducts = products.filter(p => p.stock <= p.minStock && p.minStock > 0);
            return (
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className={`p-2 rounded-full border transition relative flex items-center justify-center ${
                    lowStockProducts.length > 0 
                      ? 'bg-rose-50 border-rose-200 hover:bg-rose-100 text-rose-600 shadow-sm shadow-red-50' 
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-500'
                  }`}
                  title="تنبيهات المخزون الذكية"
                >
                  <Bell className={`w-4 h-4 ${lowStockProducts.length > 0 ? 'animate-bounce' : ''}`} />
                  {lowStockProducts.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white font-extrabold text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                      {lowStockProducts.length}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown Panel */}
                {showNotifications && (
                  <div className="absolute left-0 mt-2.5 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 text-right overflow-hidden">
                    <div className="p-3 bg-slate-900 text-white flex justify-between items-center text-xs">
                      <span className="font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                        تنبيهات إعادة الطلب ({lowStockProducts.length})
                      </span>
                      <button 
                        onClick={() => setShowNotifications(false)}
                        className="text-slate-400 hover:text-white font-bold"
                      >
                        إغلاق
                      </button>
                    </div>

                    <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                      {lowStockProducts.length === 0 ? (
                        <div className="p-6 text-center text-slate-400 text-xs">
                          ✓ جميع مستويات المخزون آمنة وتحت السيطرة.
                        </div>
                      ) : (
                        lowStockProducts.map(p => (
                          <div 
                            key={p.id} 
                            onClick={() => {
                              setActiveTab('dashboard');
                              setShowNotifications(false);
                            }}
                            className="p-3 hover:bg-slate-50 transition cursor-pointer flex justify-between items-center gap-2"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-bold text-slate-800 truncate">{p.name}</div>
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                كمية المخزون: {p.stock} {p.unit} (الحد: {p.minStock})
                              </div>
                            </div>
                            <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded text-[9px] font-bold">
                              منخفض
                            </span>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
                      <button 
                        onClick={() => {
                          setActiveTab('dashboard');
                          setShowNotifications(false);
                        }}
                        className="text-[11px] text-slate-700 font-bold hover:text-emerald-600 transition"
                      >
                        عرض تفاصيل وإمداد المخزون ⚙️
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          <div className="hidden md:flex flex-col text-left items-end">
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">حالة الاتصال</span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-700">سيرفر محلي: متصل</span>
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
            </div>
          </div>
          <div className="h-8 w-[1px] bg-slate-200 mx-1 hidden md:block"></div>
          
          <button 
            onClick={handleForceSync}
            className="text-xs font-bold px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-full transition text-white flex items-center gap-1.5 shadow-md shadow-emerald-100 border border-emerald-500/20"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
            <span>{syncStatus === 'syncing' ? 'جاري المزامنة...' : 'مزامنة السحابة'}</span>
          </button>
        </div>
      </header>

      {/* Main Content Layout with sidebar */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Sidebar Navigation Panel */}
        <aside className="w-full md:w-64 bg-[#1e293b] text-white flex flex-col border-l border-slate-700 shadow-xl md:min-h-[calc(100vh-64px)]">
          {/* Quick Stats sidebar header */}
          <div className="p-5 flex flex-col items-center border-b border-slate-700 mb-4 bg-slate-900/20 text-center">
            <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center mb-2.5 text-2xl font-bold shadow-lg shadow-emerald-500/20 text-white">
              {settings.logo || '⚖️'}
            </div>
            <h1 className="text-sm font-extrabold text-white tracking-tight leading-tight">{settings.name}</h1>
            <span className="text-[10px] text-emerald-400 mt-1 uppercase font-bold tracking-wider opacity-90">الوردية الحالية: نشطة 🟢</span>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-3 space-y-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full py-3 px-4 rounded-l-md text-xs sm:text-sm font-bold flex items-center gap-3 transition-all ${
                activeTab === 'dashboard' 
                  ? 'bg-emerald-600/20 text-emerald-400 border-r-4 border-emerald-500' 
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>لوحة التحكم الرئيسية</span>
            </button>

            <button
              onClick={() => setActiveTab('pos')}
              className={`w-full py-3 px-4 rounded-l-md text-xs sm:text-sm font-bold flex items-center gap-3 transition-all ${
                activeTab === 'pos' 
                  ? 'bg-emerald-600/20 text-emerald-400 border-r-4 border-emerald-500' 
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>نقطة البيع الكاشير (POS)</span>
            </button>

            <button
              onClick={() => setActiveTab('inventory')}
              className={`w-full py-3 px-4 rounded-l-md text-xs sm:text-sm font-bold flex items-center gap-3 transition-all ${
                activeTab === 'inventory' 
                  ? 'bg-emerald-600/20 text-emerald-400 border-r-4 border-emerald-500' 
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <Warehouse className="w-4 h-4" />
              <span>إدارة المنتجات والمخزن</span>
            </button>

            <button
              onClick={() => setActiveTab('invoices')}
              className={`w-full py-3 px-4 rounded-l-md text-xs sm:text-sm font-bold flex items-center gap-3 transition-all ${
                activeTab === 'invoices' 
                  ? 'bg-emerald-600/20 text-emerald-400 border-r-4 border-emerald-500' 
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>سجل الفواتير والضرائب</span>
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              className={`w-full py-3 px-4 rounded-l-md text-xs sm:text-sm font-bold flex items-center gap-3 transition-all ${
                activeTab === 'reports' 
                  ? 'bg-emerald-600/20 text-emerald-400 border-r-4 border-emerald-500' 
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>التقارير المالية والأرباح</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full py-3 px-4 rounded-l-md text-xs sm:text-sm font-bold flex items-center gap-3 transition-all ${
                activeTab === 'settings' 
                  ? 'bg-emerald-600/20 text-emerald-400 border-r-4 border-emerald-500' 
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <Settings2 className="w-4 h-4" />
              <span>إعدادات النظام والضريبة</span>
            </button>
          </nav>

          {/* Sidebar Footer with user & database info */}
          <div className="p-4 border-t border-slate-700 bg-slate-900/40 text-slate-300 text-[11px] mt-auto hidden md:block">
            <div className="flex items-center gap-2.5 mb-2 px-1">
              <div className="w-8 h-8 rounded-full bg-slate-600 border border-slate-500 flex items-center justify-center text-xs font-bold text-white">ك</div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-slate-100">أحمد الكاشير</span>
                <span className="text-[10px] text-slate-400">كود الموظف: 004</span>
              </div>
            </div>
            <div className="h-[1px] bg-slate-700/60 my-2"></div>
            <div className="flex items-center gap-1.5 font-bold text-slate-300">
              <Briefcase className="w-3.5 h-3.5 text-emerald-500" />
              <span>قاعدة بيانات محلية مشفرة</span>
            </div>
          </div>
        </aside>

        {/* Main interactive viewport container */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <Dashboard
              invoices={invoices}
              products={products}
              settings={settings}
              onNavigate={setActiveTab}
              syncStatus={syncStatus}
              onForceSync={handleForceSync}
              onUpdateProductStock={handleUpdateProductStock}
            />
          )}

          {activeTab === 'pos' && (
            <POS
              products={products}
              categories={categories}
              customers={customers}
              settings={settings}
              onAddInvoice={handleAddInvoice}
              onUpdateProductStock={handleUpdateProductStock}
              onAddCustomer={handleAddCustomer}
            />
          )}

          {activeTab === 'inventory' && (
            <Inventory
              products={products}
              categories={categories}
              units={units}
              settings={settings}
              onAddProduct={handleAddProduct}
              onUpdateProduct={handleUpdateProduct}
              onDeleteProduct={handleDeleteProduct}
              onAddCategory={handleAddCategory}
              onDeleteCategory={handleDeleteCategory}
            />
          )}

          {activeTab === 'invoices' && (
            <Invoices
              invoices={invoices}
              settings={settings}
            />
          )}

          {activeTab === 'reports' && (
            <Reports
              invoices={invoices}
              products={products}
              categories={categories}
              settings={settings}
            />
          )}

          {activeTab === 'settings' && (
            <Settings
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              units={units}
              onAddUnit={handleAddUnit}
              onDeleteUnit={handleDeleteUnit}
              onLoadDemoDataset={handleLoadDemoDataset}
              syncStatus={syncStatus}
              onForceSync={handleForceSync}
              onRestoreDefaults={handleRestoreDefaults}
            />
          )}
        </main>
      </div>
    </div>
  );
}
