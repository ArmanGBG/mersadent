import { NextRequest, NextResponse } from 'next/server';
import { signAdminToken } from '@/lib/admin-auth';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    const adminUser = process.env.ADMIN_USERNAME || 'admin';
    const adminPass = process.env.ADMIN_PASSWORD || 'admin';

    if (username !== adminUser || password !== adminPass) {
      return NextResponse.json({ error: 'نام کاربری یا رمز عبور اشتباه است' }, { status: 401 });
    }

    const token = await signAdminToken(username);

    return NextResponse.json({
      token,
      user: { username },
    });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({ error: 'خطا در ورود به سیستم' }, { status: 500 });
  }
}