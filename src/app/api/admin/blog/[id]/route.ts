import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAdminToken, unauthorizedResponse, logActivity } from '@/lib/admin-auth';
import { deleteUpload, isOurUpload } from '@/lib/storage';

function toSlug(text: string): string {
  return text.trim().replace(/\s+/g, '-').replace(/[^a-zA-Z0-9\u0600-\u06FF-]/g, '').toLowerCase();
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = await verifyAdminToken(request);
  if (!payload) return unauthorizedResponse();

  try {
    const { id } = await params;
    const post = await db.blogPost.findUnique({
      where: { id: parseInt(id) },
      include: { category: true },
    });

    if (!post) return NextResponse.json({ error: 'مقاله یافت نشد' }, { status: 404 });
    return NextResponse.json({ post });
  } catch (error) {
    console.error('Admin blog detail error:', error);
    return NextResponse.json({ error: 'خطا در دریافت مقاله' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = await verifyAdminToken(request);
  if (!payload) return unauthorizedResponse();

  try {
    const { id } = await params;
    const body = await request.json();
    const { title, slug, excerpt, content, categoryId, coverImage, readTime, published } = body;

    if (!title) return NextResponse.json({ error: 'عنوان الزامی است' }, { status: 400 });

    // If coverImage is being changed (including cleared to null), delete the
    // previous cover image file from disk to avoid orphan files.
    if (coverImage !== undefined) {
      const existing = await db.blogPost.findUnique({
        where: { id: parseInt(id) },
        select: { coverImage: true },
      });
      if (existing && existing.coverImage !== coverImage && isOurUpload(existing.coverImage)) {
        await deleteUpload(existing.coverImage);
      }
    }

    const post = await db.blogPost.update({
      where: { id: parseInt(id) },
      data: {
        title,
        slug: slug || undefined,
        excerpt: excerpt || undefined,
        content: content || undefined,
        categoryId: categoryId !== undefined ? parseInt(categoryId) : undefined,
        coverImage: coverImage !== undefined ? (coverImage || null) : undefined,
        readTime: readTime ?? undefined,
        published: published !== undefined ? !!published : undefined,
      },
      include: { category: true },
    });

    await logActivity('blog.update', `مقاله "${title}" بروزرسانی شد`);
    return NextResponse.json({ post });
  } catch (error) {
    console.error('Admin blog update error:', error);
    return NextResponse.json({ error: 'خطا در بروزرسانی مقاله' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = await verifyAdminToken(request);
  if (!payload) return unauthorizedResponse();

  try {
    const { id } = await params;
    const post = await db.blogPost.findUnique({ where: { id: parseInt(id) } });
    if (!post) return NextResponse.json({ error: 'مقاله یافت نشد' }, { status: 404 });

    // Delete the cover image file from disk (only if it's one of our uploads)
    if (isOurUpload(post.coverImage)) {
      await deleteUpload(post.coverImage);
    }

    await db.blogPost.delete({ where: { id: parseInt(id) } });
    await logActivity('blog.delete', `مقاله "${post.title}" حذف شد`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin blog delete error:', error);
    return NextResponse.json({ error: 'خطا در حذف مقاله' }, { status: 500 });
  }
}