import { ChecklistCategory, InspectionItem } from '../../types/inspection';

export interface CategoryDefinition {
  id: ChecklistCategory;
  title: string;
  weight: number;
  description: string;
}

export const CATEGORY_DEFINITIONS: Record<ChecklistCategory, CategoryDefinition> = {
  body_paint: {
    id: 'body_paint',
    title: 'بدنه و رنگ‌آمیزی',
    weight: 30,
    description: 'کاپوت، سقف، درب‌ها، گلگیرها، شاسی، رنگ‌شدگی و آثار تصادف',
  },
  engine_mechanics: {
    id: 'engine_mechanics',
    title: 'موتور و فنی',
    weight: 35,
    description: 'استارت، صدای موتور، نشتی روغن، سیستم خنک‌کاری و گیربکس',
  },
  interior: {
    id: 'interior',
    title: 'کابین و تجهیزات داخلی',
    weight: 20,
    description: 'داشبورد، صندلی‌ها، تهویه، شیشه‌بالابر، ایربگ و ادوات برقی',
  },
  tires: {
    id: 'tires',
    title: 'لاستیک‌ها و رینگ‌ها',
    weight: 15,
    description: 'عاج تایرها، سلامت دیواره، تاریخ تولید، رینگ‌ها و لاستیک زاپاس',
  },
};

interface TemplateItemDef {
  id: string;
  category: ChecklistCategory;
  label: string;
  description: string;
  weight: number;
}

