/**
 * Parses the raw text output from the MersaDent super-prompt
 * and extracts structured product data.
 *
 * All logic runs client-side — no API call needed.
 */

export interface ParsedProductData {
  productName: string;
  brandName: string;
  description: string;
  strengths: string[];
  weaknesses: string[];
  metaTitle: string;
  metaDescription: string;
  keywords: string;
}

// Section header patterns
const SECTION_PATTERNS: { pattern: RegExp; key: string }[] = [
  { pattern: /^[\s]*نقاط\s+قوت[\s:：]*$/i, key: 'strengths' },
  { pattern: /^[\s]*نقاط\s+ضعف[\s:：]*$/i, key: 'weaknesses' },
  { pattern: /^[\s]*توضیحات\s+کلی[\s:：]*$/i, key: 'description' },
  { pattern: /^[\s]*توضیحات[\s:：]*$/i, key: 'description' },
  { pattern: /^[\s]*مزایا[\s:：]*$/i, key: 'strengths' },
  { pattern: /^[\s]*معایب[\s:：]*$/i, key: 'weaknesses' },
];

// Product name patterns
const NAME_PATTERNS = [
  /^[\s]*(?:نام\s+محصول|نام|محصول)[\s:：]+\s*(.+)/i,
  /^[\s]*#[\s]*(.+)/,
  /^[\s]*\*[\s]*(.+)/,
];

// Brand patterns
const BRAND_PATTERNS = [
  /^[\s]*(?:برند|شرکت|نام\s+برند)[\s:：]+\s*(.+)/i,
];

/** Check if a line is a bullet point item */
function isBulletLine(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed === '') return false;
  // Starts with -, •, *, or a number followed by . or ) or -
  return /^[-•*]/.test(trimmed) || /^\d+[.)\-]/.test(trimmed);
}

/** Strip bullet prefix from a line */
function stripBullet(line: string): string {
  return line
    .trim()
    .replace(/^[-•*]\s*/, '')
    .replace(/^\d+[.)\-]\s*/, '')
    .trim();
}

/** Extract key terms from Persian text for keywords */
function extractKeywords(text: string, brandName: string, productName: string): string {
  const keywords = new Set<string>();

  // Add brand
  if (brandName) keywords.add(brandName.trim());

  // Add product name words (longer than 2 chars)
  const nameWords = productName.split(/\s+/).filter(w => w.length > 2);
  nameWords.forEach(w => keywords.add(w.trim()));

  // Common dental terms to extract
  const dentalTerms = [
    'دندانپزشکی', 'اندو', 'یونیت', 'کمپرسور', 'ساکشن', 'استریلایزر',
    'اتوکلاو', 'تصویربرداری', 'رادیوگرافی', 'ایمپلنت', 'جراحی',
    'لایت کیور', 'آموزگار', 'میکروسکوپ', 'لیزر', 'ترمیمی',
    'موندل', 'اگزپلورر', 'فایل', 'گوتا پرچا', 'سیالنت',
    'کامپوزیت', 'باندینگ', 'قالب‌گیری', 'پلیمر', 'آمالگام',
    'آمپول', 'سرنگ', 'دستکش', 'ماسک', 'دیسپوزابل',
    'مرصادنت', 'آرکا مرصاد',
  ];

  for (const term of dentalTerms) {
    if (text.includes(term)) keywords.add(term);
  }

  // Always add these
  keywords.add('دندانپزشکی');
  keywords.add('مرصادنت');

  return Array.from(keywords).filter(k => k.length > 1).join('، ');
}

