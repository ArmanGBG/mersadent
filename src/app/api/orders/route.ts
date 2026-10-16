import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyUserToken } from '@/lib/user-auth';
import { canonicalizePhone } from '@/lib/otp';

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
    const normalizedShippingPhone = canonicalizePhone(typeof shippingPhone === 'string' ? shippingPhone : '');

    if (!/^\+989\d{9}$/.test(normalizedShippingPhone) || !shippingAddress || !paymentMethod) {
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

    // Generate unique order number using timestamp + random suffix to avoid race conditions
    const orderNumber = `MRS-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    // Determine payment status
    const paymentStatus = paymentMethod === 'cod' ? 'cod_pending' : 'pending';

    // Create order with items in a transaction
    const order = await db.$transaction(async (tx) => {
      let calculatedTotalPrice = 0;
      const orderItemsData: any[] = [];

      // 1. Verify stock and calculate fresh prices for all items
      for (const item of cart.items) {
        const productInfo = await tx.product.findUnique({
          where: { id: item.productId }
        });
        
        if (!productInfo) {
          throw new Error(`محصول ${item.product.name} یافت نشد.`);
        }
        if (productInfo.stockQuantity < item.quantity) {
          throw new Error(`موجودی محصول "${productInfo.name}" کافی نیست (موجودی: ${productInfo.stockQuantity}).`);
        }

        // Calculate current price based on DB
        const basePrice = productInfo.price || 0;
        const discountAmount = productInfo.discountPercent > 0 ? Math.floor(basePrice * (productInfo.discountPercent / 100)) : 0;
        const currentUnitPrice = basePrice - discountAmount;

        calculatedTotalPrice += currentUnitPrice * item.quantity;
        
        orderItemsData.push({
          productId: item.productId,
          productName: productInfo.name,
          quantity: item.quantity,
          unitPrice: currentUnitPrice,
          totalPrice: currentUnitPrice * item.quantity,
        });
      }

      // Calculate Shipping Cost
      const FREE_SHIPPING_THRESHOLD = 5000000; // 5,000,000 Toman
      const FLAT_SHIPPING_RATE = 50000; // 50,000 Toman
      const shippingCost = calculatedTotalPrice >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING_RATE;
      const finalTotalPrice = calculatedTotalPrice + shippingCost;

      // 2. Create the order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId: user.userId,
          status: 'pending',
          totalPrice: finalTotalPrice,
          shippingCost,
          paymentMethod,
          paymentStatus,
          shippingName: shippingName || null,
          shippingPhone: normalizedShippingPhone,
          shippingAddress,
          notes: notes || null,
          items: {
            create: orderItemsData,
          },
        },
        include: { items: true },
      });

      // 3. Decrement stock for all items
      for (const item of cart.items) {
        const productInfo = await tx.product.findUnique({
          where: { id: item.productId }
        });
        
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

      // 4. Mark cart as converted
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
  } catch (error: any) {
    console.error('Order create error:', error);
    if (error.message && error.message.includes('موجودی محصول')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'خطا در ثبت سفارش' }, { status: 500 });
  }
}
