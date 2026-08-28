import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Layers,
  Plus,
  Search,
  Edit2,
  Trash2,
  Coins,
  AlertCircle,
  HelpCircle,
  X,
  Save,
  CheckCircle2,
  Wand2,
  ArrowUpDown,
  PlusCircle,
  Eye,
  ListOrdered
} from 'lucide-react';
import { Department, DepartmentUnitTier } from '../types';
import { formatCurrency, formatNumber, formatDateArabic } from '../utils/calculations';
import { ConfirmModal } from './ConfirmModal';

interface TierFormItem {
  id: string;
  units: number | '';
  expenseAmount: number | '';
}

export const Departments: React.FC = () => {
  const { departments, workers, settings, addDepartment, editDepartment, removeDepartment } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [tiers, setTiers] = useState<TierFormItem[]>([]);
  const [formError, setFormError] = useState('');

  // Quick generator generator fields
  const [genStepUnits, setGenStepUnits] = useState<number>(25);
  const [genStepExpense, setGenStepExpense] = useState<number>(107);
  const [genCount, setGenCount] = useState<number>(10);

  // Delete modal
  const [deleteDeptId, setDeleteDeptId] = useState<string | null>(null);

  // Quick preview modal
  const [previewDept, setPreviewDept] = useState<Department | null>(null);

  const generateDefaultTiers = (stepUnits = 25, stepExpense = 107, count = 10): TierFormItem[] => {
    const list: TierFormItem[] = [];
    const validStep = stepUnits > 0 ? stepUnits : 25;
    const validExp = stepExpense >= 0 ? stepExpense : 107;
    const validCount = count > 0 ? count : 10;

    for (let i = 1; i <= validCount; i++) {
      list.push({
        id: `tier_temp_${i}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        units: validStep * i,
        expenseAmount: Math.round(validExp * i * 100) / 100
      });
    }
    return list;
  };

  const openAddModal = () => {
    setEditingDept(null);
    setName('');
    setNotes('');
    setFormError('');
    setGenStepUnits(25);
    setGenStepExpense(107);
    setGenCount(10);
    // Initialize with standard 10 tiers (25->107, 50->214, ... 250->1070)
    setTiers(generateDefaultTiers(25, 107, 10));
    setIsModalOpen(true);
  };

  const openEditModal = (dept: Department) => {
    setEditingDept(dept);
    setName(dept.name);
    setNotes(dept.notes || '');
    setFormError('');

    if (dept.unitTiers && dept.unitTiers.length > 0) {
      setTiers(
        dept.unitTiers.map(t => ({
          id: t.id || `tier_${Date.now()}_${Math.random()}`,
          units: t.units,
          expenseAmount: t.expenseAmount
        }))
      );
      setGenStepUnits(dept.unitTiers[0].units || 25);
      setGenStepExpense(dept.unitTiers[0].expenseAmount || 107);
      setGenCount(dept.unitTiers.length);
    } else {
      const stepU = dept.unitBatch || 25;
      const stepE = dept.expenseAmount || 107;
      setGenStepUnits(stepU);
      setGenStepExpense(stepE);
      setGenCount(10);
      setTiers(generateDefaultTiers(stepU, stepE, 10));
    }
    setIsModalOpen(true);
  };

  // Tier operations
  const handleAddTierRow = () => {
    const lastTier = tiers[tiers.length - 1];
    const stepUnits = genStepUnits > 0 ? genStepUnits : 25;
    const stepExp = genStepExpense >= 0 ? genStepExpense : 107;
    const nextUnits = lastTier && typeof lastTier.units === 'number' ? lastTier.units + stepUnits : stepUnits;
    const nextExpense = lastTier && typeof lastTier.expenseAmount === 'number' ? Math.round((lastTier.expenseAmount + stepExp) * 100) / 100 : stepExp;

    setTiers(prev => [
      ...prev,
      {
        id: `tier_custom_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        units: nextUnits,
        expenseAmount: nextExpense
      }
    ]);
  };

  const handleUpdateTier = (index: number, field: 'units' | 'expenseAmount', value: number | '') => {
    setTiers(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value
      };
      return updated;
    });
  };

  const handleDeleteTierRow = (index: number) => {
    if (tiers.length <= 1) {
      setFormError('يجب الإبقاء على مستوى تسعير واحد على الأقل للقسم');
      return;
    }
    setTiers(prev => prev.filter((_, i) => i !== index));
  };

  const handleSortTiers = () => {
    setTiers(prev => {
      const sorted = [...prev].sort((a, b) => {
        const uA = Number(a.units) || 0;
        const uB = Number(b.units) || 0;
        return uA - uB;
      });
      return sorted;
    });
  };

  const handleGenerateTiers = () => {
    const generated = generateDefaultTiers(genStepUnits, genStepExpense, genCount);
    setTiers(generated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim()) {
      setFormError('يرجى إدخال اسم القسم');
      return;
    }

    if (tiers.length === 0) {
      setFormError('يرجى إضافة مستوى تسعير واحد على الأقل في جدول الوحدات والمصاريف');
      return;
    }

    // Validate tier rows
    const validTiers: DepartmentUnitTier[] = [];
    for (let i = 0; i < tiers.length; i++) {
      const t = tiers[i];
      const u = Number(t.units);
      const exp = Number(t.expenseAmount);

      if (isNaN(u) || u <= 0) {
        setFormError(`خطأ في المستوى #${i + 1}: عدد الوحدات يجب أن يكون رقماً أكبر من صفر`);
        return;
      }
      if (isNaN(exp) || exp < 0) {
        setFormError(`خطأ في المستوى #${i + 1}: قيمة المصاريف لا يمكن أن تكون سالبة`);
        return;
      }

      validTiers.push({
        id: t.id,
        units: Math.round(u),
        expenseAmount: Math.round(exp * 100) / 100
      });
    }

    // Sort ascending
    validTiers.sort((a, b) => a.units - b.units);

    const primaryBatch = validTiers[0]?.units || 25;
    const primaryExpense = validTiers[0]?.expenseAmount ?? 107;

    try {
      if (editingDept) {
        await editDepartment(editingDept.id, {
          name: name.trim(),
          unitBatch: primaryBatch,
          expenseAmount: primaryExpense,
          unitTiers: validTiers,
          notes: notes.trim()
        });
      } else {
        await addDepartment({
          name: name.trim(),
          unitBatch: primaryBatch,
          expenseAmount: primaryExpense,
          unitTiers: validTiers,
          notes: notes.trim()
        });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'حدث خطأ أثناء حفظ القسم');
    }
  };

  const handleDelete = async () => {
    if (!deleteDeptId) return;
    try {
      await removeDepartment(deleteDeptId);
      setDeleteDeptId(null);
    } catch (err: any) {
      alert(err.message || 'فشل في حذف القسم');
      setDeleteDeptId(null);
    }
  };

  // Filtered departments
  const filteredDepartments = departments.filter(d =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (d.notes && d.notes.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const deptToDelete = departments.find(d => d.id === deleteDeptId);
  const linkedWorkersCount = deptToDelete ? workers.filter(w => w.departmentId === deptToDelete.id).length : 0;

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-600" />
            إدارة الأقسام وجدول مستويات الوحدات والمصاريف
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            تحديد خيارات ومستويات متعددة لعدد الوحدات وقيمة المصاريف لكل قسم (مثل: 25=107ج، 50=214ج...)
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة قسم جديد</span>
        </button>
      </div>

      {/* Info Card explaining the multi-tier system */}
      <div className="bg-gradient-to-l from-teal-900 via-slate-900 to-slate-900 text-white p-5 rounded-3xl border border-teal-800/40 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-teal-500/20 text-teal-400 rounded-xl mt-0.5 shrink-0">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-teal-200">نظام الخيارات المتعددة للوحدات والمصاريف داخل القسم:</h4>
            <p className="text-xs text-slate-300 leading-relaxed mt-1">
              يمكنك تخصيص <strong>جدول مستويات متعدد</strong> لكل قسم (مثلاً: 25 وحدة = 107 جنيه، 50 وحدة = 214 جنيه، 75 وحدة = 321 جنيه، 100 وحدة = 428 جنيه... حتى 250 وحدة وأكثر). 
              عند تسجيل حركة العامل اليومية، ستظهر له كل هذه الخيارات كأزرار سريعة جاهزة بضغطة واحدة مع حساب دائم لا يتأثر بتعديل الإعدادات مستقبلاً.
            </p>
          </div>
        </div>
      </div>

      {/* Departments Table List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-slate-800">قائمة الأقسام المسجلة ({departments.length})</span>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
            <input
              type="text"
              placeholder="بحث في الأقسام..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {departments.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <Layers className="w-8 h-8" />
            </div>
            <h4 className="text-base font-bold text-slate-800 mb-1">لا توجد أقسام مسجلة حتى الآن</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-5">
              لم يتم إنشاء أي أقسام افتراضية وفقاً لطلبك. يمكنك البدء بإضافة أقسام المصنع وجداول الوحدات الآن.
            </p>
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة أول قسم</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-4">اسم القسم</th>
                  <th className="p-4">مستويات الوحدات والمصاريف</th>
                  <th className="p-4">المعدل الأساسي</th>
                  <th className="p-4 text-center">العمال المرتبطين</th>
                  <th className="p-4">ملاحظات</th>
                  <th className="p-4">تاريخ الإنشاء</th>
                  <th className="p-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDepartments.map(dept => {
                  const workerCount = workers.filter(w => w.departmentId === dept.id).length;
                  const tiersList = dept.unitTiers || [];
                  const countTiers = tiersList.length;

                  return (
                    <tr key={dept.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-4">
                        <div className="font-black text-slate-900 text-sm">{dept.name}</div>
                      </td>

                      <td className="p-4 max-w-md">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setPreviewDept(dept)}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                              title="عرض تفاصيل جميع المستويات"
                            >
                              <ListOrdered className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{countTiers} مستويات تسعير</span>
                              <Eye className="w-3 h-3 text-emerald-500 mr-0.5" />
                            </button>
                          </div>

                          {/* Quick preview pills of first few tiers */}
                          <div className="flex flex-wrap gap-1">
                            {tiersList.slice(0, 4).map((t, idx) => (
                              <span
                                key={idx}
                                className="bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded text-[11px] font-medium"
                              >
                                {t.units} و = {t.expenseAmount} {settings.currency}
                              </span>
                            ))}
                            {countTiers > 4 && (
                              <button
                                type="button"
                                onClick={() => setPreviewDept(dept)}
                                className="text-emerald-700 hover:underline text-[11px] font-bold self-center px-1"
                              >
                                +{countTiers - 4} خيارات أخرى
                              </button>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="p-4 font-bold text-slate-700">
                        <span className="bg-slate-100 text-slate-800 px-2 py-1 rounded-md text-xs">
                          كل {dept.unitBatch || tiersList[0]?.units || 25} و = {dept.expenseAmount || tiersList[0]?.expenseAmount || 107} {settings.currency}
                        </span>
                      </td>

                      <td className="p-4 text-center">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          {workerCount} عامل
                        </span>
                      </td>

                      <td className="p-4 text-slate-500 max-w-xs truncate">
                        {dept.notes || '-'}
                      </td>

                      <td className="p-4 text-slate-400 font-mono">
                        {formatDateArabic(dept.createdAt.split('T')[0])}
                      </td>

                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => openEditModal(dept)}
                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 rounded-lg transition"
                            title="تعديل بيانات وجدول القسم"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteDeptId(dept.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition"
                            title="حذف القسم"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* Quick View All Tiers Modal */}
      {previewDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                  <ListOrdered className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    جدول الوحدات والمصاريف: {previewDept.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    إجمالي {previewDept.unitTiers?.length || 0} مستويات تسعير مبرمجة
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPreviewDept(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto space-y-2 pr-1">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">#</th>
                    <th className="p-2.5">عدد الوحدات</th>
                    <th className="p-2.5">المصاريف المقابلة</th>
                    <th className="p-2.5">سعر الوحدة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(previewDept.unitTiers || []).map((tier, idx) => {
                    const uPrice = (tier.expenseAmount || 0) / (tier.units || 1);
                    return (
                      <tr key={tier.id || idx} className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold text-slate-400">{idx + 1}</td>
                        <td className="p-2.5 font-black text-slate-900">
                          {formatNumber(tier.units)} وحدة
                        </td>
                        <td className="p-2.5 font-bold text-emerald-700">
                          {formatCurrency(tier.expenseAmount, settings.currency)}
                        </td>
                        <td className="p-2.5 text-slate-500 font-mono">
                          {uPrice.toFixed(2)} {settings.currency}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  const dept = previewDept;
                  setPreviewDept(null);
                  openEditModal(dept);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>تعديل هذا الجدول</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewDept(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Department & Multi-Tier Table Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    {editingDept ? 'تعديل بيانات وجدول القسم' : 'إضافة قسم جديد وتحديد جدول الوحدات والمصاريف'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    إمكانية إضافة أكثر من 10 مستويات لعدد الوحدات مقابل المصاريف
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Department Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  اسم القسم <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: قسم التعبئة والتغليف، قسم القص، قسم الخياطة..."
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm font-semibold bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
                />
              </div>

              {/* Multi-Tier Table Section */}
              <div className="bg-slate-50/80 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
                  <div>
                    <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                      <Coins className="w-4 h-4 text-emerald-600" />
                      جدول الوحدات والمصاريف
                      <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                        {tiers.length} مستويات
                      </span>
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      حدد عدد الوحدات وما يقابلها من مصاريف بالجنيه لتظهر كخيارات سريعة عند التسجيل
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSortTiers}
                      className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-2xs"
                      title="ترتيب المستويات تصاعدياً حسب عدد الوحدات"
                    >
                      <ArrowUpDown className="w-3.5 h-3.5" />
                      <span>ترتيب تصاعدي</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleAddTierRow}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>إضافة مستوى جديد</span>
                    </button>
                  </div>
                </div>

                {/* Quick Auto-Generator Helper */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-xs flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-slate-700 font-bold">
                    <Wand2 className="w-4 h-4 text-teal-600" />
                    <span>توليد مستويات سريعة:</span>
                  </div>

                  <div className="flex items-center flex-wrap gap-2">
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] text-slate-500 font-semibold">كل:</span>
                      <input
                        type="number"
                        min="1"
                        value={genStepUnits}
                        onChange={e => setGenStepUnits(Number(e.target.value) || 25)}
                        className="w-16 px-2 py-1 bg-slate-50 border border-slate-300 rounded-lg text-center font-bold text-xs"
                      />
                      <span className="text-[11px] text-slate-500">وحدة</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="text-[11px] text-slate-500 font-semibold">=</span>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={genStepExpense}
                        onChange={e => setGenStepExpense(Number(e.target.value) || 107)}
                        className="w-16 px-2 py-1 bg-slate-50 border border-slate-300 rounded-lg text-center font-bold text-xs"
                      />
                      <span className="text-[11px] text-slate-500">{settings.currency}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="text-[11px] text-slate-500 font-semibold">عدد المستويات:</span>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={genCount}
                        onChange={e => setGenCount(Number(e.target.value) || 10)}
                        className="w-14 px-2 py-1 bg-slate-50 border border-slate-300 rounded-lg text-center font-bold text-xs"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleGenerateTiers}
                      className="px-3 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-lg text-xs font-bold transition flex items-center gap-1"
                    >
                      <span>⚡ توليد {genCount} مستويات</span>
                    </button>
                  </div>
                </div>

                {/* Tiers Rows List */}
                <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 sticky top-0 z-10">
                      <tr>
                        <th className="p-3 text-center w-12">#</th>
                        <th className="p-3">عدد الوحدات</th>
                        <th className="p-3">المصاريف المقابلة ({settings.currency})</th>
                        <th className="p-3">سعر الوحدة</th>
                        <th className="p-3 text-center w-14">حذف</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {tiers.map((tier, idx) => {
                        const numU = typeof tier.units === 'number' ? tier.units : (Number(tier.units) || 0);
                        const numE = typeof tier.expenseAmount === 'number' ? tier.expenseAmount : (Number(tier.expenseAmount) || 0);
                        const calcUnitPrice = numU > 0 ? (numE / numU).toFixed(2) : '0.00';

                        return (
                          <tr key={tier.id} className="hover:bg-slate-50/80">
                            <td className="p-3 text-center font-bold text-slate-400">
                              {idx + 1}
                            </td>

                            <td className="p-2.5">
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="number"
                                  min="1"
                                  required
                                  value={tier.units}
                                  onChange={e => handleUpdateTier(idx, 'units', e.target.value === '' ? '' : Number(e.target.value))}
                                  placeholder="عدد الوحدات"
                                  className="w-full px-3 py-1.5 text-xs font-black bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
                                />
                                <span className="text-[11px] text-slate-400 font-bold shrink-0">وحدة</span>
                              </div>
                            </td>

                            <td className="p-2.5">
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  required
                                  value={tier.expenseAmount}
                                  onChange={e => handleUpdateTier(idx, 'expenseAmount', e.target.value === '' ? '' : Number(e.target.value))}
                                  placeholder="المصاريف"
                                  className="w-full px-3 py-1.5 text-xs font-black text-emerald-800 bg-emerald-50/40 border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
                                />
                                <span className="text-[11px] text-emerald-700 font-bold shrink-0">{settings.currency}</span>
                              </div>
                            </td>

                            <td className="p-3 font-mono text-slate-500 text-xs">
                              {calcUnitPrice} {settings.currency}
                            </td>

                            <td className="p-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleDeleteTierRow(idx)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                title="حذف هذا المستوى"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>💡 يمكنك إضافة مستويات إضافية أو تعديل أي رقم بشكل مخصص.</span>
                  <button
                    type="button"
                    onClick={handleAddTierRow}
                    className="text-emerald-700 hover:underline font-bold"
                  >
                    + إضافة سطر مستوى جديد
                  </button>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  ملاحظات اختيارية عن القسم
                </label>
                <textarea
                  rows={2}
                  placeholder="أي ملاحظات تخص طبيعة العمل بهذا القسم..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingDept ? 'حفظ تعديلات القسم والجدول' : 'حفظ وإضافة القسم'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteDeptId}
        title="تأكيد حذف القسم"
        message={
          linkedWorkersCount > 0
            ? `تنبيه: يوجد ${linkedWorkersCount} عامل مسجلين في هذا القسم. لا يمكن حذف القسم قبل تعديل قسم هؤلاء العمال أولاً لحماية سلامة البيانات.`
            : `هل أنت متأكد من حذف قسم "${deptToDelete?.name}"؟ لن تتأثر السجلات التاريخية المسجلة مسبقاً بهذا القسم.`
        }
        confirmText={linkedWorkersCount > 0 ? 'مفهوم' : 'نعم، احذف القسم'}
        cancelText="إلغاء"
        isDestructive={linkedWorkersCount === 0}
        onConfirm={() => {
          if (linkedWorkersCount > 0) {
            setDeleteDeptId(null);
          } else {
            handleDelete();
          }
        }}
        onCancel={() => setDeleteDeptId(null)}
      />
    </div>
  );
};
