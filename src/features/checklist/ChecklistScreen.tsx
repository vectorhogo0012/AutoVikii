import React, { useState } from 'react';
import {
  Sparkles,
  Wrench,
  Armchair,
  CircleDot,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  ArrowLeft,
  ArrowRight,
  FileText,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Info,
  Car,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { ChecklistCategory, ItemStatus, InspectionItem } from '../../types/inspection';
import { getItemStatusDetails, formatEnglishDigits } from '../../lib/utils';
import { NavigationTab } from '../../types/navigation';
import { CATEGORY_DEFINITIONS } from './checklistTemplates';
import { useInspection } from '../inspection/InspectionContext';
import { PhotoEvidenceManager } from '../photos/PhotoEvidenceManager';

export interface ChecklistScreenProps {
  onNavigate: (tab: NavigationTab) => void;
}

const CATEGORY_TABS: { id: ChecklistCategory; title: string; icon: React.ElementType }[] = [
  { id: 'body_paint', title: 'بدنه و رنگ', icon: Sparkles },
  { id: 'engine_mechanics', title: 'موتور و فنی', icon: Wrench },
  { id: 'interior', title: 'کابین و ادوات', icon: Armchair },
  { id: 'tires', title: 'لاستیک و رینگ', icon: CircleDot },
];

export const ChecklistScreen: React.FC<ChecklistScreenProps> = ({ onNavigate }) => {
  const {
    currentInspection,
    scoreResult,
    activeCategory,
    setActiveCategory,
    setItemStatus,
    setItemNote,
    addPhotoToItem,
    removePhoto,
    getItemPhotos,
  } = useInspection();

  const [expandedNoteItemId, setExpandedNoteItemId] = useState<string | null>(null);

  if (!currentInspection) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-slate-500 mb-4">پرونده کارشناسی فعالی یافت نشد.</p>
        <Button variant="primary" onClick={() => onNavigate('new-inspection')}>
          ثبت کارشناسی جدید
        </Button>
      </div>
    );
  }

  const items = currentInspection.items || [];
  const categoryItems = items.filter(item => item.category === activeCategory);
  const currentCategoryDef = CATEGORY_DEFINITIONS[activeCategory];
  const catSummary = scoreResult?.categoryBreakdown[activeCategory];

  const categoryInspectedCount = catSummary?.inspectedCount ?? 0;
  const categoryTotalCount = catSummary?.totalCount ?? categoryItems.length;
  const categoryPercent = catSummary?.coveragePercentage ?? 0;

  const currentCategoryIndex = CATEGORY_TABS.findIndex(t => t.id === activeCategory);

  const goToNextCategory = () => {
    if (currentCategoryIndex < CATEGORY_TABS.length - 1) {
      setActiveCategory(CATEGORY_TABS[currentCategoryIndex + 1].id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      onNavigate('report');
    }
  };

  const goToPrevCategory = () => {
    if (currentCategoryIndex > 0) {
      setActiveCategory(CATEGORY_TABS[currentCategoryIndex - 1].id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      onNavigate('new-inspection');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header & Coverage Banner */}
      <Card className="p-4 sm:p-5 bg-white dark:bg-[#0f1a14] border border-slate-200/90 dark:border-emerald-900/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                چک‌لیست تخصصی کارشناسی خودرو
              </h2>
              <Badge variant="success" size="sm">
                {currentInspection.vehicle.make} {currentInspection.vehicle.model}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              کد پیگیری: <span className="font-latin-num font-bold text-emerald-700 dark:text-emerald-400">{currentInspection.trackingCode}</span> • شماره پلاک: ایران {currentInspection.vehicle.plate?.provinceCode} | {currentInspection.vehicle.plate?.prefix} {currentInspection.vehicle.plate?.letter} {currentInspection.vehicle.plate?.suffix}
            </p>
          </div>

          {/* Transparent Score Pill */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-[#111e17] border border-slate-200 dark:border-emerald-900/50 text-right">
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">
                  {scoreResult?.isProvisional ? 'امتیاز فعلی (تقریبی)' : 'امتیاز نهایی کارشناسی'}
                </span>
                <span className="text-base font-black text-emerald-700 dark:text-emerald-400 font-latin-num">
                  {scoreResult?.currentScore ?? 0} / 100
                </span>
              </div>
              <Badge
                variant={scoreResult?.isProvisional ? 'warning' : 'success'}
                size="sm"
              >
                {scoreResult?.isProvisional ? 'پوشش ناقص' : 'کامل'}
              </Badge>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={() => onNavigate('report')}
              leftIcon={<FileText className="w-4 h-4" />}
              className="text-xs shrink-0"
            >
              مشاهده گزارش
            </Button>
          </div>
        </div>

        {/* Global Progress & Coverage Warning */}
        <div className="space-y-2">
          <ProgressBar
            value={scoreResult?.coveragePercent ?? 0}
            label={`پوشش وزنی کل بازرسی (${scoreResult?.inspectedItemsCount ?? 0} از ${scoreResult?.totalItems ?? items.length} قطعه ارزیابی شده)`}
            variant="emerald"
            size="md"
          />

          {scoreResult?.isProvisional && (
            <div className="flex items-center gap-1.5 text-[11px] text-amber-700 dark:text-amber-400">
              <Info className="w-3.5 h-3.5 shrink-0" />
              <span>
                توجه: امتیاز محاسبه‌شده بر مبنای بخش‌های بررسی‌شده است و تا اتمام کامل چک‌لیست جنبه موقت دارد.
              </span>
            </div>
          )}
        </div>
      </Card>

      {/* 4 Category Navigation Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {CATEGORY_TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeCategory === tab.id;
          const summary = scoreResult?.categoryBreakdown[tab.id];
          const count = items.filter(i => i.category === tab.id).length;
          const inspected = items.filter(i => i.category === tab.id && i.status !== 'uninspected').length;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveCategory(tab.id)}
              className={`flex flex-col p-3 rounded-2xl text-right transition-all min-h-[58px] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 border ${
                isActive
                  ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-950 border-emerald-600 dark:border-emerald-400 shadow-md scale-[1.01]'
                  : 'bg-white dark:bg-[#111e17] text-slate-700 dark:text-slate-200 border-slate-200 dark:border-emerald-900/40 hover:bg-slate-50 dark:hover:bg-emerald-950/40'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="text-xs sm:text-sm font-bold flex items-center gap-1.5">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{tab.title}</span>
                </span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-md font-latin-num font-semibold ${
                    isActive
                      ? 'bg-emerald-700 text-emerald-100 dark:bg-emerald-600 dark:text-slate-950'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {inspected}/{count}
                </span>
              </div>
              <span
                className={`text-[10px] ${
                  isActive ? 'text-emerald-100 dark:text-emerald-900' : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                وزن: {CATEGORY_DEFINITIONS[tab.id]?.weight} امتیاز
              </span>
            </button>
          );
        })}
      </div>

      {/* Category Header Info */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
            {currentCategoryDef.title} ({categoryInspectedCount} از {categoryTotalCount} قطعه تکمیل شده)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {currentCategoryDef.description}
          </p>
        </div>
        <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
          پیشرفت بخش: <span className="font-latin-num">{categoryPercent}%</span>
        </span>
      </div>

      {/* Checklist Items List */}
      <div className="space-y-3">
        {categoryItems.map(item => {
          const statusInfo = getItemStatusDetails(item.status);
          const isNoteExpanded = expandedNoteItemId === item.id;

          return (
            <Card
              key={item.id}
              className={`p-4 sm:p-5 transition-all border ${
                item.status === 'defective'
                  ? 'border-rose-300 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/10'
                  : item.status === 'needs_review'
                  ? 'border-amber-300 dark:border-amber-900/60 bg-amber-50/20 dark:bg-amber-950/10'
                  : item.status === 'healthy'
                  ? 'border-emerald-200/80 dark:border-emerald-900/40 bg-white dark:bg-[#111e17]'
                  : 'border-slate-200 dark:border-emerald-900/30 bg-white dark:bg-[#111e17]'
              }`}
            >
              <div className="flex flex-col gap-3">
                {/* Item Label & Status Badge */}
                <div className="flex items-start justify-between gap-3 text-right">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {item.label}
                      </h4>
                      <Badge variant={statusInfo.variant} size="sm" dot>
                        {statusInfo.label}
                      </Badge>
                      <span className="text-[10px] text-slate-400 font-latin-num">
                        {item.weight} pts
                      </span>
                    </div>
                    {item.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        {item.description}
                      </p>
                    )}
                  </div>

                  {/* Note Toggle Button */}
                  <button
                    type="button"
                    onClick={() => setExpandedNoteItemId(isNoteExpanded ? null : item.id)}
                    aria-label="یادداشت کارشناس"
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors min-h-[36px] ${
                      item.note
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{item.note ? 'ویرایش یادداشت' : 'افزودن یادداشت'}</span>
                    {isNoteExpanded ? (
                      <ChevronUp className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    )}
                  </button>
                </div>

                {/* 4 Status Selection Buttons (One-Handed Mobile Friendly) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  {/* 1. Healthy (سالم) */}
                  <button
                    type="button"
                    onClick={() => setItemStatus(item.id, 'healthy')}
                    className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all min-h-[44px] cursor-pointer border ${
                      item.status === 'healthy'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm dark:bg-emerald-500 dark:text-slate-950'
                        : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-emerald-900/40 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-800'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 group-hover:text-emerald-600" />
                    <span>سالم (100%)</span>
                  </button>

                  {/* 2. Needs Review (نیازمند بررسی) */}
                  <button
                    type="button"
                    onClick={() => setItemStatus(item.id, 'needs_review')}
                    className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all min-h-[44px] cursor-pointer border ${
                      item.status === 'needs_review'
                        ? 'bg-amber-500 text-white border-amber-500 shadow-sm dark:bg-amber-400 dark:text-slate-950'
                        : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-emerald-900/40 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-800'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span>بررسی (60%)</span>
                  </button>

                  {/* 3. Defective (دارای نقص) */}
                  <button
                    type="button"
                    onClick={() => setItemStatus(item.id, 'defective')}
                    className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all min-h-[44px] cursor-pointer border ${
                      item.status === 'defective'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-sm dark:bg-rose-500 dark:text-white'
                        : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-emerald-900/40 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-800'
                    }`}
                  >
                    <XCircle className="w-4 h-4 text-rose-500" />
                    <span>دارای نقص (0%)</span>
                  </button>

                  {/* 4. Uninspected (بررسی‌نشده) */}
                  <button
                    type="button"
                    onClick={() => setItemStatus(item.id, 'uninspected')}
                    className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-medium transition-all min-h-[44px] cursor-pointer border ${
                      item.status === 'uninspected'
                        ? 'bg-slate-700 text-white border-slate-700 shadow-sm dark:bg-slate-600'
                        : 'bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-emerald-900/40 hover:bg-slate-100'
                    }`}
                  >
                    <HelpCircle className="w-4 h-4 text-slate-400" />
                    <span>بررسی‌نشده</span>
                  </button>
                </div>

                {/* Inline Note Drawer / Editor */}
                {(isNoteExpanded || item.note) && (
                  <div className="pt-2 animate-in fade-in">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0c1611] border border-slate-200 dark:border-emerald-900/40 space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                        <span>یادداشت کارشناس:</span>
                        {item.note && (
                          <button
                            type="button"
                            onClick={() => setItemNote(item.id, '')}
                            className="text-[11px] text-rose-500 hover:underline"
                          >
                            حذف یادداشت
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={item.note}
                        onChange={e => setItemNote(item.id, e.target.value)}
                        placeholder="ثبت توضیح تکمیلی (مثلاً ضخامت ۲۴۰ میکرون، تعویض استوک، نشتی روغن، نیاز به سرویس)..."
                        className="w-full h-10 px-3 text-xs rounded-lg bg-white dark:bg-[#111e17] text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-emerald-900/50 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                )}

                {/* Photo Evidence Manager */}
                <PhotoEvidenceManager
                  itemId={item.id}
                  itemLabel={item.label}
                  photos={getItemPhotos(item.id)}
                  onAddPhoto={addPhotoToItem}
                  onRemovePhoto={removePhoto}
                  isDefectiveOrNeedsReview={item.status === 'defective' || item.status === 'needs_review'}
                />
              </div>
            </Card>
          );
        })}
      </div>

      {/* Category Navigation Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-emerald-950/60">
        <Button
          variant="outline"
          size="md"
          onClick={goToPrevCategory}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          {currentCategoryIndex === 0 ? 'بازگشت به مشخصات خودرو' : 'بخش قبلی'}
        </Button>

        <Button
          variant="primary"
          size="md"
          onClick={goToNextCategory}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
          className="font-bold"
        >
          {currentCategoryIndex === CATEGORY_TABS.length - 1 ? 'تکمیل و صدور گزارش نهایی' : 'بخش بعدی چک‌لیست'}
        </Button>
      </div>
    </div>
  );
};
