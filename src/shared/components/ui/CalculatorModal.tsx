import React, { useState, useEffect } from 'react';
import { X, Calculator, Copy, Check, Delete, Divide, Percent, RefreshCw } from 'lucide-react';

interface CalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CalculatorModal: React.FC<CalculatorModalProps> = ({ isOpen, onClose }) => {
  const [display, setDisplay] = useState<string>('0');
  const [equation, setEquation] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [cashGiven, setCashGiven] = useState<string>('');
  const [calcMode, setCalcMode] = useState<'standard' | 'vat' | 'change'>('standard');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (/^[0-9.]$/.test(e.key)) {
        handleNumInput(e.key);
      } else if (['+', '-', '*', '/'].includes(e.key)) {
        handleOperatorInput(e.key);
      } else if (e.key === 'Enter' || e.key === '=') {
        handleEvaluate();
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'c' || e.key === 'C') {
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, display, equation]);

  if (!isOpen) return null;

  const handleNumInput = (num: string) => {
    if (display === '0' || display === 'خطأ') {
      setDisplay(num);
    } else {
      setDisplay(prev => prev.length < 15 ? prev + num : prev);
    }
  };

  const handleOperatorInput = (op: string) => {
    if (display === 'خطأ') return;
    setEquation(display + ' ' + op + ' ');
    setDisplay('0');
  };

  const handleClear = () => {
    setDisplay('0');
    setEquation('');
  };

  const handleBackspace = () => {
    if (display.length <= 1 || display === 'خطأ') {
      setDisplay('0');
    } else {
      setDisplay(prev => prev.slice(0, -1));
    }
  };

  const handleEvaluate = () => {
    if (!equation) return;
    try {
      const fullExpression = equation + display;
      // Sanitize expression
      const sanitized = fullExpression.replace(/×/g, '*').replace(/÷/g, '/');
      
      // Safe math evaluator for basic operations
      const safeEval = (expr: string): number => {
        const tokens = expr.match(/(\d+\.?\d*|\+|\-|\*|\/)/g);
        if (!tokens) throw new Error('Invalid expression');
        
        let currentVal = parseFloat(tokens[0]);
        for (let i = 1; i < tokens.length; i += 2) {
          const operator = tokens[i];
          const nextNum = parseFloat(tokens[i + 1]);
          if (isNaN(nextNum)) break;
          if (operator === '+') currentVal += nextNum;
          else if (operator === '-') currentVal -= nextNum;
          else if (operator === '*') currentVal *= nextNum;
          else if (operator === '/') currentVal /= nextNum;
        }
        return currentVal;
      };

      const result = safeEval(sanitized);
      if (isNaN(result) || !isFinite(result)) {
        setDisplay('خطأ');
      } else {
        const formatted = Number.isInteger(result) ? result.toString() : parseFloat(result.toFixed(4)).toString();
        setDisplay(formatted);
        setEquation('');
      }
    } catch {
      setDisplay('خطأ');
    }
  };

  const handleAddVat = () => {
    const val = parseFloat(display);
    if (isNaN(val)) return;
    const withVat = val * 1.15;
    setDisplay(parseFloat(withVat.toFixed(2)).toString());
    setEquation(`${val} + 15% VAT`);
  };

  const handleRemoveVat = () => {
    const val = parseFloat(display);
    if (isNaN(val)) return;
    const withoutVat = val / 1.15;
    setDisplay(parseFloat(withoutVat.toFixed(2)).toString());
    setEquation(`${val} ÷ 1.15 (خصم الضريبة)`);
  };

  const handleApplyDiscount = (percent: number) => {
    const val = parseFloat(display);
    if (isNaN(val)) return;
    const discounted = val * (1 - percent / 100);
    setDisplay(parseFloat(discounted.toFixed(2)).toString());
    setEquation(`${val} - ${percent}%`);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(display);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const numVal = parseFloat(display) || 0;
  const cashGivenVal = parseFloat(cashGiven) || 0;
  const changeVal = cashGivenVal - numVal;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="calculator-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
    >
      <div className="bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-800 w-full max-w-sm overflow-hidden flex flex-col dir-rtl text-right">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 bg-slate-800/80 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <Calculator className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h3 id="calculator-modal-title" className="font-bold text-sm text-white">آلة حاسبة المحاسبة والـ POS</h3>
              <p className="text-[10px] text-slate-400">حسابات سريعة والضريبة 15% (اختصار Alt+C)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="إغلاق الحاسبة"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/60 rounded-lg transition focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Display Screen */}
        <div className="p-4 bg-slate-950/90 text-left dir-ltr border-b border-slate-800">
          <div className="text-xs text-emerald-400/80 font-mono h-5 overflow-hidden text-ellipsis whitespace-nowrap">
            {equation || '\u00A0'}
          </div>
          <div className="text-3xl font-bold font-mono text-white tracking-wider my-1 overflow-x-auto whitespace-nowrap scrollbar-none">
            {display}
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800 dir-rtl text-xs">
            <span className="text-[11px] text-slate-400">القيمة المالية (ر.س)</span>
            <button
              onClick={handleCopy}
              aria-label="نسخ نتيجة الحساب"
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs transition focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none"
            >
              {copied ? <Check className="w-3.5 h-3.5" aria-hidden="true" /> : <Copy className="w-3.5 h-3.5" aria-hidden="true" />}
              <span>{copied ? 'تم النسخ!' : 'نسخ النتيجة'}</span>
            </button>
          </div>
        </div>

        {/* Mode Tabs */}
        <div className="flex border-b border-slate-800 text-xs bg-slate-900/50" role="tablist" aria-label="أنماط الحاسبة">
          <button
            id="calc-tab-standard"
            onClick={() => setCalcMode('standard')}
            role="tab"
            aria-selected={calcMode === 'standard'}
            aria-controls="calc-panel-standard"
            className={`flex-1 py-2 font-bold text-center border-b-2 transition focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none ${
              calcMode === 'standard' ? 'border-emerald-500 text-emerald-400 bg-slate-800/40' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            الحاسبة القياسية
          </button>
          <button
            id="calc-tab-vat"
            onClick={() => setCalcMode('vat')}
            role="tab"
            aria-selected={calcMode === 'vat'}
            aria-controls="calc-panel-vat"
            className={`flex-1 py-2 font-bold text-center border-b-2 transition focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none ${
              calcMode === 'vat' ? 'border-emerald-500 text-emerald-400 bg-slate-800/40' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            ضريبة VAT 15% والخصومات
          </button>
          <button
            id="calc-tab-change"
            onClick={() => setCalcMode('change')}
            role="tab"
            aria-selected={calcMode === 'change'}
            aria-controls="calc-panel-change"
            className={`flex-1 py-2 font-bold text-center border-b-2 transition focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none ${
              calcMode === 'change' ? 'border-emerald-500 text-emerald-400 bg-slate-800/40' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            حساب المتبقي (باقي الكاش)
          </button>
        </div>

        {/* Mode-Specific Panel */}
        {calcMode === 'standard' && (
          <div
            id="calc-panel-standard"
            role="tabpanel"
            aria-labelledby="calc-tab-standard"
            className="hidden"
          />
        )}

        {calcMode === 'vat' && (
          <div
            id="calc-panel-vat"
            role="tabpanel"
            aria-labelledby="calc-tab-vat"
            className="p-3 bg-slate-800/40 border-b border-slate-800 grid grid-cols-2 gap-2 text-xs"
          >
            <button
              onClick={handleAddVat}
              aria-label="إضافة خمسة عشر بالمئة ضريبة القيمة المضافة"
              className="py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold transition flex items-center justify-center gap-1 focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none"
            >
              <span>+ إضافة 15% ضريبة</span>
            </button>
            <button
              onClick={handleRemoveVat}
              aria-label="خصم خمسة عشر بالمئة ضريبة القيمة المضافة"
              className="py-2 px-3 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold transition flex items-center justify-center gap-1 focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none"
            >
              <span>- خصم 15% ضريبة</span>
            </button>
            <div className="col-span-2 flex items-center justify-between gap-1 pt-1">
              <span className="text-[10px] text-slate-400">خصم سريع:</span>
              {[5, 10, 15, 20, 25].map(pct => (
                <button
                  key={pct}
                  onClick={() => handleApplyDiscount(pct)}
                  aria-label={`تطبيق خصم ${pct} بالمئة`}
                  className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded font-mono text-[11px] transition focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none"
                >
                  -{pct}%
                </button>
              ))}
            </div>
          </div>
        )}

        {calcMode === 'change' && (
          <div
            id="calc-panel-change"
            role="tabpanel"
            aria-labelledby="calc-tab-change"
            className="p-3 bg-slate-800/40 border-b border-slate-800 space-y-2 text-xs"
          >
            <div className="flex justify-between items-center text-slate-300">
              <span>المبلغ المطلوبة فاتورته:</span>
              <span className="font-bold text-emerald-400 font-mono">{numVal.toFixed(2)} ر.س</span>
            </div>
            <div className="flex justify-between items-center gap-2">
              <label htmlFor="cash-given-input" className="text-slate-300 text-[11px]">المبلغ المستلم من العميل:</label>
              <input
                id="cash-given-input"
                type="number"
                value={cashGiven}
                onChange={e => setCashGiven(e.target.value)}
                placeholder="أدخل الكاش المستلم"
                className="w-32 py-1 px-2 bg-slate-950 border border-slate-700 rounded text-left text-white font-mono text-xs focus:outline-none focus:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500"
              />
            </div>
            <div className="p-2 rounded bg-slate-950 border border-slate-800 flex justify-between items-center">
              <span className="font-bold text-slate-300">الباقي للعميل:</span>
              <span className={`font-bold font-mono text-sm ${changeVal >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {changeVal >= 0 ? `${changeVal.toFixed(2)} ر.س` : `عجز: ${Math.abs(changeVal).toFixed(2)} ر.س`}
              </span>
            </div>
          </div>
        )}

        {/* Main Numpad Controls */}
        <div className="p-3 grid grid-cols-4 gap-2 bg-slate-900">
          <button
            onClick={handleClear}
            aria-label="مسح الكل"
            className="py-3 bg-rose-950/80 hover:bg-rose-900 text-rose-300 rounded-xl font-bold transition text-sm flex items-center justify-center focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none"
          >
            C
          </button>
          <button
            onClick={handleBackspace}
            aria-label="تراجع خطوة"
            className="py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition flex items-center justify-center focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none"
          >
            <Delete className="w-4 h-4" aria-hidden="true" />
          </button>
          <button
            onClick={() => handleOperatorInput('/')}
            aria-label="تقسيم"
            className="py-3 bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300 rounded-xl font-bold transition text-sm flex items-center justify-center focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none"
          >
            ÷
          </button>
          <button
            onClick={() => handleOperatorInput('*')}
            aria-label="ضرب"
            className="py-3 bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300 rounded-xl font-bold transition text-sm flex items-center justify-center focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none"
          >
            ×
          </button>

          {['7', '8', '9'].map(n => (
            <button
              key={n}
              onClick={() => handleNumInput(n)}
              aria-label={`رقم ${n}`}
              className="py-3 bg-slate-800/80 hover:bg-slate-700 text-white rounded-xl font-bold font-mono text-base transition shadow-sm focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none"
            >
              {n}
            </button>
          ))}
          <button
            onClick={() => handleOperatorInput('-')}
            aria-label="طرح"
            className="py-3 bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300 rounded-xl font-bold transition text-base flex items-center justify-center focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none"
          >
            -
          </button>

          {['4', '5', '6'].map(n => (
            <button
              key={n}
              onClick={() => handleNumInput(n)}
              aria-label={`رقم ${n}`}
              className="py-3 bg-slate-800/80 hover:bg-slate-700 text-white rounded-xl font-bold font-mono text-base transition shadow-sm focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none"
            >
              {n}
            </button>
          ))}
          <button
            onClick={() => handleOperatorInput('+')}
            aria-label="جمع"
            className="py-3 bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300 rounded-xl font-bold transition text-base flex items-center justify-center focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none"
          >
            +
          </button>

          {['1', '2', '3'].map(n => (
            <button
              key={n}
              onClick={() => handleNumInput(n)}
              aria-label={`رقم ${n}`}
              className="py-3 bg-slate-800/80 hover:bg-slate-700 text-white rounded-xl font-bold font-mono text-base transition shadow-sm focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none"
            >
              {n}
            </button>
          ))}
          <button
            onClick={handleEvaluate}
            aria-label="يساوي"
            className="row-span-2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xl transition flex items-center justify-center shadow-lg shadow-emerald-900/50 focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none"
          >
            =
          </button>

          <button
            onClick={() => handleNumInput('0')}
            aria-label="رقم 0"
            className="col-span-2 py-3 bg-slate-800/80 hover:bg-slate-700 text-white rounded-xl font-bold font-mono text-base transition shadow-sm focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none"
          >
            0
          </button>
          <button
            onClick={() => handleNumInput('.')}
            aria-label="فاصلة عشرية"
            className="py-3 bg-slate-800/80 hover:bg-slate-700 text-white rounded-xl font-bold font-mono text-base transition shadow-sm focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none"
          >
            .
          </button>
        </div>

        {/* Footer info */}
        <div className="p-2.5 bg-slate-950 border-t border-slate-800 text-center text-[10px] text-slate-400 flex justify-between items-center px-4">
          <span>يمكنك استخدام لوحة المكونات الرقمية بالحاسوب مباشرة</span>
          <span className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono">Alt + C</span>
        </div>
      </div>
    </div>
  );
};

export default CalculatorModal;
