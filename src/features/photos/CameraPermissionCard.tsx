import React from 'react';
import {
  Camera,
  ShieldCheck,
  AlertTriangle,
  Lock,
  FileImage,
  RefreshCw,
  FolderOpen,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { CameraPermissionState } from '../../lib/media/useCameraPermission';

export interface CameraPermissionCardProps {
  permissionState: CameraPermissionState;
  errorMessage: string | null;
  onRequestPermission: () => void;
  onFallbackSystemCamera: () => void;
  onFallbackGallery?: () => void;
  itemLabel?: string;
}

export const CameraPermissionCard: React.FC<CameraPermissionCardProps> = ({
  permissionState,
  errorMessage,
  onRequestPermission,
  onFallbackSystemCamera,
  onFallbackGallery,
  itemLabel,
}) => {
  // 1. Initial Prompt State: Explaining WHY access is needed
  if (permissionState === 'prompt' || permissionState === 'requesting') {
    return (
      <div className="p-5 sm:p-7 max-w-lg mx-auto bg-slate-900 border border-slate-800 rounded-3xl text-right text-white space-y-5 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Camera className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white">
              درخواست دسترسی به دوربین کارشناسی
            </h3>
            {itemLabel && (
              <p className="text-xs text-slate-400 mt-0.5">
                برای ثبت مستندات تصویری: <span className="text-emerald-400 font-semibold">{itemLabel}</span>
              </p>
            )}
          </div>
        </div>

        {/* Value Proposition & Explanation */}
        <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/60 space-y-3 text-xs sm:text-sm">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p className="text-slate-200 leading-relaxed">
              <strong className="text-white">ثبت دقیق عیوب و اصالت:</strong> عکسبرداری زنده با کیفیت واقعی از رنگ‌شدگی، وضعیت موم‌ها، آسیب‌های شاسی و اقلام تحویل خودرو.
            </p>
          </div>

          <div className="flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
            <p className="text-slate-200 leading-relaxed">
              <strong className="text-white">امنیت و حریم خصوصی:</strong> دوربین فقط با دستور مستقیم شما فعال می‌شود و تصاویر منحصراً در پرونده کارشناسی همین خودرو ذخیره می‌گردند.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-1">
          <Button
            variant="primary"
            onClick={onRequestPermission}
            disabled={permissionState === 'requesting'}
            leftIcon={<Camera className="w-4 h-4" />}
            className="w-full min-h-[46px] text-sm font-bold bg-emerald-600 hover:bg-emerald-500"
          >
            {permissionState === 'requesting' ? 'در حال فعال‌سازی...' : 'فعال‌سازی و باز کردن دوربین زنده'}
          </Button>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={onFallbackSystemCamera}
              leftIcon={<FileImage className="w-4 h-4 text-slate-300" />}
              className="w-full min-h-[44px] text-xs border-slate-700 text-slate-200 hover:bg-slate-800"
            >
              دوربین پیش‌فرض سیستم
            </Button>

            {onFallbackGallery && (
              <Button
                variant="outline"
                onClick={onFallbackGallery}
                leftIcon={<FolderOpen className="w-4 h-4 text-slate-300" />}
                className="w-full min-h-[44px] text-xs border-slate-700 text-slate-200 hover:bg-slate-800"
              >
                انتخاب از گالری
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 2. Permission Denied or Blocked State: Friendly Troubleshooting & Fallback
  if (permissionState === 'denied') {
    return (
      <div className="p-5 sm:p-7 max-w-lg mx-auto bg-slate-900 border border-rose-900/60 rounded-3xl text-right text-white space-y-5 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-rose-300">
              دسترسی به دوربین مسدود شده است
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              مرورگر اجازه استفاده از دوربین زنده را صادر نکرده است
            </p>
          </div>
        </div>

        {/* Step-by-Step Guidance */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5 text-xs text-slate-300">
          <p className="font-semibold text-slate-200">
            چگونه دسترسی به دوربین را فعال کنید؟
          </p>
          <ol className="list-decimal list-inside space-y-1.5 leading-relaxed text-slate-400 pr-1">
            <li>روی آیکون <strong className="text-white">قفل 🔒</strong> یا <strong className="text-white">تنظیمات سایت</strong> در نوار آدرس مرورگر کلیک کنید.</li>
            <li>گزینه <strong className="text-white">Camera (دوربین)</strong> را روی حالت <strong className="text-emerald-400">Allow (مجاز)</strong> تنظیم فرمایید.</li>
            <li>سپس دکمه <strong className="text-white">تلاش مجدد</strong> زیر را لمس کنید.</li>
          </ol>
        </div>

        {/* Prominent Fallback Action */}
        <div className="space-y-2.5 pt-1">
          <Button
            variant="primary"
            onClick={onFallbackSystemCamera}
            leftIcon={<Camera className="w-4 h-4" />}
            className="w-full min-h-[46px] text-sm font-bold bg-emerald-600 hover:bg-emerald-500"
          >
            استفاده از دوربین پیش‌فرض سیستم (جایگزین)
          </Button>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={onRequestPermission}
              leftIcon={<RefreshCw className="w-4 h-4 text-slate-300" />}
              className="w-full min-h-[44px] text-xs border-slate-700 text-slate-200 hover:bg-slate-800"
            >
              تلاش مجدد برای دوربین
            </Button>

            {onFallbackGallery && (
              <Button
                variant="outline"
                onClick={onFallbackGallery}
                leftIcon={<FolderOpen className="w-4 h-4 text-slate-300" />}
                className="w-full min-h-[44px] text-xs border-slate-700 text-slate-200 hover:bg-slate-800"
              >
                انتخاب از گالری
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 3. Hardware Unavailable / Unsupported / Busy State
  return (
    <div className="p-5 sm:p-7 max-w-lg mx-auto bg-slate-900 border border-amber-900/60 rounded-3xl text-right text-white space-y-5 shadow-2xl">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-base sm:text-lg font-bold text-amber-300">
            {permissionState === 'unavailable'
              ? 'سخت‌افزار دوربین یافت نشد'
              : permissionState === 'busy'
              ? 'دوربین در حال استفاده است'
              : 'عدم پشتیبانی مرورگر از وب‌کم'}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {errorMessage || 'ارتباط زنده با دوربین برقرار نشد.'}
          </p>
        </div>
      </div>

      <p className="text-xs text-slate-300 leading-relaxed">
        شما می‌توانید بدون هیچ مشکلی از دوربین پیش‌فرض سیستم‌عامل دستگاه خود برای ثبت مستندات این قطعه استفاده نمایید.
      </p>

      {/* Fallback Action */}
      <div className="space-y-2.5 pt-1">
        <Button
          variant="primary"
          onClick={onFallbackSystemCamera}
          leftIcon={<Camera className="w-4 h-4" />}
          className="w-full min-h-[46px] text-sm font-bold bg-emerald-600 hover:bg-emerald-500"
        >
          عکاسی با دوربین سیستمی
        </Button>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Button
            variant="outline"
            onClick={onRequestPermission}
            leftIcon={<RefreshCw className="w-4 h-4 text-slate-300" />}
            className="w-full min-h-[44px] text-xs border-slate-700 text-slate-200 hover:bg-slate-800"
          >
            تلاش مجدد
          </Button>

          {onFallbackGallery && (
            <Button
              variant="outline"
              onClick={onFallbackGallery}
              leftIcon={<FolderOpen className="w-4 h-4 text-slate-300" />}
              className="w-full min-h-[44px] text-xs border-slate-700 text-slate-200 hover:bg-slate-800"
            >
              انتخاب از گالری
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
