import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAdminToken, unauthorizedResponse } from '@/lib/admin-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = await verifyAdminToken(request);
  if (!payload) return unauthorizedResponse();

  try {
    const { id } = await params;
    const product = await db.product.findUnique({
      where: { id: parseInt(id) },
      include: {
        category: true,
        brand: true,
        images: { orderBy: { order: 'asc' } },
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'محصول یافت نشد' }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error('Admin product detail error:', error);
    return NextResponse.json({ error: 'خطا در دریافت محصول' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = await verifyAdminToken(request);
  if (!payload) return unauthorizedResponse();

  try {
    const { id } = await params;
    const body = await request.json();
    const { name, slug, model, price, priceType, availability, specs, featured, categoryId, brandId, order, description, strengths, weaknesses, metaTitle, metaDescription, keywords } = body;

    if (!name) {
      return NextResponse.json({ error: 'نام محصول الزامی است' }, { status: 400 });
    }

    const updateData: any = { name, model: model ?? null, priceType: priceType || 'fixed', availability: availability || 'in_stock', specs: specs ?? null, featured: !!featured };
    if (price !== undefined) updateData.price = price === '' ? null : parseInt(price);
    if (slug !== undefined) updateData.slug = slug;
    if (categoryId !== undefined) updateData.categoryId = parseInt(categoryId);
    if (brandId !== undefined) updateData.brandId = parseInt(brandId);
    if (order !== undefined) updateData.order = parseInt(order);
    if (description !== undefined) updateData.description = description || null;
    if (strengths !== undefined) updateData.strengths = strengths || null;
    if (weaknesses !== undefined) updateData.weaknesses = weaknesses || null;
    if (metaTitle !== undefined) updateData.metaTitle = metaTitle || null;
    if (metaDescription !== undefined) updateData.metaDescription = metaDescription || null;
    if (keywords !== undefined) updateData.keywords = keywords || null;

    const product = await db.product.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: { category: true, brand: true, images: { orderBy: { order: 'asc' } } },
    });

    return NextResponse.json({ product });
  } catch (error) {
    console.error('Admin product update error:', error);
    return NextResponse.json({ error: 'خطا در بروزرسانی محصول' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = await verifyAdminToken(request);
  if (!payload) return unauthorizedResponse();

  try {
    const { id } = await params;
    const product = await db.product.findUnique({
      where: { id: parseInt(id) },
      include: { images: true },
    });

    if (!product) {
      return NextResponse.json({ error: 'محصول یافت نشد' }, { status: 404 });
    }

    const { unlink, readdir, rmdir } = await import('fs/promises');
    const path = await import('path');
    for (const img of product.images) {
      try {
        const filepath = path.join(process.cwd(), 'public', img.url);
        await unlink(filepath);
      } catch { /* ignore */ }
    }

    await db.product.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin product delete error:', error);
    return NextResponse.json({ error: 'خطا در حذف محصول' }, { status: 500 });
  }
}