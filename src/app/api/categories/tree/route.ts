import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const categories = await db.category.findMany({
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
    });

    const map = new Map<number, any>();
    const roots: any[] = [];

    for (const cat of categories) {
      map.set(cat.id, { ...cat, children: [] });
    }

    for (const cat of categories) {
      if (cat.parentId) {
        const parent = map.get(cat.parentId);
        if (parent) {
          parent.children.push(map.get(cat.id));
        }
      } else {
        roots.push(map.get(cat.id));
      }
    }

    return NextResponse.json(roots);
  } catch (error) {
    console.error('Categories tree error:', error);
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 });
  }
}
