process.env.LOG_LEVELS = 'error';
import { db } from '../src/lib/db';

async function main() {
  console.log('🌱 شروع seeding محصولات نمونه...');
  await db.product.deleteMany({});

  const categories = await db.category.findMany({ where: { parentId: null } });
  const brands = await db.brand.findMany();

  const findCat = (slug: string) => categories.find((c) => c.slug === slug);
  const findBrand = (name: string) => brands.find((b) => b.name === name);

  interface SampleProduct {
    name: string;
    slug: string;
    sku?: string;
    model?: string;
    price: number;
    priceType?: string;
    availability?: string;
    discountPercent?: number;
    description?: string;
    country?: string;
    warranty?: string;
    weight?: string;
    featured?: boolean;
    categoryName: string;
    brandName: string;
    subCategorySlug?: string;
  }

  const samples: SampleProduct[] = [
    // اندودانتیکس
    { name: 'اندوموتور OLED V2', slug: 'endomotor-oled-v2', sku: 'END-MOT-V2', model: 'OLED V2', price: 18500000, priceType: 'fixed', availability: 'in_stock', country: 'چین', warranty: '۱ سال گارانتی', featured: true, categoryName: 'endodontics', subCategorySlug: 'endomotor', brandName: 'Woodpecker', description: 'اندوموتور پیشرفته با نمایشگر OLED و آپکس فایندر داخلی' },
    { name: 'آپکس فایندر Root ZX II', slug: 'apex-finder-root-zx-ii', sku: 'APX-RZX2', model: 'Root ZX II', price: 24500000, priceType: 'fixed', availability: 'in_stock', country: 'ژاپن', warranty: '۲ سال گارانتی', featured: true, categoryName: 'endodontics', subCategorySlug: 'apex-finder', brandName: 'J Morita', description: 'آپکس فایندر دقیق با دقت بالا در تشخیص آپکس' },
    { name: 'فایل روتاری ProTaper Gold', slug: 'rotary-file-protaper-gold', sku: 'FIL-PTG-25', model: 'F2', price: 350000, priceType: 'fixed', availability: 'in_stock', country: 'سوئیس', warranty: 'اصالت کالا', featured: false, categoryName: 'endodontics', subCategorySlug: 'rotary-files', brandName: 'Dentsply', description: 'مجموعه فایل روتاری ProTaper Gold با انعطاف‌پذیری بالا' },
    { name: 'سیلر AH Plus', slug: 'sealer-ah-plus', sku: 'SLR-AHP', model: 'AH Plus', price: 1850000, priceType: 'fixed', availability: 'in_stock', country: 'آلمان', warranty: 'اصالت کالا', featured: true, categoryName: 'endodontics', subCategorySlug: 'sealer', brandName: 'Dentsply', description: 'سیلر رزینی دو جزئی با زمان کارکرد مناسب' },
    { name: 'گوتاپرکا Diadent', slug: 'gutta-percha-diadent', sku: 'GP-DIA-30', model: '#30', price: 95000, priceType: 'fixed', availability: 'in_stock', country: 'کره جنوبی', warranty: 'اصالت کالا', featured: false, categoryName: 'endodontics', subCategorySlug: 'gutta-percha', brandName: 'Diadent', description: 'گوتاپرکا استاندارد با اندازه‌بندی دقیق' },

    // ترمیمی و زیبایی
    { name: 'لایت کیور VALO Grand', slug: 'light-cure-valo-grand', sku: 'LC-VALO-GR', model: 'Grand', price: 32000000, priceType: 'fixed', availability: 'in_stock', country: 'آمریکا', warranty: '۲ سال گارانتی', featured: true, categoryName: 'restorative-cosmetic', subCategorySlug: 'light-cure', brandName: 'Ultradent', description: 'لایت کیور LED با شدت نور بالا و طیف وسیع' },
    { name: 'کامپوزیت Filtek Z250', slug: 'composite-filtek-z250', sku: 'CMP-Z250-A2', model: 'A2', price: 1250000, priceType: 'fixed', availability: 'in_stock', country: 'آمریکا', warranty: 'اصالت کالا', featured: true, categoryName: 'restorative-cosmetic', subCategorySlug: 'composite', brandName: '3M ESPE', description: 'کامپوزیت میکروهیبرید با استحکام بالا' },
    { name: 'باندینگ Single Bond 2', slug: 'bonding-single-bond-2', sku: 'BND-SB2', model: 'Universal', price: 2350000, priceType: 'fixed', availability: 'in_stock', country: 'آمریکا', warranty: 'اصالت کالا', featured: false, categoryName: 'restorative-cosmetic', subCategorySlug: 'bonding', brandName: '3M ESPE', description: 'عامل باندینگ یونیورسال با قدرت چسبندگی بالا' },
    { name: 'آمالگاماتور Silver Mix', slug: 'amalgamator-silver-mix', sku: 'AML-SLV-MIX', model: 'S2', price: 8500000, priceType: 'fixed', availability: 'in_stock', country: 'چین', warranty: '۱ سال گارانتی', featured: false, categoryName: 'restorative-cosmetic', subCategorySlug: 'amalgamator', brandName: 'Being Foshan', description: 'آمالگاماتور دیجیتال با کنترل زمان و سرعت' },

    // هندپیس‌ها
    { name: 'توربین دوسوراخه Push Button', slug: 'turbine-2hole-pushbtn', sku: 'TB-2H-PB', model: 'PB-2H', price: 6500000, priceType: 'fixed', availability: 'in_stock', country: 'ژاپن', warranty: '۱ سال گارانتی', featured: true, categoryName: 'handpieces', subCategorySlug: 'two-hole-turbine', brandName: 'NSK', description: 'توربین دوسوراخه با سیستم Push Button و سرعت بالا' },
    { name: 'توربین چهارسوراخه نوری', slug: 'turbine-4hole-optic', sku: 'TB-4H-OP', model: 'OPT-4H', price: 12500000, priceType: 'fixed', availability: 'in_stock', country: 'ژاپن', warranty: '۱ سال گارانتی', featured: true, categoryName: 'handpieces', subCategorySlug: 'four-hole-turbine', brandName: 'NSK', description: 'توربین چهارسوراخه نوری با نور LED داخلی' },
    { name: 'آنگل پوش باتن CA 1:1', slug: 'angle-pushbtn-1to1', sku: 'AG-PB-11', model: 'CA 1:1', price: 4500000, priceType: 'fixed', availability: 'in_stock', country: 'ژاپن', warranty: '۱ سال گارانتی', featured: false, categoryName: 'handpieces', subCategorySlug: 'push-button-angle', brandName: 'NSK', description: 'آنگل پوش باتن با نسبت ۱:۱ و طراحی سبک' },
    { name: 'ایرموتور چهارسوراخه', slug: 'air-motor-4hole', sku: 'AM-4H', model: 'M4', price: 7200000, priceType: 'fixed', availability: 'in_stock', country: 'ژاپن', warranty: '۱ سال گارانتی', featured: false, categoryName: 'handpieces', subCategorySlug: 'four-hole-air-motor', brandName: 'NSK', description: 'ایرموتور چهارسوراخه با قدرت و دوام بالا' },

    // تجهیزات بزرگ
    { name: 'یونیت دندانپزشکی دنتوس مدل D1', slug: 'dental-unit-dentus-d1', sku: 'UNIT-DEN-D1', model: 'D1', price: 185000000, priceType: 'fixed', availability: 'in_stock', country: 'ایران', warranty: '۲ سال گارانتی', featured: true, categoryName: 'large-dental-equipment', subCategorySlug: 'dentus', brandName: 'Dentus', description: 'یونیت دندانپزشکی دنتوس با امکانات کامل و طراحی ارگونومیک' },
    { name: 'اتوکلاو کلاس B 23 لیتری', slug: 'autoclave-classb-23l', sku: 'ACL-B23', model: 'B23', price: 95000000, priceType: 'fixed', availability: 'in_stock', country: 'چین', warranty: '۲ سال گارانتی', featured: true, categoryName: 'large-dental-equipment', subCategorySlug: 'autoclave', brandName: 'Sinol', description: 'اتوکلاو کلاس B با ظرفیت 23 لیتر و چرخه‌های استریل کامل' },
    { name: 'کمپرسور بی‌صدا دندانپزشکی', slug: 'silent-compressor-dental', sku: 'CMP-SIL', model: 'S1', price: 38500000, priceType: 'fixed', availability: 'in_stock', country: 'ایران', warranty: '۱ سال گارانتی', featured: false, categoryName: 'large-dental-equipment', subCategorySlug: 'compressor', brandName: 'Faraz Mehr', description: 'کمپرسور بی‌صدا با روغن برای استفاده دندانپزشکی' },
    { name: 'تابوره دندانپزشکی ارگونومیک', slug: 'dental-stool-ergonomic', sku: 'STL-ERG', model: 'E1', price: 6500000, priceType: 'fixed', availability: 'in_stock', country: 'ایران', warranty: '۶ ماه گارانتی', featured: false, categoryName: 'large-dental-equipment', subCategorySlug: 'dental-stool', brandName: 'Pars Dantal', description: 'تابوره ارگونومیک با تنظیم ارتفاع و حمایت کمر' },

    // جراحی
    { name: 'ست فورسپس جراحی ۷ تکه', slug: 'forceps-set-7pcs', sku: 'FX-SET7', model: 'SET7', price: 8500000, priceType: 'fixed', availability: 'in_stock', country: 'پاکستان', warranty: 'اصالت کالا', featured: true, categoryName: 'surgery', subCategorySlug: 'forceps-set', brandName: 'Martin', description: 'ست فورسپس جراحی ۷ تکه از جنس استیل ضدزنگ' },
    { name: 'الواتور کرایر شماره ۱', slug: 'elevator-cryer-no1', sku: 'ELV-CRY1', model: 'CR1', price: 1250000, priceType: 'fixed', availability: 'in_stock', country: 'پاکستان', warranty: 'اصالت کالا', featured: false, categoryName: 'surgery', subCategorySlug: 'cryer-elevator', brandName: 'Martin', description: 'الواتور کرایر شماره ۱ برای خارج کردن ریشه' },
    { name: 'موتور ایمپلنت X3', slug: 'implant-motor-x3', sku: 'IMP-MOT-X3', model: 'X3', price: 145000000, priceType: 'fixed', availability: 'in_stock', country: 'کره جنوبی', warranty: '۲ سال گارانتی', featured: true, categoryName: 'surgery', subCategorySlug: 'implant-motor', brandName: 'Saeshin', description: 'موتور ایمپلنت پیشرفته با پمپ آب داخلی و کنترل دقیق' },
    { name: 'بسته ۱۰ عددی ایمپلنت Simple', slug: 'implant-simple-10pack', sku: 'IMP-SIM-10', model: 'Simple', price: 28000000, priceType: 'fixed', availability: 'in_stock', country: 'کره جنوبی', warranty: 'اصالت کالا', featured: false, categoryName: 'surgery', subCategorySlug: 'implants-accessories', brandName: 'Dentium', description: 'بسته ۱۰ عددی ایمپلنت Simple با فیکسچر و اباتمنت' },

    // رادیولوژی
    { name: 'RVG دیجیتال اندازگر', slug: 'rvg-digital-sensor', sku: 'RVG-DS', model: 'S1', price: 95000000, priceType: 'fixed', availability: 'in_stock', country: 'فرانسه', warranty: '۲ سال گارانتی', featured: true, categoryName: 'radiology', subCategorySlug: 'rvg', brandName: 'Acteon', description: 'سنسور RVG دیجیتال با کیفیت تصویر بالا و سرعت نمایش' },

    // پریودنتیکس
    { name: 'دستگاه جرمگیری Ultrasonic', slug: 'scaler-ultrasonic', sku: 'SCL-ULT', model: 'U1', price: 18500000, priceType: 'fixed', availability: 'in_stock', country: 'چین', warranty: '۱ سال گارانتی', featured: true, categoryName: 'periodontics', subCategorySlug: 'scaler-device', brandName: 'Woodpecker', description: 'دستگاه جرمگیری التراسونیک با کنترل توان و حالت‌های مختلف' },

    // پروتز
    { name: 'آلژینات Chromatic', slug: 'alginate-chromatic', sku: 'ALG-CHR', model: 'Chromatic', price: 285000, priceType: 'fixed', availability: 'in_stock', country: 'آمریکا', warranty: 'اصالت کالا', featured: false, categoryName: 'prosthodontics', subCategorySlug: 'alginate', brandName: 'GC', description: 'پودر آلژینات رنگی با زمان ستینگ مناسب' },
    { name: 'موم بیس پلیت', slug: 'base-plate-wax', sku: 'WAX-BP', model: 'BP', price: 95000, priceType: 'fixed', availability: 'in_stock', country: 'آلمان', warranty: 'اصالت کالا', featured: false, categoryName: 'prosthodontics', subCategorySlug: 'wax', brandName: 'Bego', description: 'موم بیس پلیت برای ساخت مدل‌های پروتز' },

    // اطفال و ارتودنسی
    { name: 'ست پلایر ارتودنسی ۴ تکه', slug: 'ortho-plier-set-4pcs', sku: 'PLR-SET4', model: 'SET4', price: 6500000, priceType: 'fixed', availability: 'in_stock', country: 'پاکستان', warranty: 'اصالت کالا', featured: false, categoryName: 'pediatric-orthodontics', subCategorySlug: 'plier', brandName: 'Martin', description: 'ست پلایر ارتودنسی ۴ تکه شامل انواع پلایرهای اصلی' },
    { name: 'براکت متالیک Roth 022', slug: 'metal-bracket-roth-022', sku: 'BRK-ROTH-022', model: 'Roth', price: 4500000, priceType: 'fixed', availability: 'in_stock', country: 'آمریکا', warranty: 'اصالت کالا', featured: false, categoryName: 'pediatric-orthodontics', subCategorySlug: 'bracket-wire', brandName: 'AOA', description: 'براکت متالیک سیستم Roth با اسلات 0.022' },

    // عمومی
    { name: 'بسته ۱۰۰ عددی ماسک ۳ لایه', slug: 'mask-3ply-100pack', sku: 'MSK-3P-100', model: '3P', price: 185000, priceType: 'fixed', availability: 'in_stock', country: 'چین', warranty: 'اصالت کالا', featured: false, categoryName: 'general-materials-equipment', subCategorySlug: 'mask-gloves', brandName: 'Coxo', description: 'بسته ۱۰۰ عددی ماسک ۳ لایه با رنگ آبی' },
    { name: 'لوپ دندانپزشکی ۲.۵x', slug: 'loupe-2-5x', sku: 'LOU-25X', model: '2.5x', price: 28500000, priceType: 'fixed', availability: 'in_stock', country: 'آمریکا', warranty: '۱ سال گارانتی', featured: true, categoryName: 'general-materials-equipment', subCategorySlug: 'loupe-microscope', brandName: 'Orascoptic', description: 'لوپ دندانپزشکی با بزرگنمایی ۲.۵ برابر و کیفیت اپتیکال بالا' },
    { name: 'هدفانتوم مدل DENTO-1', slug: 'phantom-dento-1', sku: 'PHN-D1', model: 'DENTO-1', price: 12500000, priceType: 'fixed', availability: 'in_stock', country: 'آلمان', warranty: 'اصالت کالا', featured: false, categoryName: 'general-materials-equipment', subCategorySlug: 'phantom-suture-kit', brandName: 'frasaco', description: 'هدفانتوم آموزشی برای تمرین دستی دندانپزشکی' },

    // محصولات با تماس بگیرید
    { name: 'یونیت دندانپزشکی فخرسینا مدل F2', slug: 'dental-unit-fakhresina-f2', sku: 'UNIT-FKH-F2', model: 'F2', price: 0, priceType: 'call', availability: 'call', country: 'ایران', featured: false, categoryName: 'large-dental-equipment', subCategorySlug: 'fakhresina', brandName: 'Fakhre Sina', description: 'یونیت دندانپزشکی فخرسینا با کیفیت ساخت ایرانی - برای قیمت تماس بگیرید' },
    { name: 'میکروسکوپ دندانپزشکی', slug: 'dental-microscope', sku: 'MIC-DENT', model: 'Pro', price: 0, priceType: 'call', availability: 'call', country: 'آلمان', featured: false, categoryName: 'general-materials-equipment', subCategorySlug: 'loupe-microscope', brandName: 'Zeiss', description: 'میکروسکپ دندانپزشکی پیشرفته - برای قیمت تماس بگیرید' },

    // محصول تخفیف‌دار
    { name: 'ست رابردم کامل', slug: 'rubber-dam-complete-set', sku: 'RBD-SET', model: 'Complete', price: 2850000, priceType: 'fixed', availability: 'in_stock', discountPercent: 15, country: 'پاکستان', warranty: 'اصالت کالا', featured: true, categoryName: 'endodontics', subCategorySlug: 'rubber-dam-set', brandName: 'Hahnenkratt', description: 'ست کامل رابردم شامل کلمپ، فورسپس، فریم و لاستیک - تخفیف ویژه' },
  ];

  let count = 0;
  for (const p of samples) {
    let categoryId: number;
    const level1 = findCat(p.categoryName);
    if (!level1) {
      console.warn(`⚠️  دسته اصلی پیدا نشد: ${p.categoryName}`);
      continue;
    }
    if (p.subCategorySlug) {
      const subCat = await db.category.findFirst({ where: { slug: p.subCategorySlug } });
      if (subCat) {
        categoryId = subCat.id;
      } else {
        categoryId = level1.id;
      }
    } else {
      categoryId = level1.id;
    }

    const brand = findBrand(p.brandName);
    if (!brand) {
      console.warn(`⚠️  برند پیدا نشد: ${p.brandName}`);
      continue;
    }

    const product = await db.product.create({
      data: {
        name: p.name,
        slug: p.slug,
        sku: p.sku,
        model: p.model,
        price: p.price,
        priceType: p.priceType ?? 'fixed',
        availability: p.availability ?? 'in_stock',
        discountPercent: p.discountPercent ?? 0,
        description: p.description,
        country: p.country,
        warranty: p.warranty,
        weight: p.weight,
        featured: p.featured ?? false,
        categoryId,
        brandId: brand.id,
      },
    });

    // تصویر پیش‌فرض با لوگو
    await db.productImage.create({
      data: {
        productId: product.id,
        url: '/logo.svg',
        alt: p.name,
        order: 0,
      },
    });

    count++;
  }

  console.log(`✅ ${count} محصول نمونه ایجاد شد`);
}

main()
  .catch((e) => { console.error('❌ خطا:', e); process.exit(1); })
  .finally(() => db.$disconnect());
