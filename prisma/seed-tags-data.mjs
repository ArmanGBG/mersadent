/**
 * Smart Seed Script: Auto-populate tags, SKUs, country, warranty for products
 * Based on acodent.shop patterns adapted for MersaDent dental equipment store
 */
import Database from 'better-sqlite3';
const db = new Database('db/custom.db');

// ============================================================
// 1. BRAND → COUNTRY MAPPING
// ============================================================
const brandCountryMap = {
  'COXO': 'چین',
  'Eighteeth': 'چین',
  'Woodpecker': 'چین',
  'Goldent': 'چین',
  'SD': 'چین',
  'Micro NX': 'چین',
  'Marathon': 'کره جنوبی',
  'Wj Medical': 'چین',
  'AVICO': 'ایران',
  'ATRICO': 'ایران',
  'DENTUS': 'ایران',
  'Karen': 'چین',
  'SUN': 'چین',
  'NewLife': 'چین',
  'Owandy': 'فرانسه',
  'Castellini': 'ایتالیا',
  'Euronda': 'ایتالیا',
  'DiaDent': 'کره جنوبی',
  'DTE': 'تایوان',
  'Tech Win': 'کره جنوبی',
  'Codyson': 'چین',
  'Faraz': 'ایران',
  'FIAD': 'ایتالیا',
  'FOMOS': 'چین',
  'PROX': 'چین',
  'REMEDY': 'چین',
  'REMEDİ': 'چین',
  'SAMAN': 'ایران',
  'Senator': 'چین',
  'YUWELL': 'چین',
  'ZEMER': 'چین',
  'STS': 'ایران',
  'DANVILLE': 'آمریکا',
  'Air Techniques': 'آمریکا',
  'Aseptico': 'آمریکا',
  '4U': 'چین',
  'Corpus Vac': 'ایتالیا',
  'Dempex': 'آلمان',
  'Dentex': 'ایران',
  'JD200': 'چین',
  'Kevin Peter': 'پاکستان',
  'Malin': 'پاکستان',
  'Max Seal': 'آمریکا',
  'META': 'آلمان',
  'عاج طب': 'ایران',
  'آریان': 'ایران',
  'بارلی': 'ایران',
  'تکنوگاز': 'ایران',
  'سپهر دنتال': 'ایران',
  'نوردیسکا': 'ایران',
  'وسون': 'ایران',
  'پارس': 'ایران',
  'پارس دنتال': 'ایران',
  'پارس طب': 'ایران',
  'generic': 'نامشخص',
};

// ============================================================
// 2. CATEGORY → WARRANTY MAPPING
// ============================================================
const categoryWarranty = {
  'یونیت': '۱ سال گارانتی شرکتی',
  'تجهیزات ایمپلنت و جراحی': '۱ سال گارانتی',
  'تجهیزات دیجیتال': '۱ سال گارانتی',
  'تصویربرداری': '۱ سال گارانتی',
  'تجهیزات اندو': '۶ ماه گارانتی',
  'کمپرسور و ساکشن': '۱ سال گارانتی',
  'تجهیزات استریل': '۱ سال گارانتی',
  'تجهیزات ترمیمی': '۶ ماه گارانتی',
  'اینسترومنت‌ها': '۶ ماه گارانتی',
  'تجهیزات جانبی': '۶ ماه گارانتی',
};

