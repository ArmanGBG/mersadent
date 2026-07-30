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
    const categories = await db.blogCategory.findMany({
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { posts: true } } },
    });
    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Admin blog-categories error:', error);
    return NextResponse.json({ error: 'خطا در دریافت دسته‌بندی‌ها' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const err = await auth(request);
  if (err) return err;

  try {
    const { name, slug, description, order } = await request.json();
    if (!name) return NextResponse.json({ error: 'نام دسته‌بندی الزامی است' }, { status: 400 });

    const category = await db.blogCategory.create({
      data: {
        name,
        slug: slug || toSlug(name),
        description: description || null,
        order: order || 0,
      },
    });

    await logActivity('blog-category.create', `دسته بلاگ "${name}" ایجاد شد`);
    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error('Admin blog-category create error:', error);
    return NextResponse.json({ error: 'خطا در ایجاد دسته‌بندی' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const err = await auth(request);
  if (err) return err;

  try {
    const { id, name, slug, description, order } = await request.json();
    if (!id || !name) return NextResponse.json({ error: 'شناسه و نام الزامی هستند' }, { status: 400 });

    const category = await db.blogCategory.update({
      where: { id: parseInt(id) },
      data: { name, slug: slug || undefined, description: description ?? null, order: order ?? undefined },
    });

    await logActivity('blog-category.update', `دسته بلاگ "${name}" بروزرسانی شد`);
    return NextResponse.json({ category });
  } catch (error) {
    console.error('Admin blog-category update error:', error);
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

    const category = await db.blogCategory.findUnique({
      where: { id: parseInt(id) },
      include: { _count: { select: { posts: true } } },
    });

    if (!category) return NextResponse.json({ error: 'دسته‌بندی یافت نشد' }, { status: 404 });
    if (category._count.posts > 0) return NextResponse.json({ error: 'این دسته‌بندی دارای مقاله است و قابل حذف نیست' }, { status: 400 });

    await db.blogCategory.delete({ where: { id: parseInt(id) } });
    await logActivity('blog-category.delete', `دسته بلاگ "${category.name}" حذف شد`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin blog-category delete error:', error);
    return NextResponse.json({ error: 'خطا در حذف دسته‌بندی' }, { status: 500 });
  }
}