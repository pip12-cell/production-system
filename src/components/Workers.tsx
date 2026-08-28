import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { X, UserPlus, Building2, Hash, Phone, FileText, Coins } from 'lucide-react';
import { DepartmentUnitTier } from '../types';

interface WorkerModalProps {
  isOpen: boolean;
  onClose: () => void;
  workerToEdit?: any;
}

export const WorkerModal: React.FC<WorkerModalProps> = ({ isOpen, onClose, workerToEdit }) => {
  const { departments, saveWorker } = useApp();

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [selectedUnits, setSelectedUnits] = useState<number | ''>('');
  const [calculatedExpense, setCalculatedExpense] = useState<number>(0);
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  // 1. القسم المختار حالياً
  const selectedDepartment = departments.find(d => d.id === departmentId);

  // 2. مستويات الوحدات المتاحة للقسم المختار
  const availableTiers: DepartmentUnitTier[] = React.useMemo(() => {
    if (!selectedDepartment) return [];
    const tiers = (selectedDepartment as any).levels || selectedDepartment.unitTiers;
    if (Array.isArray(tiers) && tiers.length > 0) {
      return tiers;
    }
    // افتراضي إذا كان القسم يحتوي على دفعة واحدة
    const b = selectedDepartment.unitBatch || 25;
    const exp = selectedDepartment.expenseAmount || 107;
    return [1, 2, 3, 4].map(i => ({
      id: `tier_${i}`,
      units: b * i,
      expenseAmount: exp * i
    }));
  }, [selectedDepartment]);

  // 3. تحديث المصاريف تلقائياً فور تغيير عدد الوحدات أو القسم
  useEffect(() => {
    if (!selectedDepartment || !selectedUnits) {
      setCalculatedExpense(0);
      return;
    }

    const matchedTier = availableTiers.find(t => Number(t.units) === Number(selectedUnits));
    if (matchedTier) {
      setCalculatedExpense(matchedTier.expenseAmount);
    } else {
      const rate = (selectedDepartment.expenseAmount || 107) / (selectedDepartment.unitBatch || 25);
      setCalculatedExpense(Number((Number(selectedUnits) * rate).toFixed(2)));
    }
  }, [selectedUnits, selectedDepartment, availableTiers]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveWorker({
      id: workerToEdit?.id,
      code,
      name,
      departmentId,
      defaultUnits: selectedUnits || undefined,
      defaultExpense: calculatedExpense || undefined,
      status,
      phone,
      notes
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100">
        <div className="p-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <UserPlus className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-800">
              {workerToEdit ? 'تعديل بيانات العامل' : 'إضافة عامل جديد'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-right">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">كود العامل *</label>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="101"
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">الاسم الكامل *</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="أحمد محمد علي"
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold"
                required
              />
            </div>
          </div>

          {/* القسم لوحده */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">القسم التابع له *</label>
            <select
              value={departmentId}
              onChange={e => {
                setDepartmentId(e.target.value);
                setSelectedUnits('');
              }}
              className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-emerald-500"
              required
            >
              <option value="">-- اختر القسم --</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          {/* عدد الوحدات المحددة للقسم */}
          {selectedDepartment && (
            <div className="p-3.5 bg-emerald-50/50 border border-emerald-200 rounded-2xl space-y-2">
              <label className="block text-xs font-black text-emerald-900">
                اختر عدد الوحدات الخاصة بالقسم:
              </label>
              
              <div className="flex flex-wrap gap-2">
                {availableTiers.map(tier => (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => setSelectedUnits(tier.units)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                      Number(selectedUnits) === Number(tier.units)
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-400'
                    }`}
                  >
                    {tier.units} وحدة
                  </button>
                ))}
              </div>

              {/* النتيجة والتأثير على المصاريف */}
              {selectedUnits !== '' && (
                <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between text-xs font-bold text-emerald-800">
                  <span>المصاريف المسمّعة للـ ({selectedUnits}) وحدة:</span>
                  <span className="text-sm font-black text-emerald-700">{calculatedExpense} جنيه</span>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">حالة العامل *</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as any)}
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold"
            >
              <option value="active">نشط (يظهر في الإدخال اليومي)</option>
              <option value="inactive">غير نشط</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">رقم الهاتف (اختياري)</label>
            <input
              type="text"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="010xxxxxxxx"
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md"
            >
              {workerToEdit ? 'تعديل البيانات' : 'إضافة العامل'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};