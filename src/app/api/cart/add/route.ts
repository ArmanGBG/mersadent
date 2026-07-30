import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyUserToken } from '@/lib/user-auth';

export async function POST(request: NextRequest) {
  const user = await verifyUserToken(request);
  if (!user) {
    return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { productId, quantity = 1 } = body;

    if (!productId) {
      return NextResponse.json({ error: 'شناسه محصول الزامی است' }, { status: 400 });
    }

    const product = await db.product.findUnique({
      where: { id: parseInt(productId) },
      include: { images: { where: { order: 0 }, take: 1, select: { url: true } } },
    });

    if (!product) {
      return NextResponse.json({ error: 'محصول یافت نشد' }, { status: 404 });
    }

    if (product.availability === 'out_of_stock') {
      return NextResponse.json({ error: 'محصول ناموجود است' }, { status: 400 });
    }

    if (!product.price) {
      return NextResponse.json({ error: 'این محصول امکان خرید آنلاین ندارد' }, { status: 400 });
    }

    // Calculate the effective price (discounted or original)
    const effectivePrice = product.discountPercent && product.discountPercent > 0
      ? Math.round(product.price * (1 - product.discountPercent / 100))
      : product.price;

    // Find or create active cart
    let cart = await db.cart.findFirst({
      where: { userId: user.userId, status: 'active' },
    });

    if (!cart) {
      cart = await db.cart.create({
        data: { userId: user.userId, status: 'active' },
      });
    }

    // Check if product already in cart
    const existingItem = await db.cartItem.findFirst({
      where: { cartId: cart.id, productId: product.id },
    });

    if (existingItem) {
      await db.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity },
      });
    } else {
      await db.cartItem.create({
        data: {
          cartId: cart.id,
          productId: product.id,
          quantity,
          priceAtAdd: effectivePrice,
        },
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

    const formattedItems = (updatedCart?.items ?? []).map((item) => {
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
    console.error('Cart add error:', error);
    return NextResponse.json({ error: 'خطا در افزودن به سبد خرید' }, { status: 500 });
  }
}