// ============================================================
// 3. TAGS DEFINITION (based on acodent.shop patterns)
// ============================================================
const tagsData = [
  // --- Consumable tags ---
  { name: 'مصرفی', slug: 'consumable', type: 'consumable', order: 1 },
  { name: 'غیر مصرفی', slug: 'non-consumable', type: 'consumable', order: 2 },

  // --- Feature tags ---
  { name: 'ضد آب', slug: 'waterproof', type: 'feature', order: 10 },
  { name: 'بی‌سیم', slug: 'wireless', type: 'feature', order: 11 },
  { name: 'پرتابل', slug: 'portable', type: 'feature', order: 12 },
  { name: 'دیجیتال', slug: 'digital', type: 'feature', order: 13 },
  { name: 'LED', slug: 'led', type: 'feature', order: 14 },
  { name: 'خودکار', slug: 'automatic', type: 'feature', order: 15 },
  { name: 'هدایت‌شونده', slug: 'guided', type: 'feature', order: 16 },
  { name: 'اقتصادی', slug: 'budget', type: 'feature', order: 17 },
  { name: 'حرفه‌ای', slug: 'professional', type: 'feature', order: 18 },
  { name: 'صنعتی', slug: 'industrial', type: 'feature', order: 19 },
  { name: 'دستی', slug: 'manual', type: 'feature', order: 20 },
  { name: 'برقی', slug: 'electric', type: 'feature', order: 21 },
  { name: 'باتری‌خور', slug: 'battery-powered', type: 'feature', order: 22 },
  { name: 'دارای صفحه نمایش', slug: 'has-display', type: 'feature', order: 23 },
  { name: 'قابل شارژ', slug: 'rechargeable', type: 'feature', order: 24 },

  // --- Badge tags ---
  { name: 'پرفروش', slug: 'bestseller', type: 'badge', order: 30 },
  { name: 'جدید', slug: 'new', type: 'badge', order: 31 },
  { name: 'ویژه', slug: 'special', type: 'badge', order: 32 },
  { name: 'اورجینال', slug: 'original', type: 'badge', order: 33 },
  { name: 'ساخت ایران', slug: 'made-in-iran', type: 'badge', order: 34 },
  { name: 'ساخت چین', slug: 'made-in-china', type: 'badge', order: 35 },
  { name: 'ساخت کره', slug: 'made-in-korea', type: 'badge', order: 36 },
  { name: 'ساخت ایتالیا', slug: 'made-in-italy', type: 'badge', order: 37 },
  { name: 'ساخت آلمان', slug: 'made-in-germany', type: 'badge', order: 38 },
  { name: 'ساخت فرانسه', slug: 'made-in-france', type: 'badge', order: 39 },
  { name: 'ساخت آمریکا', slug: 'made-in-usa', type: 'badge', order: 40 },
  { name: 'ساخت تایوان', slug: 'made-in-taiwan', type: 'badge', order: 41 },
  { name: 'ساخت پاکستان', slug: 'made-in-pakistan', type: 'badge', order: 42 },

  // --- General / Usage tags ---
  { name: 'مناسب مطب', slug: 'clinic-use', type: 'general', order: 50 },
  { name: 'مناسب آزمایشگاه', slug: 'lab-use', type: 'general', order: 51 },
  { name: 'مناسب جراحی', slug: 'surgical-use', type: 'general', order: 52 },
  { name: 'مناسب اندو', slug: 'endo-use', type: 'general', order: 53 },
  { name: 'مناسب ارتودنسی', slug: 'ortho-use', type: 'general', order: 54 },
  { name: 'مناسب ترمیم', slug: 'restorative-use', type: 'general', order: 55 },
  { name: 'مناسب جراحی لثه', slug: 'periodontal-use', type: 'general', order: 56 },
  { name: 'مناسب پروتز', slug: 'prosthodontic-use', type: 'general', order: 57 },
  { name: 'استاندارد', slug: 'standard', type: 'general', order: 58 },
  { name: 'لوکس', slug: 'luxury', type: 'general', order: 59 },
  { name: 'کم‌حجم', slug: 'compact', type: 'general', order: 60 },
  { name: 'سایلنت', slug: 'silent', type: 'general', order: 61 },
  { name: 'قدرتمند', slug: 'powerful', type: 'general', order: 62 },
  { name: 'سبک', slug: 'lightweight', type: 'general', order: 63 },
];

// ============================================================
// 4. CATEGORY → TAGS AUTO-ASSIGNMENT RULES
// ============================================================
// Maps product name/category keywords to tag slugs
const keywordToTags = [
  { keywords: ['پرتابل', 'پرتابل'], tags: ['portable', 'compact'] },
  { keywords: ['دیجیتال', 'Digital'], tags: ['digital'] },
  { keywords: ['LED', 'led'], tags: ['led'] },
  { keywords: ['بی‌سیم', 'وایرلس', 'وایر لس', 'wireless'], tags: ['wireless'] },
  { keywords: ['باتری', 'شارژ', 'Charge'], tags: ['battery-powered', 'rechargeable'] },
  { keywords: ['خودکار', 'اتوماتیک', 'Auto'], tags: ['automatic'] },
  { keywords: ['دستی', 'Manual'], tags: ['manual'] },
  { keywords: ['برقی', 'Electric'], tags: ['electric'] },
  { keywords: ['صنایع', 'صنعتی'], tags: ['industrial'] },
  { keywords: ['اقتصادی', 'ارزان'], tags: ['budget'] },
  { keywords: ['حرفه‌ای', 'پرو', 'Pro'], tags: ['professional'] },
  { keywords: ['سایلنت', 'Silent'], tags: ['silent'] },
  { keywords: ['ضد آب', 'Waterproof'], tags: ['waterproof'] },
  { keywords: ['صفحه نمایش', 'LCD', 'نمایشگر'], tags: ['has-display'] },
  { keywords: ['قدرتمند', 'Power'], tags: ['powerful'] },
  { keywords: ['سبک', 'Lightweight'], tags: ['lightweight'] },
  { keywords: ['لوکس', 'Luxury', 'VIP', ' vip'], tags: ['luxury'] },
  { keywords: ['استاندارد', 'Standard'], tags: ['standard'] },
  { keywords: ['پروتز', 'Prostho'], tags: ['prosthodontic-use'] },
  { keywords: ['ارتودنسی', 'Ortho'], tags: ['ortho-use'] },
  { keywords: ['جراحی', 'Surgical', 'جراحی لثه'], tags: ['surgical-use'] },
  { keywords: ['آزمایشگاه', 'Lab'], tags: ['lab-use'] },
  { keywords: ['اندو', 'Endo'], tags: ['endo-use'] },
  { keywords: ['ترمیم', 'Restor', 'کامپوزیت'], tags: ['restorative-use'] },
];

