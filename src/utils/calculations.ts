import { DailyRecord, Department, DepartmentUnitTier } from '../types';

export function calculateProductionDue(quantity: number, unitBatch: number, expenseAmount: number): number {
  if (!quantity || quantity <= 0) return 0;
  const batch = unitBatch > 0 ? unitBatch : 1;
  const expense = expenseAmount >= 0 ? expenseAmount : 0;
  const due = (quantity / batch) * expense;
  return Math.round(due * 100) / 100;
}

export function calculateTierProductionDue(
  quantity: number,
  department?: Department | null,
  fallbackUnitBatch: number = 25,
  fallbackExpenseAmount: number = 107
): number {
  if (!quantity || quantity <= 0) return 0;
  if (department && Array.isArray(department.unitTiers) && department.unitTiers.length > 0) {
    const exactTier = department.unitTiers.find(t => Number(t.units) === Number(quantity));
    if (exactTier) {
      return Number(exactTier.expenseAmount);
    }
  }
  const batch = (department?.unitBatch && department.unitBatch > 0) ? department.unitBatch : fallbackUnitBatch;
  const expense = (department?.expenseAmount !== undefined && department.expenseAmount >= 0) ? department.expenseAmount : fallbackExpenseAmount;
  return calculateProductionDue(quantity, batch, expense);
}

export function calculateNetDue(productionDue: number, overtime: number, deduction: number): number {
  const pDue = Number(productionDue) || 0;
  const ovt = Number(overtime) || 0;
  const ded = Number(deduction) || 0;
  return Math.round((pDue + ovt - ded) * 100) / 100;
}

export function formatCurrency(amount: number, currency: string = 'جنيه'): string {
  const num = Number(amount) || 0;
  // Format with standard Arabic/English number formatting
  return `${num.toLocaleString('ar-EG', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${currency}`;
}

export function formatNumber(num: number): string {
  const val = Number(num) || 0;
  return val.toLocaleString('ar-EG');
}

export function getTodayString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDateArabic(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}
