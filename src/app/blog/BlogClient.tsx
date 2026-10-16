'use client';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Home, BookOpen, Stethoscope, BriefcaseMedical, TestTube, Lightbulb, PenTool, CheckSquare, Calendar, ChevronLeft, ChevronRight, ArrowLeft, Clock, Wrench, AlertTriangle, ShoppingCart, HeartPulse } from 'lucide-react';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppNavigation } from '@/hooks/useAppNavigation';

const getCategoryIcon = (slug: string) => {
  switch (slug) {
    case 'dentistry-general': return <Stethoscope className="w-4 h-4 text-teal-500" />;
    case 'equipment-guide': return <BriefcaseMedical className="w-4 h-4 text-blue-500" />;
    case 'materials': return <TestTube className="w-4 h-4 text-purple-500" />;
    case 'tips': return <Lightbulb className="w-4 h-4 text-amber-500" />;
    case 'reviews': return <CheckSquare className="w-4 h-4 text-rose-500" />;
    case 'news': return <PenTool className="w-4 h-4 text-indigo-500" />;
    default: return <BookOpen className="w-4 h-4 text-gray-400" />;
  }
};
const persianDate = (dateString: string) => {
  try {
    return new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(dateString));
  } catch {
    return dateString;
  }
};
const fadeIn = { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 } };
const staggerContainer = { initial: {}, animate: { transition: { staggerChildren: 0.05 } } };
const staggerItem = { initial: { opacity: 0, scale: 0.9 }, animate: { opacity: 1, scale: 1 } };

interface BlogCategory { id: number; name: string; slug: string; _count: { posts: number } }
interface BlogPostListItem { id: number; title: string; slug: string; excerpt: string; coverImage: string | null; categoryId: number; category: { id: number; name: string; slug: string; }; readTime: number; createdAt: string; }

