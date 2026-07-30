import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

// Helper: resolve categoryId to include all child categories
async function resolveCategoryIds(categoryId: number): Promise<number[]> {
  const children = await db.category.findMany({
    where: { parentId: categoryId },
    select: { id: true },
  });
  if (children.length > 0) {
    return [categoryId, ...children.map(c => c.id)];
  }
  return [categoryId];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    // If "all" is passed, return all brands (for filter sidebar)
    const all = searchParams.get('all');

    let where: Prisma.BrandWhereInput = {};

    if (categoryId) {
      const catId = parseInt(categoryId);
      if (isNaN(catId)) return NextResponse.json([]);
      const ids = await resolveCategoryIds(catId);
      where.products = { some: { categoryId: { in: ids } } };
    }

    // On the brands showcase page, only show visible brands
    // When filtering products by brand, show all brands that have products in that category
    if (!categoryId && !all) {
      where.visible = true;
    }

    const brands = await db.brand.findMany({
      where,
      include: { _count: { select: { products: true } } },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(brands);
  } catch (error) {
    console.error('Brands error:', error);
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 });
  }
}