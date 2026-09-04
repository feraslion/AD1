import React, { useState, useEffect } from 'react';
import { X, Keyboard, Copy, Check, Trash2, ArrowLeftRight, Space } from 'lucide-react';

interface VirtualKeyboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertText?: (text: string) => void;
  initialText?: string;
}

export const VirtualKeyboardModal: React.FC<VirtualKeyboardModalProps> = ({
  isOpen,
  onClose,
  onInsertText,
  initialText = ''
}) => {
  const [textBuffer, setTextBuffer] = useState<string>(initialText);
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');
  const [isShift, setIsShift] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setTextBuffer(initialText);
    }
  }, [isOpen, initialText]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const arKeysRow1 = ['ض', 'ص', 'ث', 'ق', 'ف', 'غ', 'ع', 'ه', 'خ', 'ح', 'ج', 'د'];
  const arKeysRow2 = ['ش', 'س', 'ي', 'ب', 'ل', 'ا', 'ت', 'ن', 'م', 'ك', 'ط'];
  const arKeysRow3 = ['ئ', 'ء', 'ؤ', 'ر', 'لا', 'ى', 'ة', 'و', 'ز', 'ظ'];

  const enKeysRow1 = ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'];
  const enKeysRow2 = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'];
  const enKeysRow3 = ['z', 'x', 'c', 'v', 'b', 'n', 'm'];

  const numberRow = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '٫', '-'];

  const handleKeyPress = (char: string) => {
    const outputChar = isShift && language === 'en' ? char.toUpperCase() : char;
    setTextBuffer(prev => prev + outputChar);
  };

  const handleBackspace = () => {
    setTextBuffer(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setTextBuffer('');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(textBuffer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInsert = () => {
    if (onInsertText) {
      onInsertText(textBuffer);
    }
    handleCopy();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="virtual-keyboard-modal-title"
        className="bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-800 w-full max-w-2xl overflow-hidden flex flex-col dir-rtl text-right"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 bg-slate-800/80 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
              <Keyboard className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h3 id="virtual-keyboard-modal-title" className="font-bold text-sm text-white">لوحة مفاتيح الكاشير الذكية</h3>
              <p className="text-[10px] text-slate-400">لوحة كتابة لمسية تفاعلية للغة العربية والإنجليزية (Alt+K)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="إغلاق لوحة المفاتيح"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/60 rounded-lg transition focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Text Area Input Display */}
        <div className="p-4 bg-slate-950/90 border-b border-slate-800">
          <textarea
            value={textBuffer}
            onChange={e => setTextBuffer(e.target.value)}
            placeholder="اكتب هنا باستخدام لوحة اللمس أو الكيبورد الحقيقي..."
            aria-label="نص لوحة المفاتيح"
            className="w-full h-24 p-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-base focus:outline-none focus:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500 resize-none dir-auto"
          />
          <div className="flex justify-between items-center mt-2">
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                aria-label="نسخ النص"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded-lg text-xs font-bold transition focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
                <span>{copied ? 'تم النسخ!' : 'نسخ النص'}</span>
              </button>
              <button
                onClick={handleClear}
                aria-label="مسح النص"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-950/80 hover:bg-rose-900 text-rose-300 rounded-lg text-xs font-bold transition focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none"
              >
                <Trash2 className="w-4 h-4" aria-hidden="true" />
                <span>مسح النص</span>
              </button>
            </div>
            {onInsertText && (
              <button
                onClick={handleInsert}
                aria-label="إدراج ونص الكاشير"
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition shadow-md shadow-indigo-900/50 focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none"
              >
                إدراج ونص الكاشير
              </button>
            )}
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="p-3 bg-slate-800/40 border-b border-slate-800 flex justify-between items-center">
          <button
            onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
            aria-label="تغيير اللغة"
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition border border-slate-700 focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none"
          >
            <ArrowLeftRight className="w-4 h-4 text-amber-400" aria-hidden="true" />
            <span>اللغة: {language === 'ar' ? 'العربية 🇸🇦' : 'English 🇬🇧'}</span>
          </button>

          {language === 'en' && (
            <button
              onClick={() => setIsShift(!isShift)}
              aria-label="تبديل الأحرف الكبيرة"
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none ${
                isShift ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              Shift (أحرف كبيرة)
            </button>
          )}
        </div>

        {/* Onscreen Keys */}
        <div className="p-4 bg-slate-900 space-y-2 select-none dir-ltr">
          {/* Numbers Row */}
          <div className="flex justify-center gap-1">
            {numberRow.map(n => (
              <button
                key={n}
                onClick={() => handleKeyPress(n)}
                className="flex-1 max-w-[45px] h-11 bg-slate-800 hover:bg-indigo-600 text-white rounded-lg font-bold font-mono text-sm transition border border-slate-700 active:scale-95 flex items-center justify-center focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none"
              >
                {n}
              </button>
            ))}
          </div>

          {/* Letter Row 1 */}
          <div className="flex justify-center gap-1">
            {(language === 'ar' ? arKeysRow1 : enKeysRow1).map(k => (
              <button
                key={k}
                onClick={() => handleKeyPress(k)}
                className="flex-1 max-w-[48px] h-11 bg-slate-800 hover:bg-indigo-600 text-white rounded-lg font-bold text-sm transition border border-slate-700 active:scale-95 flex items-center justify-center focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none"
              >
                {isShift && language === 'en' ? k.toUpperCase() : k}
              </button>
            ))}
          </div>

          {/* Letter Row 2 */}
          <div className="flex justify-center gap-1">
            {(language === 'ar' ? arKeysRow2 : enKeysRow2).map(k => (
              <button
                key={k}
                onClick={() => handleKeyPress(k)}
                className="flex-1 max-w-[48px] h-11 bg-slate-800 hover:bg-indigo-600 text-white rounded-lg font-bold text-sm transition border border-slate-700 active:scale-95 flex items-center justify-center focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none"
              >
                {isShift && language === 'en' ? k.toUpperCase() : k}
              </button>
            ))}
          </div>

          {/* Letter Row 3 */}
          <div className="flex justify-center gap-1">
            {(language === 'ar' ? arKeysRow3 : enKeysRow3).map(k => (
              <button
                key={k}
                onClick={() => handleKeyPress(k)}
                className="flex-1 max-w-[48px] h-11 bg-slate-800 hover:bg-indigo-600 text-white rounded-lg font-bold text-sm transition border border-slate-700 active:scale-95 flex items-center justify-center focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none"
              >
                {isShift && language === 'en' ? k.toUpperCase() : k}
              </button>
            ))}
            <button
              onClick={handleBackspace}
              aria-label="تراجع"
              className="px-3 h-11 bg-rose-900/80 hover:bg-rose-800 text-white rounded-lg font-bold text-xs transition border border-rose-700/50 flex items-center justify-center gap-1 focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none"
            >
              تراجع ⌫
            </button>
          </div>

          {/* Space Bar & Symbols Row */}
          <div className="flex justify-center gap-2 pt-1">
            <button
              onClick={() => handleKeyPress(' ')}
              aria-label="مسافة"
              className="flex-1 h-11 bg-slate-800 hover:bg-indigo-600 text-white rounded-lg font-bold text-xs transition border border-slate-700 flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none"
            >
              <Space className="w-4 h-4 text-slate-400" aria-hidden="true" />
              <span>مسافة (Space)</span>
            </button>
            {['.', ',', ':', '@', '#', '&'].map(sym => (
              <button
                key={sym}
                onClick={() => handleKeyPress(sym)}
                className="w-11 h-11 bg-slate-800 hover:bg-indigo-600 text-white rounded-lg font-bold text-sm transition border border-slate-700 flex items-center justify-center focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none"
              >
                {sym}
              </button>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-2.5 bg-slate-950 border-t border-slate-800 text-center text-[10px] text-slate-400 flex justify-between items-center px-4">
          <span>مصممة خصيصاً لأجهزة الكاشير والشاشات التي تعمل باللمس</span>
          <span className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono">Alt + K</span>
        </div>
      </div>
    </div>
  );
};

export default VirtualKeyboardModal;
