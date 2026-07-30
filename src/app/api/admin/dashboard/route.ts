import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAdminToken, unauthorizedResponse } from '@/lib/admin-auth';

async function auth(req: NextRequest) {
  const payload = await verifyAdminToken(req);
  if (payload) return null;
  return unauthorizedResponse();
}

export async function GET(request: NextRequest) {
  const err = await auth(request);
  if (err) return err;

  try {
    const [productCount, featuredCount, outOfStockCount, categoryCount, parentCategoryCount, brandCount, blogTotal, blogPublished, blogCatCount, recentActivity] = await Promise.all([
      db.product.count(),
      db.product.count({ where: { featured: true } }),
      db.product.count({ where: { availability: 'out_of_stock' } }),
      db.category.count(),
      db.category.count({ where: { parentId: null } }),
      db.brand.count(),
      db.blogPost.count(),
      db.blogPost.count({ where: { published: true } }),
      db.blogCategory.count(),
      db.activityLog.findMany({ orderBy: { createdAt: 'desc' }, take: 20 }),
    ]);

    // Count images separately in case ProductImage model has issues
    let imagesCount = 0;
    try {
      imagesCount = await (db as any).productImage?.count?.() ?? 0;
    } catch {
      imagesCount = 0;
    }

    return NextResponse.json({
      products: { total: productCount, featured: featuredCount, withImages: imagesCount, outOfStock: outOfStockCount },
      categories: { total: categoryCount, parentCategories: parentCategoryCount },
      brands: { total: brandCount },
      blog: { totalPosts: blogTotal, publishedPosts: blogPublished, categories: blogCatCount },
      recentActivity,
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    return NextResponse.json({ error: 'خطا در دریافت اطلاعات' }, { status: 500 });
  }
}