export function parseSuperPrompt(text: string): ParsedProductData {
  const lines = text.split('\n');

  let productName = '';
  let brandName = '';
  let strengths: string[] = [];
  let weaknesses: string[] = [];
  let description = '';

  let currentSection: string | null = null; // 'strengths' | 'weaknesses' | 'description' | null
  let descriptionLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines in most cases (but preserve for description paragraphs)
    if (trimmed === '') {
      if (currentSection === 'description') {
        // Only add blank line if we already have content (to separate paragraphs)
        if (descriptionLines.length > 0 && descriptionLines[descriptionLines.length - 1] !== '') {
          descriptionLines.push('');
        }
      }
      continue;
    }

    // Check for product name patterns (only before we've found a section)
    if (!currentSection && !productName) {
      for (const pat of NAME_PATTERNS) {
        const match = trimmed.match(pat);
        if (match) {
          productName = match[1].trim().replace(/^["'«]|["'»]$/g, '');
          break;
        }
      }
    }

    // Check for brand patterns (only before we've found a section)
    if (!currentSection && !brandName) {
      for (const pat of BRAND_PATTERNS) {
        const match = trimmed.match(pat);
        if (match) {
          brandName = match[1].trim().replace(/^["'«]|["'»]$/g, '');
          break;
        }
      }
    }

    // Check for section headers
    let matchedSection = false;
    for (const sp of SECTION_PATTERNS) {
      if (sp.pattern.test(trimmed)) {
        // If switching sections, finalize previous
        if (currentSection === 'description') {
          description = descriptionLines.join('\n').trim();
          descriptionLines = [];
        }
        currentSection = sp.key;
        matchedSection = true;
        break;
      }
    }

    if (matchedSection) continue;

    // If we're in a list section, collect items
    if (currentSection === 'strengths' || currentSection === 'weaknesses') {
      // Check if this line starts a new section (already handled above, but double check)
      const isSectionHeader = SECTION_PATTERNS.some(sp => sp.pattern.test(trimmed));
      if (isSectionHeader) continue;

      if (isBulletLine(trimmed)) {
        const item = stripBullet(trimmed);
        if (item.length > 0) {
          if (currentSection === 'strengths') {
            strengths.push(item);
          } else {
            weaknesses.push(item);
          }
        }
      } else if (/^[^\d\-\•\*]/.test(trimmed)) {
        // Non-bullet, non-empty line that doesn't start with bullet chars
        // Treat as a plain list item (some outputs don't use bullets)
        // But check if it's a new section header
        const isHeader = SECTION_PATTERNS.some(sp => sp.pattern.test(trimmed));
        if (!isHeader && trimmed.length > 1) {
          if (currentSection === 'strengths') {
            strengths.push(trimmed);
          } else {
            weaknesses.push(trimmed);
          }
        }
      }
    } else if (currentSection === 'description') {
      // Collect all non-section-header lines as description
      const isHeader = SECTION_PATTERNS.some(sp => sp.pattern.test(trimmed));
      if (!isHeader) {
        descriptionLines.push(trimmed);
      }
    }
  }

  // Finalize description if we were still in that section
  if (currentSection === 'description' && descriptionLines.length > 0) {
    description = descriptionLines.join('\n').trim();
  }

  // Clean up description - remove trailing/leading empty lines
  description = description.replace(/\n{3,}/g, '\n\n').trim();

  // If no description was found in a dedicated section, try to use the first paragraph
  // that isn't a section header, name, or brand
  if (!description) {
    for (const line of lines) {
      const t = line.trim();
      if (t.length < 20) continue;
      const isHeader = SECTION_PATTERNS.some(sp => sp.pattern.test(t));
      const isName = NAME_PATTERNS.some(p => p.test(t));
      const isBrand = BRAND_PATTERNS.some(p => p.test(t));
      if (!isHeader && !isName && !isBrand && !isBulletLine(t)) {
        description = t;
        break;
      }
    }
  }

  // If no productName found, try to get it from the first meaningful line
  if (!productName) {
    for (const line of lines) {
      const t = line.trim();
      if (t.length > 3 && t.length < 200) {
        const isHeader = SECTION_PATTERNS.some(sp => sp.pattern.test(t));
        if (!isHeader && !isBulletLine(t) && !t.match(/^[a-zA-Z0-9\s\.\-]+$/)) {
          productName = t.replace(/^["'«#*]|["'»]$/g, '').trim();
          break;
        }
      }
    }
  }

  // Auto-generate metaTitle
  const metaTitle = [productName, brandName, 'مرصادنت']
    .filter(Boolean)
    .join(' | ');

  // Auto-generate metaDescription (first 150 chars of description)
  const plainDesc = description.replace(/<[^>]*>/g, '').replace(/\n/g, ' ').trim();
  const metaDescription = plainDesc.length > 150
    ? plainDesc.substring(0, 150) + '...'
    : plainDesc;

  // Auto-generate keywords
  const keywords = extractKeywords(text, brandName, productName);

  return {
    productName,
    brandName,
    description,
    strengths,
    weaknesses,
    metaTitle,
    metaDescription,
    keywords,
  };
}