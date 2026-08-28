export function printReport(title: string, subtitle: string, htmlContent: string) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('يرجى السماح بفتح النوافذ المنبثقة للطباعة أو تصدير PDF');
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet">
      <style>
        * {
          box-sizing: border-box;
          font-family: 'Cairo', sans-serif;
        }
        body {
          margin: 0;
          padding: 20px;
          color: #1e293b;
          background: #fff;
          direction: rtl;
        }
        .header {
          text-align: center;
          margin-bottom: 24px;
          border-bottom: 2px solid #0f172a;
          padding-bottom: 12px;
        }
        .header h1 {
          margin: 0 0 6px 0;
          font-size: 20pt;
          color: #0f172a;
        }
        .header p {
          margin: 0;
          font-size: 11pt;
          color: #475569;
        }
        .print-date {
          font-size: 9pt;
          color: #64748b;
          margin-top: 6px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 14px;
          margin-bottom: 14px;
        }
        th, td {
          border: 1px solid #cbd5e1;
          padding: 8px 10px;
          text-align: right;
          font-size: 10pt;
        }
        th {
          background-color: #f1f5f9;
          font-weight: 700;
          color: #0f172a;
        }
        tr:nth-child(even) td {
          background-color: #f8fafc;
        }
        .total-row td {
          font-weight: 800;
          background-color: #e2e8f0 !important;
          border-top: 2px solid #334155;
        }
        .badge {
          display: inline-block;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 8.5pt;
          font-weight: 600;
        }
        .badge-present { background: #dcfce7; color: #166534; }
        .badge-absent { background: #ffe4e6; color: #9f1239; }
        .badge-early { background: #fef3c7; color: #92400e; }
        .badge-late { background: #ffedd5; color: #9a3412; }
        @media print {
          @page {
            size: A4 portrait;
            margin: 12mm;
          }
          body {
            padding: 0;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${title}</h1>
        ${subtitle ? `<p>${subtitle}</p>` : ''}
        <div class="print-date">تاريخ الطباعة: ${new Date().toLocaleDateString('ar-EG')} - ${new Date().toLocaleTimeString('ar-EG')}</div>
      </div>
      ${htmlContent}
      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 300);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
