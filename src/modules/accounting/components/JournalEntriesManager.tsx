import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  PlusCircle, 
  CheckCircle2, 
  RotateCcw, 
  AlertTriangle, 
  Search, 
  Filter, 
  ShieldCheck, 
  Calendar, 
  DollarSign, 
  Eye, 
  Trash2, 
  ArrowLeftRight,
  Clock,
  Printer
} from 'lucide-react';
import { AccountingService } from '../../../services/AccountingService.ts';
import { CurrencyService } from '../../../services/CurrencyService.ts';

interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
  currency?: string;
  isActive?: boolean;
}

interface JournalLineInput {
  accountId: string;
  debit: number;
  credit: number;
  foreignDebit?: number;
  foreignCredit?: number;
  description?: string;
}

interface JournalEntry {
  id: string;
  entryNumber: string;
  reference?: string;
  description: string;
  date: string;
  status: 'draft' | 'posted' | 'reversed';
  currency: string;
  baseCurrency: string;
  exchangeRate: number;
  foreignAmount: number;
  baseAmount: number;
  createdBy?: string;
  reversedEntryId?: string;
  lines: Array<{
    id: string;
    accountId: string;
    accountCode: string;
    accountName: string;
    accountType: string;
    currency: string;
    debit: number;
    credit: number;
    foreignDebit: number;
    foreignCredit: number;
    description?: string;
  }>;
}

interface Props {
  accounts: Account[];
  baseCurrency: string;
  onRefreshData: () => void;
}

