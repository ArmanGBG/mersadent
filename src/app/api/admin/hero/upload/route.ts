import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken, unauthorizedResponse, logActivity } from '@/lib/admin-auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

const MAX_SIZE = 4 * 1024 * 1024; // 4MB (hero images are larger than logos)
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml', 'image/gif'];

export async function POST(request: NextRequest) {
  const payload = await verifyAdminToken(request);
  if (!payload) return unauthorizedResponse();

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const slideNumRaw = formData.get('slide');

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'فایلی ارسال نشده است' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
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

    const slideNum = slideNumRaw ? parseInt(String(slideNumRaw)) : null;
    const isSvg = file.type === 'image/svg+xml';

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'hero');
    await mkdir(uploadsDir, { recursive: true });

    const timestamp = Date.now();
    const idPart = slideNum && !Number.isNaN(slideNum) ? `slide-${slideNum}` : `temp-${timestamp}`;
    const urlPath = `/uploads/hero/hero-${idPart}-${timestamp}.${isSvg ? 'svg' : 'webp'}`;
    const fullPath = path.join(uploadsDir, path.basename(urlPath));

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (isSvg) {
      await writeFile(fullPath, buffer);
    } else {
      // Hero images are wide banners — resize to max 1920px wide, convert to webp
      await sharp(buffer)
        .resize({ width: 1920, height: 1080, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 82 })
        .toFile(fullPath);
    }

    await logActivity('hero.image.upload', `تصویر اسلایدشو آپلود شد`, payload.sub);

    return NextResponse.json({ url: urlPath });
  } catch (error) {
    console.error('Hero image upload error:', error);
    return NextResponse.json({ error: 'خطا در آپلود تصویر' }, { status: 500 });
  }
}
