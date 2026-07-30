import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

function toSlug(text: string): string {
  return text.trim().replace(/\s+/g, '-').replace(/[^a-zA-Z0-9\u0600-\u06FF-]/g, '').toLowerCase();
}

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'شناسه الزامی است' }, { status: 400 });
    }

    const body = await request.json();
    const { name, slug, order, parent_id } = body;

    const updateData: Prisma.CategoryUpdateInput = {};

    if (name !== undefined) updateData.name = name;
    if (slug !== undefined) updateData.slug = slug || toSlug(name);
    if (order !== undefined) updateData.order = order;
    if (parent_id !== undefined) {
      if (parent_id) {
        updateData.parent = { connect: { id: parseInt(parent_id) } };
      } else {
        updateData.parent = { disconnect: true };
      }
    }

    const category = await db.category.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    return NextResponse.json({ category });
  } catch (error: any) {
    console.error('Category update error:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'این slug قبلاً استفاده شده است' }, { status: 400 });
    }
    return NextResponse.json({ error: 'خطا در بروزرسانی دسته‌بندی' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'شناسه الزامی است' }, { status: 400 });
    }

    const categoryId = parseInt(id);

    const category = await db.category.findUnique({
      where: { id: categoryId },
      include: {
        _count: { select: { products: true, children: true } },
      },
    });

    if (!category) {
      return NextResponse.json({ error: 'دسته‌بندی یافت نشد' }, { status: 404 });
    }

    const hasChildren = category._count.children > 0;
    const hasProducts = category._count.products > 0;

    if (hasChildren || hasProducts) {
      return NextResponse.json({
        error: 'Cannot delete category with children or products',
        status: 400,
      });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Category delete error:', error);
    return NextResponse.json({ error: 'خطا در حذف دسته‌بندی' }, { status: 500 });
  }
}