export const JournalEntriesManager: React.FC<Props> = ({
  accounts,
  baseCurrency,
  onRefreshData
}) => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [currencyFilter, setCurrencyFilter] = useState<string>('ALL');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [showReverseModal, setShowReverseModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState<JournalEntry | null>(null);

  const [selectedEntryForReverse, setSelectedEntryForReverse] = useState<JournalEntry | null>(null);
  const [reverseReason, setReverseReason] = useState('');

  // Create Entry Form State
  const [entryDesc, setEntryDesc] = useState('');
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [entryReference, setEntryReference] = useState('');
  const [entryCurrency, setEntryCurrency] = useState(baseCurrency);
  const [entryExchangeRate, setEntryExchangeRate] = useState(1.0);
  const [entryStatus, setEntryStatus] = useState<'posted' | 'draft'>('posted');
  const [createError, setCreateError] = useState('');

  const [lines, setLines] = useState<JournalLineInput[]>([
    { accountId: accounts[0]?.id || '', debit: 0, credit: 0, foreignDebit: 0, foreignCredit: 0 },
    { accountId: accounts[1]?.id || accounts[0]?.id || '', debit: 0, credit: 0, foreignDebit: 0, foreignCredit: 0 }
  ]);

  // Audit Health Data
  const [auditData, setAuditData] = useState<any>(null);
  const [auditLoading, setAuditLoading] = useState(false);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const data = await AccountingService.getJournalEntries({
        search: searchTerm,
        date: dateFilter,
        currency: currencyFilter,
        status: statusFilter
      });
      setEntries(data || []);
    } catch (err) {
      console.error('Error fetching journal entries:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, [searchTerm, dateFilter, statusFilter, currencyFilter]);

  const handleRunAuditHealth = async () => {
    setAuditLoading(true);
    try {
      const res = await AccountingService.getAuditHealth();
      setAuditData(res);
      setShowAuditModal(true);
    } catch (err) {
      alert('فشل إجراء فحص التدقيق المحاسبي');
    } finally {
      setAuditLoading(false);
    }
  };

  const handleAddLine = () => {
    setLines([...lines, { accountId: accounts[0]?.id || '', debit: 0, credit: 0, foreignDebit: 0, foreignCredit: 0 }]);
  };

  const handleRemoveLine = (index: number) => {
    if (lines.length <= 2) {
      alert('يجب أن يحتوي القيد المحاسبي على سطرين مدين ودائن على الأقل.');
      return;
    }
    setLines(lines.filter((_, i) => i !== index));
  };

  const handleLineChange = (index: number, field: keyof JournalLineInput, value: any) => {
    const updated = [...lines];
    updated[index] = { ...updated[index], [field]: value };
    setLines(updated);
  };

  // Calculations for Create Modal
  const totalDebit = lines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
  const totalCredit = lines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0);
  const lineDifference = Math.abs(totalDebit - totalCredit);
  const isBalanced = lineDifference <= 0.01;

  const handleCreateEntrySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');

    if (!entryDesc.trim()) {
      setCreateError('يرجى إدخال شرح أو بيان القيد المحاسبي.');
      return;
    }

    if (entryStatus === 'posted' && !isBalanced) {
      setCreateError(`القيد غير متزن! إجمالي المدين (${totalDebit.toFixed(2)}) لا يساوي إجمالي الدائن (${totalCredit.toFixed(2)}). الفرق: ${lineDifference.toFixed(2)}`);
      return;
    }

    try {
      await AccountingService.createJournalEntry({
        description: entryDesc,
        date: entryDate,
        reference: entryReference,
        currency: entryCurrency,
        baseCurrency,
        exchangeRate: entryExchangeRate,
        status: entryStatus,
        lines: lines.map(l => ({
          accountId: l.accountId,
          debit: Number(l.debit) || 0,
          credit: Number(l.credit) || 0,
          foreignDebit: Number(l.foreignDebit) || 0,
          foreignCredit: Number(l.foreignCredit) || 0,
          description: l.description || entryDesc
        }))
      });

      setShowCreateModal(false);
      setEntryDesc('');
      setEntryReference('');
      setLines([
        { accountId: accounts[0]?.id || '', debit: 0, credit: 0, foreignDebit: 0, foreignCredit: 0 },
        { accountId: accounts[1]?.id || accounts[0]?.id || '', debit: 0, credit: 0, foreignDebit: 0, foreignCredit: 0 }
      ]);
      fetchEntries();
      onRefreshData();
    } catch (err: any) {
      setCreateError(err.message || 'حدث خطأ في حفظ القيد المحاسبي.');
    }
  };

  const handlePostDraft = async (id: string) => {
    if (!window.confirm('هل ترغب بترحيل هذا القيد المسودة فوراً إلى دفتر الأستاذ العام وتحديث أرصدة الحسابات؟')) return;
    try {
      await AccountingService.postDraftJournalEntry(id);
      fetchEntries();
      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'فشل ترحيل قيد المسودة');
    }
  };

  const handleReverseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEntryForReverse) return;
    if (!reverseReason.trim()) {
      alert('يجب إدخال سبب إلغاء/عكس القيد المحاسبي لأغراض التدقيق الرقمي.');
      return;
    }

    try {
      await AccountingService.reverseJournalEntry(selectedEntryForReverse.id, reverseReason);
      setShowReverseModal(false);
      setSelectedEntryForReverse(null);
      setReverseReason('');
      fetchEntries();
      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'فشل عكس القيد المحاسبي');
    }
  };

  return (
    <div className="space-y-5 text-right" dir="rtl">
      {/* 1. Header & Quick Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h3 className="font-black text-slate-900 text-base sm:text-lg flex items-center gap-2">
              <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <FileText className="w-5 h-5" />
              </span>
              محرك اليومية العامة والقيود المزدوجة (Journal Posting Engine)
            </h3>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">
              إدارة القيود المحاسبية اليدوية والآلية، الترحيل المباشر، القيود المسودة، والعكس والتدقيق المحاسبي المزدوج.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleRunAuditHealth}
              disabled={auditLoading}
              className="px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition"
            >
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>{auditLoading ? 'جاري الفحص...' : 'فحص وتدقيق صحة القيود'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setEntryDesc('');
                setEntryReference('');
                setLines([
                  { accountId: accounts[0]?.id || '', debit: 0, credit: 0, foreignDebit: 0, foreignCredit: 0 },
                  { accountId: accounts[1]?.id || accounts[0]?.id || '', debit: 0, credit: 0, foreignDebit: 0, foreignCredit: 0 }
                ]);
                setCreateError('');
                setShowCreateModal(true);
              }}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition shadow-sm"
            >
              <PlusCircle className="w-4 h-4 text-emerald-400" />
              <span>إنشاء قيد محاسبي يدوي</span>
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-slate-100 text-xs font-bold">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="البحث برقم القيد أو الوصف أو المرجع..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-3 pr-9 py-2 border border-slate-200 rounded-xl text-xs text-right focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
            />
            <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
          </div>

          {/* Date */}
          <div className="relative">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-right focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-right focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold bg-white"
            >
              <option value="ALL">جميع الحالات (مرحّل، مسودة، معكوس)</option>
              <option value="posted">المرحّلة أصولاً (Posted)</option>
              <option value="draft">القيود المسودة (Drafts)</option>
              <option value="reversed">القيود المعكوسة (Reversed)</option>
            </select>
          </div>

          {/* Currency Filter */}
          <div>
            <select
              value={currencyFilter}
              onChange={(e) => setCurrencyFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-right focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold bg-white"
            >
              <option value="ALL">جميع العملات (USD, SYP, TRY, SAR)</option>
              <option value="SAR">الريال السعودي (SAR)</option>
              <option value="USD">الدولار الأمريكي (USD)</option>
              <option value="SYP">الليرة السورية (SYP)</option>
              <option value="TRY">الليرة التركية (TRY)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. Journal Entries List */}
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 text-sm font-bold">
          جاري تحميل القيود المحاسبية وسطور دفتر اليومية...
        </div>
      ) : entries.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 text-sm">
          لم يتم العثور على قيود محاسبية مطابقة لمعايير البحث الحالية.
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map(entry => {
            const totalDeb = entry.lines.reduce((sum, l) => sum + (l.debit || 0), 0);
            const totalCred = entry.lines.reduce((sum, l) => sum + (l.credit || 0), 0);

            return (
              <div 
                key={entry.id} 
                className={`bg-white border rounded-2xl overflow-hidden shadow-xs transition ${
                  entry.status === 'reversed' 
                    ? 'border-rose-200 bg-rose-50/20' 
                    : entry.status === 'draft' 
                    ? 'border-amber-200 bg-amber-50/10' 
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Entry Header */}
                <div className="bg-slate-50/80 p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="px-3 py-1 bg-slate-900 text-white font-mono font-black text-xs rounded-xl">
                      {entry.entryNumber}
                    </span>

                    {/* Status Badge */}
                    {entry.status === 'posted' && (
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-[11px] rounded-lg flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        مرحّل أصولاً
                      </span>
                    )}
                    {entry.status === 'draft' && (
                      <span className="px-2.5 py-1 bg-amber-100 text-amber-800 border border-amber-300 font-bold text-[11px] rounded-lg flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        مسودة غير مرحلة
                      </span>
                    )}
                    {entry.status === 'reversed' && (
                      <span className="px-2.5 py-1 bg-rose-100 text-rose-800 border border-rose-300 font-bold text-[11px] rounded-lg flex items-center gap-1">
                        <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                        معكوس / ملغى
                      </span>
                    )}

                    <h4 className="font-black text-slate-800 text-xs sm:text-sm">{entry.description}</h4>

                    {entry.reference && (
                      <span className="px-2 py-0.5 bg-slate-200/70 text-slate-700 font-mono text-[11px] rounded font-bold">
                        مرجع: {entry.reference}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <span className="font-mono text-slate-500 font-bold flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {entry.date}
                    </span>

                    {entry.currency && entry.currency !== baseCurrency && (
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-mono text-[11px] font-bold rounded border border-indigo-100">
                        العملة: {entry.currency} (سعر الصرف: {entry.exchangeRate})
                      </span>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 mr-2">
                      {entry.status === 'draft' && (
                        <button
                          type="button"
                          onClick={() => handlePostDraft(entry.id)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center gap-1 transition shadow-xs"
                          title="ترحيل قيد المسودة إلى الأستاذ العام"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>ترحيل الآن</span>
                        </button>
                      )}

                      {entry.status === 'posted' && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedEntryForReverse(entry);
                            setReverseReason('');
                            setShowReverseModal(true);
                          }}
                          className="px-3 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-lg font-bold text-xs flex items-center gap-1 transition"
                          title="عكس وتعديل هذا القيد بقيد عكسي معتمد"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                          <span>عكس / تعديل القيد</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setShowViewModal(entry)}
                        className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition"
                        title="عرض كامل التفاصيل"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Details Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 font-bold text-slate-500">
                        <th className="p-3">رمز الحساب</th>
                        <th className="p-3">اسم الحساب والبيان الفرعي</th>
                        <th className="p-3 text-left">مدين (Debit - {baseCurrency})</th>
                        <th className="p-3 text-left">دائن (Credit - {baseCurrency})</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {entry.lines.map(line => (
                        <tr key={line.id} className="hover:bg-slate-50/50 transition">
                          <td className="p-3 font-mono font-extrabold text-slate-600">
                            {line.accountCode || line.accountId}
                          </td>
                          <td className="p-3 font-bold text-slate-800">
                            <div>{line.accountName || line.accountId}</div>
                            {line.description && line.description !== entry.description && (
                              <div className="text-[11px] text-slate-400 font-normal">{line.description}</div>
                            )}
                          </td>
                          <td className="p-3 text-left font-mono text-emerald-600 font-extrabold text-sm">
                            {line.debit > 0 ? line.debit.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                          </td>
                          <td className="p-3 text-left font-mono text-slate-500 font-extrabold text-sm">
                            {line.credit > 0 ? line.credit.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                          </td>
                        </tr>
                      ))}
                      {/* Entry Footer Totals */}
                      <tr className="bg-slate-900 text-white font-bold border-t border-slate-200">
                        <td className="p-3" colSpan={2}>
                          إجمالي حركة السند التراكمية ({entry.lines.length} سطور)
                        </td>
                        <td className="p-3 text-left font-mono text-teal-400 font-black text-sm underline decoration-double">
                          {totalDeb.toLocaleString('en-US', { minimumFractionDigits: 2 })} {baseCurrency}
                        </td>
                        <td className="p-3 text-left font-mono text-teal-400 font-black text-sm underline decoration-double">
                          {totalCred.toLocaleString('en-US', { minimumFractionDigits: 2 })} {baseCurrency}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 3. CREATE MANUAL ENTRY MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl my-8">
            <div className="p-5 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="font-black text-sm sm:text-base flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-emerald-400" />
                تأكيد وإنشاء قيد محاسبي جديد (Double-Entry Posting)
              </h3>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white font-bold"
              >
                إغلاق ✕
              </button>
            </div>

            <form onSubmit={handleCreateEntrySubmit} className="p-6 space-y-5">
              {createError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{createError}</span>
                </div>
              )}

              {/* Header Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 mb-1">البيان الشامل / شرح القيد *</label>
                  <input
                    type="text"
                    placeholder="مثال: إثبات مصاريف الصيانة الدورية نقداً..."
                    value={entryDesc}
                    onChange={(e) => setEntryDesc(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs sm:text-sm text-right focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">التاريخ *</label>
                  <input
                    type="date"
                    value={entryDate}
                    onChange={(e) => setEntryDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs sm:text-sm text-right focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">الرقم المرجعي (Reference)</label>
                  <input
                    type="text"
                    placeholder="رقم فاتورة أو عقد..."
                    value={entryReference}
                    onChange={(e) => setEntryReference(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs sm:text-sm text-right focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              {/* Status and Currency Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">حالة الترحيل</label>
                  <select
                    value={entryStatus}
                    onChange={(e) => setEntryStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs sm:text-sm text-right focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold bg-white"
                  >
                    <option value="posted">ترحيل مباشر إلى الأستاذ العام (Posted)</option>
                    <option value="draft">حفظ كمسودة للتأكيد لاحقاً (Draft)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">عملة العملية المعرفية</label>
                  <select
                    value={entryCurrency}
                    onChange={(e) => setEntryCurrency(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs sm:text-sm text-right focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold bg-white"
                  >
                    <option value="SAR">الريال السعودي (SAR)</option>
                    <option value="USD">الدولار الأمريكي (USD)</option>
                    <option value="SYP">الليرة السورية (SYP)</option>
                    <option value="TRY">الليرة التركية (TRY)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">سعر الصرف مقابل ({baseCurrency})</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={entryExchangeRate}
                    onChange={(e) => setEntryExchangeRate(parseFloat(e.target.value) || 1.0)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs sm:text-sm text-right focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono font-bold"
                  />
                </div>
              </div>

              {/* Dynamic Lines Table */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="font-extrabold text-slate-800 text-xs sm:text-sm">سطور القيد المحاسبي (تفاصيل المدين والدائن)</h4>
                  <button
                    type="button"
                    onClick={handleAddLine}
                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-bold flex items-center gap-1 transition"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>إضافة سطر حساب آخر</span>
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 font-bold text-slate-600">
                        <th className="p-3">الحساب المالي</th>
                        <th className="p-3 text-left w-36">مدين (Debit)</th>
                        <th className="p-3 text-left w-36">دائن (Credit)</th>
                        <th className="p-3">البيان الفرعي (اختياري)</th>
                        <th className="p-3 text-center w-12">إجراء</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {lines.map((line, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="p-2">
                            <select
                              value={line.accountId}
                              onChange={(e) => handleLineChange(idx, 'accountId', e.target.value)}
                              className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            >
                              {accounts.map(acc => (
                                <option key={acc.id} value={acc.id}>
                                  {acc.code} - {acc.name} ({acc.type === 'asset' ? 'أصول' : acc.type === 'liability' ? 'خصوم' : acc.type === 'equity' ? 'حقوق ملكية' : acc.type === 'revenue' ? 'إيرادات' : 'مصاريف'})
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              value={line.debit || ''}
                              onChange={(e) => handleLineChange(idx, 'debit', parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-mono font-bold text-left text-emerald-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              value={line.credit || ''}
                              onChange={(e) => handleLineChange(idx, 'credit', parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-mono font-bold text-left text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              placeholder="شرح السطر..."
                              value={line.description || ''}
                              onChange={(e) => handleLineChange(idx, 'description', e.target.value)}
                              className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none"
                            />
                          </td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveLine(idx)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                              title="حذف السطر"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Realtime Balancing Calculator Bar */}
              <div className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-4 font-bold text-xs sm:text-sm ${
                isBalanced ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}>
                <div className="flex items-center gap-2">
                  {isBalanced ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-rose-600" />
                  )}
                  <span>
                    {isBalanced 
                      ? 'القيد المحاسبي متزن ومطابق لقواعد القيد المزدوج 100%' 
                      : `القيد غير متزن! يوجد فارق بين المدين والدائن قدره: ${lineDifference.toFixed(2)} ${baseCurrency}`}
                  </span>
                </div>

                <div className="flex items-center gap-6 font-mono text-sm">
                  <div>
                    <span className="text-slate-500 text-xs block">إجمالي المدين:</span>
                    <span className="text-emerald-700 font-black">{totalDebit.toFixed(2)} {baseCurrency}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-xs block">إجمالي الدائن:</span>
                    <span className="text-slate-800 font-black">{totalCredit.toFixed(2)} {baseCurrency}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-bold transition"
                >
                  إلغاء
                </button>

                <button
                  type="submit"
                  disabled={entryStatus === 'posted' && !isBalanced}
                  className={`px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white transition shadow-sm ${
                    entryStatus === 'posted' && !isBalanced
                      ? 'bg-slate-300 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  حفظ القيد المحاسبي ({entryStatus === 'posted' ? 'ترحيل فوري' : 'حفظ كمسودة'})
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. REVERSE ENTRY MODAL */}
      {showReverseModal && selectedEntryForReverse && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-5 bg-rose-900 text-white flex justify-between items-center">
              <h3 className="font-black text-xs sm:text-sm flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-rose-300" />
                عكس وتعديل القيد المحاسبي ({selectedEntryForReverse.entryNumber})
              </h3>
              <button onClick={() => setShowReverseModal(false)} className="text-slate-300 hover:text-white font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleReverseSubmit} className="p-6 space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-bold space-y-1">
                <p>⚠️ تحذير التدقيق الرقمي:</p>
                <p className="font-normal text-slate-700">
                  سيتم إنشاء قيد عكسي تلقائياً في الأستاذ العام بعكس جميع الحركات (المدين يصبح دائن والعكس) مع تعديل حالة القيد الأصلي إلى "معكوس" للحفاظ على تسلسل الأثر المالي وشجرة التدقيق.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">سبب إلغاء/عكس القيد المحاسبي (مطلوب للرقابة) *</label>
                <textarea
                  rows={3}
                  placeholder="اكتب سبب العكس أو الخطأ المحاسبي الذي تم تعديله..."
                  value={reverseReason}
                  onChange={(e) => setReverseReason(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-1 focus:ring-rose-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowReverseModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                >
                  تأكيد عكس وتعديل القيد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. AUDIT HEALTH MODAL */}
      {showAuditModal && auditData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl">
            <div className="p-5 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="font-black text-sm flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                تقرير فحص سلامة وتدقيق اليومية العامة
              </h3>
              <button onClick={() => setShowAuditModal(false)} className="text-slate-400 hover:text-white font-bold">
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs sm:text-sm">
              <div className={`p-4 rounded-xl border flex items-center gap-3 font-bold ${
                auditData.isTrialBalanceEqual ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}>
                {auditData.isTrialBalanceEqual ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0" />
                )}
                <div>
                  <h4 className="font-black text-sm">
                    {auditData.isTrialBalanceEqual 
                      ? 'ميزان المراجعة متزن 100% (إجمالي المدين يساوي الدائن)' 
                      : 'تنبيه: يوجد خلل أو قيود غير متزنة في دفتر اليومية!'}
                  </h4>
                  <p className="text-xs font-normal mt-0.5 opacity-90">
                    تاريخ الفحص الحركي: {new Date(auditData.checkedAt).toLocaleString('ar-SA')}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <span className="text-slate-500 text-xs font-bold block">إجمالي مدين الأستاذ العام</span>
                  <span className="font-mono font-black text-slate-900 text-base">
                    {auditData.totalGLDebit.toLocaleString('en-US', { minimumFractionDigits: 2 })} {baseCurrency}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <span className="text-slate-500 text-xs font-bold block">إجمالي دائن الأستاذ العام</span>
                  <span className="font-mono font-black text-slate-900 text-base">
                    {auditData.totalGLCredit.toLocaleString('en-US', { minimumFractionDigits: 2 })} {baseCurrency}
                  </span>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-600 font-bold">إجمالي القيود المسجلة:</span>
                  <span className="font-mono font-bold text-slate-900">{auditData.totalEntriesCount} قيد</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-600 font-bold">القيود المرحّلة أصولاً (Posted):</span>
                  <span className="font-mono font-bold text-emerald-600">{auditData.postedEntriesCount} قيد</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-600 font-bold">القيود المسودة (Draft):</span>
                  <span className="font-mono font-bold text-amber-600">{auditData.draftEntriesCount} قيد</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-600 font-bold">القيود المعكوسة والملغاة:</span>
                  <span className="font-mono font-bold text-rose-600">{auditData.reversedEntriesCount} قيد</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-600 font-bold">الحسابات النشطة بـ دليل الحسابات:</span>
                  <span className="font-mono font-bold text-indigo-600">{auditData.activeAccountsCount} حساب</span>
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setShowAuditModal(false)}
                  className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold transition"
                >
                  إغلاق التقرير
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
