import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAdminToken, unauthorizedResponse, logActivity } from '@/lib/admin-auth';

function toSlug(text: string): string {
  return text.trim().replace(/\s+/g, '-').replace(/[^a-zA-Z0-9\u0600-\u06FF-]/g, '').toLowerCase();
}

async function auth(req: NextRequest) {
  const payload = await verifyAdminToken(req);
  if (payload) return null;
  return unauthorizedResponse();
}

export async function GET(request: NextRequest) {
  const err = await auth(request);
  if (err) return err;

  try {
    const brands = await db.brand.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { products: true } } },
    });
    return NextResponse.json({ brands });
  } catch (error) {
    console.error('Admin brands error:', error);
    return NextResponse.json({ error: 'خطا در دریافت برندها' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const err = await auth(request);
  if (err) return err;

  try {
    const { name, slug, visible } = await request.json();
    if (!name) return NextResponse.json({ error: 'نام برند الزامی است' }, { status: 400 });

    const brand = await db.brand.create({
      data: { name, slug: slug || toSlug(name), visible: visible ?? true },
    });

    await logActivity('brand.create', `برند "${name}" ایجاد شد`);
    return NextResponse.json({ brand }, { status: 201 });
  } catch (error) {
    console.error('Admin brand create error:', error);
    return NextResponse.json({ error: 'خطا در ایجاد برند' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const err = await auth(request);
  if (err) return err;

  try {
    const { id, name, slug, logo, visible } = await request.json();
    if (!id || !name) return NextResponse.json({ error: 'شناسه و نام الزامی هستند' }, { status: 400 });

    const brand = await db.brand.update({
      where: { id: parseInt(id) },
      data: {
        name,
        slug: slug || undefined,
        logo: logo !== undefined ? logo : undefined,
        visible: visible !== undefined ? visible : undefined,
      },
    });

    await logActivity('brand.update', `برند "${name}" بروزرسانی شد`);
    return NextResponse.json({ brand });
  } catch (error) {
    console.error('Admin brand update error:', error);
    return NextResponse.json({ error: 'خطا در بروزرسانی برند' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const err = await auth(request);
  if (err) return err;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'شناسه الزامی است' }, { status: 400 });

    const brand = await db.brand.findUnique({
      where: { id: parseInt(id) },
      include: { _count: { select: { products: true } } },
    });

    if (!brand) return NextResponse.json({ error: 'برند یافت نشد' }, { status: 404 });
    if (brand._count.products > 0) return NextResponse.json({ error: 'این برند دارای محصول است و قابل حذف نیست' }, { status: 400 });

    await db.brand.delete({ where: { id: parseInt(id) } });
    await logActivity('brand.delete', `برند "${brand.name}" حذف شد`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin brand delete error:', error);
    return NextResponse.json({ error: 'خطا در حذف برند' }, { status: 500 });
  }
}