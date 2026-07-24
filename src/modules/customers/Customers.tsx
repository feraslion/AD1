import React, { useState, useEffect } from 'react';
import { Customer, CustomerPayment, StoreSettings } from '../../types';
import { CustomerService, PaymentService } from '../../services/api';
import CustomerFormModal from './CustomerFormModal';
import CustomerLedgerModal from './CustomerLedgerModal';
import CustomerPaymentModal from './CustomerPaymentModal';
import CustomerHistoryModal from './CustomerHistoryModal';
import DebtAgingView from './DebtAgingView';
import {
  Users, UserPlus, Search, Filter, RefreshCw, FileText, Receipt,
  Phone, Mail, Building, ShieldAlert, CheckCircle2, DollarSign,
  Clock, AlertCircle, Edit, Trash2, ArrowUpRight, PlusCircle, Tag,
  Building2, Wallet
} from 'lucide-react';

interface CustomersProps {
  settings: StoreSettings;
}

export default function Customers({ settings }: CustomersProps) {
  const [activeTab, setActiveTab] = useState<'list' | 'aging' | 'payments' | 'exceeded'>('list');
  const [customersList, setCustomersList] = useState<Customer[]>([]);
  const [paymentsList, setPaymentsList] = useState<CustomerPayment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [isLedgerModalOpen, setIsLedgerModalOpen] = useState<boolean>(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [cList, pList] = await Promise.all([
        CustomerService.getCustomers(),
        PaymentService.getCustomerPayments()
      ]);
      setCustomersList(cList || []);
      setPaymentsList(pList || []);
    } catch (err) {
      console.error('Error loading CRM data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveCustomer = async (c: Customer) => {
    await CustomerService.createCustomer(c);
    await loadData();
  };

  const handleDeleteCustomer = async (id: string, name: string) => {
    if (window.confirm(`هل أنت تأكد من إزالة العميل "${name}"؟`)) {
      try {
        await CustomerService.deleteCustomer(id);
        await loadData();
      } catch (err: any) {
        alert(err.message || 'فشل حذف العميل');
      }
    }
  };

  // Filtered customers
  const filteredCustomers = customersList.filter(c => {
    const matchesSearch = !searchTerm ||
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.phone && c.phone.includes(searchTerm)) ||
      (c.taxNumber && c.taxNumber.includes(searchTerm));

    const matchesType = typeFilter === 'all' || (c.type || 'retail') === typeFilter;
    const matchesStatus = statusFilter === 'all' || (c.status || 'active') === statusFilter;

    if (activeTab === 'exceeded') {
      const isExceeded = c.balance > (c.creditLimit || 5000);
      return matchesSearch && matchesType && matchesStatus && isExceeded;
    }

    return matchesSearch && matchesType && matchesStatus;
  });

  // Global KPIs
  const totalCustomers = customersList.length;
  const totalDebts = customersList.reduce((acc, c) => acc + (c.balance > 0 ? c.balance : 0), 0);
  const debtorCustomersCount = customersList.filter(c => c.balance > 0).length;
  const exceededLimitCount = customersList.filter(c => c.balance > (c.creditLimit || 5000)).length;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto text-xs">
      
      {/* Page Title & Main Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-2xl border border-emerald-500/20">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">إدارة العملاء والـ CRM</h1>
            <p className="text-slate-500 text-xs mt-0.5">متابعة أرصدة العملاء، كشوف الحسابات، أسقف الائتمان، وسندات القبض</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setSelectedCustomer(null);
              setIsFormModalOpen(true);
            }}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ إضافة عميل جديد</span>
          </button>

          <button
            onClick={() => {
              if (customersList.length > 0) {
                setSelectedCustomer(customersList[0]);
                setIsPaymentModalOpen(true);
              } else {
                alert('يرجى إضافة عميل أولاً لإصدار سند قبض');
              }
            }}
            className="px-4 py-2.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold rounded-xl flex items-center gap-2 transition"
          >
            <Receipt className="w-4 h-4 text-emerald-400" />
            <span>+ سند قبض مالي</span>
          </button>
        </div>
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-slate-500 font-bold block mb-1">إجمالي العملاء المسجلين</span>
            <div className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100">{totalCustomers} عميل</div>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-slate-500 font-bold block mb-1">إجمالي المديونيات المستحقة</span>
            <div className="text-2xl font-black font-mono text-rose-600 dark:text-rose-400">
              {totalDebts.toFixed(2)} <span className="text-xs font-normal">{settings.currency}</span>
            </div>
          </div>
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-600 rounded-xl">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-slate-500 font-bold block mb-1">عدد العملاء المدينين</span>
            <div className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400">{debtorCustomersCount} عميل</div>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-600 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-slate-500 font-bold block mb-1">تجاوز سقف الائتمان</span>
            <div className="text-2xl font-black font-mono text-rose-700 dark:text-rose-500">{exceededLimitCount} عميل</div>
          </div>
          <div className="p-3 bg-rose-100 dark:bg-rose-900/50 text-rose-700 rounded-xl">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Module Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab('list')}
          className={`px-5 py-3 font-extrabold flex items-center gap-2 border-b-2 transition text-xs ${
            activeTab === 'list'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>قائمة العملاء ({customersList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('aging')}
          className={`px-5 py-3 font-extrabold flex items-center gap-2 border-b-2 transition text-xs ${
            activeTab === 'aging'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>تحليل أعمار الديون</span>
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={`px-5 py-3 font-extrabold flex items-center gap-2 border-b-2 transition text-xs ${
            activeTab === 'payments'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>سندات القبض المسجلة ({paymentsList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('exceeded')}
          className={`px-5 py-3 font-extrabold flex items-center gap-2 border-b-2 transition text-xs ${
            activeTab === 'exceeded'
              ? 'border-rose-600 text-rose-600 dark:text-rose-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-rose-500" />
          <span>المتجاوزين للسقف ({exceededLimitCount})</span>
        </button>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'aging' ? (
        <DebtAgingView
          settings={settings}
          onOpenLedger={(c) => {
            setSelectedCustomer(c);
            setIsLedgerModalOpen(true);
          }}
          onOpenPayment={(c) => {
            setSelectedCustomer(c);
            setIsPaymentModalOpen(true);
          }}
        />
      ) : activeTab === 'payments' ? (
        /* Payments Tab Table */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
            <h3 className="font-extrabold text-sm">سجل سندات المقبوضات النقدية والبنكية</h3>
            <button
              onClick={loadData}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-black border-b border-slate-200 dark:border-slate-700">
                  <th className="p-3">رقم السند</th>
                  <th className="p-3">التاريخ</th>
                  <th className="p-3">معرف العميل</th>
                  <th className="p-3 text-emerald-600">المبلغ المحصل</th>
                  <th className="p-3">طريقة الدفع</th>
                  <th className="p-3">المرجع</th>
                  <th className="p-3">الملاحظات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {paymentsList.map(pmt => (
                  <tr key={pmt.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                    <td className="p-3 font-mono font-bold text-slate-900 dark:text-slate-100">{pmt.receiptNumber}</td>
                    <td className="p-3 font-mono">{pmt.date}</td>
                    <td className="p-3 font-mono text-slate-600 dark:text-slate-400">{pmt.customerId}</td>
                    <td className="p-3 font-mono font-black text-emerald-600 text-sm">
                      {pmt.amount.toFixed(2)} {settings.currency}
                    </td>
                    <td className="p-3 font-bold">
                      {pmt.paymentMethod === 'cash' ? 'نقداً (كاش)' : pmt.paymentMethod === 'bank' ? 'تحويل بنكي' : 'بطاقة شبكة'}
                    </td>
                    <td className="p-3 font-mono">{pmt.reference || '-'}</td>
                    <td className="p-3 text-slate-500 max-w-xs truncate">{pmt.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Customers List / Exceeded Tab */
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-[300px]">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="بحث باسم العميل، رقم الجوال، أو الرقم الضريبي..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-3 pr-9 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
                <Search className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
              </div>

              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
                <Tag className="w-4 h-4 text-slate-400" />
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="bg-transparent focus:outline-hidden font-bold"
                >
                  <option value="all">جميع التصنيفات</option>
                  <option value="retail">تجزئة</option>
                  <option value="wholesale">جملة</option>
                  <option value="company">شركات</option>
                  <option value="vip">مميز VIP</option>
                </select>
              </div>

              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-transparent focus:outline-hidden font-bold"
                >
                  <option value="all">جميع الحالات</option>
                  <option value="active">نشط 🟢</option>
                  <option value="inactive">غير نشط ⚪</option>
                  <option value="blocked">موقوف 🔴</option>
                </select>
              </div>
            </div>

            <button
              onClick={loadData}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl flex items-center gap-2 transition"
            >
              <RefreshCw className="w-4 h-4 text-emerald-500" />
              <span>تحديث البيانات</span>
            </button>
          </div>

          {/* Customers Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
            {isLoading ? (
              <div className="py-20 text-center text-slate-500">جاري تحميل سجلات العملاء...</div>
            ) : filteredCustomers.length === 0 ? (
              <div className="py-20 text-center text-slate-400">
                لا يوجد عملاء مطابقين لمعايير البحث الحالية.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-black border-b border-slate-200 dark:border-slate-700">
                      <th className="p-3">بيانات العميل</th>
                      <th className="p-3">التصنيف</th>
                      <th className="p-3">الرقم الضريبي / CR</th>
                      <th className="p-3">سقف الائتمان</th>
                      <th className="p-3">الرصيد المستحق (المديونية)</th>
                      <th className="p-3">الحالة</th>
                      <th className="p-3 text-center">الإجراءات والخدمات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {filteredCustomers.map(cust => {
                      const isOverLimit = cust.balance > (cust.creditLimit || 5000);

                      return (
                        <tr key={cust.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                          <td className="p-3">
                            <p className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">{cust.name}</p>
                            <div className="flex items-center gap-3 text-slate-400 text-[10px] font-mono mt-0.5">
                              {cust.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{cust.phone}</span>}
                              {cust.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{cust.email}</span>}
                            </div>
                          </td>

                          <td className="p-3">
                            <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-extrabold">
                              {cust.type === 'wholesale' ? 'جملة' : cust.type === 'company' ? 'شركات' : cust.type === 'vip' ? 'مميز VIP' : 'تجزئة'}
                            </span>
                          </td>

                          <td className="p-3 font-mono text-slate-600 dark:text-slate-400">
                            {cust.taxNumber ? (
                              <div>
                                <span className="block font-bold text-slate-800 dark:text-slate-200">{cust.taxNumber}</span>
                                {cust.crNumber && <span className="text-[10px] text-slate-400">CR: {cust.crNumber}</span>}
                              </div>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>

                          <td className="p-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                            {(cust.creditLimit || 5000).toFixed(2)} {settings.currency}
                          </td>

                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <span className={`font-mono font-black text-sm ${
                                cust.balance > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600'
                              }`}>
                                {cust.balance.toFixed(2)} {settings.currency}
                              </span>
                              {isOverLimit && (
                                <span className="p-1 bg-rose-100 text-rose-700 rounded-md" title="متجاوز لسقف الائتمان!">
                                  <ShieldAlert className="w-3.5 h-3.5" />
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                              cust.status === 'blocked'
                                ? 'bg-rose-100 text-rose-800'
                                : cust.status === 'inactive'
                                ? 'bg-slate-100 text-slate-600'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {cust.status === 'blocked' ? 'موقوف 🔴' : cust.status === 'inactive' ? 'غير نشط ⚪' : 'نشط 🟢'}
                            </span>
                          </td>

                          <td className="p-3">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Payment receipt button */}
                              <button
                                onClick={() => {
                                  setSelectedCustomer(cust);
                                  setIsPaymentModalOpen(true);
                                }}
                                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 transition shadow-2xs"
                                title="إصدار سند قبض"
                              >
                                <Receipt className="w-3.5 h-3.5" />
                                <span>سند قبض</span>
                              </button>

                              {/* Ledger button */}
                              <button
                                onClick={() => {
                                  setSelectedCustomer(cust);
                                  setIsLedgerModalOpen(true);
                                }}
                                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-bold text-[11px] flex items-center gap-1 transition"
                                title="كشف الحساب"
                              >
                                <FileText className="w-3.5 h-3.5 text-blue-500" />
                                <span>كشف الحساب</span>
                              </button>

                              {/* History button */}
                              <button
                                onClick={() => {
                                  setSelectedCustomer(cust);
                                  setIsHistoryModalOpen(true);
                                }}
                                className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition"
                                title="تاريخ المشتريات"
                              >
                                <Clock className="w-3.5 h-3.5" />
                              </button>

                              {/* Edit button */}
                              <button
                                onClick={() => {
                                  setSelectedCustomer(cust);
                                  setIsFormModalOpen(true);
                                }}
                                className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition"
                                title="تعديل البيانات"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete button */}
                              <button
                                onClick={() => handleDeleteCustomer(cust.id, cust.name)}
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition"
                                title="حذف العميل"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Customer Form Modal */}
      <CustomerFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSave={handleSaveCustomer}
        customer={selectedCustomer}
      />

      {/* Customer Ledger Modal (كشف حساب) */}
      <CustomerLedgerModal
        isOpen={isLedgerModalOpen}
        onClose={() => setIsLedgerModalOpen(false)}
        customer={selectedCustomer}
        settings={settings}
        onOpenPaymentModal={(c) => {
          setSelectedCustomer(c);
          setIsPaymentModalOpen(true);
        }}
      />

      {/* Customer Payment Modal (سند قبض) */}
      <CustomerPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        customer={selectedCustomer}
        settings={settings}
        onPaymentSuccess={loadData}
      />

      {/* Customer History Modal */}
      <CustomerHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        customer={selectedCustomer}
        settings={settings}
      />
    </div>
  );
}
