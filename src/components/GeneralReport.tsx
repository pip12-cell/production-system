import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  FileText,
  Calendar,
  Layers,
  Users,
  Search,
  RotateCcw,
  FileSpreadsheet,
  Printer,
  Download,
  Filter,
  TrendingUp,
  Wallet,
  Coins
} from 'lucide-react';
import { formatCurrency, formatNumber, formatDateArabic, getTodayString } from '../utils/calculations';
import { exportToExcel } from '../utils/exportExcel';
import { printReport } from '../utils/exportPdf';

export const GeneralReport: React.FC = () => {
  const { workers, departments, records, settings, setActiveTab } = useApp();

  // Date filters - default to start of current month to today
  const todayStr = getTodayString();
  const currentMonthStart = todayStr.substring(0, 7) + '-01';

  const [fromDate, setFromDate] = useState<string>(currentMonthStart);
  const [toDate, setToDate] = useState<string>(todayStr);
  const [selectedDeptId, setSelectedDeptId] = useState<string>('all');
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Quick Date Presets
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

  const handleResetFilters = () => {
    setFromDate(currentMonthStart);
    setToDate(todayStr);
    setSelectedDeptId('all');
    setSelectedWorkerId('all');
    setSearchTerm('');
  };

  // Filter raw records by date, department, worker
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      if (fromDate && r.date < fromDate) return false;
      if (toDate && r.date > toDate) return false;
      if (selectedDeptId !== 'all' && r.departmentId !== selectedDeptId) return false;
      if (selectedWorkerId !== 'all' && r.workerId !== selectedWorkerId) return false;
      return true;
    });
  }, [records, fromDate, toDate, selectedDeptId, selectedWorkerId]);

  // Aggregate by worker
  const aggregatedData = useMemo(() => {
    // Map worker ID -> aggregates
    const map = new Map<string, {
      workerId: string;
      workerCode: string;
      workerName: string;
      departmentName: string;
      totalUnits: number;
      totalProductionDue: number;
      totalOvertime: number;
      totalDeductions: number;
      totalNetDue: number;
      absentDays: number;
      earlyLeaveDays: number;
      lateDays: number;
      workDays: number;
    }>();

    filteredRecords.forEach(r => {
      if (!map.has(r.workerId)) {
        map.set(r.workerId, {
          workerId: r.workerId,
          workerCode: r.workerCode,
          workerName: r.workerName,
          departmentName: r.departmentName,
          totalUnits: 0,
          totalProductionDue: 0,
          totalOvertime: 0,
          totalDeductions: 0,
          totalNetDue: 0,
          absentDays: 0,
          earlyLeaveDays: 0,
          lateDays: 0,
          workDays: 0
        });
      }

      const item = map.get(r.workerId)!;
      item.totalUnits += Number(r.quantity) || 0;
      item.totalProductionDue += Number(r.productionDue) || 0;
      item.totalOvertime += Number(r.overtime) || 0;
      item.totalDeductions += Number(r.deduction) || 0;
      item.totalNetDue += Number(r.netDue) || 0;

      if (r.attendanceStatus === 'absent') {
        item.absentDays += 1;
      } else if (r.attendanceStatus === 'early_leave') {
        item.earlyLeaveDays += 1;
        item.workDays += 1;
      } else if (r.attendanceStatus === 'late_unexcused') {
        item.lateDays += 1;
        item.workDays += 1;
      } else {
        item.workDays += 1;
      }
    });

    let list = Array.from(map.values());

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      list = list.filter(
        item =>
          item.workerName.toLowerCase().includes(term) ||
          item.workerCode.toLowerCase().includes(term) ||
          item.departmentName.toLowerCase().includes(term)
      );
    }

    // Sort by worker code / name
    list.sort((a, b) => a.workerCode.localeCompare(b.workerCode, undefined, { numeric: true }));

    return list;
  }, [filteredRecords, searchTerm]);

  // Calculate Overall Totals
  const overallTotals = useMemo(() => {
    return aggregatedData.reduce(
      (acc, item) => ({
        totalUnits: acc.totalUnits + item.totalUnits,
        totalProductionDue: acc.totalProductionDue + item.totalProductionDue,
        totalOvertime: acc.totalOvertime + item.totalOvertime,
        totalDeductions: acc.totalDeductions + item.totalDeductions,
        totalNetDue: acc.totalNetDue + item.totalNetDue,
        absentDays: acc.absentDays + item.absentDays,
        earlyLeaveDays: acc.earlyLeaveDays + item.earlyLeaveDays,
        lateDays: acc.lateDays + item.lateDays,
        workDays: acc.workDays + item.workDays
      }),
      {
        totalUnits: 0,
        totalProductionDue: 0,
        totalOvertime: 0,
        totalDeductions: 0,
        totalNetDue: 0,
        absentDays: 0,
        earlyLeaveDays: 0,
        lateDays: 0,
        workDays: 0
      }
    );
  }, [aggregatedData]);

  // Excel Export Handler
  const handleExportExcel = () => {
    const subtitle = `الفترة من: ${fromDate ? formatDateArabic(fromDate) : 'البداية'} إلى: ${toDate ? formatDateArabic(toDate) : 'الآن'}`;
    const columns = [
      { header: 'كود العامل', key: 'workerCode', width: 14 },
      { header: 'اسم العامل', key: 'workerName', width: 25 },
      { header: 'القسم', key: 'departmentName', width: 20 },
      { header: 'إجمالي كمية الإنتاج', key: 'totalUnits', width: 18 },
      { header: 'المستحق عن الإنتاج', key: 'totalProductionDue', width: 20 },
      { header: 'إجمالي الإضافي', key: 'totalOvertime', width: 16 },
      { header: 'إجمالي الخصم', key: 'totalDeductions', width: 16 },
      { header: 'صافي المستحق النهائي', key: 'totalNetDue', width: 22 },
      { header: 'أيام الغياب', key: 'absentDays', width: 14 },
      { header: 'انصراف مبكر', key: 'earlyLeaveDays', width: 14 },
      { header: 'تأخير بدون إذن', key: 'lateDays', width: 16 },
      { header: 'أيام العمل', key: 'workDays', width: 14 }
    ];

    const totalsObj = {
      workerCode: '',
      workerName: 'الإجمالي الكلي',
      departmentName: '',
      totalUnits: overallTotals.totalUnits,
      totalProductionDue: overallTotals.totalProductionDue,
      totalOvertime: overallTotals.totalOvertime,
      totalDeductions: overallTotals.totalDeductions,
      totalNetDue: overallTotals.totalNetDue,
      absentDays: overallTotals.absentDays,
      earlyLeaveDays: overallTotals.earlyLeaveDays,
      lateDays: overallTotals.lateDays,
      workDays: overallTotals.workDays
    };

    exportToExcel(
      `التقرير_العام_للعمال_${fromDate || 'all'}_إلى_${toDate || 'all'}`,
      'التقرير العام',
      `التقرير المالي والإنتاجي العام - ${settings.factoryName}`,
      subtitle,
      columns,
      aggregatedData,
      totalsObj
    );
  };

  // PDF / Print Handler
  const handlePrintPDF = () => {
    const periodText = `الفترة من: ${fromDate ? formatDateArabic(fromDate) : 'البداية'} إلى: ${toDate ? formatDateArabic(toDate) : 'الآن'}`;
    const tableHtml = `
      <table>
        <thead>
          <tr>
            <th>الكود</th>
            <th>اسم العامل</th>
            <th>القسم</th>
            <th>إجمالي الإنتاج</th>
            <th>مستحق الإنتاج</th>
            <th>الإضافي</th>
            <th>الخصومات</th>
            <th>صافي المستحق</th>
            <th>غياب</th>
            <th>انصراف</th>
            <th>تأخير</th>
          </tr>
        </thead>
        <tbody>
          ${aggregatedData
            .map(
              item => `
            <tr>
              <td>${item.workerCode}</td>
              <td><strong>${item.workerName}</strong></td>
              <td>${item.departmentName}</td>
              <td>${formatNumber(item.totalUnits)}</td>
              <td>${item.totalProductionDue.toFixed(2)} ${settings.currency}</td>
              <td style="color: #0f766e;">+${item.totalOvertime}</td>
              <td style="color: #be123c;">-${item.totalDeductions}</td>
              <td style="font-weight: bold; color: #047857;">${item.totalNetDue.toFixed(2)} ${settings.currency}</td>
              <td>${item.absentDays}</td>
              <td>${item.earlyLeaveDays}</td>
              <td>${item.lateDays}</td>
            </tr>
          `
            )
            .join('')}
          <tr class="total-row">
            <td colspan="3">الإجمالي الكلي (${aggregatedData.length} عامل)</td>
            <td>${formatNumber(overallTotals.totalUnits)}</td>
            <td>${overallTotals.totalProductionDue.toFixed(2)} ${settings.currency}</td>
            <td>+${overallTotals.totalOvertime}</td>
            <td>-${overallTotals.totalDeductions}</td>
            <td>${overallTotals.totalNetDue.toFixed(2)} ${settings.currency}</td>
            <td>${overallTotals.absentDays}</td>
            <td>${overallTotals.earlyLeaveDays}</td>
            <td>${overallTotals.lateDays}</td>
          </tr>
        </tbody>
      </table>
      <div style="margin-top: 30px; display: flex; justify-content: space-between; font-size: 10pt; color: #475569;">
        <div>توقيع المشرف المسؤول: .......................</div>
        <div>اعتماد الإدارة: .......................</div>
      </div>
    `;

    printReport(`التقرير المالي والإنتاجي العام - ${settings.factoryName}`, periodText, tableHtml);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Export Actions */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600" />
            التقرير المالي والإنتاجي الشامل
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            تجميع وحساب مستحقات جميع العمال لفترة محددة وفق حركات الإنتاج والحضور
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={handleExportExcel}
            disabled={aggregatedData.length === 0}
            className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>تصدير Excel (.xlsx)</span>
          </button>

          <button
            onClick={handlePrintPDF}
            disabled={aggregatedData.length === 0}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة / تصدير PDF</span>
          </button>
        </div>
      </div>

      {/* Filter Control Box */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <span className="text-xs font-black text-slate-800 flex items-center gap-2">
            <Filter className="w-4 h-4 text-emerald-600" />
            تصفية البيانات والفترة الزمنية
          </span>

          {/* Quick Period Buttons */}
          <div className="flex items-center flex-wrap gap-1.5">
            <button
              onClick={() => setQuickPeriod('today')}
              className="px-2.5 py-1 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
            >
              اليوم
            </button>
            <button
              onClick={() => setQuickPeriod('week')}
              className="px-2.5 py-1 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
            >
              آخر 7 أيام
            </button>
            <button
              onClick={() => setQuickPeriod('this_month')}
              className="px-2.5 py-1 text-xs font-bold bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg transition"
            >
              هذا الشهر
            </button>
            <button
              onClick={() => setQuickPeriod('last_month')}
              className="px-2.5 py-1 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
            >
              الشهر السابق
            </button>
            <button
              onClick={() => setQuickPeriod('all')}
              className="px-2.5 py-1 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
            >
              الكل
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* From Date */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">من تاريخ</label>
            <input
              type="date"
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* To Date */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">إلى تاريخ</label>
            <input
              type="date"
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Department */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">القسم</label>
            <select
              value={selectedDeptId}
              onChange={e => setSelectedDeptId(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
            >
              <option value="all">جميع الأقسام</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          {/* Specific Worker */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">عامل محدد (اختياري)</label>
            <select
              value={selectedWorkerId}
              onChange={e => setSelectedWorkerId(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
            >
              <option value="all">جميع العمال</option>
              {workers.map(w => (
                <option key={w.id} value={w.id}>[{w.code}] {w.name}</option>
              ))}
            </select>
          </div>

          {/* Search Box & Reset */}
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="block text-[11px] font-bold text-slate-600 mb-1">بحث سريع</label>
              <input
                type="text"
                placeholder="اسم أو كود العامل..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <button
              onClick={handleResetFilters}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition shrink-0"
              title="إعادة تعيين الفلاتر"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards for the filtered period */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-xs">
          <span className="text-xs font-bold text-slate-500 block">إجمالي صافي المستحقات للفترة</span>
          <span className="text-2xl font-black text-emerald-700 mt-1 block">
            {formatCurrency(overallTotals.totalNetDue, settings.currency)}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 block">إجمالي كمية الإنتاج</span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">
            {formatNumber(overallTotals.totalUnits)} وحدة
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 block">مستحق الإنتاج (المصاريف)</span>
          <span className="text-2xl font-black text-blue-700 mt-1 block">
            {formatCurrency(overallTotals.totalProductionDue, settings.currency)}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 block">الاستقطاعات والإضافي</span>
            <div className="text-sm font-bold mt-1 space-x-2 space-x-reverse">
              <span className="text-teal-700">+{formatCurrency(overallTotals.totalOvertime, '')}</span>
              <span className="text-rose-700">-{formatCurrency(overallTotals.totalDeductions, '')}</span>
            </div>
          </div>
          <div className="text-xs font-semibold text-slate-500 text-left">
            <div>غياب: {overallTotals.absentDays} يوم</div>
          </div>
        </div>
      </div>

      {/* General Report Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h3 className="text-base font-black text-slate-900">
              كشف مستحقات العمال ({aggregatedData.length} عامل)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              الفترة من: {fromDate ? formatDateArabic(fromDate) : 'البداية'} إلى: {toDate ? formatDateArabic(toDate) : 'الآن'}
            </p>
          </div>
        </div>

        {aggregatedData.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8" />
            </div>
            <h4 className="text-base font-bold text-slate-800 mb-1">لا توجد بيانات مسجلة في هذه الفترة</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
              قم بتعديل معايير البحث أو اختيار فترة زمنية أخرى، أو ابدأ بتسجيل حركات الإنتاج اليومية.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">الكود</th>
                  <th className="p-3.5">اسم العامل</th>
                  <th className="p-3.5">القسم</th>
                  <th className="p-3.5 text-center">إجمالي الإنتاج</th>
                  <th className="p-3.5">مستحق الإنتاج</th>
                  <th className="p-3.5">الإضافي</th>
                  <th className="p-3.5">الخصم</th>
                  <th className="p-3.5">صافي المستحق</th>
                  <th className="p-3.5 text-center">أيام الغياب</th>
                  <th className="p-3.5 text-center">انصراف</th>
                  <th className="p-3.5 text-center">تأخير</th>
                  <th className="p-3.5 text-center">أيام العمل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {aggregatedData.map(item => (
                  <tr key={item.workerId} className="hover:bg-slate-50 transition">
                    <td className="p-3.5 font-bold font-mono text-slate-600">{item.workerCode}</td>
                    <td className="p-3.5 font-bold text-slate-900 text-sm">{item.workerName}</td>
                    <td className="p-3.5 text-slate-600">{item.departmentName}</td>
                    <td className="p-3.5 text-center font-bold text-slate-900">
                      {formatNumber(item.totalUnits)} وحدة
                    </td>
                    <td className="p-3.5 font-bold text-slate-800">
                      {formatCurrency(item.totalProductionDue, settings.currency)}
                    </td>
                    <td className="p-3.5 text-teal-700 font-semibold">
                      {item.totalOvertime > 0 ? `+${item.totalOvertime}` : '0'}
                    </td>
                    <td className="p-3.5 text-rose-700 font-semibold">
                      {item.totalDeductions > 0 ? `-${item.totalDeductions}` : '0'}
                    </td>
                    <td className="p-3.5 font-black text-emerald-700 text-sm">
                      {formatCurrency(item.totalNetDue, settings.currency)}
                    </td>
                    <td className="p-3.5 text-center font-bold text-rose-700">
                      {item.absentDays > 0 ? (
                        <span className="bg-rose-50 text-rose-800 px-2 py-0.5 rounded-full border border-rose-200">
                          {item.absentDays} يوم
                        </span>
                      ) : (
                        '0'
                      )}
                    </td>
                    <td className="p-3.5 text-center text-amber-700 font-medium">
                      {item.earlyLeaveDays || '0'}
                    </td>
                    <td className="p-3.5 text-center text-orange-700 font-medium">
                      {item.lateDays || '0'}
                    </td>
                    <td className="p-3.5 text-center font-semibold text-slate-700">
                      {item.workDays}
                    </td>
                  </tr>
                ))}
              </tbody>
              {/* Grand Totals Footer */}
              <tfoot className="bg-slate-900 text-white font-bold border-t-2 border-slate-800">
                <tr>
                  <td colSpan={3} className="p-4 text-sm font-black">
                    الإجمالي النهائي ({aggregatedData.length} عامل)
                  </td>
                  <td className="p-4 text-center font-black text-sm">
                    {formatNumber(overallTotals.totalUnits)} وحدة
                  </td>
                  <td className="p-4 font-black text-sm">
                    {formatCurrency(overallTotals.totalProductionDue, settings.currency)}
                  </td>
                  <td className="p-4 font-black text-teal-400">
                    +{formatCurrency(overallTotals.totalOvertime, '')}
                  </td>
                  <td className="p-4 font-black text-rose-400">
                    -{formatCurrency(overallTotals.totalDeductions, '')}
                  </td>
                  <td className="p-4 font-black text-base text-emerald-400">
                    {formatCurrency(overallTotals.totalNetDue, settings.currency)}
                  </td>
                  <td className="p-4 text-center font-black text-rose-300">
                    {overallTotals.absentDays} يوم
                  </td>
                  <td className="p-4 text-center">
                    {overallTotals.earlyLeaveDays}
                  </td>
                  <td className="p-4 text-center">
                    {overallTotals.lateDays}
                  </td>
                  <td className="p-4 text-center text-slate-300">
                    {overallTotals.workDays}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
