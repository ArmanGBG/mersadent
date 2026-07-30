import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyUserToken } from '@/lib/user-auth';

export async function PUT(request: NextRequest) {
  const user = await verifyUserToken(request);
  if (!user) {
    return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { itemId, quantity } = body;

    if (!itemId || quantity === undefined) {
      return NextResponse.json({ error: 'شناسه آیتم و تعداد الزامی است' }, { status: 400 });
    }

    const cart = await db.cart.findFirst({
      where: { userId: user.userId, status: 'active' },
    });

    if (!cart) {
      return NextResponse.json({ error: 'سبد خرید یافت نشد' }, { status: 404 });
    }

    const cartItem = await db.cartItem.findFirst({
      where: { id: parseInt(itemId), cartId: cart.id },
    });

    if (!cartItem) {
      return NextResponse.json({ error: 'آیتم در سبد خرید یافت نشد' }, { status: 404 });
    }

    if (quantity <= 0) {
      await db.cartItem.delete({ where: { id: cartItem.id } });
    } else {
      await db.cartItem.update({
        where: { id: cartItem.id },
        data: { quantity: Math.max(1, parseInt(quantity)) },
      });
    }

    // Return updated cart
    const updatedCart = await db.cart.findFirst({
      where: { userId: user.userId, status: 'active' },
      include: {
        items: {
          include: {
            product: {
              include: {
                brand: { select: { name: true } },
                images: { where: { order: 0 }, take: 1, select: { url: true, alt: true } },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    const formattedItems = (updatedCart?.items || []).map((item) => {
      const p = item.product;
      const currentPrice = p.discountPercent && p.discountPercent > 0
        ? Math.round((p.price ?? 0) * (1 - p.discountPercent / 100))
        : p.price;

      return {
        id: item.id,
        productId: item.productId,
        productName: p.name,
        brandName: p.brand.name,
        currentPrice,
        priceAtAdd: item.priceAtAdd,
        quantity: item.quantity,
        image: p.images[0]?.url || null,
      };
    });

    const totalPrice = formattedItems.reduce(
      (sum, item) => sum + item.priceAtAdd * item.quantity,
      0
    );

    return NextResponse.json({
      id: updatedCart?.id,
      items: formattedItems,
      totalPrice,
      itemCount: formattedItems.reduce((sum, item) => sum + item.quantity, 0),
    });
  } catch (error) {
    console.error('Cart update error:', error);
    return NextResponse.json({ error: 'خطا در بروزرسانی سبد خرید' }, { status: 500 });
  }
}