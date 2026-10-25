import React, { useState, useEffect } from 'react';
import {
  Car,
  Calendar,
  Gauge,
  User,
  Phone,
  Save,
  ArrowLeft,
  CheckCircle,
  PlusCircle,
  FileCheck2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { StepIndicator } from '../../components/ui/ProgressBar';
import { Badge } from '../../components/ui/Badge';
import { NavigationTab } from '../../types/navigation';
import { VehicleInfo } from '../../types/inspection';
import { useInspection } from '../inspection/InspectionContext';

export interface InspectionEntryScreenProps {
  onNavigate: (tab: NavigationTab) => void;
  isNewMode?: boolean;
}

export const InspectionEntryScreen: React.FC<InspectionEntryScreenProps> = ({
  onNavigate,
  isNewMode = false,
}) => {
  const { currentInspection, createInspection, updateVehicle } = useInspection();

  const [isCreatingNew, setIsCreatingNew] = useState(isNewMode || !currentInspection);

  // Form State
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: '1403',
    mileage: '0',
    color: 'سفید',
    fuelType: 'بنزین',
    plateProvince: '21',
    plateSuffix: '782',
    plateLetter: 'س',
    platePrefix: '34',
    vin: '',
    clientName: '',
    clientPhone: '',
    inspectionDate: '1403/08/02',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSavedFeedback, setIsSavedFeedback] = useState(false);

  // Populate form if viewing/editing current inspection
  useEffect(() => {
    if (!isCreatingNew && currentInspection) {
      const v = currentInspection.vehicle;
      setFormData({
        make: v.make || '',
        model: v.model || '',
        year: String(v.year || '1403'),
        mileage: String(v.mileage || '0'),
        color: v.color || 'سفید',
        fuelType: v.fuelType || 'بنزین',
        plateProvince: v.plate?.provinceCode || '21',
        plateSuffix: v.plate?.suffix || '782',
        plateLetter: v.plate?.letter || 'س',
        platePrefix: v.plate?.prefix || '34',
        vin: v.vin || '',
        clientName: v.clientName || '',
        clientPhone: v.clientPhone || '',
        inspectionDate: v.inspectionDate || '1403/08/02',
        notes: currentInspection.notes || '',
      });
    } else if (isCreatingNew) {
      // Clean blank slate for fresh inspection
      setFormData({
        make: '',
        model: '',
        year: '1403',
        mileage: '',
        color: 'سفید',
        fuelType: 'بنزین',
        plateProvince: '10',
        plateSuffix: '',
        plateLetter: 'ب',
        platePrefix: '',
        vin: '',
        clientName: '',
        clientPhone: '',
        inspectionDate: '1403/08/02',
        notes: '',
      });
    }
  }, [isCreatingNew, currentInspection]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!formData.make.trim()) errs.make = 'وارد کردن نام سازنده یا برند الزامی است';
    if (!formData.model.trim()) errs.model = 'وارد کردن مدل و تیپ خودرو الزامی است';
    if (!formData.year.trim()) errs.year = 'سال ساخت الزامی است';
    if (formData.mileage === '' || isNaN(Number(formData.mileage))) {
      errs.mileage = 'کیلومتر کارکرد معتبر الزامی است';
    }
    if (!formData.platePrefix || !formData.plateSuffix || !formData.plateProvince) {
      errs.plate = 'تکمیل تمامی بخش‌های پلاک الزامی است';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveAndContinue = async () => {
    if (!validate()) return;

    const vehicleData: VehicleInfo = {
      make: formData.make.trim(),
      model: formData.model.trim(),
      year: Number(formData.year) || formData.year,
      mileage: Number(formData.mileage) || 0,
      color: formData.color.trim(),
      fuelType: formData.fuelType,
      vin: formData.vin.trim().toUpperCase(),
      clientName: formData.clientName.trim(),
      clientPhone: formData.clientPhone.trim(),
      inspectionDate: formData.inspectionDate,
      plate: {
        provinceCode: formData.plateProvince,
        letter: formData.plateLetter,
        prefix: formData.platePrefix,
        suffix: formData.plateSuffix,
      },
    };

    if (isCreatingNew) {
      await createInspection(vehicleData, formData.notes);
    } else {
      await updateVehicle(vehicleData);
    }

    setIsSavedFeedback(true);
    setTimeout(() => {
      onNavigate('checklist');
    }, 400);
  };

  const steps = [
    { id: 1, label: 'مشخصات خودرو' },
    { id: 2, label: 'چک‌لیست بازرسی' },
    { id: 3, label: 'گزارش و گواهی' },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Step Indicator Header */}
      <Card className="p-4 sm:p-5 bg-white dark:bg-[#0f1a14]">
        <StepIndicator steps={steps} currentStepIndex={0} />
      </Card>

      {/* Screen Title & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-right">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {isCreatingNew ? 'ثبت پرونده کارشناسی جدید' : 'ویرایش مشخصات خودروی در حال بررسی'}
            </h2>
            <Badge variant={isCreatingNew ? 'success' : 'info'} size="sm">
              {isCreatingNew ? 'پرونده جدید' : currentInspection?.trackingCode}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            مشخصات فنی و اسناد خودرو را وارد نموده و جهت بازرسی قطعات به مرحله چک‌لیست منتقل شوید.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {currentInspection && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCreatingNew(!isCreatingNew)}
              leftIcon={isCreatingNew ? <FileCheck2 className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
            >
              {isCreatingNew ? 'بازگشت به خودروی جاری' : 'ایجاد پرونده خودروی جدید'}
            </Button>
          )}
        </div>
      </div>

      {isSavedFeedback && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>مشخصات ذخیره شد. در حال انتقال به چک‌لیست...</span>
        </div>
      )}

      {/* Main Form Cards */}
      <div className="grid grid-cols-1 gap-6">
        {/* Section 1: Vehicle Identification */}
        <Card>
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-emerald-950/60">
            <div className="flex items-center gap-2">
              <Car className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <CardTitle className="text-base">مشخصات شناسایی و پلاک انتظامی</CardTitle>
            </div>
            <CardDescription>
              شماره پلاک، شناسه VIN و برند خودرو مطابق با مدارک رسمی
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-5 space-y-4">
            {/* Iranian License Plate Input Layout */}
            <div className="space-y-1.5 text-right">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                پلاک انتظامی خودرو <span className="text-rose-500">*</span>
              </label>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#0c1611] border border-slate-200 dark:border-emerald-900/40 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                {/* Iran Flag & Code section */}
                <div className="flex items-center gap-1.5 bg-white dark:bg-[#111e17] border border-slate-300 dark:border-emerald-900/60 px-3 py-1.5 rounded-xl">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">ایران</span>
                  <input
                    type="text"
                    maxLength={2}
                    value={formData.plateProvince}
                    onChange={e => setFormData({ ...formData, plateProvince: e.target.value })}
                    className="w-8 text-center text-sm font-bold bg-transparent text-slate-900 dark:text-slate-100 font-latin-num focus:outline-none"
                    aria-label="کد استان پلاک"
                    placeholder="21"
                  />
                </div>

                {/* 3 digits */}
                <input
                  type="text"
                  maxLength={3}
                  value={formData.plateSuffix}
                  onChange={e => setFormData({ ...formData, plateSuffix: e.target.value })}
                  className="w-14 h-10 text-center text-sm font-bold bg-white dark:bg-[#111e17] border border-slate-300 dark:border-emerald-900/60 rounded-xl text-slate-900 dark:text-slate-100 font-latin-num focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                  aria-label="سه رقم آخر پلاک"
                  placeholder="782"
                />

                {/* Persian Letter Selector */}
                <select
                  value={formData.plateLetter}
                  onChange={e => setFormData({ ...formData, plateLetter: e.target.value })}
                  aria-label="حرف پلاک"
                  className="h-10 px-3 text-sm font-bold bg-white dark:bg-[#111e17] border border-slate-300 dark:border-emerald-900/60 rounded-xl text-emerald-700 dark:text-emerald-400 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none cursor-pointer"
                >
                  <option value="ب">ب</option>
                  <option value="ج">ج</option>
                  <option value="د">د</option>
                  <option value="س">س</option>
                  <option value="ص">ص</option>
                  <option value="ط">ط</option>
                  <option value="ق">ق</option>
                  <option value="ل">ل</option>
                  <option value="م">م</option>
                  <option value="ن">ن</option>
                  <option value="و">و</option>
                  <option value="ه">هـ</option>
                  <option value="ی">ی</option>
                </select>

                {/* 2 digits */}
                <input
                  type="text"
                  maxLength={2}
                  value={formData.platePrefix}
                  onChange={e => setFormData({ ...formData, platePrefix: e.target.value })}
                  className="w-12 h-10 text-center text-sm font-bold bg-white dark:bg-[#111e17] border border-slate-300 dark:border-emerald-900/60 rounded-xl text-slate-900 dark:text-slate-100 font-latin-num focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                  aria-label="دو رقم ابتدای پلاک"
                  placeholder="34"
                />
              </div>
              {errors.plate && <p className="text-xs text-rose-500 mt-1">{errors.plate}</p>}
            </div>

            {/* Row 2: Make & Model */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="شرکت سازنده / برند"
                value={formData.make}
                onChange={e => setFormData({ ...formData, make: e.target.value })}
                placeholder="مثلاً ایران خودرو، سایپا، کیا، هیوندای"
                error={errors.make}
                required
              />

              <Input
                label="مدل و تیپ خودرو"
                value={formData.model}
                onChange={e => setFormData({ ...formData, model: e.target.value })}
                placeholder="مثلاً تارا اتوماتیک V4، فونیکس تیگو 8"
                error={errors.model}
                required
              />
            </div>

            {/* Row 3: Year, Mileage, VIN */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="سال ساخت"
                value={formData.year}
                onChange={e => setFormData({ ...formData, year: e.target.value })}
                isNumericEnglish
                prefixIcon={<Calendar className="w-4 h-4" />}
                placeholder="1403 یا 2024"
                error={errors.year}
                required
              />

              <Input
                label="کیلومتر کارکرد (km)"
                value={formData.mileage}
                onChange={e => setFormData({ ...formData, mileage: e.target.value })}
                isNumericEnglish
                prefixIcon={<Gauge className="w-4 h-4" />}
                placeholder="12,500"
                error={errors.mileage}
                required
              />

              <Input
                label="رنگ بدنه"
                value={formData.color}
                onChange={e => setFormData({ ...formData, color: e.target.value })}
                placeholder="سفید، مشکی متالیک"
              />
            </div>

            {/* Row 4: VIN & Fuel Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="شماره شناسایی خودرو (VIN)"
                value={formData.vin}
                onChange={e => setFormData({ ...formData, vin: e.target.value })}
                isNumericEnglish
                placeholder="کد ۱۷ رقمی انگلیسی"
                helperText="اختیاری - جهت تطبیق اسناد و سوابق"
              />

              <div className="space-y-1.5 text-right">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  نوع سوخت
                </label>
                <select
                  value={formData.fuelType}
                  onChange={e => setFormData({ ...formData, fuelType: e.target.value })}
                  aria-label="نوع سوخت"
                  className="w-full min-h-[44px] h-11 px-3.5 text-sm rounded-xl bg-white dark:bg-[#111e17] text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-emerald-900/40 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
                >
                  <option value="بنزین">بنزین سوز</option>
                  <option value="دوگانه‌سوز">دوگانه‌سوز (CNG)</option>
                  <option value="هیبرید">هیبرید (PHEV)</option>
                  <option value="تمام‌برقی">تمام برقی (EV)</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Client & Initial Notes */}
        <Card>
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-emerald-950/60">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <CardTitle className="text-base">اطلاعات متقاضی و یادداشت‌های ورودی</CardTitle>
            </div>
            <CardDescription>
              مشخصات متقاضی یا خریدار خودرو و الزامات کارشناسی
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="نام و نام خانوادگی متقاضی"
                value={formData.clientName}
                onChange={e => setFormData({ ...formData, clientName: e.target.value })}
                prefixIcon={<User className="w-4 h-4" />}
                placeholder="رضا علیزاده"
              />

              <Input
                label="شماره تلفن همراه"
                value={formData.clientPhone}
                onChange={e => setFormData({ ...formData, clientPhone: e.target.value })}
                isNumericEnglish
                prefixIcon={<Phone className="w-4 h-4" />}
                placeholder="0912..."
              />
            </div>

            <div className="space-y-1.5 text-right">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                یادداشت اولیه کارشناس
              </label>
              <textarea
                rows={3}
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                className="w-full p-3.5 text-sm rounded-xl bg-white dark:bg-[#111e17] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 border border-slate-200 dark:border-emerald-900/40 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                placeholder="مثلاً: درخواست بررسی دقیق شاسی، سلامت رنگ فابریک یا تست فنی درایو..."
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4">
            <Button
              variant="outline"
              size="md"
              onClick={handleSaveAndContinue}
              leftIcon={<Save className="w-4 h-4" />}
            >
              ذخیره اطلاعات
            </Button>

            <Button
              variant="primary"
              size="lg"
              onClick={handleSaveAndContinue}
              rightIcon={<ArrowLeft className="w-4 h-4" />}
              className="font-bold"
            >
              ورود به چک‌لیست بازرسی قطعات
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};
