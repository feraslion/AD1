import React, { useState, useEffect, useRef } from 'react';
import { 
  Printer, X, Check, Settings2, Barcode, Eye, RefreshCw, 
  Tag, Calendar, Building, DollarSign, Layers, Plus, Minus, LayoutGrid, FileText
} from 'lucide-react';
import JsBarcode from 'jsbarcode';
import { Product, StoreSettings } from '../types';

interface BarcodeLabelModalProps {
  product: Product;
  allProducts?: Product[];
  settings: StoreSettings;
  onClose: () => void;
}

// Label dimensions definition type
interface LabelPreset {
  id: string;
  name: string;
  widthMm: number;
  heightMm: number;
  isA4?: boolean;
  cols?: number;
  rows?: number;
}

const LABEL_PRESETS: LabelPreset[] = [
  { id: '50x25', name: '50 × 25 مم (حراري قياسي - الشائع)', widthMm: 50, heightMm: 25 },
  { id: '40x30', name: '40 × 30 مم (مربع متوسط)', widthMm: 40, heightMm: 30 },
  { id: '38x25', name: '38 × 25 مم (مدمج / مجوهرات)', widthMm: 38, heightMm: 25 },
  { id: '50x30', name: '50 × 30 مم (حراري واسع)', widthMm: 50, heightMm: 30 },
  { id: '60x40', name: '60 × 40 مم (كبير للمستودعات والرفوف)', widthMm: 60, heightMm: 40 },
  { id: '70x50', name: '70 × 50 مم (عملاق للمغلفات)', widthMm: 70, heightMm: 50 },
  { id: 'a4_24', name: 'صفحة A4 (24 ملصق - 3x8)', widthMm: 70, heightMm: 37, isA4: true, cols: 3, rows: 8 },
  { id: 'a4_40', name: 'صفحة A4 (40 ملصق - 4x10)', widthMm: 52.5, heightMm: 29.7, isA4: true, cols: 4, rows: 10 },
  { id: 'custom', name: 'مقاس مخصص (حدد العرض والارتفاع)', widthMm: 50, heightMm: 25 },
];

// Helper component to render dynamic SVG Barcode via JsBarcode
const BarcodeSvgRenderer = ({
  value,
  format = 'CODE128',
  width = 1.5,
  height = 32,
  displayValue = true,
  fontSize = 11,
  className = ''
}: {
  value: string;
  format?: string;
  width?: number;
  height?: number;
  displayValue?: boolean;
  fontSize?: number;
  className?: string;
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (svgRef.current && value) {
      try {
        // Clear previous SVG contents
        svgRef.current.innerHTML = '';
        JsBarcode(svgRef.current, value, {
          format: format || 'CODE128',
          width: width || 1.5,
          height: height || 32,
          displayValue: displayValue,
          fontSize: fontSize || 11,
          font: 'monospace',
          margin: 1,
          background: '#ffffff',
          lineColor: '#000000',
        });
      } catch (err) {
        console.warn('JsBarcode render error:', err);
      }
    }
  }, [value, format, width, height, displayValue, fontSize]);

  return <svg ref={svgRef} className={`mx-auto max-w-full ${className}`} />;
};

