import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  Calendar,
  User,
  Layers,
  Coins,
  CheckCircle2,
  AlertTriangle,
  Clock,
  PlusCircle,
  MinusCircle,
  Save,
  RotateCcw,
  Search,
  Check,
  Edit2,
  Trash2,
  Info,
  Sparkles,
  ListOrdered
} from 'lucide-react';
import {
  calculateProductionDue,
  calculateNetDue,
  formatCurrency,
  formatNumber,
  formatDateArabic,
  getTodayString
} from '../utils/calculations';
import { AttendanceStatus, ATTENDANCE_STATUS_LABELS, ATTENDANCE_STATUS_COLORS, DailyRecord, DepartmentUnitTier } from '../types';
import { ConfirmModal } from './ConfirmModal';

export const DailyEntry: React.FC = () => {
  const {
    workers,
    departments,
    records,
    settings,
    saveDailyRecord,
    removeDailyRecord,
    selectedDate,
    setSelectedDate,
    setActiveTab
  } = useApp();

  // Form states
  const [entryDate, setEntryDate] = useState<string>(selectedDate || getTodayString());
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>('');
  const [workerSearch, setWorkerSearch] = useState<string>('');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [productionDue, setProductionDue] = useState<number | ''>('');
  const [selectedTierId, setSelectedTierId] = useState<string>('');
  const [attendanceStatus, setAttendanceStatus] = useState<AttendanceStatus>('present');
  const [deduction, setDeduction] = useState<number | ''>(0);
  const [overtime, setOvertime] = useState<number | ''>(0);
  const [notes, setNotes] = useState<string>('');

  // Editing state
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Sync entryDate with selectedDate when header changes
  useEffect(() => {
    if (selectedDate) {
      setEntryDate(selectedDate);
    }
  }, [selectedDate]);

  // Selected Worker & Department
  const selectedWorker = useMemo(() => {
    return workers.find(w => w.id === selectedWorkerId);
  }, [workers, selectedWorkerId]);

  const selectedDepartment = useMemo(() => {
    if (!selectedWorker) return null;
    return departments.find(d => d.id === selectedWorker.departmentId);
  }, [selectedWorker, departments]);

  // Department unit tiers list
  const departmentTiers: DepartmentUnitTier[] = useMemo(() => {
    if (!selectedDepartment) return [];
    if (Array.isArray(selectedDepartment.unitTiers) && selectedDepartment.unitTiers.length > 0) {
      return [...selectedDepartment.unitTiers].sort((a, b) => a.units - b.units);
    }
    // Fallback if department has old format
    const b = selectedDepartment.unitBatch || 25;
    const exp = selectedDepartment.expenseAmount || 107;
    const fallback: DepartmentUnitTier[] = [];
    for (let i = 1; i <= 10; i++) {
      fallback.push({
        id: `tier_fallback_${i}`,
        units: b * i,
        expenseAmount: Math.round(exp * i * 100) / 100
      });
    }
    return fallback;
  }, [selectedDepartment]);

  const unitBatch = selectedDepartment ? selectedDepartment.unitBatch || 25 : 25;
  const expenseAmount = selectedDepartment ? selectedDepartment.expenseAmount || 107 : 107;
  const unitPrice = (expenseAmount || 107) / (unitBatch || 25);

  // Check if a record already exists for this worker on this date
  const existingRecord = useMemo(() => {
    if (!selectedWorkerId || !entryDate) return null;
    return records.find(r => r.workerId === selectedWorkerId && r.date === entryDate);
  }, [records, selectedWorkerId, entryDate]);

  // When an existing record is detected, prompt or auto-fill if editing
  const loadExistingRecord = (rec: DailyRecord) => {
    setEditingRecordId(rec.id);
    setSelectedWorkerId(rec.workerId);
    setEntryDate(rec.date);
    setQuantity(rec.quantity);
    setProductionDue(rec.productionDue);
    setSelectedTierId(rec.selectedTierId || '');
    setAttendanceStatus(rec.attendanceStatus);
    setDeduction(rec.deduction);
    setOvertime(rec.overtime);
    setNotes(rec.notes || '');
  };

  // Select a tier directly from the department's tier list
  const handleSelectTier = (tier: DepartmentUnitTier) => {
    setQuantity(tier.units);
    setProductionDue(tier.expenseAmount);
    setSelectedTierId(tier.id);
  };

  // Handle manual quantity input change
  const handleQuantityChange = (newQtyVal: number | '') => {
    setQuantity(newQtyVal);
    if (newQtyVal === '' || newQtyVal === 0) {
      setProductionDue(0);
      setSelectedTierId('');
      return;
    }

    // Check if the quantity exactly matches one of the department's configured tiers
    const matchedTier = departmentTiers.find(t => t.units === Number(newQtyVal));
    if (matchedTier) {
      setProductionDue(matchedTier.expenseAmount);
      setSelectedTierId(matchedTier.id);
    } else {
      // Calculate proportional expense based on base unit price
      const calculated = calculateProductionDue(Number(newQtyVal), unitBatch, expenseAmount);
      setProductionDue(calculated);
      setSelectedTierId('');
    }
  };

  // Real-time calculation numbers
  const numQuantity = typeof quantity === 'number' ? quantity : (Number(quantity) || 0);
  const numProductionDue = typeof productionDue === 'number' ? productionDue : (Number(productionDue) || 0);
  const numDeduction = typeof deduction === 'number' ? deduction : (Number(deduction) || 0);
  const numOvertime = typeof overtime === 'number' ? overtime : (Number(overtime) || 0);

  const calculatedNetDue = useMemo(() => {
    return calculateNetDue(numProductionDue, numOvertime, numDeduction);
  }, [numProductionDue, numOvertime, numDeduction]);

  // Filtered workers list for autocomplete / selector
  const filteredWorkers = useMemo(() => {
    const term = workerSearch.trim().toLowerCase();
    const activeList = workers.filter(w => w.status === 'active');
    if (!term) return activeList;
    return activeList.filter(
      w => w.name.toLowerCase().includes(term) || w.code.toLowerCase().includes(term)
    );
  }, [workers, workerSearch]);

  // Reset form
  const handleResetForm = () => {
    setSelectedWorkerId('');
    setWorkerSearch('');
    setQuantity('');
    setProductionDue('');
    setSelectedTierId('');
    setAttendanceStatus('present');
    setDeduction(0);
    setOvertime(0);
    setNotes('');
    setEditingRecordId(null);
  };

  // Handle Attendance status change
  const handleStatusChange = (status: AttendanceStatus) => {
    setAttendanceStatus(status);
    if (status === 'absent') {
      setQuantity(0);
      setProductionDue(0);
      setSelectedTierId('');
    }
  };

  // Handle Save
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkerId) {
      alert('يرجى اختيار العامل');
      return;
    }
    if (!entryDate) {
      alert('يرجى تحديد التاريخ');
      return;
    }

    try {
      await saveDailyRecord({
        id: editingRecordId || (existingRecord ? existingRecord.id : undefined),
        date: entryDate,
        workerId: selectedWorkerId,
        quantity: numQuantity,
        productionDue: numProductionDue,
        selectedTierId: selectedTierId || undefined,
        attendanceStatus,
        deduction: numDeduction,
        overtime: numOvertime,
        notes
      });

      // Reset worker selection while keeping date
      handleResetForm();
    } catch (err: any) {
      console.error(err);
    }
  };

  // Today's records for bottom table
  const dayRecords = useMemo(() => {
    return records.filter(r => r.date === entryDate);
  }, [records, entryDate]);

  return (
    <div className="space-y-6">
      {/* If no departments or workers exist, alert user */}
      {departments.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3 text-amber-800">
            <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
            <div>
              <h4 className="font-bold text-sm">لا توجد أقسام مسجلة في النظام</h4>
              <p className="text-xs text-amber-700 mt-0.5">
                يجب إضافة قسم واحد على الأقل وتحديد جدول خيارات الوحدات والمصاريف قبل تسجيل إنتاج العمال.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('departments')}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition shrink-0"
          >
            إضافة قسم الآن
          </button>
        </div>
      ) : workers.length === 0 ? (
        <div className="bg-blue-50 border border-blue-200 p-5 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3 text-blue-800">
            <Info className="w-6 h-6 text-blue-600 shrink-0" />
            <div>
              <h4 className="font-bold text-sm">لا يوجد عمال مسجلين في النظام</h4>
              <p className="text-xs text-blue-700 mt-0.5">
                يرجى إضافة عمال وربطهم بالأقسام لبدء تسجيل الإنتاج اليومي.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('workers')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shrink-0"
          >
            إضافة عمال الآن
          </button>
        </div>
      ) : null}

      {/* Main Entry Card */}
      <form onSubmit={handleSave} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Card Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl">
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black">
                {editingRecordId ? 'تعديل حركة يومية للعامل' : 'تسجيل حركة يومية جديدة للإنتاج والحضور'}
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                اختيار سريع لمستويات الوحدات والمصاريف المبرمجة بالقسم مع حفظ دائم للسجلات
              </p>
            </div>
          </div>

          {/* Date Selector in Entry Card */}
          <div className="flex items-center gap-2 bg-slate-800/80 px-3.5 py-1.5 rounded-xl border border-slate-700">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-slate-300 font-semibold">تاريخ الحركة:</span>
            <input
              type="date"
              value={entryDate}
              onChange={e => {
                setEntryDate(e.target.value);
                setSelectedDate(e.target.value);
              }}
              className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
            />
          </div>
        </div>

        {/* Existing Record Notice */}
        {existingRecord && !editingRecordId && (
          <div className="bg-amber-50 border-b border-amber-200 px-5 py-3 flex items-center justify-between text-amber-900 text-xs">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>تنبيه:</strong> يوجد سجل مسجل مسبقاً للعامل ({existingRecord.workerName}) في تاريخ {formatDateArabic(entryDate)} بإنتاج {formatNumber(existingRecord.quantity)} وحدة ومستحق {formatCurrency(existingRecord.netDue, settings.currency)}.
              </span>
            </div>
            <button
              type="button"
              onClick={() => loadExistingRecord(existingRecord)}
              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold transition"
            >
              تحميل بيانات السجل لتعديلها
            </button>
          </div>
        )}

        <div className="p-6 space-y-6">
          {/* Row 1: Worker Selection & Department Auto-Loaded */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Worker Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                1. اختيار العامل <span className="text-rose-500">*</span>
              </label>
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="بحث سريع باسم العامل أو الكود..."
                    value={workerSearch}
                    onChange={e => setWorkerSearch(e.target.value)}
                    className="w-full pr-10 pl-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
                  />
                </div>
                <select
                  value={selectedWorkerId}
                  onChange={e => {
                    setSelectedWorkerId(e.target.value);
                    const found = records.find(r => r.workerId === e.target.value && r.date === entryDate);
                    if (found) {
                      // Let user know
                    }
                  }}
                  className="w-full px-3.5 py-2.5 text-sm font-semibold bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                  required
                >
                  <option value="">-- اختر العامل من القائمة --</option>
                  {filteredWorkers.map(w => {
                    const dept = departments.find(d => d.id === w.departmentId);
                    return (
                      <option key={w.id} value={w.id}>
                        [{w.code}] {w.name} - ({dept ? dept.name : 'بدون قسم'})
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Department Details Badge (Auto-loaded) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                2. القسم وجدول الخيارات المتاحة (تلقائي)
              </label>
              {selectedDepartment ? (
                <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-3.5 text-emerald-950 flex flex-col justify-between min-h-[82px]">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm flex items-center gap-1.5 text-emerald-900">
                      <Layers className="w-4 h-4 text-emerald-600" />
                      القسم: {selectedDepartment.name}
                    </span>
                    <span className="text-xs px-2.5 py-0.5 bg-emerald-200/80 text-emerald-900 rounded-full font-bold">
                      {departmentTiers.length} مستويات تسعير
                    </span>
                  </div>
                  <div className="text-xs text-emerald-800 font-medium mt-1">
                    المعدل الأساسي للقسم: <strong>كل {selectedDepartment.unitBatch || 25} وحدة = {selectedDepartment.expenseAmount || 107} {settings.currency}</strong> (سعر الوحدة: {unitPrice.toFixed(2)})
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 border-dashed rounded-2xl p-4 text-slate-400 text-xs flex items-center justify-center min-h-[82px]">
                  {selectedWorkerId
                    ? 'هذا العامل غير مرتبط بقسم صالح'
                    : 'اختر العامل أولاً لتحميل قسمه وجدول الوحدات والمصاريف التلقائي'}
                </div>
              )}
            </div>
          </div>

          {/* Row 2: Attendance Status */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              3. حالة الحضور اليومي <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {(['present', 'absent', 'early_leave', 'late_unexcused'] as AttendanceStatus[]).map(status => {
                const isSelected = attendanceStatus === status;
                const config = ATTENDANCE_STATUS_COLORS[status];
                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => handleStatusChange(status)}
                    className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border ${
                      isSelected
                        ? `${config.bg} ${config.text} ${config.border} ring-2 ring-emerald-500 shadow-xs`
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {isSelected && <Check className="w-4 h-4" />}
                    <span>{ATTENDANCE_STATUS_LABELS[status]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 3: Unit and Expense Multi-Tier Selection (Key Feature) */}
          <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="block text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  4. اختر عدد الوحدات والمصاريف للقسم ({selectedDepartment ? selectedDepartment.name : 'اختر العامل أولاً'}):
                </label>
                <p className="text-xs text-slate-500 mt-0.5">
                  اضغط على المستوى المطلوب لتسجيل الوحدات وقيمة المصاريف تلقائياً
                </p>
              </div>

              {selectedDepartment && (
                <div className="text-xs font-bold text-emerald-800 bg-emerald-100/80 border border-emerald-200 px-3 py-1 rounded-xl">
                  {departmentTiers.length} خيارات متاحة للقسم
                </div>
              )}
            </div>

            {/* Visual Interactive Cards for Department Tiers */}
            {departmentTiers.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-5 gap-2.5">
                {departmentTiers.map((tier, idx) => {
                  const isSelected = numQuantity === tier.units && numProductionDue === tier.expenseAmount;
                  return (
                    <button
                      key={tier.id || idx}
                      type="button"
                      onClick={() => handleSelectTier(tier)}
                      className={`p-3 rounded-2xl text-center transition flex flex-col items-center justify-between border cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-400 scale-[1.02]'
                          : 'bg-white text-slate-800 border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/40'
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-black">
                          [ {tier.units} وحدة ]
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-emerald-200" />}
                      </div>
                      <div className={`text-sm font-black mt-1 ${isSelected ? 'text-emerald-100' : 'text-emerald-700'}`}>
                        {tier.expenseAmount} {settings.currency}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 bg-white rounded-xl border border-slate-200 text-center text-slate-400 text-xs">
                {selectedWorkerId
                  ? 'لم يتم تحديد جدول مستويات لهذا القسم بعد. يمكنك إدخال الكمية يدوياً بالأسفل.'
                  : 'اختر العامل لعرض مستويات وخيارات الوحدات والمصاريف المتاحة لقسمه'}
              </div>
            )}

            {/* Custom Quantity & Custom Expense Amount Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200/80">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  أو كتابة عدد وحدات مخصص يدوياً:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="مثال: 35 أو 60 أو 180..."
                    value={quantity}
                    onChange={e => handleQuantityChange(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-4 py-2.5 text-sm font-bold bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <span className="text-xs font-bold text-slate-500 shrink-0">وحدة</span>
                </div>
              </div>

              {/* Exact Production Due (المصاريف المسجلة) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  المصاريف اليومية المسجلة ({settings.currency}):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="قيمة المصاريف بالجنيه"
                    value={productionDue}
                    onChange={e => setProductionDue(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-4 py-2.5 text-sm font-black text-emerald-800 bg-emerald-50/50 border border-emerald-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
                  />
                  <span className="text-xs font-bold text-emerald-700 shrink-0">{settings.currency}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Row 4: Deductions, Overtime & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Deduction */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                5. الخصم ({settings.currency})
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={deduction}
                onChange={e => setDeduction(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="0"
                className="w-full px-3.5 py-2 text-sm font-bold text-rose-700 bg-rose-50/40 border border-rose-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            {/* Overtime */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                6. الإضافي ({settings.currency})
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={overtime}
                onChange={e => setOvertime(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="0"
                className="w-full px-3.5 py-2 text-sm font-bold text-teal-700 bg-teal-50/40 border border-teal-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                7. ملاحظات على الحركة
              </label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="ملاحظات اختيارية..."
                className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Row 5: Final Net Due Display & Submit Buttons */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Calculation summary badge */}
            <div className="bg-slate-900 text-white px-5 py-3 rounded-2xl flex items-center gap-4">
              <div>
                <span className="text-xs text-slate-400 font-medium block">صافي المستحق النهائي:</span>
                <span className="text-xs text-emerald-400 font-mono">
                  {numProductionDue} مصاريف + {numOvertime} إضافي - {numDeduction} خصم
                </span>
              </div>
              <div className="text-2xl font-black text-emerald-400">
                {formatCurrency(calculatedNetDue, settings.currency)}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleResetForm}
                className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>إعادة تعيين</span>
              </button>

              <button
                type="submit"
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-sm font-black transition flex items-center gap-2 shadow-md shadow-emerald-900/20"
              >
                <Save className="w-5 h-5" />
                <span>{editingRecordId ? 'حفظ التعديلات' : 'حفظ السجل اليومي'}</span>
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Today's Saved Records Ledger */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h3 className="text-base font-black text-slate-900">
              سجلات يوم: {formatDateArabic(entryDate)} ({dayRecords.length} حركة)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              السجلات التاريخية محفوظة بقيمها الأصلية دون أن تتأثر بأي تعديلات مستقبلية في تسعير القسم
            </p>
          </div>
        </div>

        {dayRecords.length === 0 ? (
          <div className="p-10 text-center text-slate-400">
            <Info className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="text-xs font-bold text-slate-500">لا توجد حركات مسجلة في هذا التاريخ حتى الآن</p>
            <p className="text-[11px] text-slate-400 mt-1">
              قم باختيار العامل والضغط على خيار الوحدات والمصاريف ثم اضغط على "حفظ السجل اليومي".
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">الكود</th>
                  <th className="p-3">اسم العامل</th>
                  <th className="p-3">القسم</th>
                  <th className="p-3">حالة الحضور</th>
                  <th className="p-3 text-center">الكمية</th>
                  <th className="p-3">المستحق عن الإنتاج (المصاريف)</th>
                  <th className="p-3">الإضافي</th>
                  <th className="p-3">الخصم</th>
                  <th className="p-3">الصافي</th>
                  <th className="p-3">ملاحظات</th>
                  <th className="p-3 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dayRecords.map(rec => {
                  const statusConfig = ATTENDANCE_STATUS_COLORS[rec.attendanceStatus] || {
                    bg: 'bg-slate-100',
                    text: 'text-slate-700',
                    border: 'border-slate-200'
                  };
                  return (
                    <tr key={rec.id} className="hover:bg-slate-50 transition">
                      <td className="p-3 font-bold text-slate-600">{rec.workerCode}</td>
                      <td className="p-3 font-bold text-slate-900">{rec.workerName}</td>
                      <td className="p-3 text-slate-600">
                        <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md font-semibold">
                          {rec.departmentName}
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
                        >
                          {ATTENDANCE_STATUS_LABELS[rec.attendanceStatus]}
                        </span>
                      </td>
                      <td className="p-3 text-center font-bold text-slate-800">
                        {formatNumber(rec.quantity)} وحدة
                      </td>
                      <td className="p-3 font-bold text-emerald-800">
                        {formatCurrency(rec.productionDue, settings.currency)}
                      </td>
                      <td className="p-3 text-teal-700 font-semibold">
                        {rec.overtime > 0 ? `+${rec.overtime}` : '0'}
                      </td>
                      <td className="p-3 text-rose-700 font-semibold">
                        {rec.deduction > 0 ? `-${rec.deduction}` : '0'}
                      </td>
                      <td className="p-3 font-black text-emerald-700">
                        {formatCurrency(rec.netDue, settings.currency)}
                      </td>
                      <td className="p-3 text-slate-500 max-w-xs truncate">{rec.notes || '-'}</td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => loadExistingRecord(rec)}
                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 rounded-lg transition"
                            title="تعديل هذا السجل"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(rec.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition"
                            title="حذف هذا السجل"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteConfirmId}
        title="تأكيد حذف السجل اليومي"
        message="هل أنت متأكد من رغبتك في حذف هذا السجل؟ لا يمكن التراجع عن هذا الإجراء."
        confirmText="نعم، احذف السجل"
        cancelText="إلغاء"
        onConfirm={async () => {
          if (deleteConfirmId) {
            await removeDailyRecord(deleteConfirmId);
            setDeleteConfirmId(null);
          }
        }}
        onCancel={() => setDeleteConfirmId(null)}
      />
    </div>
  );
};
