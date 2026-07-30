import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

// Helper: resolve categoryId to include ALL descendants recursively
async function resolveCategoryIds(categoryId: number): Promise<number[]> {
  const children = await db.category.findMany({
    where: { parentId: categoryId },
    select: { id: true },
  });
  const ids = [categoryId];
  for (const child of children) {
    ids.push(...await resolveCategoryIds(child.id));
  }
  return ids;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '24');
  const categoryId = searchParams.get('categoryId');
  const brandId = searchParams.get('brandId');
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');
  const availability = searchParams.get('availability');
  const sort = searchParams.get('sort') || 'newest';
  const search = searchParams.get('search');
  const discounted = searchParams.get('discounted');
  const tagSlug = searchParams.get('tag');

  const where: Prisma.ProductWhereInput = {};

  if (categoryId) {
    const catId = parseInt(categoryId);
    const ids = await resolveCategoryIds(catId);
    where.categoryId = { in: ids };
  }
  if (brandId) {
    const ids = brandId.split(',').map(Number).filter(n => !isNaN(n));
    if (ids.length === 1) {
      where.brandId = ids[0];
    } else if (ids.length > 1) {
      where.brandId = { in: ids };
    }
  }
  const priceFilter: Prisma.IntNullableFilter = {};
  if (minPrice) priceFilter.gte = parseInt(minPrice);
  if (maxPrice) priceFilter.lte = parseInt(maxPrice);
  if (minPrice || maxPrice) where.price = priceFilter;
  if (availability) where.availability = availability;
  if (discounted === 'true') where.discountPercent = { gt: 0 };
  if (tagSlug) {
    where.tags = {
      some: { tag: { slug: tagSlug } }
    };
  }
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { model: { contains: search } },
      { sku: { contains: search } },
      { brand: { name: { contains: search } } },
    ];
  }

  let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' };
  if (sort === 'price-asc') orderBy = { price: 'asc' };
  else if (sort === 'price-desc') orderBy = { price: 'desc' };
  else if (sort === 'name') orderBy = { name: 'asc' };

  const skip = (page - 1) * limit;

  const [products, total] = await Promise.all([
    db.product.findMany({
      where,
      include: {
        brand: true,
        category: {
          include: { parent: { include: { parent: true } } }
        },
        images: {
          select: { id: true, url: true, alt: true, order: true },
          orderBy: { order: 'asc' },
          take: 1,
        },
        tags: {
          include: { tag: { select: { id: true, name: true, slug: true, type: true } } },
        },
      },
      orderBy,
      skip,
      take: limit,
    }),
    db.product.count({ where }),
  ]);

  return NextResponse.json({
    products,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}