// Category root → default tags
const rootCategoryDefaultTags = {
  'یونیت': ['clinic-use', 'non-consumable', 'professional'],
  'تجهیزات ایمپلنت و جراحی': ['surgical-use', 'non-consumable', 'professional'],
  'تجهیزات دیجیتال': ['digital', 'clinic-use', 'non-consumable'],
  'تصویربرداری': ['digital', 'clinic-use', 'non-consumable', 'professional'],
  'تجهیزات اندو': ['endo-use', 'non-consumable', 'professional'],
  'کمپرسور و ساکشن': ['clinic-use', 'non-consumable', 'powerful'],
  'تجهیزات استریل': ['clinic-use', 'non-consumable'],
  'تجهیزات ترمیمی': ['restorative-use', 'non-consumable'],
  'اینسترومنت‌ها': ['non-consumable'],
  'تجهیزات جانبی': ['clinic-use', 'non-consumable'],
};

// ============================================================
// HELPER: Generate SKU
// ============================================================
function generateSKU(brand, category, product, productId) {
  // Brand prefix (first 2-3 uppercase letters)
  const brandPrefix = brand.name
    .replace(/[^a-zA-Z0-9آ-ی]/g, '')
    .substring(0, 3)
    .toUpperCase();

  // Category prefix
  const catPrefix = category.name
    .replace(/[^a-zA-Z0-9آ-ی]/g, '')
    .substring(0, 3);

  // Use existing model from product name if possible
  let modelPart = '';
  const modelMatch = product.name.match(/(?:model|مدل)?\s*([A-Z]{2,}[0-9]+[A-Z]*)/i);
  if (modelMatch) {
    modelPart = modelMatch[1].replace(/\s/g, '').toUpperCase();
  }

  if (modelPart) {
    return `${brandPrefix}-${modelPart}`;
  }
  return `MD-${String(productId).padStart(4, '0')}`;
}

// ============================================================
// HELPER: Get root category name
// ============================================================
function getRootCategoryName(db, categoryId) {
  let cat = db.prepare('SELECT id, name, parentId FROM Category WHERE id = ?').get(categoryId);
  if (!cat) return '';
  while (cat.parentId) {
    cat = db.prepare('SELECT id, name, parentId FROM Category WHERE id = ?').get(cat.parentId);
    if (!cat) break;
  }
  return cat ? cat.name : '';
}

// ============================================================
// MAIN EXECUTION
// ============================================================
console.log('=== Starting Smart Seed ===\n');

// --- STEP 1: Create Tags ---
console.log('Step 1: Creating tags...');
const insertTag = db.prepare('INSERT OR IGNORE INTO Tag (name, slug, type, "order") VALUES (?, ?, ?, ?)');
const tagSlugToId = {};

for (const tag of tagsData) {
  const result = insertTag.run(tag.name, tag.slug, tag.type, tag.order);
  if (result.changes > 0) {
    console.log('  + Tag:', tag.name, `(${tag.type})`);
  }
  // Get the ID
  const row = db.prepare('SELECT id FROM Tag WHERE slug = ?').get(tag.slug);
  tagSlugToId[tag.slug] = row.id;
}
console.log('  Total tags:', Object.keys(tagSlugToId).length);

// --- STEP 2: Update Products with SKU, Country, Warranty ---
console.log('\nStep 2: Updating products with SKU, country, warranty...');
const products = db.prepare(`
  SELECT p.id, p.name, p.sku, p.country, p.warranty, p.categoryId, p.brandId,
         c.name as catName, b.name as brandName
  FROM Product p
  JOIN Category c ON p.categoryId = c.id
  JOIN Brand b ON p.brandId = b.id
`).all();

const updateProduct = db.prepare(`
  UPDATE Product SET sku = ?, country = ?, warranty = ? WHERE id = ?
`);

let skuCount = 0, countryCount = 0, warrantyCount = 0;

