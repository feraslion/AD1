import React, { useState, useEffect } from 'react';
import { Customer } from '../../types';
import { X, UserPlus, Save, Building, FileText, Phone, Mail, MapPin, DollarSign, ShieldAlert, Tag } from 'lucide-react';

interface CustomerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (customer: Customer) => Promise<void> | void;
  customer?: Customer | null;
}

export default function CustomerFormModal({ isOpen, onClose, onSave, customer }: CustomerFormModalProps) {
  const [formData, setFormData] = useState<Partial<Customer>>({
    name: '',
    phone: '',
    email: '',
    taxNumber: '',
    crNumber: '',
    address: '',
    type: 'retail',
    creditLimit: 5000,
    openingBalance: 0,
    status: 'active',
    notes: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (customer) {
      setFormData({
        id: customer.id,
        name: customer.name || '',
        phone: customer.phone || '',
        email: customer.email || '',
        taxNumber: customer.taxNumber || '',
        crNumber: customer.crNumber || '',
        address: customer.address || '',
        type: customer.type || 'retail',
        creditLimit: customer.creditLimit ?? 5000,
        openingBalance: customer.openingBalance ?? 0,
        balance: customer.balance ?? 0,
        status: customer.status || 'active',
        notes: customer.notes || ''
      });
    } else {
      setFormData({
        name: '',
        phone: '',
        email: '',
        taxNumber: '',
        crNumber: '',
        address: '',
        type: 'retail',
        creditLimit: 5000,
        openingBalance: 0,
        balance: 0,
        status: 'active',
        notes: ''
      });
    }
    setErrorMsg('');
  }, [customer, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      setErrorMsg('اسم العميل مطلوب بشكل أساسي');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');
      const customerToSave: Customer = {
        id: formData.id || 'cust_' + Math.random().toString(36).substring(2, 9),
        name: formData.name.trim(),
        phone: formData.phone?.trim() || '',
        email: formData.email?.trim() || '',
        taxNumber: formData.taxNumber?.trim() || '',
        crNumber: formData.crNumber?.trim() || '',
        address: formData.address?.trim() || '',
        type: formData.type || 'retail',
        creditLimit: Number(formData.creditLimit) || 0,
        openingBalance: Number(formData.openingBalance) || 0,
        balance: formData.id ? (formData.balance ?? 0) : (Number(formData.openingBalance) || 0),
        status: formData.status || 'active',
        notes: formData.notes?.trim() || ''
      };

      await onSave(customerToSave);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ أثناء حفظ بيانات العميل');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base">
                {customer ? 'تعديل بيانات العميل' : 'إضافة عميل جديد'}
              </h3>
              <p className="text-xs text-slate-400">سجل بيانات التواصل، السجل التجاري، وسقف الائتمان</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                اسم العميل / الشركة <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="مثال: شركة الأفق للتجارة / أحمد محمد"
                  className="w-full pl-3 pr-9 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-medium"
                />
                <Building className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                رقم الجوال / الهاتف
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="05xxxxxxx"
                  className="w-full pl-3 pr-9 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono"
                />
                <Phone className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                البريد الإلكتروني
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="customer@domain.com"
                  className="w-full pl-3 pr-9 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden dir-ltr text-right"
                />
                <Mail className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                تصنيف العميل
              </label>
              <div className="relative">
                <select
                  value={formData.type || 'retail'}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full pl-3 pr-9 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-bold"
                >
                  <option value="retail">عميل تجزئة (عادي)</option>
                  <option value="wholesale">عميل جملة</option>
                  <option value="company">شركات / مؤسسات</option>
                  <option value="vip">عميل مميز (VIP)</option>
                </select>
                <Tag className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
              </div>
            </div>
          </div>

          {/* Section 2: Tax & CR details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                الرقم الضريبي (15 رقم)
              </label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={15}
                  value={formData.taxNumber || ''}
                  onChange={(e) => setFormData({ ...formData, taxNumber: e.target.value })}
                  placeholder="300000000000003"
                  className="w-full pl-3 pr-9 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono"
                />
                <FileText className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                رقم السجل التجاري (CR)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.crNumber || ''}
                  onChange={(e) => setFormData({ ...formData, crNumber: e.target.value })}
                  placeholder="1010xxxxxx"
                  className="w-full pl-3 pr-9 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono"
                />
                <Building className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
              </div>
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
              العنوان الوطني / التفصيلي
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.address || ''}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="الرياض، حي الملز، الشارع العام"
                className="w-full pl-3 pr-9 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
              <MapPin className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
            </div>
          </div>

          {/* Section 3: Financial Parameters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                سقف الائتمان (ر.س)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={formData.creditLimit ?? 5000}
                  onChange={(e) => setFormData({ ...formData, creditLimit: parseFloat(e.target.value) || 0 })}
                  className="w-full pl-3 pr-9 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono font-bold text-amber-600"
                />
                <DollarSign className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
              </div>
            </div>

            {!customer && (
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                  الرصيد الافتتاحي (ر.س)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    value={formData.openingBalance ?? 0}
                    onChange={(e) => setFormData({ ...formData, openingBalance: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-3 pr-9 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono font-bold"
                  />
                  <DollarSign className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
                </div>
              </div>
            )}

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                حالة العميل
              </label>
              <select
                value={formData.status || 'active'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-bold"
              >
                <option value="active">نشط 🟢</option>
                <option value="inactive">غير نشط ⚪</option>
                <option value="blocked">موقوف / محظور 🔴</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
              ملاحظات إضافية
            </label>
            <textarea
              rows={2}
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="أي ملاحظات خاصة بشروط السداد، والشخص المسؤول..."
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          {/* Footer controls */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition"
            >
              إلغاء
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'جاري الحفظ...' : customer ? 'تحديث البيانات' : 'حفظ العميل'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
