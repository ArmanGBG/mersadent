import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { unlink, readdir } from 'fs/promises';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = parseInt(id);
    if (isNaN(productId)) {
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = parseInt(id);
    if (isNaN(productId)) {
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

    // Delete file from disk
    const filepath = path.join(process.cwd(), 'public', image.url);
    try {
      await unlink(filepath);
    } catch {
      // File might not exist, that's ok
    }

    // Clean up empty directory
    try {
      const dir = path.dirname(filepath);
      const files = await readdir(dir);
      if (files.length === 0) {
        await (await import('fs/promises')).rmdir(dir);
      }
    } catch {
      // Ignore directory cleanup errors
    }

    // Delete DB record
    await db.productImage.delete({ where: { id: image.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete image error:', error);
    return NextResponse.json({ error: 'خطا در حذف تصویر' }, { status: 500 });
  }
}