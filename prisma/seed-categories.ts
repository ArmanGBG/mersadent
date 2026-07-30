process.env.LOG_LEVELS = 'error';
import { db } from '../src/lib/db';

interface CategoryDef {
  name: string;
  slug: string;
  order: number;
  parentId?: number;
  children?: CategoryDef[];
}

// ============================================================
// ساختار جامع دسته‌بندی کالاهای سایت (نسخه جدید)
// ۱۰ دسته اصلی با زیردسته‌های ۲ و ۳ سطحی
// ============================================================
const categoryTree: CategoryDef[] = [
  {
    name: 'اندودانتیکس',
    slug: 'endodontics',
    order: 1,
    children: [
      {
        name: 'دستگاه',
        slug: 'endodontics-devices',
        order: 1,
        children: [
          { name: 'اندوموتور', slug: 'endomotor', order: 1 },
          { name: 'آپکس فایندر', slug: 'apex-finder', order: 2 },
          { name: 'آبچوراتور', slug: 'obturator', order: 3 },
          { name: 'ایریگیشن', slug: 'irrigation', order: 4 },
          { name: 'گوتاکاتر', slug: 'gutta-cutter', order: 5 },
          { name: 'آنگل روتاری', slug: 'rotary-angle', order: 6 },
          { name: 'اندولیفت', slug: 'endo-lift', order: 7 },
        ],
      },
      {
        name: 'ابزار',
        slug: 'endodontics-tools',
        order: 2,
        children: [
          { name: 'فایل روتاری', slug: 'rotary-files', order: 1 },
          { name: 'فایل دستی', slug: 'hand-files', order: 2 },
          { name: 'سرسوزن شست و شو', slug: 'irrigation-needles', order: 3 },
          { name: 'اسپریدر و پلاگر', slug: 'spreader-plugger', order: 4 },
          { name: 'خارج سازی فایل', slug: 'file-removal', order: 5 },
          { name: 'گیتس و پیزو', slug: 'gates-pisso', order: 6 },
          { name: 'اندومتر و استندفایل', slug: 'endometer-stand-file', order: 7 },
        ],
      },
      {
        name: 'مواد',
        slug: 'endodontics-materials',
        order: 3,
        children: [
          { name: 'سیلر', slug: 'sealer', order: 1 },
          { name: 'MTA', slug: 'mta', order: 2 },
          { name: 'گوتاپرکا', slug: 'gutta-percha', order: 3 },
          { name: 'کن کاغذی', slug: 'paper-points', order: 4 },
          { name: 'زینک اکساید', slug: 'zinc-oxide', order: 5 },
          { name: 'کلروفرم', slug: 'chloroform', order: 6 },
          { name: 'کلسیم هیدروکساید', slug: 'calcium-hydroxide', order: 7 },
          { name: 'اوژنول', slug: 'eugenol', order: 8 },
          { name: 'لوبریکانت و شست و شو کانال', slug: 'lubricant-canal-wash', order: 9 },
        ],
      },
      {
        name: 'رابردم و متعلقات',
        slug: 'rubber-dam-accessories',
        order: 4,
        children: [
          { name: 'ست رابردم', slug: 'rubber-dam-set', order: 1 },
          { name: 'لاستیک رابردم', slug: 'rubber-dam-sheet', order: 2 },
          { name: 'کلمپ رابردم', slug: 'rubber-dam-clamp', order: 3 },
          { name: 'فورسپس رابردم', slug: 'rubber-dam-forceps', order: 4 },
          { name: 'فریم و الگو', slug: 'rubber-dam-frame-template', order: 5 },
        ],
      },
    ],
  },
  {
    name: 'ترمیمی و زیبایی',
    slug: 'restorative-cosmetic',
    order: 2,
    children: [
      {
        name: 'مواد',
        slug: 'restorative-materials',
        order: 1,
        children: [
          { name: 'آمالگام', slug: 'amalgam', order: 1 },
          { name: 'کامپوزیت', slug: 'composite', order: 2 },
          { name: 'بلیچینگ', slug: 'bleaching', order: 3 },
          { name: 'باندینگ', slug: 'bonding', order: 4 },
          { name: 'اسید اچ', slug: 'acid-etch', order: 5 },
          { name: 'بیس و لاینر', slug: 'base-liner', order: 6 },
          { name: 'نشانگر پوسیدگی', slug: 'caries-detector', order: 7 },
        ],
      },
      {
        name: 'ابزار',
        slug: 'restorative-tools',
        order: 2,
        children: [
          { name: 'ترمیم آمالگام', slug: 'amalgam-restoration', order: 1 },
          { name: 'قلم کامپوزیت', slug: 'composite-instrument', order: 2 },
          { name: 'نوار و ماتریکس', slug: 'matrix-band', order: 3 },
          { name: 'آمالگام کریر', slug: 'amalgam-carrier', order: 4 },
          { name: 'پین', slug: 'pin', order: 5 },
          { name: 'گوده', slug: 'carver', order: 6 },
          { name: 'وج', slug: 'wedge', order: 7 },
        ],
      },
      {
        name: 'دستگاه',
        slug: 'restorative-devices',
        order: 3,
        children: [
          { name: 'لایت کیور', slug: 'light-cure', order: 1 },
          { name: 'آمالگاماتور', slug: 'amalgamator', order: 2 },
          { name: 'دستگاه بلیچینگ', slug: 'bleaching-device', order: 3 },
          { name: 'کامپوزیت وارمر و لایت‌متر', slug: 'composite-warmer-lightmeter', order: 4 },
        ],
      },
    ],
  },
  {
    name: 'هندپیس‌ها',
    slug: 'handpieces',
    order: 3,
    children: [
      {
        name: 'توربین',
        slug: 'turbines',
        order: 1,
        children: [
          { name: 'توربین دوسوراخه', slug: 'two-hole-turbine', order: 1 },
          { name: 'توربین چهارسوراخه', slug: 'four-hole-turbine', order: 2 },
          { name: 'توربین نوری', slug: 'optic-turbine', order: 3 },
          { name: 'توربین جراحی', slug: 'surgical-turbine', order: 4 },
        ],
      },
      {
        name: 'آنگل',
        slug: 'angles',
        order: 2,
        children: [
          { name: 'آنگل ناخنکی', slug: 'mini-head-angle', order: 1 },
          { name: 'آنگل پوش باتن', slug: 'push-button-angle', order: 2 },
          { name: 'آنگل ایمپلنت', slug: 'implant-angle', order: 3 },
          { name: 'آنگل روتاری', slug: 'rotary-angle-handpiece', order: 4 },
          { name: 'اندولیفت', slug: 'endo-lift-handpiece', order: 5 },
        ],
      },
      {
        name: 'ایرموتور',
        slug: 'air-motors',
        order: 3,
        children: [
          { name: 'ایرموتور دو سوراخه', slug: 'two-hole-air-motor', order: 1 },
          { name: 'ایرموتور چهارسوراخه', slug: 'four-hole-air-motor', order: 2 },
        ],
      },
      {
        name: 'هندپیس جراحی',
        slug: 'surgical-handpiece',
        order: 4,
      },
    ],
  },
  {
    name: 'تجهیزات دندانپزشکی بزرگ',
    slug: 'large-dental-equipment',
    order: 4,
    children: [
      {
        name: 'یونیت دندانپزشکی',
        slug: 'dental-units',
        order: 1,
        children: [
          { name: 'دنتوس', slug: 'dentus', order: 1 },
          { name: 'فخرسینا', slug: 'fakhresina', order: 2 },
          { name: 'زیگر', slug: 'zigr', order: 3 },
          { name: 'پارس دنتال', slug: 'pars-dental', order: 4 },
          { name: 'وصال گستر', slug: 'vesal-gostar', order: 5 },
          { name: 'پارس طب', slug: 'pars-tob', order: 6 },
          { name: 'اکباتان', slug: 'ekbatan', order: 7 },
          { name: 'کارن', slug: 'karen-unit', order: 8 },
          { name: 'زیمر', slug: 'zimmer-unit', order: 9 },
          { name: 'شیک طب', slug: 'sheik-tob', order: 10 },
        ],
      },
      {
        name: 'تجهیزات استریل‌کننده',
        slug: 'sterilization-equipment',
        order: 2,
        children: [
          { name: 'اتوکلاو', slug: 'autoclave', order: 1 },
          { name: 'اولتراسونیک کلینر و پک اتوکلاو', slug: 'ultrasonic-cleaner-autoclave-pack', order: 2 },
        ],
      },
      {
        name: 'سرویتور و روتور',
        slug: 'servitor-rotor',
        order: 3,
        children: [
          { name: 'سرویتور', slug: 'servitor', order: 1 },
          { name: 'روتور', slug: 'rotor', order: 2 },
        ],
      },
      { name: 'کمپرسور', slug: 'compressor', order: 4 },
      { name: 'ساکشن', slug: 'suction', order: 5 },
      { name: 'تابوره', slug: 'dental-stool', order: 6 },
    ],
  },
  {
    name: 'جراحی',
    slug: 'surgery',
    order: 5,
    children: [
      {
        name: 'ابزار',
        slug: 'surgery-tools',
        order: 1,
        children: [
          { name: 'تزریق بی‌حسی', slug: 'anesthesia-injection', order: 1 },
          { name: 'ظروف', slug: 'surgery-containers', order: 2 },
          { name: 'رترکتور', slug: 'retractor', order: 3 },
          { name: 'بیستوری', slug: 'osteotome', order: 4 },
          { name: 'قیچی و پنس', slug: 'scissors-forceps', order: 5 },
          { name: 'هموستات و سوزنگیر', slug: 'hemostat-needle-holder', order: 6 },
          { name: 'سایر ابزار جراحی', slug: 'other-surgery-tools', order: 7 },
        ],
      },
      {
        name: 'فورسپس',
        slug: 'surgery-forceps',
        order: 2,
        children: [
          { name: 'قدامی', slug: 'anterior-forceps', order: 1 },
          { name: 'پرمولر', slug: 'premolar-forceps', order: 2 },
          { name: 'مولر و عقل', slug: 'molar-wisdom-forceps', order: 3 },
          { name: 'ریشه‌کش', slug: 'root-elevator-forceps', order: 4 },
          { name: 'کاهورن', slug: 'cowhorn-forceps', order: 5 },
          { name: 'فورسپس اطفال', slug: 'pediatric-forceps', order: 6 },
          { name: 'ست فورسپس', slug: 'forceps-set', order: 7 },
        ],
      },
      {
        name: 'الواتور',
        slug: 'elevators',
        order: 3,
        children: [
          { name: 'مستقیم', slug: 'straight-elevator', order: 1 },
          { name: 'کرایر', slug: 'cryer-elevator', order: 2 },
          { name: 'کوپلن', slug: 'coupland-elevator', order: 3 },
          { name: 'سایر الواتورها', slug: 'other-elevators', order: 4 },
          { name: 'ست الواتور', slug: 'elevator-set', order: 5 },
        ],
      },
      {
        name: 'دستگاه',
        slug: 'surgery-devices',
        order: 4,
        children: [
          { name: 'موتور ایمپلنت', slug: 'implant-motor', order: 1 },
          { name: 'آنگل ایمپلنت', slug: 'implant-angle-surgery', order: 2 },
          { name: 'پیزو و الکتروسرجری', slug: 'piezo-electrosurgery', order: 3 },
          { name: 'میکروموتور جراحی', slug: 'surgical-micromotor', order: 4 },
        ],
      },
      { name: 'ایمپلنت و متعلقات', slug: 'implants-accessories', order: 5 },
      { name: 'مواد جراحی', slug: 'surgery-materials', order: 6 },
    ],
  },
  {
    name: 'رادیولوژی',
    slug: 'radiology',
    order: 6,
    children: [
      {
        name: 'دستگاه',
        slug: 'radiology-devices',
        order: 1,
        children: [
          { name: 'RVG', slug: 'rvg', order: 1 },
          { name: 'فسفرپلیت', slug: 'psp-plate', order: 2 },
          { name: 'رادیوگرافی', slug: 'radiography', order: 3 },
          { name: 'نگاتوسکوپ', slug: 'negatoscope', order: 4 },
          { name: 'تاریکخانه', slug: 'darkroom', order: 5 },
        ],
      },
      {
        name: 'ابزار و مواد',
        slug: 'radiology-tools-materials',
        order: 2,
        children: [
          { name: 'گیره، هولدر و کاور', slug: 'holder-clamp-cover', order: 1 },
          { name: 'ظهور و ثبوت و گرافی', slug: 'film-developer-fixer', order: 2 },
          { name: 'روپوش و پاراوان سربی', slug: 'lead-apron-shield', order: 3 },
        ],
      },
    ],
  },
  {
    name: 'پریودنتیکس',
    slug: 'periodontics',
    order: 7,
    children: [
      {
        name: 'دستگاه',
        slug: 'periodontics-devices',
        order: 1,
        children: [
          { name: 'دستگاه جرمگیری', slug: 'scaler-device', order: 1 },
          { name: 'ایرفلو و لیزر', slug: 'airflow-laser', order: 2 },
        ],
      },
      {
        name: 'ابزار',
        slug: 'periodontics-tools',
        order: 2,
        children: [
          { name: 'سینوس‌لیفت', slug: 'sinus-lift', order: 1 },
          { name: 'پروب', slug: 'probe', order: 2 },
          { name: 'سایر', slug: 'other-perio-tools', order: 3 },
        ],
      },
      {
        name: 'مواد',
        slug: 'periodontics-materials',
        order: 3,
        children: [
          { name: 'انعقاد خون', slug: 'hemostatic', order: 1 },
          { name: 'خمیرجرمگیری', slug: 'scaling-paste', order: 2 },
        ],
      },
    ],
  },
  {
    name: 'پروتز',
    slug: 'prosthodontics',
    order: 8,
    children: [
      {
        name: 'مواد',
        slug: 'prostho-materials',
        order: 1,
        children: [
          { name: 'مواد قالبگیری', slug: 'impression-materials', order: 1 },
          { name: 'اسیداچ پرسلن', slug: 'acid-etch-porcelain', order: 2 },
          { name: 'سمان', slug: 'cement', order: 3 },
          { name: 'آلژینات', slug: 'alginate', order: 4 },
          { name: 'موم', slug: 'wax', order: 5 },
        ],
      },
      {
        name: 'ابزار',
        slug: 'prostho-tools',
        order: 2,
        children: [
          { name: 'ابزار فلزی', slug: 'metal-tools', order: 1 },
          { name: 'نخ زیرلثه', slug: 'subgingival-floss', order: 2 },
          { name: 'لابراتواری', slug: 'laboratory-tools', order: 3 },
          { name: 'تری', slug: 'dental-tray', order: 4 },
        ],
      },
      {
        name: 'دستگاه',
        slug: 'prostho-devices',
        order: 3,
        children: [
          { name: 'سندبلاستر', slug: 'sandblaster', order: 1 },
          { name: 'ایرفلو', slug: 'airflow-prostho', order: 2 },
          { name: 'میکروموتور', slug: 'micromotor-prostho', order: 3 },
        ],
      },
    ],
  },
  {
    name: 'اطفال و ارتودنسی',
    slug: 'pediatric-orthodontics',
    order: 9,
    children: [
      {
        name: 'اطفال',
        slug: 'pediatric',
        order: 1,
        children: [
          { name: 'مواد', slug: 'pediatric-materials', order: 1 },
          { name: 'ابزار و تجهیزات', slug: 'pediatric-tools-equipment', order: 2 },
        ],
      },
      {
        name: 'ارتودنسی',
        slug: 'orthodontics',
        order: 2,
        children: [
          { name: 'پلایر', slug: 'plier', order: 1 },
          { name: 'کاتر', slug: 'cutter', order: 2 },
          { name: 'براکت و وایر', slug: 'bracket-wire', order: 3 },
          { name: 'سایر ابزار و مواد', slug: 'other-ortho-tools-materials', order: 4 },
        ],
      },
    ],
  },
  {
    name: 'مواد و تجهیزات عمومی',
    slug: 'general-materials-equipment',
    order: 10,
    children: [
      {
        name: 'کتاب و مدل آموزشی',
        slug: 'educational-books-models',
        order: 1,
        children: [
          { name: 'دنتیک', slug: 'dentic', order: 1 },
          { name: 'کست', slug: 'cast', order: 2 },
          { name: 'کتاب', slug: 'dental-books', order: 3 },
          { name: 'بلوک اندو', slug: 'endo-blocks', order: 4 },
          { name: 'هدفانتوم و کیت بخیه', slug: 'phantom-suture-kit', order: 5 },
          { name: 'گچ و موم مورفولوژی', slug: 'plaster-wax-morphology', order: 6 },
        ],
      },
      {
        name: 'ابزار',
        slug: 'general-tools',
        order: 2,
        children: [
          { name: 'وسایل معاینه', slug: 'examination-tools', order: 1 },
          { name: 'ظروف دندانپزشکی', slug: 'dental-containers', order: 2 },
          { name: 'دهان‌بازکن و فتوگرافی', slug: 'mouth-opener-photography', order: 3 },
          { name: 'مولت و دیسک', slug: 'mandrel-disc', order: 4 },
          { name: 'ماسک و دستکش', slug: 'mask-gloves', order: 5 },
          { name: 'شیلد و گان', slug: 'shield-gown', order: 6 },
          { name: 'سرسوزن و بخیه', slug: 'needle-suture', order: 7 },
        ],
      },
      {
        name: 'مواد',
        slug: 'general-materials',
        order: 3,
        children: [
          { name: 'یکبارمصرف', slug: 'disposables', order: 1 },
          { name: 'ضدعفونی کننده', slug: 'disinfectant', order: 2 },
          { name: 'بیحسی', slug: 'anesthetic', order: 3 },
        ],
      },
      { name: 'لوپ و میکروسکوپ', slug: 'loupe-microscope', order: 4 },
      { name: 'اکسسوری', slug: 'accessories', order: 5 },
    ],
  },
];

