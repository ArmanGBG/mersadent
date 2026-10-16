export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAdminToken, unauthorizedResponse, logActivity } from '@/lib/admin-auth';

// GET: Fetch users with pagination, search, and aggregated data
export async function GET(request: NextRequest) {
  const payload = await verifyAdminToken(request);
  if (!payload) return unauthorizedResponse();

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('q') || '';
    const userType = searchParams.get('userType') || '';
    const province = searchParams.get('province') || '';
    const city = searchParams.get('city') || '';
    const exportData = searchParams.get('export') === 'true';

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
        { email: { contains: search } },
      ];
    }
    if (userType) {
      where.userType = userType;
    }
    if (province || city) {
      where.addresses = {
        some: {
          ...(province ? { province: { contains: province } } : {}),
          ...(city ? { city: { contains: city } } : {}),
        }
      };
    }

    const skip = (page - 1) * limit;

    let users, total;
    if (exportData) {
      users = await db.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { orders: true } },
          orders: { orderBy: { createdAt: 'desc' }, select: { id: true, totalPrice: true, status: true, paymentStatus: true, createdAt: true } },
          addresses: true,
        },
      });
      total = users.length;
    } else {
      [users, total] = await Promise.all([
        db.user.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
          include: {
            _count: { select: { orders: true } },
            orders: { where: { status: { not: 'cancelled' } }, select: { totalPrice: true, paymentStatus: true } },
            addresses: true,
          },
        }),
        db.user.count({ where }),
      ]);
    }

    const mappedUsers = users.map(u => {
      const totalSpent = u.orders.reduce((sum: number, order: any) => {
        const isPaid = order.paymentStatus?.toLowerCase() === 'paid';
        return isPaid ? sum + (order.totalPrice || 0) : sum;
      }, 0);
      return {
        id: u.id,
        phone: u.phone,
        email: u.email,
        name: u.name,
        avatar: u.avatar,
        isAdmin: u.isAdmin,
        isActive: u.isActive,
        userType: u.userType,
        createdAt: u.createdAt,
        totalOrders: u._count.orders,
        totalSpent,
        addresses: u.addresses,
        orders: u.orders,
      };
    });

    return NextResponse.json({
      users: mappedUsers,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Admin users error:', error);
    return NextResponse.json({ error: 'خطا در دریافت لیست مشتریان' }, { status: 500 });
  }
}

// PUT: Update user roles or status
export async function PUT(request: NextRequest) {
  const payload = await verifyAdminToken(request);
  if (!payload) return unauthorizedResponse();

  try {
    const body = await request.json();
    const { id, isActive, userType } = body;

    if (!id) {
      return NextResponse.json({ error: 'شناسه کاربر الزامی است' }, { status: 400 });
    }

    const updateData: any = {};
    if (isActive !== undefined) updateData.isActive = isActive;
    if (userType !== undefined) updateData.userType = userType;

    const user = await db.user.update({
      where: { id: parseInt(id) },
      data: updateData,
      select: { id: true, name: true, phone: true, isActive: true, userType: true }
    });

    await logActivity('user.update', `اطلاعات کاربر ${user.name || user.phone} بروزرسانی شد`, payload.sub);

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Admin user update error:', error);
    return NextResponse.json({ error: 'خطا در بروزرسانی کاربر' }, { status: 500 });
  }
}
