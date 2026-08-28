import { AppDatabase, Department, Worker, DailyRecord, AppSettings } from './types';

const STORAGE_KEY = 'production_system_db';

const defaultDb: AppDatabase = {
  departments: [],
  workers: [],
  records: [],
  settings: {
    factoryName: 'نظام إدارة الإنتاج والعمال',
    currency: 'جنيه',
    allowMultipleRecordsPerDay: false
  }
};

function getDb(): AppDatabase {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultDb));
      return defaultDb;
    }
    return JSON.parse(data);
  } catch {
    return defaultDb;
  }
}

function saveDb(db: AppDatabase): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

export async function fetchDatabase(): Promise<AppDatabase> {
  return getDb();
}

export async function saveSettings(settings: Partial<AppSettings>): Promise<{ success: boolean; settings: AppSettings }> {
  const db = getDb();
  db.settings = { ...db.settings, ...settings };
  saveDb(db);
  return { success: true, settings: db.settings };
}

// Departments
export async function createDepartment(data: Omit<Department, 'id' | 'createdAt'>): Promise<Department> {
  const db = getDb();
  const newDept: Department = {
    ...data,
    id: 'dept_' + Date.now(),
    createdAt: new Date().toISOString()
  };
  db.departments.push(newDept);
  saveDb(db);
  return newDept;
}

export async function updateDepartment(id: string, data: Partial<Department>): Promise<Department> {
  const db = getDb();
  const index = db.departments.findIndex(d => d.id === id);
  if (index === -1) throw new Error('القسم غير موجود');
  db.departments[index] = { ...db.departments[index], ...data };
  saveDb(db);
  return db.departments[index];
}

export async function deleteDepartment(id: string): Promise<void> {
  const db = getDb();
  db.departments = db.departments.filter(d => d.id !== id);
  saveDb(db);
}

// Workers
export async function createWorker(data: Omit<Worker, 'id' | 'createdAt'>): Promise<Worker> {
  const db = getDb();
  const newWorker: Worker = {
    ...data,
    id: 'worker_' + Date.now(),
    createdAt: new Date().toISOString()
  };
  db.workers.push(newWorker);
  saveDb(db);
  return newWorker;
}

export async function updateWorker(id: string, data: Partial<Worker>): Promise<Worker> {
  const db = getDb();
  const index = db.workers.findIndex(w => w.id === id);
  if (index === -1) throw new Error('العامل غير موجود');
  db.workers[index] = { ...db.workers[index], ...data };
  saveDb(db);
  return db.workers[index];
}

export async function deleteWorker(id: string): Promise<void> {
  const db = getDb();
  db.workers = db.workers.filter(w => w.id !== id);
  saveDb(db);
}

// Records
export async function saveRecord(data: Partial<DailyRecord>): Promise<{ created?: boolean; updated?: boolean; record: DailyRecord }> {
  const db = getDb();
  const index = db.records.findIndex(r => r.id === data.id);

  if (index !== -1) {
    db.records[index] = { ...db.records[index], ...data } as DailyRecord;
    saveDb(db);
    return { updated: true, record: db.records[index] };
  } else {
    const newRecord: DailyRecord = {
      ...(data as DailyRecord),
      id: 'rec_' + Date.now(),
      createdAt: new Date().toISOString()
    };
    db.records.push(newRecord);
    saveDb(db);
    return { created: true, record: newRecord };
  }
}

export async function updateRecord(id: string, data: Partial<DailyRecord>): Promise<DailyRecord> {
  const db = getDb();
  const index = db.records.findIndex(r => r.id === id);
  if (index === -1) throw new Error('السجل غير موجود');
  db.records[index] = { ...db.records[index], ...data };
  saveDb(db);
  return db.records[index];
}

export async function deleteRecord(id: string): Promise<void> {
  const db = getDb();
  db.records = db.records.filter(r => r.id !== id);
  saveDb(db);
}

// Backup & Reset
export async function restoreBackup(backupData: any): Promise<AppDatabase> {
  if (!backupData || !Array.isArray(backupData.departments)) {
    throw new Error('ملف النسخة الاحتياطية غير صالح');
  }
  saveDb(backupData);
  return backupData;
}

export async function resetDatabase(): Promise<AppDatabase> {
  saveDb(defaultDb);
  return defaultDb;
}