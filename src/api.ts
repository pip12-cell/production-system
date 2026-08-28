import { AppDatabase, Department, Worker, DailyRecord, AppSettings } from './types';

const API_BASE = '/api';

export async function fetchDatabase(): Promise<AppDatabase> {
  const res = await fetch(`${API_BASE}/data`);
  if (!res.ok) {
    throw new Error('تعذر تحميل البيانات من الخادم');
  }
  return res.json();
}

export async function saveSettings(settings: Partial<AppSettings>): Promise<{ success: boolean; settings: AppSettings }> {
  const res = await fetch(`${API_BASE}/settings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'تعذر حفظ الإعدادات');
  }
  return res.json();
}

// Departments
export async function createDepartment(data: Omit<Department, 'id' | 'createdAt'>): Promise<Department> {
  const res = await fetch(`${API_BASE}/departments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'تعذر إضافة القسم');
  }
  return res.json();
}

export async function updateDepartment(id: string, data: Partial<Department>): Promise<Department> {
  const res = await fetch(`${API_BASE}/departments/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'تعذر تعديل القسم');
  }
  return res.json();
}

export async function deleteDepartment(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/departments/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'تعذر حذف القسم');
  }
}

// Workers
export async function createWorker(data: Omit<Worker, 'id' | 'createdAt'>): Promise<Worker> {
  const res = await fetch(`${API_BASE}/workers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'تعذر إضافة العامل');
  }
  return res.json();
}

export async function updateWorker(id: string, data: Partial<Worker>): Promise<Worker> {
  const res = await fetch(`${API_BASE}/workers/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'تعذر تعديل بيانات العامل');
  }
  return res.json();
}

export async function deleteWorker(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/workers/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'تعذر حذف العامل');
  }
}

// Records
export async function saveRecord(data: Partial<DailyRecord>): Promise<{ created?: boolean; updated?: boolean; record: DailyRecord }> {
  const res = await fetch(`${API_BASE}/records`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'تعذر حفظ السجل اليومي');
  }
  return res.json();
}

export async function updateRecord(id: string, data: Partial<DailyRecord>): Promise<DailyRecord> {
  const res = await fetch(`${API_BASE}/records/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'تعذر تعديل السجل');
  }
  return res.json();
}

export async function deleteRecord(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/records/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'تعذر حذف السجل');
  }
}

// Backup & Reset
export async function restoreBackup(backupData: any): Promise<AppDatabase> {
  const res = await fetch(`${API_BASE}/backup/restore`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(backupData)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'تعذر استعادة النسخة الاحتياطية');
  }
  const result = await res.json();
  return result.data;
}

export async function resetDatabase(): Promise<AppDatabase> {
  const res = await fetch(`${API_BASE}/reset`, {
    method: 'POST'
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'تعذر إعادة ضبط قاعدة البيانات');
  }
  const result = await res.json();
  return result.data;
}