for (const p of products) {
  let sku = p.sku;
  let country = p.country;
  let warranty = p.warranty;

  // Generate SKU if missing
  if (!sku) {
    sku = generateSKU({ name: p.brandName }, { name: p.catName }, { name: p.name }, p.id);
    skuCount++;
  }

  // Set country if missing
  if (!country) {
    country = brandCountryMap[p.brandName] || 'نامشخص';
    if (country !== 'نامشخص') countryCount++;
  }

  // Set warranty if missing
  if (!warranty) {
    const rootCat = getRootCategoryName(db, p.categoryId);
    warranty = categoryWarranty[rootCat] || '۶ ماه گارانتی';
    warrantyCount++;
  }

  updateProduct.run(sku, country, warranty, p.id);
}

console.log('  Products updated with SKU:', skuCount);
console.log('  Products updated with country:', countryCount);
console.log('  Products updated with warranty:', warrantyCount);

// --- STEP 3: Assign Tags to Products ---
console.log('\nStep 3: Assigning tags to products...');
const insertProductTag = db.prepare('INSERT OR IGNORE INTO ProductTag ("productId", "tagId") VALUES (?, ?)');
let totalTagAssignments = 0;

for (const p of products) {
  const assignedSlugs = new Set();

  // A. Country badge
  const country = db.prepare('SELECT country FROM Product WHERE id = ?').get(p.id).country;
  const countryBadgeMap = {
    'ایران': 'made-in-iran',
    'چین': 'made-in-china',
    'کره جنوبی': 'made-in-korea',
    'ایتالیا': 'made-in-italy',
    'آلمان': 'made-in-germany',
    'فرانسه': 'made-in-france',
    'آمریکا': 'made-in-usa',
    'تایوان': 'made-in-taiwan',
    'پاکستان': 'made-in-pakistan',
  };
  if (countryBadgeMap[country]) {
    assignedSlugs.add(countryBadgeMap[country]);
  }

  // B. Root category default tags
  const rootCat = getRootCategoryName(db, p.categoryId);
  const defaultTags = rootCategoryDefaultTags[rootCat] || [];
  defaultTags.forEach(t => assignedSlugs.add(t));

  // C. Keyword-based tags from product name
  for (const rule of keywordToTags) {
    for (const kw of rule.keywords) {
      if (p.name.includes(kw)) {
        rule.tags.forEach(t => assignedSlugs.add(t));
        break;
      }
    }
  }

  // D. Featured products get "bestseller" tag
  const featured = db.prepare('SELECT featured FROM Product WHERE id = ?').get(p.id).featured;
  if (featured) {
    assignedSlugs.add('bestseller');
  }

  // E. Original tag for non-generic brands
  if (p.brandName !== 'generic') {
    assignedSlugs.add('original');
  }

  // Insert all assigned tags
  for (const slug of assignedSlugs) {
    const tagId = tagSlugToId[slug];
    if (tagId) {
      insertProductTag.run(p.id, tagId);
      totalTagAssignments++;
    }
  }
}

console.log('  Total tag assignments:', totalTagAssignments);

// --- Verification ---
console.log('\n=== VERIFICATION ===');
const vTags = db.prepare('SELECT COUNT(*) as c FROM Tag').get();
console.log('Tags in DB:', vTags.c);
const vPT = db.prepare('SELECT COUNT(*) as c FROM ProductTag').get();
console.log('ProductTag relations:', vPT.c);
const vSku = db.prepare('SELECT COUNT(*) as c FROM Product WHERE sku IS NOT NULL').get();
console.log('Products with SKU:', vSku.c);
const vCountry = db.prepare('SELECT COUNT(*) as c FROM Product WHERE country IS NOT NULL').get();
console.log('Products with country:', vCountry.c);
const vWarranty = db.prepare('SELECT COUNT(*) as c FROM Product WHERE warranty IS NOT NULL').get();
console.log('Products with warranty:', vWarranty.c);

// Show tag distribution
console.log('\n=== TOP 15 TAGS BY USAGE ===');
const tagUsage = db.prepare(`
  SELECT t.name, t.type, COUNT(pt."productId") as cnt
  FROM Tag t
  LEFT JOIN ProductTag pt ON t.id = pt."tagId"
  GROUP BY t.id
  ORDER BY cnt DESC
  LIMIT 15
`).all();
tagUsage.forEach(t => console.log(`  ${t.name.padEnd(20)} (${t.type.padEnd(12)}) ${t.cnt} products`));

// Show sample product
console.log('\n=== SAMPLE UPDATED PRODUCT ===');
const sample = db.prepare(`
  SELECT p.id, p.name, p.sku, p.country, p.warranty,
    GROUP_CONCAT(t.name, '، ') as tags
  FROM Product p
  LEFT JOIN ProductTag pt ON p.id = pt."productId"
  LEFT JOIN Tag t ON pt."tagId" = t.id
  GROUP BY p.id
  LIMIT 3
`).all();
sample.forEach(s => console.log(`  ${s.name} | SKU: ${s.sku} | ${s.country} | ${s.warranty} | Tags: ${s.tags}`));

db.close();
console.log('\n=== Seed Complete ===');
