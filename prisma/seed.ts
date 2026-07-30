process.env.LOG_LEVELS = 'error';
import { db } from '../src/lib/db';

// ============================================================
// CATEGORY STRUCTURE
// ============================================================

interface CatDef {
  name: string;
  slug: string;
  order: number;
  parentId?: number; // resolved at runtime
  _parentSlug?: string; // used to resolve parentId
  children?: CatDef[];
}

const categoryTree: CatDef[] = [
  {
    name: 'یونیت', slug: 'yunit', order: 1,
  },
  {
    name: 'تجهیزات ایمپلنت و جراحی', slug: 'implant-surgery', order: 2,
    children: [
      { name: 'موتور ایمپلنت', slug: 'implant-motor', order: 1 },
      { name: 'پیزوسرجری', slug: 'piezosurgery', order: 2 },
      { name: 'میکروموتور', slug: 'micromotor', order: 3 },
      { name: 'الکتروسرجری', slug: 'electrosurgery', order: 4 },
      { name: 'موتور الکتریکی', slug: 'electric-motor', order: 5 },
    ],
  },
  {
    name: 'تجهیزات دیجیتال', slug: 'digital', order: 3,
    children: [
      { name: 'اسکنر داخل دهانی', slug: 'intraoral-scanner', order: 1 },
      { name: 'میلینگ', slug: 'milling', order: 2 },
    ],
  },
  {
    name: 'تصویربرداری', slug: 'imaging', order: 4,
    children: [
      { name: 'تاریکخانه', slug: 'darkroom', order: 1 },
      { name: 'CBCT + OPG', slug: 'cbct-opg', order: 2 },
      { name: 'نگاتوسکوپ', slug: 'negatoscope', order: 3 },
      {
        name: 'رادیوگرافی', slug: 'radiography', order: 4,
        children: [
          { name: 'پایه دار', slug: 'floor-standing', order: 1 },
          { name: 'دیواری', slug: 'wall-mounted', order: 2 },
          { name: 'AC', slug: 'ac', order: 3 },
          { name: 'DC', slug: 'dc', order: 4 },
          { name: 'پرتابل', slug: 'portable', order: 5 },
        ],
      },
      { name: 'سنسور RVG', slug: 'rvg-sensor', order: 5 },
      { name: 'فسفر پلیت PSP', slug: 'psp-plate', order: 6 },
      { name: 'پوشش سربی و پاراوان', slug: 'lead-protection', order: 7 },
    ],
  },
  {
    name: 'تجهیزات اندو', slug: 'endo', order: 5,
    children: [
      { name: 'اپکس فایندر', slug: 'apex-finder', order: 1 },
      { name: 'روتاری + اندوموتور', slug: 'rotary-endomotor', order: 2 },
      { name: 'اپکس روتاری', slug: 'apex-rotary', order: 3 },
      { name: 'کیت‌های اندو', slug: 'endo-kits', order: 4 },
      { name: 'ایریگیشن', slug: 'irrigation', order: 5 },
      { name: 'آبچوریشن', slug: 'backfilling', order: 6 },
    ],
  },
  {
    name: 'کمپرسور و ساکشن', slug: 'compressor-suction', order: 6,
    children: [
      { name: 'کمپرسور مرکزی', slug: 'central-compressor', order: 1 },
      { name: 'کمپرسور پرتابل', slug: 'portable-compressor', order: 2 },
      { name: 'کمپرسور برقی', slug: 'electric-compressor', order: 3 },
      {
        name: 'ساکشن', slug: 'suction', order: 4,
        children: [
          { name: 'مرکزی', slug: 'central-suction', order: 1 },
          { name: 'پرتابل', slug: 'portable-suction', order: 2 },
          { name: 'برقی', slug: 'electric-suction', order: 3 },
        ],
      },
    ],
  },
  {
    name: 'تجهیزات استریل', slug: 'sterilization', order: 7,
    children: [
      { name: 'اتوکلاو', slug: 'autoclave', order: 1 },
      { name: 'دستگاه پک', slug: 'packing-device', order: 2 },
      { name: 'اولتراسونیک', slug: 'ultrasonic-cleaner', order: 3 },
    ],
  },
  {
    name: 'تجهیزات ترمیمی', slug: 'restorative', order: 8,
    children: [
      { name: 'لایت کیور', slug: 'light-cure', order: 1 },
      { name: 'جرمگیر', slug: 'scaler', order: 2 },
      { name: 'ایرفلو', slug: 'air-flow', order: 3 },
      { name: 'سندبلاستر', slug: 'sandblaster', order: 4 },
      { name: 'بلیچینگ', slug: 'bleaching', order: 5 },
      { name: 'آمالگاماتور', slug: 'amalgamator', order: 6 },
    ],
  },
  {
    name: 'اینسترومنت‌ها', slug: 'instruments', order: 9,
    children: [
      { name: 'آنگل', slug: 'angle', order: 1 },
      { name: 'توربین', slug: 'turbine', order: 2 },
      { name: 'ایرموتور', slug: 'airmotor', order: 3 },
      { name: 'هندپیس', slug: 'handpiece', order: 4 },
      { name: 'فورسپس', slug: 'forceps', order: 5 },
      { name: 'الواتور', slug: 'elevator', order: 6 },
    ],
  },
  {
    name: 'تجهیزات جانبی', slug: 'accessories', order: 10,
    children: [
      { name: 'لوپ چشمی', slug: 'loupe', order: 1 },
      { name: 'دستگاه تزریق بی حسی', slug: 'anesthesia-injector', order: 2 },
    ],
  },
];

// ============================================================
// BRANDS
// ============================================================

const brandNames = [
  'SD', 'Goldent', 'COXO', 'Woodpecker', 'Wj Medical', 'DTE', 'Eighteeth',
  'DiaDent', 'DANVILLE', 'Marathon', 'Micro NX', 'Aseptico', 'Tech Win',
  'Kevin Peter', 'Owandy', 'SAMAN', 'Senator', 'YUWELL', 'ATRICO', 'AVICO',
  'Max Seal', 'FOMOS', 'NewLife', 'FIAD', 'PROX', 'Air Techniques', 'Faraz',
  'Karen', 'ZEMER', 'DENTUS', 'SUN', 'Euronda', 'Castellini', 'Codyson',
  'عاج طب', 'پارس طب', 'پارس دنتال', 'نوردیسکا', 'STS', '4U', 'REMEDI',
  // Additional brands from PDF
  'سپهر دنتال', 'تکنوگاز', 'وسون', 'پارس', 'آریان', 'بارلی', 'Malin', 'Corpus Vac',
  'Dentex', 'META', 'Dempex', 'JD200', 'generic',
];

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, '-')
    .replace(/^-+|-+$/g, '') || name;
}

// ============================================================
// CATEGORY SLUG LOOKUP
// ============================================================
// Maps human-readable category paths from the PDF to the target category slug.
// The lookup is hierarchical: try the most specific (subcategory) first.

const categorySlugMap: Record<string, string> = {
  // یونیت
  'یونیت': 'yunit',

  // ایمپلنت
  'ایمپلنت': 'implant-surgery',
  'ایمپلنت/موتور ایمپلنت': 'implant-motor',
  'ایمپلنت/پیزوسرجری': 'piezosurgery',
  'ایمپلنت/الکتروسرجری': 'electrosurgery',
  'ایمپلنت/موتور الکتریکی': 'electric-motor',
  'ایمپلنت/میکروموتور': 'micromotor',

  // دیجیتال
  'دیجیتال': 'digital',
  'دیجیتال/اسکنر داخل دهانی': 'intraoral-scanner',

  // تصویربرداری
  'تصویربرداری': 'imaging',
  'تصویربرداری/تاریکخانه': 'darkroom',
  'تصویربرداری/نگاتوسکوپ': 'negatoscope',
  'تصویربرداری/RVG': 'rvg-sensor',
  'تصویربرداری/PSP': 'psp-plate',
  'تصویربرداری/پوشش سربی': 'lead-protection',
  'تصویربرداری/رادیوگرافی/پایه دار': 'floor-standing',
  'تصویربرداری/رادیوگرافی/دیواری': 'wall-mounted',
  'تصویربرداری/رادیوگرافی/DC': 'dc',
  'تصویربرداری/رادیوگرافی/پرتابل': 'portable',
  'تصویربرداری/رادیوگرافی/AC': 'ac',

  // اندو
  'اندو': 'endo',
  'اندو/اپکس فایندر': 'apex-finder',
  'اندو/روتاری': 'rotary-endomotor',
  'اندو/اپکس روتاری': 'apex-rotary',
  'اندو/کیت‌های اندو': 'endo-kits',
  'اندو/ایریگیشن': 'irrigation',
  'اندو/آبچوریشن': 'backfilling',

  // کمپرسور
  'کمپرسور': 'compressor-suction',
  'کمپرسور/مرکزی': 'central-compressor',
  'کمپرسور/ساکشن/برقی': 'electric-suction',
  'کمپرسور/ساکشن/پرتابل': 'portable-suction',
  'کمپرسور/ساکشن/مرکزی': 'central-suction',

  // استریل
  'استریل': 'sterilization',
  'استریل/دستگاه پک': 'packing-device',
  'استریل/اولتراسونیک': 'ultrasonic-cleaner',
  'استریل/اتوکلاو': 'autoclave',

  // ترمیمی
  'ترمیمی': 'restorative',
  'ترمیمی/لایت کیور': 'light-cure',
  'ترمیمی/جرمگیر': 'scaler',
  'ترمیمی/ایرفلو': 'air-flow',
  'ترمیمی/سندبلاستر': 'sandblaster',
  'ترمیمی/بلیچینگ': 'bleaching',
  'ترمیمی/آمالگاماتور': 'amalgamator',

  // اینسترومنت
  'اینسترومنت': 'instruments',
  'اینسترومنت/توربین': 'turbine',
  'اینسترومنت/آنگل': 'angle',
  'اینسترومنت/ایرموتور': 'airmotor',
  'اینسترومنت/هندپیس': 'handpiece',

  // جانبی
  'جانبی': 'accessories',
  'جانبی/لوپ': 'loupe',
  'جانبی/تزریق بی حسی': 'anesthesia-injector',
};

// ============================================================
// PRODUCT DATA
// ============================================================

interface RawProduct {
  name: string;
  brand: string;
  cat: string; // human-readable, will be mapped to slug
  price: number | null; // null = ناموجود or استعلام
  specs?: string;
  availability: 'in_stock' | 'out_of_stock' | 'call';
  priceType?: 'fixed' | 'call';
}

