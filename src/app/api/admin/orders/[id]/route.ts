import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAdminToken, unauthorizedResponse, logActivity } from '@/lib/admin-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = await verifyAdminToken(request);
  if (!payload) return unauthorizedResponse();

  try {
    const { id } = await params;

    const order = await db.order.findUnique({
      where: { id: parseInt(id) },
      include: {
        items: true,
        user: { select: { id: true, name: true, phone: true, email: true } },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'سفارش یافت نشد' }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error('Admin order detail error:', error);
    return NextResponse.json({ error: 'خطا در دریافت سفارش' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = await verifyAdminToken(request);
  if (!payload) return unauthorizedResponse();

  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'وضعیت نامعتبر است. مقادیر مجاز: pending, confirmed, shipped, delivered, cancelled' },
        { status: 400 }
      );
    }

    const order = await db.order.findUnique({
      where: { id: parseInt(id) },
    });

    if (!order) {
      return NextResponse.json({ error: 'سفارش یافت نشد' }, { status: 404 });
    }

    const updatedOrder = await db.order.update({
      where: { id: parseInt(id) },
      data: { status },
      include: { items: true },
    });

    await logActivity('order.update', `سفارش #${order.orderNumber} به وضعیت "${status}" تغییر کرد`);

    return NextResponse.json({ order: updatedOrder });
  } catch (error) {
    console.error('Admin order update error:', error);
    return NextResponse.json({ error: 'خطا در بروزرسانی سفارش' }, { status: 500 });
  }
}