import React, { useState } from 'react';
import {
  Sun,
  Moon,
  Laptop,
  Smartphone,
  Shield,
  Download,
  Check,
  Palette,
  Sliders,
  Info,
  HardDrive,
  Database,
  Trash2,
  AlertTriangle,
  Cloud,
  RefreshCw,
  Building2,
  LogIn,
  LogOut,
  UserCheck,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Dialog } from '../../components/ui/Dialog';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { useTheme } from '../../lib/theme';
import { usePWAInstall } from '../../lib/pwa';
import { useInspection } from '../inspection/InspectionContext';
import { useAuth } from '../auth/AuthContext';
import { formatByteSize } from '../../lib/media/imageCompression';
import { indexedDbStorage } from '../../lib/storage/indexedDb';

export const SettingsScreen: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();
  const { storageQuota, refreshInspections, triggerCloudSync, cloudSyncState } = useInspection();
  const { user, isAuthenticated, activeWorkspace, signInWithGoogle, signOutUser } = useAuth();

  const [inspectorName, setInspectorName] = useState('مهندس کمالی');
  const [stationName, setStationName] = useState('مرکز تخصصی کارشناسی خودرو آزادی');
  const [phone, setPhone] = useState('021-66000000');
  const [savedNote, setSavedNote] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const handleSave = () => {
    setSavedNote(true);
    setTimeout(() => setSavedNote(false), 2500);
  };

  const handleClearDatabase = async () => {
    setIsClearing(true);
    try {
      await indexedDbStorage.clearAll();
      localStorage.removeItem('karshenas_active_inspection_id');
      await refreshInspections();
      setShowClearConfirm(false);
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto text-right">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          تنظیمات سامانه و ظاهر کاربری
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          پیکربندی تم رنگی، اطلاعات کارشناس و تنظیمات وب‌اپلیکیشن (PWA)
        </p>
      </div>

      {savedNote && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>تنظیمات با موفقیت ذخیره شد</span>
        </div>
      )}

      {/* Theme Selection */}
      <Card>
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-emerald-950/60">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <CardTitle className="text-base">تم و پوسته نرم‌افزار</CardTitle>
          </div>
          <CardDescription>
            انتخاب بین تم روز (روشن) و شب (تاریک سبز-سیاه) جهت کار در سالن‌های بازرسی
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Light Mode Card */}
            <div
              onClick={() => setTheme('light')}
              role="button"
              tabIndex={0}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') setTheme('light');
              }}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                theme === 'light'
                  ? 'border-emerald-600 bg-emerald-50/50 shadow-sm'
                  : 'border-slate-200 dark:border-emerald-900/40 hover:border-slate-300 dark:hover:border-emerald-800'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-white dark:bg-[#111e17] border border-slate-200 dark:border-emerald-900/60 flex items-center justify-center text-amber-500 shadow-xs">
                    <Sun className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">تم روشن</h4>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">پس‌زمینه ملایم و رنگ سبز زمردی</span>
                  </div>
                </div>
                {theme === 'light' && (
                  <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
              <div className="h-10 rounded-xl bg-white border border-slate-200 p-2 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-600" />
                <div className="h-2 w-20 bg-slate-200 rounded" />
              </div>
            </div>

            {/* Dark Mode Card */}
            <div
              onClick={() => setTheme('dark')}
              role="button"
              tabIndex={0}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') setTheme('dark');
              }}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                theme === 'dark'
                  ? 'border-emerald-500 bg-emerald-950/40 shadow-sm'
                  : 'border-slate-200 dark:border-emerald-900/40 hover:border-slate-300 dark:hover:border-emerald-800 bg-slate-50/50 dark:bg-transparent'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-[#08100c] border border-emerald-900/60 flex items-center justify-center text-emerald-400 shadow-xs">
                    <Moon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">تم تاریک</h4>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">سبز-تیره ارگونومیک برای فضاهای کم‌نور</span>
                  </div>
                </div>
                {theme === 'dark' && (
                  <div className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow-xs">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                )}
              </div>
              <div className="h-10 rounded-xl bg-[#08100c] border border-emerald-900/60 p-2 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                <div className="h-2 w-20 bg-emerald-900/60 rounded" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inspector Station Details */}
      <Card>
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-emerald-950/60">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <CardTitle className="text-base">مشخصات کارشناس و مرکز بازرسی</CardTitle>
          </div>
          <CardDescription>
            این اطلاعات در سربرگ گواهی‌ها و امضای دیجیتال درج می‌شود
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="نام و نام خانوادگی کارشناس"
              value={inspectorName}
              onChange={e => setInspectorName(e.target.value)}
            />

            <Input
              label="شماره تماس مرکز"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              isNumericEnglish
            />
          </div>

          <Input
            label="عنوان مرکز کارشناسی خودرو"
            value={stationName}
            onChange={e => setStationName(e.target.value)}
          />

          <div className="pt-2">
            <Button variant="primary" size="md" onClick={handleSave}>
              ذخیره تغییرات پروفایل
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Cloud Workspace & Multi-device Sync */}
      <Card>
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-emerald-950/60">
          <div className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <CardTitle className="text-base">فضای کاری ابری و همگام‌سازی چنددستگاهی</CardTitle>
          </div>
          <CardDescription>
            مدیریت حساب کاربری گوگل، اتصال به نمایندگی و همگام‌سازی ابری با Firebase
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-5 space-y-4">
          {isAuthenticated && user ? (
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="" className="w-10 h-10 rounded-full border border-emerald-500/40" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">
                      {user.displayName?.[0] || 'U'}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-slate-100">{user.displayName || 'کارشناس رسمی'}</span>
                      <Badge variant="success" size="sm">ورود با گوگل</Badge>
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-latin-num">{user.email}</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={signOutUser}
                  leftIcon={<LogOut className="w-3.5 h-3.5" />}
                  className="text-xs self-end sm:self-auto"
                >
                  خروج از حساب
                </Button>
              </div>

              {activeWorkspace && (
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#111e17] border border-slate-200/80 dark:border-emerald-900/40 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="font-bold text-slate-800 dark:text-slate-200">{activeWorkspace.name}</span>
                    </div>
                    <Badge variant="neutral" size="sm">
                      کد: <span className="font-latin-num">{activeWorkspace.code}</span>
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    تمامی کارشناسی‌ها و تصاویر ثبت‌شده در این دستگاه به صورت خودکار و امن با سرور ابری نمایندگی همگام‌سازی می‌گردند.
                  </p>
                </div>
              )}

              <div className="pt-1 flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  وضعیت سرور: {cloudSyncState === 'syncing' ? 'در حال ارسال داده‌ها...' : 'آماده و آنلاین'}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => triggerCloudSync()}
                  isLoading={cloudSyncState === 'syncing'}
                  leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                >
                  همگام‌سازی دستی اکنون
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#111e17] border border-slate-200/80 dark:border-emerald-900/40 text-center space-y-3">
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                جهت دسترسی به پرونده‌ها از چند دستگاه و اشتراک‌گذاری گواهی‌ها با سایر همکاران، وارد حساب گوگل خود شوید.
              </p>
              <Button
                variant="primary"
                size="md"
                onClick={() => signInWithGoogle()}
                leftIcon={<LogIn className="w-4 h-4" />}
                className="mx-auto"
              >
                اتصال و ورود با حساب گوگل
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* PWA & System Info */}
      <Card>
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-emerald-950/60">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <CardTitle className="text-base">وضعیت وب‌اپلیکیشن (PWA)</CardTitle>
          </div>
          <CardDescription>
            اطلاعات نصب، قابلیت کار آفلاین و مشخصات فنی زیرساخت برنامه
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-5 space-y-3">
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-[#111e17] border border-slate-200/80 dark:border-emerald-900/40 text-xs">
            <div>
              <span className="font-bold text-slate-800 dark:text-slate-200 block">
                نصب روی دستگاه
              </span>
              <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                {isInstalled
                  ? 'برنامه در حالت تمام‌صفحه و مستقل (Standalone) اجرا شده است'
                  : 'امکان نصب به عنوان اپلیکیشن مستقل موبایل / دسکتاپ'}
              </span>
            </div>
            {isInstallable && (
              <Button
                variant="outline"
                size="sm"
                onClick={promptInstall}
                leftIcon={<Download className="w-3.5 h-3.5" />}
              >
                نصب اپلیکیشن
              </Button>
            )}
            {isInstalled && (
              <Badge variant="success" size="sm">
                نصب شده
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-[#111e17] border border-slate-200/80 dark:border-emerald-900/40 text-xs">
            <div>
              <span className="font-bold text-slate-800 dark:text-slate-200 block">
                زبان و چیدمان رابط کاربری
              </span>
              <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                فارسی راست‌به‌چپ (RTL) همراه با فونت وزیرمتن و ارقام استاندارد
              </span>
            </div>
            <Badge variant="neutral" size="sm">
              FA-IR / RTL
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Local Storage & IndexedDB Management */}
      <Card>
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-emerald-950/60">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <CardTitle className="text-base">پایگاه داده محلی و مستندات تصویری</CardTitle>
          </div>
          <CardDescription>
            مدیریت حافظه محلی پایدار (IndexedDB) جهت نگهداری پیش‌نویس‌ها و تصاویر ضمیمه در حالت آفلاین
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-5 space-y-4">
          <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-[#111e17] border border-slate-200/80 dark:border-emerald-900/40 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-300 font-medium">
                فضای اشغال‌شده توسط تصاویر و اطلاعات کارشناسی:
              </span>
              <span className="font-bold text-emerald-700 dark:text-emerald-400 font-latin-num">
                {storageQuota ? formatByteSize(storageQuota.usedBytes) : '۰ بایت'}
              </span>
            </div>

            {storageQuota && storageQuota.quotaBytes > 0 && (
              <>
                <ProgressBar
                  value={Math.max(1, storageQuota.percentUsed)}
                  showPercent={false}
                  size="sm"
                  variant="emerald"
                />
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>کل سهمیه مجاز دستگاه: <span className="font-latin-num">{formatByteSize(storageQuota.quotaBytes)}</span></span>
                  <span><span className="font-latin-num">{storageQuota.percentUsed}%</span> مصرف شده</span>
                </div>
              </>
            )}

            <div className="pt-1 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed border-t border-slate-200/60 dark:border-emerald-950/60">
              مستندات تصویری پس از فشرده‌سازی خودکار کلاینت، به صورت داده‌های باینری استاندارد (Blob) در پایگاه داده مستقل مرورگر ذخیره شده و هیچ وابستگی به اتصال اینترنت ندارند.
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              پاکسازی کلیه اطلاعات محلی و بازنشانی پرونده‌ها
            </span>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowClearConfirm(true)}
              leftIcon={<Trash2 className="w-4 h-4" />}
            >
              پاکسازی حافظه محلی
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Clear Database Confirmation Dialog */}
      <Dialog
        isOpen={showClearConfirm}
        onClose={() => !isClearing && setShowClearConfirm(false)}
        title="تأیید بازنشانی و پاکسازی پایگاه داده محلی"
        description="تمامی پرونده‌ها و عکس‌های کارشناسی از دستگاه حذف خواهند شد."
        maxWidth="sm"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              disabled={isClearing}
              onClick={() => setShowClearConfirm(false)}
            >
              انصراف
            </Button>
            <Button
              variant="destructive"
              size="sm"
              isLoading={isClearing}
              onClick={handleClearDatabase}
              leftIcon={<Trash2 className="w-4 h-4" />}
            >
              پاکسازی و بازنشانی
            </Button>
          </>
        }
      >
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            آیا مطمئن هستید؟ با این اقدام، تمام پیش‌نویس‌های کارشناسی، سوابق چک‌لیست و تصاویر ذخیره‌شده از پایگاه داده IndexedDB مرورگر پاک خواهند شد.
          </p>
        </div>
      </Dialog>
    </div>
  );
};
