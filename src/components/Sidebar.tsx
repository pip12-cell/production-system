import React from 'react';
import { useApp, AppTab } from '../context/AppContext';
import {
  LayoutDashboard,
  CalendarPlus,
  Users,
  Layers,
  FileText,
  UserCheck,
  Settings,
  X,
  Factory,
  Database
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { activeTab, setActiveTab, workers, departments, records, settings } = useApp();

  const navItems: { id: AppTab; label: string; icon: React.ReactNode; badge?: number | string }[] = [
    {
      id: 'dashboard',
      label: 'لوحة التحكم',
      icon: <LayoutDashboard className="w-5 h-5" />
    },
    {
      id: 'daily_entry',
      label: 'الإدخال اليومي',
      icon: <CalendarPlus className="w-5 h-5 text-emerald-500" />
    },
    {
      id: 'workers',
      label: 'سجل العمال',
      icon: <Users className="w-5 h-5" />,
      badge: workers.length
    },
    {
      id: 'departments',
      label: 'الأقسام والأسعار',
      icon: <Layers className="w-5 h-5" />,
      badge: departments.length
    },
    {
      id: 'general_report',
      label: 'التقارير العامة',
      icon: <FileText className="w-5 h-5" />
    },
    {
      id: 'worker_report',
      label: 'تقرير عامل تفصيلي',
      icon: <UserCheck className="w-5 h-5" />
    },
    {
      id: 'settings',
      label: 'الإعدادات والنسخ',
      icon: <Settings className="w-5 h-5" />
    }
  ];

  const handleSelectTab = (tab: AppTab) => {
    setActiveTab(tab);
    onClose();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 right-0 z-40 w-72 bg-slate-900 text-white flex flex-col transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-xl text-white shadow-md">
              <Factory className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-100 line-clamp-1">
                {settings.factoryName || 'إدارة إنتاج العمال'}
              </h1>
              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                قاعدة بيانات متصلة
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
            aria-label="إغلاق القائمة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {navItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={isActive ? 'text-white' : 'text-slate-400'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                      isActive
                        ? 'bg-emerald-700 text-white'
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer Database Status */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="flex items-center gap-1.5 font-medium">
              <Database className="w-3.5 h-3.5 text-teal-400" />
              حالة البيانات
            </span>
            <span className="text-emerald-400 font-bold">دائمة 100%</span>
          </div>
          <div className="text-xs text-slate-500 flex justify-between">
            <span>سجلات اليوم: {records.filter(r => r.date === new Date().toISOString().split('T')[0]).length}</span>
            <span>إجمالي السجلات: {records.length}</span>
          </div>
        </div>
      </aside>
    </>
  );
};
