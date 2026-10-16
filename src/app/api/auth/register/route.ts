import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { signUserToken } from '@/lib/user-auth';
import { canonicalizePhone, phoneVariants, verifyOtp } from '@/lib/otp';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const phone = canonicalizePhone(typeof body.phone === 'string' ? body.phone : '');
    const code = typeof body.code === 'string' ? body.code : '';
    const name = typeof body.name === 'string' ? body.name.trim() : '';

    if (!/^\+989\d{9}$/.test(phone) || !/^\d{6}$/.test(code) || !name) {
      return NextResponse.json({ success: false, error: 'نام، شماره موبایل و کد تایید معتبر الزامی است' }, { status: 400 });
    }
    if (!(await verifyOtp(phone, 'SIGNUP', code))) {
      return NextResponse.json({ success: false, error: 'کد تایید منقضی شده یا نادرست است' }, { status: 401 });
    }

    const existing = await db.user.findFirst({ where: { phone: { in: phoneVariants(phone) } } });
    if (existing) return NextResponse.json({ success: false, error: 'این شماره قبلاً ثبت شده است' }, { status: 409 });

    const user = await db.user.create({ data: { phone, name } });
    return NextResponse.json({ success: true, token: signUserToken(user.id), user });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ success: false, error: 'خطای سرور' }, { status: 500 });
  }
}
