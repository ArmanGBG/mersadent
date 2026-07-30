import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAdminToken, unauthorizedResponse, logActivity } from '@/lib/admin-auth';

async function auth(req: NextRequest) {
  const payload = await verifyAdminToken(req);
  if (!payload) return unauthorizedResponse();
  return null;
}

// Default countries seeded on first access so the dropdown is never empty.
const DEFAULT_COUNTRIES = [
  'ایران', 'چین', 'آلمان', 'آمریکا', 'ژاپن', 'کره جنوبی', 'سوئیس',
  'فرانسه', 'ایتالیا', 'برزیل', 'تایوان', 'انگلیس', 'هلند', 'سوئد',
];

async function ensureSeeded() {
  const count = await db.country.count();
  if (count === 0) {
    await db.country.createMany({
      data: DEFAULT_COUNTRIES.map((name, i) => ({ name, order: i })),
    });
  }
}

export async function GET(request: NextRequest) {
  const err = await auth(request);
  if (err) return err;

  try {
    await ensureSeeded();
    const countries = await db.country.findMany({ orderBy: [{ order: 'asc' }, { name: 'asc' }] });
    return NextResponse.json({ countries });
  } catch (error) {
    console.error('Admin countries error:', error);
    return NextResponse.json({ error: 'خطا در دریافت کشورها' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const err = await auth(request);
  if (err) return err;

  try {
    const { name } = await request.json();
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'نام کشور الزامی است' }, { status: 400 });
    }
    const trimmed = name.trim();
    if (!trimmed) {
      return NextResponse.json({ error: 'نام کشور الزامی است' }, { status: 400 });
    }

    // Idempotent: if it already exists, return it.
    const existing = await db.country.findUnique({ where: { name: trimmed } });
    if (existing) {
      return NextResponse.json({ country: existing });
    }

    const country = await db.country.create({ data: { name: trimmed } });
    await logActivity('country.create', `کشور "${trimmed}" ایجاد شد`);
    return NextResponse.json({ country }, { status: 201 });
  } catch (error) {
    console.error('Admin country create error:', error);
    return NextResponse.json({ error: 'خطا در ایجاد کشور' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const err = await auth(request);
  if (err) return err;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'شناسه الزامی است' }, { status: 400 });

    const country = await db.country.findUnique({ where: { id: parseInt(id) } });
    if (!country) return NextResponse.json({ error: 'کشور یافت نشد' }, { status: 404 });

    await db.country.delete({ where: { id: parseInt(id) } });
    await logActivity('country.delete', `کشور "${country.name}" حذف شد`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin country delete error:', error);
    return NextResponse.json({ error: 'خطا در حذف کشور' }, { status: 500 });
  }
}
