import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAdminToken, unauthorizedResponse, logActivity } from '@/lib/admin-auth';
import { writeFile, mkdir } from 'fs/promises';
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
    const brandIdRaw = formData.get('brandId');

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

    const brandId = brandIdRaw ? parseInt(String(brandIdRaw)) : null;
    const isSvg = file.type === 'image/svg+xml';

    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'brands');
    await mkdir(uploadsDir, { recursive: true });

    const timestamp = Date.now();
    const idPart = brandId && !Number.isNaN(brandId) ? String(brandId) : `temp-${timestamp}`;
    const urlPath = `/uploads/brands/brand-${idPart}-${timestamp}.${isSvg ? 'svg' : 'webp'}`;
    const fullPath = path.join(uploadsDir, path.basename(urlPath));

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (isSvg) {
      // Save SVG as-is (sharp can't process SVG well)
      await writeFile(fullPath, buffer);
    } else {
      // Optimize with sharp: resize to max 400px wide, convert to webp
      await sharp(buffer)
        .resize({ width: 400, height: 400, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 85 })
        .toFile(fullPath);
    }

    // If brandId provided, persist the logo URL to the DB
    if (brandId && !Number.isNaN(brandId)) {
      const existing = await db.brand.findUnique({ where: { id: brandId } });
      if (existing) {
        // Delete the previous logo file if it was one of ours
        if (existing.logo && existing.logo.startsWith('/uploads/brands/')) {
          const oldPath = path.join(process.cwd(), 'public', existing.logo);
          try {
            const { unlink } = await import('fs/promises');
            await unlink(oldPath);
          } catch {
            // ignore
          }
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
