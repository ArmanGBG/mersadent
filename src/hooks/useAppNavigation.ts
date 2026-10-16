'use client';

import { useRouter } from 'next/navigation';

export type PageView =
  | { type: 'home' }
  | { type: 'product'; productId: number; slug?: string }
  | { type: 'category'; categoryId?: number; slug: string; parentName?: string; parentSlug?: string; name?: string }
  | { type: 'categories' }
  | { type: 'brand'; brandId: number; brandName: string }
  | { type: 'brands' }
  | { type: 'search'; query: string }
  | { type: 'about' }
  | { type: 'blog'; categorySlug?: string }
  | { type: 'blog-post'; slug: string }
  | { type: 'admin'; section?: string }
  | { type: 'cart' }
  | { type: 'checkout' }
  | { type: 'user'; tab?: string }
  | { type: 'order-detail'; orderId: number }
  | { type: 'compare' };

export function viewToUrl(view: PageView): string {
  switch (view.type) {
    case 'home':
      return '/';
    case 'product':
      if (view.slug) return `/product/${encodeURIComponent(view.slug)}`;
      return `/product/${view.productId}`;
    case 'category':
      return `/category/${view.slug}`;
    case 'categories':
      return `/categories`;
    case 'brand':
      if (view.brandName === 'all') return '/brands';
      return `/brand/${view.brandName}`;
    case 'brands':
      return '/brands';
    case 'search':
      return `/search?q=${encodeURIComponent(view.query)}`;
    case 'about':
      return '/about';
    case 'blog':
      if (view.categorySlug) return `/blog/category/${view.categorySlug}`;
      return '/blog';
    case 'blog-post':
      return `/blog/${view.slug}`;
    case 'admin':
      return '/admin';
    case 'cart':
      return '/cart';
    case 'checkout':
      return '/checkout';
    case 'user':
      return '/panel';
    case 'order-detail':
      return `/panel?order=${view.orderId}`;
    case 'compare':
      return '/compare';
    default:
      return '/';
  }
}

export function useAppNavigation() {
  const router = useRouter();

  const navigate = (view: PageView, options?: { replace?: boolean }) => {
    const url = viewToUrl(view);
    if (options?.replace) {
      router.replace(url);
    } else {
      router.push(url);
    }
  };

  return navigate;
}
