import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { verifyAdminToken, unauthorizedResponse, logActivity } from '@/lib/admin-auth';

function toSlug(text: string): string {
  return text.trim().replace(/\s+/g, '-').replace(/[^a-zA-Z0-9\u0600-\u06FF-]/g, '').toLowerCase();
}

// Helper for auth check
async function auth(req: NextRequest) {
  const payload = await verifyAdminToken(req);
  if (!payload) return unauthorizedResponse();
  return null;
}

export async function GET(request: NextRequest) {
  const err = await auth(request);
  if (err) return err;

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const q = searchParams.get('q') || '';

    const where: Prisma.ProductWhereInput = {};
    if (q) {
      where.OR = [
        { name: { contains: q } },
        { model: { contains: q } },
        { brand: { name: { contains: q } } },
        { category: { name: { contains: q } } },
      ];
    }

    const skip = (page - 1) * limit;

    const [products, total, stats] = await Promise.all([
      db.product.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          brand: { select: { id: true, name: true, slug: true } },
          _count: { select: { images: true } },
          tags: { include: { tag: { select: { id: true, name: true, slug: true, type: true } } } },
        },
        orderBy: { id: 'desc' },
        skip,
        take: limit,
      }),
      db.product.count({ where }),
      Promise.all([
        db.product.count(),
        db.product.count({ where: { images: { some: {} } } }),
        db.productImage.count(),
        db.product.count({ where: { featured: true } }),
        db.product.count({ where: { availability: 'out_of_stock' } }),
      ]),
    ]);

    return NextResponse.json({
      products,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      stats: {
        totalProducts: stats[0],
        productsWithImages: stats[1],
        totalImages: stats[2],
        featuredProducts: stats[3],
        outOfStock: stats[4],
      },
    });
  } catch (error) {
    console.error('Admin products list error:', error);
    return NextResponse.json({ error: 'خطا در دریافت محصولات' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const err = await auth(request);
  if (err) return err;

  try {
    const body = await request.json();
    const { name, slug, model, price, priceType, availability, specs, categoryId, brandId, featured, visible, order, discountPercent, description, strengths, weaknesses, metaTitle, metaDescription, keywords, sku, country, warranty, weight, lowStock, tagIds } = body;

    if (!name || !categoryId || !brandId) {
      return NextResponse.json({ error: 'نام، دسته‌بندی و برند الزامی هستند' }, { status: 400 });
    }

    const productSlug = slug || toSlug(name);

    const product = await db.product.create({
      data: {
        name,
        slug: productSlug,
        model: model || null,
        sku: sku || null,
        country: country || null,
        warranty: warranty || null,
        weight: weight || null,
        lowStock: lowStock !== undefined ? parseInt(lowStock) : 0,
        price: price !== null && price !== undefined && price !== '' ? parseInt(price) : null,
        priceType: priceType || 'fixed',
        availability: availability || 'in_stock',
        specs: specs || null,
        categoryId: parseInt(categoryId),
        brandId: parseInt(brandId),
        featured: !!featured,
        visible: visible !== undefined ? !!visible : true,
        order: order || 0,
        discountPercent: discountPercent !== undefined && discountPercent !== '' ? parseFloat(discountPercent) : 0,
        description: description || null,
        strengths: strengths || null,
        weaknesses: weaknesses || null,
        metaTitle: metaTitle || null,
        metaDescription: metaDescription || null,
        keywords: keywords || null,
        tags: tagIds && Array.isArray(tagIds) && tagIds.length > 0 ? {
          create: tagIds.map((tagId: number) => ({ tagId })),
        } : undefined,
      },
      include: { category: true, brand: true, tags: { include: { tag: { select: { id: true, name: true, slug: true } } } } },
    });

    await logActivity('product.create', `محصول "${name}" ایجاد شد`);

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error('Admin product create error:', error);
    return NextResponse.json({ error: 'خطا در ایجاد محصول' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const err = await auth(request);
  if (err) return err;

  try {
    const body = await request.json();
    const { id, name, slug, model, price, priceType, availability, specs, featured, visible, categoryId, brandId, order, discountPercent, description, strengths, weaknesses, metaTitle, metaDescription, keywords, sku, country, warranty, weight, lowStock, tagIds } = body;

    if (!id || !name) {
      return NextResponse.json({ error: 'نام محصول الزامی است' }, { status: 400 });
    }

    const updateData: Prisma.ProductUpdateInput = {
      name,
      slug: slug || undefined,
      model: model ?? null,
      sku: sku !== undefined ? (sku || null) : undefined,
      country: country !== undefined ? (country || null) : undefined,
      warranty: warranty !== undefined ? (warranty || null) : undefined,
      weight: weight !== undefined ? (weight || null) : undefined,
      lowStock: lowStock !== undefined ? parseInt(lowStock) : undefined,
      price: price !== null && price !== undefined ? (price === '' ? null : parseInt(price)) : undefined,
      priceType: priceType || 'fixed',
      availability: availability || 'in_stock',
      specs: specs ?? null,
      featured: !!featured,
      visible: visible !== undefined ? !!visible : undefined,
      order: order ?? undefined,
      discountPercent: discountPercent !== undefined && discountPercent !== '' ? parseFloat(discountPercent) : 0,
      description: description !== undefined ? (description || null) : undefined,
      strengths: strengths !== undefined ? (strengths || null) : undefined,
      weaknesses: weaknesses !== undefined ? (weaknesses || null) : undefined,
      metaTitle: metaTitle !== undefined ? (metaTitle || null) : undefined,
      metaDescription: metaDescription !== undefined ? (metaDescription || null) : undefined,
      keywords: keywords !== undefined ? (keywords || null) : undefined,
    };

    if (categoryId) updateData.category = { connect: { id: parseInt(categoryId) } };
    if (brandId) updateData.brand = { connect: { id: parseInt(brandId) } };

    // Handle tag updates: delete old + create new
    if (tagIds !== undefined && Array.isArray(tagIds)) {
      await db.productTag.deleteMany({ where: { productId: parseInt(id) } });
      if (tagIds.length > 0) {
        updateData.tags = {
          create: tagIds.map((tagId: number) => ({ tagId })),
        };
      }
    }

    const product = await db.product.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: { category: true, brand: true, tags: { include: { tag: { select: { id: true, name: true, slug: true } } } } },
    });

    await logActivity('product.update', `محصول "${name}" بروزرسانی شد`);

    return NextResponse.json({ product });
  } catch (error) {
    console.error('Admin product update error:', error);
    return NextResponse.json({ error: 'خطا در بروزرسانی محصول' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const err = await auth(request);
  if (err) return err;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'شناسه محصول الزامی است' }, { status: 400 });
    }

    const product = await db.product.findUnique({
      where: { id: parseInt(id) },
      include: { images: true },
    });

    if (!product) {
      return NextResponse.json({ error: 'محصول یافت نشد' }, { status: 404 });
    }

    // Delete image files
    const { unlink, readdir, rmdir } = await import('fs/promises');
    const path = await import('path');
    for (const img of product.images) {
      try {
        const filepath = path.join(process.cwd(), 'public', img.url);
        await unlink(filepath);
        const dir = path.dirname(filepath);
        const files = await readdir(dir);
        if (files.length === 0) await rmdir(dir);
      } catch { /* ignore */ }
    }

    await db.product.delete({ where: { id: parseInt(id) } });
    await logActivity('product.delete', `محصول "${product.name}" حذف شد`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin product delete error:', error);
    return NextResponse.json({ error: 'خطا در حذف محصول' }, { status: 500 });
  }
}