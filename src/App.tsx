import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { NotificationContainer } from './components/Notification';
import { Dashboard } from './components/Dashboard';
import { DailyEntry } from './components/DailyEntry';
import { Departments } from './components/Departments';
import { Workers } from './components/Workers';
import { GeneralReport } from './components/GeneralReport';
import { WorkerReport } from './components/WorkerReport';
import { SettingsView } from './components/SettingsView';

const MainLayout: React.FC = () => {
  const { activeTab, isLoading } = useApp();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100/70 font-cairo">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <Header onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

        {/* Dynamic Page Views */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto pb-12">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-500">
                <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4" />
                <span className="text-sm font-bold">جاري تحميل بيانات النظام...</span>
              </div>
            ) : (
              <>
                {activeTab === 'dashboard' && <Dashboard />}
                {activeTab === 'daily_entry' && <DailyEntry />}
                {activeTab === 'departments' && <Departments />}
                {activeTab === 'workers' && <Workers />}
                {activeTab === 'general_report' && <GeneralReport />}
                {activeTab === 'worker_report' && <WorkerReport />}
                {activeTab === 'settings' && <SettingsView />}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Global Toast Notifications */}
      <NotificationContainer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
