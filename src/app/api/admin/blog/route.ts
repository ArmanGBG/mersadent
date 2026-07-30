import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { verifyAdminToken, unauthorizedResponse, logActivity } from '@/lib/admin-auth';

function toSlug(text: string): string {
  return text.trim().replace(/\s+/g, '-').replace(/[^a-zA-Z0-9\u0600-\u06FF-]/g, '').toLowerCase();
}

async function auth(req: NextRequest) {
  const payload = await verifyAdminToken(req);
  if (payload) return null;
  return unauthorizedResponse();
}

export async function GET(request: NextRequest) {
  const err = await auth(request);
  if (err) return err;

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const q = searchParams.get('q') || '';
    const categoryId = searchParams.get('categoryId');

    const where: Prisma.BlogPostWhereInput = {};
    if (q) {
      where.OR = [
        { title: { contains: q } },
        { excerpt: { contains: q } },
      ];
    }
    if (categoryId) where.categoryId = parseInt(categoryId);

    const [posts, total] = await Promise.all([
      db.blogPost.findMany({
        where,
        include: { category: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.blogPost.count({ where }),
    ]);

    return NextResponse.json({ posts, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('Admin blog list error:', error);
    return NextResponse.json({ error: 'خطا در دریافت مقالات' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const err = await auth(request);
  if (err) return err;

  try {
    const { title, slug, excerpt, content, categoryId, coverImage, readTime, published } = await request.json();
    if (!title || !categoryId || !content) {
      return NextResponse.json({ error: 'عنوان، محتوا و دسته‌بندی الزامی هستند' }, { status: 400 });
    }

    const post = await db.blogPost.create({
      data: {
        title,
        slug: slug || toSlug(title),
        excerpt: excerpt || title.substring(0, 150),
        content,
        categoryId: parseInt(categoryId),
        coverImage: coverImage || null,
        readTime: readTime || 5,
        published: published !== false,
      },
      include: { category: true },
    });

    await logActivity('blog.create', `مقاله "${title}" ایجاد شد`);
    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    console.error('Admin blog create error:', error);
    return NextResponse.json({ error: 'خطا در ایجاد مقاله' }, { status: 500 });
  }
}