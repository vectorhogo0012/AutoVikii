import React, { useState } from 'react';
import {
  ShieldAlert,
  KeyRound,
  Tv,
  Car,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  PackageCheck,
  Info,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { HandoverCategory, HandoverEquipmentItem, HandoverItemStatus } from '../../types/inspection';
import {
  HANDOVER_CATEGORIES,
  calculateHandoverSummary,
} from './handoverTemplates';
import { useInspection } from '../inspection/InspectionContext';

const CATEGORY_ICONS: Record<HandoverCategory, React.ElementType> = {
  safety_emergency: ShieldAlert,
  accessories_keys: KeyRound,
  cabin_comfort: Tv,
  exterior_equipment: Car,
  tire_tools: Wrench,
};

const STATUS_BUTTONS: {
  status: HandoverItemStatus;
  label: string;
  icon: React.ElementType;
  activeClass: string;
  inactiveClass: string;
}[] = [
  {
    status: 'present_healthy',
    label: 'موجود و سالم',
    icon: CheckCircle2,
    activeClass:
      'bg-emerald-600 text-white shadow-xs border-emerald-600 dark:bg-emerald-600 dark:border-emerald-500',
    inactiveClass:
      'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-emerald-300 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20',
  },
  {
    status: 'present_defective',
    label: 'موجود ولی معیوب',
    icon: AlertTriangle,
    activeClass:
      'bg-amber-600 text-white shadow-xs border-amber-600 dark:bg-amber-600 dark:border-amber-500',
    inactiveClass:
      'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-amber-300 hover:bg-amber-50/50 dark:hover:bg-amber-950/20',
  },
  {
    status: 'missing',
    label: 'مفقود / موجود نیست',
    icon: XCircle,
    activeClass:
      'bg-rose-600 text-white shadow-xs border-rose-600 dark:bg-rose-600 dark:border-rose-500',
    inactiveClass:
      'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-rose-300 hover:bg-rose-50/50 dark:hover:bg-rose-950/20',
  },
  {
    status: 'uninspected',
    label: 'بررسی‌نشده',
    icon: HelpCircle,
    activeClass:
      'bg-slate-600 text-white shadow-xs border-slate-600 dark:bg-slate-600 dark:border-slate-500',
    inactiveClass:
      'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40',
  },
];

export const HandoverChecklistTab: React.FC = () => {
  const { currentInspection, setHandoverItemStatus, setHandoverItemNote } = useInspection();

  // Collapsible category state: default all open
  const [collapsedCategories, setCollapsedCategories] = useState<Record<HandoverCategory, boolean>>({
    safety_emergency: false,
    accessories_keys: false,
    cabin_comfort: false,
    exterior_equipment: false,
    tire_tools: false,
  });

  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});

  const handoverItems = currentInspection?.handoverItems || [];
  const summary = calculateHandoverSummary(handoverItems);

  const toggleCategory = (catId: HandoverCategory) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  const toggleAll = (collapse: boolean) => {
    setCollapsedCategories({
      safety_emergency: collapse,
      accessories_keys: collapse,
      cabin_comfort: collapse,
      exterior_equipment: collapse,
      tire_tools: collapse,
    });
  };

  const toggleNote = (itemId: string) => {
    setExpandedNotes((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <Card className="p-4 sm:p-5 bg-gradient-to-r from-emerald-50/70 via-teal-50/40 to-slate-50 dark:from-emerald-950/20 dark:via-slate-900/40 dark:to-slate-900 border border-emerald-200/80 dark:border-emerald-900/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 text-right">
            <div className="flex items-center gap-2">
              <PackageCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                چک‌لیست تجهیزات و اقلام تحویل خودرو
              </h2>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              ثبت وضعیت اقلام همراه، لوازم جانبی، زاپاس و اکسسوری‌های خودرو هنگام تحویل (مستقل از نمره فنی و رنگ)
            </p>
          </div>

          {/* Quick Collapse Actions */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleAll(false)}
              className="text-xs h-8 px-2.5"
            >
              گسترش همه
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleAll(true)}
              className="text-xs h-8 px-2.5"
            >
              جمع کردن همه
            </Button>
          </div>
        </div>

        {/* Counter Summary Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5 mt-4 pt-4 border-t border-slate-200/80 dark:border-emerald-900/40">
          <div className="p-2 sm:p-2.5 rounded-xl bg-white dark:bg-slate-900/80 border border-emerald-200 dark:border-emerald-900/60 flex items-center justify-between gap-1 min-w-0">
            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-medium text-emerald-700 dark:text-emerald-400 min-w-0">
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="truncate">موجود و سالم</span>
            </div>
            <span className="text-xs sm:text-sm font-bold text-emerald-700 dark:text-emerald-300 shrink-0">
              {summary.presentHealthy}
            </span>
          </div>

          <div className="p-2 sm:p-2.5 rounded-xl bg-white dark:bg-slate-900/80 border border-amber-200 dark:border-amber-900/60 flex items-center justify-between gap-1 min-w-0">
            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-medium text-amber-700 dark:text-amber-400 min-w-0">
              <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="truncate">موجود ولی معیوب</span>
            </div>
            <span className="text-xs sm:text-sm font-bold text-amber-700 dark:text-amber-300 shrink-0">
              {summary.presentDefective}
            </span>
          </div>

          <div className="p-2 sm:p-2.5 rounded-xl bg-white dark:bg-slate-900/80 border border-rose-200 dark:border-rose-900/60 flex items-center justify-between gap-1 min-w-0">
            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-medium text-rose-700 dark:text-rose-400 min-w-0">
              <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="truncate">مفقود / ناموجود</span>
            </div>
            <span className="text-xs sm:text-sm font-bold text-rose-700 dark:text-rose-300 shrink-0">
              {summary.missing}
            </span>
          </div>

          <div className="p-2 sm:p-2.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-1 min-w-0">
            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-medium text-slate-600 dark:text-slate-400 min-w-0">
              <HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="truncate">بررسی‌نشده</span>
            </div>
            <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 shrink-0">
              {summary.uninspected}
            </span>
          </div>
        </div>
      </Card>

      {/* Categories List */}
      <div className="space-y-4">
        {HANDOVER_CATEGORIES.map((category) => {
          const CategoryIcon = CATEGORY_ICONS[category.id] || PackageCheck;
          const isCollapsed = collapsedCategories[category.id];
          const itemsInCategory = handoverItems.filter((i) => i.categoryId === category.id);
          const checkedCount = itemsInCategory.filter((i) => i.status !== 'uninspected').length;

          return (
            <Card
              key={category.id}
              className="overflow-hidden border border-slate-200/90 dark:border-emerald-900/40 bg-white dark:bg-[#0f1a14] shadow-xs"
            >
              {/* Category Header */}
              <button
                type="button"
                onClick={() => toggleCategory(category.id)}
                className="w-full p-3 sm:p-4 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/60 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 transition cursor-pointer text-right select-none gap-2"
                aria-expanded={!isCollapsed}
              >
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <CategoryIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white persian-title">
                      {category.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate hidden xs:block">
                      {category.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                  <span className="text-[11px] sm:text-xs px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium whitespace-nowrap">
                    {checkedCount} / {itemsInCategory.length} <span className="hidden sm:inline">بررسی‌شده</span>
                  </span>
                  {isCollapsed ? (
                    <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 shrink-0" />
                  )}
                </div>
              </button>

              {/* Items in Category */}
              {!isCollapsed && (
                <div className="p-3 sm:p-5 divide-y divide-slate-100 dark:divide-slate-800/70 space-y-4 sm:space-y-0">
                  {itemsInCategory.map((item) => {
                    const isNoteOpen = expandedNotes[item.id] || Boolean(item.note);

                    return (
                      <div
                        key={item.id}
                        className="checklist-single-col checklist-item-card py-3 sm:py-4 first:pt-1 last:pb-1 space-y-3"
                      >
                        {/* Item Label & Note Trigger */}
                        <div className="checklist-item-header flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                          <div className="text-right min-w-0 flex-1">
                            <h4 className="checklist-item-title text-sm font-semibold text-slate-900 dark:text-white persian-title">
                              {item.label}
                            </h4>
                            {item.description && (
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                {item.description}
                              </p>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => toggleNote(item.id)}
                            className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg shrink-0 self-start sm:self-auto transition cursor-pointer min-h-[36px] ${
                              item.note
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                            }`}
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>{item.note ? 'یادداشت دارد' : 'افزودن یادداشت'}</span>
                          </button>
                        </div>

                        {/* Status Buttons Grid - minimum 44px height for mobile ergonomics */}
                        <div className="checklist-status-grid grid grid-cols-2 lg:grid-cols-4 gap-2">
                          {STATUS_BUTTONS.map((btn) => {
                            const isSelected = item.status === btn.status;
                            const IconComponent = btn.icon;

                            return (
                              <button
                                key={btn.status}
                                type="button"
                                onClick={() => setHandoverItemStatus(item.id, btn.status)}
                                className={`min-h-[44px] px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition cursor-pointer select-none ${
                                  isSelected ? btn.activeClass : btn.inactiveClass
                                }`}
                              >
                                <IconComponent className="w-4 h-4 shrink-0" />
                                <span className="truncate">{btn.label}</span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Note Input */}
                        {isNoteOpen && (
                          <div className="pt-2 animate-fadeIn">
                            <input
                              type="text"
                              value={item.note || ''}
                              onChange={(e) => setHandoverItemNote(item.id, e.target.value)}
                              placeholder={`توضیحات و جزئیات مربوط به ${item.label} (مثلاً: خط و خش، عدم وجود، مدل...)`}
                              className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-right"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};
