import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAdminToken, unauthorizedResponse, logActivity } from '@/lib/admin-auth';
import { saveSharpOutput, saveUploadWithExt, ALLOWED_IMAGE_TYPES, deleteUpload, isOurUpload } from '@/lib/storage';
import sharp from 'sharp';

const MAX_SIZE = 4 * 1024 * 1024; // 4MB per product image

// GET: list all images for a product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = parseInt(id);
    if (Number.isNaN(productId)) {
      return NextResponse.json({ error: 'شناسه نامعتبر' }, { status: 400 });
    }

    const images = await db.productImage.findMany({
      where: { productId },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json({ images });
  } catch (error) {
    console.error('Get images error:', error);
    return NextResponse.json({ error: 'خطا در دریافت تصاویر' }, { status: 500 });
  }
}

// POST: upload a new image for a product (UUID-based filename, sharp-optimized)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = await verifyAdminToken(request);
  if (!payload) return unauthorizedResponse();

  try {
    const { id } = await params;
    const productId = parseInt(id);
    if (Number.isNaN(productId)) {
      return NextResponse.json({ error: 'شناسه محصول نامعتبر' }, { status: 400 });
    }

    // Ensure the product exists
    const product = await db.product.findUnique({ where: { id: productId } });
    if (!product) {
      return NextResponse.json({ error: 'محصول یافت نشد' }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'فایلی ارسال نشده است' }, { status: 400 });
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'فرمت فایل مجاز نیست. فقط PNG, JPG, WebP, SVG, GIF' },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'حجم فایل نباید بیشتر از ۴ مگابایت باشد' },
        { status: 400 }
      );
    }

    const isSvg = file.type === 'image/svg+xml';
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Save with a UUID-based filename. SVGs are saved as-is; everything else is
    // resized to max 1200x1200 (preserve aspect, no upscale) and converted to webp.
    let urlPath: string;
    if (isSvg) {
      urlPath = await saveUploadWithExt('products', 'svg', buffer);
    } else {
      urlPath = await saveSharpOutput('products', 'webp', (fullPath) =>
        sharp(buffer)
          .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 85 })
          .toFile(fullPath)
      );
    }

    // Compute the next order value for this product's images
    const lastImage = await db.productImage.findFirst({
      where: { productId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    const nextOrder = (lastImage?.order ?? -1) + 1;

    const image = await db.productImage.create({
      data: {
        productId,
        url: urlPath,
        order: nextOrder,
      },
    });

    await logActivity('product.image.upload', `تصویر برای محصول "${product.name}" آپلود شد`, payload.sub);

    return NextResponse.json({ image }, { status: 201 });
  } catch (error) {
    console.error('Product image upload error:', error);
    return NextResponse.json({ error: 'خطا در آپلود تصویر محصول' }, { status: 500 });
  }
}

// DELETE: remove a specific image (both file on disk and DB record)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = await verifyAdminToken(request);
  if (!payload) return unauthorizedResponse();

  try {
    const { id } = await params;
    const productId = parseInt(id);
    if (Number.isNaN(productId)) {
      return NextResponse.json({ error: 'شناسه نامعتبر' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const imageId = searchParams.get('imageId');
    if (!imageId) {
      return NextResponse.json({ error: 'شناسه تصویر ارسال نشده' }, { status: 400 });
    }

    const image = await db.productImage.findFirst({
      where: { id: parseInt(imageId), productId },
    });

    if (!image) {
      return NextResponse.json({ error: 'تصویر یافت نشد' }, { status: 404 });
    }

    // Delete the file from disk (only if it's one of ours)
    if (isOurUpload(image.url)) {
      await deleteUpload(image.url);
    }

    // Delete the DB record
    await db.productImage.delete({ where: { id: image.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete image error:', error);
    return NextResponse.json({ error: 'خطا در حذف تصویر' }, { status: 500 });
  }
}
