import React, { useState, useEffect } from 'react';
import { StoreSettings } from '../../types';
import { TreasuryService, AccountingService } from '../../services/api';
import { 
  Landmark, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Repeat, 
  CheckCircle2, 
  PlusCircle, 
  FileText, 
  Search, 
  Filter, 
  DollarSign, 
  Scale, 
  Building2, 
  CreditCard, 
  X, 
  RefreshCw, 
  AlertCircle,
  Clock,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import StatCard from '../../shared/components/ui/StatCard';
import Badge from '../../shared/components/ui/Badge';
import Modal from '../../shared/components/ui/Modal';

interface TreasuryProps {
  settings: StoreSettings;
}

export default function Treasury({ settings }: TreasuryProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'cashboxes' | 'bank_accounts' | 'deposits' | 'withdrawals' | 'transfers' | 'reconciliation'>('overview');
  
  // Data State
  const [cashboxes, setCashboxes] = useState<any[]>([]);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showCashboxModal, setShowCashboxModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);

  // Form States
  const [depositForm, setDepositForm] = useState({
    destinationType: 'cashbox' as 'cashbox' | 'bank_account',
    destinationId: '',
    sourceType: 'revenue' as 'customer' | 'revenue' | 'capital' | 'other',
    sourceAccountId: 'acc_revenue',
    amount: '',
    currency: settings.currency || 'SAR',
    exchangeRate: 1.0,
    date: new Date().toISOString().split('T')[0],
    referenceNumber: '',
    description: ''
  });

  const [withdrawalForm, setWithdrawalForm] = useState({
    sourceType: 'cashbox' as 'cashbox' | 'bank_account',
    sourceId: '',
    destinationType: 'expense' as 'supplier' | 'expense' | 'owner_draw' | 'other',
    destinationAccountId: 'acc_expense',
    amount: '',
    currency: settings.currency || 'SAR',
    exchangeRate: 1.0,
    date: new Date().toISOString().split('T')[0],
    referenceNumber: '',
    description: ''
  });

  const [transferForm, setTransferForm] = useState({
    sourceType: 'cashbox' as 'cashbox' | 'bank_account',
    sourceId: '',
    destinationType: 'bank_account' as 'cashbox' | 'bank_account',
    destinationId: '',
    amount: '',
    transferFee: '0',
    currency: settings.currency || 'SAR',
    exchangeRate: 1.0,
    date: new Date().toISOString().split('T')[0],
    referenceNumber: '',
    description: ''
  });

  const [cashboxForm, setCashboxForm] = useState({
    id: '',
    name: '',
    currentBalance: '0',
    status: 'open'
  });

  const [bankForm, setBankForm] = useState({
    id: '',
    bankName: '',
    accountName: '',
    accountNumber: '',
    iban: '',
    swift: '',
    branch: '',
    currency: settings.currency || 'SAR',
    currentBalance: '0',
    accountId: 'acc_bank'
  });

  // Reconciliation state
  const [selectedReconcileBankId, setSelectedReconcileBankId] = useState('');
  const [statementDate, setStatementDate] = useState(new Date().toISOString().split('T')[0]);
  const [statementEndingBalance, setStatementEndingBalance] = useState('');
  const [unreconciledTx, setUnreconciledTx] = useState<any[]>([]);
  const [selectedTxIds, setSelectedTxIds] = useState<string[]>([]);
  const [reconcileHistory, setReconcileHistory] = useState<any[]>([]);

  const [formError, setFormError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Fetch all treasury data
  const loadTreasuryData = async () => {
    setLoading(true);
    try {
      const [cbData, baData, txData, accData] = await Promise.all([
        TreasuryService.getCashboxes(),
        TreasuryService.getBankAccounts(),
        TreasuryService.getTransactions(),
        AccountingService.getAccounts()
      ]);

      setCashboxes(cbData);
      setBankAccounts(baData);
      setTransactions(txData);
      setAccounts(accData);

      // Set default selections
      if (cbData.length > 0) {
        setDepositForm(prev => ({ ...prev, destinationId: cbData[0].id }));
        setWithdrawalForm(prev => ({ ...prev, sourceId: cbData[0].id }));
        setTransferForm(prev => ({ ...prev, sourceId: cbData[0].id }));
      }
      if (baData.length > 0) {
        setTransferForm(prev => ({ ...prev, destinationId: baData[0].id }));
        setSelectedReconcileBankId(baData[0].id);
      }
    } catch (e) {
      console.error('Error loading treasury data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTreasuryData();
  }, []);

  useEffect(() => {
    if (selectedReconcileBankId) {
      loadUnreconciledData(selectedReconcileBankId);
    }
  }, [selectedReconcileBankId]);

  const loadUnreconciledData = async (bankId: string) => {
    try {
      const [unrec, history] = await Promise.all([
        TreasuryService.getUnreconciledTransactions(bankId),
        TreasuryService.getReconciliations(bankId)
      ]);
      setUnreconciledTx(unrec);
      setReconcileHistory(history);
      setSelectedTxIds([]);
    } catch (e) {
      console.error(e);
    }
  };

  // Aggregated totals
  const totalCashboxBalance = cashboxes.reduce((sum, c) => sum + (Number(c.currentBalance) || 0), 0);
  const totalBankBalance = bankAccounts.reduce((sum, b) => sum + (Number(b.currentBalance) || 0), 0);
  const totalLiquidity = totalCashboxBalance + totalBankBalance;

  // Handlers
  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!depositForm.amount || parseFloat(depositForm.amount) <= 0) {
      setFormError('يرجى إدخال مبلغ إيداع صحيح أكبر من صفر');
      return;
    }
    if (!depositForm.destinationId) {
      setFormError('يرجى اختيار جهة الإيداع (الخزينة أو البنك)');
      return;
    }

    try {
      await TreasuryService.createDeposit({
        ...depositForm,
        amount: parseFloat(depositForm.amount)
      });
      setShowDepositModal(false);
      setActionSuccess('تم تسجيل عملية الإيداع وإنشاء القيد المحاسبي المزدوج بنجاح! 🟢');
      setTimeout(() => setActionSuccess(''), 4000);
      loadTreasuryData();
    } catch (err: any) {
      setFormError(err.message || 'حدث خطأ أثناء تسجيل الإيداع');
    }
  };

  const handleWithdrawalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!withdrawalForm.amount || parseFloat(withdrawalForm.amount) <= 0) {
      setFormError('يرجى إدخال مبلغ سحب/مصروف صحيح أكبر من صفر');
      return;
    }
    if (!withdrawalForm.sourceId) {
      setFormError('يرجى اختيار المصدر (الخزينة أو البنك)');
      return;
    }

    try {
      await TreasuryService.createWithdrawal({
        ...withdrawalForm,
        amount: parseFloat(withdrawalForm.amount)
      });
      setShowWithdrawalModal(false);
      setActionSuccess('تم تسجيل عملية السحب/المصروف وتحديث دليل الحسابات بنجاح! 🔴');
      setTimeout(() => setActionSuccess(''), 4000);
      loadTreasuryData();
    } catch (err: any) {
      setFormError(err.message || 'حدث خطأ أثناء تسجيل السحب');
    }
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!transferForm.amount || parseFloat(transferForm.amount) <= 0) {
      setFormError('يرجى إدخال مبلغ تحويل صحيح أكبر من صفر');
      return;
    }
    if (transferForm.sourceId === transferForm.destinationId) {
      setFormError('لا يمكن التحويل من وإلى نفس الحساب أو الخزينة');
      return;
    }

    try {
      await TreasuryService.createTransfer({
        ...transferForm,
        amount: parseFloat(transferForm.amount),
        transferFee: parseFloat(transferForm.transferFee || '0')
      });
      setShowTransferModal(false);
      setActionSuccess('تم تنفيذ التحويل المالي وإنشاء القيد المحاسبي التلقائي بنجاح! ⇄');
      setTimeout(() => setActionSuccess(''), 4000);
      loadTreasuryData();
    } catch (err: any) {
      setFormError(err.message || 'حدث خطأ أثناء التحويل المالي');
    }
  };

  const handleCashboxSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cashboxForm.name.trim()) return;
    try {
      await TreasuryService.createCashbox({
        ...cashboxForm,
        currentBalance: parseFloat(cashboxForm.currentBalance || '0')
      });
      setShowCashboxModal(false);
      setActionSuccess('تم حفظ الخزينة بنجاح!');
      setTimeout(() => setActionSuccess(''), 3000);
      loadTreasuryData();
    } catch (err: any) {
      alert('خطأ في حفظ الخزينة');
    }
  };

  const handleBankSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankForm.bankName.trim() || !bankForm.accountNumber.trim()) return;
    try {
      await TreasuryService.createBankAccount({
        ...bankForm,
        currentBalance: parseFloat(bankForm.currentBalance || '0')
      });
      setShowBankModal(false);
      setActionSuccess('تم حفظ الحساب البنكي بنجاح!');
      setTimeout(() => setActionSuccess(''), 3000);
      loadTreasuryData();
    } catch (err: any) {
      alert('خطأ في حفظ الحساب البنكي');
    }
  };

  const handleExecuteReconciliation = async () => {
    if (!selectedReconcileBankId) return;
    const endBal = parseFloat(statementEndingBalance || '0');
    const selectedBank = bankAccounts.find(b => b.id === selectedReconcileBankId);
    const ledgerBal = selectedBank ? selectedBank.currentBalance : 0;

    try {
      await TreasuryService.executeReconciliation({
        bankAccountId: selectedReconcileBankId,
        statementDate,
        statementEndingBalance: endBal,
        ledgerEndingBalance: ledgerBal,
        matchedTransactionIds: selectedTxIds,
        notes: `تسوية بنكية لحساب ${selectedBank?.bankName || ''}`
      });

      setActionSuccess('تم إتمام عملية التسوية البنكية والمطابقة بنجاح! 🎯');
      setTimeout(() => setActionSuccess(''), 4000);
      loadUnreconciledData(selectedReconcileBankId);
      loadTreasuryData();
    } catch (err: any) {
      alert(err.message || 'فشل تنفيذ التسوية البنكية');
    }
  };

  const formatAmount = (val: number) => {
    return new Intl.NumberFormat('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val) + ' ' + (settings.currency || 'SAR');
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 bg-slate-50 min-h-screen text-right" dir="rtl">
      {/* Top Banner Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-md shadow-emerald-200">
            <Landmark className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">إدارة الخزينة والبنوك والسيولة (Treasury & Cash Management)</h1>
            <p className="text-xs text-slate-500 font-bold mt-0.5">متابعة أرصدة الخزائن، الحسابات البنكية، الإيداعات، السحوبات، والربط التلقائي بدليل الحسابات</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <button
            onClick={() => { setFormError(''); setShowDepositModal(true); }}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-100 flex items-center gap-1.5 transition"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>+ إيداع جديد</span>
          </button>

          <button
            onClick={() => { setFormError(''); setShowWithdrawalModal(true); }}
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black shadow-md shadow-rose-100 flex items-center gap-1.5 transition"
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>- سحب / مصروف</span>
          </button>

          <button
            onClick={() => { setFormError(''); setShowTransferModal(true); }}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black shadow-md shadow-blue-100 flex items-center gap-1.5 transition"
          >
            <Repeat className="w-4 h-4" />
            <span>⇄ تحويل مالي</span>
          </button>

          <button
            onClick={loadTreasuryData}
            title="تحديث البيانات"
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition border border-slate-300"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Success Banner */}
      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-black flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess('')} className="text-emerald-600 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="إجمالي السيولة النقدية والبنكية"
          value={formatAmount(totalLiquidity)}
          icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
          trendText="موزعة بالكامل"
          trendUp={true}
        />
        <StatCard
          title="أرصدة الخزائن الصناديق"
          value={formatAmount(totalCashboxBalance)}
          icon={<Wallet className="w-5 h-5 text-amber-600" />}
          trendText={`${cashboxes.length} خزينة نشطة`}
          trendUp={true}
        />
        <StatCard
          title="أرصدة الحسابات البنكية"
          value={formatAmount(totalBankBalance)}
          icon={<Building2 className="w-5 h-5 text-blue-600" />}
          trendText={`${bankAccounts.length} حساب بنكي`}
          trendUp={true}
        />
        <StatCard
          title="إجمالي العمليات الملتزمة"
          value={transactions.length.toString()}
          icon={<Scale className="w-5 h-5 text-indigo-600" />}
          trendText="قيود مزدوجة صحيحة"
          trendUp={true}
        />
      </div>

      {/* Tabs Navigation */}
      <div className="flex overflow-x-auto gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'overview' ? 'bg-slate-900 text-white shadow' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Landmark className="w-4 h-4" />
          <span>السيولة والأرصدة العامة</span>
        </button>

        <button
          onClick={() => setActiveTab('cashboxes')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'cashboxes' ? 'bg-slate-900 text-white shadow' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>الصناديق والخزائن ({cashboxes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('bank_accounts')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'bank_accounts' ? 'bg-slate-900 text-white shadow' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>الحسابات البنكية ({bankAccounts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('deposits')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'deposits' ? 'bg-slate-900 text-white shadow' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <ArrowUpRight className="w-4 h-4 text-emerald-400" />
          <span>سجل الإيداعات</span>
        </button>

        <button
          onClick={() => setActiveTab('withdrawals')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'withdrawals' ? 'bg-slate-900 text-white shadow' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <ArrowDownLeft className="w-4 h-4 text-rose-400" />
          <span>سجل السحوبات والمصروفات</span>
        </button>

        <button
          onClick={() => setActiveTab('transfers')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'transfers' ? 'bg-slate-900 text-white shadow' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Repeat className="w-4 h-4 text-blue-400" />
          <span>التحويلات المالية</span>
        </button>

        <button
          onClick={() => setActiveTab('reconciliation')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'reconciliation' ? 'bg-slate-900 text-white shadow' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Scale className="w-4 h-4 text-amber-400" />
          <span>التسوية البنكية (Reconciliation)</span>
        </button>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Cashboxes Summary */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-amber-600" />
                  <h2 className="font-bold text-sm text-slate-800">أرصدة الخزائن والصناديق النقضية</h2>
                </div>
                <button
                  onClick={() => { setCashboxForm({ id: '', name: '', currentBalance: '0', status: 'open' }); setShowCashboxModal(true); }}
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 transition"
                >
                  + إضافة خزينة جديدة
                </button>
              </div>

              <div className="space-y-3">
                {cashboxes.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">لا توجد خزائن مسجلة</p>
                ) : (
                  cashboxes.map(box => (
                    <div key={box.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center">
                      <div>
                        <div className="font-bold text-xs text-slate-800">{box.name}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">الحالة: {box.status === 'open' ? 'نشطة 🟢' : 'مغلقة 🔴'}</div>
                      </div>
                      <div className="text-left font-mono font-black text-sm text-amber-700">
                        {formatAmount(Number(box.currentBalance) || 0)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Bank Accounts Summary */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  <h2 className="font-bold text-sm text-slate-800">الحسابات البنكية المعتمدة</h2>
                </div>
                <button
                  onClick={() => { setBankForm({ id: '', bankName: '', accountName: '', accountNumber: '', iban: '', swift: '', branch: '', currency: settings.currency || 'SAR', currentBalance: '0', accountId: 'acc_bank' }); setShowBankModal(true); }}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 transition"
                >
                  + إضافة حساب بنكي
                </button>
              </div>

              <div className="space-y-3">
                {bankAccounts.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">لا توجد حسابات بنكية مسجلة</p>
                ) : (
                  bankAccounts.map(bank => (
                    <div key={bank.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center">
                      <div>
                        <div className="font-bold text-xs text-slate-800">{bank.bankName} - {bank.accountName}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">رقم الحساب: {bank.accountNumber}</div>
                      </div>
                      <div className="text-left font-mono font-black text-sm text-blue-700">
                        {formatAmount(Number(bank.currentBalance) || 0)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Recent Treasury Transactions */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-800">أحدث المعاملات المالية بالخزينة والبنوك</h3>
              <span className="text-xs font-bold text-slate-500">إجمالي المعاملات: {transactions.length}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">نوع المعاملة</th>
                    <th className="p-3">التاريخ</th>
                    <th className="p-3">المبلغ</th>
                    <th className="p-3">البيان / الوصف</th>
                    <th className="p-3">رقم المرجع / القيد</th>
                    <th className="p-3">الحالة التوفيقية</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.slice(0, 8).map(tx => (
                    <tr key={tx.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3">
                        {tx.transactionType === 'deposit' && (
                          <Badge variant="success">
                            <span className="flex items-center gap-1"><ArrowUpRight className="w-3 h-3" /> إيداع</span>
                          </Badge>
                        )}
                        {tx.transactionType === 'withdrawal' && (
                          <Badge variant="danger">
                            <span className="flex items-center gap-1"><ArrowDownLeft className="w-3 h-3" /> سحب / مصروف</span>
                          </Badge>
                        )}
                        {tx.transactionType === 'transfer' && (
                          <Badge variant="info">
                            <span className="flex items-center gap-1"><Repeat className="w-3 h-3" /> تحويل مالي</span>
                          </Badge>
                        )}
                      </td>
                      <td className="p-3 font-mono text-slate-600">{tx.date}</td>
                      <td className="p-3 font-mono font-black text-slate-900">
                        {formatAmount(tx.amount)}
                      </td>
                      <td className="p-3 text-slate-700 max-w-xs truncate">{tx.description}</td>
                      <td className="p-3 font-mono text-slate-500">{tx.referenceNumber || '-'}</td>
                      <td className="p-3">
                        {tx.reconciled ? (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">مسواة بنكياً ✓</span>
                        ) : (
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold">غير مسواة</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Cashboxes */}
      {activeTab === 'cashboxes' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h2 className="font-bold text-base text-slate-900">قائمة الصناديق والخزائن (Cash Boxes)</h2>
              <p className="text-xs text-slate-500">إدارة الخزائن النقدية الفرعية والرئيسية وتوزيع السيولة</p>
            </div>
            <button
              onClick={() => { setCashboxForm({ id: '', name: '', currentBalance: '0', status: 'open' }); setShowCashboxModal(true); }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow"
            >
              + إضافة خزينة جديدة
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cashboxes.map(box => (
              <div key={box.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3 relative hover:shadow-md transition">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-amber-600" />
                    <h3 className="font-bold text-sm text-slate-900">{box.name}</h3>
                  </div>
                  <Badge variant={box.status === 'open' ? 'success' : 'neutral'}>
                    {box.status === 'open' ? 'نشطة' : 'مغلقة'}
                  </Badge>
                </div>

                <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
                  <span className="text-xs text-slate-500 font-bold">الرصيد الحالي:</span>
                  <span className="font-mono font-black text-lg text-amber-700">{formatAmount(Number(box.currentBalance) || 0)}</span>
                </div>

                <div className="text-[10px] text-slate-400">
                  آخر تحديث: {box.lastOpenedAt ? new Date(box.lastOpenedAt).toLocaleDateString('ar-SA') : 'غير مسجل'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Bank Accounts */}
      {activeTab === 'bank_accounts' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h2 className="font-bold text-base text-slate-900">إدارة الحسابات البنكية (Bank Accounts)</h2>
              <p className="text-xs text-slate-500 font-bold">ربط الحسابات البنكية، أرقام الآيبان، والفرع بدليل الحسابات</p>
            </div>
            <button
              onClick={() => { setBankForm({ id: '', bankName: '', accountName: '', accountNumber: '', iban: '', swift: '', branch: '', currency: settings.currency || 'SAR', currentBalance: '0', accountId: 'acc_bank' }); setShowBankModal(true); }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow"
            >
              + إضافة حساب بنكي جديد
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bankAccounts.map(bank => (
              <div key={bank.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3 relative hover:shadow-md transition">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-blue-600" />
                    <h3 className="font-bold text-sm text-slate-900">{bank.bankName}</h3>
                  </div>
                  <span className="text-xs font-bold bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full">{bank.accountName}</span>
                </div>

                <div className="space-y-1 text-xs text-slate-600">
                  <div><span className="font-bold">رقم الحساب:</span> <span className="font-mono text-slate-800">{bank.accountNumber}</span></div>
                  {bank.iban && <div><span className="font-bold">IBAN:</span> <span className="font-mono text-slate-700 text-[11px]">{bank.iban}</span></div>}
                  {bank.branch && <div><span className="font-bold">الفرع:</span> {bank.branch}</div>}
                </div>

                <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
                  <span className="text-xs text-slate-500 font-bold">الرصيد الدفتري:</span>
                  <span className="font-mono font-black text-lg text-blue-700">{formatAmount(Number(bank.currentBalance) || 0)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Deposits */}
      {activeTab === 'deposits' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h2 className="font-bold text-base text-slate-900">سجل عمليات الإيداع المقبوضة (Deposits)</h2>
            <button
              onClick={() => { setFormError(''); setShowDepositModal(true); }}
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow"
            >
              + تسجيل إيداع جديد
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">التاريخ</th>
                  <th className="p-3">الجهة المستلمة</th>
                  <th className="p-3">مصدر الإيداع</th>
                  <th className="p-3">المبلغ</th>
                  <th className="p-3">البيان والتفاصيل</th>
                  <th className="p-3">رقم المرجع / القيد</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.filter(t => t.transactionType === 'deposit').map(t => (
                  <tr key={t.id} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-mono text-slate-600">{t.date}</td>
                    <td className="p-3 font-bold text-slate-800">{t.destinationType === 'cashbox' ? 'الخزينة' : 'حساب بنكي'}</td>
                    <td className="p-3 font-bold text-emerald-700">{t.sourceType}</td>
                    <td className="p-3 font-mono font-black text-emerald-600">{formatAmount(t.amount)}</td>
                    <td className="p-3 text-slate-700">{t.description}</td>
                    <td className="p-3 font-mono text-slate-500">{t.referenceNumber || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5: Withdrawals */}
      {activeTab === 'withdrawals' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h2 className="font-bold text-base text-slate-900">سجل عمليات السحب والمصروفات (Withdrawals)</h2>
            <button
              onClick={() => { setFormError(''); setShowWithdrawalModal(true); }}
              className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold shadow"
            >
              - تسجيل سحب / مصروف
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">التاريخ</th>
                  <th className="p-3">مصدر السحب</th>
                  <th className="p-3">الغرض / وجهة الصرف</th>
                  <th className="p-3">المبلغ</th>
                  <th className="p-3">البيان والتفاصيل</th>
                  <th className="p-3">رقم المرجع / القيد</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.filter(t => t.transactionType === 'withdrawal').map(t => (
                  <tr key={t.id} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-mono text-slate-600">{t.date}</td>
                    <td className="p-3 font-bold text-slate-800">{t.sourceType === 'cashbox' ? 'الخزينة' : 'حساب بنكي'}</td>
                    <td className="p-3 font-bold text-rose-700">{t.destinationType}</td>
                    <td className="p-3 font-mono font-black text-rose-600">{formatAmount(t.amount)}</td>
                    <td className="p-3 text-slate-700">{t.description}</td>
                    <td className="p-3 font-mono text-slate-500">{t.referenceNumber || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 6: Transfers */}
      {activeTab === 'transfers' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h2 className="font-bold text-base text-slate-900">سجل التحويلات بين الخزائن والحسابات البنكية (Transfers)</h2>
            <button
              onClick={() => { setFormError(''); setShowTransferModal(true); }}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow"
            >
              ⇄ إجراء تحويل مالي
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">التاريخ</th>
                  <th className="p-3">من (المصدر)</th>
                  <th className="p-3">إلى (المستلم)</th>
                  <th className="p-3">المبلغ المحول</th>
                  <th className="p-3">العمولة البنكية</th>
                  <th className="p-3">البيان</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.filter(t => t.transactionType === 'transfer').map(t => (
                  <tr key={t.id} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-mono text-slate-600">{t.date}</td>
                    <td className="p-3 font-bold text-slate-800">{t.sourceType}</td>
                    <td className="p-3 font-bold text-blue-700">{t.destinationType}</td>
                    <td className="p-3 font-mono font-black text-slate-900">{formatAmount(t.amount)}</td>
                    <td className="p-3 font-mono text-rose-600">{formatAmount(t.transferFee)}</td>
                    <td className="p-3 text-slate-700">{t.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 7: Bank Reconciliation */}
      {activeTab === 'reconciliation' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="font-bold text-base text-slate-900">التسوية البنكية والمطابقة المباشرة (Bank Reconciliation)</h2>
                <p className="text-xs text-slate-500 font-bold">مطابقة كشف الحساب البنكي مع دفتر الاستاد وتسوية الاختلافات والعمولات</p>
              </div>

              {/* Bank Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">اختر الحساب البنكي:</span>
                <select
                  value={selectedReconcileBankId}
                  onChange={(e) => setSelectedReconcileBankId(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold px-3 py-2 focus:ring-2 focus:ring-emerald-500"
                >
                  {bankAccounts.map(b => (
                    <option key={b.id} value={b.id}>{b.bankName} - {b.accountName} ({formatAmount(Number(b.currentBalance) || 0)})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Reconciliation Controls Form */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">تاريخ كشف الحساب البنكي:</label>
                <input
                  type="date"
                  value={statementDate}
                  onChange={(e) => setStatementDate(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2 font-mono font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">الرصيد الختامي بكشف الحساب البنكي:</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={statementEndingBalance}
                  onChange={(e) => setStatementEndingBalance(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2 font-mono font-bold text-blue-700"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">الرصيد الدفتري الحالي بالنظام:</label>
                <div className="bg-white border border-slate-200 rounded-xl p-2 font-mono font-black text-slate-900 text-sm">
                  {formatAmount(Number(bankAccounts.find(b => b.id === selectedReconcileBankId)?.currentBalance || 0))}
                </div>
              </div>
            </div>

            {/* Unreconciled Transactions Checklist */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-xs text-slate-800">الحركات غير المسواة المسجلة بالنظام (حدد المعاملات المطابقة بكشف الحساب):</h3>
                <span className="text-xs font-bold text-emerald-600">المحدد: {selectedTxIds.length} معاملة</span>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 max-h-80 overflow-y-auto">
                {unreconciledTx.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs font-bold">
                    ✓ جميع المعاملات لهذا الحساب مسواة بنكياً ومطابقة بجميع السجلات.
                  </div>
                ) : (
                  unreconciledTx.map(tx => (
                    <div key={tx.id} className="p-3 hover:bg-slate-50 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedTxIds.includes(tx.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTxIds(prev => [...prev, tx.id]);
                            } else {
                              setSelectedTxIds(prev => prev.filter(id => id !== tx.id));
                            }
                          }}
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <div>
                          <span className="font-bold text-slate-800">{tx.description}</span>
                          <span className="text-slate-400 mr-2 font-mono">({tx.date})</span>
                        </div>
                      </div>

                      <div className="font-mono font-black text-slate-900">
                        {formatAmount(tx.amount)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={handleExecuteReconciliation}
                disabled={!statementEndingBalance}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow transition disabled:opacity-50 flex items-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>إعتماد إتمام التسوية البنكية 🎯</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deposit Modal */}
      {showDepositModal && (
        <Modal title="تسجيل إيداع جديد (New Deposit)" isOpen={showDepositModal} onClose={() => setShowDepositModal(false)}>
          <form onSubmit={handleDepositSubmit} className="space-y-4 text-xs text-right">
            {formError && <div className="p-3 bg-rose-50 text-rose-700 rounded-xl font-bold">{formError}</div>}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">نوع المستلم (جهة الإيداع):</label>
                <select
                  value={depositForm.destinationType}
                  onChange={(e) => setDepositForm(prev => ({ ...prev, destinationType: e.target.value as any }))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold"
                >
                  <option value="cashbox">خزينة / صندوق نقدي</option>
                  <option value="bank_account">حساب بنكي</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">اختر الخزينة / البنك المستلم:</label>
                <select
                  value={depositForm.destinationId}
                  onChange={(e) => setDepositForm(prev => ({ ...prev, destinationId: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold"
                >
                  {depositForm.destinationType === 'cashbox' ? (
                    cashboxes.map(c => <option key={c.id} value={c.id}>{c.name} ({formatAmount(Number(c.currentBalance) || 0)})</option>)
                  ) : (
                    bankAccounts.map(b => <option key={b.id} value={b.id}>{b.bankName} - {b.accountName}</option>)
                  )}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">مصدر الإيداع:</label>
                <select
                  value={depositForm.sourceType}
                  onChange={(e) => setDepositForm(prev => ({ ...prev, sourceType: e.target.value as any }))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold"
                >
                  <option value="revenue">إيرادات مبيعات / خدمات</option>
                  <option value="customer">دفعة من عميل (ذمم مدمجة)</option>
                  <option value="capital">ضخ رأس مال / مساهمين</option>
                  <option value="other">إيرادات أخرى متنوعة</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">مبلغ الإيداع:</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={depositForm.amount}
                  onChange={(e) => setDepositForm(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono font-black text-emerald-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">التاريخ:</label>
                <input
                  type="date"
                  value={depositForm.date}
                  onChange={(e) => setDepositForm(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">رقم المرجع / الشيك:</label>
                <input
                  type="text"
                  placeholder="اختياري..."
                  value={depositForm.referenceNumber}
                  onChange={(e) => setDepositForm(prev => ({ ...prev, referenceNumber: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">البيان / الوصف:</label>
              <textarea
                rows={2}
                placeholder="أدخل تفاصيل الإيداع..."
                value={depositForm.description}
                onChange={(e) => setDepositForm(prev => ({ ...prev, description: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button type="button" onClick={() => setShowDepositModal(false)} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl font-bold">إلغاء</button>
              <button type="submit" className="px-5 py-2 bg-emerald-600 text-white rounded-xl font-bold shadow">+ تأكيد الإيداع والقيد</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Withdrawal Modal */}
      {showWithdrawalModal && (
        <Modal title="تسجيل سحب / مصروف جديد (Withdrawal & Expense)" isOpen={showWithdrawalModal} onClose={() => setShowWithdrawalModal(false)}>
          <form onSubmit={handleWithdrawalSubmit} className="space-y-4 text-xs text-right">
            {formError && <div className="p-3 bg-rose-50 text-rose-700 rounded-xl font-bold">{formError}</div>}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">مصدر السحب:</label>
                <select
                  value={withdrawalForm.sourceType}
                  onChange={(e) => setWithdrawalForm(prev => ({ ...prev, sourceType: e.target.value as any }))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold"
                >
                  <option value="cashbox">خزينة / صندوق نقدي</option>
                  <option value="bank_account">حساب بنكي</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">اختر الخزينة / البنك المصدر:</label>
                <select
                  value={withdrawalForm.sourceId}
                  onChange={(e) => setWithdrawalForm(prev => ({ ...prev, sourceId: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold"
                >
                  {withdrawalForm.sourceType === 'cashbox' ? (
                    cashboxes.map(c => <option key={c.id} value={c.id}>{c.name} ({formatAmount(Number(c.currentBalance) || 0)})</option>)
                  ) : (
                    bankAccounts.map(b => <option key={b.id} value={b.id}>{b.bankName} - {b.accountName}</option>)
                  )}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">الغرض / وجهة السحب:</label>
                <select
                  value={withdrawalForm.destinationType}
                  onChange={(e) => setWithdrawalForm(prev => ({ ...prev, destinationType: e.target.value as any }))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold"
                >
                  <option value="expense">مصروفات تشغيلية / عامة</option>
                  <option value="supplier">سداد الموردين (ذمم دائنة)</option>
                  <option value="owner_draw">مسحوبات شخصية / الشركاء</option>
                  <option value="other">مصروفات أخرى</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">مبلغ السحب:</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={withdrawalForm.amount}
                  onChange={(e) => setWithdrawalForm(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono font-black text-rose-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">التاريخ:</label>
                <input
                  type="date"
                  value={withdrawalForm.date}
                  onChange={(e) => setWithdrawalForm(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">رقم المرجع / الشيك:</label>
                <input
                  type="text"
                  placeholder="اختياري..."
                  value={withdrawalForm.referenceNumber}
                  onChange={(e) => setWithdrawalForm(prev => ({ ...prev, referenceNumber: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">البيان / السبب:</label>
              <textarea
                rows={2}
                placeholder="أدخل سبب السحب أو تفاصيل المصروف..."
                value={withdrawalForm.description}
                onChange={(e) => setWithdrawalForm(prev => ({ ...prev, description: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button type="button" onClick={() => setShowWithdrawalModal(false)} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl font-bold">إلغاء</button>
              <button type="submit" className="px-5 py-2 bg-rose-600 text-white rounded-xl font-bold shadow">- تأكيد السحب والصرف</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Transfer Modal */}
      {showTransferModal && (
        <Modal title="تحويل مالي بين الخزائن والبنوك (Internal Transfer)" isOpen={showTransferModal} onClose={() => setShowTransferModal(false)}>
          <form onSubmit={handleTransferSubmit} className="space-y-4 text-xs text-right">
            {formError && <div className="p-3 bg-rose-50 text-rose-700 rounded-xl font-bold">{formError}</div>}

            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <label className="font-bold text-slate-700 block mb-1">من (الحساب/الخزينة المحول منها):</label>
                <select
                  value={transferForm.sourceId}
                  onChange={(e) => setTransferForm(prev => ({ ...prev, sourceId: e.target.value }))}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2 font-bold"
                >
                  <optgroup label="الخزائن والصناديق">
                    {cashboxes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </optgroup>
                  <optgroup label="الحسابات البنكية">
                    {bankAccounts.map(b => <option key={b.id} value={b.id}>{b.bankName} - {b.accountName}</option>)}
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">إلى (الحساب/الخزينة المحول إليها):</label>
                <select
                  value={transferForm.destinationId}
                  onChange={(e) => setTransferForm(prev => ({ ...prev, destinationId: e.target.value }))}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2 font-bold"
                >
                  <optgroup label="الحسابات البنكية">
                    {bankAccounts.map(b => <option key={b.id} value={b.id}>{b.bankName} - {b.accountName}</option>)}
                  </optgroup>
                  <optgroup label="الخزائن والصناديق">
                    {cashboxes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </optgroup>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">المبلغ المحول:</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={transferForm.amount}
                  onChange={(e) => setTransferForm(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono font-black text-blue-700"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">رسوم / عمولة التحويل البنكي:</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={transferForm.transferFee}
                  onChange={(e) => setTransferForm(prev => ({ ...prev, transferFee: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono text-slate-700"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">ملاحظات / سبب التحويل:</label>
              <textarea
                rows={2}
                placeholder="أدخل تفاصيل التحويل..."
                value={transferForm.description}
                onChange={(e) => setTransferForm(prev => ({ ...prev, description: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button type="button" onClick={() => setShowTransferModal(false)} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl font-bold">إلغاء</button>
              <button type="submit" className="px-5 py-2 bg-blue-600 text-white rounded-xl font-bold shadow">⇄ تنفيذ التحويل المالي</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Cashbox Create/Edit Modal */}
      {showCashboxModal && (
        <Modal title="إضافة خزينة / صندوق نقدي جديد" isOpen={showCashboxModal} onClose={() => setShowCashboxModal(false)}>
          <form onSubmit={handleCashboxSave} className="space-y-4 text-xs text-right">
            <div>
              <label className="font-bold text-slate-700 block mb-1">اسم الخزينة:</label>
              <input
                type="text"
                required
                placeholder="مثال: الخزينة الفرعية - المعرض..."
                value={cashboxForm.name}
                onChange={(e) => setCashboxForm(prev => ({ ...prev, name: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">الرصيد الافتتاحي:</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={cashboxForm.currentBalance}
                onChange={(e) => setCashboxForm(prev => ({ ...prev, currentBalance: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono font-bold"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button type="button" onClick={() => setShowCashboxModal(false)} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl font-bold">إلغاء</button>
              <button type="submit" className="px-5 py-2 bg-emerald-600 text-white rounded-xl font-bold shadow">حفظ الخزينة</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Bank Account Create/Edit Modal */}
      {showBankModal && (
        <Modal title="إضافة حساب بنكي جديد" isOpen={showBankModal} onClose={() => setShowBankModal(false)}>
          <form onSubmit={handleBankSave} className="space-y-4 text-xs text-right">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">اسم البنك:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: مصرف الراجحي..."
                  value={bankForm.bankName}
                  onChange={(e) => setBankForm(prev => ({ ...prev, bankName: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">اسم الحساب / صاحب الحساب:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: الحساب الجاري الموحد..."
                  value={bankForm.accountName}
                  onChange={(e) => setBankForm(prev => ({ ...prev, accountName: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">رقم الحساب:</label>
                <input
                  type="text"
                  required
                  placeholder="رقم الحساب البنكي..."
                  value={bankForm.accountNumber}
                  onChange={(e) => setBankForm(prev => ({ ...prev, accountNumber: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">الآيبان (IBAN):</label>
                <input
                  type="text"
                  placeholder="SA00 0000 0000 0000..."
                  value={bankForm.iban}
                  onChange={(e) => setBankForm(prev => ({ ...prev, iban: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">الرصيد الافتتاحي:</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={bankForm.currentBalance}
                  onChange={(e) => setBankForm(prev => ({ ...prev, currentBalance: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">كود السويفت (SWIFT):</label>
                <input
                  type="text"
                  placeholder="اختياري..."
                  value={bankForm.swift}
                  onChange={(e) => setBankForm(prev => ({ ...prev, swift: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button type="button" onClick={() => setShowBankModal(false)} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl font-bold">إلغاء</button>
              <button type="submit" className="px-5 py-2 bg-blue-600 text-white rounded-xl font-bold shadow">حفظ الحساب البنكي</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