const TEMPLATE_ITEMS_CONFIG: TemplateItemDef[] = [
  // 1. Body & Paint (Total Weight: 30 points)
  {
    id: 'bp_hood',
    category: 'body_paint',
    label: 'کاپوت جلو',
    description: 'بررسی ضخامت رنگ با تستر، فابریک بودن موم‌ها و عدم تعویض استوک',
    weight: 3.5,
  },
  {
    id: 'bp_roof',
    category: 'body_paint',
    label: 'سقف و سانروف',
    description: 'رنگ فابریک، عدم موج‌گرفتگی، علائم واژگونی و عملکرد سانروف',
    weight: 4.0,
  },
  {
    id: 'bp_doors',
    category: 'body_paint',
    label: 'درب‌های خودرو (۴ درب)',
    description: 'بررسی موم فابریک لبه درب‌ها، رنگ‌شدگی و تنظیم رگلاژ',
    weight: 3.5,
  },
  {
    id: 'bp_fenders',
    category: 'body_paint',
    label: 'گلگیرهای جلو و عقب',
    description: 'ضخامت رنگ، تعویض پوسته گلگیر و پیچ‌های اتصال گلگیر جلو',
    weight: 3.0,
  },
  {
    id: 'bp_trunk',
    category: 'body_paint',
    label: 'درب و سینی صندوق عقب',
    description: 'رنگ فابریک صندوق، کف صندوق، سینی عقب و موم‌کشی کارخانه',
    weight: 3.0,
  },
  {
    id: 'bp_bumpers',
    category: 'body_paint',
    label: 'سپرهای جلو و عقب',
    description: 'شکستگی، خط و خش، لیسه‌کشی و سلامت خارهای نگه‌دارنده سپر',
    weight: 2.0,
  },
  {
    id: 'bp_pillars',
    category: 'body_paint',
    label: 'ستون‌ها، کلاف‌ها و شاسی',
    description: 'بررسی عدم دوتکه بودن اتاق، سلامت کلاف‌ها و نقاط جوش نقطه‌ای فابریک',
    weight: 4.0,
  },
  {
    id: 'bp_paint_condition',
    category: 'body_paint',
    label: 'وضعیت کلی و ضخامت رنگ',
    description: 'تست یکنواختی میکرون رنگ در کل بدنه و کدری یا آفتاب‌سوختگی کیلر',
    weight: 2.5,
  },
  {
    id: 'bp_scratches_dents',
    category: 'body_paint',
    label: 'خط و خش و قری‌های بدنه',
    description: 'فرورفتگی‌های تگرگی، موج و مالیدگی‌های نیازمند PDR',
    weight: 2.0,
  },
  {
    id: 'bp_repair_signs',
    category: 'body_paint',
    label: 'آثار صافکاری و لیسه‌گیری',
    description: 'بررسی آثار بتونه‌کاری زیر نور UV و لیسه‌گیری‌های سطحی',
    weight: 2.5,
  },

  // 2. Engine & Mechanics (Total Weight: 35 points)
  {
    id: 'em_startup_sound',
    category: 'engine_mechanics',
    label: 'استارت و صدای کارکرد موتور',
    description: 'استارت سرد/گرم، عدم صدای یاتاقان، صدای فیلر سوپاپ یا لرزش غیرعادی',
    weight: 5.0,
  },
  {
    id: 'em_visible_leaks',
    category: 'engine_mechanics',
    label: 'نشتی‌های مشهود روغن و سیالات',
    description: 'بررسی کاسه‌نمدهای میل‌لنگ، واشر قالپاق، کارتر و هیدرولیک فرمان',
    weight: 4.5,
  },
  {
    id: 'em_engine_oil',
    category: 'engine_mechanics',
    label: 'سطح و کیفیت روغن موتور',
    description: 'رنگ و گرانروی روغن، عدم وجود جرم/لجن یا بوی بنزین در روغن',
    weight: 4.0,
  },
  {
    id: 'em_coolant',
    category: 'engine_mechanics',
    label: 'مایع خنک‌کننده و رادیاتور',
    description: 'کیفیت ضدیخ، سلامت درب رادیاتور و عدم کمپرس گاز به منبع انبساط',
    weight: 4.5,
  },
  {
    id: 'em_battery',
    category: 'engine_mechanics',
    label: 'باتری و دینام',
    description: 'ولتاژ شارژ دینام، سلامت سرباتری‌ها و تاریخ تولید باتری',
    weight: 3.5,
  },
  {
    id: 'em_cooling_system',
    category: 'engine_mechanics',
    label: 'سیستم خنک‌کاری و دور فن‌ها',
    description: 'روشن شدن به موقع فن دور کند و تند، عملکرد ترموستات و عدم داغ کردن',
    weight: 4.5,
  },
  {
    id: 'em_transmission',
    category: 'engine_mechanics',
    label: 'عملکرد گیربکس و انتقال قدرت',
    description: 'تست درایو، نرمی تعویض دنده‌ها، عدم تقه زدن در گیربکس اتوماتیک/دیسک و صفحه',
    weight: 5.0,
  },
  {
    id: 'em_warning_lights',
    category: 'engine_mechanics',
    label: 'چراغ‌های هشدار و خطایابی دیاگ',
    description: 'بررسی خطاهای ذخیره شده در ECU، چراغ چک، خطای سنسور اکسیژن یا ABS',
    weight: 4.0,
  },

  // 3. Interior (Total Weight: 20 points)
  {
    id: 'in_seats',
    category: 'interior',
    label: 'صندلی‌ها و روکش‌ها',
    description: 'سلامت اسکلت صندلی، تنظیمات دستی/برقی و پارگی یا سایش روکش‌ها',
    weight: 2.5,
  },
  {
    id: 'in_dashboard',
    category: 'interior',
    label: 'داشبورد و کنسول میانی',
    description: 'پوسته داشبورد، عدم بازشدگی ایربگ سرنشین و کلیدهای کنسول',
    weight: 2.5,
  },
  {
    id: 'in_cluster',
    category: 'interior',
    label: 'صفحه کیلومتر و نشانگرها',
    description: 'عملکرد دور موتور، سرعت‌سنج، نمایشگر دما و آمپر بنزین',
    weight: 2.5,
  },
  {
    id: 'in_warning_indicators',
    category: 'interior',
    label: 'علائم هشدار داخلی و بوق',
    description: 'صدای بوق، فلاشر، چراغ‌های راهنما و آلارم باز بودن درب‌ها',
    weight: 2.0,
  },
  {
    id: 'in_ac',
    category: 'interior',
    label: 'سیستم تهویه مطبوع (کولر و بخاری)',
    description: 'سرمایش کمپرسور کولر، پرتاب باد فن، گرمایش بخاری و دریچه‌های برقی',
    weight: 3.0,
  },
  {
    id: 'in_windows_locks',
    category: 'interior',
    label: 'شیشه‌بالابرها و قفل مرکزی',
    description: 'بالابرهای ۴ پنجره، قفل کودک، آینه‌های برقی و ریموت دزدگیر',
    weight: 2.0,
  },
  {
    id: 'in_multimedia',
    category: 'interior',
    label: 'سیستم مالتی‌مدیا و دوربین عقب',
    description: 'صفحه لمسی، بلوتوث، وضوح تصویر دوربین دنده عقب و بلندگوها',
    weight: 2.0,
  },
  {
    id: 'in_seatbelts',
    category: 'interior',
    label: 'کمربندهای ایمنی',
    description: 'قفل‌شوندگی سریع، سلامت تسمه‌ها و تاریخ درج شده روی کمربند',
    weight: 2.0,
  },
  {
    id: 'in_visible_damage',
    category: 'interior',
    label: 'ساییدگی و آسیب قطعات کابین',
    description: 'غربیلک فرمان، دسته دنده، پدال‌ها و موکت کف خودرو',
    weight: 1.5,
  },

  // 4. Tires (Total Weight: 15 points)
  {
    id: 'tr_condition',
    category: 'tires',
    label: 'وضعیت عمومی و تاریخ تولید تایرها',
    description: 'بررسی کد DOT چهار رقمی سال ساخت، برند تایرها و عدم خشک‌شدگی',
    weight: 3.0,
  },
  {
    id: 'tr_tread_wear',
    category: 'tires',
    label: 'عمق عاج و سایش نامتقارن',
    description: 'درصد عاج با عمق‌سنج دیجیتال و بررسی لاستیک‌سایی ناشی از جلوبندی',
    weight: 3.0,
  },
  {
    id: 'tr_sidewall',
    category: 'tires',
    label: 'آسیب و برآمدگی دیواره (پله‌کردن/آپارات)',
    description: 'عدم بادکردگی، بریدگی دیواره لاستیک یا دوپوستگی لاستیک‌ها',
    weight: 2.5,
  },
  {
    id: 'tr_pressure_tpms',
    category: 'tires',
    label: 'تنظیم باد و سنسور TPMS',
    description: 'میزان فشار PSI لاستیک‌ها و عدم اخطار سنسور باد در پشت آمپر',
    weight: 2.0,
  },
  {
    id: 'tr_wheels',
    category: 'tires',
    label: 'سلامت رینگ‌ها و عدم تاب‌داشتگی',
    description: 'بررسی رینگ‌های آلومینیومی/فولادی، عدم ترک‌خوردگی یا تاب رینگ',
    weight: 2.5,
  },
  {
    id: 'tr_spare',
    category: 'tires',
    label: 'لاستیک زاپاس و ابزار پنچرگیری',
    description: 'وجود زاپاس سالم، جک، آچار چرخ و قلاب یدک‌کش',
    weight: 2.0,
  },
];

/**
 * Creates a pristine checklist template where every item starts strictly as 'uninspected'.
 * Never assumes an unchecked item is healthy.
 */
export function createDefaultInspectionItems(): InspectionItem[] {
  const now = new Date().toISOString();
  return TEMPLATE_ITEMS_CONFIG.map(item => ({
    id: item.id,
    category: item.category,
    label: item.label,
    description: item.description,
    status: 'uninspected',
    note: '',
    weight: item.weight,
    updatedAt: now,
  }));
}