const rawProducts: RawProduct[] = [
  // ===== تجهیزات SD (page 1) =====
  { name: 'ایرفلو SD', brand: 'SD', cat: 'ترمیمی/ایرفلو', price: null, availability: 'out_of_stock' },
  { name: 'تورک درایور SD', brand: 'SD', cat: 'ایمپلنت/میکروموتور', price: 49900000, availability: 'in_stock' },
  { name: 'جرمگیر ایر اسکیلر SD', brand: 'SD', cat: 'ترمیمی/جرمگیر', price: 6500000, availability: 'in_stock' },
  { name: 'دستگاه استریپینگ بین دندانی Ortho Prophy X SD', brand: 'SD', cat: 'اینسترومنت/آنگل', price: 39900000, availability: 'in_stock', specs: 'ارتودنسی بین دندانی' },
  { name: 'دستگاه کامپوزیت وارمر SD', brand: 'SD', cat: 'ترمیمی/لایت کیور', price: null, availability: 'out_of_stock' },
  { name: 'دستگاه کامپوزیت وارمر سه تیکه SD Plus', brand: 'SD', cat: 'ترمیمی/لایت کیور', price: 16900000, availability: 'in_stock' },
  { name: 'دستگاه بلیچینگ رو یونیتی سه نور SD', brand: 'SD', cat: 'ترمیمی/بلیچینگ', price: 13900000, availability: 'in_stock', specs: 'با بازو تقویت شده' },
  { name: 'دستگاه بلیچینگ پایه دار سه نور SD', brand: 'SD', cat: 'ترمیمی/بلیچینگ', price: 27900000, availability: 'in_stock' },
  { name: 'دستگاه آب مقطر ساز SD بدنه استیل', brand: 'SD', cat: 'جانبی', price: 29900000, availability: 'in_stock' },
  { name: 'دستگاه آب مقطر ساز SD بدنه ABS', brand: 'SD', cat: 'جانبی', price: 26900000, availability: 'in_stock' },
  { name: 'دستگاه روغن کاری SD', brand: 'SD', cat: 'جانبی', price: null, availability: 'out_of_stock' },
  { name: 'دستگاه تزریق بی حسی SD', brand: 'SD', cat: 'جانبی/تزریق بی حسی', price: 19900000, availability: 'in_stock' },
  { name: 'دوربین میکروسکوپی داخل دهانی SD', brand: 'SD', cat: 'دیجیتال', price: 49900000, availability: 'in_stock' },
  { name: 'روتاری SD', brand: 'SD', cat: 'اندو/روتاری', price: null, availability: 'out_of_stock' },
  { name: 'روتاری SD Black', brand: 'SD', cat: 'اندو/روتاری', price: 19900000, availability: 'in_stock' },
  { name: 'سری روغن کاری SD', brand: 'SD', cat: 'جانبی', price: 4900000, availability: 'in_stock' },
  { name: 'ست آچار ایمپلنت SD', brand: 'SD', cat: 'ایمپلنت', price: 6900000, availability: 'in_stock' },
  { name: 'ست مانیتور و دوربین SD WiFi', brand: 'SD', cat: 'دیجیتال', price: 59900000, availability: 'in_stock', specs: 'دارای سیستم استریل UV' },
  { name: 'فالش الیت طرح لبخند SD', brand: 'SD', cat: 'ترمیمی/لایت کیور', price: 13900000, availability: 'in_stock' },
  { name: 'کمپرسور تک موتور 50 لیتری سپهر دنتال', brand: 'سپهر دنتال', cat: 'کمپرسور/مرکزی', price: 28900000, availability: 'in_stock', specs: 'موتور 750 وات' },
  { name: 'کمپرسور دو موتور 80 لیتری سپهر دنتال', brand: 'سپهر دنتال', cat: 'کمپرسور/مرکزی', price: 46900000, availability: 'in_stock' },
  { name: 'کمپرسور دو موتور 100 لیتری سپهر دنتال', brand: 'سپهر دنتال', cat: 'کمپرسور/مرکزی', price: 48900000, availability: 'in_stock' },
  { name: 'کمپرسور سه موتور 150 لیتری سپهر دنتال', brand: 'سپهر دنتال', cat: 'کمپرسور/مرکزی', price: 66500000, availability: 'in_stock' },
  { name: 'کیت رفلکتور عکاسی با دستگاه ضد بخار SD', brand: 'SD', cat: 'تصویربرداری', price: 9900000, availability: 'in_stock' },
  { name: 'الیت کیور SD مدل Ai', brand: 'SD', cat: 'ترمیمی/لایت کیور', price: 9900000, availability: 'in_stock' },
  { name: 'الیت کیور SD هدالیت قابل تنظیم', brand: 'SD', cat: 'ترمیمی/لایت کیور', price: null, availability: 'out_of_stock' },
  { name: 'لوپ SD بزرگنمایی 3.5', brand: 'SD', cat: 'جانبی/لوپ', price: 14900000, availability: 'in_stock', specs: 'فاصله کانونی 320 تا 420mm' },
  { name: 'لوپ SD بزرگنمایی 2.5', brand: 'SD', cat: 'جانبی/لوپ', price: 14900000, availability: 'in_stock', specs: 'فاصله کانونی 420 تا 620mm' },
  { name: 'لوپ SD طرح Dr Kim', brand: 'SD', cat: 'جانبی/لوپ', price: 24900000, availability: 'in_stock' },
  { name: 'هد الیت سیلیکونی SD', brand: 'SD', cat: 'ترمیمی/لایت کیور', price: 8500000, availability: 'in_stock' },
  { name: 'هولدر فیلم و پلیت', brand: 'generic', cat: 'تصویربرداری', price: null, availability: 'out_of_stock' },
  { name: 'هولدر سنسور RVG سه تیکه', brand: 'generic', cat: 'تصویربرداری/RVG', price: 5900000, availability: 'in_stock', specs: 'قابل تنظیم' },
  { name: 'هولدر سنسور RVG قابل تنظیم', brand: 'generic', cat: 'تصویربرداری/RVG', price: null, availability: 'out_of_stock' },
  { name: 'یونیت SUN مدل S500', brand: 'SUN', cat: 'یونیت', price: 449900000, availability: 'in_stock' },

  // ===== GOLDENT (page 1) =====
  { name: 'توربین کالس A', brand: 'Goldent', cat: 'اینسترومنت/توربین', price: 7000000, availability: 'in_stock', specs: '9 ماه گارانتی' },
  { name: 'توربین کالس B', brand: 'Goldent', cat: 'اینسترومنت/توربین', price: 5300000, availability: 'in_stock', specs: '3 ماه گارانتی' },
  { name: 'توربین چهار سوراخ', brand: 'Goldent', cat: 'اینسترومنت/توربین', price: 7100000, availability: 'in_stock', specs: '9 ماه گارانتی' },
  { name: 'توربین رنگی', brand: 'Goldent', cat: 'اینسترومنت/توربین', price: 7900000, availability: 'in_stock' },
  { name: 'توربین اپتیک (نوری)', brand: 'Goldent', cat: 'اینسترومنت/توربین', price: 18500000, availability: 'in_stock' },
  { name: 'توربین با هد 45 درجه', brand: 'Goldent', cat: 'اینسترومنت/توربین', price: 10200000, availability: 'in_stock' },
  { name: 'توربین با هد 45 درجه فایبراپتیک', brand: 'Goldent', cat: 'اینسترومنت/توربین', price: null, availability: 'out_of_stock' },
  { name: 'آنگل ناخنی', brand: 'Goldent', cat: 'اینسترومنت/آنگل', price: 5300000, availability: 'in_stock' },
  { name: 'آنگل پوش باتن', brand: 'Goldent', cat: 'اینسترومنت/آنگل', price: null, availability: 'out_of_stock' },
  { name: 'آنگل پوش باتن آب از داخل', brand: 'Goldent', cat: 'اینسترومنت/آنگل', price: 16000000, availability: 'in_stock' },
  { name: 'آنگل روتاری پوش باتن 64:1', brand: 'Goldent', cat: 'اینسترومنت/آنگل', price: 27000000, availability: 'in_stock' },
  { name: 'آنگل ایمپلنت پوش باتن 20:1', brand: 'Goldent', cat: 'اینسترومنت/آنگل', price: 27000000, availability: 'in_stock' },
  { name: 'آنگل اندولیفت 10:1', brand: 'Goldent', cat: 'اینسترومنت/آنگل', price: 23900000, availability: 'in_stock' },
  { name: 'ایرموتور 2 سوراخ', brand: 'Goldent', cat: 'اینسترومنت/ایرموتور', price: 8200000, availability: 'in_stock' },
  { name: 'ایرموتور 4 سوراخ', brand: 'Goldent', cat: 'اینسترومنت/ایرموتور', price: 8300000, availability: 'in_stock' },
  { name: 'ایرموتور 2 سوراخ آب از داخل', brand: 'Goldent', cat: 'اینسترومنت/ایرموتور', price: 13000000, availability: 'in_stock' },
  { name: 'هندپیس مستقیم', brand: 'Goldent', cat: 'اینسترومنت/هندپیس', price: 5300000, availability: 'in_stock' },
  { name: 'هندپیس مستقیم آب از داخل', brand: 'Goldent', cat: 'اینسترومنت/هندپیس', price: 8000000, availability: 'in_stock' },

  // ===== COXO (page 2) =====
  { name: 'توربین مدل 207', brand: 'COXO', cat: 'اینسترومنت/توربین', price: 6900000, availability: 'in_stock' },
  { name: 'توربین 4 سوراخ', brand: 'COXO', cat: 'اینسترومنت/توربین', price: 8700000, availability: 'in_stock' },
  { name: 'توربین اپتیک (نوری)', brand: 'COXO', cat: 'اینسترومنت/توربین', price: 13900000, availability: 'in_stock' },
  { name: 'توربین با هد 45 درجه', brand: 'COXO', cat: 'اینسترومنت/توربین', price: 13500000, availability: 'in_stock' },
  { name: 'آنگل ناخنی', brand: 'COXO', cat: 'اینسترومنت/آنگل', price: 5500000, availability: 'in_stock' },
  { name: 'آنگل پوش باتن', brand: 'COXO', cat: 'اینسترومنت/آنگل', price: 9800000, availability: 'in_stock' },
  { name: 'آنگل روتاری', brand: 'COXO', cat: 'اینسترومنت/آنگل', price: 24900000, availability: 'in_stock' },
  { name: 'آنگل ایمپلنت', brand: 'COXO', cat: 'اینسترومنت/آنگل', price: 24900000, availability: 'in_stock' },
  { name: 'آنگل اندولیفت 10:1', brand: 'COXO', cat: 'اینسترومنت/آنگل', price: 23900000, availability: 'in_stock' },
  { name: 'آنگل دور قرمز نوری', brand: 'COXO', cat: 'اینسترومنت/آنگل', price: 61000000, availability: 'in_stock' },
  { name: 'ایرموتور 2 سوراخ', brand: 'COXO', cat: 'اینسترومنت/ایرموتور', price: 7600000, availability: 'in_stock' },
  { name: 'ایرموتور 4 سوراخ', brand: 'COXO', cat: 'اینسترومنت/ایرموتور', price: 9400000, availability: 'in_stock' },
  { name: 'هندپیس مستقیم', brand: 'COXO', cat: 'اینسترومنت/هندپیس', price: 5900000, availability: 'in_stock' },

  // ===== WOODPECKER instruments (page 2) =====
  { name: 'توربین مدل HP33', brand: 'Woodpecker', cat: 'اینسترومنت/توربین', price: 15500000, availability: 'in_stock' },
  { name: 'آنگل ایمپلنت', brand: 'Woodpecker', cat: 'اینسترومنت/آنگل', price: 44900000, availability: 'in_stock' },
  { name: 'آنگل دورقرمز اپتیک', brand: 'Woodpecker', cat: 'اینسترومنت/آنگل', price: 72900000, availability: 'in_stock' },
  { name: 'آنگل ایمپلنت اپتیک DTE', brand: 'Woodpecker', cat: 'اینسترومنت/آنگل', price: 59900000, availability: 'in_stock', specs: 'قیمت موقت' },

  // ===== Wj Medical (page 2) =====
  { name: 'توربین دو سوراخ', brand: 'Wj Medical', cat: 'اینسترومنت/توربین', price: 5900000, availability: 'in_stock' },
  { name: 'توربین چهار سوراخ', brand: 'Wj Medical', cat: 'اینسترومنت/توربین', price: 5900000, availability: 'in_stock' },
  { name: 'توربین نوری', brand: 'Wj Medical', cat: 'اینسترومنت/توربین', price: null, availability: 'out_of_stock' },
  { name: 'آنگل ناخنکی', brand: 'Wj Medical', cat: 'اینسترومنت/آنگل', price: 5900000, availability: 'in_stock' },
  { name: 'آنگل پوش باتن', brand: 'Wj Medical', cat: 'اینسترومنت/آنگل', price: 5900000, availability: 'in_stock' },
  { name: 'آنگل اپتیک پوش باتن آب از داخل', brand: 'Wj Medical', cat: 'اینسترومنت/آنگل', price: 14900000, availability: 'in_stock' },
  { name: 'آنگل ایمپلنت', brand: 'Wj Medical', cat: 'اینسترومنت/آنگل', price: null, availability: 'out_of_stock' },
  { name: 'آنگل اپتیک دورقرمز', brand: 'Wj Medical', cat: 'اینسترومنت/آنگل', price: null, availability: 'out_of_stock' },
  { name: 'ایرموتور دو سوراخ', brand: 'Wj Medical', cat: 'اینسترومنت/ایرموتور', price: null, availability: 'out_of_stock' },
  { name: 'ایرموتور چهار سوراخ', brand: 'Wj Medical', cat: 'اینسترومنت/ایرموتور', price: 5900000, availability: 'in_stock' },
  { name: 'هندپیس مستقیم', brand: 'Wj Medical', cat: 'اینسترومنت/هندپیس', price: 5900000, availability: 'in_stock' },

  // ===== الایت کیور / Light Cure (page 2-3) =====
  { name: 'ILED PLUS', brand: 'Woodpecker', cat: 'ترمیمی/لایت کیور', price: 20900000, availability: 'in_stock' },
  { name: 'ILED II', brand: 'Woodpecker', cat: 'ترمیمی/لایت کیور', price: 28900000, availability: 'in_stock' },
  { name: 'O light Plus', brand: 'Woodpecker', cat: 'ترمیمی/لایت کیور', price: 18800000, availability: 'in_stock' },
  { name: 'O light II', brand: 'Woodpecker', cat: 'ترمیمی/لایت کیور', price: 34800000, availability: 'in_stock' },
  { name: 'U light', brand: 'Woodpecker', cat: 'ترمیمی/لایت کیور', price: 49800000, availability: 'in_stock' },
  { name: 'DTE LUX E Plus', brand: 'Woodpecker', cat: 'ترمیمی/لایت کیور', price: 15900000, availability: 'in_stock' },
  { name: 'Xcure', brand: 'Woodpecker', cat: 'ترمیمی/لایت کیور', price: null, availability: 'call', priceType: 'call' },
  { name: 'D.luxe Plus', brand: 'DiaDent', cat: 'ترمیمی/لایت کیور', price: 78500000, availability: 'in_stock' },
  { name: 'LED_H', brand: 'Woodpecker', cat: 'ترمیمی/لایت کیور', price: 16800000, availability: 'in_stock' },
  { name: 'LED_H ortho', brand: 'Woodpecker', cat: 'ترمیمی/لایت کیور', price: null, availability: 'out_of_stock' },
  { name: 'LED.F با سری بلیچینگ', brand: 'Woodpecker', cat: 'ترمیمی/لایت کیور', price: 28800000, availability: 'in_stock' },
  { name: 'LED.F sim', brand: 'Woodpecker', cat: 'ترمیمی/لایت کیور', price: 21800000, availability: 'in_stock' },
  { name: 'LED.D', brand: 'Woodpecker', cat: 'ترمیمی/لایت کیور', price: 10900000, availability: 'in_stock' },
  { name: 'B Cure', brand: 'Woodpecker', cat: 'ترمیمی/لایت کیور', price: 31900000, availability: 'in_stock', specs: 'الیت گاید شیشه ای' },
  { name: 'DTE B Cure Plus', brand: 'Woodpecker', cat: 'ترمیمی/لایت کیور', price: 33900000, availability: 'in_stock', specs: 'الیت گاید فلزی' },
  { name: 'O star', brand: 'Woodpecker', cat: 'ترمیمی/لایت کیور', price: 75900000, availability: 'in_stock' },
  { name: 'O star pro', brand: 'Woodpecker', cat: 'ترمیمی/لایت کیور', price: 79900000, availability: 'in_stock' },
  { name: 'LED Q داخل یونیتی', brand: 'Woodpecker', cat: 'ترمیمی/لایت کیور', price: 8800000, availability: 'in_stock' },
  { name: 'Mini S', brand: 'Woodpecker', cat: 'ترمیمی/لایت کیور', price: 7200000, availability: 'in_stock' },
  { name: 'Curing Pen با مد تشخیص پوسیدگی', brand: 'Eighteeth', cat: 'ترمیمی/لایت کیور', price: 24000000, availability: 'in_stock' },
  { name: 'Curing Pen--E', brand: 'Eighteeth', cat: 'ترمیمی/لایت کیور', price: null, availability: 'out_of_stock' },
  { name: 'NANO با مد تشخیص پوسیدگی', brand: 'COXO', cat: 'ترمیمی/لایت کیور', price: 30500000, availability: 'in_stock' },
  { name: 'SWIFT', brand: 'COXO', cat: 'ترمیمی/لایت کیور', price: 22150000, availability: 'in_stock' },

  // ===== جرمگیر / Scaler (page 3) =====
  { name: 'UDSK ساده', brand: 'Woodpecker', cat: 'ترمیمی/جرمگیر', price: 28900000, availability: 'in_stock' },
  { name: 'UDSK نوری', brand: 'Woodpecker', cat: 'ترمیمی/جرمگیر', price: 30900000, availability: 'in_stock' },
  { name: 'UDS_J2 Plus ساده', brand: 'Woodpecker', cat: 'ترمیمی/جرمگیر', price: null, availability: 'call', priceType: 'call' },
  { name: 'UDS_J2 Plus Led نوری', brand: 'Woodpecker', cat: 'ترمیمی/جرمگیر', price: null, availability: 'out_of_stock' },
  { name: 'UDS J', brand: 'Woodpecker', cat: 'ترمیمی/جرمگیر', price: null, availability: 'out_of_stock' },
  { name: 'UDS_L Water Full option نوری', brand: 'Woodpecker', cat: 'ترمیمی/جرمگیر', price: null, availability: 'out_of_stock' },
  { name: 'UDS_E LED Water نوری', brand: 'Woodpecker', cat: 'ترمیمی/جرمگیر', price: 42900000, availability: 'in_stock' },
  { name: 'U6 نوری', brand: 'Woodpecker', cat: 'ترمیمی/جرمگیر', price: 39900000, availability: 'in_stock' },
  { name: 'U600 نوری', brand: 'Woodpecker', cat: 'ترمیمی/جرمگیر', price: 80200000, availability: 'in_stock' },
  { name: 'DTE D600 نوری', brand: 'Woodpecker', cat: 'ترمیمی/جرمگیر', price: 69900000, availability: 'in_stock' },
  { name: 'DTE S6 نوری', brand: 'Woodpecker', cat: 'ترمیمی/جرمگیر', price: null, availability: 'out_of_stock' },
  { name: 'DTE D2 plus نوری', brand: 'Woodpecker', cat: 'ترمیمی/جرمگیر', price: 29900000, availability: 'in_stock' },
  { name: 'DTE D3 نوری', brand: 'Woodpecker', cat: 'ترمیمی/جرمگیر', price: null, availability: 'out_of_stock' },
  { name: 'DTE D5 نوری', brand: 'Woodpecker', cat: 'ترمیمی/جرمگیر', price: null, availability: 'out_of_stock' },
  { name: 'DTE D7 نوری', brand: 'Woodpecker', cat: 'ترمیمی/جرمگیر', price: null, availability: 'out_of_stock' },
  { name: 'Ultra Mint', brand: 'Eighteeth', cat: 'ترمیمی/جرمگیر', price: 34500000, availability: 'in_stock' },
  { name: 'Ultra Mint Pro', brand: 'Eighteeth', cat: 'ترمیمی/جرمگیر', price: null, availability: 'out_of_stock' },

  // ===== آمالگاماتور (page 3) =====
  { name: 'Dentalium-D', brand: 'عاج طب', cat: 'ترمیمی/آمالگاماتور', price: 12700000, availability: 'in_stock', specs: 'تک موتور، دور ثابت 3000rpm' },
  { name: 'Dentalium-D Plus', brand: 'عاج طب', cat: 'ترمیمی/آمالگاماتور', price: 23900000, availability: 'in_stock', specs: 'دو موتور، دور متغیر تا 5800rpm' },
  { name: 'Dentalium-D TURBO-HL', brand: 'عاج طب', cat: 'ترمیمی/آمالگاماتور', price: 15200000, availability: 'in_stock', specs: 'تک موتور، دو سرعته 5000 و 3000rpm' },
  { name: 'Dentalium-E', brand: 'عاج طب', cat: 'ترمیمی/آمالگاماتور', price: 11200000, availability: 'in_stock', specs: 'تک موتور، دور ثابت 3000rpm' },
  { name: 'Dentia-2D', brand: 'عاج طب', cat: 'ترمیمی/آمالگاماتور', price: 49500000, availability: 'in_stock', specs: 'آمالگاماتور دو کاره' },
  { name: 'Dentia-3D', brand: 'عاج طب', cat: 'ترمیمی/آمالگاماتور', price: 40400000, availability: 'in_stock', specs: 'آمالگاماتور اتوماتیک' },
  { name: 'I-Mix', brand: 'FOMOS', cat: 'ترمیمی/آمالگاماتور', price: null, availability: 'out_of_stock' },
  { name: 'آمالگاماتور', brand: 'Goldent', cat: 'ترمیمی/آمالگاماتور', price: 19900000, availability: 'in_stock', specs: 'قیمت موقت' },
  { name: 'SD دور متغیر', brand: 'SD', cat: 'ترمیمی/آمالگاماتور', price: null, availability: 'out_of_stock' },
  { name: 'M2000', brand: 'نوردیسکا', cat: 'ترمیمی/آمالگاماتور', price: null, availability: 'out_of_stock' },
  { name: 'M4000', brand: 'نوردیسکا', cat: 'ترمیمی/آمالگاماتور', price: null, availability: 'out_of_stock' },
  { name: 'UltraMix', brand: 'نوردیسکا', cat: 'ترمیمی/آمالگاماتور', price: 69900000, availability: 'in_stock' },

  // ===== بلیچینگ (page 3) - non-duplicate entries =====
  { name: 'رو یونیتی تک نور مالنی', brand: 'Malin', cat: 'ترمیمی/بلیچینگ', price: null, availability: 'out_of_stock' },

  // ===== دستگاه پک (page 3) =====
  { name: 'AVICO', brand: 'AVICO', cat: 'استریل/دستگاه پک', price: 34000000, availability: 'in_stock' },
  { name: 'ATRICO', brand: 'ATRICO', cat: 'استریل/دستگاه پک', price: 32000000, availability: 'in_stock' },
  { name: 'Max Seal', brand: 'Max Seal', cat: 'استریل/دستگاه پک', price: 31900000, availability: 'in_stock' },
  { name: 'بارلی', brand: 'بارلی', cat: 'استریل/دستگاه پک', price: 26400000, availability: 'in_stock' },
  { name: 'FoSEAL', brand: 'FOMOS', cat: 'استریل/دستگاه پک', price: 36900000, availability: 'in_stock' },

  // ===== لوپ (page 4) - non-duplicate =====
  { name: 'Eighteeth 3x', brand: 'Eighteeth', cat: 'جانبی/لوپ', price: null, availability: 'out_of_stock' },

  // ===== پوشش سربی (page 4) =====
  { name: 'روپوش سربی بزرگسال', brand: 'عاج طب', cat: 'تصویربرداری/پوشش سربی', price: 14000000, availability: 'in_stock' },
  { name: 'روپوش سربی کودکان', brand: 'عاج طب', cat: 'تصویربرداری/پوشش سربی', price: 12000000, availability: 'in_stock' },
  { name: 'پیش بند سربی بزرگسال', brand: 'عاج طب', cat: 'تصویربرداری/پوشش سربی', price: 12000000, availability: 'in_stock' },
  { name: 'پیش بند سربی کودکان', brand: 'عاج طب', cat: 'تصویربرداری/پوشش سربی', price: 10000000, availability: 'in_stock' },
  { name: 'تیروئید بند سربی بزرگسال با پوشش سینه', brand: 'عاج طب', cat: 'تصویربرداری/پوشش سربی', price: 5000000, availability: 'in_stock' },
  { name: 'تیروئید بند سربی کودکان با پوشش سینه', brand: 'عاج طب', cat: 'تصویربرداری/پوشش سربی', price: 3000000, availability: 'in_stock' },
  { name: 'تیروئید بند سربی بزرگسال', brand: 'عاج طب', cat: 'تصویربرداری/پوشش سربی', price: 3500000, availability: 'in_stock' },
  { name: 'تیروئید بند سربی کودکان', brand: 'عاج طب', cat: 'تصویربرداری/پوشش سربی', price: 2500000, availability: 'in_stock' },
  { name: 'نیم دامن سربی', brand: 'عاج طب', cat: 'تصویربرداری/پوشش سربی', price: 7000000, availability: 'in_stock' },
  { name: 'گناد بند سربی', brand: 'عاج طب', cat: 'تصویربرداری/پوشش سربی', price: 5000000, availability: 'in_stock' },
  { name: 'کاله سربی', brand: 'عاج طب', cat: 'تصویربرداری/پوشش سربی', price: 5000000, availability: 'in_stock' },
  { name: 'دستکش سربی', brand: 'عاج طب', cat: 'تصویربرداری/پوشش سربی', price: 5000000, availability: 'in_stock' },
  { name: 'پاراوان سربی', brand: 'عاج طب', cat: 'تصویربرداری/پوشش سربی', price: 23000000, availability: 'in_stock' },

  // ===== ایرفلو و سندبلاستر (page 4) =====
  { name: 'C-A1 Air Abrasion', brand: 'COXO', cat: 'ترمیمی/سندبلاستر', price: null, availability: 'out_of_stock' },
  { name: 'C-A1', brand: 'Goldent', cat: 'ترمیمی/سندبلاستر', price: 25900000, availability: 'in_stock' },
  { name: 'MicroEtcher IIA', brand: 'DANVILLE', cat: 'ترمیمی/سندبلاستر', price: null, availability: 'call', priceType: 'call' },
  { name: 'AP-P', brand: 'Woodpecker', cat: 'ترمیمی/ایرفلو', price: 48900000, availability: 'in_stock' },
  { name: 'A-PH', brand: 'Woodpecker', cat: 'ترمیمی/ایرفلو', price: null, availability: 'call', priceType: 'call' },
  { name: 'پودر ایرفلو', brand: 'Woodpecker', cat: 'ترمیمی/ایرفلو', price: 2650000, availability: 'in_stock' },

  // ===== اولتراسونیک (page 4) =====
  { name: 'اولتراسونیک 1.5 لیتری', brand: 'عاج طب', cat: 'استریل/اولتراسونیک', price: 22900000, availability: 'in_stock' },
  { name: 'اولتراسونیک 2.5 لیتری', brand: 'عاج طب', cat: 'استریل/اولتراسونیک', price: 35900000, availability: 'in_stock', specs: 'دو هسته‌ای' },
  { name: 'CD4820', brand: 'Codyson', cat: 'استریل/اولتراسونیک', price: 27900000, availability: 'in_stock' },
  { name: 'CD4830', brand: 'Codyson', cat: 'استریل/اولتراسونیک', price: 39900000, availability: 'in_stock' },
  { name: 'CD4831', brand: 'Codyson', cat: 'استریل/اولتراسونیک', price: 49900000, availability: 'in_stock' },
  { name: 'CD4860', brand: 'Codyson', cat: 'استریل/اولتراسونیک', price: 85900000, availability: 'in_stock' },

  // ===== نگاتوسکوپ (page 4-5) =====
  { name: 'MD-D', brand: 'عاج طب', cat: 'تصویربرداری/نگاتوسکوپ', price: 11200000, availability: 'in_stock', specs: 'ابعاد 21*29، روشنایی اتوماتیک' },
  { name: 'PG', brand: 'عاج طب', cat: 'تصویربرداری/نگاتوسکوپ', price: 11200000, availability: 'in_stock', specs: 'ابعاد 39*40' },
  { name: 'PG-D', brand: 'عاج طب', cat: 'تصویربرداری/نگاتوسکوپ', price: 12200000, availability: 'in_stock', specs: 'ریموت کنترل' },
  { name: 'PG-D-Dual', brand: 'عاج طب', cat: 'تصویربرداری/نگاتوسکوپ', price: 13200000, availability: 'in_stock', specs: 'نور مهتابی و آفتابی، ریموت کنترل' },

  // ===== تزریق بی حسی (page 5) =====
  { name: 'Star Pen', brand: 'Woodpecker', cat: 'جانبی/تزریق بی حسی', price: null, availability: 'call', priceType: 'call', specs: 'استعلام' },
  { name: 'Super Pen براش لس', brand: 'Woodpecker', cat: 'جانبی/تزریق بی حسی', price: 57100000, availability: 'in_stock' },
  { name: 'Geni Pro', brand: 'Goldent', cat: 'جانبی/تزریق بی حسی', price: 54900000, availability: 'in_stock' },

  // ===== تجهیزات جانبی متفرقه (page 5) - non-duplicate entries =====
  { name: 'الیت متر LM_1', brand: 'Woodpecker', cat: 'جانبی', price: null, availability: 'out_of_stock' },
  { name: 'ضد عفونی کننده اولتراسونیک', brand: 'Goldent', cat: 'استریل', price: null, availability: 'call', priceType: 'call' },
  { name: 'روتور 4 کشو سپهردنتال', brand: 'سپهر دنتال', cat: 'استریل', price: 18500000, availability: 'in_stock' },
  { name: 'کابینت یک متری', brand: 'generic', cat: 'استریل', price: 31000000, availability: 'in_stock' },
  { name: 'سینی جرمگیر', brand: 'generic', cat: 'جانبی', price: 2500000, availability: 'in_stock' },
  { name: 'ست سه تیکه سینی', brand: 'generic', cat: 'جانبی', price: 5500000, availability: 'in_stock' },
  { name: 'آنگل پرافی K-PO', brand: 'Woodpecker', cat: 'اینسترومنت/آنگل', price: 74500000, availability: 'in_stock' },

  // ===== کیت اندو (page 5) =====
  { name: 'CFR1', brand: 'Goldent', cat: 'اندو/کیت‌های اندو', price: 46900000, availability: 'in_stock', specs: 'کیت خارج سازی فایل شکسته، قیمت موقت' },
  { name: 'Dr Talal', brand: 'Woodpecker', cat: 'اندو/کیت‌های اندو', price: 13900000, availability: 'in_stock' },

  // ===== اپکس روتاری (page 5-6) =====
  { name: 'C-Smart I Pilot', brand: 'COXO', cat: 'اندو/اپکس روتاری', price: null, availability: 'out_of_stock' },
  { name: 'C-Smart mini AP', brand: 'COXO', cat: 'اندو/اپکس روتاری', price: 83400000, availability: 'in_stock' },
  { name: 'Econnect S', brand: 'Eighteeth', cat: 'اندو/اپکس روتاری', price: 95000000, availability: 'in_stock' },
  { name: 'Econnect S Plus', brand: 'Eighteeth', cat: 'اندو/اپکس روتاری', price: null, availability: 'out_of_stock' },
  { name: 'Endo A plus نوری', brand: 'Marathon', cat: 'اندو/اپکس روتاری', price: null, availability: 'out_of_stock' },
  { name: 'Endo E plus نوری', brand: 'Marathon', cat: 'اندو/اپکس روتاری', price: null, availability: 'out_of_stock' },
  { name: 'DTE Moto Pex', brand: 'Woodpecker', cat: 'اندو/اپکس روتاری', price: 89900000, availability: 'in_stock' },
  { name: 'Endo Radar Pro', brand: 'Woodpecker', cat: 'اندو/اپکس روتاری', price: 121900000, availability: 'in_stock' },
  { name: 'MT 812', brand: 'Woodpecker', cat: 'اندو/اپکس روتاری', price: 276000000, availability: 'in_stock', specs: 'قابلیت التراسونیک و UP & DOWN' },
  { name: 'Ai-Motor Black', brand: 'Woodpecker', cat: 'اندو/اپکس روتاری', price: null, availability: 'call', priceType: 'call' },
  { name: 'EndoMatic', brand: 'Woodpecker', cat: 'اندو/اپکس روتاری', price: 98200000, availability: 'in_stock' },
  { name: 'Endo Space', brand: 'Woodpecker', cat: 'اندو/اپکس روتاری', price: 99500000, availability: 'in_stock' },
  { name: 'Endo Smart Pro', brand: 'Woodpecker', cat: 'اندو/اپکس روتاری', price: 135000000, availability: 'in_stock' },

  // ===== روتاری (page 6) =====
  { name: 'Endo Pace', brand: 'Woodpecker', cat: 'اندو/روتاری', price: 65900000, availability: 'in_stock' },
  { name: 'DTE Endo FREE', brand: 'Woodpecker', cat: 'اندو/روتاری', price: null, availability: 'call', priceType: 'call' },
  { name: 'Endo Gold', brand: 'Woodpecker', cat: 'اندو/روتاری', price: null, availability: 'out_of_stock' },
  { name: 'Endoit', brand: 'Micro NX', cat: 'اندو/روتاری', price: 67900000, availability: 'in_stock' },
  { name: 'Endo A class نوری', brand: 'Marathon', cat: 'اندو/روتاری', price: 90000000, availability: 'in_stock' },
  { name: 'Endo E class', brand: 'Marathon', cat: 'اندو/روتاری', price: null, availability: 'call', priceType: 'call' },
  { name: 'E-connect_Pro', brand: 'Eighteeth', cat: 'اندو/روتاری', price: null, availability: 'out_of_stock' },
  { name: 'E-connect_SE', brand: 'Eighteeth', cat: 'اندو/روتاری', price: 44000000, availability: 'in_stock' },
  { name: 'E Value', brand: 'Eighteeth', cat: 'اندو/روتاری', price: null, availability: 'out_of_stock' },
  { name: 'E-xtreme', brand: 'Eighteeth', cat: 'اندو/روتاری', price: null, availability: 'out_of_stock' },
  { name: 'Endo Smart Gold', brand: 'Woodpecker', cat: 'اندو/روتاری', price: null, availability: 'out_of_stock' },
  { name: 'Endo Smart', brand: 'Woodpecker', cat: 'اندو/روتاری', price: 69500000, availability: 'in_stock' },
  { name: 'Endo smart plus', brand: 'Woodpecker', cat: 'اندو/روتاری', price: 89500000, availability: 'in_stock' },

  // ===== اپکس فایندر (page 6) =====
  { name: 'DTE DPEX V', brand: 'Woodpecker', cat: 'اندو/اپکس فایندر', price: null, availability: 'out_of_stock' },
  { name: 'Woodpex V', brand: 'Woodpecker', cat: 'اندو/اپکس فایندر', price: 30900000, availability: 'in_stock' },
  { name: 'Mini Pex', brand: 'Woodpecker', cat: 'اندو/اپکس فایندر', price: null, availability: 'out_of_stock' },
  { name: 'Ai-Pex', brand: 'Woodpecker', cat: 'اندو/اپکس فایندر', price: 76800000, availability: 'in_stock', specs: 'دو حالت: اپکس لوکیتور - پالپ تستر' },
  { name: 'E Pex Pro', brand: 'Eighteeth', cat: 'اندو/اپکس فایندر', price: null, availability: 'out_of_stock' },
  { name: 'AirPex', brand: 'Eighteeth', cat: 'اندو/اپکس فایندر', price: null, availability: 'out_of_stock' },
  { name: 'Find Pex', brand: 'Eighteeth', cat: 'اندو/اپکس فایندر', price: null, availability: 'out_of_stock' },
  { name: 'Woodpex X', brand: 'Woodpecker', cat: 'اندو/اپکس فایندر', price: null, availability: 'out_of_stock' },
  { name: 'Woodpex X MHN', brand: 'Woodpecker', cat: 'اندو/اپکس فایندر', price: null, availability: 'out_of_stock' },
  { name: 'DPEX X', brand: 'DTE', cat: 'اندو/اپکس فایندر', price: null, availability: 'out_of_stock' },
  { name: 'DPEX X MHN', brand: 'DTE', cat: 'اندو/اپکس فایندر', price: null, availability: 'out_of_stock' },
  { name: 'Dempex', brand: 'Dempex', cat: 'اندو/اپکس فایندر', price: null, availability: 'out_of_stock' },
  { name: 'EQ-PEX', brand: 'META', cat: 'اندو/اپکس فایندر', price: null, availability: 'out_of_stock' },

  // ===== ایریگیشن (page 6) =====
  { name: 'Ultra Smart', brand: 'COXO', cat: 'اندو/ایریگیشن', price: null, availability: 'out_of_stock' },
  { name: 'Ultra Smart Ai', brand: 'COXO', cat: 'اندو/ایریگیشن', price: null, availability: 'out_of_stock' },
  { name: 'Endo 1', brand: 'Woodpecker', cat: 'اندو/ایریگیشن', price: null, availability: 'out_of_stock' },
  { name: 'Endo 3', brand: 'Woodpecker', cat: 'اندو/ایریگیشن', price: null, availability: 'out_of_stock' },
  { name: 'Ultra X', brand: 'Eighteeth', cat: 'اندو/ایریگیشن', price: null, availability: 'out_of_stock' },
  { name: 'SurfyOne', brand: 'Eighteeth', cat: 'اندو/ایریگیشن', price: 30000000, availability: 'in_stock' },
  { name: 'Endo Ultra Activator', brand: 'generic', cat: 'اندو/ایریگیشن', price: null, availability: 'call', priceType: 'call' },

  // ===== آبچوریشن (page 7) =====
  { name: 'C-Fill Fill + Pack', brand: 'COXO', cat: 'اندو/آبچوریشن', price: 111200000, availability: 'in_stock' },
  { name: 'Duo-GUN + Duo-PEN', brand: 'DiaDent', cat: 'اندو/آبچوریشن', price: 139000000, availability: 'in_stock' },
  { name: 'Duo-GUN Fill', brand: 'DiaDent', cat: 'اندو/آبچوریشن', price: 83500000, availability: 'in_stock' },
  { name: 'Duo-PEN Pack', brand: 'DiaDent', cat: 'اندو/آبچوریشن', price: 57500000, availability: 'in_stock' },
  { name: 'Fi-E Fill', brand: 'Woodpecker', cat: 'اندو/آبچوریشن', price: 84900000, availability: 'in_stock' },
  { name: 'Fi-G Fill', brand: 'Woodpecker', cat: 'اندو/آبچوریشن', price: 86800000, availability: 'in_stock' },
  { name: 'Fi-P Pack', brand: 'Woodpecker', cat: 'اندو/آبچوریشن', price: 59900000, availability: 'in_stock' },
  { name: 'Fi-E Fill DTE', brand: 'DTE', cat: 'اندو/آبچوریشن', price: 84900000, availability: 'in_stock' },
  { name: 'Fi-P Pack DTE', brand: 'DTE', cat: 'اندو/آبچوریشن', price: 59900000, availability: 'in_stock' },
  { name: 'Fast Fill', brand: 'Eighteeth', cat: 'اندو/آبچوریشن', price: 75000000, availability: 'in_stock' },
  { name: 'Fast Pack', brand: 'Eighteeth', cat: 'اندو/آبچوریشن', price: 55000000, availability: 'in_stock' },
  { name: 'Space Fill', brand: 'Eighteeth', cat: 'اندو/آبچوریشن', price: 82500000, availability: 'in_stock' },
  { name: 'Space Pack', brand: 'Eighteeth', cat: 'اندو/آبچوریشن', price: 58500000, availability: 'in_stock' },

  // ===== گوتاکاتر (page 7) =====
  { name: 'C Fill Mini Pack Type', brand: 'COXO', cat: 'اندو/آبچوریشن', price: null, availability: 'out_of_stock' },
  { name: 'گوتاکاتر باسیم', brand: 'عاج طب', cat: 'اندو/آبچوریشن', price: 10500000, availability: 'in_stock' },
  { name: 'گوتاکاتر بی سیم تک هندپیس', brand: 'عاج طب', cat: 'اندو/آبچوریشن', price: 8500000, availability: 'in_stock' },
  { name: 'گوتاکاتر بی سیم دو هندپیس', brand: 'عاج طب', cat: 'اندو/آبچوریشن', price: 9500000, availability: 'in_stock' },

  // ===== ایمپلنت و جراحی (page 7-8) =====
  { name: 'C-Puma Master', brand: 'COXO', cat: 'ایمپلنت/موتور الکتریکی', price: null, availability: 'out_of_stock' },
  { name: 'Motor Turbo', brand: 'Eighteeth', cat: 'ایمپلنت/موتور الکتریکی', price: 127000000, availability: 'in_stock', specs: 'با آنگل دورقرمز فایبراپتیک' },
  { name: 'Implanter چینی', brand: 'Woodpecker', cat: 'ایمپلنت/موتور ایمپلنت', price: 255000000, availability: 'in_stock' },
  { name: 'Implanter سوئیسی', brand: 'Woodpecker', cat: 'ایمپلنت/موتور ایمپلنت', price: 330000000, availability: 'in_stock' },
  { name: 'Implant air', brand: 'Woodpecker', cat: 'ایمپلنت/موتور ایمپلنت', price: 245900000, availability: 'in_stock' },
  { name: 'DTE Implant air', brand: 'Woodpecker', cat: 'ایمپلنت/موتور ایمپلنت', price: 285900000, availability: 'in_stock' },
  { name: 'DRIVE X', brand: 'Woodpecker', cat: 'ایمپلنت/موتور ایمپلنت', price: 235000000, availability: 'in_stock' },
  { name: 'KI-20 نوری', brand: 'Marathon', cat: 'ایمپلنت/موتور ایمپلنت', price: 270000000, availability: 'in_stock' },
  { name: 'KI-20 نوری لمسی', brand: 'Marathon', cat: 'ایمپلنت/موتور ایمپلنت', price: 295000000, availability: 'in_stock' },
  { name: 'AEU 1000', brand: 'Aseptico', cat: 'ایمپلنت/موتور ایمپلنت', price: 230000000, availability: 'in_stock' },
  { name: 'SurgicHero', brand: 'Tech Win', cat: 'ایمپلنت/موتور ایمپلنت', price: 231000000, availability: 'in_stock', specs: 'ساخت ایران، 18 ماه گارانتی' },
  { name: 'تورک درایور', brand: 'Micro NX', cat: 'ایمپلنت/میکروموتور', price: 181900000, availability: 'in_stock' },

  // ===== میکروموتور البراتواری (page 8) =====
  { name: 'Mighty لابراتواری', brand: 'Marathon', cat: 'ایمپلنت/میکروموتور', price: null, availability: 'out_of_stock' },
  { name: 'Champion لابراتواری', brand: 'Marathon', cat: 'ایمپلنت/میکروموتور', price: 24000000, availability: 'in_stock' },
  { name: 'Scort 2 لابراتواری', brand: 'Marathon', cat: 'ایمپلنت/میکروموتور', price: null, availability: 'out_of_stock' },
  { name: '201N لابراتواری', brand: 'Micro NX', cat: 'ایمپلنت/میکروموتور', price: 20900000, availability: 'in_stock' },
  { name: '300B لابراتواری', brand: 'Micro NX', cat: 'ایمپلنت/میکروموتور', price: 21900000, availability: 'in_stock' },
  { name: '300S لابراتواری', brand: 'Micro NX', cat: 'ایمپلنت/میکروموتور', price: null, availability: 'out_of_stock' },
  { name: 'JD200', brand: 'JD200', cat: 'ایمپلنت/میکروموتور', price: 9100000, availability: 'in_stock' },

  // ===== میکروموتور جراحی (page 8) =====
  { name: 'Mighty جراحی', brand: 'Marathon', cat: 'ایمپلنت/میکروموتور', price: null, availability: 'out_of_stock' },
  { name: 'Champion جراحی', brand: 'Marathon', cat: 'ایمپلنت/میکروموتور', price: 24000000, availability: 'in_stock' },
  { name: 'K35 Digital جراحی', brand: 'Marathon', cat: 'ایمپلنت/میکروموتور', price: null, availability: 'out_of_stock' },
  { name: 'Scort 2 جراحی', brand: 'Marathon', cat: 'ایمپلنت/میکروموتور', price: null, availability: 'out_of_stock' },
  { name: 'M1 شارژی جراحی', brand: 'Micro NX', cat: 'ایمپلنت/میکروموتور', price: 36200000, availability: 'in_stock' },
  { name: '201N جراحی', brand: 'Micro NX', cat: 'ایمپلنت/میکروموتور', price: 25500000, availability: 'in_stock' },
  { name: '300B جراحی', brand: 'Micro NX', cat: 'ایمپلنت/میکروموتور', price: 27500000, availability: 'in_stock' },
  { name: '300S جراحی', brand: 'Micro NX', cat: 'ایمپلنت/میکروموتور', price: null, availability: 'out_of_stock' },

  // ===== الکتروسرجری و پیزو (page 8) =====
  { name: 'AR-70', brand: 'آریان', cat: 'ایمپلنت/الکتروسرجری', price: 38500000, availability: 'in_stock' },
  { name: 'SAMAN الکتروسرجری', brand: 'SAMAN', cat: 'ایمپلنت/الکتروسرجری', price: 46000000, availability: 'in_stock' },
  { name: 'US-ll Led', brand: 'Woodpecker', cat: 'ایمپلنت/پیزوسرجری', price: null, availability: 'out_of_stock' },
  { name: 'Surgic Touch', brand: 'Woodpecker', cat: 'ایمپلنت/پیزوسرجری', price: 569900000, availability: 'in_stock', specs: 'دو هندپیس، 14 عدد تیپ' },
  { name: 'US-ll Eco Led', brand: 'Woodpecker', cat: 'ایمپلنت/پیزوسرجری', price: 398000000, availability: 'in_stock', specs: 'تک هندپیس، 6 عدد تیپ' },
  { name: 'DS-ll Led', brand: 'DTE', cat: 'ایمپلنت/پیزوسرجری', price: 548700000, availability: 'in_stock', specs: 'دو هندپیس' },

  // ===== ساکشن (page 9) =====
  { name: 'ساکشن موتور ایرانی STS', brand: 'STS', cat: 'کمپرسور/ساکشن/برقی', price: 43500000, availability: 'in_stock' },
  { name: 'ساکشن موتور خارجی STS', brand: 'STS', cat: 'کمپرسور/ساکشن/برقی', price: 48500000, availability: 'in_stock' },
  { name: 'ساکشن موتور خارجی New Face STS', brand: 'STS', cat: 'کمپرسور/ساکشن/برقی', price: 43500000, availability: 'in_stock' },
  { name: 'ساکشن Mini STS', brand: 'STS', cat: 'کمپرسور/ساکشن/برقی', price: 42500000, availability: 'in_stock' },
  { name: 'ساکشن 4U', brand: '4U', cat: 'کمپرسور/ساکشن/برقی', price: null, availability: 'out_of_stock' },
  { name: 'ساکشن SAMAN', brand: 'SAMAN', cat: 'کمپرسور/ساکشن/برقی', price: 44000000, availability: 'in_stock' },
  { name: 'ساکشن Senator', brand: 'Senator', cat: 'کمپرسور/ساکشن/برقی', price: 45000000, availability: 'in_stock' },
  { name: 'ساکشن پرتابل پایه کوتاه YUWELL', brand: 'YUWELL', cat: 'کمپرسور/ساکشن/پرتابل', price: 56000000, availability: 'in_stock', specs: 'با لیبل زنیت مد' },
  { name: 'ساکشن پرتابل پایه کوتاه جدید YUWELL', brand: 'YUWELL', cat: 'کمپرسور/ساکشن/پرتابل', price: null, availability: 'out_of_stock' },
  { name: 'ساکشن پرتابل پایه بلند YUWELL', brand: 'YUWELL', cat: 'کمپرسور/ساکشن/پرتابل', price: 62000000, availability: 'in_stock', specs: 'با لیبل زنیت مد' },
  { name: 'ساکشن مرکزی 1 الی 2 یونیته', brand: 'Corpus Vac', cat: 'کمپرسور/ساکشن/مرکزی', price: null, availability: 'out_of_stock' },

  // ===== سنسور RVG (page 9) =====
  { name: 'I-Sensor سایز 1', brand: 'Woodpecker', cat: 'تصویربرداری/RVG', price: 130900000, availability: 'in_stock' },
  { name: 'i-Sensor سایز 1.5', brand: 'Woodpecker', cat: 'تصویربرداری/RVG', price: 135900000, availability: 'in_stock' },
  { name: 'I-Sensor سایز 2', brand: 'Woodpecker', cat: 'تصویربرداری/RVG', price: null, availability: 'out_of_stock' },
  { name: 'One T1', brand: 'Owandy', cat: 'تصویربرداری/RVG', price: null, availability: 'call', priceType: 'call' },
  { name: 'Opteo T1', brand: 'Owandy', cat: 'تصویربرداری/RVG', price: null, availability: 'out_of_stock' },
  { name: 'Opteo T2', brand: 'Owandy', cat: 'تصویربرداری/RVG', price: null, availability: 'call', priceType: 'call' },
  { name: 'NANOPIX 1', brand: 'Eighteeth', cat: 'تصویربرداری/RVG', price: 120000000, availability: 'in_stock' },
  { name: 'NANOPIX 1.3', brand: 'Eighteeth', cat: 'تصویربرداری/RVG', price: null, availability: 'out_of_stock' },
  { name: 'NANOPIX 1.5', brand: 'Eighteeth', cat: 'تصویربرداری/RVG', price: 129000000, availability: 'in_stock' },
  { name: 'NANOPIX 2', brand: 'Eighteeth', cat: 'تصویربرداری/RVG', price: null, availability: 'out_of_stock' },
  { name: 'REMEDI سایز 1', brand: 'REMEDI', cat: 'تصویربرداری/RVG', price: null, availability: 'out_of_stock' },
  { name: 'REMEDI سایز 2', brand: 'REMEDI', cat: 'تصویربرداری/RVG', price: null, availability: 'call', priceType: 'call' },

  // ===== فسفر پلیت PSP (page 9) =====
  { name: 'Scan X EDGE', brand: 'Air Techniques', cat: 'تصویربرداری/PSP', price: 430000000, availability: 'in_stock' },
  { name: 'CR2', brand: 'Owandy', cat: 'تصویربرداری/PSP', price: 787000000, availability: 'in_stock' },
  { name: 'FreeScan', brand: 'Woodpecker', cat: 'تصویربرداری/PSP', price: 429000000, availability: 'in_stock' },
  { name: 'I Scan نمایشگر', brand: 'Woodpecker', cat: 'تصویربرداری/PSP', price: null, availability: 'out_of_stock' },

  // ===== اسکنر داخل دهانی (page 10) =====
  { name: 'Smile 2', brand: 'Kevin Peter', cat: 'دیجیتال/اسکنر داخل دهانی', price: 949000000, availability: 'in_stock' },
  { name: 'IOS', brand: 'Owandy', cat: 'دیجیتال/اسکنر داخل دهانی', price: 1350000000, availability: 'in_stock' },
  { name: 'IOS Wireless', brand: 'Owandy', cat: 'دیجیتال/اسکنر داخل دهانی', price: null, availability: 'call', priceType: 'call' },

  // ===== تاریکخانه (page 10) =====
  { name: 'تاریکخانه', brand: 'generic', cat: 'تصویربرداری/تاریکخانه', price: null, availability: 'call', priceType: 'call' },
  { name: 'd-box', brand: 'عاج طب', cat: 'تصویربرداری/تاریکخانه', price: 10200000, availability: 'in_stock' },
  { name: 'دِ نتکس Dentex', brand: 'Dentex', cat: 'تصویربرداری/تاریکخانه', price: null, availability: 'call', priceType: 'call' },

  // ===== رادیوگرافی پایه دار و دیواری (page 10) =====
  { name: 'فریکس دو شکن پایه دار', brand: 'Faraz', cat: 'تصویربرداری/رادیوگرافی/پایه دار', price: 215000000, availability: 'in_stock' },
  { name: 'فریکس سه شکن پایه دار', brand: 'Faraz', cat: 'تصویربرداری/رادیوگرافی/پایه دار', price: 209900000, availability: 'in_stock' },
  { name: 'Best-X-DC پایه دار', brand: 'NewLife', cat: 'تصویربرداری/رادیوگرافی/DC', price: null, availability: 'out_of_stock' },
  { name: 'Best-X-DC دیواری', brand: 'NewLife', cat: 'تصویربرداری/رادیوگرافی/DC', price: null, availability: 'call', priceType: 'call' },
  { name: 'FIAD', brand: 'FIAD', cat: 'تصویربرداری/رادیوگرافی/پایه دار', price: null, availability: 'out_of_stock' },
  { name: 'RX DC', brand: 'Owandy', cat: 'تصویربرداری/رادیوگرافی/DC', price: 498000000, availability: 'in_stock' },
  { name: 'RX DC Mobile', brand: 'Owandy', cat: 'تصویربرداری/رادیوگرافی/پایه دار', price: 538000000, availability: 'in_stock' },
  { name: 'الگانت دیواری سه شکن', brand: 'Faraz', cat: 'تصویربرداری/رادیوگرافی/دیواری', price: 215000000, availability: 'in_stock', specs: 'استعلام' },
  { name: 'الگانت پایه دار سه شکن', brand: 'Faraz', cat: 'تصویربرداری/رادیوگرافی/پایه دار', price: 220000000, availability: 'in_stock', specs: 'استعلام' },

  // ===== رادیوگرافی پرتابل (page 10) =====
  { name: 'Mini Ray', brand: 'Woodpecker', cat: 'تصویربرداری/رادیوگرافی/پرتابل', price: 185900000, availability: 'in_stock' },
  { name: 'DTE Mini Ray', brand: 'Woodpecker', cat: 'تصویربرداری/رادیوگرافی/پرتابل', price: null, availability: 'out_of_stock' },
  { name: 'Smart Ray', brand: 'Woodpecker', cat: 'تصویربرداری/رادیوگرافی/پرتابل', price: 219000000, availability: 'in_stock' },
  { name: 'Hyper Light', brand: 'Eighteeth', cat: 'تصویربرداری/رادیوگرافی/پرتابل', price: 185000000, availability: 'in_stock' },
  { name: 'PROX', brand: 'PROX', cat: 'تصویربرداری/رادیوگرافی/پرتابل', price: 530000000, availability: 'in_stock', specs: 'کره جنوبی' },
  { name: 'RX Portable', brand: 'Owandy', cat: 'تصویربرداری/رادیوگرافی/پرتابل', price: null, availability: 'call', priceType: 'call', specs: 'دستی با شیشه محافظ' },

  // ===== اتوکلاو (page 10-11) =====
  { name: 'E8', brand: 'Euronda', cat: 'استریل/اتوکلاو', price: 622000000, availability: 'in_stock', specs: '24 لیتری' },
  { name: 'E9 MED', brand: 'Euronda', cat: 'استریل/اتوکلاو', price: null, availability: 'out_of_stock', specs: '24 لیتری' },
  { name: 'B Evo New 18L', brand: 'تکنوگاز', cat: 'استریل/اتوکلاو', price: null, availability: 'out_of_stock' },
  { name: 'B Evo New 24L', brand: 'تکنوگاز', cat: 'استریل/اتوکلاو', price: null, availability: 'out_of_stock' },
  { name: '17 لیتری', brand: 'Castellini', cat: 'استریل/اتوکلاو', price: null, availability: 'out_of_stock' },
  { name: '22 لیتری', brand: 'Castellini', cat: 'استریل/اتوکلاو', price: null, availability: 'out_of_stock' },
  { name: 'وسون 18L', brand: 'وسون', cat: 'استریل/اتوکلاو', price: 340000000, availability: 'in_stock' },
  { name: 'وسون 23L', brand: 'وسون', cat: 'استریل/اتوکلاو', price: 360000000, availability: 'in_stock' },
  { name: 'وسون 23L plus درب مشکی', brand: 'وسون', cat: 'استریل/اتوکلاو', price: 365000000, availability: 'in_stock' },
  { name: 'بارن 22L', brand: 'ATRICO', cat: 'استریل/اتوکلاو', price: 420000000, availability: 'in_stock' },
  { name: 'آویسا 18L', brand: 'AVICO', cat: 'استریل/اتوکلاو', price: 410000000, availability: 'in_stock' },
  { name: 'آویسا 23L', brand: 'AVICO', cat: 'استریل/اتوکلاو', price: 420000000, availability: 'in_stock' },
  { name: 'بوستر 18L با پرینتر', brand: 'AVICO', cat: 'استریل/اتوکلاو', price: 430000000, availability: 'in_stock' },
  { name: 'بوستر 23L با پرینتر', brand: 'AVICO', cat: 'استریل/اتوکلاو', price: 440000000, availability: 'in_stock' },
  { name: 'ماتیسا 18L با پرینتر', brand: 'AVICO', cat: 'استریل/اتوکلاو', price: 440000000, availability: 'in_stock' },
  { name: 'ماتیسا 22L با پرینتر', brand: 'AVICO', cat: 'استریل/اتوکلاو', price: 450000000, availability: 'in_stock' },
  { name: 'کوبیک 15L', brand: 'AVICO', cat: 'استریل/اتوکلاو', price: 500000000, availability: 'in_stock' },
  { name: 'کوبیک 18L', brand: 'AVICO', cat: 'استریل/اتوکلاو', price: 510000000, availability: 'in_stock' },
  { name: 'کوبیک 22L', brand: 'AVICO', cat: 'استریل/اتوکلاو', price: 520000000, availability: 'in_stock' },
  { name: 'کوبیک 25L', brand: 'AVICO', cat: 'استریل/اتوکلاو', price: 530000000, availability: 'in_stock' },
  { name: 'PICO Cubic 18L', brand: 'پارس', cat: 'استریل/اتوکلاو', price: 335000000, availability: 'in_stock' },
  { name: 'PICO Cubic 18L پرینتردار', brand: 'پارس', cat: 'استریل/اتوکلاو', price: 350000000, availability: 'in_stock' },
  { name: 'PICO Cubic 23L', brand: 'پارس', cat: 'استریل/اتوکلاو', price: 340000000, availability: 'in_stock' },
  { name: 'PICO Cubic 23L پرینتردار', brand: 'پارس', cat: 'استریل/اتوکلاو', price: 355000000, availability: 'in_stock' },
  { name: 'PICO Cubic 30L', brand: 'پارس', cat: 'استریل/اتوکلاو', price: 350000000, availability: 'in_stock' },
  { name: 'PICO Cubic 30L پرینتردار', brand: 'پارس', cat: 'استریل/اتوکلاو', price: 365000000, availability: 'in_stock' },
  { name: 'PICO Cylinder 18L', brand: 'پارس', cat: 'استریل/اتوکلاو', price: 255000000, availability: 'in_stock' },
  { name: 'PICO Cylinder 18L پرینتردار', brand: 'پارس', cat: 'استریل/اتوکلاو', price: 270000000, availability: 'in_stock' },
  { name: 'PICO Cylinder 23L', brand: 'پارس', cat: 'استریل/اتوکلاو', price: 260000000, availability: 'in_stock' },
  { name: 'PICO Cylinder 23L پرینتردار', brand: 'پارس', cat: 'استریل/اتوکلاو', price: 275000000, availability: 'in_stock' },
  { name: 'PICO Cylinder 30L', brand: 'پارس', cat: 'استریل/اتوکلاو', price: 280000000, availability: 'in_stock' },
  { name: 'PICO Cylinder 30L پرینتردار', brand: 'پارس', cat: 'استریل/اتوکلاو', price: 295000000, availability: 'in_stock' },

  // ===== یونیت (page 11-12) =====
  { name: 'S500', brand: 'SUN', cat: 'یونیت', price: 449900000, availability: 'in_stock' },
  { name: 'شلنگ از پایین LED', brand: 'ZEMER', cat: 'یونیت', price: 720000000, availability: 'in_stock' },
  { name: 'شلنگ از بالا LED', brand: 'ZEMER', cat: 'یونیت', price: 820000000, availability: 'in_stock' },
  { name: 'شلنگ از پایین LED 505', brand: 'Karen', cat: 'یونیت', price: 499900000, availability: 'in_stock' },
  { name: 'شلنگ از بالا LED 505', brand: 'Karen', cat: 'یونیت', price: 435000000, availability: 'in_stock' },
  { name: 'شلنگ از پایین باکس بغل LED 509', brand: 'Karen', cat: 'یونیت', price: 480000000, availability: 'in_stock' },
  { name: 'شلنگ از بالا باکس بغل LED 509', brand: 'Karen', cat: 'یونیت', price: 449900000, availability: 'in_stock' },
  { name: 'شلنگ از پایین باکس بغل LED 609', brand: 'Karen', cat: 'یونیت', price: 415000000, availability: 'in_stock' },
  { name: 'شلنگ از بالا باکس بغل LED 609', brand: 'Karen', cat: 'یونیت', price: 429000000, availability: 'in_stock' },
  { name: 'شلنگ از بالا باکس بغل LED 709 با جرمگیر', brand: 'Karen', cat: 'یونیت', price: null, availability: 'out_of_stock' },
  { name: 'شلنگ از بالا باکس بغل LED 709 با جرمگیر و ساکشن برقی', brand: 'Karen', cat: 'یونیت', price: null, availability: 'out_of_stock' },
  { name: 'فرینو صدف SU', brand: 'پارس طب', cat: 'یونیت', price: null, availability: 'in_stock' },
  { name: 'فرینو صدف SD', brand: 'پارس طب', cat: 'یونیت', price: null, availability: 'in_stock' },
  { name: 'فیدار پالس شلنگ از بالا L24', brand: 'پارس طب', cat: 'یونیت', price: null, availability: 'in_stock' },
  { name: 'فیدار پالس شلنگ از پایین L24', brand: 'پارس طب', cat: 'یونیت', price: null, availability: 'in_stock' },
  { name: 'فیدار شلنگ از بالا H24', brand: 'پارس طب', cat: 'یونیت', price: null, availability: 'in_stock' },
  { name: 'فیدار شلنگ از پایین H24', brand: 'پارس طب', cat: 'یونیت', price: null, availability: 'in_stock' },
  { name: 'K24', brand: 'پارس دنتال', cat: 'یونیت', price: 434500000, availability: 'in_stock' },
  { name: 'R/RB', brand: 'پارس دنتال', cat: 'یونیت', price: 412500000, availability: 'in_stock' },
  { name: '8000S', brand: 'پارس دنتال', cat: 'یونیت', price: 451000000, availability: 'in_stock' },
  { name: 'صدرا', brand: 'پارس دنتال', cat: 'یونیت', price: 467500000, availability: 'in_stock' },
  { name: 'سامان', brand: 'پارس دنتال', cat: 'یونیت', price: 489500000, availability: 'in_stock' },
  { name: 'سپهر', brand: 'پارس دنتال', cat: 'یونیت', price: 533500000, availability: 'in_stock' },
  { name: 'سورنا', brand: 'پارس دنتال', cat: 'یونیت', price: 533500000, availability: 'in_stock' },
  { name: 'سهیل', brand: 'پارس دنتال', cat: 'یونیت', price: 643500000, availability: 'in_stock' },
  { name: 'تبصره 5', brand: 'پارس دنتال', cat: 'یونیت', price: 253000000, availability: 'in_stock' },
  { name: '3006C شلنگ از پایین', brand: 'DENTUS', cat: 'یونیت', price: 1100000000, availability: 'in_stock' },
  { name: '3006CF شلنگ از پایین Full Option', brand: 'DENTUS', cat: 'یونیت', price: 1150000000, availability: 'in_stock' },
  { name: '3006R شلنگ از بالا', brand: 'DENTUS', cat: 'یونیت', price: 1150000000, availability: 'in_stock' },
  { name: '3006RF شلنگ از بالا Full Option', brand: 'DENTUS', cat: 'یونیت', price: 1200000000, availability: 'in_stock' },
  { name: '3006CHC اطفال', brand: 'DENTUS', cat: 'یونیت', price: 1102000000, availability: 'in_stock' },
  { name: '3006CHR اطفال', brand: 'DENTUS', cat: 'یونیت', price: 1152000000, availability: 'in_stock' },
  { name: '3006ORTHO اورتودنسی', brand: 'DENTUS', cat: 'یونیت', price: 871200000, availability: 'in_stock' },
  { name: '3006T5', brand: 'DENTUS', cat: 'یونیت', price: 750000000, availability: 'in_stock' },
  { name: 'MS 600 E با کمپرسور', brand: 'DENTUS', cat: 'یونیت', price: 148000000, availability: 'in_stock' },
  { name: 'MS 300 C', brand: 'DENTUS', cat: 'یونیت', price: 99000000, availability: 'in_stock' },

  // ===== متفرقه (page 12) =====
  { name: 'میکرو یونیت 2 شلنگ', brand: 'generic', cat: 'یونیت', price: 19500000, availability: 'in_stock' },
  { name: 'میکرو یونیت 3 شلنگ', brand: 'generic', cat: 'یونیت', price: 26500000, availability: 'in_stock' },
  { name: 'مینی یونیت چمدانی', brand: 'generic', cat: 'یونیت', price: 100000000, availability: 'in_stock' },
  { name: 'تابوره طرح زیمنس', brand: 'generic', cat: 'یونیت', price: 10500000, availability: 'in_stock' },
];

