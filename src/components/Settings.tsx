import React, { useState } from 'react';
import { StoreSettings, Unit, Category } from '../types';
import { Save, RefreshCw, Database, ShieldCheck, Check } from 'lucide-react';

interface SettingsProps {
  settings: StoreSettings;
  onUpdateSettings: (newSettings: StoreSettings) => void;
  units: Unit[];
  onAddUnit: (unit: Unit) => void;
  onDeleteUnit: (id: string) => void;
  onLoadDemoDataset: (sectorKey: string) => void;
  syncStatus: 'synced' | 'syncing' | 'offline';
  onForceSync: () => void;
  onRestoreDefaults: () => void;
}

export default function Settings({
  settings,
  onUpdateSettings,
  units,
  onAddUnit,
  onDeleteUnit,
  onLoadDemoDataset,
  syncStatus,
  onForceSync,
  onRestoreDefaults
}: SettingsProps) {
  // Store Settings fields
  const [storeName, setStoreName] = useState<string>(settings.name);
  const [storeAddress, setStoreAddress] = useState<string>(settings.address);
  const [storePhone, setStorePhone] = useState<string>(settings.phone);
  const [storeTaxNumber, setStoreTaxNumber] = useState<string>(settings.taxNumber);
  const [storeTaxRate, setStoreTaxRate] = useState<string>(settings.taxRate.toString());
  const [storeLogo, setStoreLogo] = useState<string>(settings.logo);
  const [storeCurrency, setStoreCurrency] = useState<string>(settings.currency);
  const [printerWidth, setPrinterWidth] = useState<'80mm' | '58mm'>(settings.thermalPrinterWidth);

  // New Unit field
  const [newUnitName, setNewUnitName] = useState<string>('');

  // Active Role simulator
  const [activeRole, setActiveRole] = useState<'owner' | 'manager' | 'cashier'>('owner');

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
      name: storeName,
      logo: storeLogo,
      address: storeAddress,
      phone: storePhone,
      taxNumber: storeTaxNumber,
      taxRate: parseFloat(storeTaxRate) || 15,
      currency: storeCurrency,
      thermalPrinterWidth: printerWidth
    });
    alert('تم حفظ كود إعدادات المتجر وبيانات الضرائب والطباعة الحرارية بنجاح.');
  };

  const handleAddUnitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUnitName.trim()) return;
    onAddUnit({
      id: `unit-${Date.now()}`,
      name: newUnitName
    });
    setNewUnitName('');
  };

  const triggerExportDatabase = () => {
    const data = {
      settings,
      units,
      products: localStorage.getItem('cashier_products'),
      invoices: localStorage.getItem('cashier_invoices'),
      categories: localStorage.getItem('cashier_categories'),
      customers: localStorage.getItem('cashier_customers')
    };

    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data))}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `cashier_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleDemoLoad = (sector: string) => {
    if (confirm('تنبيه: تحميل البيانات التجريبية سيقوم باستبدال المنتجات والفئات والعملاء الحاليين ببيانات القطاع المختار. هل تود الاستمرار؟')) {
      onLoadDemoDataset(sector);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Settings inputs - 8 cols */}
      <div className="lg:col-span-8 bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-6">
        <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
          <h3 className="font-extrabold text-slate-800 text-lg underline decoration-emerald-500/50 decoration-4 underline-offset-8">⚙️ إعدادات المتجر والضرائب والطباعة</h3>
          <span className="text-xs bg-slate-100 text-slate-500 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            اتصال آمن ومحمي
          </span>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">اسم المتجر / الشركة:</label>
              <input
                type="text"
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold text-slate-800"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">رمز الشعار (Emoji أو نص):</label>
              <input
                type="text"
                value={storeLogo}
                onChange={(e) => setStoreLogo(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs focus:outline-none text-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">رقم الهاتف والجوال:</label>
              <input
                type="text"
                required
                value={storePhone}
                onChange={(e) => setStorePhone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs focus:outline-none font-mono text-left"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">الرقم الضريبي للمنشأة (15 خانة للهيئة):</label>
              <input
                type="text"
                required
                value={storeTaxNumber}
                onChange={(e) => setStoreTaxNumber(e.target.value)}
                placeholder="3000XXXXXXXXXX3"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs focus:outline-none font-mono text-left"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">العنوان الجغرافي للفروع:</label>
              <input
                type="text"
                required
                value={storeAddress}
                onChange={(e) => setStoreAddress(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs focus:outline-none font-bold text-slate-800"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">العملة:</label>
                <input
                  type="text"
                  required
                  value={storeCurrency}
                  onChange={(e) => setStoreCurrency(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs focus:outline-none font-bold text-slate-800 text-center"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">نسبة ضريبة القيمة المضافة:</label>
                <select
                  value={storeTaxRate}
                  onChange={(e) => setStoreTaxRate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs focus:outline-none font-bold text-slate-800 text-center"
                >
                  <option value="15">15% (الأساسية KSA)</option>
                  <option value="5">5% (المخفضة)</option>
                  <option value="0">0% (معفاة ضريبياً)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">عرض بكرة الطابعة الحرارية الافتراضية:</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPrinterWidth('80mm')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition ${
                    printerWidth === '80mm' ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-sm' : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  80mm (كبير احترافي)
                </button>
                <button
                  type="button"
                  onClick={() => setPrinterWidth('58mm')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition ${
                    printerWidth === '58mm' ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-sm' : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  58mm (صغير محمول)
                </button>
              </div>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow"
              >
                <Save className="w-4 h-4 text-white" />
                <span>حفظ البيانات الأساسية</span>
              </button>
            </div>
          </div>
        </form>

        {/* Units Configuration form */}
        <div className="border-t border-slate-100 pt-5 space-y-4">
          <h4 className="font-extrabold text-slate-800 text-sm">📐 وحدات قياس المنتجات المتاحة</h4>
          <div className="flex flex-wrap gap-2">
            {units.map(u => (
              <span key={u.id} className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition">
                <span>{u.name}</span>
                <button
                  onClick={() => onDeleteUnit(u.id)}
                  className="text-slate-400 hover:text-rose-600 text-xs font-semibold ml-1"
                  title="حذف الوحدة"
                >
                  ×
                </button>
              </span>
            ))}
          </div>

          <form onSubmit={handleAddUnitSubmit} className="flex gap-2 max-w-sm">
            <input
              type="text"
              required
              placeholder="إضافة وحدة جديدة (مثال: متر، طن)"
              value={newUnitName}
              onChange={(e) => setNewUnitName(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold"
            />
            <button
              type="submit"
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition"
            >
              إضافة وحدة
            </button>
          </form>
        </div>
      </div>

      {/* Right Column Database actions, backups, and user role simulation - 4 cols */}
      <div className="lg:col-span-4 space-y-6">
        {/* User profile / simulation roles card */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4">
          <h3 className="font-extrabold text-slate-800 text-base">👤 محاكاة المستخدم الحالي والصلاحيات</h3>
          <p className="text-xs text-slate-400">تغيير دور المستخدم لمحاكاة القيود والصلاحيات على النظام</p>

          <div className="space-y-2">
            <button
              onClick={() => setActiveRole('owner')}
              className={`w-full p-3 rounded-xl border text-right flex items-center justify-between transition ${
                activeRole === 'owner' ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold shadow-sm' : 'border-slate-100 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="space-y-0.5">
                <span className="text-xs">المشرف العام / المالك (Owner)</span>
                <p className="text-[10px] text-slate-400">صلاحيات كاملة للمخازن والتقارير والضرائب والطباعة</p>
              </div>
              {activeRole === 'owner' && <Check className="w-4 h-4 text-emerald-600" />}
            </button>

            <button
              onClick={() => {
                setActiveRole('manager');
                alert('محاكاة: تم تغيير صلاحيات الحساب إلى "مدير فرع". سيتاح الوصول لكل شيء عدا تعديل الإعدادات الحساسة للضرائب.');
              }}
              className={`w-full p-3 rounded-xl border text-right flex items-center justify-between transition ${
                activeRole === 'manager' ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold shadow-sm' : 'border-slate-100 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="space-y-0.5">
                <span className="text-xs">مدير فرع / محاسب (Manager)</span>
                <p className="text-[10px] text-slate-400">الوصول للمخزن والتقارير المالية دون تعديل الثوابت</p>
              </div>
              {activeRole === 'manager' && <Check className="w-4 h-4 text-emerald-600" />}
            </button>

            <button
              onClick={() => {
                setActiveRole('cashier');
                alert('محاكاة: تم قفل الحساب على "صلاحية كاشير". سيتاح فقط استخدام نقطة البيع POS والطباعة دون حق تعديل المخزون أو مراجعة الأرباح الإجمالية.');
              }}
              className={`w-full p-3 rounded-xl border text-right flex items-center justify-between transition ${
                activeRole === 'cashier' ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold shadow-sm' : 'border-slate-100 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="space-y-0.5">
                <span className="text-xs">كاشير المبيعات (Cashier)</span>
                <p className="text-[10px] text-slate-400">نقطة البيع POS وطباعة الفواتير فقط لتأمين المبيعات</p>
              </div>
              {activeRole === 'cashier' && <Check className="w-4 h-4 text-emerald-600" />}
            </button>
          </div>
        </div>

        {/* Sector Database Loader */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4">
          <h3 className="font-extrabold text-slate-800 text-base">💾 تهيئة البيانات وتحميل كتل الأنشطة</h3>
          <p className="text-xs text-slate-400">تحميل بيانات تجريبية فورية مخصصة للنشاط التجاري المناسب</p>

          <div className="space-y-2">
            <button
              onClick={() => handleDemoLoad('supermarket')}
              className="w-full p-3 bg-slate-50 hover:bg-emerald-50 border border-slate-100 hover:border-emerald-200 rounded-xl text-right flex justify-between items-center transition"
            >
              <span className="text-xs font-bold text-slate-700">🛒 سوبرماركت ومواد غذائية</span>
              <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded font-extrabold">EAN-13 باركود</span>
            </button>

            <button
              onClick={() => handleDemoLoad('pharmacy')}
              className="w-full p-3 bg-slate-50 hover:bg-emerald-50 border border-slate-100 hover:border-emerald-200 rounded-xl text-right flex justify-between items-center transition"
            >
              <span className="text-xs font-bold text-slate-700">💊 صيدلية وعناية طبية</span>
              <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded font-extrabold">باركود عالمي</span>
            </button>

            <button
              onClick={() => handleDemoLoad('cafe')}
              className="w-full p-3 bg-slate-50 hover:bg-emerald-50 border border-slate-100 hover:border-emerald-200 rounded-xl text-right flex justify-between items-center transition"
            >
              <span className="text-xs font-bold text-slate-700">☕ مقهى وكافيه ومشروبات</span>
              <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded font-extrabold">أكواد قصيرة</span>
            </button>

            <button
              onClick={() => handleDemoLoad('gold')}
              className="w-full p-3 bg-slate-50 hover:bg-emerald-50 border border-slate-100 hover:border-emerald-200 rounded-xl text-right flex justify-between items-center transition"
            >
              <span className="text-xs font-bold text-slate-700">💍 مجوهرات ومحلات الذهب</span>
              <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded font-extrabold">جرام وعيار</span>
            </button>
          </div>
        </div>

        {/* Backup and restore */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4">
          <h3 className="font-extrabold text-slate-800 text-base">💾 أمان قاعدة البيانات والنسخ الاحتياطي</h3>
          <p className="text-xs text-slate-400">حفظ وحماية السجلات من الضياع والتلف للنسخ الاحتياطي</p>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={triggerExportDatabase}
              className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-extrabold rounded-xl transition flex flex-col items-center justify-center gap-1.5"
            >
              <Database className="w-4 h-4 text-slate-600" />
              <span>نسخ احتياطي JSON</span>
            </button>

            <button
              onClick={() => {
                if (confirm('هل تود بالتأكيد إعادة تصفير قاعدة البيانات واستعادة قيم المصنع الأصلية؟')) {
                  onRestoreDefaults();
                }
              }}
              className="py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-100 text-xs font-extrabold rounded-xl transition flex flex-col items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-4 h-4 text-rose-600" />
              <span>استعادة ضبط المصنع</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
