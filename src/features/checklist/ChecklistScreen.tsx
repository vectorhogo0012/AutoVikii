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
  PackageCheck,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { ChecklistCategory, ItemStatus, InspectionItem } from '../../types/inspection';
import { getItemStatusDetails, formatEnglishDigits } from '../../lib/utils';
import { NavigationTab } from '../../types/navigation';
import { CATEGORY_DEFINITIONS } from './checklistTemplates';
import { HandoverChecklistTab } from './HandoverChecklistTab';
import { calculateHandoverSummary } from './handoverTemplates';
import { useInspection } from '../inspection/InspectionContext';
import { PhotoEvidenceManager } from '../photos/PhotoEvidenceManager';

export interface ChecklistScreenProps {
  onNavigate: (tab: NavigationTab) => void;
}

export type TabId = ChecklistCategory | 'handover';

const ALL_TABS: { id: TabId; title: string; icon: React.ElementType }[] = [
  { id: 'body_paint', title: 'بدنه و رنگ', icon: Sparkles },
  { id: 'engine_mechanics', title: 'موتور و فنی', icon: Wrench },
  { id: 'interior', title: 'کابین و ادوات', icon: Armchair },
  { id: 'tires', title: 'لاستیک و رینگ', icon: CircleDot },
  { id: 'handover', title: 'اقلام تحویل', icon: PackageCheck },
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

  const [currentTab, setCurrentTab] = useState<TabId>(activeCategory);
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
  const handoverItems = currentInspection.handoverItems || [];
  const handoverSummary = calculateHandoverSummary(handoverItems);

  const isHandoverTab = currentTab === 'handover';
  const currentCategoryDef = !isHandoverTab ? CATEGORY_DEFINITIONS[currentTab as ChecklistCategory] : null;
  const catSummary = !isHandoverTab ? scoreResult?.categoryBreakdown[currentTab as ChecklistCategory] : null;
  const categoryItems = !isHandoverTab ? items.filter(item => item.category === currentTab) : [];

  const categoryInspectedCount = catSummary?.inspectedCount ?? 0;
  const categoryTotalCount = catSummary?.totalCount ?? categoryItems.length;
  const categoryPercent = catSummary?.coveragePercentage ?? 0;

  const currentTabIndex = ALL_TABS.findIndex(t => t.id === currentTab);

  const selectTab = (tabId: TabId) => {
    setCurrentTab(tabId);
    if (tabId !== 'handover') {
      setActiveCategory(tabId);
    }
  };

  const goToNextCategory = () => {
    if (currentTabIndex < ALL_TABS.length - 1) {
      selectTab(ALL_TABS[currentTabIndex + 1].id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      onNavigate('report');
    }
  };

  const goToPrevCategory = () => {
    if (currentTabIndex > 0) {
      selectTab(ALL_TABS[currentTabIndex - 1].id);
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
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                چک‌لیست تخصصی کارشناسی خودرو
              </h2>
              <Badge variant="success" size="sm">
                {currentInspection.vehicle.make} {currentInspection.vehicle.model}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              کد پیگیری: <span className="font-latin-num font-bold text-emerald-700 dark:text-emerald-400">{currentInspection.trackingCode}</span> • شماره پلاک: ایران {currentInspection.vehicle.plate?.provinceCode} | {currentInspection.vehicle.plate?.prefix} {currentInspection.vehicle.plate?.letter} {currentInspection.vehicle.plate?.suffix}
            </p>
          </div>

          {/* Transparent Score Pill */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#111e17] border border-slate-200 dark:border-emerald-900/50 text-right">
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
              className="text-xs shrink-0 min-h-[38px]"
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

      {/* 5 Category Navigation Tabs - Horizontally scrollable strip on mobile, 5-col grid on desktop */}
      <div className="flex md:grid md:grid-cols-5 gap-2 overflow-x-auto no-scrollbar py-1 px-0.5 scroll-smooth snap-x snap-mandatory">
        {ALL_TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          let count = 0;
          let inspected = 0;
          let sublabel = '';

          if (tab.id === 'handover') {
            count = handoverItems.length;
            inspected = handoverSummary.presentHealthy + handoverSummary.presentDefective + handoverSummary.missing;
            sublabel = 'اقلام تحویل';
          } else {
            count = items.filter(i => i.category === tab.id).length;
            inspected = items.filter(i => i.category === tab.id && i.status !== 'uninspected').length;
            sublabel = `وزن: ${CATEGORY_DEFINITIONS[tab.id]?.weight} امتیاز`;
          }

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => selectTab(tab.id)}
              className={`flex flex-col p-2.5 sm:p-3 rounded-2xl text-right transition-all min-h-[58px] min-w-[145px] sm:min-w-[160px] md:min-w-0 snap-start shrink-0 md:shrink cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 border ${
                isActive
                  ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-950 border-emerald-600 dark:border-emerald-400 shadow-md scale-[1.01]'
                  : 'bg-white dark:bg-[#111e17] text-slate-700 dark:text-slate-200 border-slate-200 dark:border-emerald-900/40 hover:bg-slate-50 dark:hover:bg-emerald-950/40'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="text-xs sm:text-sm font-bold flex items-center gap-1.5 truncate">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{tab.title}</span>
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
                className={`text-[10px] truncate ${
                  isActive ? 'text-emerald-100 dark:text-emerald-900' : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                {sublabel}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Content: Handover Tab or Mechanical Category Items */}
      {isHandoverTab ? (
        <HandoverChecklistTab />
      ) : (
        <>
          {/* Category Header Info */}
          {currentCategoryDef && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 px-1">
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 persian-title">
                  {currentCategoryDef.title} ({categoryInspectedCount} از {categoryTotalCount} قطعه تکمیل شده)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {currentCategoryDef.description}
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 shrink-0 self-start sm:self-auto">
                پیشرفت بخش: <span className="font-latin-num">{categoryPercent}%</span>
              </span>
            </div>
          )}

      {/* Checklist Items List */}
      <div className="space-y-3">
        {categoryItems.map(item => {
          const statusInfo = getItemStatusDetails(item.status);
          const isNoteExpanded = expandedNoteItemId === item.id;

          return (
            <Card
              key={item.id}
              className={`checklist-single-col checklist-item-card p-4 sm:p-5 transition-all border ${
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
                    {/* Responsive Item Header: Title gets full width on top */}
                    <div className="checklist-item-header flex flex-col gap-2 text-right">
                      {/* Item Label - full width, natural Persian wrapping, never squished */}
                      <h4 className="checklist-item-title text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 persian-title">
                        {item.label}
                      </h4>

                      {/* Sub-row: Badges, weight points, and Note action button */}
                      <div className="checklist-item-actions flex flex-wrap items-center justify-between gap-2 pt-0.5">
                        <div className="flex items-center gap-2">
                          <Badge variant={statusInfo.variant} size="sm" dot>
                            {statusInfo.label}
                          </Badge>
                          <span className="text-[11px] text-slate-400 font-latin-num font-medium">
                            {item.weight} pts
                          </span>
                        </div>

                        {/* Note Toggle Button */}
                        <button
                          type="button"
                          onClick={() => setExpandedNoteItemId(isNoteExpanded ? null : item.id)}
                          aria-label="یادداشت کارشناس"
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors min-h-[38px] cursor-pointer ${
                            item.note
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                          }`}
                        >
                          <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                          <span>{item.note ? 'ویرایش یادداشت' : 'افزودن یادداشت'}</span>
                          {isNoteExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5 shrink-0" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 shrink-0" />
                          )}
                        </button>
                      </div>

                      {item.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                          {item.description}
                        </p>
                      )}
                    </div>

                {/* 4 Status Selection Buttons (One-Handed Mobile Friendly) */}
                <div className="checklist-status-grid grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
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
        </>
      )}

      {/* Category Navigation Footer */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-emerald-950/60">
        <Button
          variant="outline"
          size="md"
          onClick={goToPrevCategory}
          rightIcon={<ArrowRight className="w-4 h-4" />}
          className="min-h-[44px] justify-center"
        >
          {currentTabIndex === 0 ? 'بازگشت به مشخصات خودرو' : 'بخش قبلی'}
        </Button>

        <Button
          variant="primary"
          size="md"
          onClick={goToNextCategory}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
          className="font-bold min-h-[44px] justify-center"
        >
          {currentTabIndex === ALL_TABS.length - 1 ? 'تکمیل و صدور گزارش نهایی' : 'بخش بعدی چک‌لیست'}
        </Button>
      </div>
    </div>
  );
};
