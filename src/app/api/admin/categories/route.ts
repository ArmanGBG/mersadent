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

// Recursively collect a category and all its descendants
async function collectDescendants(categoryId: number): Promise<number[]> {
  const ids = [categoryId];
  const children = await db.category.findMany({
    where: { parentId: categoryId },
    select: { id: true },
  });
  for (const child of children) {
    ids.push(...await collectDescendants(child.id));
  }
  return ids;
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
          include: {
            children: {
              orderBy: [{ order: 'asc' }, { name: 'asc' }],
              include: { _count: { select: { products: true } } },
            },
            _count: { select: { products: true } },
          },
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
    const { name, slug, parentId, visible } = await request.json();
    if (!name) return NextResponse.json({ error: 'نام دسته‌بندی الزامی است' }, { status: 400 });

    // Determine the next order at this level
    const siblings = await db.category.findMany({
      where: { parentId: parentId ? parseInt(parentId) : null },
      select: { order: true },
    });
    const nextOrder = siblings.length > 0 ? Math.max(...siblings.map(s => s.order)) + 1 : 0;

    const categorySlug = slug || toSlug(name);
    const category = await db.category.create({
      data: {
        name,
        slug: categorySlug,
        parentId: parentId ? parseInt(parentId) : null,
        order: nextOrder,
        visible: visible !== undefined ? !!visible : true,
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
    const body = await request.json();
    const { id, name, slug, parentId, visible } = body;
    if (!id) return NextResponse.json({ error: 'شناسه الزامی است' }, { status: 400 });

    const categoryId = parseInt(id);
    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (slug !== undefined) updateData.slug = slug || undefined;
    if (parentId !== undefined) {
      updateData.parentId = parentId ? parseInt(parentId) : null;
    }

    // Handle visibility cascade
    if (visible !== undefined) {
      updateData.visible = !!visible;
      const descIds = await collectDescendants(categoryId);
      // Exclude the category itself (will be updated below)
      const childIds = descIds.filter(x => x !== categoryId);
      if (childIds.length > 0) {
        // Cascade the same visibility to all descendants
        await db.category.updateMany({
          where: { id: { in: childIds } },
          data: { visible: !!visible },
        });
      }
    }

    const category = await db.category.update({
      where: { id: categoryId },
      data: updateData,
    });

    await logActivity(
      'category.update',
      `دسته‌بندی "${name || category.name}" بروزرسانی شد`
    );
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

// PATCH: reorder categories via drag-and-drop.
// Body: { items: [{ id, order, parentId }] }
export async function PATCH(request: NextRequest) {
  const err = await auth(request);
  if (err) return err;

  try {
    const { items } = await request.json();
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'آیتم‌ها الزامی است' }, { status: 400 });
    }

    // Use a transaction to update all orders atomically
    await db.$transaction(
      items.map((item: { id: number; order: number; parentId?: number | null }) =>
        db.category.update({
          where: { id: parseInt(String(item.id)) },
          data: {
            order: parseInt(String(item.order)),
            ...(item.parentId !== undefined
              ? { parentId: item.parentId ? parseInt(String(item.parentId)) : null }
              : {}),
          },
        })
      )
    );

    await logActivity('category.reorder', 'ترتیب دسته‌بندی‌ها تغییر کرد');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin category reorder error:', error);
    return NextResponse.json({ error: 'خطا در تغییر ترتیب' }, { status: 500 });
  }
}
