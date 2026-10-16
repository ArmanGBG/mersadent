export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAdminToken, unauthorizedResponse } from '@/lib/admin-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = await verifyAdminToken(request);
  if (!payload) return unauthorizedResponse();

  try {
    const { id } = await params;
    const user = await db.user.findUnique({
      where: { id: parseInt(id) },
      include: {
        addresses: true,
        orders: {
          orderBy: { createdAt: 'desc' },
          include: {
            items: {
              include: { product: { select: { name: true, images: { take: 1 } } } }
            }
          }
        },
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'کاربر یافت نشد' }, { status: 404 });
    }

    const totalSpent = user.orders.reduce((sum, order) => {
      if (order.status !== 'cancelled' && order.paymentStatus.toLowerCase() === 'paid') {
        return sum + order.totalPrice;
      }
      return sum;
    }, 0);

    return NextResponse.json({
      user: {
        ...user,
        totalOrders: user.orders.length,
        totalSpent,
      }
    });
  } catch (error) {
    console.error('Admin user detail error:', error);
    return NextResponse.json({ error: 'خطا در دریافت اطلاعات کاربر' }, { status: 500 });
  }
}
