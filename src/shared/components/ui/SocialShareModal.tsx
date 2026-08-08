import React, { useState, useRef } from 'react';
import { 
  X, Share2, MessageCircle, Send, Phone, Mail, Copy, Check, 
  ExternalLink, Globe, Facebook, Twitter, Linkedin, FileText, 
  Paperclip, Upload, HardDrive, Download, User, Smartphone
} from 'lucide-react';
import { Customer, Invoice } from '../../../types';

interface SocialShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers?: Customer[];
  invoice?: Invoice | null;
  initialFile?: File | null;
  initialFileName?: string;
}

export const SocialShareModal: React.FC<SocialShareModalProps> = ({
  isOpen,
  onClose,
  customers = [],
  invoice,
  initialFile = null,
  initialFileName = ''
}) => {
  const [phoneNumber, setPhoneNumber] = useState<string>(
    invoice?.customerPhone || (customers.length > 0 ? customers[0]?.phone : '') || ''
  );
  const [customerEmail, setCustomerEmail] = useState<string>(
    customers.find(c => c.phone === invoice?.customerPhone)?.email || (customers.length > 0 ? customers[0]?.email : '') || ''
  );
  const [customerName, setCustomerName] = useState<string>(
    invoice?.customerName || (customers.length > 0 ? customers[0]?.name : '') || 'العميل العزيز'
  );
  const [messageTemplate, setMessageTemplate] = useState<'invoice' | 'statement' | 'quote' | 'welcome' | 'custom'>('invoice');
  const [customMessage, setCustomMessage] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(initialFile);
  const [attachedFileName, setAttachedFileName] = useState<string>(
    initialFileName || (invoice ? `فاتورة_${invoice.invoiceNumber || invoice.id.slice(-6)}.pdf` : '')
  );
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'telegram' | 'gmail' | 'drive' | 'native'>('whatsapp');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const shareTabs = [
    { id: 'whatsapp' as const, name: 'واتساب', activeBg: 'bg-emerald-600', iconColor: 'text-emerald-300', Icon: MessageCircle },
    { id: 'telegram' as const, name: 'تلجرام', activeBg: 'bg-sky-500', iconColor: 'text-sky-200', Icon: Send },
    { id: 'gmail' as const, name: 'جيميل', activeBg: 'bg-rose-600', iconColor: 'text-rose-200', Icon: Mail },
    { id: 'drive' as const, name: 'درايف', activeBg: 'bg-amber-600', iconColor: 'text-amber-200', Icon: HardDrive },
    { id: 'native' as const, name: 'مشاركة النظام', activeBg: 'bg-indigo-600', iconColor: 'text-indigo-200', Icon: Share2, extraClass: 'col-span-2 sm:col-span-1' }
  ];

  const templates = [
    { id: 'invoice' as const, label: '🧾 فاتورة' },
    { id: 'statement' as const, label: '📊 كشف حساب' },
    { id: 'quote' as const, label: '📄 عرض سعر' },
    { id: 'welcome' as const, label: '✨ ترحيب' },
    { id: 'custom' as const, label: '✍️ مخصص' }
  ];

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
      return `مرحباً ${customerName} 👋\nتفضلو بفاتورة الشراء رقم: #${invoice.invoiceNumber || invoice.id.slice(-6)}\nالمبلغ الإجمالي: ${invoice.grandTotal ? invoice.grandTotal.toFixed(2) : invoice.totalAmount?.toFixed(2)} ر.س شامل الضريبة (15%).\nنشكر لكم تعاملكم معنا 🌸\nمتجرنا: AD1 ERP`;
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
  const emailSubject = invoice ? `فاتورة مبيعات رقم ${invoice.invoiceNumber || invoice.id.slice(-6)} - AD1 ERP` : `رسالة ومعاملة رسمية من نظام AD1 ERP`;

  // Sharing links
  const whatsappAppUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(finalMessage)}`;
  const whatsappWebUrl = `https://web.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(finalMessage)}`;
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(finalMessage)}`;
  const gmailComposeUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(customerEmail)}&su=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(finalMessage)}`;
  const mailtoUrl = `mailto:${encodeURIComponent(customerEmail)}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(finalMessage)}`;
  const googleDriveUrl = `https://drive.google.com/drive/my-drive`;

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(finalMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAttachedFile(file);
      setAttachedFileName(file.name);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        const shareData: ShareData = {
          title: emailSubject,
          text: finalMessage,
          url: window.location.href,
        };

        if (attachedFile && navigator.canShare && navigator.canShare({ files: [attachedFile] })) {
          shareData.files = [attachedFile];
        }

        await navigator.share(shareData);
      } catch (err) {
        console.warn('Native share cancelled or failed:', err);
      }
    } else {
      handleCopyMessage();
      alert('تم نسخ النص للحافظة! يمكنك الآن لصقه مباشرة في أي تطبيق.');
    }
  };

  const handleSaveToDrive = () => {
    // Open Google Drive in new tab
    window.open(googleDriveUrl, '_blank');

    // Trigger local download if file attached so user can drop it into drive
    if (attachedFile) {
      const url = URL.createObjectURL(attachedFile);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachedFileName || attachedFile.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden flex flex-col dir-rtl text-right max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 bg-slate-900 text-white border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30" aria-hidden="true">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                <span>مركز مشاركة وتصدير المستندات والملفات</span>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold rounded-md">
                  4 منصات شاملة
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                إرسال الفواتير والعروض والتقارير عبر واتساب، تلجرام، جيميل، وجوجل درايف
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="إغلاق النافذة"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-500 outline-none"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          
          {/* Channel Selector Tabs */}
          <div role="tablist" aria-label="منصات مشاركة المستندات" className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs font-bold">
            {shareTabs.map(({ id, name, activeBg, iconColor, Icon, extraClass }) => (
              <button
                key={id}
                role="tab"
                aria-selected={activeTab === id}
                onClick={() => setActiveTab(id)}
                className={`${extraClass || ''} py-2 px-2.5 rounded-lg transition flex items-center justify-center gap-1.5 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-500 outline-none ${
                  activeTab === id
                    ? `${activeBg} text-white shadow-md`
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <Icon className={`w-4 h-4 ${iconColor}`} aria-hidden="true" />
                <span>{name}</span>
              </button>
            ))}
          </div>

          {/* Recipient Input Controls */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label htmlFor="customerNameInput" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  اسم المستلم / العميل:
                </label>
                <input
                  id="customerNameInput"
                  type="text"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="أدخل اسم العميل"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500"
                />
              </div>

              <div>
                <label htmlFor="customerPhoneInput" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  رقم الواتساب / الهاتف:
                </label>
                <input
                  id="customerPhoneInput"
                  type="text"
                  value={phoneNumber}
                  onChange={e => setPhoneNumber(e.target.value)}
                  placeholder="05xxxxxxx أو 9665xxxxxxx"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500 text-left dir-ltr"
                />
              </div>

              <div>
                <label htmlFor="customerEmailInput" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  البريد الإلكتروني (Gmail):
                </label>
                <input
                  id="customerEmailInput"
                  type="email"
                  value={customerEmail}
                  onChange={e => setCustomerEmail(e.target.value)}
                  placeholder="client@gmail.com"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500 text-left dir-ltr"
                />
              </div>
            </div>

            {/* Customer Dropdown Quick Selector */}
            {customers.length > 0 && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 flex items-center gap-2">
                <label htmlFor="customerQuickSelect" className="text-xs font-bold text-slate-500 shrink-0">اختيار سريع:</label>
                <select
                  id="customerQuickSelect"
                  onChange={e => {
                    const cust = customers.find(c => c.id === e.target.value);
                    if (cust) {
                      setCustomerName(cust.name);
                      setPhoneNumber(cust.phone);
                      if (cust.email) setCustomerEmail(cust.email);
                    }
                  }}
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none"
                >
                  <option value="">-- اختر من قائمة العملاء --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone}) {c.email ? `- ${c.email}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Attached File Picker / Status */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/60 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-lg shrink-0" aria-hidden="true">
                <Paperclip className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100 block">
                  الملف المرفق للإرسال والمشاركة:
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {attachedFileName ? (
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      📎 {attachedFileName} {attachedFile ? `(${(attachedFile.size / 1024).toFixed(1)} KB)` : ''}
                    </span>
                  ) : (
                    'لم يتم إرفاق ملف بعد (يمكنك إرفاق PDF أو Excel أو صورة)'
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf,.xlsx,.csv,.png,.jpg,.jpeg"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                aria-label={attachedFile ? 'تغيير الملف المرفق' : 'إرفاق ملف جديد'}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500 outline-none"
              >
                <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{attachedFile ? 'تغيير الملف' : 'إرفاق ملف'}</span>
              </button>
            </div>
          </div>

          {/* Template Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              نوع وشكل النص المرفق:
            </label>
            <div role="radiogroup" aria-label="شكل نص الرسالة المرفق" className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
              {templates.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={messageTemplate === id}
                  onClick={() => setMessageTemplate(id)}
                  className={`py-2 px-2 rounded-lg text-xs font-bold transition border text-center focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-500 outline-none ${
                    messageTemplate === id
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-extrabold'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Message Content Preview or Custom Editor */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="customMessageInput" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                محتوى الرسالة:
              </label>
              <button
                type="button"
                onClick={handleCopyMessage}
                aria-label="نسخ الرسالة للحافظة"
                className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none rounded px-1.5 py-0.5"
              >
                {copied ? <Check className="w-3.5 h-3.5" aria-hidden="true" /> : <Copy className="w-3.5 h-3.5" aria-hidden="true" />}
                <span>{copied ? 'تم النسخ!' : 'نسخ النص'}</span>
              </button>
            </div>

            {messageTemplate === 'custom' ? (
              <textarea
                id="customMessageInput"
                aria-label="محتوى الرسالة المخصصة"
                value={customMessage}
                onChange={e => setCustomMessage(e.target.value)}
                placeholder="اكتب رسالتك المخصصة هنا..."
                className="w-full h-24 p-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500 resize-none"
              />
            ) : (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap font-sans leading-relaxed">
                {finalMessage}
              </div>
            )}
          </div>

          {/* TAB CONTENT ACTION PANELS */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            
            {/* WHATSAPP TAB */}
            {activeTab === 'whatsapp' && (
              <div className="space-y-3 bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-emerald-500" />
                    <span className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
                      خيار الإرسال المباشر عبر تطبيق واتساب (WhatsApp)
                    </span>
                  </div>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 font-bold px-2 py-0.5 rounded-full">
                    مباشر وسريع
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300">
                  يمكنك فتح واتساب مباشرة على رقم العميل ({formattedPhone || 'غير محدد'}) مع نص الرسالة الجاهزة.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <a
                    href={whatsappAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-500 outline-none"
                  >
                    <Smartphone className="w-4 h-4" aria-hidden="true" />
                    <span>فتح في تطبيق واتساب الجوال</span>
                    <ExternalLink className="w-3.5 h-3.5 mr-auto" aria-hidden="true" />
                  </a>

                  <a
                    href={whatsappWebUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-500 outline-none"
                  >
                    <Globe className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                    <span>فتح في واتساب ويب (WhatsApp Web)</span>
                    <ExternalLink className="w-3.5 h-3.5 mr-auto" aria-hidden="true" />
                  </a>
                </div>
              </div>
            )}

            {/* TELEGRAM TAB */}
            {activeTab === 'telegram' && (
              <div className="space-y-3 bg-sky-500/5 p-4 rounded-xl border border-sky-500/20">
                <div className="flex items-center gap-2">
                  <Send className="w-5 h-5 text-sky-500" aria-hidden="true" />
                  <span className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
                    خيار الإرسال عبر تطبيق تلجرام (Telegram)
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300">
                  سيتم توجيهك لرابط مشاركة تلجرام لاختيار العميل أو المجموعة أو القناة المراد إرسال المستند إليها.
                </p>

                <a
                  href={telegramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 bg-sky-500 hover:bg-sky-400 text-white rounded-xl font-black text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-500 outline-none"
                >
                  <Send className="w-4 h-4" aria-hidden="true" />
                  <span>مشاركة فورية عبر تلجرام</span>
                  <ExternalLink className="w-3.5 h-3.5 mr-auto" aria-hidden="true" />
                </a>
              </div>
            )}

            {/* GMAIL TAB */}
            {activeTab === 'gmail' && (
              <div className="space-y-3 bg-rose-500/5 p-4 rounded-xl border border-rose-500/20">
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-rose-500" aria-hidden="true" />
                  <span className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
                    خيار الإرسال عبر البريد الإلكتروني (Gmail & Email)
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300">
                  سيتم فتح شاشة إنشاء إيميل جديد في Gmail تلقائياً موجهة للبريد ({customerEmail || 'لم يحدد بريد'}) مع الموضوع والنص.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <a
                    href={gmailComposeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-3 px-4 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-black text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-rose-500 outline-none"
                  >
                    <Mail className="w-4 h-4" aria-hidden="true" />
                    <span>فتح في Gmail ويب مباشر</span>
                    <ExternalLink className="w-3.5 h-3.5 mr-auto" aria-hidden="true" />
                  </a>

                  <a
                    href={mailtoUrl}
                    className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-500 outline-none"
                  >
                    <Globe className="w-4 h-4 text-rose-400" aria-hidden="true" />
                    <span>تطبيق الإيميل الافتراضي (Mailto)</span>
                    <ExternalLink className="w-3.5 h-3.5 mr-auto" aria-hidden="true" />
                  </a>
                </div>
              </div>
            )}

            {/* DRIVE TAB */}
            {activeTab === 'drive' && (
              <div className="space-y-3 bg-amber-500/5 p-4 rounded-xl border border-amber-500/20">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-5 h-5 text-amber-500" aria-hidden="true" />
                  <span className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
                    خيار الحفظ والأرشفة على جوجل درايف (Google Drive)
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  احفظ الفاتورة أو التقرير في مساحة Google Drive الخاصة بك للأرشفة والرجوع إليها في أي وقت.
                  سيتم فتح حساب Drive وتنزيل الملف لرفعه فوراً.
                </p>

                <button
                  type="button"
                  onClick={handleSaveToDrive}
                  className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-black text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-amber-600/20 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-amber-500 outline-none"
                >
                  <Download className="w-4 h-4" aria-hidden="true" />
                  <span>تنزيل الملف وفتح Google Drive للرفع</span>
                  <ExternalLink className="w-3.5 h-3.5 mr-auto" aria-hidden="true" />
                </button>
              </div>
            )}

            {/* NATIVE SHARE TAB */}
            {activeTab === 'native' && (
              <div className="space-y-3 bg-indigo-500/5 p-4 rounded-xl border border-indigo-500/20">
                <div className="flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-indigo-500" aria-hidden="true" />
                  <span className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
                    مشاركة عبر نافذة النظام والجوال العامة (Native Web Share)
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300">
                  تسمح بإرفاق ملف الفاتورة PDF الحقيقي مباشرة إلى الواتساب والتصلات الأخرى على الأجهزة المحمولة والحواسيب.
                </p>

                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500 outline-none"
                >
                  <Share2 className="w-4 h-4" aria-hidden="true" />
                  <span>فتح قائمة مشاركة التطبيقات والملفات بالنظام</span>
                </button>
              </div>
            )}

          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-3.5 bg-slate-100 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 flex justify-between items-center px-5 shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-bold text-slate-700 dark:text-slate-300">AD1 ERP Smart Share</span>
            <span className="text-[10px] text-slate-400">(يدعم جميع ملفات الفواتير والتقارير)</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold rounded-lg transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-500 outline-none"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};

export default SocialShareModal;

