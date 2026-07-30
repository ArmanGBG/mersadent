import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyUserToken } from '@/lib/user-auth';

export async function GET(request: NextRequest) {
  const user = await verifyUserToken(request);
  if (!user) {
    return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 401 });
  }

  try {
    const addresses = await db.address.findMany({
      where: { userId: user.userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({ addresses });
  } catch (error) {
    console.error('Addresses list error:', error);
    return NextResponse.json({ error: 'خطا در دریافت آدرس‌ها' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await verifyUserToken(request);
  if (!user) {
    return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, province, city, fullAddress, postalCode, isDefault } = body;

    if (!fullAddress) {
      return NextResponse.json({ error: 'آدرس کامل الزامی است' }, { status: 400 });
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await db.address.updateMany({
        where: { userId: user.userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const address = await db.address.create({
      data: {
        userId: user.userId,
        title: title || null,
        province: province || null,
        city: city || null,
        fullAddress,
        postalCode: postalCode || null,
        isDefault: !!isDefault,
      },
    });

    return NextResponse.json({ address }, { status: 201 });
  } catch (error) {
    console.error('Address create error:', error);
    return NextResponse.json({ error: 'خطا در ایجاد آدرس' }, { status: 500 });
  }
}