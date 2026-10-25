import React, { useState, useMemo } from 'react';
import {
  FolderArchive,
  Search,
  Filter,
  ArrowUpDown,
  Car,
  Calendar,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileCheck,
  FileSpreadsheet,
  Trash2,
  AlertTriangle,
  Camera,
  Printer,
  Sparkles,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Dialog } from '../../components/ui/Dialog';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatEnglishDigits, formatVehiclePlate, getRecordStatusDetails } from '../../lib/utils';
import { NavigationTab } from '../../types/navigation';
import { InspectionRecord } from '../../types/inspection';
import { useInspection } from '../inspection/InspectionContext';
import { calculateInspectionScore } from '../scoring/scoringEngine';
import {
  filterArchiveRecords,
  sortArchiveRecords,
  paginateRecords,
  ScoreFilterType,
  FindingsFilterType,
  SortByType,
} from './archiveLogic';

export interface ArchiveScreenProps {
  onNavigate: (tab: NavigationTab) => void;
}

export const ArchiveScreen: React.FC<ArchiveScreenProps> = ({ onNavigate }) => {
  const { inspections, selectInspection, deleteInspectionRecord } = useInspection();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [scoreFilter, setScoreFilter] = useState<ScoreFilterType>('all');
  const [findingsFilter, setFindingsFilter] = useState<FindingsFilterType>('all');
  const [sortBy, setSortBy] = useState<SortByType>('newest');

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const ITEMS_PER_PAGE = 6;

  // Deletion modal state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Compute scores and filter
  const processedRecords = useMemo(() => {
    return inspections.map(record => ({
      record,
      score: calculateInspectionScore(record.items),
    }));
  }, [inspections]);

  const filtered = useMemo(() => {
    return filterArchiveRecords(processedRecords, {
      searchQuery,
      statusFilter,
      scoreFilter,
      findingsFilter,
    });
  }, [processedRecords, searchQuery, statusFilter, scoreFilter, findingsFilter]);

  // Sort records
  const sorted = useMemo(() => {
    return sortArchiveRecords(filtered, sortBy);
  }, [filtered, sortBy]);

  // Pagination slice
  const totalPages = Math.max(1, Math.ceil(sorted.length / ITEMS_PER_PAGE));
  const paginated = useMemo(() => {
    return paginateRecords(sorted, currentPage, ITEMS_PER_PAGE);
  }, [sorted, currentPage]);

  const handleSelectAndNavigate = async (id: string, tab: NavigationTab) => {
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
    <div className="space-y-6 text-right">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-emerald-950/80">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-600/10 dark:bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <FolderArchive className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              بایگانی و سوابق کارشناسی خودرو
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            مشاهده، جستجوی پیشرفته، چاپ مجدد گواهی‌ها و بازیابی پیش‌نویس‌های ثبت‌شده
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => onNavigate('new-inspection')}
          className="self-start sm:self-auto"
        >
          شروع کارشناسی جدید
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Search Input */}
            <div className="md:col-span-2">
              <Input
                placeholder="جستجو بر اساس مدل، پلاک، نام متقاضی، کد رهگیری یا VIN..."
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                isClearable
                onClear={() => setSearchQuery('')}
                prefixIcon={<Search className="w-4 h-4" />}
                className="h-10 text-xs"
              />
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={e => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-emerald-900/60 bg-white dark:bg-[#111e17] text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">همه وضعیت‌ها</option>
                <option value="completed">تکمیل شده (دارای گواهی)</option>
                <option value="in_progress">در حال بازرسی (جاری)</option>
                <option value="draft">پیش‌نویس اولیه</option>
              </select>
            </div>

            {/* Sort Dropdown */}
            <div>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-emerald-900/60 bg-white dark:bg-[#111e17] text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="newest">جدیدترین زمان ثبت</option>
                <option value="updated">آخرین ویرایش</option>
                <option value="oldest">قدیمی‌ترین</option>
                <option value="highest_score">بیشترین امتیاز سلامت</option>
                <option value="lowest_score">کمترین امتیاز سلامت</option>
              </select>
            </div>
          </div>

          {/* Quick Filter Tags */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 dark:border-emerald-950/60 text-xs">
            <span className="text-slate-400 text-[11px] font-medium">فیلتر امتیاز:</span>
            {[
              { id: 'all', label: 'همه نمرات' },
              { id: 'high', label: 'عالی (۸۰-۱۰۰)' },
              { id: 'medium', label: 'متوسط (۵۰-۷۹)' },
              { id: 'low', label: 'دارای نقص (<۵۰)' },
            ].map(pill => (
              <button
                key={pill.id}
                type="button"
                onClick={() => {
                  setScoreFilter(pill.id);
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                  scoreFilter === pill.id
                    ? 'bg-emerald-600 text-white dark:bg-emerald-500/20 dark:text-emerald-300 dark:border dark:border-emerald-500/50'
                    : 'bg-slate-100 dark:bg-[#111e17] text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-emerald-950'
                }`}
              >
                {pill.label}
              </button>
            ))}

            <span className="text-slate-300 dark:text-slate-700 mr-2">|</span>

            <span className="text-slate-400 text-[11px] font-medium">وضعیت عیوب:</span>
            {[
              { id: 'all', label: 'همه' },
              { id: 'has_defects', label: 'دارای نقص فنی' },
              { id: 'clean', label: 'بدون نقص' },
              { id: 'needs_review', label: 'نیازمند بررسی' },
            ].map(pill => (
              <button
                key={pill.id}
                type="button"
                onClick={() => {
                  setFindingsFilter(pill.id);
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                  findingsFilter === pill.id
                    ? 'bg-emerald-600 text-white dark:bg-emerald-500/20 dark:text-emerald-300 dark:border dark:border-emerald-500/50'
                    : 'bg-slate-100 dark:bg-[#111e17] text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-emerald-950'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Archive Count & Results */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span>
          نمایش <span className="font-latin-num font-bold text-slate-800 dark:text-slate-200">{paginated.length}</span> مورد از مجموع <span className="font-latin-num font-bold text-slate-800 dark:text-slate-200">{sorted.length}</span> پرونده بایگانی
        </span>
        {searchQuery && (
          <span className="text-emerald-600 dark:text-emerald-400">
            فیلتر جستجو: «{searchQuery}»
          </span>
        )}
      </div>

      {/* Inspection Cards Grid */}
      {paginated.length === 0 ? (
        <EmptyState
          title="پرونده‌ای در بایگانی یافت نشد"
          description="با فیلترها و معیارهای جستجوی انتخاب‌شده هیچ سابقه کارشناسی تطبیق ندارد."
          actionLabel="پاکسازی فیلترها"
          onAction={() => {
            setSearchQuery('');
            setStatusFilter('all');
            setScoreFilter('all');
            setFindingsFilter('all');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {paginated.map(({ record, score }) => {
            const statusDetails = getRecordStatusDetails(record.status);
            const isCompleted = record.status === 'completed';

            return (
              <div
                key={record.id}
                className="group relative flex flex-col justify-between p-4 sm:p-5 rounded-2xl border border-slate-200/90 dark:border-emerald-900/40 bg-white dark:bg-[#111e17] hover:border-emerald-500/50 dark:hover:border-emerald-500/50 hover:shadow-sm transition-all text-right"
              >
                <div className="space-y-3">
                  {/* Top Header: Vehicle Title & Badges */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                        {record.vehicle.make} {record.vehicle.model}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        <span>مدل <span className="font-latin-num">{record.vehicle.year}</span></span>
                        <span>•</span>
                        <span>{record.vehicle.color}</span>
                        <span>•</span>
                        <span>کد: <span className="font-latin-num font-semibold text-emerald-700 dark:text-emerald-400">{record.trackingCode}</span></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Badge variant={statusDetails.variant} size="sm" dot>
                        {statusDetails.label}
                      </Badge>
                      <button
                        type="button"
                        title="حذف پرونده از بایگانی"
                        onClick={() => setDeletingId(record.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        aria-label={`حذف پرونده ${record.vehicle.make} ${record.vehicle.model}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Vehicle Identity & Plate Block */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-[#0c1611] border border-slate-100 dark:border-emerald-950/60 text-xs">
                    {/* Plate Display */}
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white dark:bg-[#111e17] border border-slate-200 dark:border-emerald-900/50">
                      <span className="text-slate-400 text-[10px]">ایران</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 font-latin-num">
                        {record.vehicle.plate?.provinceCode}
                      </span>
                      <span className="text-slate-300 dark:text-slate-700">|</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100 font-latin-num">
                        {record.vehicle.plate?.prefix}
                      </span>
                      <span className="font-bold text-emerald-700 dark:text-emerald-400">
                        {record.vehicle.plate?.letter}
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100 font-latin-num">
                        {record.vehicle.plate?.suffix}
                      </span>
                    </div>

                    <div className="text-left">
                      <span className="text-[10px] text-slate-400 block">کارکرد</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 font-latin-num">
                        {formatEnglishDigits(record.vehicle.mileage)} km
                      </span>
                    </div>
                  </div>

                  {/* Score & Summary KPI row */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs py-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-baseline gap-1">
                        <span className="text-sm font-black text-emerald-700 dark:text-emerald-400 font-latin-num">
                          {score.currentScore}
                        </span>
                        <span className="text-[11px] text-slate-400">/ ۱۰۰</span>
                      </div>
                      <Badge variant="neutral" size="sm">
                        رتبه: <span className="font-latin-num font-bold">{score.grade}</span>
                      </Badge>
                      <span className="text-slate-300 dark:text-slate-700">•</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        پوشش: <span className="font-latin-num">{score.coveragePercent}%</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {score.defectiveItemsCount > 0 && (
                        <span className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold">
                          {score.defectiveItemsCount} نقص
                        </span>
                      )}
                      {(record.photoCount ?? 0) > 0 && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                          <Camera className="w-3.5 h-3.5" />
                          <span className="font-latin-num">{record.photoCount}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Applicant & Date Meta */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100 dark:border-emerald-950/60 pt-2">
                    <span>متقاضی: {record.vehicle.clientName || 'ثبت نشده'}</span>
                    <span>تاریخ: <span className="font-latin-num">{record.vehicle.inspectionDate}</span></span>
                  </div>
                </div>

                {/* Bottom Actions Row */}
                <div className="flex items-center justify-between gap-2 pt-4 border-t border-slate-100 dark:border-emerald-950/60 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSelectAndNavigate(record.id, 'checklist')}
                    leftIcon={<FileCheck className="w-3.5 h-3.5" />}
                    className="text-xs"
                  >
                    ویرایش چک‌لیست
                  </Button>

                  <Button
                    variant={isCompleted ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => handleSelectAndNavigate(record.id, 'report')}
                    leftIcon={<Printer className="w-3.5 h-3.5" />}
                    className="text-xs"
                  >
                    {isCompleted ? 'مشاهده و چاپ گواهی' : 'پیش‌نمایش گزارش'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            leftIcon={<ChevronRight className="w-4 h-4" />}
          >
            صفحه قبلی
          </Button>

          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 px-3">
            صفحه <span className="font-latin-num">{currentPage}</span> از <span className="font-latin-num">{totalPages}</span>
          </span>

          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            rightIcon={<ChevronLeft className="w-4 h-4" />}
          >
            صفحه بعدی
          </Button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        isOpen={Boolean(deletingId)}
        onClose={() => !isDeleting && setDeletingId(null)}
        title="حذف پرونده از بایگانی"
        description="این پرونده و مستندات تصویری آن از دستگاه و فضای ابری پاک خواهند شد."
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
              حذف قطعی
            </Button>
          </>
        }
      >
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            آیا از حذف این پرونده اطمینان دارید؟ با تأیید شما، اطلاعات پرونده و عکس‌های مرتبط با آن به همراه نشانگر ابطال همگام‌سازی خواهند شد.
          </p>
        </div>
      </Dialog>
    </div>
  );
};
