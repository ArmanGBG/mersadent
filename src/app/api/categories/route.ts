import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const categories = await db.category.findMany({
      where: { visible: true },
      include: {
        children: {
          where: { visible: true },
          include: {
            children: {
              where: { visible: true },
              include: {
                _count: { select: { products: { where: { visible: true } } } },
              },
              orderBy: { order: 'asc' },
            },
            _count: { select: { products: { where: { visible: true } } } },
          },
          orderBy: { order: 'asc' },
        },
        _count: { select: { products: { where: { visible: true } } } },
      },
      orderBy: { order: 'asc' },
    });

    // Build 3-level tree
    const tree = categories
      .filter((c) => !c.parentId)
      .map((parent) => {
        const parentChildren = (parent.children || []).map((child) => ({
          ...child,
          children: (child.children || []).map((grandchild) => ({
            ...grandchild,
            productCount: grandchild._count?.products || 0,
          })),
          productCount: (child._count?.products || 0) + (child.children || []).reduce((sum: number, gc: any) => sum + (gc._count?.products || 0), 0),
        }));
        return {
          ...parent,
          children: parentChildren,
          productCount: (parent._count?.products || 0) + parentChildren.reduce((sum: number, c: any) => sum + c.productCount, 0),
        };
      });

    return NextResponse.json(tree);
  } catch (error) {
    console.error('Categories error:', error);
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 });
  }
}
