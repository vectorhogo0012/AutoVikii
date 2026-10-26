import { HandoverCategory, HandoverEquipmentItem, HandoverItemStatus } from '../../types/inspection';

export interface HandoverCategoryMeta {
  id: HandoverCategory;
  title: string;
  description: string;
  iconName: string;
}

export const HANDOVER_CATEGORIES: HandoverCategoryMeta[] = [
  {
    id: 'safety_emergency',
    title: 'ایمنی و اقلام ضروری',
    description: 'تجهیزات ایمنی اجباری و ضروری خودرو هنگام تحویل',
    iconName: 'ShieldAlert',
  },
  {
    id: 'accessories_keys',
    title: 'لوازم و متعلقات',
    description: 'مدارک، سوییچ یدک، کارت‌ها و اکسسوری‌های همراه خودرو',
    iconName: 'KeyRound',
  },
  {
    id: 'cabin_comfort',
    title: 'تجهیزات کابین و امکانات',
    description: 'ادوات رفاهی، نمایشگر، سنسورها و سیستم‌های ارتباطی',
    iconName: 'Tv',
  },
  {
    id: 'exterior_equipment',
    title: 'تجهیزات بیرونی',
    description: 'تیغه‌ها، آینه‌ها، باربند، زه‌ها و متعلقات بدنه',
    iconName: 'Car',
  },
  {
    id: 'tire_tools',
    title: 'ابزار و تجهیزات تعویض چرخ',
    description: 'جک، آچار، قلاب و ادوات پنچرگیری و تعویض تایر',
    iconName: 'Wrench',
  },
];

export interface HandoverTemplateItem {
  id: string;
  categoryId: HandoverCategory;
  label: string;
  description?: string;
}

