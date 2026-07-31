import { writeFileSync } from 'fs';
import { db } from '../src/lib/db';

async function main() {
  const brands = await db.brand.findMany({ orderBy: { id: 'asc' } });
  const categories = await db.category.findMany({ orderBy: { order: 'asc' } });
  const products = await db.product.findMany({
    select: {
      id: true, name: true, slug: true, sku: true, model: true,
      price: true, priceType: true, availability: true, specs: true,
      discountPercent: true, description: true, strengths: true, weaknesses: true,
      country: true, warranty: true, weight: true, productType: true,
      typeFields: true, customSpecs: true, metaTitle: true, metaDescription: true,
      keywords: true, categoryId: true, brandId: true, order: true,
      featured: true, visible: true,
    },
    orderBy: { id: 'asc' }
  });
  const images = await db.productImage.findMany({ orderBy: { id: 'asc' } });

  console.log('Fetched:', { brands: brands.length, categories: categories.length, products: products.length, images: images.length });

  const catSlugById = new Map(categories.map(c => [c.id, c.slug]));
  const brandNameById = new Map(brands.map(b => [b.id, b.name]));

  const brandLines = brands.map(b => 
    `  { name: '${b.name.replace(/'/g, "\\'")}', slug: '${b.slug}', logo: ${b.logo ? `'${b.logo}'` : 'null'}, visible: ${b.visible} }`
  ).join(',\n');

  const categoryTree = [
    { name: 'اندودانتیکس', slug: 'endodontics', order: 1, children: [
      { name: 'دستگاه', slug: 'endodontics-devices', order: 1, children: [
        { name: 'اندوموتور', slug: 'endomotor', order: 1 }, { name: 'آپکس فایندر', slug: 'apex-finder', order: 2 },
        { name: 'آبچوراتور', slug: 'obturator', order: 3 }, { name: 'ایریگیشن', slug: 'irrigation', order: 4 },
        { name: 'گوتاکاتر', slug: 'gutta-cutter', order: 5 }, { name: 'آنگل روتاری', slug: 'rotary-angle', order: 6 },
        { name: 'اندولیفت', slug: 'endo-lift', order: 7 },
      ]},
      { name: 'ابزار', slug: 'endodontics-tools', order: 2, children: [
        { name: 'فایل روتاری', slug: 'rotary-files', order: 1 }, { name: 'فایل دستی', slug: 'hand-files', order: 2 },
        { name: 'سرسوزن شست و شو', slug: 'irrigation-needles', order: 3 }, { name: 'اسپریدر و پلاگر', slug: 'spreader-plugger', order: 4 },
        { name: 'خارج سازی فایل', slug: 'file-removal', order: 5 }, { name: 'گیتس و پیزو', slug: 'gates-pisso', order: 6 },
        { name: 'اندومتر و استندفایل', slug: 'endometer-stand-file', order: 7 },
      ]},
      { name: 'مواد', slug: 'endodontics-materials', order: 3, children: [
        { name: 'سیلر', slug: 'sealer', order: 1 }, { name: 'MTA', slug: 'mta', order: 2 },
        { name: 'گوتاپرکا', slug: 'gutta-percha', order: 3 }, { name: 'کن کاغذی', slug: 'paper-points', order: 4 },
        { name: 'زینک اکساید', slug: 'zinc-oxide', order: 5 }, { name: 'کلروفرم', slug: 'chloroform', order: 6 },
        { name: 'کلسیم هیدروکساید', slug: 'calcium-hydroxide', order: 7 }, { name: 'اوژنول', slug: 'eugenol', order: 8 },
        { name: 'لوبریکانت و شست و شو کانال', slug: 'lubricant-canal-wash', order: 9 },
      ]},
      { name: 'رابردم و متعلقات', slug: 'rubber-dam-accessories', order: 4, children: [
        { name: 'ست رابردم', slug: 'rubber-dam-set', order: 1 }, { name: 'لاستیک رابردم', slug: 'rubber-dam-sheet', order: 2 },
        { name: 'کلمپ رابردم', slug: 'rubber-dam-clamp', order: 3 }, { name: 'فورسپس رابردم', slug: 'rubber-dam-forceps', order: 4 },
        { name: 'فریم و الگو', slug: 'rubber-dam-frame-template', order: 5 },
      ]},
    ]},
    { name: 'ترمیمی و زیبایی', slug: 'restorative-cosmetic', order: 2, children: [
      { name: 'مواد', slug: 'restorative-materials', order: 1, children: [
        { name: 'آمالگام', slug: 'amalgam', order: 1 }, { name: 'کامپوزیت', slug: 'composite', order: 2 },
        { name: 'بلیچینگ', slug: 'bleaching', order: 3 }, { name: 'باندینگ', slug: 'bonding', order: 4 },
        { name: 'اسید اچ', slug: 'acid-etch', order: 5 }, { name: 'بیس و لاینر', slug: 'base-liner', order: 6 },
        { name: 'نشانگر پوسیدگی', slug: 'caries-detector', order: 7 },
      ]},
      { name: 'ابزار', slug: 'restorative-tools', order: 2, children: [
        { name: 'ترمیم آمالگام', slug: 'amalgam-restoration', order: 1 }, { name: 'قلم کامپوزیت', slug: 'composite-instrument', order: 2 },
        { name: 'نوار و ماتریکس', slug: 'matrix-band', order: 3 }, { name: 'آمالگام کریر', slug: 'amalgam-carrier', order: 4 },
        { name: 'پین', slug: 'pin', order: 5 }, { name: 'گوده', slug: 'carver', order: 6 }, { name: 'وج', slug: 'wedge', order: 7 },
      ]},
      { name: 'دستگاه', slug: 'restorative-devices', order: 3, children: [
        { name: 'لایت کیور', slug: 'light-cure', order: 1 }, { name: 'آمالگاماتور', slug: 'amalgamator', order: 2 },
        { name: 'دستگاه بلیچینگ', slug: 'bleaching-device', order: 3 }, { name: 'کامپوزیت وارمر و لایت‌متر', slug: 'composite-warmer-lightmeter', order: 4 },
      ]},
    ]},
    { name: 'هندپیس‌ها', slug: 'handpieces', order: 3, children: [
      { name: 'توربین', slug: 'turbines', order: 1, children: [
        { name: 'توربین دوسوراخه', slug: 'two-hole-turbine', order: 1 }, { name: 'توربین چهارسوراخه', slug: 'four-hole-turbine', order: 2 },
        { name: 'توربین نوری', slug: 'optic-turbine', order: 3 }, { name: 'توربین جراحی', slug: 'surgical-turbine', order: 4 },
      ]},
      { name: 'آنگل', slug: 'angles', order: 2, children: [
        { name: 'آنگل ناخنکی', slug: 'mini-head-angle', order: 1 }, { name: 'آنگل پوش باتن', slug: 'push-button-angle', order: 2 },
        { name: 'آنگل ایمپلنت', slug: 'implant-angle', order: 3 }, { name: 'آنگل روتاری', slug: 'rotary-angle-handpiece', order: 4 },
        { name: 'اندولیفت', slug: 'endo-lift-handpiece', order: 5 },
      ]},
      { name: 'ایرموتور', slug: 'air-motors', order: 3, children: [
        { name: 'ایرموتور دو سوراخه', slug: 'two-hole-air-motor', order: 1 }, { name: 'ایرموتور چهارسوراخه', slug: 'four-hole-air-motor', order: 2 },
      ]},
      { name: 'هندپیس جراحی', slug: 'surgical-handpiece', order: 4 },
    ]},
    { name: 'تجهیزات دندانپزشکی بزرگ', slug: 'large-dental-equipment', order: 4, children: [
      { name: 'یونیت دندانپزشکی', slug: 'dental-units', order: 1, children: [
        { name: 'دنتوس', slug: 'dentus', order: 1 }, { name: 'فخرسینا', slug: 'fakhresina', order: 2 },
        { name: 'زیگر', slug: 'zigr', order: 3 }, { name: 'پارس دنتال', slug: 'pars-dental', order: 4 },
        { name: 'وصال گستر', slug: 'vesal-gostar', order: 5 }, { name: 'پارس طب', slug: 'pars-tob', order: 6 },
        { name: 'اکباتان', slug: 'ekbatan', order: 7 }, { name: 'کارن', slug: 'karen-unit', order: 8 },
        { name: 'زیمر', slug: 'zimmer-unit', order: 9 }, { name: 'شیک طب', slug: 'sheik-tob', order: 10 },
      ]},
      { name: 'تجهیزات استریل‌کننده', slug: 'sterilization-equipment', order: 2, children: [
        { name: 'اتوکلاو', slug: 'autoclave', order: 1 }, { name: 'اولتراسونیک کلینر و پک اتوکلاو', slug: 'ultrasonic-cleaner-autoclave-pack', order: 2 },
      ]},
      { name: 'سرویتور و روتور', slug: 'servitor-rotor', order: 3, children: [
        { name: 'سرویتور', slug: 'servitor', order: 1 }, { name: 'روتور', slug: 'rotor', order: 2 },
      ]},
      { name: 'کمپرسور', slug: 'compressor', order: 4 }, { name: 'ساکشن', slug: 'suction', order: 5 }, { name: 'تابوره', slug: 'dental-stool', order: 6 },
    ]},
    { name: 'جراحی', slug: 'surgery', order: 5, children: [
      { name: 'ابزار', slug: 'surgery-tools', order: 1, children: [
        { name: 'تزریق بی‌حسی', slug: 'anesthesia-injection', order: 1 }, { name: 'ظروف', slug: 'surgery-containers', order: 2 },
        { name: 'رترکتور', slug: 'retractor', order: 3 }, { name: 'بیستوری', slug: 'osteotome', order: 4 },
        { name: 'قیچی و پنس', slug: 'scissors-forceps', order: 5 }, { name: 'هموستات و سوزنگیر', slug: 'hemostat-needle-holder', order: 6 },
        { name: 'سایر ابزار جراحی', slug: 'other-surgery-tools', order: 7 },
      ]},
      { name: 'فورسپس', slug: 'surgery-forceps', order: 2, children: [
        { name: 'قدامی', slug: 'anterior-forceps', order: 1 }, { name: 'پرمولر', slug: 'premolar-forceps', order: 2 },
        { name: 'مولر و عقل', slug: 'molar-wisdom-forceps', order: 3 }, { name: 'ریشه‌کش', slug: 'root-elevator-forceps', order: 4 },
        { name: 'کاهورن', slug: 'cowhorn-forceps', order: 5 }, { name: 'فورسپس اطفال', slug: 'pediatric-forceps', order: 6 },
        { name: 'ست فورسپس', slug: 'forceps-set', order: 7 },
      ]},
      { name: 'الواتور', slug: 'elevators', order: 3, children: [
        { name: 'مستقیم', slug: 'straight-elevator', order: 1 }, { name: 'کرایر', slug: 'cryer-elevator', order: 2 },
        { name: 'کوپلن', slug: 'coupland-elevator', order: 3 }, { name: 'سایر الواتورها', slug: 'other-elevators', order: 4 },
        { name: 'ست الواتور', slug: 'elevator-set', order: 5 },
      ]},
      { name: 'دستگاه', slug: 'surgery-devices', order: 4, children: [
        { name: 'موتور ایمپلنت', slug: 'implant-motor', order: 1 }, { name: 'آنگل ایمپلنت', slug: 'implant-angle-surgery', order: 2 },
        { name: 'پیزو و الکتروسرجری', slug: 'piezo-electrosurgery', order: 3 }, { name: 'میکروموتور جراحی', slug: 'surgical-micromotor', order: 4 },
      ]},
      { name: 'ایمپلنت و متعلقات', slug: 'implants-accessories', order: 5 }, { name: 'مواد جراحی', slug: 'surgery-materials', order: 6 },
    ]},
    { name: 'رادیولوژی', slug: 'radiology', order: 6, children: [
      { name: 'دستگاه', slug: 'radiology-devices', order: 1, children: [
        { name: 'RVG', slug: 'rvg', order: 1 }, { name: 'فسفرپلیت', slug: 'psp-plate', order: 2 },
        { name: 'رادیوگرافی', slug: 'radiography', order: 3 }, { name: 'نگاتوسکوپ', slug: 'negatoscope', order: 4 },
        { name: 'تاریکخانه', slug: 'darkroom', order: 5 },
      ]},
      { name: 'ابزار و مواد', slug: 'radiology-tools-materials', order: 2, children: [
        { name: 'گیره، هولدر و کاور', slug: 'holder-clamp-cover', order: 1 }, { name: 'ظهور و ثبوت و گرافی', slug: 'film-developer-fixer', order: 2 },
        { name: 'روپوش و پاراوان سربی', slug: 'lead-apron-shield', order: 3 },
      ]},
    ]},
    { name: 'پریودنتیکس', slug: 'periodontics', order: 7, children: [
      { name: 'دستگاه', slug: 'periodontics-devices', order: 1, children: [
        { name: 'دستگاه جرمگیری', slug: 'scaler-device', order: 1 }, { name: 'ایرفلو و لیزر', slug: 'airflow-laser', order: 2 },
      ]},
      { name: 'ابزار', slug: 'periodontics-tools', order: 2, children: [
        { name: 'سینوس‌لیفت', slug: 'sinus-lift', order: 1 }, { name: 'پروب', slug: 'probe', order: 2 }, { name: 'سایر', slug: 'other-perio-tools', order: 3 },
      ]},
      { name: 'مواد', slug: 'periodontics-materials', order: 3, children: [
        { name: 'انعقاد خون', slug: 'hemostatic', order: 1 }, { name: 'خمیرجرمگیری', slug: 'scaling-paste', order: 2 },
      ]},
    ]},
    { name: 'پروتز', slug: 'prosthodontics', order: 8, children: [
      { name: 'مواد', slug: 'prostho-materials', order: 1, children: [
        { name: 'مواد قالبگیری', slug: 'impression-materials', order: 1 }, { name: 'اسیداچ پرسلن', slug: 'acid-etch-porcelain', order: 2 },
        { name: 'سمان', slug: 'cement', order: 3 }, { name: 'آلژینات', slug: 'alginate', order: 4 }, { name: 'موم', slug: 'wax', order: 5 },
      ]},
      { name: 'ابزار', slug: 'prostho-tools', order: 2, children: [
        { name: 'ابزار فلزی', slug: 'metal-tools', order: 1 }, { name: 'نخ زیرلثه', slug: 'subgingival-floss', order: 2 },
        { name: 'لابراتواری', slug: 'laboratory-tools', order: 3 }, { name: 'تری', slug: 'dental-tray', order: 4 },
      ]},
      { name: 'دستگاه', slug: 'prostho-devices', order: 3, children: [
        { name: 'سندبلاستر', slug: 'sandblaster', order: 1 }, { name: 'ایرفلو', slug: 'airflow-prostho', order: 2 },
        { name: 'میکروموتور', slug: 'micromotor-prostho', order: 3 },
      ]},
    ]},
    { name: 'اطفال و ارتودنسی', slug: 'pediatric-orthodontics', order: 9, children: [
      { name: 'اطفال', slug: 'pediatric', order: 1, children: [
        { name: 'مواد', slug: 'pediatric-materials', order: 1 }, { name: 'ابزار و تجهیزات', slug: 'pediatric-tools-equipment', order: 2 },
      ]},
      { name: 'ارتودنسی', slug: 'orthodontics', order: 2, children: [
        { name: 'پلایر', slug: 'plier', order: 1 }, { name: 'کاتر', slug: 'cutter', order: 2 },
        { name: 'براکت و وایر', slug: 'bracket-wire', order: 3 }, { name: 'سایر ابزار و مواد', slug: 'other-ortho-tools-materials', order: 4 },
      ]},
    ]},
    { name: 'مواد و تجهیزات عمومی', slug: 'general-materials-equipment', order: 10, children: [
      { name: 'کتاب و مدل آموزشی', slug: 'educational-books-models', order: 1, children: [
        { name: 'دنتیک', slug: 'dentic', order: 1 }, { name: 'کست', slug: 'cast', order: 2 },
        { name: 'کتاب', slug: 'dental-books', order: 3 }, { name: 'بلوک اندو', slug: 'endo-blocks', order: 4 },
        { name: 'هدفانتوم و کیت بخیه', slug: 'phantom-suture-kit', order: 5 }, { name: 'گچ و موم مورفولوژی', slug: 'plaster-wax-morphology', order: 6 },
      ]},
      { name: 'ابزار', slug: 'general-tools', order: 2, children: [
        { name: 'وسایل معاینه', slug: 'examination-tools', order: 1 }, { name: 'ظروف دندانپزشکی', slug: 'dental-containers', order: 2 },
        { name: 'دهان‌بازکن و فتوگرافی', slug: 'mouth-opener-photography', order: 3 }, { name: 'مولت و دیسک', slug: 'mandrel-disc', order: 4 },
        { name: 'ماسک و دستکش', slug: 'mask-gloves', order: 5 }, { name: 'شیلد و گان', slug: 'shield-gown', order: 6 },
        { name: 'سرسوزن و بخیه', slug: 'needle-suture', order: 7 },
      ]},
      { name: 'مواد', slug: 'general-materials', order: 3, children: [
        { name: 'یکبارمصرف', slug: 'disposables', order: 1 }, { name: 'ضدعفونی کننده', slug: 'disinfectant', order: 2 },
        { name: 'بیحسی', slug: 'anesthetic', order: 3 },
      ]},
      { name: 'لوپ و میکروسکوپ', slug: 'loupe-microscope', order: 4 }, { name: 'اکسسوری', slug: 'accessories', order: 5 },
    ]},
  ];

  function fmtCat(node: any, indent: number, isLast: boolean): string {
    const pad = '  '.repeat(indent);
    let s = `${pad}{\n`;
    s += `${pad}  name: '${node.name.replace(/'/g, "\\'")}',\n`;
    s += `${pad}  slug: '${node.slug}',\n`;
    s += `${pad}  order: ${node.order},\n`;
    if (node.children) {
      s += `${pad}  children: [\n`;
      node.children.forEach((c: any, i: number) => {
        s += fmtCat(c, indent + 2, i === node.children.length - 1);
        if (i < node.children.length - 1) s += ',';
        s += '\n';
      });
      s += `${pad}  ],\n`;
    }
    s += `${pad}}`;
    return s;
  }
  const catStr = categoryTree.map((c: any, i: number) => {
    const s = fmtCat(c, 1, i === categoryTree.length - 1);
    return i < categoryTree.length - 1 ? s + ',' : s;
  }).join('\n');

  function escVal(v: any): string {
    if (v === null || v === undefined) return 'null';
    if (typeof v === 'string') return `'${v.replace(/'/g, "\\'")}'`;
    if (typeof v === 'boolean') return v ? 'true' : 'false';
    return String(v);
  }

  const imagesByProduct = new Map<number, any[]>();
  for (const img of images) {
    if (!imagesByProduct.has(img.productId)) imagesByProduct.set(img.productId, []);
    imagesByProduct.get(img.productId)!.push(img);
  }

  const productLines: string[] = [];
  for (const p of products) {
    const catSlug = catSlugById.get(p.categoryId) || 'unknown';
    const brandName = brandNameById.get(p.brandId) || 'unknown';
    const entries = [
      `name: ${escVal(p.name)}`, `slug: ${escVal(p.slug)}`, `sku: ${escVal(p.sku)}`, `model: ${escVal(p.model)}`,
      `price: ${p.price}`, `priceType: ${escVal(p.priceType)}`, `availability: ${escVal(p.availability)}`, `specs: ${escVal(p.specs)}`,
      `discountPercent: ${p.discountPercent}`, `description: ${escVal(p.description)}`, `strengths: ${escVal(p.strengths)}`, `weaknesses: ${escVal(p.weaknesses)}`,
      `country: ${escVal(p.country)}`, `warranty: ${escVal(p.warranty)}`, `weight: ${escVal(p.weight)}`, `productType: ${escVal(p.productType)}`,
      `typeFields: ${escVal(p.typeFields)}`, `customSpecs: ${escVal(p.customSpecs)}`, `metaTitle: ${escVal(p.metaTitle)}`, `metaDescription: ${escVal(p.metaDescription)}`,
      `keywords: ${escVal(p.keywords)}`, `categorySlug: '${catSlug}'`, `brandName: '${brandName.replace(/'/g, "\\'")}'`,
      `order: ${p.order}`, `featured: ${p.featured}`, `visible: ${p.visible}`,
    ];
    const imgs = imagesByProduct.get(p.id);
    if (imgs && imgs.length > 0) {
      const imgStr = imgs.map(img =>
        `        { url: ${escVal(img.url)}, alt: ${escVal(img.alt)}, order: ${img.order} }`
      ).join(',\n');
      entries.push(`productImages: [\n${imgStr}\n      ]`);
    }
    productLines.push('    {\n      ' + entries.join(',\n      ') + '\n    }');
  }
  const productStr = productLines.join(',\n');

  const content = `process.env.LOG_LEVELS = 'error';
import { db } from '../src/lib/db';

// ============================================================
// CATEGORY STRUCTURE
// ============================================================

interface CatDef {
  name: string;
  slug: string;
  order: number;
  parentId?: number;
  children?: CatDef[];
}

const categoryTree: CatDef[] = [
${catStr}
];

// ============================================================
// BRANDS
// ============================================================

const brandDefs: { name: string; slug: string; logo: string | null; visible: boolean }[] = [
${brandLines}
];

// ============================================================
// PRODUCTS
// ============================================================

interface ProductDef {
  name: string;
  slug: string;
  sku: string | null;
  model: string | null;
  price: number | null;
  priceType: string;
  availability: string;
  specs: string | null;
  discountPercent: number;
  description: string | null;
  strengths: string | null;
  weaknesses: string | null;
  country: string | null;
  warranty: string | null;
  weight: string | null;
  productType: string | null;
  typeFields: string | null;
  customSpecs: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  keywords: string | null;
  categorySlug: string;
  brandName: string;
  order: number;
  featured: boolean;
  visible: boolean;
  productImages?: { url: string; alt: string | null; order: number }[];
}

const productDefs: ProductDef[] = [
 ${productStr}
];

async function seedCategories() {
  console.log('🌱 شروع seeding دسته‌بندی‌ها...');

  await db.productImage.deleteMany({});
  await db.product.deleteMany({});
  await db.category.deleteMany({});
  console.log('✓ دسته‌بندی‌های قبلی پاک شدند');

  const level1Data = categoryTree.map((cat) => ({
    name: cat.name,
    slug: cat.slug,
    order: cat.order,
  }));

  await db.category.createMany({ data: level1Data });
  console.log(\`✓ \${level1Data.length} دسته اصلی ساخته شد\`);

  const dbLevel1 = await db.category.findMany({ where: { parentId: null } });
  const level1Map = new Map(dbLevel1.map((c) => [c.slug, c.id]));

  const level2Data: any[] = [];
  for (const l1 of categoryTree) {
    const parentId = level1Map.get(l1.slug);
    if (parentId && l1.children) {
      for (const l2 of l1.children) {
        level2Data.push({
          name: l2.name,
          slug: l2.slug,
          order: l2.order,
          parentId,
        });
      }
    }
  }

  if (level2Data.length > 0) {
    await db.category.createMany({ data: level2Data });
    console.log(\`✓ \${level2Data.length} زیردسته سطح اول ساخته شد\`);
  }

  const dbLevel2 = await db.category.findMany({ where: { parentId: { not: null } } });
  const level2Map = new Map(dbLevel2.map((c) => [c.slug, c.id]));

  const level3Data: any[] = [];
  for (const l1 of categoryTree) {
    if (l1.children) {
      for (const l2 of l1.children) {
        const parentId = level2Map.get(l2.slug);
        if (parentId && l2.children) {
          for (const l3 of l2.children) {
            level3Data.push({
              name: l3.name,
              slug: l3.slug,
              order: l3.order,
              parentId,
            });
          }
        }
      }
    }
  }

  if (level3Data.length > 0) {
    await db.category.createMany({ data: level3Data });
    console.log(\`✓ \${level3Data.length} زیردسته سطح دوم ساخته شد\`);
  }

  const total = level1Data.length + level2Data.length + level3Data.length;
  console.log(\`✅ در مجموع \${total} دسته‌بندی با موفقیت و در ۳ کوئری ایجاد شد!\`);
}

async function seedBrands() {
  console.log('🌱 شروع seeding برندها...');
  await db.brand.deleteMany({});
  console.log('✓ برندهای قبلی پاک شدند');

  await db.brand.createMany({ data: brandDefs });
  console.log(\`✓ \${brandDefs.length} برند ساخته شد\`);
}

async function seedProducts() {
  console.log('🌱 شروع seeding محصولات...');
  await db.productImage.deleteMany({});
  await db.product.deleteMany({});
  console.log('✓ محصولات قبلی پاک شدند');

  const catSlugMap = new Map((await db.category.findMany()).map(c => [c.slug, c.id]));
  const brandNameMap = new Map((await db.brand.findMany()).map(b => [b.name, b.id]));

  for (const p of productDefs) {
    const { productImages, ...data } = p;
    const categoryId = catSlugMap.get(data.categorySlug);
    const brandId = brandNameMap.get(data.brandName);
    if (!categoryId) {
      console.warn(\`⚠️ دسته‌بندی پیدا نشد: \${data.categorySlug} برای محصول \${data.name}\`);
      continue;
    }
    if (!brandId) {
      console.warn(\`⚠️ برند پیدا نشد: \${data.brandName} برای محصول \${data.name}\`);
      continue;
    }
    const created = await db.product.create({
      data: { ...data, categoryId, brandId },
    });
    if (productImages && productImages.length > 0) {
      await db.productImage.createMany({
        data: productImages.map((img, idx) => ({
          ...img,
          productId: created.id,
          order: idx,
        })),
      });
    }
  }
  console.log(\`✓ \${productDefs.length} محصول ساخته شد\`);
}

seedCategories()
  .then(seedBrands)
  .then(seedProducts)
  .catch((e) => {
    console.error('❌ خطا در seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.\$disconnect();
  });
`;

  writeFileSync('/Users/arman._.gbg/Documents/Arman/Programming/mesadent-market/prisma/seed.ts', content);
  console.log('seed.ts written successfully, length:', content.length);
  await db.$disconnect();
}

main();
