import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Department, Worker, DailyRecord, AppSettings, AppDatabase } from '../types';
import * as api from '../api';
import { getTodayString } from '../utils/calculations';

export type AppTab = 'dashboard' | 'daily_entry' | 'workers' | 'departments' | 'general_report' | 'worker_report' | 'settings';

interface NotificationState {
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AppContextType {
  departments: Department[];
  workers: Worker[];
  records: DailyRecord[];
  settings: AppSettings;
  isLoading: boolean;
  error: string | null;
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  notification: NotificationState | null;
  showNotification: (message: string, type?: 'success' | 'error' | 'info') => void;
  refreshData: () => Promise<void>;
  
  // CRUD
  addDepartment: (data: Omit<Department, 'id' | 'createdAt'>) => Promise<Department>;
  editDepartment: (id: string, data: Partial<Department>) => Promise<Department>;
  removeDepartment: (id: string) => Promise<void>;

  addWorker: (data: Omit<Worker, 'id' | 'createdAt'>) => Promise<Worker>;
  editWorker: (id: string, data: Partial<Worker>) => Promise<Worker>;
  removeWorker: (id: string) => Promise<void>;

  saveDailyRecord: (data: Partial<DailyRecord>) => Promise<{ created?: boolean; updated?: boolean; record: DailyRecord }>;
  removeDailyRecord: (id: string) => Promise<void>;

  updateAppSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  importDatabase: (backupData: any) => Promise<void>;
  resetToEmpty: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const DEFAULT_SETTINGS: AppSettings = {
  factoryName: 'نظام إدارة الإنتاج والعمال',
  currency: 'جنيه',
  allowMultipleRecordsPerDay: false
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
  const [notification, setNotification] = useState<NotificationState | null>(null);

  const showNotification = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(prev => (prev?.message === message ? null : prev));
    }, 4000);
  }, []);

  const refreshData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data: AppDatabase = await api.fetchDatabase();
      setDepartments(data.departments || []);
      setWorkers(data.workers || []);
      setRecords(data.records || []);
      if (data.settings) {
        setSettings({ ...DEFAULT_SETTINGS, ...data.settings });
      }
    } catch (err: any) {
      console.error('Failed to load database:', err);
      setError(err.message || 'فشل في الاتصال بقاعدة البيانات');
      showNotification('تعذر الاتصال بقاعدة البيانات', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Departments
  const addDepartment = async (data: Omit<Department, 'id' | 'createdAt'>) => {
    const created = await api.createDepartment(data);
    setDepartments(prev => [...prev, created]);
    showNotification(`تمت إضافة قسم "${created.name}" بنجاح`);
    return created;
  };

  const editDepartment = async (id: string, data: Partial<Department>) => {
    const updated = await api.updateDepartment(id, data);
    setDepartments(prev => prev.map(d => d.id === id ? updated : d));
    showNotification(`تم تعديل بيانات قسم "${updated.name}" بنجاح`);
    return updated;
  };

  const removeDepartment = async (id: string) => {
    await api.deleteDepartment(id);
    setDepartments(prev => prev.filter(d => d.id !== id));
    showNotification('تم حذف القسم بنجاح');
  };

  // Workers
  const addWorker = async (data: Omit<Worker, 'id' | 'createdAt'>) => {
    const created = await api.createWorker(data);
    setWorkers(prev => [...prev, created]);
    showNotification(`تمت إضافة العامل "${created.name}" بنجاح`);
    return created;
  };

  const editWorker = async (id: string, data: Partial<Worker>) => {
    const updated = await api.updateWorker(id, data);
    setWorkers(prev => prev.map(w => w.id === id ? updated : w));
    showNotification(`تم تعديل بيانات العامل "${updated.name}" بنجاح`);
    return updated;
  };

  const removeWorker = async (id: string) => {
    await api.deleteWorker(id);
    setWorkers(prev => prev.filter(w => w.id !== id));
    showNotification('تم حذف العامل بنجاح');
  };

  // Daily Records
  const saveDailyRecord = async (data: Partial<DailyRecord>) => {
    const result = await api.saveRecord(data);
    if (result.updated) {
      setRecords(prev => prev.map(r => r.id === result.record.id ? result.record : r));
      showNotification(`تم تحديث حركة العامل "${result.record.workerName}" بنجاح`);
    } else {
      setRecords(prev => [result.record, ...prev]);
      showNotification(`تم تسجيل حركة العامل "${result.record.workerName}" بنجاح`);
    }
    return result;
  };

  const removeDailyRecord = async (id: string) => {
    await api.deleteRecord(id);
    setRecords(prev => prev.filter(r => r.id !== id));
    showNotification('تم حذف السجل بنجاح');
  };

  // Settings
  const updateAppSettings = async (newSettings: Partial<AppSettings>) => {
    const res = await api.saveSettings(newSettings);
    setSettings(res.settings);
    showNotification('تم حفظ الإعدادات بنجاح');
  };

  const importDatabase = async (backupData: any) => {
    const restored = await api.restoreBackup(backupData);
    setDepartments(restored.departments || []);
    setWorkers(restored.workers || []);
    setRecords(restored.records || []);
    setSettings(restored.settings || DEFAULT_SETTINGS);
    showNotification('تمت استعادة البيانات بنجاح');
  };

  const resetToEmpty = async () => {
    const reset = await api.resetDatabase();
    setDepartments(reset.departments || []);
    setWorkers(reset.workers || []);
    setRecords(reset.records || []);
    setSettings(reset.settings || DEFAULT_SETTINGS);
    showNotification('تمت إعادة ضبط قاعدة البيانات إلى الحالة الفارغة');
  };

  return (
    <AppContext.Provider
      value={{
        departments,
        workers,
        records,
        settings,
        isLoading,
        error,
        activeTab,
        setActiveTab,
        selectedDate,
        setSelectedDate,
        notification,
        showNotification,
        refreshData,
        addDepartment,
        editDepartment,
        removeDepartment,
        addWorker,
        editWorker,
        removeWorker,
        saveDailyRecord,
        removeDailyRecord,
        updateAppSettings,
        importDatabase,
        resetToEmpty
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