// ============================================================
// ایجاد دسته‌بندی‌ها به صورت بازگشتی
// ============================================================
async function createCategory(
  def: CategoryDef,
  parentId?: number
): Promise<number> {
  const record = await db.category.create({
    data: {
      name: def.name,
      slug: def.slug,
      order: def.order,
      parentId: parentId ?? null,
    },
  });
  return record.id;
}

async function createWithChildren(
  def: CategoryDef,
  parentId?: number
): Promise<void> {
  const id = await createCategory(def, parentId);
  if (def.children) {
    for (const child of def.children) {
      await createWithChildren(child, id);
    }
  }
}

async function seedCategories() {
  console.log('🌱 شروع seeding دسته‌بندی‌ها...');

  // پاک کردن دسته‌بندی‌های قبلی
  await db.category.deleteMany({});
  console.log('✓ دسته‌بندی‌های قبلی پاک شدند');

  let count = 0;
  for (const level1 of categoryTree) {
    const level1Id = await createCategory(level1);
    count++;

    if (level1.children) {
      for (const level2 of level1.children) {
        const level2Id = await createCategory(level2, level1Id);
        count++;

        if (level2.children) {
          for (const level3 of level2.children) {
            await createCategory(level3, level2Id);
            count++;
          }
        }
      }
    }
  }

  console.log(`✅ ${count} دسته‌بندی ایجاد شد`);

  // آمار خلاصه
  const total = await db.category.count();
  const level1Count = await db.category.count({ where: { parentId: null } });
  const level2Count = await db.category.count({
    where: { parent: { isNot: null } },
  });
  console.log(`📊 خلاصه: ${level1Count} دسته اصلی، مجموع ${total} دسته`);
}

seedCategories()
  .catch((e) => {
    console.error('❌ خطا در seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
