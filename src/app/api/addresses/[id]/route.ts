import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyUserToken } from '@/lib/user-auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await verifyUserToken(request);
  if (!user) {
    return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { title, province, city, fullAddress, postalCode, isDefault } = body;

    const address = await db.address.findFirst({
      where: { id: parseInt(id), userId: user.userId },
    });

    if (!address) {
      return NextResponse.json({ error: 'آدرس یافت نشد' }, { status: 404 });
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await db.address.updateMany({
        where: { userId: user.userId, isDefault: true, id: { not: parseInt(id) } },
        data: { isDefault: false },
      });
    }

    const updatedAddress = await db.address.update({
      where: { id: parseInt(id) },
      data: {
        title: title !== undefined ? (title || null) : undefined,
        province: province !== undefined ? (province || null) : undefined,
        city: city !== undefined ? (city || null) : undefined,
        fullAddress: fullAddress !== undefined ? fullAddress : undefined,
        postalCode: postalCode !== undefined ? (postalCode || null) : undefined,
        isDefault: isDefault !== undefined ? !!isDefault : undefined,
      },
    });

    return NextResponse.json({ address: updatedAddress });
  } catch (error) {
    console.error('Address update error:', error);
    return NextResponse.json({ error: 'خطا در بروزرسانی آدرس' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await verifyUserToken(request);
  if (!user) {
    return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 401 });
  }

  try {
    const { id } = await params;

    const address = await db.address.findFirst({
      where: { id: parseInt(id), userId: user.userId },
    });

    if (!address) {
      return NextResponse.json({ error: 'آدرس یافت نشد' }, { status: 404 });
    }

    await db.address.delete({ where: { id: parseInt(id) } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Address delete error:', error);
    return NextResponse.json({ error: 'خطا در حذف آدرس' }, { status: 500 });
  }
}