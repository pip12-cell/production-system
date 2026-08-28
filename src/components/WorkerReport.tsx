import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  UserCheck,
  Calendar,
  Layers,
  Search,
  RotateCcw,
  FileSpreadsheet,
  Printer,
  Wallet,
  Coins,
  PlusCircle,
  MinusCircle,
  UserX,
  Clock,
  Info
} from 'lucide-react';
import {
  formatCurrency,
  formatNumber,
  formatDateArabic,
  getTodayString
} from '../utils/calculations';
import { ATTENDANCE_STATUS_LABELS, ATTENDANCE_STATUS_COLORS } from '../types';
import { exportToExcel } from '../utils/exportExcel';
import { printReport } from '../utils/exportPdf';

export const WorkerReport: React.FC = () => {
  const { workers, departments, records, settings, setActiveTab } = useApp();

  const todayStr = getTodayString();
  const currentMonthStart = todayStr.substring(0, 7) + '-01';

  const [selectedWorkerId, setSelectedWorkerId] = useState<string>(workers[0]?.id || '');
  const [workerSearch, setWorkerSearch] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>(currentMonthStart);
  const [toDate, setToDate] = useState<string>(todayStr);

  // Quick Period Presets
  const setQuickPeriod = (period: 'today' | 'week' | 'this_month' | 'last_month' | 'all') => {
    const now = new Date();
    const today = getTodayString();

    if (period === 'today') {
      setFromDate(today);
      setToDate(today);
    } else if (period === 'week') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      const weekStart = d.toISOString().split('T')[0];
      setFromDate(weekStart);
      setToDate(today);
    } else if (period === 'this_month') {
      setFromDate(today.substring(0, 7) + '-01');
      setToDate(today);
    } else if (period === 'last_month') {
      const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      const pStart = prevMonth.toISOString().split('T')[0];
      const pEnd = prevMonthEnd.toISOString().split('T')[0];
      setFromDate(pStart);
      setToDate(pEnd);
    } else if (period === 'all') {
      setFromDate('');
      setToDate('');
    }
  };

  // Selected Worker object
  const currentWorker = useMemo(() => {
    return workers.find(w => w.id === selectedWorkerId);
  }, [workers, selectedWorkerId]);

  const currentDepartment = useMemo(() => {
    if (!currentWorker) return null;
    return departments.find(d => d.id === currentWorker.departmentId);
  }, [departments, currentWorker]);

  // Filter worker's daily records
  const workerDailyRecords = useMemo(() => {
    if (!selectedWorkerId) return [];
    return records
      .filter(r => {
        if (r.workerId !== selectedWorkerId) return false;
        if (fromDate && r.date < fromDate) return false;
        if (toDate && r.date > toDate) return false;
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date)); // newest first
  }, [records, selectedWorkerId, fromDate, toDate]);

  // Calculated totals for this worker
  const summaryTotals = useMemo(() => {
    return workerDailyRecords.reduce(
      (acc, r) => {
        acc.totalUnits += Number(r.quantity) || 0;
        acc.totalProductionDue += Number(r.productionDue) || 0;
        acc.totalOvertime += Number(r.overtime) || 0;
        acc.totalDeductions += Number(r.deduction) || 0;
        acc.totalNetDue += Number(r.netDue) || 0;

        if (r.attendanceStatus === 'absent') acc.absentDays += 1;
        else if (r.attendanceStatus === 'early_leave') acc.earlyLeaveDays += 1;
        else if (r.attendanceStatus === 'late_unexcused') acc.lateDays += 1;
        else acc.presentDays += 1;

        return acc;
      },
      {
        totalUnits: 0,
        totalProductionDue: 0,
        totalOvertime: 0,
        totalDeductions: 0,
        totalNetDue: 0,
        absentDays: 0,
        earlyLeaveDays: 0,
        lateDays: 0,
        presentDays: 0
      }
    );
  }, [workerDailyRecords]);

  // Workers search list for selector
  const filteredWorkersList = useMemo(() => {
    const term = workerSearch.trim().toLowerCase();
    if (!term) return workers;
    return workers.filter(
      w => w.name.toLowerCase().includes(term) || w.code.toLowerCase().includes(term)
    );
  }, [workers, workerSearch]);

  // Excel Export Handler
  const handleExportExcel = () => {
    if (!currentWorker) return;
    const subtitle = `العامل: ${currentWorker.name} (${currentWorker.code}) - القسم: ${currentDepartment?.name || 'غير محدد'} | الفترة من: ${fromDate ? formatDateArabic(fromDate) : 'البداية'} إلى: ${toDate ? formatDateArabic(toDate) : 'الآن'}`;
    const columns = [
      { header: 'التاريخ', key: 'dateFormatted', width: 14 },
      { header: 'القسم', key: 'departmentName', width: 18 },
      { header: 'كمية الإنتاج', key: 'quantity', width: 16 },
      { header: 'سعر الوحدة', key: 'unitPriceFormatted', width: 14 },
      { header: 'المستحق عن الإنتاج', key: 'productionDueFormatted', width: 20 },
      { header: 'حالة الحضور', key: 'attendanceLabel', width: 16 },
      { header: 'الخصم', key: 'deduction', width: 14 },
      { header: 'الإضافي', key: 'overtime', width: 14 },
      { header: 'صافي المستحق', key: 'netDueFormatted', width: 20 },
      { header: 'الملاحظات', key: 'notes', width: 25 }
    ];

    const dataRows = workerDailyRecords.map(r => ({
      dateFormatted: formatDateArabic(r.date),
      departmentName: r.departmentName,
      quantity: r.quantity,
      unitPriceFormatted: (r.unitPrice || 0).toFixed(2),
      productionDueFormatted: (r.productionDue || 0).toFixed(2),
      attendanceLabel: ATTENDANCE_STATUS_LABELS[r.attendanceStatus],
      deduction: r.deduction || 0,
      overtime: r.overtime || 0,
      netDueFormatted: (r.netDue || 0).toFixed(2),
      notes: r.notes || ''
    }));

    const totalsObj = {
      dateFormatted: 'الإجمالي الكلي',
      departmentName: '',
      quantity: summaryTotals.totalUnits,
      unitPriceFormatted: '',
      productionDueFormatted: summaryTotals.totalProductionDue.toFixed(2),
      attendanceLabel: `غياب: ${summaryTotals.absentDays}`,
      deduction: summaryTotals.totalDeductions,
      overtime: summaryTotals.totalOvertime,
      netDueFormatted: summaryTotals.totalNetDue.toFixed(2),
      notes: ''
    };

    exportToExcel(
      `كشف_حساب_العامل_${currentWorker.code}_${currentWorker.name}`,
      'كشف الحساب',
      `كشف حركة ومستحقات العامل - ${settings.factoryName}`,
      subtitle,
      columns,
      dataRows,
      totalsObj
    );
  };

  // PDF / Print Handler
  const handlePrintPDF = () => {
    if (!currentWorker) return;
    const periodText = `العامل: <strong>${currentWorker.name}</strong> (كود: ${currentWorker.code}) - القسم: ${currentDepartment?.name || 'غير محدد'}<br/>الفترة من: ${fromDate ? formatDateArabic(fromDate) : 'البداية'} إلى: ${toDate ? formatDateArabic(toDate) : 'الآن'}`;

    const summaryCardsHtml = `
      <div style="display: flex; gap: 15px; margin-bottom: 20px; font-size: 10pt;">
        <div style="flex: 1; border: 1px solid #cbd5e1; padding: 10px; border-radius: 8px; background: #f8fafc;">
          <div style="color: #64748b;">إجمالي الإنتاج:</div>
          <div style="font-size: 14pt; font-weight: bold;">${formatNumber(summaryTotals.totalUnits)} وحدة</div>
        </div>
        <div style="flex: 1; border: 1px solid #cbd5e1; padding: 10px; border-radius: 8px; background: #f8fafc;">
          <div style="color: #64748b;">مستحق الإنتاج:</div>
          <div style="font-size: 14pt; font-weight: bold;">${summaryTotals.totalProductionDue.toFixed(2)} ${settings.currency}</div>
        </div>
        <div style="flex: 1; border: 1px solid #cbd5e1; padding: 10px; border-radius: 8px; background: #f8fafc;">
          <div style="color: #64748b;">الإضافي / الخصومات:</div>
          <div style="font-size: 12pt; font-weight: bold; color: #047857;">+${summaryTotals.totalOvertime} / <span style="color: #be123c;">-${summaryTotals.totalDeductions}</span></div>
        </div>
        <div style="flex: 1; border: 2px solid #059669; padding: 10px; border-radius: 8px; background: #ecfdf5;">
          <div style="color: #065f46; font-weight: bold;">صافي المستحق النهائي:</div>
          <div style="font-size: 15pt; font-weight: 900; color: #047857;">${summaryTotals.totalNetDue.toFixed(2)} ${settings.currency}</div>
        </div>
      </div>
    `;

    const tableHtml = `
      ${summaryCardsHtml}
      <table>
        <thead>
          <tr>
            <th>التاريخ</th>
            <th>القسم</th>
            <th>الإنتاج</th>
            <th>سعر الوحدة</th>
            <th>المستحق</th>
            <th>الحضور</th>
            <th>الخصم</th>
            <th>الإضافي</th>
            <th>الصافي</th>
            <th>الملاحظات</th>
          </tr>
        </thead>
        <tbody>
          ${workerDailyRecords
            .map(
              r => `
            <tr>
              <td>${formatDateArabic(r.date)}</td>
              <td>${r.departmentName}</td>
              <td><strong>${formatNumber(r.quantity)}</strong></td>
              <td>${(r.unitPrice || 0).toFixed(2)}</td>
              <td>${r.productionDue.toFixed(2)}</td>
              <td>${ATTENDANCE_STATUS_LABELS[r.attendanceStatus]}</td>
              <td style="color: #be123c;">-${r.deduction}</td>
              <td style="color: #0f766e;">+${r.overtime}</td>
              <td style="font-weight: bold; color: #047857;">${r.netDue.toFixed(2)} ${settings.currency}</td>
              <td>${r.notes || '-'}</td>
            </tr>
          `
            )
            .join('')}
          <tr class="total-row">
            <td colspan="2">الإجمالي الكلي (${workerDailyRecords.length} يوم)</td>
            <td>${formatNumber(summaryTotals.totalUnits)}</td>
            <td>-</td>
            <td>${summaryTotals.totalProductionDue.toFixed(2)}</td>
            <td>غياب: ${summaryTotals.absentDays}</td>
            <td>-${summaryTotals.totalDeductions}</td>
            <td>+${summaryTotals.totalOvertime}</td>
            <td>${summaryTotals.totalNetDue.toFixed(2)} ${settings.currency}</td>
            <td>-</td>
          </tr>
        </tbody>
      </table>
      <div style="margin-top: 30px; display: flex; justify-content: space-between; font-size: 10pt; color: #475569;">
        <div>توقيع العامل: .......................</div>
        <div>اعتماد المشرف: .......................</div>
        <div>اعتماد الحسابات: .......................</div>
      </div>
    `;

    printReport(`كشف حساب العامل: ${currentWorker.name}`, periodText, tableHtml);
  };

  return (
    <div className="space-y-6">
      {/* Header & Export Actions */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-emerald-600" />
            تقرير وكشف حساب تفصيلي لعامل
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            عرض كشف الحركات اليومية ومستحقات الإنتاج والغياب والخصومات لعامل محدد
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={handleExportExcel}
            disabled={!currentWorker || workerDailyRecords.length === 0}
            className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>تصدير Excel (.xlsx)</span>
          </button>

          <button
            onClick={handlePrintPDF}
            disabled={!currentWorker || workerDailyRecords.length === 0}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة / تصدير PDF</span>
          </button>
        </div>
      </div>

      {/* Filter & Worker Selection Box */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Worker Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              1. اختيار العامل
            </label>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="بحث باسم أو كود العامل..."
                value={workerSearch}
                onChange={e => setWorkerSearch(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <select
                value={selectedWorkerId}
                onChange={e => setSelectedWorkerId(e.target.value)}
                className="w-full px-3.5 py-2 text-xs font-bold bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
              >
                <option value="">-- اختر العامل من القائمة --</option>
                {filteredWorkersList.map(w => (
                  <option key={w.id} value={w.id}>
                    [{w.code}] {w.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date Range Filters */}
          <div className="md:col-span-2 space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700">
                2. تحديد الفترة الزمنية
              </label>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setQuickPeriod('today')}
                  className="px-2 py-0.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition"
                >
                  اليوم
                </button>
                <button
                  onClick={() => setQuickPeriod('week')}
                  className="px-2 py-0.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition"
                >
                  أسبوع
                </button>
                <button
                  onClick={() => setQuickPeriod('this_month')}
                  className="px-2 py-0.5 text-xs font-bold bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-md transition"
                >
                  هذا الشهر
                </button>
                <button
                  onClick={() => setQuickPeriod('last_month')}
                  className="px-2 py-0.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition"
                >
                  الشهر السابق
                </button>
                <button
                  onClick={() => setQuickPeriod('all')}
                  className="px-2 py-0.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition"
                >
                  الكل
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <input
                  type="date"
                  value={fromDate}
                  onChange={e => setFromDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <input
                  type="date"
                  value={toDate}
                  onChange={e => setToDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* If No Worker Selected */}
      {!currentWorker ? (
        <div className="p-12 text-center text-slate-400 bg-white rounded-3xl border border-slate-200">
          <UserCheck className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <h4 className="text-base font-bold text-slate-700 mb-1">يرجى اختيار عامل لعرض كشف الحساب</h4>
          <p className="text-xs text-slate-500">
            اختر أحد العمال من القائمة المنسدلة بالأعلى لعرض تقريره التفصيلي.
          </p>
        </div>
      ) : (
        <>
          {/* Worker Profile Header & Financial Summary Cards */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-tr from-emerald-600 to-teal-500 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-md">
                  {currentWorker.code}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    {currentWorker.name}
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                      currentWorker.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {currentWorker.status === 'active' ? 'نشط' : 'موقوف'}
                    </span>
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                    <span className="font-semibold text-slate-700">
                      القسم: {currentDepartment?.name || 'غير محدد'}
                    </span>
                    <span>•</span>
                    <span>
                      الفترة: {fromDate ? formatDateArabic(fromDate) : 'البداية'} إلى {toDate ? formatDateArabic(toDate) : 'الآن'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Net Due Big Badge */}
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center justify-between sm:justify-end gap-6 text-emerald-950">
                <span className="text-xs font-bold text-emerald-800">صافي المستحق النهائي للفترة:</span>
                <span className="text-2xl font-black text-emerald-700">
                  {formatCurrency(summaryTotals.totalNetDue, settings.currency)}
                </span>
              </div>
            </div>

            {/* Calculations Breakdown Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                <span className="text-[11px] font-bold text-slate-500 block mb-0.5">كمية الإنتاج</span>
                <span className="text-base font-black text-slate-900">{formatNumber(summaryTotals.totalUnits)}</span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                <span className="text-[11px] font-bold text-slate-500 block mb-0.5">مستحق الإنتاج</span>
                <span className="text-base font-black text-slate-900">{formatCurrency(summaryTotals.totalProductionDue, '')}</span>
              </div>

              <div className="bg-teal-50/50 p-3 rounded-xl border border-teal-100 text-center">
                <span className="text-[11px] font-bold text-teal-700 block mb-0.5">إجمالي الإضافي</span>
                <span className="text-base font-black text-teal-800">+{summaryTotals.totalOvertime}</span>
              </div>

              <div className="bg-rose-50/50 p-3 rounded-xl border border-rose-100 text-center">
                <span className="text-[11px] font-bold text-rose-700 block mb-0.5">إجمالي الخصم</span>
                <span className="text-base font-black text-rose-800">-{summaryTotals.totalDeductions}</span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                <span className="text-[11px] font-bold text-slate-500 block mb-0.5">أيام الحضور</span>
                <span className="text-base font-black text-slate-800">{summaryTotals.presentDays}</span>
              </div>

              <div className="bg-rose-50 p-3 rounded-xl border border-rose-200 text-center">
                <span className="text-[11px] font-bold text-rose-700 block mb-0.5">أيام الغياب</span>
                <span className="text-base font-black text-rose-800">{summaryTotals.absentDays}</span>
              </div>

              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-center">
                <span className="text-[11px] font-bold text-amber-700 block mb-0.5">انصراف / تأخير</span>
                <span className="text-base font-black text-amber-800">
                  {summaryTotals.earlyLeaveDays + summaryTotals.lateDays}
                </span>
              </div>
            </div>
          </div>

          {/* Daily Ledger Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
              <h3 className="text-base font-black text-slate-900">
                كشف الحركات اليومية المسجلة ({workerDailyRecords.length} يوم)
              </h3>
            </div>

            {workerDailyRecords.length === 0 ? (
              <div className="p-10 text-center text-slate-400">
                <Info className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-bold text-slate-600">لا توجد حركات مسجلة لهذا العامل في الفترة المحددة</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3.5">التاريخ</th>
                      <th className="p-3.5">القسم</th>
                      <th className="p-3.5 text-center">كمية الإنتاج</th>
                      <th className="p-3.5">سعر الوحدة</th>
                      <th className="p-3.5">المستحق عن الإنتاج</th>
                      <th className="p-3.5">حالة الحضور</th>
                      <th className="p-3.5">الخصم</th>
                      <th className="p-3.5">الإضافي</th>
                      <th className="p-3.5">صافي المستحق</th>
                      <th className="p-3.5">الملاحظات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {workerDailyRecords.map(r => {
                      const statusConfig = ATTENDANCE_STATUS_COLORS[r.attendanceStatus] || {
                        bg: 'bg-slate-100',
                        text: 'text-slate-700',
                        border: 'border-slate-200'
                      };
                      return (
                        <tr key={r.id} className="hover:bg-slate-50 transition">
                          <td className="p-3.5 font-bold font-mono text-slate-800">
                            {formatDateArabic(r.date)}
                          </td>
                          <td className="p-3.5 text-slate-600 font-semibold">{r.departmentName}</td>
                          <td className="p-3.5 text-center font-bold text-slate-900">
                            {formatNumber(r.quantity)} وحدة
                          </td>
                          <td className="p-3.5 font-mono text-slate-500">
                            {(r.unitPrice || 0).toFixed(2)}
                          </td>
                          <td className="p-3.5 font-bold text-slate-800">
                            {formatCurrency(r.productionDue, settings.currency)}
                          </td>
                          <td className="p-3.5">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-bold border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
                            >
                              {ATTENDANCE_STATUS_LABELS[r.attendanceStatus]}
                            </span>
                          </td>
                          <td className="p-3.5 text-rose-700 font-semibold">
                            {r.deduction > 0 ? `-${r.deduction}` : '0'}
                          </td>
                          <td className="p-3.5 text-teal-700 font-semibold">
                            {r.overtime > 0 ? `+${r.overtime}` : '0'}
                          </td>
                          <td className="p-3.5 font-black text-emerald-700 text-sm">
                            {formatCurrency(r.netDue, settings.currency)}
                          </td>
                          <td className="p-3.5 text-slate-500 max-w-xs truncate">
                            {r.notes || '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  {/* Totals Row */}
                  <tfoot className="bg-slate-900 text-white font-bold border-t-2 border-slate-800">
                    <tr>
                      <td colSpan={2} className="p-4 text-sm font-black">
                        الإجمالي ({workerDailyRecords.length} يوم)
                      </td>
                      <td className="p-4 text-center font-black text-sm">
                        {formatNumber(summaryTotals.totalUnits)} وحدة
                      </td>
                      <td className="p-4 text-slate-400">-</td>
                      <td className="p-4 font-black text-sm">
                        {formatCurrency(summaryTotals.totalProductionDue, settings.currency)}
                      </td>
                      <td className="p-4 text-xs font-bold text-rose-300">
                        غياب: {summaryTotals.absentDays}
                      </td>
                      <td className="p-4 font-black text-rose-400">
                        -{summaryTotals.totalDeductions}
                      </td>
                      <td className="p-4 font-black text-teal-400">
                        +{summaryTotals.totalOvertime}
                      </td>
                      <td className="p-4 font-black text-base text-emerald-400">
                        {formatCurrency(summaryTotals.totalNetDue, settings.currency)}
                      </td>
                      <td className="p-4 text-slate-400">-</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
