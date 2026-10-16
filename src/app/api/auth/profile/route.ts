import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyUserToken, unauthorizedResponse } from '@/lib/user-auth';
import { canonicalizePhone } from '@/lib/otp';

export async function PUT(request: NextRequest) {
  const payload = await verifyUserToken(request);
  if (!payload) return unauthorizedResponse();

  try {
    const body = await request.json();
    const { name, phone, email, userType } = body;

    // Build update data (only include provided fields)
    const updateData: { name?: string; phone?: string; email?: string; userType?: string | null } = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = canonicalizePhone(phone);
    if (email !== undefined) updateData.email = email;
    if (userType !== undefined) updateData.userType = userType;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'حداقل یک فیلد را وارد کنید' }, { status: 400 });
    }

    // If phone is being changed, validate format
    if (updateData.phone !== undefined) {
      const phoneRegex = /^\+989\d{9}$/;
      if (!phoneRegex.test(updateData.phone)) {
        return NextResponse.json(
          { error: 'فرمت شماره موبایل نامعتبر است' },
          { status: 400 },
        );
      }
    }

    // Check for unique constraint conflicts
    if (updateData.phone) {
      const existing = await db.user.findUnique({ where: { phone: updateData.phone } });
      if (existing && existing.id !== payload.userId) {
        return NextResponse.json({ error: 'این شماره موبایل قبلاً ثبت شده است' }, { status: 409 });
      }
    }

    if (updateData.email) {
      const existing = await db.user.findUnique({ where: { email: updateData.email } });
      if (existing && existing.id !== payload.userId) {
        return NextResponse.json({ error: 'این ایمیل قبلاً ثبت شده است' }, { status: 409 });
      }
    }

    const user = await db.user.update({
      where: { id: payload.userId },
      data: updateData,
      select: { id: true, name: true, phone: true, email: true, avatar: true, userType: true },
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 });
  }
}
