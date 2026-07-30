export function adminFetch(token: string, url: string, options?: RequestInit): Promise<Response> {
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options?.headers,
    },
  });
}

export function toSlug(text: string): string {
  return text.trim().replace(/\s+/g, '-').replace(/[^a-zA-Z0-9\u0600-\u06FF-]/g, '').toLowerCase();
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('fa-IR').format(n);
}

export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(dateStr));
}

export function getActivityLabel(action: string): string {
  const map: Record<string, string> = {
    'product.create': 'ایجاد محصول',
    'product.update': 'بروزرسانی محصول',
    'product.delete': 'حذف محصول',
    'category.create': 'ایجاد دسته‌بندی',
    'category.update': 'بروزرسانی دسته‌بندی',
    'category.delete': 'حذف دسته‌بندی',
    'brand.create': 'ایجاد برند',
    'brand.update': 'بروزرسانی برند',
    'brand.delete': 'حذف برند',
    'blog.create': 'ایجاد مقاله',
    'blog.update': 'بروزرسانی مقاله',
    'blog.delete': 'حذف مقاله',
    'blog-category.create': 'ایجاد دسته بلاگ',
    'blog-category.update': 'بروزرسانی دسته بلاگ',
    'blog-category.delete': 'حذف دسته بلاگ',
    'settings.update': 'بروزرسانی تنظیمات',
  };
  return map[action] || action;
}