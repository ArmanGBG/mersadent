'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, FolderOpen, Award, FileText } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { adminFetch, formatNumber, formatDate, getActivityLabel } from '@/lib/admin-utils';

interface DashboardData {
  products: { total: number; featured: number; withImages: number; outOfStock: number };
  categories: { total: number; parentCategories: number };
  brands: { total: number };
  blog: { totalPosts: number; publishedPosts: number; categories: number };
  recentActivity: { id: number; action: string; detail: string | null; createdAt: string }[];
}

interface AdminDashboardProps {
  token: string;
}

export function AdminDashboard({ token }: AdminDashboardProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminFetch(token, '/api/admin/dashboard')
      .then(r => r.json())
      .then(d => { if (!d.error) setData(d); })
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1,2,3,4].map(i => <Card key={i}><CardContent className="p-6"><Skeleton className="h-20" /></CardContent></Card>)}
    </div>;
  }

  if (!data) return <p className="text-red-500 text-center py-12">خطا در بارگذاری اطلاعات</p>;

  const stats = [
    { label: 'کل محصولات', value: data.products.total, icon: Package, color: 'bg-blue-500', sub: `${formatNumber(data.products.featured)} ویژه` },
    { label: 'دسته‌بندی‌ها', value: data.categories.total, icon: FolderOpen, color: 'bg-emerald-500', sub: `${data.categories.parentCategories} دسته اصلی` },
    { label: 'برندها', value: data.brands.total, icon: Award, color: 'bg-amber-500', sub: 'برند فعال' },
    { label: 'مقالات', value: data.blog.totalPosts, icon: FileText, color: 'bg-purple-500', sub: `${data.blog.publishedPosts} منتشر شده` },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(stat => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-3xl font-bold mt-1">{formatNumber(stat.value)}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
                  </div>
                  <div className={`w-11 h-11 ${stat.color} rounded-xl flex items-center justify-center`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base" dir="rtl">فعالیت‌های اخیر</CardTitle>
        </CardHeader>
        <CardContent>
          {data.recentActivity.length === 0 ? (
            <p className="text-muted-foreground text-center py-8 text-sm" dir="rtl">هنوز فعالیتی ثبت نشده</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-right py-3 px-3 font-medium" dir="rtl">عملیات</th>
                    <th className="text-right py-3 px-3 font-medium" dir="rtl">جزئیات</th>
                    <th className="text-right py-3 px-3 font-medium" dir="rtl">تاریخ</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentActivity.map(log => (
                    <tr key={log.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="py-2.5 px-3">
                        <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-md font-medium" dir="rtl">
                          {getActivityLabel(log.action)}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-gray-600 truncate max-w-xs" dir="rtl">{log.detail || '—'}</td>
                      <td className="py-2.5 px-3 text-muted-foreground whitespace-nowrap">{formatDate(log.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}