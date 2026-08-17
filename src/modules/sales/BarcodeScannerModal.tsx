import React, { useState, useEffect, useRef } from 'react';
import { Scan, Volume2, VolumeX, Settings, Zap, History, Scale, CheckCircle2, AlertTriangle, RefreshCw, X, Play, Camera } from 'lucide-react';
import { ScannerConfig, ScanLogEntry } from '../../utils/scannerUtility';
import { Product } from '../../types';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ScannerConfig;
  onUpdateConfig: (newConfig: Partial<ScannerConfig>) => void;
  scanHistory: ScanLogEntry[];
  onClearHistory: () => void;
  onScanBarcode: (barcode: string) => void;
  products: Product[];
  onOpenCameraScanner?: () => void;
}

export default function BarcodeScannerModal({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
  scanHistory,
  onClearHistory,
  onScanBarcode,
  products,
  onOpenCameraScanner
}: BarcodeScannerModalProps) {
  const [manualBarcode, setManualBarcode] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'scanner' | 'history' | 'settings'>('scanner');
  const [selectedTestProduct, setSelectedTestProduct] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && activeTab === 'scanner') {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualBarcode.trim()) return;
    onScanBarcode(manualBarcode.trim());
    setManualBarcode('');
  };

  const handleTestProductScan = () => {
    if (!selectedTestProduct) return;
    const prod = products.find(p => p.id === selectedTestProduct);
    if (prod && prod.barcode) {
      onScanBarcode(prod.barcode);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="barcode-scanner-modal-title"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-100">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/30 rounded-xl border border-blue-400/30 text-blue-400">
              <Scan className="w-6 h-6 animate-pulse" aria-hidden="true" />
            </div>
            <div>
              <h3 id="barcode-scanner-modal-title" className="font-bold text-lg flex items-center gap-2">
                وحدة أجهزة القارئ الضوئي (USB / Bluetooth)
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  متصل ومتأهب ⚡
                </span>
              </h3>
              <p className="text-xs text-slate-300">
                إدارة أجهزة الممسحة الضوئية، الموازين الإلكترونية والمسح السريع
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            aria-label="إغلاق الشاشة"
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700/50 transition-colors focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:outline-none"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-100 bg-slate-50 px-5 pt-3 gap-2" role="tablist" aria-label="تبويبات الممسحة الضوئية">
          <button
            role="tab"
            aria-selected={activeTab === 'scanner'}
            onClick={() => setActiveTab('scanner')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none ${
              activeTab === 'scanner'
                ? 'bg-white text-blue-600 border-t-2 border-blue-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
          >
            <Zap className="w-4 h-4" aria-hidden="true" />
            المسح اليدوي واللايزر
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'history'}
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none ${
              activeTab === 'history'
                ? 'bg-white text-blue-600 border-t-2 border-blue-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
          >
            <History className="w-4 h-4" aria-hidden="true" />
            سجل عمليات المسح ({scanHistory.length})
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'settings'}
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none ${
              activeTab === 'settings'
                ? 'bg-white text-blue-600 border-t-2 border-blue-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
          >
            <Settings className="w-4 h-4" aria-hidden="true" />
            إعدادات الحساسية والأصوات
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* TAB 1: SCANNER INTERFACE */}
          {activeTab === 'scanner' && (
            <div className="space-y-6">
              
              {/* Camera Scanner Launcher Banner */}
              {onOpenCameraScanner && (
                <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-4 text-white shadow-lg flex items-center justify-between gap-3 border border-blue-700/50">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-500/20 border border-blue-400/30 rounded-2xl text-blue-300">
                      <Camera className="w-7 h-7 animate-pulse" aria-hidden="true" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white flex items-center gap-2">
                        مسح الباركود عبر كاميرا الجهاز
                        <span className="text-[10px] bg-emerald-500 text-slate-950 font-bold px-2 py-0.5 rounded-full">
                          جديد 📷
                        </span>
                      </h4>
                      <p className="text-xs text-slate-300 mt-0.5">
                        استخدم كاميرا الهواتف أو الأجهزة المحمولة لقراءة الباركودات بسرعة فورية
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenCameraScanner();
                    }}
                    className="px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 shrink-0 focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:outline-none"
                  >
                    <Camera className="w-4 h-4" aria-hidden="true" />
                    تشغيل الكاميرا
                  </button>
                </div>
              )}

              {/* Ready Indicator Card */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-lg">
                    ⚡
                  </div>
                  <div>
                    <h4 className="font-bold text-emerald-900 text-sm">القارئ الآلي جاهز للاستقبال</h4>
                    <p className="text-xs text-emerald-700">
                      وجه ماسح USB أو Bluetooth نحو الباركود وقسّم السلع فوراً لإضافتها أو زيادة كميتها بالسلة تلقائياً.
                    </p>
                  </div>
                </div>
              </div>

              {/* Manual Input Form */}
              <form onSubmit={handleManualSubmit} className="space-y-2">
                <label htmlFor="manual-barcode-input" className="block text-xs font-bold text-slate-700">
                  إدخال الباركود أو الكود يدوياً (أو تجربة القارئ):
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      id="manual-barcode-input"
                      ref={inputRef}
                      data-scanner-input="true"
                      type="text"
                      value={manualBarcode}
                      onChange={(e) => setManualBarcode(e.target.value)}
                      placeholder="امسح هنا باللايزر أو أدخل رقم الباركود..."
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus-visible:outline-none transition-all"
                    />
                    <Scan className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" aria-hidden="true" />
                  </div>
                  <button
                    type="submit"
                    className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 shrink-0 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
                  >
                    إرسال وقراءة
                  </button>
                </div>
              </form>

              {/* Quick Simulation Barcode Picker */}
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <label className="block text-xs font-bold text-slate-600">
                  تجربة مسح صنف من قائمة المنتجات المسجلة:
                </label>
                <div className="flex gap-2">
                  <select
                    value={selectedTestProduct}
                    onChange={(e) => setSelectedTestProduct(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl text-xs py-2.5 px-3 focus:bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- اختر منتجاً لتجربة المسح الآلي --</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} - (باركود: {p.barcode || 'بدون'}) - المخزون: {p.stock}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleTestProductScan}
                    disabled={!selectedTestProduct}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 disabled:opacity-40 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5" />
                    محاكاة المسح
                  </button>
                </div>
              </div>

              {/* Electronic Scale Test Example */}
              <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                  <Scale className="w-4 h-4 text-amber-600" aria-hidden="true" />
                  ميزة باركود الميزان الإلكتروني (EAN-13 Scale Barcode):
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  النظام يتعرف تلقائياً على باركودات الموازين (مثال يبدأ بـ <span className="font-mono font-bold text-slate-900">{config.scalePrefix}</span> متبوعة بـ 5 أرقام لكود المنتج و 5 أرقام للوزن بالجرام) ويقوم بحساب الوزن بالكيلو وإضافته للسلة.
                </p>
              </div>

            </div>
          )}

          {/* TAB 2: SCAN HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">
                  آخر {scanHistory.length} عمليات مسح:
                </span>
                {scanHistory.length > 0 && (
                  <button
                    onClick={onClearHistory}
                    className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1"
                  >
                    مسح السجل
                  </button>
                )}
              </div>

              {scanHistory.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-500 font-medium">لم يتم مسح أي باركود حتى الآن في هذه الجلسة</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {scanHistory.map(entry => (
                    <div
                      key={entry.id}
                      className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-all ${
                        entry.status === 'success' || entry.status === 'incremented'
                          ? 'bg-emerald-50/50 border-emerald-100 text-emerald-950'
                          : 'bg-rose-50/50 border-rose-100 text-rose-950'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {entry.status === 'success' || entry.status === 'incremented' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                        )}
                        <div>
                          <p className="font-bold">{entry.message}</p>
                          <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                            الباركود: {entry.barcode} • {new Date(entry.timestamp).toLocaleTimeString('ar-SA')}
                          </p>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold ${
                        entry.status === 'success' ? 'bg-emerald-100 text-emerald-800' :
                        entry.status === 'incremented' ? 'bg-blue-100 text-blue-800' :
                        'bg-rose-100 text-rose-800'
                      }`}>
                        {entry.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-5 text-xs">
              
              {/* Auto Increment Toggle */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <h5 className="font-bold text-slate-800">زيادة الكمية تلقائياً عند تكرار المسح</h5>
                  <p className="text-[11px] text-slate-500">
                    عند مسح نفس الصنف مرتين، يتم زيادة الكمية بالفرع بدلاً من تكراره كسطر جديد.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={config.autoIncrement}
                  onChange={(e) => onUpdateConfig({ autoIncrement: e.target.checked })}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
              </div>

              {/* Sound Toggle */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-3">
                  {config.enableSound ? <Volume2 className="w-5 h-5 text-blue-600" /> : <VolumeX className="w-5 h-5 text-slate-400" />}
                  <div>
                    <h5 className="font-bold text-slate-800">تفعيل نغمة الصافرة الصوتية (Beep Feedback)</h5>
                    <p className="text-[11px] text-slate-500">
                      تشغيل صرير خفيف عند نجاح المسح وصوت تنبيه عند حدوث خطأ أو عدم العثور.
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={config.enableSound}
                  onChange={(e) => onUpdateConfig({ enableSound: e.target.checked })}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
              </div>

              {/* Scale Barcode Prefix */}
              <div className="space-y-1 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <label className="block font-bold text-slate-800">
                  بادئة باركود الميزان (Scale Barcode Prefix):
                </label>
                <p className="text-[11px] text-slate-500 mb-2">
                  البادئة الافتراضية المتعارف عليها دولياً لبادئات الموازين الإلكترونية (مثال: 20 أو 21).
                </p>
                <input
                  type="text"
                  maxLength={3}
                  value={config.scalePrefix}
                  onChange={(e) => onUpdateConfig({ scalePrefix: e.target.value.trim() })}
                  className="w-28 px-3 py-1.5 font-mono text-sm border border-slate-300 rounded-lg bg-white"
                />
              </div>

              {/* Timing Threshold */}
              <div className="space-y-1 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <label className="block font-bold text-slate-800">
                  مهلة الحساسية الملي ثانية (Timing Threshold):
                </label>
                <p className="text-[11px] text-slate-500 mb-2">
                  أقصى زمن فاصل بين المفاتيح لاكتشاف مسدس اللايزر (الافتراضي 60 ملي ثانية).
                </p>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={20}
                    max={150}
                    value={config.timingThresholdMs}
                    onChange={(e) => onUpdateConfig({ timingThresholdMs: Number(e.target.value) })}
                    className="flex-1"
                  />
                  <span className="font-mono font-bold bg-white px-2 py-1 rounded border border-slate-200">
                    {config.timingThresholdMs} ms
                  </span>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
          <span className="text-[11px] text-slate-500 font-medium">
            متوافق مع جميع أجهزة USB & Bluetooth Barcode Scanners (Honeywell, Datalogic, Zebra, Symbol).
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow transition-all focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
}
