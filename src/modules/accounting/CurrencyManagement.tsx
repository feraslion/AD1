import React, { useState, useEffect } from 'react';
import { CurrencyService, Currency, ExchangeRateHistory, ConversionResult } from '../../services/CurrencyService';
import { 
  Coins, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  History, 
  Calculator, 
  Check, 
  ArrowRightLeft, 
  Landmark,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';

export default function CurrencyManagement() {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [history, setHistory] = useState<ExchangeRateHistory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Rate Edit Modal state
  const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null);
  const [newRateInput, setNewRateInput] = useState<string>('');
  const [rateNotes, setRateNotes] = useState<string>('');
  const [savingRate, setSavingRate] = useState<boolean>(false);

  // New Currency Form state
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newCode, setNewCode] = useState<string>('');
  const [newName, setNewName] = useState<string>('');
  const [newSymbol, setNewSymbol] = useState<string>('');
  const [newRate, setNewRate] = useState<string>('1.0');
  const [isDefault, setIsDefault] = useState<boolean>(false);

  // Calculator state
  const [calcAmount, setCalcAmount] = useState<string>('100');
  const [calcFromCode, setCalcFromCode] = useState<string>('USD');
  const [calcToCode, setCalcToCode] = useState<string>('SYP');
  const [calcResult, setCalcResult] = useState<ConversionResult | null>(null);

  // Revaluation state
  const [revalCurrency, setRevalCurrency] = useState<string>('USD');
  const [revalRate, setRevalRate] = useState<string>('3.75');
  const [revalDate, setRevalDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [revalLoading, setRevalLoading] = useState<boolean>(false);
  const [revalResult, setRevalResult] = useState<any>(null);

  useEffect(() => {
    fetchCurrencies();
    fetchHistory();
  }, []);

  useEffect(() => {
    if (currencies.length > 0) {
      handleCalculate();
    }
  }, [calcAmount, calcFromCode, calcToCode, currencies]);

  const fetchCurrencies = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/currencies');
      const json = await res.json();
      if (json.success) {
        setCurrencies(json.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch currencies:', err);
      setActionError('تعذر جلب قائمة العملات من الخادم');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/currencies/history');
      const json = await res.json();
      if (json.success) {
        setHistory(json.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch exchange rates history:', err);
    }
  };

  const handleSeedDefaults = async () => {
    setLoading(true);
    setActionSuccess(null);
    setActionError(null);
    try {
      const res = await fetch('/api/currencies/seed', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        setCurrencies(json.data || []);
        setActionSuccess('تم إعادة بذر العملات الافتراضية (SAR, USD, SYP, TRY) بنجاح! 🎉');
        fetchHistory();
      } else {
        setActionError(json.message || 'فشل بذر العملات الافتراضية');
      }
    } catch (err) {
      setActionError('خطأ أثناء بذر البيانات الافتراضية للعملات');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRateUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCurrency) return;
    setSavingRate(true);
    setActionSuccess(null);
    setActionError(null);

    try {
      const res = await fetch(`/api/currencies/${editingCurrency.id}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exchangeRate: parseFloat(newRateInput),
          notes: rateNotes || 'تحديث سعر الصرف يدويًا'
        })
      });
      const json = await res.json();
      if (json.success) {
        setActionSuccess(`تم تحديث سعر صرف ${editingCurrency.name} إلى (${newRateInput}) بنجاح!`);
        setEditingCurrency(null);
        setNewRateInput('');
        setRateNotes('');
        fetchCurrencies();
        fetchHistory();
      } else {
        setActionError(json.message || 'فشل تحديث سعر الصرف');
      }
    } catch (err) {
      setActionError('حدث خطأ أثناء حفظ سعر الصرف جديد');
    } finally {
      setSavingRate(false);
    }
  };

  const handleCreateCurrency = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode || !newName || !newSymbol) return;
    setActionSuccess(null);
    setActionError(null);

    try {
      const res = await fetch('/api/currencies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: newCode.toUpperCase(),
          name: newName,
          symbol: newSymbol,
          exchangeRate: parseFloat(newRate) || 1.0,
          isDefault
        })
      });
      const json = await res.json();
      if (json.success) {
        setActionSuccess(`تمت إضافة العملة ${newName} (${newCode.toUpperCase()}) بنجاح!`);
        setShowAddModal(false);
        setNewCode('');
        setNewName('');
        setNewSymbol('');
        setNewRate('1.0');
        setIsDefault(false);
        fetchCurrencies();
        fetchHistory();
      } else {
        setActionError(json.message || 'فشل إضافة العملة');
      }
    } catch (err) {
      setActionError('حدث خطأ أثناء إضافة العملة الجديدة');
    }
  };

  const handleSetBaseCurrency = async (id: string, code: string) => {
    if (!confirm(`هل أنت تأكد من تعيين العملة (${code}) كعملة أساسية جديدة للشركة؟ سيتم إعادة احتساب أسعار باقي العملات تلقائيًا.`)) return;

    setActionSuccess(null);
    setActionError(null);
    try {
      const res = await fetch('/api/currencies/set-base', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currencyId: id, currencyCode: code })
      });
      const json = await res.json();
      if (json.success) {
        setActionSuccess(`تم تعيين العملة (${code}) كعملة أساسية للشركة بنجاح! 🎉`);
        fetchCurrencies();
        fetchHistory();
      } else {
        setActionError(json.message || 'فشل تعيين العملة الأساسية');
      }
    } catch (err) {
      setActionError('حدث خطأ أثناء تعيين العملة الأساسية للشركة');
    }
  };

  const handleDeleteCurrency = async (id: string, code: string) => {
    const baseCurr = currencies.find(c => c.isDefault === 'true' || c.isDefault === true);
    if (code === baseCurr?.code || id === baseCurr?.id) {
      alert(`لا يمكن حذف العملة الأساسية للنظام (${code})`);
      return;
    }
    if (!confirm(`هل أنت تأكد من رغبتك في حذف العملة (${code})؟`)) return;

    try {
      const res = await fetch(`/api/currencies/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setActionSuccess(`تم حذف العملة (${code}) بنجاح.`);
        fetchCurrencies();
        fetchHistory();
      } else {
        setActionError(json.message || 'فشل حذف العملة');
      }
    } catch (err) {
      setActionError('حدث خطأ أثناء حذف العملة');
    }
  };

  const handleCalculate = () => {
    const amt = parseFloat(calcAmount) || 0;
    const res = CurrencyService.convertAmount(amt, calcFromCode, calcToCode, currencies);
    setCalcResult(res);
  };

  const handleRunRevaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    setRevalLoading(true);
    setActionSuccess(null);
    setActionError(null);
    setRevalResult(null);

    try {
      const res = await fetch('/api/currencies/revaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currencyCode: revalCurrency,
          newExchangeRate: parseFloat(revalRate),
          revaluationDate: revalDate
        })
      });
      const json = await res.json();
      if (json.success) {
        setRevalResult(json.data);
        setActionSuccess(json.data.message);
        fetchCurrencies();
        fetchHistory();
      } else {
        setActionError(json.message || 'فشل إجراء إعادة تقييم العملة');
      }
    } catch (err) {
      setActionError('حدث خطأ أثناء الاتصال بالخادم لتشغيل إعادة تقييم العملة');
    } finally {
      setRevalLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-6 rounded-2xl shadow-md border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Coins className="w-6 h-6 text-emerald-400" />
            <h2 className="text-xl font-black">المرحلة 16 — تطوير المحاسبة متعددة العملات وإعادة التقييم</h2>
          </div>
          <p className="text-xs text-slate-300">
            محرك قيود يومية يدعم العملة الأجنبية والأساسية، حساب تلقائي لأرباح وخسائر فروق العملة، وإعادة تقييم الحسابات بالعملات الأجنبية.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSeedDefaults}
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            بذر / استعادة العملات (USD, SYP, TRY, SAR)
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            إضافة عملة جديدة
          </button>
        </div>
      </div>

      {/* Notifications */}
      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center justify-between">
          <span>{actionSuccess}</span>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-600 hover:text-emerald-900">✕</button>
        </div>
      )}
      {actionError && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-xl flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="text-rose-600 hover:text-rose-900">✕</button>
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Currencies Cards & Table - 8 Cols */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                <Landmark className="w-4 h-4 text-emerald-600" />
                العملات المعرفة في النظام وأسعار الصرف الرسمية
              </h3>
              <span className="text-xs text-slate-500 font-semibold">إجمالي العملات: {currencies.length}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {currencies.map(curr => {
                const isBase = curr.isDefault === 'true' || curr.isDefault === true || (curr as any).isDefault === '1';
                const baseCurr = currencies.find(c => c.isDefault === 'true' || c.isDefault === true || (c as any).isDefault === '1');
                const baseCode = baseCurr?.code || 'USD';
                const rateNum = parseFloat(curr.exchangeRate || '1');

                return (
                  <div 
                    key={curr.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isBase 
                        ? 'bg-emerald-50/50 border-emerald-300 ring-1 ring-emerald-400/30' 
                        : 'bg-slate-50/60 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-800 text-base">{curr.name}</span>
                          <span className="bg-slate-200 text-slate-700 text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-md">
                            {curr.code}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-slate-500">رمز العملة: ({curr.symbol})</span>
                      </div>
                      {isBase ? (
                        <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1 shadow-sm">
                          <Check className="w-3 h-3" />
                          عملة الشركة الأساسية
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-1 justify-end">
                          <button
                            onClick={() => handleSetBaseCurrency(curr.id, curr.code)}
                            title="تعيين كعملة أساسية جديدة للشركة"
                            className="text-[11px] bg-emerald-100 text-emerald-800 hover:bg-emerald-200 px-2 py-1 rounded-lg font-bold transition-all"
                          >
                            عملة أساسية
                          </button>
                          <button
                            onClick={() => {
                              setEditingCurrency(curr);
                              setNewRateInput(curr.exchangeRate.toString());
                            }}
                            className="text-[11px] bg-slate-800 hover:bg-slate-900 text-white px-2 py-1 rounded-lg font-bold transition-all"
                          >
                            تعديل
                          </button>
                          <button
                            onClick={() => handleDeleteCurrency(curr.id, curr.code)}
                            className="text-[11px] text-rose-600 hover:bg-rose-50 px-2 py-1 rounded-lg font-bold transition-all"
                          >
                            حذف
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-200/60 flex justify-between items-end">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block">
                          {isBase ? 'العملة الأساسية للنظام:' : `السعر مقابل ${baseCode}:`}
                        </span>
                        <div className="text-sm font-black text-slate-800 font-mono">
                          {isBase ? `1 ${curr.code} = 1.00 ${curr.code}` : `1 ${curr.code} = ${rateNum} ${baseCode}`}
                        </div>
                      </div>
                      {!isBase && (
                        <div className="text-left text-[11px] font-semibold text-slate-500 font-mono">
                          1 {baseCode} = {rateNum > 0 ? (1 / rateNum).toFixed(4) : '-'} {curr.code}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Historical Exchange Rates Log */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                <History className="w-4 h-4 text-emerald-600" />
                سجل أسعار الصرف والتعديلات التاريخية
              </h3>
              <span className="text-xs text-slate-500">عدد السجلات: {history.length}</span>
            </div>

            <div className="overflow-x-auto max-h-72 overflow-y-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-100 text-slate-600 sticky top-0 font-bold">
                  <tr>
                    <th className="p-2.5">التاريخ</th>
                    <th className="p-2.5">العملة</th>
                    <th className="p-2.5">سعر الصرف المسجل</th>
                    <th className="p-2.5">ملاحظات والتفاصيل</th>
                    <th className="p-2.5">بواسطة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {history.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-6 text-slate-400 font-bold">
                        لا يوجد سجلات أسعار تاريخية مسجلة بعد.
                      </td>
                    </tr>
                  ) : (
                    history.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-2.5 font-mono text-slate-600">{item.effectiveDate}</td>
                        <td className="p-2.5 font-bold text-slate-800">
                          <span className="bg-slate-200 text-slate-800 px-2 py-0.5 rounded font-mono">
                            {item.currencyCode}
                          </span>
                        </td>
                        <td className="p-2.5 font-mono font-bold text-emerald-700">
                          1 {item.currencyCode} = {item.rate} SAR
                        </td>
                        <td className="p-2.5 text-slate-600">{item.notes || '-'}</td>
                        <td className="p-2.5 text-slate-500 font-semibold">{item.createdBy || 'النظام'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Live Currency Calculator & Accounting Setup - 4 Cols */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Live Currency Converter Widget */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-md space-y-4 border border-slate-800">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Calculator className="w-5 h-5 text-emerald-400" />
              <h3 className="font-extrabold text-sm">حاسبة تحويل العملات السريعة</h3>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 font-bold block mb-1">المبلغ المراد تحويله:</label>
                <input
                  type="number"
                  value={calcAmount}
                  onChange={e => setCalcAmount(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm font-bold font-mono text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-400 font-bold block mb-1">من عملة:</label>
                  <select
                    value={calcFromCode}
                    onChange={e => setCalcFromCode(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-xs font-bold text-white focus:outline-none"
                  >
                    {currencies.map(c => (
                      <option key={c.id} value={c.code}>{c.name} ({c.code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-bold block mb-1">إلى عملة:</label>
                  <select
                    value={calcToCode}
                    onChange={e => setCalcToCode(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-xs font-bold text-white focus:outline-none"
                  >
                    {currencies.map(c => (
                      <option key={c.id} value={c.code}>{c.name} ({c.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              {calcResult && (
                <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/80 space-y-2 mt-4">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">النتيجة بعد التحويل:</span>
                  <div className="text-lg font-black text-emerald-400 font-mono">
                    {calcResult.targetAmount.toLocaleString()} {calcResult.targetCurrency}
                  </div>
                  <div className="text-[11px] text-slate-300 font-mono space-y-1 pt-1 border-t border-slate-700">
                    <div>القيمة بالعملة الأساسية (SAR): <span className="font-bold text-white">{calcResult.baseAmount.toLocaleString()} ر.س</span></div>
                    <div>سعر التحويل الفعلي: <span className="text-emerald-300 font-bold">1 {calcResult.sourceCurrency} = {calcResult.effectiveRate} {calcResult.targetCurrency}</span></div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Foreign Exchange Accounting Accounts Box */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-100 pb-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              ربط حسابات أرباح وخسائر فروق العملة
            </h3>
            
            <p className="text-xs text-slate-500 leading-relaxed">
              عند تحصيل أو سداد الفواتير بالعملة الأجنبية مع تغير سعر الصرف، يقوم النظام آلياً بتسجيل القيد المحاسبي في الحسابات التالية:
            </p>

            <div className="space-y-2 pt-1 text-xs font-mono">
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex justify-between items-center">
                <div>
                  <span className="font-bold text-emerald-900 block">4201 - أرباح فروق العملة</span>
                  <span className="text-[10px] text-emerald-700 font-sans">إيرادات أرباح تحويل وتسوية العملات</span>
                </div>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>

              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex justify-between items-center">
                <div>
                  <span className="font-bold text-rose-900 block">5202 - خسائر فروق العملة</span>
                  <span className="text-[10px] text-rose-700 font-sans">مصاريف/خسائر تسوية أسعار الصرف</span>
                </div>
                <TrendingDown className="w-4 h-4 text-rose-600" />
              </div>
            </div>
          </div>

          {/* Currency Revaluation Interactive Tool */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-100 pb-2">
              <RefreshCw className="w-4 h-4 text-emerald-600" />
              أداة إعادة تقييم الحسابات بالعملة الأجنبية
            </h3>
            
            <p className="text-xs text-slate-500 leading-relaxed">
              قم بإعادة تقييم الحسابات المحاسبية المقومة بالعملة الأجنبية بناءً على سعر الصرف الجديد، وحساب الأرباح/الخسائر غير المحققة آليًا.
            </p>

            <form onSubmit={handleRunRevaluation} className="space-y-3 pt-1">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">العملة المراد إعادة تقييمها:</label>
                <select
                  value={revalCurrency}
                  onChange={e => {
                    setRevalCurrency(e.target.value);
                    const found = currencies.find(c => c.code === e.target.value);
                    if (found) setRevalRate(found.exchangeRate.toString());
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:outline-none"
                >
                  {currencies.filter(c => c.code !== 'SAR').map(c => (
                    <option key={c.id} value={c.code}>{c.name} ({c.code})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">سعر التقييم الجديد:</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={revalRate}
                    onChange={e => setRevalRate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">تاريخ التقييم:</label>
                  <input
                    type="date"
                    required
                    value={revalDate}
                    onChange={e => setRevalDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold font-mono focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={revalLoading}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <RefreshCw className={`w-4 h-4 text-emerald-400 ${revalLoading ? 'animate-spin' : ''}`} />
                {revalLoading ? 'جاري إعادة التقييم...' : 'تشغيل إعادة التقييم وإصدار القيد'}
              </button>
            </form>

            {revalResult && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-2">
                <div className="font-bold text-emerald-900 flex items-center gap-1">
                  <Check className="w-4 h-4 text-emerald-600" />
                  تمت إعادة التقييم وإصدار قيد تسوية!
                </div>
                <div className="text-slate-600 font-mono text-[11px]">
                  عدد الحسابات المقيّمة: {revalResult.revaluedAccountsCount}
                </div>
                {revalResult.postedEntry && (
                  <div className="text-slate-700 font-mono text-[11px] bg-white p-2 rounded border border-emerald-100">
                    رقم القيد: <span className="font-bold text-emerald-800">{revalResult.postedEntry.entryNumber}</span> | المبلغ: <span className="font-bold">{revalResult.postedEntry.totalDebit} SAR</span>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Modal for Editing Exchange Rate */}
      {editingCurrency && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-800 text-base">تحديث سعر صرف: {editingCurrency.name} ({editingCurrency.code})</h3>
              <button onClick={() => setEditingCurrency(null)} className="text-slate-400 hover:text-slate-600 text-sm">✕</button>
            </div>

            <form onSubmit={handleSaveRateUpdate} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">
                  سعر الصرف الجديد مقابل الريال السعودي (SAR):
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={newRateInput}
                  onChange={e => setNewRateInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <span className="text-[11px] text-slate-400 block mt-1 font-mono">
                  1 {editingCurrency.code} = {newRateInput || '0'} SAR
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">ملاحظات / سبب التعديل:</label>
                <input
                  type="text"
                  placeholder="مثال: تحديث البنك المركزي / نشرة الصرف اليومية"
                  value={rateNotes}
                  onChange={e => setRateNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={savingRate}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5"
                >
                  {savingRate ? 'جاري الحفظ...' : 'حفظ سعر الصرف الجديد'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingCurrency(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-xl text-xs transition-all"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal for Adding New Currency */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-800 text-base">إضافة عملة جديدة للنظام</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 text-sm">✕</button>
            </div>

            <form onSubmit={handleCreateCurrency} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">رمز ISO (مثال: EUR, EGP):</label>
                  <input
                    type="text"
                    required
                    placeholder="EUR"
                    value={newCode}
                    onChange={e => setNewCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold uppercase focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">رمز العرض (Symbol):</label>
                  <input
                    type="text"
                    required
                    placeholder="€"
                    value={newSymbol}
                    onChange={e => setNewSymbol(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">اسم العملة العربي:</label>
                <input
                  type="text"
                  required
                  placeholder="يورو"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">سعر الصرف الأولي (مقابل SAR):</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={newRate}
                  onChange={e => setNewRate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold font-mono focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-xs transition-all"
                >
                  إضافة العملة
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-xl text-xs transition-all"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
