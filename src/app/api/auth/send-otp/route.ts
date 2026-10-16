import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requestOtp } from '@/lib/otp';
import { sendOtpSms, isSmsSandbox } from '@/lib/sms';
import { canonicalizePhone, phoneVariants } from '@/lib/otp';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone } = body;
    const purpose = body.purpose === 'SIGNUP' ? 'SIGNUP' : 'LOGIN';

    if (!phone || typeof phone !== 'string') {
      return NextResponse.json({ success: false, error: 'شماره موبایل الزامی است' }, { status: 400 });
    }

    const normalizedPhone = canonicalizePhone(phone);
    if (!/^\+989\d{9}$/.test(normalizedPhone)) {
      return NextResponse.json(
        { success: false, error: 'فرمت شماره موبایل نامعتبر است (باید با 09 شروع شود و ۱۱ رقم باشد)' },
        { status: 400 },
      );
    }

    if (purpose === 'SIGNUP') {
      const existing = await db.user.findFirst({ where: { phone: { in: phoneVariants(normalizedPhone) } }, select: { id: true } });
      if (existing) {
        return NextResponse.json({ success: false, error: 'این شماره قبلاً ثبت شده است. وارد حساب خود شوید', code: 'ACCOUNT_EXISTS' }, { status: 409 });
      }
    } else {
      const existing = await db.user.findFirst({ where: { phone: { in: phoneVariants(normalizedPhone) } }, select: { id: true } });
      if (!existing) {
        return NextResponse.json({ success: false, error: 'کاربری با این شماره ثبت‌نام نکرده است. ابتدا ثبت‌نام کنید', code: 'ACCOUNT_NOT_FOUND' }, { status: 404 });
      }
    }

    const code = await requestOtp(normalizedPhone, purpose, sendOtpSms);

    if (isSmsSandbox()) {
      return NextResponse.json({ success: true, code });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Send OTP error:', error);
    const message = error instanceof Error ? error.message : 'خطای سرور';
    const status = ['OTP_COOLDOWN', 'SMS_PROVIDER_INVALID', 'ARTA_SMS_NOT_CONFIGURED', 'ARTA_SMS_SEND_FAILED'].includes(message) ? 503 : 500;
    return NextResponse.json({ success: false, error: message === 'OTP_COOLDOWN' ? 'لطفاً برای ارسال مجدد کمی صبر کنید' : message }, { status });
  }
}
