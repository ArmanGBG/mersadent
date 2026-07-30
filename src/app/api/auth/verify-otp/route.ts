import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { signUserToken } from '@/lib/user-auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, code } = body;

    if (!phone || !code) {
      return NextResponse.json({ success: false, error: 'شماره موبایل و کد تأیید الزامی است' }, { status: 400 });
    }

    // Atomically verify and mark OTP in a single updateMany to prevent double-use
    const { count } = await db.oTP.updateMany({
      where: {
        phone,
        code,
        verifiedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: { verifiedAt: new Date() },
    });

    if (count === 0) {
      return NextResponse.json({ success: false, error: 'کد تأیید منقضی شده یا یافت نشد' }, { status: 401 });
    }

    // Find or create user by phone
    let user = await db.user.findUnique({
      where: { phone },
    });

    if (!user) {
      // Check if phone is already taken by a Google user
      // (shouldn't happen since phone is unique, but handle gracefully)
      user = await db.user.create({
        data: { phone },
      });
    }

    // Generate session token
    const token = signUserToken(user.id);

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json({ success: false, error: 'خطای سرور' }, { status: 500 });
  }
}