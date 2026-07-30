import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyUserToken } from '@/lib/user-auth';

export async function POST(request: NextRequest) {
  const user = await verifyUserToken(request);
  if (!user) {
    return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 401 });
  }

  try {
    const cart = await db.cart.findFirst({
      where: { userId: user.userId, status: 'active' },
    });

    if (cart) {
      await db.cartItem.deleteMany({ where: { cartId: cart.id } });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Cart clear error:', error);
    return NextResponse.json({ error: 'خطا در خالی کردن سبد خرید' }, { status: 500 });
  }
}