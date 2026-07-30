import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Public endpoint: returns storefront-relevant settings (contact info + socials).
// Only whitelisted keys are exposed — admin-only / hero_slide_* keys are NOT returned here.
const PUBLIC_KEYS = [
  'site_name',
  'site_description',
  'phone',
  'email',
  'address',
  'instagram',
  'telegram',
  'whatsapp',
  'enamad_code',
] as const;

const DEFAULTS: Record<string, string> = {
  site_name: 'MersaDent',
  site_description: 'تأمین‌کننده انواع تجهیزات و مواد مصرفی دندانپزشکی',
  phone: '',
  email: '',
  address: '',
  instagram: '',
  telegram: '',
  whatsapp: '',
  enamad_code: '',
};

// Always fetch fresh from DB so admin changes appear immediately on the storefront.
// (The query is tiny — a single table with ~8 rows — so this is cheap.)
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const rows = await db.siteSetting.findMany({
      where: { key: { in: PUBLIC_KEYS as unknown as string[] } },
      select: { key: true, value: true },
    });

    const result: Record<string, string> = { ...DEFAULTS };
    for (const r of rows) {
      result[r.key] = r.value ?? '';
    }

    return NextResponse.json(
      { settings: result },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (error) {
    console.error('Public settings error:', error);
    return NextResponse.json({ settings: DEFAULTS });
  }
}
