import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyUserToken } from '@/lib/user-auth';

export async function GET(request: NextRequest) {
  const user = await verifyUserToken(request);
  if (!user) {
    return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 401 });
  }

  try {
    let cart = await db.cart.findFirst({
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

    if (!cart) {
      cart = await db.cart.create({
        data: { userId: user.userId, status: 'active' },
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
          },
        },
      });
    }

    const formattedItems = cart.items.map((item) => {
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
      id: cart.id,
      items: formattedItems,
      totalPrice,
      itemCount: formattedItems.reduce((sum, item) => sum + item.quantity, 0),
    });
  } catch (error) {
    console.error('Cart get error:', error);
    return NextResponse.json({ error: 'خطا در دریافت سبد خرید' }, { status: 500 });
  }
}