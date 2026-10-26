import React, { useState } from 'react';
import {
  Printer,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Award,
  Calendar,
  Gauge,
  ArrowRight,
  FileBadge,
  AlertCircle,
  XCircle,
  Info,
  Check,
  Camera,
  Eye,
  FileDown,
  Car,
  Fuel,
  User,
  Phone,
  Hash,
  PackageCheck,
  HelpCircle,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { formatEnglishDigits, formatVehiclePlate } from '../../lib/utils';
import { NavigationTab } from '../../types/navigation';
import { ChecklistCategory, InspectionItem, PhotoEvidence, HandoverItemStatus, HandoverEquipmentItem } from '../../types/inspection';
import { useInspection } from '../inspection/InspectionContext';
import { PhotoLightboxModal } from '../photos/PhotoLightboxModal';
import { CATEGORY_DEFINITIONS } from '../checklist/checklistTemplates';
import { HANDOVER_CATEGORIES, calculateHandoverSummary } from '../checklist/handoverTemplates';

export interface ReportScreenProps {
  onNavigate: (tab: NavigationTab) => void;
}

export const ReportScreen: React.FC<ReportScreenProps> = ({ onNavigate }) => {
  const { currentInspection, scoreResult, setInspectionStatus, getItemPhotos } = useInspection();
  const [activePhoto, setActivePhoto] = useState<{ photo: PhotoEvidence; label: string } | null>(null);

  if (!currentInspection || !scoreResult) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-slate-500 mb-4">پرونده‌ای برای صدور گزارش انتخاب نشده است.</p>
        <Button variant="primary" onClick={() => onNavigate('dashboard')}>
          بازگشت به پیشخوان
        </Button>
      </div>
    );
  }

  const v = currentInspection.vehicle;
  const isCompleted = currentInspection.status === 'completed';

  const handleToggleComplete = async () => {
    await setInspectionStatus(isCompleted ? 'in_progress' : 'completed');
  };

  const handlePrint = () => {
    window.print();
  };

  // Group items by category for the full itemized report
  const categoriesList: ChecklistCategory[] = ['body_paint', 'engine_mechanics', 'interior', 'tires'];
  const itemsByCategory: Record<ChecklistCategory, InspectionItem[]> = {
    body_paint: currentInspection.items.filter(i => i.category === 'body_paint'),
    engine_mechanics: currentInspection.items.filter(i => i.category === 'engine_mechanics'),
    interior: currentInspection.items.filter(i => i.category === 'interior'),
    tires: currentInspection.items.filter(i => i.category === 'tires'),
  };

  const getItemStatusBadge = (status: InspectionItem['status']) => {
    switch (status) {
      case 'healthy':
        return <Badge variant="success" size="sm">سالم</Badge>;
      case 'needs_review':
        return <Badge variant="warning" size="sm">نیاز به بررسی</Badge>;
      case 'defective':
        return <Badge variant="danger" size="sm">دارای نقص</Badge>;
      case 'uninspected':
      default:
        return <Badge variant="neutral" size="sm">بررسی نشده</Badge>;
    }
  };

  const getHandoverStatusBadge = (status: HandoverItemStatus) => {
    switch (status) {
      case 'present_healthy':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>موجود و سالم</span>
          </span>
        );
      case 'present_defective':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>موجود ولی معیوب</span>
          </span>
        );
      case 'missing':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
            <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            <span>مفقود / ناموجود</span>
          </span>
        );
      case 'uninspected':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            <span>بررسی‌نشده</span>
          </span>
        );
    }
  };

  const handoverItems = currentInspection.handoverItems || [];
  const handoverSummary = calculateHandoverSummary(handoverItems);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Action Bar (hidden in print) */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-[#111e17] border border-slate-200 dark:border-emerald-900/50 shadow-xs">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate('checklist')}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            بازگشت به چک‌لیست
          </Button>
          <span className="text-slate-300 dark:text-slate-700">/</span>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            گواهی کارشناسی {currentInspection.trackingCode}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={isCompleted ? 'secondary' : 'primary'}
            size="sm"
            onClick={handleToggleComplete}
            leftIcon={isCompleted ? <Check className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
          >
            {isCompleted ? 'تأیید نهایی شده' : 'ثبت تأیید نهایی گواهی'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            leftIcon={<Printer className="w-4 h-4" />}
            onClick={handlePrint}
          >
            چاپ / ذخیره PDF
          </Button>
        </div>
      </div>

      {/* PDF Export Guidance Banner (hidden in print) */}
      <div className="no-print p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-200 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <FileDown className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>
            <strong>راهنمای ذخیره نسخه PDF:</strong> پس از زدن دکمه «چاپ / ذخیره PDF»، در کادر باز شده مقصد چاپ (Destination) را بر روی «Save as PDF» تنظیم کنید.
          </span>
        </div>
        <button
          type="button"
          onClick={handlePrint}
          className="text-xs font-bold text-emerald-700 dark:text-emerald-400 underline underline-offset-4 hover:opacity-80 shrink-0"
        >
          شروع چاپ
        </button>
      </div>

      {/* Provisional Score Warning if coverage is incomplete (hidden in print if user completed, visible if uninspected) */}
      {scoreResult.isProvisional && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 flex items-start gap-3 text-right">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs sm:text-sm font-bold">
              گزارش اولیه — پوشش کارشناسی ناقص است (<span className="font-latin-num">{scoreResult.coveragePercent}%</span> تکمیل شده)
            </h4>
            <p className="text-xs text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
              از مجموع {scoreResult.totalItems} قطعه، تعداد {scoreResult.uninspectedItemsCount} قطعه هنوز ارزیابی نشده است. امتیاز فعلی ({scoreResult.currentScore} از ۱۰۰) تقریبی است و پس از ارزیابی کامل قطعات اعتبار رسمی می‌یابد.
            </p>
          </div>
        </div>
      )}

      {/* Main Official Inspection Certificate Sheet */}
      <div className="print-sheet rounded-3xl border border-slate-200 dark:border-emerald-900/50 bg-white dark:bg-[#0f1a14] shadow-md p-6 sm:p-8 space-y-6 text-right">
        {/* Certificate Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-emerald-950/60 print-keep-together">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 dark:bg-emerald-500 flex items-center justify-center text-white dark:text-slate-950 shadow-md">
              <FileBadge className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100">
                گواهی رسمی کارشناسی سلامت فنی و بدنه خودرو
              </h2>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  شناسه رهگیری دیجیتال:
                </span>
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 font-latin-num">
                  {currentInspection.trackingCode}
                </span>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span className="text-xs text-slate-400">
                  تاریخ ارزیابی: <span className="font-latin-num">{v.inspectionDate}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant={isCompleted ? 'success' : scoreResult.isProvisional ? 'warning' : 'info'}
              size="md"
              dot
            >
              {isCompleted ? 'تأیید نهایی شده' : scoreResult.isProvisional ? 'ارزیابی موقت' : 'در دست بررسی'}
            </Badge>
          </div>
        </div>

        {/* Overall Score & Grade Card */}
        <div className="print-keep-together grid grid-cols-1 md:grid-cols-3 gap-4 p-5 rounded-2xl bg-gradient-to-br from-emerald-50/70 to-emerald-100/30 dark:from-emerald-950/40 dark:to-emerald-900/10 border border-emerald-200/60 dark:border-emerald-800/40">
          {/* Grade Pillar */}
          <div className="flex flex-col items-center justify-center p-3 text-center border-b md:border-b-0 md:border-l border-emerald-200/60 dark:border-emerald-900/50">
            <span className="text-xs text-emerald-800 dark:text-emerald-300 font-semibold mb-1">
              رتبه کیفی خودرو
            </span>
            <div className="w-16 h-16 rounded-2xl bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 flex items-center justify-center text-3xl font-black shadow-md font-latin-num">
              {scoreResult.grade}
            </div>
            <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium mt-2">
              {scoreResult.grade === 'A+' ? 'وضعیت عالی (بدون نقص اساسی)' :
               scoreResult.grade === 'A' ? 'بسیار سالم (کیفیت استاندارد)' :
               scoreResult.grade === 'B' ? 'سالم با استهلاک طبیعی' :
               scoreResult.grade === 'C' ? 'دارای معایب فنی/بدنه متوسط' :
               scoreResult.grade === 'D' ? 'دارای نقص‌های اساسی' : 'در انتظار بررسی'}
            </span>
          </div>

          {/* Numerical Score & Inspection Summary */}
          <div className="flex flex-col justify-center p-3 md:col-span-2 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200 block sm:inline">
                  امتیاز کلی سلامت خودرو
                </span>
                {scoreResult.isProvisional && (
                  <span className="text-[11px] text-amber-700 dark:text-amber-400 font-medium block sm:inline sm:mr-2">
                    (محاسبه موقت بر مبنای <span className="font-latin-num">{scoreResult.coveragePercent}%</span> پوشش)
                  </span>
                )}
              </div>
              <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400 font-latin-num">
                {scoreResult.currentScore} / 100
              </span>
            </div>

            <ProgressBar value={scoreResult.currentScore} showPercent={false} size="lg" />

            {/* Quick Inspection Item Counts */}
            <div className="grid grid-cols-4 gap-2 pt-2 text-center text-xs">
              <div className="p-2 rounded-xl bg-white/80 dark:bg-[#111e17] border border-slate-200/60 dark:border-emerald-900/40">
                <span className="text-slate-400 text-[10px] block">بررسی‌شده</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 font-latin-num">
                  {scoreResult.inspectedItemsCount}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-white/80 dark:bg-[#111e17] border border-slate-200/60 dark:border-emerald-900/40">
                <span className="text-slate-400 text-[10px] block">سالم</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 font-latin-num">
                  {scoreResult.healthyItemsCount}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-white/80 dark:bg-[#111e17] border border-slate-200/60 dark:border-emerald-900/40">
                <span className="text-slate-400 text-[10px] block">بررسی</span>
                <span className="font-bold text-amber-600 dark:text-amber-400 font-latin-num">
                  {scoreResult.needsReviewItemsCount}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-white/80 dark:bg-[#111e17] border border-slate-200/60 dark:border-emerald-900/40">
                <span className="text-slate-400 text-[10px] block">نقص فنی</span>
                <span className="font-bold text-rose-600 dark:text-rose-400 font-latin-num">
                  {scoreResult.defectiveItemsCount}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Comprehensive Vehicle Identity Details Grid */}
        <div className="print-keep-together p-4 rounded-2xl bg-slate-50/70 dark:bg-[#111e17]/80 border border-slate-200/70 dark:border-emerald-900/40 space-y-3">
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Car className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>مشخصات و هویت وسیله نقلیه</span>
          </h4>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-right">
            <div>
              <span className="text-[11px] text-slate-400 block">سازنده و مدل</span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                {v.make} {v.model}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block">پلاک انتظامی</span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                {formatVehiclePlate(v.plate)}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block">کیلومتر کارکرد</span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100 font-latin-num">
                {formatEnglishDigits(v.mileage)} کیلومتر
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block">سال ساخت و رنگ</span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                <span className="font-latin-num">{v.year}</span> • {v.color}
              </span>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 block">شماره شاسی (VIN)</span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100 font-latin-num break-all">
                {v.vin || 'ثبت نشده'}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block">نوع سوخت</span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                {v.fuelType || 'بنزین'}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block">نام متقاضی</span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                {v.clientName || 'مشتری محترم'}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block">شماره تماس متقاضی</span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100 font-latin-num">
                {v.clientPhone || 'ثبت نشده'}
              </span>
            </div>
          </div>
        </div>

        {/* Defective Items Section with Photo Evidence */}
        {scoreResult.defectiveItems.length > 0 ? (
          <div className="space-y-3 print-break-inside-avoid">
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <h4 className="text-sm font-bold text-rose-700 dark:text-rose-400">
                خلاصه عیوب و نقص‌های شناسایی شده ({scoreResult.defectiveItems.length} مورد)
              </h4>
            </div>

            <div className="space-y-2.5">
              {scoreResult.defectiveItems.map((entry, idx) => {
                const itemPhotos = getItemPhotos(entry.item.id);

                return (
                  <div
                    key={idx}
                    className="print-keep-together p-3.5 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-xs"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-rose-900 dark:text-rose-200">
                        {entry.item.label} ({entry.categoryTitle})
                      </span>
                      <Badge variant="danger" size="sm">
                        نقص فنی
                      </Badge>
                    </div>
                    <p className="text-[11px] text-rose-800 dark:text-rose-300">
                      {entry.item.note || 'توضیحات تکمیلی توسط کارشناس ثبت نشده است.'}
                    </p>

                    {/* Attached Photo Evidence Grid */}
                    {itemPhotos.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-rose-200/60 dark:border-rose-900/40">
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-rose-800 dark:text-rose-300 mb-2">
                          <Camera className="w-3.5 h-3.5" />
                          <span>مستندات تصویری ضمیمه (<span className="font-latin-num">{itemPhotos.length}</span> تصویر):</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {itemPhotos.map((photo) => (
                            <button
                              key={photo.id}
                              type="button"
                              onClick={() => setActivePhoto({ photo, label: `${entry.item.label} (${entry.categoryTitle})` })}
                              className="group relative w-20 h-20 rounded-xl overflow-hidden border border-rose-300 dark:border-rose-800/60 hover:opacity-95 transition-opacity focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-xs"
                              title="مشاهده تصویر بزرگ‌تر"
                            >
                              <img
                                src={photo.thumbnailDataUrl}
                                alt={photo.filename}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  // Fallback in case of broken blob
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                              <div className="no-print absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                <Eye className="w-4 h-4" />
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/30 text-xs flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>هیچ نقص یا عیب اساسی در بازرسی قطعات ثبت نشده است.</span>
          </div>
        )}

        {/* Needs Review Items Section */}
        {scoreResult.needsReviewItems.length > 0 && (
          <div className="space-y-3 print-break-inside-avoid">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <h4 className="text-sm font-bold text-amber-700 dark:text-amber-400">
                موارد نیازمند بررسی و سرویس ({scoreResult.needsReviewItems.length} مورد)
              </h4>
            </div>

            <div className="space-y-2.5">
              {scoreResult.needsReviewItems.map((entry, idx) => {
                const itemPhotos = getItemPhotos(entry.item.id);

                return (
                  <div
                    key={idx}
                    className="print-keep-together p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-xs"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-amber-900 dark:text-amber-200">
                        {entry.item.label} ({entry.categoryTitle})
                      </span>
                      <Badge variant="warning" size="sm">
                        نیازمند بررسی
                      </Badge>
                    </div>
                    <p className="text-[11px] text-amber-800 dark:text-amber-300">
                      {entry.item.note || 'توضیح یا لیسه‌کشی جزئی'}
                    </p>

                    {itemPhotos.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-amber-200/60 dark:border-amber-900/40">
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-800 dark:text-amber-300 mb-2">
                          <Camera className="w-3.5 h-3.5" />
                          <span>تصاویر ثبت‌شده (<span className="font-latin-num">{itemPhotos.length}</span> تصویر):</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {itemPhotos.map((photo) => (
                            <button
                              key={photo.id}
                              type="button"
                              onClick={() => setActivePhoto({ photo, label: `${entry.item.label} (${entry.categoryTitle})` })}
                              className="group relative w-20 h-20 rounded-xl overflow-hidden border border-amber-300 dark:border-amber-800/60 hover:opacity-95 transition-opacity focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs"
                              title="مشاهده تصویر بزرگ‌تر"
                            >
                              <img
                                src={photo.thumbnailDataUrl}
                                alt={photo.filename}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                              <div className="no-print absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                <Eye className="w-4 h-4" />
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Category Scores Breakdown */}
        <div className="space-y-3 print-break-inside-avoid">
          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            خلاصه وزنی ارزیابی بخش‌های ۴ گانه
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.values(scoreResult.categoryBreakdown).map((cat, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-[#111e17] border border-slate-200/80 dark:border-emerald-900/40 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {cat.title}
                  </span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400 font-latin-num">
                    {cat.inspectedWeight > 0 ? `${cat.scorePercentage}%` : 'بررسی نشده'}
                  </span>
                </div>

                <ProgressBar
                  value={cat.coveragePercentage}
                  showPercent={false}
                  size="sm"
                  variant="emerald"
                />

                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span>تکمیل: {cat.inspectedCount} از {cat.totalCount} قطعه</span>
                  <span>وزن در ارزیابی: {cat.maxWeight} نمره</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Complete Itemized Inspection Checklist Table */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b pb-2 border-slate-200 dark:border-emerald-950/60">
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              جدول تفصیلی ارزیابی تک‌تک قطعات کارشناسی‌شده
            </h4>
            <span className="text-[11px] text-slate-400">
              تعداد کل قطعات: {currentInspection.items.length}
            </span>
          </div>

          <div className="space-y-4">
            {categoriesList.map(catKey => {
              const catDef = CATEGORY_DEFINITIONS[catKey];
              const items = itemsByCategory[catKey] || [];

              return (
                <div key={catKey} className="print-keep-together border border-slate-200 dark:border-emerald-900/40 rounded-2xl overflow-hidden">
                  <div className="px-4 py-2.5 bg-slate-100/90 dark:bg-[#13221a] flex items-center justify-between border-b border-slate-200 dark:border-emerald-900/40">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {catDef.title} ({items.length} قطعه)
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      وزن کل این بخش: {catDef.weight} نمره
                    </span>
                  </div>

                  <div className="divide-y divide-slate-100 dark:divide-emerald-950/40 text-xs">
                    {items.map(item => {
                      const itemPhotos = getItemPhotos(item.id);
                      return (
                        <div key={item.id} className="p-3 flex flex-col sm:flex-row sm:items-start justify-between gap-2 hover:bg-slate-50/50 dark:hover:bg-white/[0.02]">
                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-slate-800 dark:text-slate-200 persian-title">
                                {item.label}
                              </span>
                              {getItemStatusBadge(item.status)}
                              <span className="text-[10px] text-slate-400 whitespace-nowrap">
                                (وزن: <span className="font-latin-num">{item.weight}</span> نمره)
                              </span>
                            </div>

                            {item.description && (
                              <p className="text-[11px] text-slate-400">
                                {item.description}
                              </p>
                            )}

                            {item.note && (
                              <p className="text-[11px] text-emerald-800 dark:text-emerald-300/90 bg-emerald-50/60 dark:bg-emerald-950/20 px-2.5 py-1 rounded-lg mt-1 inline-block break-words">
                                <span className="font-medium">توضیح کارشناس:</span> {item.note}
                              </p>
                            )}
                          </div>

                          {/* Photos attached to this specific item */}
                          {itemPhotos.length > 0 && (
                            <div className="flex items-center gap-1.5 shrink-0 pt-1 sm:pt-0">
                              {itemPhotos.map(photo => (
                                <button
                                  key={photo.id}
                                  type="button"
                                  onClick={() => setActivePhoto({ photo, label: item.label })}
                                  className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 dark:border-emerald-800/60 hover:opacity-90 transition-opacity"
                                  title="مشاهده تصویر"
                                >
                                  <img
                                    src={photo.thumbnailDataUrl}
                                    alt={photo.filename}
                                    className="w-full h-full object-cover"
                                  />
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dedicated Handover Equipment Delivery Section */}
        <div className="print-keep-together space-y-4 pt-4 border-t border-slate-200 dark:border-emerald-950/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2 border-slate-200 dark:border-emerald-950/60">
            <div className="flex items-center gap-2">
              <PackageCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                چک‌لیست تجهیزات، متعلقات و اقلام تحویل خودرو
              </h4>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              کل اقلام ارزیابی‌شده: {handoverItems.length} قلم
            </span>
          </div>

          {/* Quick Handover Delivery Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 flex items-center justify-between text-xs">
              <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>موجود و سالم</span>
              </span>
              <span className="font-bold font-latin-num text-emerald-800 dark:text-emerald-300">
                {handoverSummary.presentHealthy}
              </span>
            </div>
            <div className="p-2.5 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 flex items-center justify-between text-xs">
              <span className="text-amber-700 dark:text-amber-400 font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>موجود ولی معیوب</span>
              </span>
              <span className="font-bold font-latin-num text-amber-800 dark:text-amber-300">
                {handoverSummary.presentDefective}
              </span>
            </div>
            <div className="p-2.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 flex items-center justify-between text-xs">
              <span className="text-rose-700 dark:text-rose-400 font-semibold flex items-center gap-1">
                <XCircle className="w-3.5 h-3.5" />
                <span>مفقود / ناموجود</span>
              </span>
              <span className="font-bold font-latin-num text-rose-800 dark:text-rose-300">
                {handoverSummary.missing}
              </span>
            </div>
            <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-400 font-semibold flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>بررسی‌نشده</span>
              </span>
              <span className="font-bold font-latin-num text-slate-700 dark:text-slate-300">
                {handoverSummary.uninspected}
              </span>
            </div>
          </div>

          {/* Handover Categories Breakdown Table */}
          <div className="space-y-3">
            {HANDOVER_CATEGORIES.map(category => {
              const categoryItems = handoverItems.filter(i => i.categoryId === category.id);
              if (categoryItems.length === 0) return null;

              return (
                <div key={category.id} className="print-keep-together border border-slate-200 dark:border-emerald-900/40 rounded-2xl overflow-hidden">
                  <div className="px-4 py-2 bg-slate-100/90 dark:bg-[#13221a] flex items-center justify-between border-b border-slate-200 dark:border-emerald-900/40 text-xs">
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {category.title} ({categoryItems.length} قلم)
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {category.description}
                    </span>
                  </div>

                  <div className="divide-y divide-slate-100 dark:divide-emerald-950/40 text-xs">
                    {categoryItems.map(item => (
                      <div key={item.id} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/50 dark:hover:bg-white/[0.02]">
                        <div className="space-y-0.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-slate-800 dark:text-slate-200 persian-title">
                              {item.label}
                            </span>
                            {item.description && (
                              <span className="text-[11px] text-slate-400">
                                ({item.description})
                              </span>
                            )}
                          </div>
                          {item.note && (
                            <p className="text-[11px] text-amber-800 dark:text-amber-300 bg-amber-50/80 dark:bg-amber-950/30 px-2 py-0.5 rounded mt-1 inline-block break-words">
                              <span className="font-medium">توضیح کارشناس:</span> {item.note}
                            </p>
                          )}
                        </div>
                        <div className="shrink-0 self-start sm:self-auto">
                          {getHandoverStatusBadge(item.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Digital Signature & Certification Stamp Box */}
        <div className="print-keep-together grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-emerald-950/60">
          <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-emerald-900/50 bg-slate-50/40 dark:bg-[#0c1611]/50 text-center space-y-1">
            <span className="text-[11px] text-slate-400">کارشناس رسمی ارزیاب</span>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {currentInspection.inspectorName}
            </p>
            <div className="py-2 text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1 font-semibold text-xs">
              <ShieldCheck className="w-4 h-4" />
              <span>مهر و امضای دیجیتال بازرس</span>
            </div>
            <span className="text-[10px] text-slate-400">
              کد کارشناسی: <span className="font-latin-num">IR-EXP-40291</span>
            </span>
          </div>

          <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-emerald-900/50 bg-slate-50/40 dark:bg-[#0c1611]/50 text-center space-y-1">
            <span className="text-[11px] text-slate-400">متقاضی کارشناسی</span>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {v.clientName || 'مشتری محترم'}
            </p>
            <div className="py-2 text-slate-400 text-xs">
              <span>تأییدیه دریافت گزارش الکترونیکی</span>
            </div>
            <span className="text-[10px] text-slate-400 font-latin-num">
              {v.inspectionDate}
            </span>
          </div>
        </div>
      </div>

      {/* Photo Lightbox Preview Modal */}
      <PhotoLightboxModal
        photo={activePhoto?.photo ?? null}
        itemLabel={activePhoto?.label}
        isOpen={Boolean(activePhoto)}
        onClose={() => setActivePhoto(null)}
      />
    </div>
  );
};
