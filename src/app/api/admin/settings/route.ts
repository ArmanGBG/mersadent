import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAdminToken, unauthorizedResponse, logActivity } from '@/lib/admin-auth';

const DEFAULT_SETTINGS: Record<string, string> = {
  site_name: 'آرکا مرصاد',
  site_description: 'تأمین‌کننده تجهیزات دندانپزشکی',
  phone: '۰۲۱-۸۸۷۷۶۶۵۵',
  email: 'info@mersadent.com',
  address: 'تهران، خیابان ولیعصر',
  instagram: '',
  telegram: '',
  whatsapp: '',
  enamad_code: '',
  hero_slide_1_title: 'یونیت دندانپزشکی',
  hero_slide_1_subtitle: 'بهترین برندهای یونیت با گارانتی اصالت و قیمت مناسب',
  hero_slide_1_image: '/hero-slide-1.png',
  hero_slide_1_link: '',
  hero_slide_2_title: 'تجهیزات دیجیتال',
  hero_slide_2_subtitle: 'اسکنر، سنسور و تجهیزات دیجیتال دندانپزشکی',
  hero_slide_2_image: '/hero-slide-2.png',
  hero_slide_2_link: '',
  hero_slide_3_title: 'سرویس و تعمیرات',
  hero_slide_3_subtitle: 'تعمیر تخصصی تمامی تجهیزات دندانپزشکی توسط تیم متخصص',
  hero_slide_3_image: '/hero-slide-3.png',
  hero_slide_3_link: '',
  hero_slide_4_title: 'تجهیزات دندانپزشکی پیشرفته',
  hero_slide_4_subtitle: 'کیفیت و تکنولوژی برای سلامت دهان و دندان',
  hero_slide_4_image: '/hero-slide-4.png',
  hero_slide_4_link: '',
};

async function auth(req: NextRequest) {
  const payload = await verifyAdminToken(req);
  if (payload) return null;
  return unauthorizedResponse();
}

export async function GET(request: NextRequest) {
  const err = await auth(request);
  if (err) return err;

  try {
    const settings = await db.siteSetting.findMany();
    const result: Record<string, string> = { ...DEFAULT_SETTINGS };
    for (const s of settings) {
      result[s.key] = s.value;
    }
    return NextResponse.json({ settings: result });
  } catch (error) {
    console.error('Admin settings error:', error);
    return NextResponse.json({ error: 'خطا در دریافت تنظیمات' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const err = await auth(request);
  if (err) return err;

  try {
    const { settings } = await request.json();
    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ error: 'تنظیمات نامعتبر' }, { status: 400 });
    }

    for (const [key, value] of Object.entries(settings)) {
      await db.siteSetting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      });
    }

    await logActivity('settings.update', 'تنظیمات سایت بروزرسانی شد');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin settings update error:', error);
    return NextResponse.json({ error: 'خطا در بروزرسانی تنظیمات' }, { status: 500 });
  }
}