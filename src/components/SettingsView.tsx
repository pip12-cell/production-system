import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  Settings,
  Building,
  Coins,
  Clock,
  Download,
  Upload,
  Trash2,
  Save,
  CheckCircle2,
  AlertTriangle,
  Database,
  FileJson,
  ShieldAlert,
  Info
} from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

export const SettingsView: React.FC = () => {
  const {
    settings,
    workers,
    departments,
    records,
    updateSettings,
    exportDatabaseBackup,
    importDatabaseBackup,
    clearAllData
  } = useApp();

  const [factoryName, setFactoryName] = useState(settings.factoryName);
  const [currency, setCurrency] = useState(settings.currency);
  const [workHours, setWorkHours] = useState(settings.dailyWorkHours);
  const [isSaved, setIsSaved] = useState(false);

  // File input ref for import
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Confirmation Modals
  const [showClearModal, setShowClearModal] = useState(false);
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings({
      factoryName: factoryName.trim() || 'مصنع الإنتاج',
      currency: currency.trim() || 'ج.م',
      dailyWorkHours: Number(workHours) || 8
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleDownloadBackup = () => {
    exportDatabaseBackup();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async event => {
      try {
        const jsonContent = event.target?.result as string;
        const result = await importDatabaseBackup(jsonContent);
        if (result.success) {
          setImportStatus({ type: 'success', message: 'تم استعادة النسخة الاحتياطية بنجاح!' });
        } else {
          setImportStatus({ type: 'error', message: result.error || 'فشل في استعادة البيانات' });
        }
      } catch (err: any) {
        setImportStatus({ type: 'error', message: 'الملف غير صالح أو تالف' });
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const handleClearAll = async () => {
    await clearAllData();
    setShowClearModal(false);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Title */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-600" />
            إعدادات النظام وقاعدة البيانات
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            تخصيص بيانات المنشأة، العملة، والنسخ الاحتياطي لقاعدة البيانات
          </p>
        </div>
      </div>

      {/* General Configuration Form */}
      <form onSubmit={handleSaveSettings} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
        <h3 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
          <Building className="w-4 h-4 text-emerald-600" />
          بيانات المصنع والعملة
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Factory Name */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              اسم المصنع / المنشأة
            </label>
            <input
              type="text"
              required
              value={factoryName}
              onChange={e => setFactoryName(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
            />
          </div>

          {/* Currency */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              رمز العملة (مثال: ج.م، ر.س)
            </label>
            <input
              type="text"
              required
              value={currency}
              onChange={e => setCurrency(e.target.value)}
              className="w-full px-3.5 py-2 text-sm font-bold bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-3">
          {isSaved && (
            <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4" />
              تم حفظ الإعدادات بنجاح
            </span>
          )}
          <button
            type="submit"
            className="mr-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs"
          >
            <Save className="w-4 h-4" />
            <span>حفظ الإعدادات</span>
          </button>
        </div>
      </form>

      {/* Database Backup & Restore */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
        <h3 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
          <Database className="w-4 h-4 text-emerald-600" />
          النسخ الاحتياطي واستعادة قاعدة البيانات (JSON)
        </h3>

        {/* Database Live Stats */}
        <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
          <div className="text-center">
            <span className="text-[11px] font-bold text-slate-500 block">عدد الأقسام</span>
            <span className="text-lg font-black text-slate-800">{departments.length}</span>
          </div>
          <div className="text-center border-r border-l border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 block">عدد العمال</span>
            <span className="text-lg font-black text-slate-800">{workers.length}</span>
          </div>
          <div className="text-center">
            <span className="text-[11px] font-bold text-slate-500 block">حركات الإنتاج اليومية</span>
            <span className="text-lg font-black text-slate-800">{records.length}</span>
          </div>
        </div>

        {importStatus && (
          <div
            className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
              importStatus.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {importStatus.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{importStatus.message}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Download Backup */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <Download className="w-4 h-4 text-emerald-600" />
                تحميل نسخة احتياطية
              </h4>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                قم بتحميل ملف JSON يحتوي على كامل بيانات الأقسام، العمال، والحركات اليومية لحفظها بأمان على جهازك.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDownloadBackup}
              className="mt-4 w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>تصدير ملف النسخة الاحتياطية</span>
            </button>
          </div>

          {/* Restore Backup */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-blue-600" />
                استعادة نسخة احتياطية
              </h4>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                اختر ملف JSON للنسخة الاحتياطية لاستعادة كافة البيانات إلى قاعدة البيانات الحالية.
              </p>
            </div>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" />
                <span>اختيار ملف واستعادة</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone: Clear Data */}
      <div className="bg-rose-50/50 border border-rose-200 p-6 rounded-3xl space-y-4">
        <div className="flex items-center gap-2 text-rose-800">
          <ShieldAlert className="w-5 h-5" />
          <h3 className="text-sm font-black">منطقة الخطر - تفريغ قاعدة البيانات</h3>
        </div>
        <p className="text-xs text-rose-700 leading-relaxed">
          هذا الإجراء سيقوم بحذف جميع حركات الإنتاج اليومية، العمال، والأقسام نهائياً والبدء بقاعدة بيانات فارغة تماماً. يوصى بتنزيل نسخة احتياطية أولاً.
        </p>
        <button
          type="button"
          onClick={() => setShowClearModal(true)}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          <span>مسح كافة البيانات وإعادة التهيئة</span>
        </button>
      </div>

      {/* Clear Confirmation Modal */}
      <ConfirmModal
        isOpen={showClearModal}
        title="تأكيد مسح جميع البيانات"
        message="تحذير شديد: هل أنت متأكد من رغبتك في حذف كافة السجلات والعمال والأقسام بالكامل؟ لا يمكن استرجاع هذه البيانات إلا بوجود نسخة احتياطية."
        confirmText="نعم، افرغ قاعدة البيانات بالكامل"
        cancelText="إلغاء التراجع"
        isDestructive={true}
        onConfirm={handleClearAll}
        onCancel={() => setShowClearModal(false)}
      />
    </div>
  );
};
