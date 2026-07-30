import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Public endpoint: returns the hero slideshow slides configured by the admin.
// Reads SiteSetting rows for hero_slide_N_title / _subtitle / _image / _link.
const DEFAULT_HERO: { title: string; subtitle: string; image: string; link: string }[] = [
  {
    title: 'یونیت دندانپزشکی',
    subtitle: 'بهترین برندهای یونیت با گارانتی اصالت و قیمت مناسب',
    image: '/hero-slide-1.png',
    link: '',
  },
  {
    title: 'تجهیزات دیجیتال',
    subtitle: 'اسکنر، سنسور و تجهیزات دیجیتال دندانپزشکی',
    image: '/hero-slide-2.png',
    link: '',
  },
  {
    title: 'سرویس و تعمیرات',
    subtitle: 'تعمیر تخصصی تمامی تجهیزات دندانپزشکی توسط تیم متخصص',
    image: '/hero-slide-3.png',
    link: '',
  },
  {
    title: 'تجهیزات دندانپزشکی پیشرفته',
    subtitle: 'کیفیت و تکنولوژی برای سلامت دهان و دندان',
    image: '/hero-slide-4.png',
    link: '',
  },
];

export async function GET() {
  try {
    const settings = await db.siteSetting.findMany({
      where: { key: { startsWith: 'hero_slide_' } },
    });

    const map = new Map<string, string>();
    for (const s of settings) map.set(s.key, s.value);

    // Determine how many slides are configured (max 4)
    const slides = DEFAULT_HERO.map((def, i) => {
      const n = i + 1;
      const title = map.get(`hero_slide_${n}_title`) ?? def.title;
      const subtitle = map.get(`hero_slide_${n}_subtitle`) ?? def.subtitle;
      const image = map.get(`hero_slide_${n}_image`) ?? def.image;
      const link = map.get(`hero_slide_${n}_link`) ?? '';
      return { title, subtitle, image, link };
    });

    // Filter out slides with empty image or empty title (so admins can reduce the count)
    const active = slides.filter(s => s.title && s.image);

    return NextResponse.json({ slides: active });
  } catch (error) {
    console.error('Public hero API error:', error);
    return NextResponse.json({ slides: DEFAULT_HERO });
  }
}
