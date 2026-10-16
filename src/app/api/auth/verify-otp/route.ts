import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { canonicalizePhone, phoneVariants, verifyOtp } from '@/lib/otp';
import { signUserToken } from '@/lib/user-auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const phone = canonicalizePhone(typeof body.phone === 'string' ? body.phone : '');
    const { code } = body;
    const purpose = body.purpose === 'SIGNUP' ? 'SIGNUP' : 'LOGIN';

    if (!/^\+989\d{9}$/.test(phone) || !/^\d{6}$/.test(String(code || ''))) {
      return NextResponse.json({ success: false, error: 'شماره موبایل و کد تأیید الزامی است' }, { status: 400 });
    }

    const isValid = await verifyOtp(phone, purpose, code);

    if (!isValid) {
      return NextResponse.json({ success: false, error: 'کد تأیید منقضی شده یا یافت نشد' }, { status: 401 });
    }

    const user = await db.user.findFirst({ where: { phone: { in: phoneVariants(phone) } } });

    if (!user) return NextResponse.json({ success: false, error: 'کاربری با این شماره ثبت‌نام نکرده است' }, { status: 404 });

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