export const HANDOVER_TEMPLATE_ITEMS: HandoverTemplateItem[] = [
  // 1. ایمنی و اقلام ضروری (3 items)
  {
    id: 'ho_fire_extinguisher',
    categoryId: 'safety_emergency',
    label: 'کپسول آتش‌نشانی',
    description: 'بررسی تاریخ انقضا، فشار مانومتر و سلامت ضامن',
  },
  {
    id: 'ho_first_aid_kit',
    categoryId: 'safety_emergency',
    label: 'جعبه کمک‌های اولیه',
    description: 'وجود اقلام ضدعفونی، بانداژ و داروها با تاریخ معتبر',
  },
  {
    id: 'ho_warning_triangle',
    categoryId: 'safety_emergency',
    label: 'مثلث خطر شبرنگ',
    description: 'سلامت پایه‌ها و بازتاب نور شبرنگ هشدار',
  },

  // 2. لوازم و متعلقات (10 items)
  {
    id: 'ho_spare_key',
    categoryId: 'accessories_keys',
    label: 'سوییچ / کلید یدک',
    description: 'کلید یدک دوم فابریک، کدینگ ایموبلایزر یا کارت هوشمند',
  },
  {
    id: 'ho_fuel_card',
    categoryId: 'accessories_keys',
    label: 'کارت سوخت خودرو',
    description: 'تطابق شماره VIN و فیزیک کارت سوخت',
  },
  {
    id: 'ho_alarm_remote',
    categoryId: 'accessories_keys',
    label: 'ریموت دزدگیر / کنترل',
    description: 'باتری و عملکرد قفل مرکزی و برد ریموت',
  },
  {
    id: 'ho_lighter',
    categoryId: 'accessories_keys',
    label: 'فندک خودرو',
    description: 'فندک فابریک و عملکرد المنت حرارتی',
  },
  {
    id: 'ho_front_mats',
    categoryId: 'accessories_keys',
    label: 'کفپوش‌های جلو (چپ و راست)',
    description: 'کفپوش‌های راننده و شاگرد و خارهای مهار',
  },
  {
    id: 'ho_rear_mats',
    categoryId: 'accessories_keys',
    label: 'کفپوش‌های عقب',
    description: 'کفپوش ردیف دوم و پوشش تونل گیربکس',
  },
  {
    id: 'ho_owner_manual',
    categoryId: 'accessories_keys',
    label: 'دفترچه راهنمای خودرو',
    description: 'کتابچه راهنمای کاربری سازنده و جلد فابریک',
  },
  {
    id: 'ho_warranty_card',
    categoryId: 'accessories_keys',
    label: 'کارت گارانتی و سرویس',
    description: 'دفترچه ثبت سرویس‌های دوره‌ای و گارانتی فعال',
  },
  {
    id: 'ho_hubcaps',
    categoryId: 'accessories_keys',
    label: 'قالپاق‌ها (۴ حلقه)',
    description: 'سلامت خارها، عدم ترک و شکستگی در قالپاق‌ها',
  },
  {
    id: 'ho_charge_cable_inverter',
    categoryId: 'accessories_keys',
    label: 'کابل شارژ / اینورتر برق',
    description: 'مخصوص خودروهای برقی/هیبرید یا مبدل برق ۲۲۰ ولت',
  },

  // 3. تجهیزات کابین و امکانات (6 items)
  {
    id: 'ho_multimedia_screen',
    categoryId: 'cabin_comfort',
    label: 'مانیتور و سیستم مولتی‌مدیا',
    description: 'لمس تصویر، روشن شدن نمایشگر و خروجی صوت',
  },
  {
    id: 'ho_rear_camera',
    categoryId: 'cabin_comfort',
    label: 'دوربین دنده‌عقب',
    description: 'کیفیت تصویر هنگام دنده‌عقب و خطوط راهنمای پارک',
  },
  {
    id: 'ho_parking_sensors',
    categoryId: 'cabin_comfort',
    label: 'سنسورهای پارک جلو و عقب',
    description: 'بوق هشدار صوتی و نمایش فاصله موانع',
  },
  {
    id: 'ho_audio_speakers',
    categoryId: 'cabin_comfort',
    label: 'سیستم صوتی و بلندگوها',
    description: 'عدم خش‌خش باندها و عملکرد تعادل چپ/راست',
  },
  {
    id: 'ho_car_charger',
    categoryId: 'cabin_comfort',
    label: 'شارژر فندکی و پورت‌های USB',
    description: 'تامین جریان برق پورت‌های شارژ و سلامت سوکت‌ها',
  },
  {
    id: 'ho_phone_mount',
    categoryId: 'cabin_comfort',
    label: 'پایه نگهدارنده تلفن همراه',
    description: 'سلامت هولدر، مکنده یا گیره دریچه کولر',
  },

  // 4. تجهیزات بیرونی (10 items)
  {
    id: 'ho_front_wipers',
    categoryId: 'exterior_equipment',
    label: 'تیغه برف‌پاک‌کن جلو (چپ و راست)',
    description: 'عدم پارگی لاستیک تیغه‌ها و عملکرد آب‌پاش جلو',
  },
  {
    id: 'ho_rear_wiper',
    categoryId: 'exterior_equipment',
    label: 'تیغه برف‌پاک‌کن عقب',
    description: 'موتور و لاستیک تیغه برف‌پاک‌کن شیشه عقب',
  },
  {
    id: 'ho_side_mirrors',
    categoryId: 'exterior_equipment',
    label: 'آینه‌های جانبی (قاب و شیشه)',
    description: 'تنظیم برقی/دستی، راهنما و گرمکن آینه‌ها',
  },
  {
    id: 'ho_roof_rack',
    categoryId: 'exterior_equipment',
    label: 'باربند / روف‌ریل',
    description: 'محکم بودن پایه‌ها، اتصالات و درپوش‌های ریل سقف',
  },
  {
    id: 'ho_spare_cover',
    categoryId: 'exterior_equipment',
    label: 'پوشش و کاور زاپاس',
    description: 'کاور چرمی یا هاردکیس زاپاس پشت خودروهای کراس‌اوور/شاسی',
  },
  {
    id: 'ho_mudguards',
    categoryId: 'exterior_equipment',
    label: 'گل‌پخش‌کن‌های چرخ‌ها',
    description: 'اتصالات گل‌پخش‌کن‌های ۴ چرخ در زیر گلگیرها',
  },
  {
    id: 'ho_door_moldings',
    categoryId: 'exterior_equipment',
    label: 'زه و محافظ درب‌ها',
    description: 'چسبندگی کامل زه، عدم تاب‌برداشتگی و خط و خش شدید',
  },
  {
    id: 'ho_fog_lights',
    categoryId: 'exterior_equipment',
    label: 'پروژکتور و مه‌شکن‌ها',
    description: 'سلامت طلق مه شکن جلو/عقب و روشن شدن لامپ‌ها',
  },
  {
    id: 'ho_license_frames',
    categoryId: 'exterior_equipment',
    label: 'قاب پلاک جلو و عقب',
    description: 'پیچ‌ها و سلامت طلق یا فریم نگهدارنده پلاک',
  },
  {
    id: 'ho_wheel_locks',
    categoryId: 'exterior_equipment',
    label: 'قفل ضدسرقت رینگ‌ها (پیچ قفل)',
    description: 'مهره قفل چرخ‌ها همراه با سری مخصوص باز کردن',
  },

  // 5. ابزار و تجهیزات تعویض چرخ (3 items)
  {
    id: 'ho_wheel_jack',
    categoryId: 'tire_tools',
    label: 'جک استاندارد بالابر',
    description: 'مکانیزم رزوه جک، دسته چرخان و ظرفیت وزنی مناسب خودرو',
  },
  {
    id: 'ho_lug_wrench',
    categoryId: 'tire_tools',
    label: 'آچار چرخ استاندارد',
    description: 'آچار چرخ فابریک با سایز مهره متناسب خودرو',
  },
  {
    id: 'ho_tow_hook',
    categoryId: 'tire_tools',
    label: 'قلاب بکسل رزوه ای',
    description: 'قلاب بکسل فابریک داخل صندوق عقب جهت امداد و کشش',
  },
];

/**
 * Initializes a full set of uninspected handover items
 */
export function createDefaultHandoverItems(): HandoverEquipmentItem[] {
  return HANDOVER_TEMPLATE_ITEMS.map(tpl => ({
    id: tpl.id,
    categoryId: tpl.categoryId,
    label: tpl.label,
    description: tpl.description,
    status: 'uninspected',
    note: '',
  }));
}

export interface HandoverSummary {
  total: number;
  presentHealthy: number;
  missing: number;
  presentDefective: number;
  uninspected: number;
}

export function calculateHandoverSummary(items: HandoverEquipmentItem[]): HandoverSummary {
  const summary: HandoverSummary = {
    total: items.length,
    presentHealthy: 0,
    missing: 0,
    presentDefective: 0,
    uninspected: 0,
  };

  for (const item of items) {
    if (item.status === 'present_healthy') summary.presentHealthy++;
    else if (item.status === 'missing') summary.missing++;
    else if (item.status === 'present_defective') summary.presentDefective++;
    else summary.uninspected++;
  }

  return summary;
}
