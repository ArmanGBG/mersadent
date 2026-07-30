import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyUserToken } from '@/lib/user-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await verifyUserToken(request);
  if (!user) {
    return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 401 });
  }

  try {
    const { id } = await params;

    const order = await db.order.findFirst({
      where: { id: parseInt(id), userId: user.userId },
      include: {
        items: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'سفارش یافت نشد' }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error('Order detail error:', error);
    return NextResponse.json({ error: 'خطا در دریافت سفارش' }, { status: 500 });
  }
}