/**
 * Utilities for exporting reports to Excel (CSV/XLS) and PDF
 */

export function exportToExcel(filename: string, headers: string[], rows: (string | number)[][]) {
  // Convert headers and rows to CSV string
  const csvContent = [
    headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(','),
    ...rows.map(row => 
      row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')
    )
  ].join('\r\n');

  // UTF-8 BOM byte order mark ensures Arabic letters open correctly in Excel
  const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
  const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportToPDF(
  title: string, 
  headers: string[], 
  rows: (string | number)[][], 
  summaryText?: string,
  companyName: string = 'نظام إدارة المؤسسة ERP'
) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('يرجى السماح بالنوافذ المنبثقة للتمكن من تصدير PDF/الطباعة');
    return;
  }

  const currentDate = new Date().toLocaleDateString('ar-SA', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const tableHeadersHtml = headers.map(h => `<th style="border: 1px solid #cbd5e1; padding: 10px; background-color: #f1f5f9; text-align: right; font-weight: bold;">${h}</th>`).join('');
  const tableRowsHtml = rows.map(r => `
    <tr>
      ${r.map(c => `<td style="border: 1px solid #e2e8f0; padding: 8px 10px; text-align: right;">${c ?? '-'}</td>`).join('')}
    </tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="utf-8">
      <title>${title}</title>

      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          margin: 30px;
          color: #0f172a;
          direction: rtl;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #0f172a;
          padding-bottom: 15px;
          margin-bottom: 20px;
        }
        .company {
          font-size: 20px;
          font-weight: bold;
          color: #0f172a;
        }
        .title {
          font-size: 18px;
          font-weight: bold;
          color: #2563eb;
          margin-top: 5px;
        }
        .date {
          font-size: 12px;
          color: #64748b;
        }
        .summary-box {
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 20px;
          font-size: 13px;
          font-weight: bold;
          color: #334155;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
        }
        .footer {
          margin-top: 30px;
          padding-top: 15px;
          border-top: 1px solid #e2e8f0;
          text-align: center;
          font-size: 11px;
          color: #94a3b8;
        }
        @media print {
          body { margin: 0; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="company">${companyName}</div>
          <div class="title">${title}</div>
        </div>
        <div class="date">
          تاريخ التقرير: ${currentDate}
        </div>
      </div>

      ${summaryText ? `<div class="summary-box">${summaryText}</div>` : ''}

      <table>
        <thead>
          <tr>${tableHeadersHtml}</tr>
        </thead>
        <tbody>
          ${tableRowsHtml}
        </tbody>
      </table>

      <div class="footer">
        تم استخراج هذا التقرير آلياً من نظام إدارة المؤسسة (ERP Engine)
      </div>

      <script>
        window.onload = function() {
          window.print();
        }
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
