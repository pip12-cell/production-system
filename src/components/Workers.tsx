import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  Phone,
  Layers,
  UserCheck,
  UserX,
  X,
  Save,
  AlertCircle,
  FileText
} from 'lucide-react';
import { Worker } from '../types';
import { formatDateArabic } from '../utils/calculations';
import { ConfirmModal } from './ConfirmModal';

export const Workers: React.FC = () => {
  const { workers, departments, records, addWorker, editWorker, removeWorker, setActiveTab } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);

  // Form Fields
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  // Delete modal
  const [deleteWorkerId, setDeleteWorkerId] = useState<string | null>(null);

  const openAddModal = () => {
    setEditingWorker(null);
    // Suggest next code if numeric
    const maxCode = workers.reduce((max, w) => {
      const num = parseInt(w.code, 10);
      return !isNaN(num) && num > max ? num : max;
    }, 0);
    setCode(maxCode > 0 ? String(maxCode + 1) : '101');
    setName('');
    setDepartmentId(departments[0]?.id || '');
    setStatus('active');
    setPhone('');
    setNotes('');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (worker: Worker) => {
    setEditingWorker(worker);
    setCode(worker.code);
    setName(worker.name);
    setDepartmentId(worker.departmentId);
    setStatus(worker.status);
    setPhone(worker.phone || '');
    setNotes(worker.notes || '');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!code.trim()) {
      setFormError('يرجى إدخال كود العامل');
      return;
    }
    if (!name.trim()) {
      setFormError('يرجى إدخال اسم العامل الكامل');
      return;
    }
    if (!departmentId) {
      setFormError('يرجى اختيار القسم التابع له العامل');
      return;
    }

    try {
      if (editingWorker) {
        await editWorker(editingWorker.id, {
          code: code.trim(),
          name: name.trim(),
          departmentId,
          status,
          phone: phone.trim(),
          notes: notes.trim()
        });
      } else {
        await addWorker({
          code: code.trim(),
          name: name.trim(),
          departmentId,
          status,
          phone: phone.trim(),
          notes: notes.trim()
        });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'حدث خطأ أثناء حفظ بيانات العامل');
    }
  };

  const handleDelete = async () => {
    if (!deleteWorkerId) return;
    try {
      await removeWorker(deleteWorkerId);
      setDeleteWorkerId(null);
    } catch (err: any) {
      alert(err.message || 'فشل في حذف العامل');
      setDeleteWorkerId(null);
    }
  };

  const toggleStatus = async (worker: Worker) => {
    const newStatus = worker.status === 'active' ? 'inactive' : 'active';
    await editWorker(worker.id, { status: newStatus });
  };

  // Filtered workers list
  const filteredWorkers = useMemo(() => {
    return workers.filter(w => {
      const matchesSearch =
        w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (w.phone && w.phone.includes(searchTerm));

      const matchesDept = departmentFilter === 'all' || w.departmentId === departmentFilter;
      const matchesStatus = statusFilter === 'all' || w.status === statusFilter;

      return matchesSearch && matchesDept && matchesStatus;
    });
  }, [workers, searchTerm, departmentFilter, statusFilter]);

  const activeCount = workers.filter(w => w.status === 'active').length;
  const inactiveCount = workers.filter(w => w.status === 'inactive').length;

  const workerToDelete = workers.find(w => w.id === deleteWorkerId);
  const workerRecordsCount = workerToDelete ? records.filter(r => r.workerId === workerToDelete.id).length : 0;

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            إدارة سجل العمال
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            إضافة وتعديل بيانات العمال وتعيين الأقسام وحالة النشاط
          </p>
        </div>

        <div className="flex items-center gap-2">
          {departments.length === 0 ? (
            <button
              onClick={() => setActiveTab('departments')}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2"
            >
              <Layers className="w-4 h-4" />
              <span>إضافة قسم أولاً</span>
            </button>
          ) : (
            <button
              onClick={openAddModal}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة عامل جديد</span>
            </button>
          )}
        </div>
      </div>

      {/* Quick Status Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 block">إجمالي العمال المسجلين</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">{workers.length}</span>
          </div>
          <div className="p-3 bg-slate-100 text-slate-700 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-100 bg-emerald-50/20 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-emerald-700 block">العمال النشطين</span>
            <span className="text-2xl font-black text-emerald-800 mt-1 block">{activeCount}</span>
          </div>
          <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 block">العمال الموقوفين / غير النشطين</span>
            <span className="text-2xl font-black text-slate-700 mt-1 block">{inactiveCount}</span>
          </div>
          <div className="p-3 bg-slate-100 text-slate-500 rounded-xl">
            <UserX className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Workers Filter and Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Filters Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
            <input
              type="text"
              placeholder="بحث بالاسم أو الكود أو رقم الهاتف..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center flex-wrap gap-2.5">
            {/* Department Filter */}
            <select
              value={departmentFilter}
              onChange={e => setDepartmentFilter(e.target.value)}
              className="px-3 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
            >
              <option value="all">جميع الأقسام ({departments.length})</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
            >
              <option value="all">جميع الحالات</option>
              <option value="active">نشط فقط</option>
              <option value="inactive">غير نشط فقط</option>
            </select>
          </div>
        </div>

        {workers.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8" />
            </div>
            <h4 className="text-base font-bold text-slate-800 mb-1">لا يوجد عمال مسجلين حتى الآن</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-5">
              قائمة العمال تبدأ فارغة تماماً بدون أي بيانات وهمية. أضف عمال المصنع لبدء تتبع إنتاجهم اليومي.
            </p>
            {departments.length === 0 ? (
              <button
                onClick={() => setActiveTab('departments')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition"
              >
                <Layers className="w-4 h-4" />
                <span>إضافة قسم أولاً</span>
              </button>
            ) : (
              <button
                onClick={openAddModal}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة أول عامل</span>
              </button>
            )}
          </div>
        ) : filteredWorkers.length === 0 ? (
          <div className="p-10 text-center text-slate-400">
            <Search className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="text-xs font-bold text-slate-600">لا توجد نتائج مطابقة لمعايير البحث</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-4">الكود</th>
                  <th className="p-4">اسم العامل</th>
                  <th className="p-4">القسم</th>
                  <th className="p-4 text-center">الحالة</th>
                  <th className="p-4">رقم الهاتف</th>
                  <th className="p-4">ملاحظات</th>
                  <th className="p-4">تاريخ الإضافة</th>
                  <th className="p-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredWorkers.map(w => {
                  const dept = departments.find(d => d.id === w.departmentId);
                  const isActive = w.status === 'active';
                  return (
                    <tr key={w.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-4 font-mono font-bold text-slate-800 text-sm">
                        {w.code}
                      </td>
                      <td className="p-4 font-bold text-slate-900 text-sm">
                        {w.name}
                      </td>
                      <td className="p-4">
                        {dept ? (
                          <span className="bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md font-semibold">
                            {dept.name}
                          </span>
                        ) : (
                          <span className="text-rose-500 font-medium">غير محدد</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <button
                          type="button"
                          onClick={() => toggleStatus(w)}
                          className={`px-3 py-1 rounded-full text-xs font-bold transition border ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                          }`}
                          title="اضغط لتبديل حالة النشاط"
                        >
                          {isActive ? 'نشط' : 'موقوف'}
                        </button>
                      </td>
                      <td className="p-4 font-mono text-slate-600">
                        {w.phone || '-'}
                      </td>
                      <td className="p-4 text-slate-500 max-w-xs truncate">
                        {w.notes || '-'}
                      </td>
                      <td className="p-4 text-slate-400 font-mono">
                        {formatDateArabic(w.createdAt.split('T')[0])}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => openEditModal(w)}
                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 rounded-lg transition"
                            title="تعديل بيانات العامل"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteWorkerId(w.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition"
                            title="حذف العامل"
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

      {/* Add / Edit Worker Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-black text-slate-900">
                  {editingWorker ? 'تعديل بيانات العامل' : 'إضافة عامل جديد'}
                </h3>
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

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Worker Code */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    كود العامل <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: 101"
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm font-mono font-bold bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
                  />
                </div>

                {/* Worker Full Name */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    الاسم الكامل للعامل <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: أحمد محمد علي"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Department & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    القسم التابع له <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={departmentId}
                    onChange={e => setDepartmentId(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none cursor-pointer"
                    required
                  >
                    <option value="">-- اختر القسم --</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name} (كل {d.unitBatch} = {d.expenseAmount})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    حالة العامل <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none cursor-pointer"
                  >
                    <option value="active">نشط (يظهر في الإدخال اليومي)</option>
                    <option value="inactive">موقوف / غير نشط</option>
                  </select>
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  رقم الهاتف (اختياري)
                </label>
                <input
                  type="text"
                  placeholder="010xxxxxxxx"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none font-mono"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  ملاحظات اختيارية
                </label>
                <textarea
                  rows={2}
                  placeholder="أي ملاحظات عن العامل..."
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
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingWorker ? 'حفظ التعديلات' : 'إضافة العامل'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteWorkerId}
        title="تأكيد حذف العامل"
        message={
          workerRecordsCount > 0
            ? `تنبيه: يوجد ${workerRecordsCount} سجل حركة سابق مسجل لهذا العامل. إذا أردت إيقافه مؤقتاً يفضل تغيير حالته إلى "موقوف" بدلاً من الحذف.\n\nهل ما زلت ترغب في حذف العامل نهائياً؟`
            : `هل أنت متأكد من رغبتك في حذف العامل "${workerToDelete?.name}"؟`
        }
        confirmText="نعم، احذف العامل"
        cancelText="إلغاء"
        onConfirm={handleDelete}
        onCancel={() => setDeleteWorkerId(null)}
      />
    </div>
  );
};