// ============================================================
// MAIN SEED FUNCTION
// ============================================================

async function main() {
  console.log('=== MersaDent Seed Script ===');
  console.log('Clearing existing data...');

  // Delete in correct order to respect foreign keys
  await db.productImage.deleteMany({});
  await db.product.deleteMany({});
  await db.category.deleteMany({});
  await db.brand.deleteMany({});

  console.log('Existing data cleared.');

  // ---- CREATE CATEGORIES ----
  console.log('Creating categories...');

  // Flatten category tree and create them in order, resolving parentIds
  const slugToId: Record<string, number> = {};

  // First pass: create top-level categories
  for (const cat of categoryTree) {
    const created = await db.category.create({
      data: {
        name: cat.name,
        slug: cat.slug,
        order: cat.order,
      },
    });
    slugToId[cat.slug] = created.id;
  }

  // Second pass: create children (depth 2)
  for (const cat of categoryTree) {
    if (!cat.children) continue;
    const parentId = slugToId[cat.slug];
    for (const child of cat.children) {
      const created = await db.category.create({
        data: {
          name: child.name,
          slug: child.slug,
          order: child.order,
          parentId,
        },
      });
      slugToId[child.slug] = created.id;

      // Third pass: create grandchildren (depth 3)
      if (child.children) {
        for (const grandchild of child.children) {
          const gc = await db.category.create({
            data: {
              name: grandchild.name,
              slug: grandchild.slug,
              order: grandchild.order,
              parentId: created.id,
            },
          });
          slugToId[grandchild.slug] = gc.id;
        }
      }
    }
  }

  const categoryCount = Object.keys(slugToId).length;
  console.log(`Created ${categoryCount} categories.`);

  // ---- CREATE BRANDS ----
  console.log('Creating brands...');

  const brandSlugToId: Record<string, number> = {};

  for (const brandName of brandNames) {
    const brandSlug = slugify(brandName);
    try {
      const created = await db.brand.create({
        data: {
          name: brandName,
          slug: brandSlug,
          visible: true,
        },
      });
      brandSlugToId[brandSlug] = created.id;
    } catch (e: any) {
      // If duplicate (shouldn't happen after clearing), skip
      if (e?.code === 'P2002') {
        const existing = await db.brand.findUnique({ where: { slug: brandSlug } });
        if (existing) brandSlugToId[brandSlug] = existing.id;
      } else {
        throw e;
      }
    }
  }

  console.log(`Created ${Object.keys(brandSlugToId).length} brands.`);

  // ---- CREATE PRODUCTS ----
  console.log('Creating products...');

  // Track seen products to skip duplicates
  const seenProducts = new Set<string>();
  let createdCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  // Group products into batches for transaction
  const BATCH_SIZE = 100;

  for (let i = 0; i < rawProducts.length; i += BATCH_SIZE) {
    const batch = rawProducts.slice(i, i + BATCH_SIZE);

    await db.$transaction(async (tx) => {
      for (const raw of batch) {
        // Skip exact duplicates (same name + brand)
        const dedupeKey = `${raw.name}|||${raw.brand}`;
        if (seenProducts.has(dedupeKey)) {
          skippedCount++;
          continue;
        }
        seenProducts.add(dedupeKey);

        // Resolve category slug
        const catSlug = categorySlugMap[raw.cat];
        if (!catSlug) {
          console.warn(`WARNING: No category mapping for "${raw.cat}" (product: ${raw.name})`);
          errorCount++;
          continue;
        }

        const categoryId = slugToId[catSlug];
        if (!categoryId) {
          console.warn(`WARNING: Category "${catSlug}" not found (product: ${raw.name})`);
          errorCount++;
          continue;
        }

        // Resolve brand
        const brandSlug = slugify(raw.brand);
        const brandId = brandSlugToId[brandSlug];
        if (!brandId) {
          console.warn(`WARNING: Brand "${raw.brand}" (slug: ${brandSlug}) not found (product: ${raw.name})`);
          errorCount++;
          continue;
        }

        // Generate slug for product
        const baseSlug = slugify(raw.name);
        const productSlug = `${baseSlug}-${raw.brand.toLowerCase().replace(/\s+/g, '-')}`;

        try {
          await tx.product.create({
            data: {
              name: raw.name,
              slug: productSlug,
              price: raw.availability === 'in_stock' ? raw.price : null,
              priceType: raw.priceType || 'fixed',
              availability: raw.availability,
              specs: raw.specs || null,
              categoryId,
              brandId,
              order: createdCount,
            },
          });
          createdCount++;
        } catch (e: any) {
          if (e?.code === 'P2002') {
            // Unique constraint violation on slug - make it unique
            const uniqueSlug = `${productSlug}-${createdCount}`;
            try {
              await tx.product.create({
                data: {
                  name: raw.name,
                  slug: uniqueSlug,
                  price: raw.availability === 'in_stock' ? raw.price : null,
                  priceType: raw.priceType || 'fixed',
                  availability: raw.availability,
                  specs: raw.specs || null,
                  categoryId,
                  brandId,
                  order: createdCount,
                },
              });
              createdCount++;
            } catch (e2) {
              console.warn(`WARNING: Could not create product "${raw.name}" (${raw.brand}): ${e2}`);
              errorCount++;
            }
          } else {
            console.warn(`WARNING: Could not create product "${raw.name}" (${raw.brand}): ${e}`);
            errorCount++;
          }
        }
      }
    });
  }

  console.log(`\n=== Seed Complete ===`);
  console.log(`Categories: ${categoryCount}`);
  console.log(`Brands: ${Object.keys(brandSlugToId).length}`);
  console.log(`Products created: ${createdCount}`);
  console.log(`Products skipped (duplicates): ${skippedCount}`);
  console.log(`Products with errors: ${errorCount}`);
  console.log(`Total products processed: ${rawProducts.length}`);
}

main()
  .catch((e) => {
    console.error('SEED ERROR:', e);
    process.exit(1);
  })
  .finally(() => {
    db.$disconnect();
  });