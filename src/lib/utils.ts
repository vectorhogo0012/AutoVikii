import { InspectionGrade, InspectionRecordStatus, ItemStatus, VehiclePlate } from '../types/inspection';

/**
 * Combines class names safely
 */
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Ensures numeric values are formatted cleanly with standard English digits and thousand separators
 */
export function formatEnglishDigits(value: number | string): string {
  if (value === null || value === undefined || value === '') return '0';
  const num = typeof value === 'number' ? value : Number(String(value).replace(/,/g, ''));
  if (isNaN(num)) return String(value);
  return new Intl.NumberFormat('en-US').format(num);
}

/**
 * Formats a vehicle license plate in Iranian standard display format
 */
export function formatVehiclePlate(plate?: VehiclePlate): string {
  if (!plate) return '---';
  return `ایران ${plate.provinceCode} | ${plate.prefix} ${plate.letter} ${plate.suffix}`;
}

/**
 * Computes letter grade from numerical inspection score (0 to 100)
 */
export function calculateInspectionGrade(score: number): InspectionGrade {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 65) return 'B';
  if (score >= 50) return 'C';
  return 'D';
}

/**
 * Status presentation mapping for vehicle inspection records
 */
export function getRecordStatusDetails(status: InspectionRecordStatus): {
  label: string;
  variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
} {
  switch (status) {
    case 'completed':
      return { label: 'تکمیل شده', variant: 'success' };
    case 'in_progress':
      return { label: 'در حال بازرسی', variant: 'warning' };
    case 'draft':
    default:
      return { label: 'پیش‌نویس اولیه', variant: 'neutral' };
  }
}

/**
 * Checklist item status presentation mapping for Section 02
 * Statuses: uninspected, healthy, needs_review, defective
 */
export function getItemStatusDetails(status: ItemStatus): {
  label: string;
  shortLabel: string;
  variant: 'success' | 'warning' | 'danger' | 'neutral';
  colorClasses: string;
  activeButtonClasses: string;
} {
  switch (status) {
    case 'healthy':
      return {
        label: 'سالم و استاندارد',
        shortLabel: 'سالم',
        variant: 'success',
        colorClasses: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800',
        activeButtonClasses: 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-950 font-bold shadow-sm',
      };
    case 'needs_review':
      return {
        label: 'نیازمند بررسی و رسیدگی',
        shortLabel: 'بررسی',
        variant: 'warning',
        colorClasses: 'text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800',
        activeButtonClasses: 'bg-amber-500 text-white dark:bg-amber-400 dark:text-slate-950 font-bold shadow-sm',
      };
    case 'defective':
      return {
        label: 'دارای نقص و عیب فنی',
        shortLabel: 'دارای نقص',
        variant: 'danger',
        colorClasses: 'text-rose-800 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800',
        activeButtonClasses: 'bg-rose-600 text-white dark:bg-rose-500 dark:text-white font-bold shadow-sm',
      };
    case 'uninspected':
    default:
      return {
        label: 'بررسی‌نشده',
        shortLabel: 'بررسی‌نشده',
        variant: 'neutral',
        colorClasses: 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700',
        activeButtonClasses: 'bg-slate-700 text-white dark:bg-slate-600 dark:text-white font-bold shadow-sm',
      };
  }
}
