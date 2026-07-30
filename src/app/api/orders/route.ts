import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyUserToken } from '@/lib/user-auth';

export async function GET(request: NextRequest) {
  const user = await verifyUserToken(request);
  if (!user) {
    return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 401 });
  }

  try {
    const orders = await db.order.findMany({
      where: { userId: user.userId },
      include: {
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Orders list error:', error);
    return NextResponse.json({ error: 'خطا در دریافت سفارشات' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await verifyUserToken(request);
  if (!user) {
    return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { shippingName, shippingPhone, shippingAddress, notes, paymentMethod } = body;

    if (!shippingPhone || !shippingAddress || !paymentMethod) {
      return NextResponse.json(
        { error: 'شماره تلفن، آدرس ارسال و روش پرداخت الزامی هستند' },
        { status: 400 }
      );
    }

    if (!['online', 'cod'].includes(paymentMethod)) {
      return NextResponse.json({ error: 'روش پرداخت نامعتبر است' }, { status: 400 });
    }

    // Get active cart
    const cart = await db.cart.findFirst({
      where: { userId: user.userId, status: 'active' },
      include: {
        items: {
          include: {
            product: {
              include: {
                brand: { select: { name: true } },
                images: { where: { order: 0 }, take: 1, select: { url: true } },
              },
            },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return NextResponse.json({ error: 'سبد خرید خالی است' }, { status: 400 });
    }

    // Calculate total
    const totalPrice = cart.items.reduce(
      (sum, item) => sum + item.priceAtAdd * item.quantity,
      0
    );

    // Generate unique order number using timestamp + random suffix to avoid race conditions
    const orderNumber = `MRS-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    // Determine payment status
    const paymentStatus = paymentMethod === 'cod' ? 'cod_pending' : 'pending';

    // Create order with items in a transaction
    const order = await db.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId: user.userId,
          status: 'pending',
          totalPrice,
          paymentMethod,
          paymentStatus,
          shippingName: shippingName || null,
          shippingPhone,
          shippingAddress,
          notes: notes || null,
          items: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              productName: item.product.name,
              quantity: item.quantity,
              unitPrice: item.priceAtAdd,
              totalPrice: item.priceAtAdd * item.quantity,
            })),
          },
        },
        include: { items: true },
      });

      // Mark cart as converted
      await tx.cart.update({
        where: { id: cart.id },
        data: { status: 'converted' },
      });

      return newOrder;
    });

    if (paymentMethod === 'online') {
      return NextResponse.json({
        orderId: order.id,
        orderNumber: order.orderNumber,
        paymentUrl: null,
        paymentStatus: order.paymentStatus,
      });
    }

    return NextResponse.json({
      orderId: order.id,
      orderNumber: order.orderNumber,
      totalPrice: order.totalPrice,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
    }, { status: 201 });
  } catch (error) {
    console.error('Order create error:', error);
    return NextResponse.json({ error: 'خطا در ثبت سفارش' }, { status: 500 });
  }
}