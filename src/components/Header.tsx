import React from 'react';
import { useApp, AppTab } from '../context/AppContext';
import { Menu, Calendar, PlusCircle, RefreshCw, CalendarDays } from 'lucide-react';
import { formatDateArabic } from '../utils/calculations';

interface HeaderProps {
  onToggleSidebar: () => void;
}

const TAB_TITLES: Record<AppTab, { title: string; desc: string }> = {
  dashboard: { title: 'لوحة التحكم الرئيسية', desc: 'نظرة عامة على إنتاج ومستحقات وحضور العمال' },
  daily_entry: { title: 'شاشة الإدخال اليومي', desc: 'تسجيل سريع لكميات الإنتاج والمصاريف والحضور والغياب' },
  workers: { title: 'سجل العمال', desc: 'إدارة وتتبع بيانات العمال والأقسام وحالة النشاط' },
  departments: { title: 'الأقسام وأسعار الإنتاج', desc: 'ضبط عدد الوحدات ومصاريف الدفعات لكل قسم' },
  general_report: { title: 'التقارير العامة والشاملة', desc: 'كشوف مجمعة لفترات محددة مع إمكانية التصدير والطباعة' },
  worker_report: { title: 'تقرير عامل تفصيلي', desc: 'كشف حساب وحركات مفصلة لعامل محدد' },
  settings: { title: 'الإعدادات والنسخ الاحتياطي', desc: 'إعدادات النظام والنسخ الاحتياطي واستعادة البيانات' }
};

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { activeTab, setActiveTab, selectedDate, setSelectedDate, refreshData, isLoading } = useApp();
  const currentTabInfo = TAB_TITLES[activeTab] || { title: 'نظام إدارة العمال', desc: '' };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="px-4 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Left Side (Title + Toggle) */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 lg:hidden transition"
            aria-label="فتح القائمة"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-xl font-black text-slate-900 leading-tight">
              {currentTabInfo.title}
            </h2>
            <p className="text-xs text-slate-500 hidden sm:block mt-0.5">
              {currentTabInfo.desc}
            </p>
          </div>
        </div>

        {/* Right Side Controls */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Quick Date Indicator / Picker */}
          <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 text-sm">
            <CalendarDays className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-semibold text-slate-600">التاريخ النشط:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            />
          </div>

          {/* Refresh Button */}
          <button
            onClick={refreshData}
            disabled={isLoading}
            className="p-2 text-slate-600 hover:text-emerald-600 hover:bg-slate-100 rounded-xl transition border border-slate-200"
            title="تحديث البيانات من الخادم"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>

          {/* Quick Action Button */}
          {activeTab !== 'daily_entry' && (
            <button
              onClick={() => setActiveTab('daily_entry')}
              className="flex items-center gap-2 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold transition shadow-xs"
            >
              <PlusCircle className="w-4 h-4" />
              <span>تسجيل يومي</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
