import React, { useState } from 'react';
import { X, Share2, MessageCircle, Send, Phone, Mail, Copy, Check, ExternalLink, Globe, Facebook, Twitter, Linkedin } from 'lucide-react';
import { Customer, Invoice } from '../../../types';

interface SocialShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers?: Customer[];
  invoice?: Invoice | null;
}

export const SocialShareModal: React.FC<SocialShareModalProps> = ({
  isOpen,
  onClose,
  customers = [],
  invoice
}) => {
  const [phoneNumber, setPhoneNumber] = useState<string>(
    invoice?.customerPhone || (customers.length > 0 ? customers[0].phone : '') || ''
  );
  const [customerName, setCustomerName] = useState<string>(
    invoice?.customerName || (customers.length > 0 ? customers[0].name : '') || 'العميل العزيز'
  );
  const [messageTemplate, setMessageTemplate] = useState<'invoice' | 'statement' | 'quote' | 'welcome' | 'custom'>('invoice');
  const [customMessage, setCustomMessage] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  // Formatting phone number for WhatsApp wa.me link
  const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
  const formattedPhone = cleanPhone.startsWith('0') ? '966' + cleanPhone.slice(1) : cleanPhone;

  // Build template messages
  const getBuiltMessage = (): string => {
    if (messageTemplate === 'custom') {
      return customMessage || `مرحباً ${customerName}، يسعدنا التواصل معكم عبر نظام AD1 ERP.`;
    }
    if (messageTemplate === 'invoice' && invoice) {
      return `مرحباً ${customerName} 👋\nتفضلو بفاتورة الشراء رقم: #${invoice.id.slice(-6)}\nالمبلغ الإجمالي: ${invoice.totalAmount.toFixed(2)} ر.س شامل الضريبة (15%).\nنشكر لكم تعاملكم معنا 🌸\nمتجرنا: AD1 ERP`;
    }
    if (messageTemplate === 'invoice' && !invoice) {
      return `مرحباً ${customerName} 👋\nتم إصدار فاتورتك بنجاح من نظام الكاشير.\nنشكر لكم تعاملكم الراقي معنا!`;
    }
    if (messageTemplate === 'statement') {
      return `مرحباً ${customerName} 👋\nإليكم كشف حساب ملخص لجميع التعاملات المالية والمستحقات الحالية.\nلأي استفسار نرجو التواصل عبر الواتساب.`;
    }
    if (messageTemplate === 'quote') {
      return `مرحباً ${customerName} 👋\nمرفق لكم عرض السعر والمنتجات المطلوبة من نظامنا.\nيرجى الاطلاع والاعتماد ليصلكم في أقرب وقت.`;
    }
    if (messageTemplate === 'welcome') {
      return `مرحباً بك أ/ ${customerName} في عائلة عملائنا المميزين! ✨\nتم تسجيل حسابكم بنجاح في نظام المبيعات والخدمات.`;
    }
    return '';
  };

  const finalMessage = getBuiltMessage();
  const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(finalMessage)}`;
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent('https://ad1-erp.app')}&text=${encodeURIComponent(finalMessage)}`;
  const mailtoUrl = `mailto:?subject=${encodeURIComponent('رسالة من نظام الكاشير')}&body=${encodeURIComponent(finalMessage)}`;

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(finalMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col dir-rtl text-right">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">اختصارات الواتساب والتواصل الاجتماعي</h3>
              <p className="text-xs text-slate-400">إرسال الفواتير والرسائل مباشرة للعملاء (Alt+W)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Recipient Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">اسم العميل:</label>
              <input
                type="text"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                placeholder="أدخل اسم العميل"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">رقم الواتساب / الهاتف:</label>
              <input
                type="text"
                value={phoneNumber}
                onChange={e => setPhoneNumber(e.target.value)}
                placeholder="05xxxxxxx أو 9665xxxxxxx"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:border-emerald-500 text-left dir-ltr"
              />
            </div>
          </div>

          {/* Quick Select Customer if available */}
          {customers.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">اختيار سريع من قائمة العملاء:</label>
              <select
                onChange={e => {
                  const cust = customers.find(c => c.id === e.target.value);
                  if (cust) {
                    setCustomerName(cust.name);
                    setPhoneNumber(cust.phone);
                  }
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:outline-none text-slate-700"
              >
                <option value="">-- اختر عميلاً مسجلاً --</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} - {c.phone}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Template Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">نوع الرسالة النموذجية:</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                onClick={() => setMessageTemplate('invoice')}
                className={`py-2 px-2.5 rounded-lg text-xs font-bold transition border text-center ${
                  messageTemplate === 'invoice' ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                🧾 إرسال فاتورة
              </button>
              <button
                onClick={() => setMessageTemplate('statement')}
                className={`py-2 px-2.5 rounded-lg text-xs font-bold transition border text-center ${
                  messageTemplate === 'statement' ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                📊 كشف حساب
              </button>
              <button
                onClick={() => setMessageTemplate('quote')}
                className={`py-2 px-2.5 rounded-lg text-xs font-bold transition border text-center ${
                  messageTemplate === 'quote' ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                📄 عرض سعر
              </button>
              <button
                onClick={() => setMessageTemplate('welcome')}
                className={`py-2 px-2.5 rounded-lg text-xs font-bold transition border text-center ${
                  messageTemplate === 'welcome' ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                ✨ ترحيب بعميل
              </button>
              <button
                onClick={() => setMessageTemplate('custom')}
                className={`col-span-2 py-2 px-2.5 rounded-lg text-xs font-bold transition border text-center ${
                  messageTemplate === 'custom' ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                ✍️ نص مخصص للعميل
              </button>
            </div>
          </div>

          {/* Message Preview or Custom Editor */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">معاينة النص المرسل:</label>
            {messageTemplate === 'custom' ? (
              <textarea
                value={customMessage}
                onChange={e => setCustomMessage(e.target.value)}
                placeholder="اكتب رسالتك الخاصة الموجهة للعميل هنا..."
                className="w-full h-24 p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500 resize-none"
              />
            ) : (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 whitespace-pre-wrap font-sans leading-relaxed">
                {finalMessage}
              </div>
            )}
            <div className="flex justify-end mt-1">
              <button
                onClick={handleCopyMessage}
                className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'تم نسخ نص الرسالة' : 'نسخ النص للحافظة'}</span>
              </button>
            </div>
          </div>

          {/* Social Channels Actions */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-800">إرسال مباشر عبر وسائل التواصل والمعاملات:</label>

            {/* Primary WhatsApp Button */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
            >
              <MessageCircle className="w-5 h-5" />
              <span>إرسال عبر واتساب (WhatsApp Direct)</span>
              <ExternalLink className="w-4 h-4 mr-auto" />
            </a>

            {/* Secondary Social Apps Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <a
                href={telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2 px-3 bg-sky-500 hover:bg-sky-400 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>تيليجرام</span>
              </a>

              <a
                href={mailtoUrl}
                className="py-2 px-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>إيميل</span>
              </a>

              <a
                href={phoneNumber ? `tel:${phoneNumber}` : '#'}
                className="py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>اتصال هاتف</span>
              </a>

              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: 'AD1 ERP',
                      text: finalMessage,
                      url: window.location.href
                    }).catch(() => {});
                  } else {
                    handleCopyMessage();
                  }
                }}
                className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>مشاركة العامة</span>
              </button>
            </div>

            {/* Quick Links for Official Store Social Accounts */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl mt-3">
              <span className="text-[11px] font-bold text-slate-500 block mb-2">روابط شبكات التواصل الاجتماعية للمؤسسة:</span>
              <div className="flex items-center gap-3 text-slate-600 text-xs font-bold">
                <a href="https://wa.me" target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-emerald-600">
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600" /> واتساب الأعمال
                </a>
                <a href="https://x.com" target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-sky-600">
                  <Twitter className="w-3.5 h-3.5 text-sky-500" /> تويتر / X
                </a>
                <a href="https://facebook.com" target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-blue-600">
                  <Facebook className="w-3.5 h-3.5 text-blue-600" /> فيسبوك
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-blue-700">
                  <Linkedin className="w-3.5 h-3.5 text-blue-700" /> لينكد إن
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-100 border-t border-slate-200 text-center text-[10px] text-slate-500 flex justify-between items-center px-4">
          <span>مربوطة تلقائياً مع نظام الفواتير والعملاء</span>
          <span className="bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono font-bold">Alt + W</span>
        </div>
      </div>
    </div>
  );
};

export default SocialShareModal;
