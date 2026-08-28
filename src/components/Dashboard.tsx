import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  Coins,
  TrendingUp,
  MinusCircle,
  PlusCircle,
  Wallet,
  ArrowRightLeft,
  Calendar,
  Layers,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';
import { formatCurrency, formatNumber, formatDateArabic, getTodayString } from '../utils/calculations';
import { ATTENDANCE_STATUS_LABELS, ATTENDANCE_STATUS_COLORS, DailyRecord } from '../types';

export const Dashboard: React.FC = () => {
  const { workers, departments, records, settings, selectedDate, setSelectedDate, setActiveTab } = useApp();
  const [searchTerm, setSearchTerm] = useState('');

  // Filter records for selectedDate
  const dayRecords = records.filter(r => r.date === selectedDate);
  const activeWorkers = workers.filter(w => w.status === 'active');

  // Daily statistics
  const presentCount = dayRecords.filter(r => r.attendanceStatus === 'present').length;
  const absentCount = dayRecords.filter(r => r.attendanceStatus === 'absent').length;
  const earlyLeaveCount = dayRecords.filter(r => r.attendanceStatus === 'early_leave').length;
  const lateCount = dayRecords.filter(r => r.attendanceStatus === 'late_unexcused').length;

  const totalProductionUnits = dayRecords.reduce((sum, r) => sum + (r.quantity || 0), 0);
  const totalProductionDue = dayRecords.reduce((sum, r) => sum + (r.productionDue || 0), 0);
  const totalOvertime = dayRecords.reduce((sum, r) => sum + (r.overtime || 0), 0);
  const totalDeductions = dayRecords.reduce((sum, r) => sum + (r.deduction || 0), 0);
  const totalNetDue = dayRecords.reduce((sum, r) => sum + (r.netDue || 0), 0);

  // Filtered day records for search
  const filteredDayRecords = dayRecords.filter(r =>
    r.workerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.workerCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.departmentName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isToday = selectedDate === getTodayString();

  return (
    <div className="space-y-6">
      {/* Date Header & Quick Filter Banner */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Calendar className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-black text-slate-900">
                ملخص إحصائيات يوم: {formatDateArabic(selectedDate)}
                {isToday && <span className="mr-2 text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">اليوم الحالي</span>}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                عرض مباشر لحركة الإنتاج والعمال المسجلين لهذا اليوم
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedDate(getTodayString())}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
              isToday
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
            }`}
          >
            اليوم
          </button>
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>
      </div>

      {/* When the app is completely empty - Guided Onboarding */}
      {departments.length === 0 && workers.length === 0 && (
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 sm:p-8 rounded-3xl shadow-xl">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-bold mb-4">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              قاعدة البيانات فارغة وجاهزة للبدء
            </div>
            <h3 className="text-xl sm:text-2xl font-black mb-2">
              مرحباً بك في نظام إدارة إنتاج وحضور العمال
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed mb-6">
              تم تجهيز النظام بقاعدة بيانات نظيفة تماماً بدون أي بيانات تجريبية وهمية. يمكنك الآن البدء بإضافة أقسام المصنع وتسعير الدفعات ثم تسجيل العمال.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => setActiveTab('departments')}
                className="flex items-center gap-3 p-3.5 bg-slate-800/80 hover:bg-emerald-600 text-slate-100 hover:text-white rounded-2xl border border-slate-700 transition text-right group"
              >
                <div className="p-2 bg-slate-700 group-hover:bg-emerald-700 rounded-xl">
                  <Layers className="w-5 h-5 text-emerald-400 group-hover:text-white" />
                </div>
                <div>
                  <div className="text-xs font-bold">الخطوة 1</div>
                  <div className="text-sm font-black">إضافة الأقسام والأسعار</div>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('workers')}
                className="flex items-center gap-3 p-3.5 bg-slate-800/80 hover:bg-emerald-600 text-slate-100 hover:text-white rounded-2xl border border-slate-700 transition text-right group"
              >
                <div className="p-2 bg-slate-700 group-hover:bg-emerald-700 rounded-xl">
                  <Users className="w-5 h-5 text-teal-400 group-hover:text-white" />
                </div>
                <div>
                  <div className="text-xs font-bold">الخطوة 2</div>
                  <div className="text-sm font-black">تسجيل العمال</div>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('daily_entry')}
                className="flex items-center gap-3 p-3.5 bg-slate-800/80 hover:bg-emerald-600 text-slate-100 hover:text-white rounded-2xl border border-slate-700 transition text-right group"
              >
                <div className="p-2 bg-slate-700 group-hover:bg-emerald-700 rounded-xl">
                  <PlusCircle className="w-5 h-5 text-emerald-400 group-hover:text-white" />
                </div>
                <div>
                  <div className="text-xs font-bold">الخطوة 3</div>
                  <div className="text-sm font-black">الإدخال اليومي السريع</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Primary Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Net Due */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">صافي المستحق اليوم</span>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-700">
              {formatCurrency(totalNetDue, settings.currency)}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              المستحق + الإضافي - الخصم
            </p>
          </div>
        </div>

        {/* Total Production Due */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">مستحق الإنتاج (المصاريف)</span>
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <Coins className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">
              {formatCurrency(totalProductionDue, settings.currency)}
            </div>
            <div className="flex items-center gap-1 text-xs text-blue-600 font-semibold mt-1">
              <span>إجمالي الإنتاج: {formatNumber(totalProductionUnits)} وحدة</span>
            </div>
          </div>
        </div>

        {/* Total Overtime */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">إجمالي الإضافي</span>
            <div className="p-2.5 bg-teal-50 text-teal-600 rounded-xl">
              <PlusCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-teal-700">
              {formatCurrency(totalOvertime, settings.currency)}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              مكافآت وحوافز مسجلة
            </p>
          </div>
        </div>

        {/* Total Deductions */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">إجمالي الخصومات</span>
            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
              <MinusCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-rose-700">
              {formatCurrency(totalDeductions, settings.currency)}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              جزاءات واستقطاعات مسجلة
            </p>
          </div>
        </div>
      </div>

      {/* Attendance & Production Counts */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
          <div className="text-xs font-bold text-slate-500 mb-1">العمال النشطين</div>
          <div className="text-xl font-black text-slate-800">{activeWorkers.length}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
          <div className="text-xs font-bold text-slate-500 mb-1">المسجلين اليوم</div>
          <div className="text-xl font-black text-slate-800">{dayRecords.length}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-100 bg-emerald-50/30 text-center">
          <div className="text-xs font-bold text-emerald-700 mb-1">حضور</div>
          <div className="text-xl font-black text-emerald-800">{presentCount}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-rose-100 bg-rose-50/30 text-center">
          <div className="text-xs font-bold text-rose-700 mb-1">غياب</div>
          <div className="text-xl font-black text-rose-800">{absentCount}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-100 bg-amber-50/30 text-center">
          <div className="text-xs font-bold text-amber-700 mb-1">انصراف مبكر</div>
          <div className="text-xl font-black text-amber-800">{earlyLeaveCount}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-orange-100 bg-orange-50/30 text-center">
          <div className="text-xs font-bold text-orange-700 mb-1">تأخير بدون إذن</div>
          <div className="text-xl font-black text-orange-800">{lateCount}</div>
        </div>
      </div>

      {/* Today's Movement Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-black text-slate-900">
              سجل حركات اليوم ({dayRecords.length} سجل)
            </h3>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="بحث باسم أو كود العامل أو القسم..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="px-3.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full sm:w-64"
            />
            <button
              onClick={() => setActiveTab('daily_entry')}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span>إدخال جديد</span>
            </button>
          </div>
        </div>

        {dayRecords.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8" />
            </div>
            <h4 className="text-base font-bold text-slate-800 mb-1">لا توجد حركات مسجلة لهذا اليوم</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
              يمكنك استخدام شاشة الإدخال اليومي السريع لبدء تسجيل الإنتاج والحضور للعمال اليوم.
            </p>
            <button
              onClick={() => setActiveTab('daily_entry')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>بدء تسجيل اليوم</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                <tr>
                  <th className="p-3.5">الكود</th>
                  <th className="p-3.5">اسم العامل</th>
                  <th className="p-3.5">القسم</th>
                  <th className="p-3.5">حالة الحضور</th>
                  <th className="p-3.5 text-center">كمية الإنتاج</th>
                  <th className="p-3.5">المستحق عن الإنتاج</th>
                  <th className="p-3.5">الإضافي</th>
                  <th className="p-3.5">الخصم</th>
                  <th className="p-3.5">صافي المستحق</th>
                  <th className="p-3.5">ملاحظات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDayRecords.map(rec => {
                  const statusConfig = ATTENDANCE_STATUS_COLORS[rec.attendanceStatus] || {
                    bg: 'bg-slate-100',
                    text: 'text-slate-700',
                    border: 'border-slate-200'
                  };
                  return (
                    <tr key={rec.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3.5 font-bold text-slate-600">{rec.workerCode}</td>
                      <td className="p-3.5 font-bold text-slate-900">{rec.workerName}</td>
                      <td className="p-3.5 text-slate-600">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium">
                          {rec.departmentName}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-md text-xs font-bold border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
                        >
                          {ATTENDANCE_STATUS_LABELS[rec.attendanceStatus]}
                        </span>
                      </td>
                      <td className="p-3.5 text-center font-bold text-slate-900">
                        {formatNumber(rec.quantity)} وحدة
                      </td>
                      <td className="p-3.5 font-bold text-slate-800">
                        {formatCurrency(rec.productionDue, settings.currency)}
                      </td>
                      <td className="p-3.5 text-teal-700 font-semibold">
                        {rec.overtime > 0 ? `+${formatCurrency(rec.overtime, '')}` : '-'}
                      </td>
                      <td className="p-3.5 text-rose-700 font-semibold">
                        {rec.deduction > 0 ? `-${formatCurrency(rec.deduction, '')}` : '-'}
                      </td>
                      <td className="p-3.5 font-black text-emerald-700 text-sm">
                        {formatCurrency(rec.netDue, settings.currency)}
                      </td>
                      <td className="p-3.5 text-slate-500 max-w-xs truncate">
                        {rec.notes || '-'}
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
  );
};
