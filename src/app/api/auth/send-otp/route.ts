import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// 2 minutes expiry for OTP
const OTP_TTL_MS = 2 * 60 * 1000;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone } = body;

    if (!phone || typeof phone !== 'string') {
      return NextResponse.json({ success: false, error: 'شماره موبایل الزامی است' }, { status: 400 });
    }

    // Validate Iranian mobile: 11 digits, starts with 09
    const phoneRegex = /^09\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        { success: false, error: 'فرمت شماره موبایل نامعتبر است (باید با 09 شروع شود و ۱۱ رقم باشد)' },
        { status: 400 },
      );
    }

    // Generate 5-digit code
    const code = String(Math.floor(10000 + Math.random() * 90000));

    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    // Upsert: delete any existing unverified OTP for this phone, then create new one
    await db.oTP.deleteMany({
      where: { phone, verifiedAt: null },
    });

    await db.oTP.create({
      data: { phone, code, expiresAt },
    });

    // Dev mode: return the code in response
    // In production, this would send SMS and NOT return the code
    return NextResponse.json({ success: true, code });
  } catch (error) {
    console.error('Send OTP error:', error);
    return NextResponse.json({ success: false, error: 'خطای سرور' }, { status: 500 });
  }
}