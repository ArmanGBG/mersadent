import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';
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
    const { searchParams } = new URL(request.url);
    const flat = searchParams.get('flat') === 'true';

    if (flat) {
      const categories = await db.category.findMany({
        orderBy: [{ order: 'asc' }, { name: 'asc' }],
        include: { _count: { select: { products: true, children: true } } },
      });
      return NextResponse.json({ categories });
    }

    const parents = await db.category.findMany({
      where: { parentId: null },
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
      include: {
        children: {
          orderBy: [{ order: 'asc' }, { name: 'asc' }],
          include: { _count: { select: { products: true } } },
        },
        _count: { select: { products: true } },
      },
    });

    return NextResponse.json({ categories: parents });
  } catch (error) {
    console.error('Admin categories error:', error);
    return NextResponse.json({ error: 'خطا در دریافت دسته‌بندی‌ها' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const err = await auth(request);
  if (err) return err;

  try {
    const { name, slug, parentId, order } = await request.json();
    if (!name) return NextResponse.json({ error: 'نام دسته‌بندی الزامی است' }, { status: 400 });

    const categorySlug = slug || toSlug(name);
    const category = await db.category.create({
      data: {
        name,
        slug: categorySlug,
        parentId: parentId ? parseInt(parentId) : null,
        order: order || 0,
      },
    });

    await logActivity('category.create', `دسته‌بندی "${name}" ایجاد شد`);
    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error('Admin category create error:', error);
    return NextResponse.json({ error: 'خطا در ایجاد دسته‌بندی' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const err = await auth(request);
  if (err) return err;

  try {
    const { id, name, slug, parentId, order } = await request.json();
    if (!id || !name) return NextResponse.json({ error: 'شناسه و نام الزامی هستند' }, { status: 400 });

    const category = await db.category.update({
      where: { id: parseInt(id) },
      data: {
        name,
        slug: slug || undefined,
        parentId: parentId !== undefined ? (parentId ? parseInt(parentId) : null) : undefined,
        order: order ?? undefined,
      },
    });

    await logActivity('category.update', `دسته‌بندی "${name}" بروزرسانی شد`);
    return NextResponse.json({ category });
  } catch (error) {
    console.error('Admin category update error:', error);
    return NextResponse.json({ error: 'خطا در بروزرسانی دسته‌بندی' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const err = await auth(request);
  if (err) return err;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'شناسه الزامی است' }, { status: 400 });

    const category = await db.category.findUnique({
      where: { id: parseInt(id) },
      include: { _count: { select: { products: true, children: true } } },
    });

    if (!category) return NextResponse.json({ error: 'دسته‌بندی یافت نشد' }, { status: 404 });
    if (category._count.products > 0) return NextResponse.json({ error: 'این دسته‌بندی دارای محصول است و قابل حذف نیست' }, { status: 400 });
    if (category._count.children > 0) return NextResponse.json({ error: 'این دسته‌بندی دارای زیردسته است و قابل حذف نیست' }, { status: 400 });

    await db.category.delete({ where: { id: parseInt(id) } });
    await logActivity('category.delete', `دسته‌بندی "${category.name}" حذف شد`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin category delete error:', error);
    return NextResponse.json({ error: 'خطا در حذف دسته‌بندی' }, { status: 500 });
  }
}