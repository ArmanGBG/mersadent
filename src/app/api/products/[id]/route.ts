import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = await db.product.findUnique({
      where: { id: parseInt(id) },
      include: {
        brand: true,
        category: { include: { parent: true } },
        images: {
          select: { id: true, url: true, alt: true, order: true },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'محصول یافت نشد' }, { status: 404 });
    }

    // Get similar products (same category, different id) with first image
    const similar = await db.product.findMany({
      where: {
        categoryId: product.categoryId,
        id: { not: product.id },
      },
      include: {
        brand: true,
        images: {
          select: { id: true, url: true, alt: true, order: true },
          orderBy: { order: 'asc' },
          take: 1,
        },
      },
      take: 8,
      orderBy: { featured: 'desc' },
    });

    return NextResponse.json({ product, similar });
  } catch (error) {
    console.error('Product detail error:', error);
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 });
  }
}