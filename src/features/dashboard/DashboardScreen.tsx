import React, { useState } from 'react';
import {
  Car,
  FileCheck,
  Clock,
  CheckCircle2,
  Search,
  PlusCircle,
  FileSpreadsheet,
  ChevronLeft,
  Trash2,
  Camera,
  HardDrive,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { EmptyState } from '../../components/ui/EmptyState';
import { Dialog } from '../../components/ui/Dialog';
import { formatEnglishDigits, getRecordStatusDetails } from '../../lib/utils';
import { formatByteSize } from '../../lib/media/imageCompression';
import { NavigationTab } from '../../types/navigation';
import { useInspection } from '../inspection/InspectionContext';
import { calculateInspectionScore } from '../scoring/scoringEngine';

export interface DashboardScreenProps {
  onNavigate: (tab: NavigationTab) => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ onNavigate }) => {
  const { inspections, selectInspection, deleteInspectionRecord, storageQuota } = useInspection();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const filteredInspections = inspections.filter(item => {
    const v = item.vehicle;
    const matchesSearch =
      searchQuery === '' ||
      v.model.includes(searchQuery) ||
      v.make.includes(searchQuery) ||
      (v.clientName && v.clientName.includes(searchQuery)) ||
      item.trackingCode.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalCount = inspections.length;
  const inProgressCount = inspections.filter(i => i.status === 'in_progress').length;
  const completedCount = inspections.filter(i => i.status === 'completed').length;

  // Calculate average score across inspections that have scores
  const scoresWithData = inspections
    .map(i => calculateInspectionScore(i.items))
    .filter(s => s.inspectedWeight > 0);
  const avgScore = scoresWithData.length > 0
    ? Math.round(scoresWithData.reduce((acc, curr) => acc + curr.currentScore, 0) / scoresWithData.length)
    : 85;

  const handleSelectRecord = async (id: string, tab: NavigationTab = 'report') => {
    await selectInspection(id);
    onNavigate(tab);
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await deleteInspectionRecord(deletingId);
      setDeletingId(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome & Primary Action Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-700 via-emerald-800 to-emerald-900 text-white p-6 sm:p-8 shadow-md">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600/40 border border-emerald-400/30 text-emerald-100 text-xs font-medium">
              مرکز تخصصی کارشناسی خودرو
            </span>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              میز کارشناسی و ارزیابی فنی
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/90 max-w-xl leading-relaxed">
              ثبت بازرسی بدنه، رنگ، شاسی، موتور و صدور گواهی کارشناسی دیجیتال با سیستم امتیازدهی شفاف و دقیق
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="accent"
              size="lg"
              onClick={() => onNavigate('new-inspection')}
              leftIcon={<PlusCircle className="w-5 h-5" />}
            >
              شروع کارشناسی جدید
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => onNavigate('checklist')}
              leftIcon={<FileCheck className="w-4 h-4" />}
              className="bg-emerald-800/40 text-white border-emerald-500/40 hover:bg-emerald-800/70"
            >
              مشاهده چک‌لیست
            </Button>
          </div>
        </div>

        <div className="absolute -left-10 -bottom-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Inspection KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border-emerald-500/10">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                کل پرونده‌ها
              </p>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1 font-latin-num">
                {formatEnglishDigits(totalCount)}
              </h3>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5 inline-block">
                پرونده‌های فعال
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Car className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-500/10">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                در حال بازرسی
              </p>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1 font-latin-num">
                {formatEnglishDigits(inProgressCount)}
              </h3>
              <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-0.5 inline-block">
                در صف سالن
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-100 dark:border-amber-900/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Clock className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-500/10">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                تکمیل شده
              </p>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1 font-latin-num">
                {formatEnglishDigits(completedCount)}
              </h3>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5 inline-block">
                آماده گواهی
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-sky-500/10">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                میانگین سلامت خودروها
              </p>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1 font-latin-num">
                {avgScore}%
              </h3>
              <span className="text-[11px] text-sky-600 dark:text-sky-400 font-medium mt-0.5 inline-block">
                شاخص کیفی ناوگان
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-100 dark:border-sky-900/40 flex items-center justify-center text-sky-600 dark:text-sky-400">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inspections List Section */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
          <div>
            <CardTitle>فهرست پرونده‌های کارشناسی خودرو</CardTitle>
            <div className="flex flex-wrap items-center gap-3 mt-1">
              <CardDescription>
                جهت ورود به چک‌لیست یا مشاهده گزارش، روی هر خودرو کلیک نمایید
              </CardDescription>
              {storageQuota && (
                <div className="inline-flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400 bg-slate-100/80 dark:bg-[#0c1611] px-2.5 py-1 rounded-lg border border-slate-200/80 dark:border-emerald-900/40">
                  <HardDrive className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>حافظه محلی آفلاین:</span>
                  <span className="font-latin-num font-semibold text-slate-800 dark:text-slate-200">
                    {formatByteSize(storageQuota.usedBytes)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Search & Filter Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-full sm:w-64">
              <Input
                placeholder="جستجوی مدل، مالک یا کد رهگیری..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                isClearable
                onClear={() => setSearchQuery('')}
                prefixIcon={<Search className="w-4 h-4" />}
                className="h-9 text-xs"
              />
            </div>
            <div className="flex items-center gap-1 bg-slate-100/80 dark:bg-[#111e17] p-1 rounded-xl border border-slate-200/80 dark:border-emerald-900/40">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  statusFilter === 'all'
                    ? 'bg-white dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                همه
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('in_progress')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  statusFilter === 'in_progress'
                    ? 'bg-white dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                جاری
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('completed')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  statusFilter === 'completed'
                    ? 'bg-white dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                تکمیل‌شده
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {filteredInspections.length === 0 ? (
            <EmptyState
              title="موردی یافت نشد"
              description="با فیلترها یا عبارت جستجوی وارد شده هیچ پرونده کارشناسی ثبت نشده است."
              actionLabel="ایجاد کارشناسی جدید"
              onAction={() => onNavigate('new-inspection')}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredInspections.map(item => {
                const statusDetails = getRecordStatusDetails(item.status);
                const score = calculateInspectionScore(item.items);

                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelectRecord(item.id, 'checklist')}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        handleSelectRecord(item.id, 'checklist');
                      }
                    }}
                    className="group relative flex flex-col justify-between p-4 rounded-xl border border-slate-200/90 dark:border-emerald-900/40 bg-white dark:bg-[#111e17] hover:border-emerald-500/50 dark:hover:border-emerald-500/50 hover:shadow-sm transition-all text-right cursor-pointer"
                  >
                    <div>
                      {/* Top Row: Vehicle name & Status Badge & Delete action */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                            {item.vehicle.make} {item.vehicle.model}
                          </h4>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            مدل سال{' '}
                            <span className="font-latin-num">{item.vehicle.year}</span>{' '}
                            • {item.vehicle.color}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Badge variant={statusDetails.variant} size="sm" dot>
                            {statusDetails.label}
                          </Badge>
                          <button
                            type="button"
                            title="حذف پرونده از حافظه محلی"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingId(item.id);
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors opacity-70 group-hover:opacity-100"
                            aria-label={`حذف پرونده ${item.vehicle.make} ${item.vehicle.model}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Middle Row: Plate Badge & Mileage */}
                      <div className="flex items-center justify-between py-2 border-y border-slate-100 dark:border-emerald-950/60 my-2">
                        {/* Persian Plate Display */}
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-[#0c1611] border border-slate-200 dark:border-emerald-900/50 text-xs">
                          <span className="text-slate-400 text-[10px]">ایران</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200 font-latin-num">
                            {item.vehicle.plate?.provinceCode}
                          </span>
                          <span className="text-slate-300 dark:text-slate-700">|</span>
                          <span className="font-semibold text-slate-900 dark:text-slate-100 font-latin-num">
                            {item.vehicle.plate?.prefix}
                          </span>
                          <span className="font-bold text-emerald-700 dark:text-emerald-400">
                            {item.vehicle.plate?.letter}
                          </span>
                          <span className="font-semibold text-slate-900 dark:text-slate-100 font-latin-num">
                            {item.vehicle.plate?.suffix}
                          </span>
                        </div>

                        <div className="text-left">
                          <span className="text-[10px] text-slate-400 block">کارکرد</span>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 font-latin-num">
                            {formatEnglishDigits(item.vehicle.mileage)} km
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Row: Score, Coverage, Photos & Actions */}
                    <div className="flex items-center justify-between pt-1 text-xs">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 font-latin-num">
                          {score.currentScore}/100
                        </span>
                        <span className="text-slate-300 dark:text-slate-700">•</span>
                        <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                          پوشش: <span className="font-latin-num font-semibold">{score.coveragePercent}%</span>
                        </span>
                        {score.defectiveItemsCount > 0 && (
                          <span className="text-rose-600 dark:text-rose-400 text-[11px] font-semibold">
                            ({score.defectiveItemsCount} نقص)
                          </span>
                        )}
                        {(item.photoCount ?? 0) > 0 && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800/40">
                            <Camera className="w-3 h-3" />
                            <span className="font-latin-num">{item.photoCount}</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold group-hover:-translate-x-0.5 transition-transform">
                        <span className="text-xs">ورود به چک‌لیست</span>
                        <ChevronLeft className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog
        isOpen={Boolean(deletingId)}
        onClose={() => !isDeleting && setDeletingId(null)}
        title="حذف پیش‌نویس کارشناسی خودرو"
        description="این عملیات برگشت‌ناپذیر است و اطلاعات از حافظه دستگاه پاک می‌شود."
        maxWidth="sm"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              disabled={isDeleting}
              onClick={() => setDeletingId(null)}
            >
              انصراف
            </Button>
            <Button
              variant="destructive"
              size="sm"
              isLoading={isDeleting}
              onClick={handleConfirmDelete}
              leftIcon={<Trash2 className="w-4 h-4" />}
            >
              حذف قطعی پرونده
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-right">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-rose-800 dark:text-rose-200 text-xs">
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              با حذف این پرونده، تمامی چک‌لیست‌ها، وضعیت قطعات و مستندات تصویری ضبط‌شده در پایگاه داده محلی (IndexedDB) به طور کامل و ایمن پاکسازی خواهند شد.
            </p>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
