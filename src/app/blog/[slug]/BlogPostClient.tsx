'use client';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Home, Calendar, Clock, ArrowLeft, ArrowRight, BookOpen, User, Phone, ChevronLeft } from 'lucide-react';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppNavigation } from '@/hooks/useAppNavigation';

const persianDate = (dateString: string) => {
  try {
    return new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(dateString));
  } catch {
    return dateString;
  }
};
const fadeIn = { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 } };

interface BlogPostListItem { id: number; title: string; slug: string; excerpt: string; coverImage: string | null; categoryId: number; category: { id: number; name: string; slug: string; }; readTime: number; createdAt: string; }
interface BlogPostFull extends BlogPostListItem { content: string; authorId: number; author: { id: number; name: string | null; email: string; } | null; metaTitle: string | null; metaDescription: string | null; keywords: string | null; updatedAt: string; visible: boolean; }

export default function BlogPostClient({ slug }: { slug: string }) {
  const onNavigate = useAppNavigation();

  const [post, setPost] = useState<BlogPostFull | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogPostListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/blog/${slug}`);
        if (!res.ok) throw new Error('Not found');
        const data = await res.json();
        if (!cancelled) {
          setPost(data.post);
          setRelatedPosts(data.relatedPosts || []);
        }
      } catch {}
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [slug]);

  const persianDate = (dateStr: string) => {
    return new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(dateStr));
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-8">
        <div className="flex flex-col gap-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/3" />
          <div className="flex gap-4 mt-4">
            <Skeleton className="h-64 flex-1" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <motion.div {...fadeIn} className="max-w-4xl mx-auto px-4 sm:px-6 pb-8 text-center py-20">
        <BookOpen className="w-16 h-16 text-gray-200 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-400 mb-2">مقاله یافت نشد</h2>
        <Button variant="outline" onClick={() => onNavigate({ type: 'blog' })} className="mt-4 text-mersadent-accent border-mersadent-accent/30 hover:bg-mersadent-accent/5">
          بازگشت به مقالات
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div {...fadeIn} className="max-w-4xl mx-auto px-4 sm:px-6 pb-8">
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
            <BreadcrumbLink onClick={() => onNavigate({ type: 'blog' })} className="cursor-pointer text-sm">
              مقالات آموزشی
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink
              onClick={() => onNavigate({ type: 'blog', categorySlug: post.category.slug })}
              className="cursor-pointer text-sm"
            >
              {post.category.name}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-sm line-clamp-1 max-w-[200px]">{post.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Article Header */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {/* Cover */}
        <div className="w-full aspect-[21/9] bg-gradient-to-br from-mersadent-dark/5 to-mersadent-accent/10 flex items-center justify-center sm:aspect-[21/8] overflow-hidden">
          {post.coverImage ? (
            <img
              src={post.coverImage}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <BookOpen className="w-16 h-16 text-mersadent-accent/30" />
          )}
        </div>

        <div className="p-5 sm:p-8">
          {/* Meta */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <Badge className="bg-mersadent-accent/10 text-mersadent-accent border-mersadent-accent/20 text-xs">
              {post.category.name}
            </Badge>
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Calendar className="w-3.5 h-3.5" />
              {persianDate(post.createdAt)}
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Clock className="w-3.5 h-3.5" />
              {post.readTime} دقیقه مطالعه
            </span>
          </div>

          {/* Title */}
          <h1 className="text-lg sm:text-2xl font-extrabold text-mersadent-dark leading-9 mb-6">
            {post.title}
          </h1>

          {/* Excerpt */}
          <div className="bg-mersadent-bg rounded-xl p-4 mb-8 border-r-4 border-mersadent-accent">
            <p className="text-sm text-gray-600 leading-7 font-medium">{post.excerpt}</p>
          </div>

          {/* Content */}
          <article
            className="blog-content"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* CTA */}
          <div className="mt-10 p-5 bg-mersadent-dark rounded-2xl text-center">
            <h3 className="text-base font-bold text-white mb-2">نیاز به تجهیزات یا مشاوره دارید؟</h3>
            <p className="text-sm text-gray-400 mb-4">کارشناسان مرصادنت آماده راهنمایی شما هستند</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Button asChild className="bg-mersadent-accent hover:bg-mersadent-accent/90 text-white rounded-xl px-6 h-10 font-semibold text-sm">
                <a href="tel:02112345678">
                  <Phone className="w-4 h-4 ml-2" />
                  تماس با کارشناس
                </a>
              </Button>
              <Button
                variant="outline"
                onClick={() => onNavigate({ type: 'category', categoryId: 0, slug: 'all' })}
                className="bg-transparent border-white/40 text-white hover:bg-white/10 rounded-xl px-6 h-10 font-semibold text-sm"
              >
                مشاهده محصولات
                <ChevronLeft className="w-4 h-4 mr-1" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <div className="mt-10">
          <h2 className="text-lg font-bold text-mersadent-dark mb-5">مقالات مرتبط</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {relatedPosts.map(rp => (
              <Card
                key={rp.id}
                className="cursor-pointer group border border-gray-100 hover:border-mersadent-accent/40 hover:shadow-md transition-all overflow-hidden"
                onClick={() => {
                  onNavigate({ type: 'blog-post', slug: rp.slug });
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                <div className="w-full aspect-[16/10] bg-gradient-to-br from-mersadent-dark/5 to-mersadent-accent/10 flex items-center justify-center">
                  <BookOpen className="w-8 h-8 text-mersadent-accent/30 group-hover:text-mersadent-accent/50 transition-colors" />
                </div>
                <CardContent className="p-3">
                  <h3 className="text-xs font-bold text-mersadent-dark leading-5 line-clamp-2 group-hover:text-mersadent-accent transition-colors">
                    {rp.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-2 text-[10px] text-gray-400">
                    <span>{rp.readTime} دقیقه</span>
                    <span>•</span>
                    <span>{persianDate(rp.createdAt)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
