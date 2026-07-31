import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAdminToken, unauthorizedResponse, logActivity } from '@/lib/admin-auth';
import { saveSharpOutput, saveUploadWithExt, ALLOWED_IMAGE_TYPES, isOurUpload, deleteUpload } from '@/lib/storage';
import sharp from 'sharp';

const MAX_SIZE = 2 * 1024 * 1024; // 2MB

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
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
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

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Save with a UUID-based filename. SVGs are saved as-is; everything else is
    // resized to 600x600 and converted to webp.
    let urlPath: string;
    if (isSvg) {
      urlPath = await saveUploadWithExt('categories', 'svg', buffer);
    } else {
      urlPath = await saveSharpOutput('categories', 'webp', (fullPath) =>
        sharp(buffer)
          .resize({ width: 600, height: 600, fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 85 })
          .toFile(fullPath)
      );
    }

    // If categoryId provided (edit mode), persist the image URL to the DB and
    // delete the previous image file if it was one of ours (avoid orphans).
    if (categoryId && !Number.isNaN(categoryId)) {
      const existing = await db.category.findUnique({ where: { id: categoryId } });
      if (existing) {
        if (isOurUpload(existing.image)) {
          await deleteUpload(existing.image);
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
