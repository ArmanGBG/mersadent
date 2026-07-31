import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken, unauthorizedResponse, logActivity } from '@/lib/admin-auth';
import { saveSharpOutput, saveUploadWithExt, ALLOWED_IMAGE_TYPES, isOurUpload, deleteUpload } from '@/lib/storage';
import sharp from 'sharp';

const MAX_SIZE = 4 * 1024 * 1024; // 4MB (hero images are larger than logos)

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

    const slideNum = slideNumRaw ? parseInt(String(slideNumRaw)) : null;
    const isSvg = file.type === 'image/svg+xml';

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate a UUID-based filename via the storage utility.
    // SVGs are saved as-is; everything else is resized to 1920x1080 and converted to webp.
    let urlPath: string;
    if (isSvg) {
      urlPath = await saveUploadWithExt('hero', 'svg', buffer);
    } else {
      urlPath = await saveSharpOutput('hero', 'webp', (fullPath) =>
        sharp(buffer)
          .resize({ width: 1920, height: 1080, fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 82 })
          .toFile(fullPath)
      );
    }

    // If slideNum is provided, persist the new URL to SiteSetting and delete
    // the previous hero image file (if it was one of ours) to avoid orphan files.
    if (slideNum && !Number.isNaN(slideNum)) {
      const settingKey = `hero_slide_${slideNum}_image`;
      const existing = await (await import('@/lib/db')).db.siteSetting.findUnique({
        where: { key: settingKey },
      });
      if (existing?.value && isOurUpload(existing.value)) {
        await deleteUpload(existing.value);
      }
      await (await import('@/lib/db')).db.siteSetting.upsert({
        where: { key: settingKey },
        update: { value: urlPath },
        create: { key: settingKey, value: urlPath },
      });
    }

    await logActivity('hero.image.upload', `تصویر اسلایدشو آپلود شد`, payload.sub);

    return NextResponse.json({ url: urlPath });
  } catch (error) {
    console.error('Hero image upload error:', error);
    return NextResponse.json({ error: 'خطا در آپلود تصویر' }, { status: 500 });
  }
}