export default function BarcodeLabelModal({
  product,
  allProducts = [],
  settings,
  onClose
}: BarcodeLabelModalProps) {
  // Selected product state
  const [selectedProduct, setSelectedProduct] = useState<Product>(product);
  const [selectedBarcodeString, setSelectedBarcodeString] = useState<string>(product.barcode);

  // Print Configuration
  const [printCount, setPrintCount] = useState<number>(Math.max(1, Math.min(product.stock || 1, 50)));
  const [selectedPresetId, setSelectedPresetId] = useState<string>('50x25');
  const [customWidthMm, setCustomWidthMm] = useState<number>(50);
  const [customHeightMm, setCustomHeightMm] = useState<number>(25);

  // Barcode format
  const [barcodeFormat, setBarcodeFormat] = useState<string>('CODE128');

  // Display toggles
  const [showStoreName, setShowStoreName] = useState<boolean>(true);
  const [showProductName, setShowProductName] = useState<boolean>(true);
  const [showPrice, setShowPrice] = useState<boolean>(true);
  const [showBarcodeText, setShowBarcodeText] = useState<boolean>(true);
  const [showExpiryAndBatch, setShowExpiryAndBatch] = useState<boolean>(true);
  const [customNote, setCustomNote] = useState<string>('');

  // Barcode dimensions tweaks
  const [barcodeHeightPx, setBarcodeHeightPx] = useState<number>(32);
  const [barcodeLineWidth, setBarcodeLineWidth] = useState<number>(1.5);
  const [fontSizePx, setFontSizePx] = useState<number>(11);

  // Sync selected product barcode
  useEffect(() => {
    setSelectedBarcodeString(selectedProduct.barcode);
  }, [selectedProduct]);

  // Find active preset specs
  const activePreset = LABEL_PRESETS.find(p => p.id === selectedPresetId) || LABEL_PRESETS[0];
  const activeWidthMm = selectedPresetId === 'custom' ? customWidthMm : activePreset.widthMm;
  const activeHeightMm = selectedPresetId === 'custom' ? customHeightMm : activePreset.heightMm;

  // Print handler
  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="barcode-modal-title"
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
    >
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-slate-800/95 p-4 px-6 border-b border-slate-700/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <Printer className="w-6 h-6" aria-hidden="true" />
            </div>
            <div>
              <h2 id="barcode-modal-title" className="font-black text-white text-base sm:text-lg flex items-center gap-2">
                <span>مصمم وطابعة ملصقات الباركود الذكية</span>
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-xs font-bold rounded-lg border border-amber-500/30">
                  JsBarcode Engine
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                طباعة ملصقات الباركود بدقة عالية للطابعات الحرارية ورول الملصقات وطابعات A4
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            aria-label="إغلاق"
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT/TOP SETTINGS PANEL (7 Cols on LG) */}
          <div className="lg:col-span-7 space-y-5">
            
            {/* Product & Barcode Selection */}
            <div className="bg-slate-800/70 p-4 rounded-xl border border-slate-700/70 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-amber-400 flex items-center gap-1.5">
                  <Tag className="w-4 h-4" />
                  <span>المنتج والباركود المحدد للطباعة</span>
                </span>

                {allProducts.length > 0 && (
                  <select
                    value={selectedProduct.id}
                    onChange={(e) => {
                      const p = allProducts.find(item => item.id === e.target.value);
                      if (p) setSelectedProduct(p);
                    }}
                    className="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 font-bold"
                  >
                    {allProducts.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.barcode})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">اسم المنتج:</label>
                  <input
                    type="text"
                    value={selectedProduct.name}
                    readOnly
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">الباركود النشط:</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={selectedBarcodeString}
                      onChange={(e) => setSelectedBarcodeString(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-amber-300 font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Secondary barcodes dropdown if exists */}
              {selectedProduct.barcodes && selectedProduct.barcodes.length > 0 && (
                <div className="pt-2 border-t border-slate-700/60 flex items-center gap-2 text-xs">
                  <span className="text-slate-400 font-bold shrink-0">باركود فرعي:</span>
                  <select
                    value={selectedBarcodeString}
                    onChange={(e) => setSelectedBarcodeString(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-amber-300 font-mono text-xs"
                  >
                    <option value={selectedProduct.barcode}>الباركود الرئيسي: {selectedProduct.barcode}</option>
                    {selectedProduct.barcodes.map(b => (
                      <option key={b.id} value={b.barcode}>
                        {b.label || 'فرعي'}: {b.barcode} ({b.type || 'عادي'})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Label Paper Preset & Dimensions */}
            <div className="bg-slate-800/70 p-4 rounded-xl border border-slate-700/70 space-y-3">
              <span className="text-xs font-extrabold text-blue-400 flex items-center gap-1.5">
                <Settings2 className="w-4 h-4" />
                <span>نوع ورقة الطابعة ومقاس الملصق (Label Size)</span>
              </span>

              <div className="space-y-2 text-xs">
                <label className="block font-bold text-slate-300">مقاس الملصق المحدد:</label>
                <select
                  value={selectedPresetId}
                  onChange={(e) => setSelectedPresetId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold text-xs"
                >
                  {LABEL_PRESETS.map(preset => (
                    <option key={preset.id} value={preset.id}>
                      {preset.name}
                    </option>
                  ))}
                </select>

                {/* Custom dimensions if custom selected */}
                {selectedPresetId === 'custom' && (
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-slate-400 font-bold mb-1">العرض (مم):</label>
                      <input
                        type="number"
                        min="10"
                        max="200"
                        value={customWidthMm}
                        onChange={(e) => setCustomWidthMm(Number(e.target.value) || 50)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-bold mb-1">الارتفاع (مم):</label>
                      <input
                        type="number"
                        min="10"
                        max="200"
                        value={customHeightMm}
                        onChange={(e) => setCustomHeightMm(Number(e.target.value) || 25)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quantity & Barcode Format */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Quantity */}
              <div className="bg-slate-800/70 p-4 rounded-xl border border-slate-700/70 space-y-2">
                <label className="block text-xs font-bold text-emerald-400 flex items-center justify-between">
                  <span>عدد النسخ المطلوبة:</span>
                  <span className="text-[10px] text-slate-400 font-normal">المتوفر: {selectedProduct.stock}</span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPrintCount(prev => Math.max(1, prev - 1))}
                    aria-label="إنقاص عدد النسخ"
                    className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                  >
                    <Minus className="w-4 h-4" aria-hidden="true" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={printCount}
                    onChange={(e) => setPrintCount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="flex-1 text-center py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono font-black text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setPrintCount(prev => prev + 1)}
                    aria-label="زيادة عدد النسخ"
                    className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                  >
                    <Plus className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>

                <div className="flex gap-1.5 pt-1">
                  {[1, 5, 10, 25, selectedProduct.stock || 50].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setPrintCount(num || 1)}
                      className="flex-1 py-1 bg-slate-900 hover:bg-slate-700 border border-slate-700 text-[10px] text-slate-300 rounded-lg transition font-mono font-bold"
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Barcode Encoding Format */}
              <div className="bg-slate-800/70 p-4 rounded-xl border border-slate-700/70 space-y-2">
                <label className="block text-xs font-bold text-cyan-400">ترميز الباركود (Format):</label>
                <select
                  value={barcodeFormat}
                  onChange={(e) => setBarcodeFormat(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-xs font-bold"
                >
                  <option value="CODE128">CODE128 (تلقائي شامل أرقام وحروف)</option>
                  <option value="EAN13">EAN-13 (13 رقم قياسي)</option>
                  <option value="EAN8">EAN-8 (8 أرقام)</option>
                  <option value="CODE39">CODE39 (قياسي صناعي)</option>
                  <option value="UPC">UPC-A (12 رقم)</option>
                </select>
                <p className="text-[10px] text-slate-400">
                  CODE128 هو الترميز الموصى به لجميع أنواع الباركود
                </p>
              </div>
            </div>

            {/* Display Toggles */}
            <div className="bg-slate-800/70 p-4 rounded-xl border border-slate-700/70 space-y-3 text-xs">
              <span className="font-extrabold text-slate-300 block border-b border-slate-700/60 pb-2">
                عناصر وعقول الملصق المطبوع:
              </span>

              <div className="grid grid-cols-2 gap-2.5">
                <label className="flex items-center gap-2 cursor-pointer bg-slate-900/60 p-2 rounded-lg border border-slate-700/50 hover:bg-slate-900">
                  <input
                    type="checkbox"
                    checked={showStoreName}
                    onChange={(e) => setShowStoreName(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-600 text-amber-500"
                  />
                  <span className="font-bold text-slate-200">اسم المتجر / الشركة</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer bg-slate-900/60 p-2 rounded-lg border border-slate-700/50 hover:bg-slate-900">
                  <input
                    type="checkbox"
                    checked={showProductName}
                    onChange={(e) => setShowProductName(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-600 text-amber-500"
                  />
                  <span className="font-bold text-slate-200">اسم المنتج</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer bg-slate-900/60 p-2 rounded-lg border border-slate-700/50 hover:bg-slate-900">
                  <input
                    type="checkbox"
                    checked={showPrice}
                    onChange={(e) => setShowPrice(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-600 text-amber-500"
                  />
                  <span className="font-bold text-slate-200">سعر البيع شامل الضريبة</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer bg-slate-900/60 p-2 rounded-lg border border-slate-700/50 hover:bg-slate-900">
                  <input
                    type="checkbox"
                    checked={showBarcodeText}
                    onChange={(e) => setShowBarcodeText(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-600 text-amber-500"
                  />
                  <span className="font-bold text-slate-200">أرقام الباركود أسفل الخطوط</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer bg-slate-900/60 p-2 rounded-lg border border-slate-700/50 hover:bg-slate-900 col-span-2">
                  <input
                    type="checkbox"
                    checked={showExpiryAndBatch}
                    onChange={(e) => setShowExpiryAndBatch(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-600 text-amber-500"
                  />
                  <span className="font-bold text-slate-200">
                    تاريخ الصلاحية ورقم التشغيلة (إن وجد)
                  </span>
                </label>
              </div>

              {/* Custom Note input */}
              <div className="pt-2">
                <label className="block text-slate-400 font-bold mb-1">ملاحظة سفلية مخصصة (مثال: صنع في السعودية):</label>
                <input
                  type="text"
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  placeholder="نص اختياري يظهر أسفل الملصق..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs"
                />
              </div>
            </div>

            {/* Fine tuning controls */}
            <div className="bg-slate-800/70 p-4 rounded-xl border border-slate-700/70 space-y-3 text-xs">
              <span className="font-extrabold text-slate-300 block border-b border-slate-700/60 pb-2">
                ضبط أبعاد وتنسيق الباركود:
              </span>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">ارتفاع الخطوط (px):</label>
                  <input
                    type="number"
                    min="15"
                    max="80"
                    value={barcodeHeightPx}
                    onChange={(e) => setBarcodeHeightPx(Number(e.target.value) || 30)}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">سُك الخط (Width):</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="4"
                    value={barcodeLineWidth}
                    onChange={(e) => setBarcodeLineWidth(Number(e.target.value) || 1.5)}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">حجم النص (px):</label>
                  <input
                    type="number"
                    min="8"
                    max="18"
                    value={fontSizePx}
                    onChange={(e) => setFontSizePx(Number(e.target.value) || 11)}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT/BOTTOM PREVIEW PANEL (5 Cols on LG) */}
          <div className="lg:col-span-5 flex flex-col space-y-4">
            
            {/* Live Sticker Preview Box */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex-1 flex flex-col justify-between shadow-inner">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                    <Eye className="w-4 h-4" />
                    <span>المعاينة المباشرة للملصق الحراري</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">
                    {activeWidthMm} × {activeHeightMm} مم
                  </span>
                </div>

                {/* Sticker Rendered Frame */}
                <div className="py-4 flex flex-col items-center justify-center bg-slate-900/60 rounded-xl p-3 border border-slate-800/80">
                  
                  {/* The Actual Sticker Mockup */}
                  <div 
                    style={{
                      width: `${Math.min(activeWidthMm * 4.5, 280)}px`,
                      minHeight: `${Math.min(activeHeightMm * 4.5, 180)}px`,
                    }}
                    className="bg-white text-black rounded-md p-2.5 shadow-2xl flex flex-col justify-between items-center text-center font-sans border border-slate-300 relative transition-all"
                  >
                    {/* Store Header */}
                    {showStoreName && (
                      <div className="text-[10px] font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 w-full pb-0.5 line-clamp-1">
                        {settings.name || 'اسم المتجر'}
                      </div>
                    )}

                    {/* Product Title */}
                    {showProductName && (
                      <div className="font-black text-xs text-slate-900 mt-1 leading-tight line-clamp-2">
                        {selectedProduct.name}
                      </div>
                    )}

                    {/* JsBarcode SVG Output */}
                    <div className="my-1 w-full flex justify-center">
                      <BarcodeSvgRenderer
                        value={selectedBarcodeString || '12345678'}
                        format={barcodeFormat}
                        width={barcodeLineWidth}
                        height={barcodeHeightPx}
                        displayValue={showBarcodeText}
                        fontSize={fontSizePx}
                      />
                    </div>

                    {/* Expiry & Batch info if available */}
                    {showExpiryAndBatch && (selectedProduct.expiryDate || selectedProduct.batchNumber) && (
                      <div className="text-[9px] text-slate-800 font-mono font-bold flex justify-center gap-2 w-full border-t border-slate-200 pt-0.5">
                        {selectedProduct.batchNumber && <span>دفعة: {selectedProduct.batchNumber}</span>}
                        {selectedProduct.expiryDate && <span>انتهاء: {selectedProduct.expiryDate}</span>}
                      </div>
                    )}

                    {/* Custom Note */}
                    {customNote.trim() && (
                      <div className="text-[9px] font-bold text-slate-700 leading-tight">
                        {customNote.trim()}
                      </div>
                    )}

                    {/* Price Block */}
                    {showPrice && (
                      <div className="text-xs font-black text-slate-950 pt-1 border-t border-slate-300 w-full flex items-center justify-between px-1">
                        <span className="text-[9px] text-slate-600 font-normal">السعر:</span>
                        <span className="font-extrabold font-mono text-sm">
                          {selectedProduct.price.toFixed(2)} {settings.currency}
                        </span>
                      </div>
                    )}
                  </div>

                </div>
              </div>

              {/* Sheet/Grid Info */}
              <div className="mt-4 p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-[11px] text-slate-300 space-y-1">
                <div className="flex justify-between font-bold text-amber-300">
                  <span>إجمالي عدد الملصقات للطباعة:</span>
                  <span className="font-mono text-sm">{printCount} ملصق</span>
                </div>
                {activePreset.isA4 && (
                  <div className="text-[10px] text-slate-400">
                    طباعة شيت A4 متناسق: {activePreset.cols} أعمدة × {activePreset.rows} صفوف (إجمالي {activePreset.cols! * activePreset.rows!} ملصق/صفحة)
                  </div>
                )}
              </div>

            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs sm:text-sm rounded-xl transition"
              >
                إلغاء
              </button>
              
              <button
                type="button"
                onClick={handlePrint}
                className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl transition shadow-xl flex items-center justify-center gap-2"
              >
                <Printer className="w-5 h-5" />
                <span>طباعة الملصقات الآن ({printCount})</span>
              </button>
            </div>

          </div>

        </div>

      </div>

      {/* ======================================================================== */}
      {/* PRINTABLE DEDICATED DOM (VISIBLE ONLY DURING WINDOW.PRINT)               */}
      {/* ======================================================================== */}
      <div id="barcode-print-area" className="hidden print:block">
        <style>{`
          @media print {
            body * {
              visibility: hidden !important;
            }
            #barcode-print-area, #barcode-print-area * {
              visibility: visible !important;
            }
            #barcode-print-area {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              padding: 0 !important;
              margin: 0 !important;
              background: #ffffff !important;
              color: #000000 !important;
            }

            @page {
              margin: 0;
              size: ${activePreset.isA4 ? 'A4 portrait' : `${activeWidthMm}mm ${activeHeightMm}mm`};
            }

            .sticker-page-item {
              width: ${activeWidthMm}mm;
              height: ${activeHeightMm}mm;
              box-sizing: border-box;
              padding: 1.5mm;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              align-items: center;
              text-align: center;
              page-break-after: ${activePreset.isA4 ? 'unset' : 'always'};
              break-after: ${activePreset.isA4 ? 'unset' : 'page'};
              page-break-inside: avoid;
              break-inside: avoid;
              overflow: hidden;
              font-family: system-ui, -apple-system, sans-serif;
            }

            .a4-grid-container {
              display: grid;
              grid-template-columns: repeat(${activePreset.cols || 3}, 1fr);
              gap: 2mm;
              padding: 5mm;
              width: 100%;
            }
          }
        `}</style>

        {activePreset.isA4 ? (
          <div className="a4-grid-container">
            {Array.from({ length: printCount }).map((_, idx) => (
              <div key={idx} className="sticker-page-item border border-dashed border-gray-300">
                {showStoreName && (
                  <div style={{ fontSize: '7pt', fontWeight: 900, textTransform: 'uppercase', borderBottom: '0.5px solid #000', width: '100%' }}>
                    {settings.name}
                  </div>
                )}
                {showProductName && (
                  <div style={{ fontSize: '8pt', fontWeight: 800, lineHeight: 1.1 }}>
                    {selectedProduct.name}
                  </div>
                )}
                <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                  <BarcodeSvgRenderer
                    value={selectedBarcodeString || '12345678'}
                    format={barcodeFormat}
                    width={barcodeLineWidth}
                    height={barcodeHeightPx}
                    displayValue={showBarcodeText}
                    fontSize={fontSizePx}
                  />
                </div>
                {showExpiryAndBatch && (selectedProduct.expiryDate || selectedProduct.batchNumber) && (
                  <div style={{ fontSize: '6.5pt', fontWeight: 700, fontFamily: 'monospace' }}>
                    {selectedProduct.batchNumber && <span>B:{selectedProduct.batchNumber} </span>}
                    {selectedProduct.expiryDate && <span>EXP:{selectedProduct.expiryDate}</span>}
                  </div>
                )}
                {customNote.trim() && (
                  <div style={{ fontSize: '6.5pt', fontWeight: 600 }}>
                    {customNote.trim()}
                  </div>
                )}
                {showPrice && (
                  <div style={{ fontSize: '9pt', fontWeight: 900, borderTop: '0.5px solid #000', width: '100%', paddingTop: '1px' }}>
                    {selectedProduct.price.toFixed(2)} {settings.currency}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div>
            {Array.from({ length: printCount }).map((_, idx) => (
              <div key={idx} className="sticker-page-item">
                {showStoreName && (
                  <div style={{ fontSize: '7pt', fontWeight: 900, textTransform: 'uppercase', borderBottom: '0.5px solid #000', width: '100%' }}>
                    {settings.name}
                  </div>
                )}
                {showProductName && (
                  <div style={{ fontSize: '8pt', fontWeight: 800, lineHeight: 1.1 }}>
                    {selectedProduct.name}
                  </div>
                )}
                <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                  <BarcodeSvgRenderer
                    value={selectedBarcodeString || '12345678'}
                    format={barcodeFormat}
                    width={barcodeLineWidth}
                    height={barcodeHeightPx}
                    displayValue={showBarcodeText}
                    fontSize={fontSizePx}
                  />
                </div>
                {showExpiryAndBatch && (selectedProduct.expiryDate || selectedProduct.batchNumber) && (
                  <div style={{ fontSize: '6.5pt', fontWeight: 700, fontFamily: 'monospace' }}>
                    {selectedProduct.batchNumber && <span>B:{selectedProduct.batchNumber} </span>}
                    {selectedProduct.expiryDate && <span>EXP:{selectedProduct.expiryDate}</span>}
                  </div>
                )}
                {customNote.trim() && (
                  <div style={{ fontSize: '6.5pt', fontWeight: 600 }}>
                    {customNote.trim()}
                  </div>
                )}
                {showPrice && (
                  <div style={{ fontSize: '9pt', fontWeight: 900, borderTop: '0.5px solid #000', width: '100%', paddingTop: '1px' }}>
                    {selectedProduct.price.toFixed(2)} {settings.currency}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
