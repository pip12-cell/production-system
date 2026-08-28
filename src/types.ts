export type AttendanceStatus = 'present' | 'absent' | 'early_leave' | 'late_unexcused';

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: 'حضور',
  absent: 'غياب',
  early_leave: 'انصراف مبكر',
  late_unexcused: 'تأخير صباحي بدون إذن',
};

export const ATTENDANCE_STATUS_COLORS: Record<AttendanceStatus, { bg: string; text: string; border: string }> = {
  present: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  absent: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  early_leave: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  late_unexcused: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
};

export interface DepartmentUnitTier {
  id: string;
  departmentId?: string;
  units: number;           // عدد الوحدات (مثلاً: 25, 50, 75, 100...)
  expenseAmount: number;   // قيمة المصاريف المقابلة بالجنيه (مثلاً: 107, 214, 321, 428...)
  createdAt?: string;
  updatedAt?: string;
}

export interface Department {
  id: string;
  name: string;
  unitBatch: number;       // عدد الوحدات الأساسي للقسم
  expenseAmount: number;   // قيمة المصاريف الأساسية بالجنيه
  unitPrice?: number;      // سعر الوحدة = قيمة المصاريف ÷ عدد الوحدات
  unitTiers?: DepartmentUnitTier[]; // جدول المستويات والخيارات المتعددة للوحدات والمصاريف
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Worker {
  id: string;
  code: string;            // كود العامل (فريد)
  name: string;            // الاسم الكامل
  departmentId: string;    // معرف القسم
  status: 'active' | 'inactive'; // الحالة
  phone?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface DailyRecord {
  id: string;
  date: string;            // YYYY-MM-DD
  workerId: string;
  workerName: string;      // لقطة تاريخية
  workerCode: string;      // لقطة تاريخية
  departmentId: string;
  departmentName: string;  // لقطة تاريخية
  unitBatch: number;       // عدد الوحدات المحفوظ وقت التسجيل
  expenseAmount: number;   // قيمة المصاريف المحفوظة وقت التسجيل
  unitPrice: number;       // سعر الوحدة المحفوظ
  quantity: number;        // كمية الإنتاج
  productionDue: number;   // المستحق عن الإنتاج / المصاريف المحفوظة وقت التسجيل
  attendanceStatus: AttendanceStatus;
  deduction: number;       // الخصم
  overtime: number;        // الإضافي
  netDue: number;          // صافي المستحق
  selectedTierId?: string; // معرف الشريحة المختارة إن وجد
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AppSettings {
  factoryName: string;
  currency: string;
  allowMultipleRecordsPerDay: boolean;
}

export interface AppDatabase {
  departments: Department[];
  workers: Worker[];
  records: DailyRecord[];
  settings: AppSettings;
}
