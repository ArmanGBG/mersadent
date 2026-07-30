import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAdminToken, unauthorizedResponse, logActivity } from '@/lib/admin-auth';
import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

const MAX_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml', 'image/gif'];

export async function POST(request: NextRequest) {
  // Auth check (FormData request — read token from Authorization header)
  const payload = await verifyAdminToken(request);
  if (!payload) return unauthorizedResponse();

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const categoryIdRaw = formData.get('categoryId');

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'فایلی ارسال نشده است' }, { status: 400 });
    }

    // Validate mime type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'فرمت فایل مجاز نیست. فقط PNG, JPG, WebP, SVG, GIF' },
        { status: 400 }
      );
    }

    // Validate size
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'حجم فایل نباید بیشتر از ۲ مگابایت باشد' },
        { status: 400 }
      );
    }

    const categoryId = categoryIdRaw ? parseInt(String(categoryIdRaw)) : null;
    const isSvg = file.type === 'image/svg+xml';

    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'categories');
    await mkdir(uploadsDir, { recursive: true });

    const timestamp = Date.now();
    const idPart = categoryId && !Number.isNaN(categoryId) ? String(categoryId) : `temp-${timestamp}`;
    const urlPath = `/uploads/categories/cat-${idPart}-${timestamp}.${isSvg ? 'svg' : 'webp'}`;
    const fullPath = path.join(uploadsDir, path.basename(urlPath));

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (isSvg) {
      // Save SVG as-is (sharp can't process SVG well)
      await writeFile(fullPath, buffer);
    } else {
      // Optimize with sharp: resize to max 600px square (category logos are shown in round-ish tiles)
      await sharp(buffer)
        .resize({ width: 600, height: 600, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 85 })
        .toFile(fullPath);
    }

    // If categoryId provided (edit mode), persist the image URL to the DB and delete the previous image
    if (categoryId && !Number.isNaN(categoryId)) {
      const existing = await db.category.findUnique({ where: { id: categoryId } });
      if (existing) {
        // Delete the previous image file if it was one of ours
        if (existing.image && existing.image.startsWith('/uploads/categories/')) {
          const oldPath = path.join(process.cwd(), 'public', existing.image);
          try {
            await unlink(oldPath);
          } catch {
            // ignore — file may already be gone
          }
        }
        await db.category.update({
          where: { id: categoryId },
          data: { image: urlPath },
        });
      }
    }

    await logActivity('category.image.upload', `تصویر دسته‌بندی آپلود شد`, payload.sub);

    return NextResponse.json({ url: urlPath });
  } catch (error) {
    console.error('Category image upload error:', error);
    return NextResponse.json({ error: 'خطا در آپلود تصویر' }, { status: 500 });
  }
}
