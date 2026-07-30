import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyUserToken, unauthorizedResponse } from '@/lib/user-auth';

export async function GET(request: NextRequest) {
  const payload = await verifyUserToken(request);
  if (!payload) return unauthorizedResponse();

  try {
    const user = await db.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, name: true, phone: true, email: true, avatar: true, createdAt: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'کاربر یافت نشد' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Get current user error:', error);
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 });
  }
}