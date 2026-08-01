import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Invoice, StoreSettings } from '../types';
import { generateZatcaQrDataUrl } from './zatca';

/**
 * Professional PDF Generator for Invoices (ZATCA Compliant)
 */
export async function downloadInvoicePDF(
  invoice: Invoice,
  settings: StoreSettings,
  options: { format?: 'a4' | 'thermal'; paperTitle?: string } = {}
): Promise<void> {
  const isA4 = (options.format || 'a4') === 'a4';

  // 1. Generate ZATCA QR Code image data URL
  let qrDataUrl = '';
  try {
    qrDataUrl = await generateZatcaQrDataUrl(
      settings.name,
      settings.taxNumber,
      invoice.date,
      invoice.grandTotal,
      invoice.taxAmount
    );
  } catch (e) {
    console.error('Failed to generate QR for PDF:', e);
  }

  // 2. Create off-screen DOM element styled for high-resolution rendering
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '-9999px';
  container.style.left = '-9999px';
  container.style.width = isA4 ? '794px' : '380px'; // 794px corresponds to standard A4 width at 96 DPI
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#0f172a';
  container.style.fontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
  container.style.direction = 'rtl';
  container.style.padding = isA4 ? '32px' : '16px';
  container.style.boxSizing = 'border-box';

  const formattedDate = new Date(invoice.date).toLocaleString('ar-SA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  const paymentMethodLabel = 
    invoice.paymentMethod === 'cash' ? 'نقداً (كاش)' :
    invoice.paymentMethod === 'card' ? 'بطاقة مدى / شبكة' :
    invoice.paymentMethod === 'credit' ? 'آجل على الحساب' : 'مختلط (كاش وشبكة)';

  if (isA4) {
    // Professional A4 Tax Invoice Template
    container.innerHTML = `
      <div style="border: 2px solid #0284c7; padding: 24px; border-radius: 12px; background: #fff;">
        <!-- Header Top: Logo & Store Info vs Invoice Title & QR -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 20px; border-bottom: 2px solid #e2e8f0;">
          <div style="display: flex; align-items: center; gap: 16px;">
            ${
              settings.logo && (settings.logo.startsWith('http') || settings.logo.startsWith('/') || settings.logo.startsWith('data:image'))
                ? `<img src="${settings.logo}" alt="Logo" style="width: 70px; height: 70px; object-fit: contain; border-radius: 8px;" />`
                : `<div style="width: 60px; height: 60px; background: #0284c7; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: bold; border-radius: 8px;">🏬</div>`
            }
            <div>
              <h1 style="margin: 0; font-size: 22px; font-weight: 900; color: #0f172a;">${settings.name}</h1>
              <p style="margin: 4px 0 0; font-size: 12px; color: #64748b; font-weight: 600;">${settings.address || 'المملكة العربية السعودية'}</p>
              <p style="margin: 2px 0 0; font-size: 12px; color: #64748b;">هاتف: ${settings.phone || 'غير محدد'}</p>
              <div style="margin-top: 6px; display: inline-block; background: #f0f9ff; color: #0369a1; border: 1px solid #bae6fd; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 800;">
                الرقم الضريبي VAT: <span style="font-family: monospace;">${settings.taxNumber}</span>
              </div>
            </div>
          </div>

          <div style="text-align: left; display: flex; flex-direction: column; align-items: flex-end;">
            <div style="background: #0284c7; color: #ffffff; padding: 6px 16px; border-radius: 8px; font-weight: 900; font-size: 16px; text-align: center; margin-bottom: 8px;">
              ${invoice.status === 'returned' ? 'فاتورة مرتجع مبيعات' : 'فاتورة ضريبية مبسطة'}
            </div>
            <div style="font-size: 12px; color: #475569; font-weight: bold; margin-bottom: 2px;">
              رقم الفاتورة: <span style="font-family: monospace; font-size: 14px; color: #0284c7;">${invoice.invoiceNumber}</span>
            </div>
            <div style="font-size: 11px; color: #64748b;">التاريخ: ${formattedDate}</div>
          </div>
        </div>

        <!-- Meta Grid: Cashier & Customer Info -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 16px; background: #f8fafc; padding: 12px 16px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 12px;">
          <div>
            <div style="color: #64748b; font-size: 11px; font-weight: bold;">بيانات العميل:</div>
            <div style="font-weight: 800; font-size: 13px; color: #0f172a; margin-top: 2px;">${invoice.customerName || 'عميل نقدي عام'}</div>
            ${invoice.taxNumber ? `<div style="font-size: 11px; color: #475569; margin-top: 2px;">الرقم الضريبي للعميل: <span style="font-family: monospace;">${invoice.taxNumber}</span></div>` : ''}
          </div>
          <div>
            <div style="color: #64748b; font-size: 11px; font-weight: bold;">معلومات العملية:</div>
            <div style="font-weight: 700; color: #334155; margin-top: 2px;">الكاشير المسؤول: <span style="color: #0f172a;">${invoice.cashierName}</span></div>
            <div style="font-weight: 700; color: #334155; margin-top: 2px;">طريقة السداد: <span style="color: #0284c7; font-weight: 800;">${paymentMethodLabel}</span></div>
          </div>
        </div>

        <!-- Line Items Table -->
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; text-align: right;">
          <thead>
            <tr style="background: #0f172a; color: #ffffff; font-weight: 800;">
              <th style="padding: 10px; border-radius: 0 6px 6px 0;">#</th>
              <th style="padding: 10px;">اسم الصنف / الوصف</th>
              <th style="padding: 10px; text-align: center;">الكمية</th>
              <th style="padding: 10px; text-align: left;">سعر الوحدة</th>
              <th style="padding: 10px; text-align: left;">نسبة الضريبة</th>
              <th style="padding: 10px; text-align: left;">مبلغ الضريبة</th>
              <th style="padding: 10px; text-align: left; border-radius: 6px 0 0 6px;">الإجمالي شامل الضريبة</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.items
              .map(
                (item, idx) => `
              <tr style="border-bottom: 1px solid #e2e8f0; background: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
                <td style="padding: 10px; font-weight: bold; color: #64748b; font-family: monospace;">${idx + 1}</td>
                <td style="padding: 10px; font-weight: 800; color: #0f172a;">${item.productName}</td>
                <td style="padding: 10px; text-align: center; font-weight: 800; font-family: monospace; font-size: 13px;">${item.quantity}</td>
                <td style="padding: 10px; text-align: left; font-family: monospace;">${item.price.toFixed(2)} ${settings.currency}</td>
                <td style="padding: 10px; text-align: left; font-family: monospace; color: #64748b;">${settings.taxRate || 15}%</td>
                <td style="padding: 10px; text-align: left; font-family: monospace; color: #d97706;">${item.taxAmount ? item.taxAmount.toFixed(2) : (item.total * (settings.taxRate / 115)).toFixed(2)} ${settings.currency}</td>
                <td style="padding: 10px; text-align: left; font-weight: 900; font-family: monospace; color: #0284c7;">${item.total.toFixed(2)} ${settings.currency}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>

        <!-- Totals & ZATCA QR Code Summary Section -->
        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 24px; padding-top: 16px; border-top: 2px solid #e2e8f0;">
          <!-- ZATCA QR Code & Note -->
          <div style="display: flex; align-items: center; gap: 16px;">
            ${
              qrDataUrl
                ? `<img src="${qrDataUrl}" alt="ZATCA QR" style="width: 120px; height: 120px; border: 1px solid #cbd5e1; padding: 4px; border-radius: 8px; background: #fff;" />`
                : ''
            }
            <div style="max-width: 240px; font-size: 10px; color: #64748b; line-height: 1.5;">
              <p style="margin: 0; font-weight: bold; color: #334155;">رمز الاستجابة السريع ZATCA QR</p>
              <p style="margin: 4px 0 0;">هذه الفاتورة مستخرجة إلكترونياً وتتوافق مع اشتراطات هيئة الزكاة والضريبة والجمارك بالمملكة العربية السعودية.</p>
            </div>
          </div>

          <!-- Financial Totals Box -->
          <div style="min-width: 280px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px 16px;">
            <div style="display: flex; justify-content: space-between; font-size: 12px; color: #475569; margin-bottom: 6px;">
              <span>المجموع قبل الضريبة (Net Total):</span>
              <span style="font-family: monospace; font-weight: 700;">${invoice.totalWithoutTax.toFixed(2)} ${settings.currency}</span>
            </div>

            ${
              invoice.discountAmount > 0
                ? `<div style="display: flex; justify-content: space-between; font-size: 12px; color: #dc2626; margin-bottom: 6px; font-weight: bold;">
                    <span>إجمالي الخصم (Discount):</span>
                    <span style="font-family: monospace;">-${invoice.discountAmount.toFixed(2)} ${settings.currency}</span>
                  </div>`
                : ''
            }

            <div style="display: flex; justify-content: space-between; font-size: 12px; color: #d97706; margin-bottom: 8px; font-weight: 700;">
              <span>ضريبة القيمة المضافة (${settings.taxRate}% VAT):</span>
              <span style="font-family: monospace;">${invoice.taxAmount.toFixed(2)} ${settings.currency}</span>
            </div>

            <div style="display: flex; justify-content: space-between; font-size: 15px; font-weight: 900; color: #0284c7; padding-top: 8px; border-top: 2px solid #cbd5e1;">
              <span>الإجمالي النهائي (Grand Total):</span>
              <span style="font-family: monospace;">${invoice.grandTotal.toFixed(2)} ${settings.currency}</span>
            </div>
          </div>
        </div>

        <!-- Footer Note -->
        <div style="margin-top: 32px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px dashed #cbd5e1; padding-top: 12px;">
          شكراً لتعاملكم معنا • نسعد بخدمتكم دائماً • هاتف الدعم الفني والخدمة: ${settings.phone || '000'}
        </div>
      </div>
    `;
  } else {
    // Thermal Receipt Style PDF
    container.innerHTML = `
      <div style="padding: 12px; border: 1px solid #cbd5e1; font-family: monospace; font-size: 12px; text-align: center;">
        <h2 style="margin: 0; font-size: 16px; font-weight: 900;">${settings.name}</h2>
        <p style="margin: 2px 0; font-size: 10px; color: #475569;">${settings.address}</p>
        <p style="margin: 2px 0; font-size: 10px; font-weight: bold;">الرقم الضريبي: ${settings.taxNumber}</p>
        <div style="border-bottom: 1px dashed #000; margin: 8px 0;"></div>
        
        <div style="text-align: right; font-size: 11px; line-height: 1.5;">
          <div><b>رقم الفاتورة:</b> ${invoice.invoiceNumber}</div>
          <div><b>التاريخ:</b> ${formattedDate}</div>
          <div><b>العميل:</b> ${invoice.customerName || 'عميل نقدي'}</div>
          <div><b>الكاشير:</b> ${invoice.cashierName}</div>
        </div>
        <div style="border-bottom: 1px solid #000; margin: 8px 0;"></div>

        <table style="width: 100%; text-align: right; font-size: 11px; border-collapse: collapse;">
          <thead>
            <tr style="border-bottom: 1px solid #000;">
              <th>الصنف</th>
              <th style="text-align: center;">الكمية</th>
              <th style="text-align: left;">الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.items.map(it => `
              <tr style="border-bottom: 1px dashed #ccc;">
                <td>${it.productName}</td>
                <td style="text-align: center;">${it.quantity}</td>
                <td style="text-align: left;">${it.total.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div style="border-bottom: 1px dashed #000; margin: 8px 0;"></div>

        <div style="text-align: right; font-size: 11px; line-height: 1.6;">
          <div>قبل الضريبة: ${invoice.totalWithoutTax.toFixed(2)} ${settings.currency}</div>
          <div>ضريبة (${settings.taxRate}%): ${invoice.taxAmount.toFixed(2)} ${settings.currency}</div>
          <div style="font-size: 13px; font-weight: 900; margin-top: 4px; border-top: 1px solid #000; padding-top: 4px;">
            الإجمالي: ${invoice.grandTotal.toFixed(2)} ${settings.currency}
          </div>
        </div>
        
        ${qrDataUrl ? `<div style="margin-top: 12px; display: flex; justify-content: center;"><img src="${qrDataUrl}" style="width: 100px; height: 100px;" /></div>` : ''}
        <div style="font-size: 10px; color: #64748b; margin-top: 8px;">شكراً لزيارتكم</div>
      </div>
    `;
  }

  document.body.appendChild(container);

  try {
    // 3. Render HTML to high quality Canvas
    const canvas = await html2canvas(container, {
      scale: 2, // High resolution scale
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    document.body.removeChild(container);

    const imgData = canvas.toDataURL('image/png');

    // 4. Create jsPDF document
    if (isA4) {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`فاتورة_${invoice.invoiceNumber}.pdf`);
    } else {
      // Thermal receipt dimensions (80mm width)
      const pdfWidth = 80;
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      const pdf = new jsPDF('p', 'mm', [pdfWidth, Math.max(pdfHeight, 120)]);

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`إيصال_${invoice.invoiceNumber}.pdf`);
    }
  } catch (error) {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
    console.error('Failed to generate PDF file:', error);
    throw error;
  }
}
