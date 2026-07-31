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
    const brandIdRaw = formData.get('brandId');

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

    const brandId = brandIdRaw ? parseInt(String(brandIdRaw)) : null;
    const isSvg = file.type === 'image/svg+xml';

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Save with a UUID-based filename. SVGs are saved as-is; everything else is
    // resized to 400x400 and converted to webp.
    let urlPath: string;
    if (isSvg) {
      urlPath = await saveUploadWithExt('brands', 'svg', buffer);
    } else {
      urlPath = await saveSharpOutput('brands', 'webp', (fullPath) =>
        sharp(buffer)
          .resize({ width: 400, height: 400, fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 85 })
          .toFile(fullPath)
      );
    }

    // If brandId provided, persist the logo URL to the DB and delete the
    // previous logo file if it was one of ours (avoid orphans).
    if (brandId && !Number.isNaN(brandId)) {
      const existing = await db.brand.findUnique({ where: { id: brandId } });
      if (existing) {
        if (isOurUpload(existing.logo)) {
          await deleteUpload(existing.logo);
        }
        await db.brand.update({
          where: { id: brandId },
          data: { logo: urlPath },
        });
      }
    }

    await logActivity('brand.logo.upload', `لوگوی برند آپلود شد`, payload.sub);

    return NextResponse.json({ url: urlPath });
  } catch (error) {
    console.error('Brand logo upload error:', error);
    return NextResponse.json({ error: 'خطا در آپلود لوگو' }, { status: 500 });
  }
}
