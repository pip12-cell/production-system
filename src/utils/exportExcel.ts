import * as XLSX from 'xlsx';

export interface ExcelColumn {
  header: string;
  key: string;
  width?: number;
}

export function exportToExcel(
  filename: string,
  sheetName: string,
  title: string,
  subtitle: string,
  columns: ExcelColumn[],
  data: any[],
  totals?: Record<string, any>
) {
  // Build 2D array for worksheet
  const rows: any[][] = [];

  // Title row
  rows.push([title]);
  // Subtitle / Date range row
  if (subtitle) {
    rows.push([subtitle]);
  }
  rows.push([]); // empty row

  // Headers
  const headerRow = columns.map(c => c.header);
  rows.push(headerRow);

  // Data rows
  data.forEach(item => {
    const row = columns.map(col => {
      const val = item[col.key];
      return val !== undefined && val !== null ? val : '';
    });
    rows.push(row);
  });

  // Totals row if provided
  if (totals) {
    rows.push([]); // separator
    const totalRow = columns.map((col, index) => {
      if (index === 0) return 'الإجمالي الكلي';
      return totals[col.key] !== undefined ? totals[col.key] : '';
    });
    rows.push(totalRow);
  }

  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Set column widths
  ws['!cols'] = columns.map(c => ({ wch: c.width || 18 }));

  // Set Right to Left view for Arabic
  if (!ws['!views']) ws['!views'] = [];
  ws['!views'].push({ rightToLeft: true });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31));

  // Generate and download
  XLSX.writeFile(wb, `${filename}.xlsx`);
}
