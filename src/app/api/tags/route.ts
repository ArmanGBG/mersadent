import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const tags = await db.tag.findMany({
      include: {
        _count: { select: { products: true } },
      },
      orderBy: { order: 'asc' },
    });
    return NextResponse.json(tags);
  } catch (error) {
    console.error('Tags error:', error);
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 });
  }
}