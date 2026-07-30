import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    let limit = parseInt(searchParams.get('limit') || '10');
    if (isNaN(limit)) limit = 10;

    if (!q.trim()) return NextResponse.json({ results: [] });

    const products = await db.product.findMany({
      where: {
        OR: [
          { name: { contains: q } },
          { model: { contains: q } },
          { brand: { name: { contains: q } } },
          { category: { name: { contains: q } } },
        ],
      },
      include: { brand: true, category: true },
      take: limit,
      orderBy: [{ featured: 'desc' }, { price: 'desc' }],
    });

    const results = products.map((p) => ({
      id: p.id,
      name: p.name,
      brand: p.brand.name,
      brandSlug: p.brand.slug,
      category: p.category.name,
      categorySlug: p.category.slug,
      price: p.price,
      priceType: p.priceType,
      availability: p.availability,
      model: p.model,
      featured: p.featured,
      country: p.country,
      sku: p.sku,
    }));

    return NextResponse.json({ results, query: q });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 });
  }
}