import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const products = await db.product.findMany({
      where: { featured: true },
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
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    return NextResponse.json(products);
  } catch (error) {
    console.error('Featured products error:', error);
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 });
  }
}