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
    const { status, paymentStatus } = body;

    const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    const validPaymentStatuses = ['pending', 'paid', 'cod_pending', 'failed'];

    const updateData: any = {};

    if (status) {
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: 'وضعیت ارسال نامعتبر است' },
          { status: 400 }
        );
      }
      updateData.status = status;
    }

    if (paymentStatus) {
      if (!validPaymentStatuses.includes(paymentStatus)) {
        return NextResponse.json(
          { error: 'وضعیت پرداخت نامعتبر است' },
          { status: 400 }
        );
      }
      updateData.paymentStatus = paymentStatus;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'هیچ فیلدی برای بروزرسانی ارسال نشده' }, { status: 400 });
    }

    const order = await db.order.findUnique({
      where: { id: parseInt(id) },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'سفارش یافت نشد' }, { status: 404 });
    }

    const updatedOrder = await db.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: parseInt(id) },
        data: updateData,
        include: { items: true, user: { select: { id: true, name: true, phone: true, email: true } } },
      });

      // Restore stock if newly cancelled
      if (order.status !== 'cancelled' && status === 'cancelled') {
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stockQuantity: { increment: item.quantity },
              availability: 'in_stock'
            }
          });
        }
      }

      // Re-deduct stock if un-cancelled
      if (order.status === 'cancelled' && status && status !== 'cancelled') {
        for (const item of order.items) {
          const productInfo = await tx.product.findUnique({ where: { id: item.productId } });
          if (productInfo) {
            const newStock = productInfo.stockQuantity - item.quantity;
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stockQuantity: newStock,
                availability: newStock <= 0 ? 'out_of_stock' : productInfo.availability
              }
            });
          }
        }
      }

      return updated;
    });

    const logParts: string[] = [];
    if (status) logParts.push(`وضعیت ارسال: «${status}»`);
    if (paymentStatus) logParts.push(`وضعیت پرداخت: «${paymentStatus}»`);
    await logActivity('order.update', `سفارش #${order.orderNumber} — ${logParts.join('، ')}`);

    return NextResponse.json({ order: updatedOrder });
  } catch (error) {
    console.error('Admin order update error:', error);
    return NextResponse.json({ error: 'خطا در بروزرسانی سفارش' }, { status: 500 });
  }
}