export default function BlogClient({ initialCategorySlug }: { initialCategorySlug?: string }) {
  const onNavigate = useAppNavigation();
  const categorySlug = initialCategorySlug;

  const [posts, setPosts] = useState<BlogPostListItem[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [activeCategory, setActiveCategory] = useState(categorySlug || '');
  const [loading, setLoading] = useState(true);

  const PER_PAGE = 9;

  useEffect(() => {
    fetch('/api/blog-categories')
      .then(r => r.json())
      .then(data => setCategories(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({ page: String(page), limit: String(PER_PAGE) });
        if (activeCategory) params.set('categoryId', activeCategory);
        const res = await fetch(`/api/blog?${params}`);
        const data = await res.json();
        if (!cancelled) {
          setPosts(data.posts || []);
          setTotal(data.total || 0);
        }
      } catch {}
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [page, activeCategory]);

  const totalPages = Math.ceil(total / PER_PAGE);
  const persianDate = (dateStr: string) => {
    return new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(dateStr));
  };

  const getCategoryIcon = (slug: string) => {
    switch (slug) {
      case 'maintenance': return <Wrench className="w-4 h-4" />;
      case 'troubleshooting': return <AlertTriangle className="w-4 h-4" />;
      case 'buying-guide': return <ShoppingCart className="w-4 h-4" />;
      case 'safety-standards': return <HeartPulse className="w-4 h-4" />;
      default: return <BookOpen className="w-4 h-4" />;
    }
  };

  return (
    <motion.div {...fadeIn} className="max-w-7xl mx-auto px-4 sm:px-6 pb-8">
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink onClick={() => onNavigate({ type: 'home' })} className="cursor-pointer flex items-center gap-1 text-sm">
              <Home className="w-3.5 h-3.5" />
              خانه
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>مقالات آموزشی</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-mersadent-accent/10 text-mersadent-accent">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-mersadent-dark">مقالات آموزشی</h1>
            <p className="text-sm text-gray-400 mt-0.5">راهنماها و آموزش‌های تخصصی تجهیزات دندانپزشکی</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar - Categories */}
        <aside className="w-full lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-gray-100 p-4 lg:sticky lg:top-24">
            <h3 className="text-sm font-bold text-mersadent-dark mb-3">دسته‌بندی مقالات</h3>
            <div className="flex flex-col gap-1">
              <button
                onClick={() => { setActiveCategory(''); setPage(1); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors ${!activeCategory ? 'bg-mersadent-accent/10 text-mersadent-accent font-semibold' : 'text-gray-600 hover:bg-mersadent-bg hover:text-mersadent-dark'}`}
              >
                <span className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  همه مقالات
                </span>
                <Badge variant="secondary" className="text-[10px] px-1.5">{total}</Badge>
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => { setActiveCategory(cat.slug); setPage(1); }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors ${activeCategory === cat.slug ? 'bg-mersadent-accent/10 text-mersadent-accent font-semibold' : 'text-gray-600 hover:bg-mersadent-bg hover:text-mersadent-dark'}`}
                >
                  <span className="flex items-center gap-2">
                    {getCategoryIcon(cat.slug)}
                    <span className="text-right">{cat.name}</span>
                  </span>
                  <Badge variant="secondary" className="text-[10px] px-1.5">{cat._count.posts}</Badge>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Posts Grid */}
        <div className="flex-1">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-72 rounded-2xl" />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <BookOpen className="w-16 h-16 text-gray-200 mb-4" />
              <h3 className="text-lg font-semibold text-gray-400 mb-2">مقاله‌ای یافت نشد</h3>
              <p className="text-sm text-gray-400">در این دسته‌بندی هنوز مقاله‌ای منتشر نشده است</p>
            </div>
          ) : (
            <>
              <motion.div
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"
              >
                {posts.map((post) => (
                  <motion.div
                    key={post.id}
                    variants={staggerItem}
                    whileHover={{ y: -4 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  >
                    <Card
                      className="cursor-pointer group h-full border border-gray-100 hover:border-mersadent-accent/40 hover:shadow-lg transition-all duration-300 overflow-hidden"
                      onClick={() => onNavigate({ type: 'blog-post', slug: post.slug })}
                    >
                      {/* Cover area */}
                      <div className="relative w-full aspect-[16/10] bg-gradient-to-br from-mersadent-dark/5 to-mersadent-accent/10 flex items-center justify-center overflow-hidden">
                        {post.coverImage ? (
                          <img
                            src={post.coverImage}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <BookOpen className="w-10 h-10 text-mersadent-accent/30 group-hover:text-mersadent-accent/50 transition-colors" />
                        )}
                        <Badge className="absolute top-3 right-3 bg-white/90 text-mersadent-dark text-[10px] font-medium px-2 py-0.5 shadow-sm">
                          {post.category.name}
                        </Badge>
                        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-[11px] text-gray-500">
                          <Clock className="w-3 h-3" />
                          {post.readTime} دقیقه مطالعه
                        </div>
                      </div>
                      <CardContent className="p-4 flex flex-col gap-2">
                        <h3 className="text-sm font-bold text-mersadent-dark leading-6 line-clamp-2 min-h-[2.5rem] group-hover:text-mersadent-accent transition-colors">
                          {post.title}
                        </h3>
                        <p className="text-xs text-gray-500 leading-5 line-clamp-2">
                          {post.excerpt}
                        </p>
                        <div className="flex items-center justify-between pt-2 mt-auto border-t border-gray-50">
                          <span className="text-[11px] text-gray-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {persianDate(post.createdAt)}
                          </span>
                          <span className="text-xs text-mersadent-accent font-medium flex items-center gap-0.5 group-hover:gap-1.5 transition-all">
                            ادامه مطلب
                            <ArrowLeft className="w-3 h-3" />
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage(p => p - 1)}
                    className="h-9 px-3"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={page === pageNum ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPage(pageNum)}
                        className={page === pageNum ? 'bg-mersadent-accent hover:bg-mersadent-accent/90 text-white' : 'w-9 h-9 p-0'}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage(p => p + 1)}
                    className="h-9 px-3"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
