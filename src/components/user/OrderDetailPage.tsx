'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Home, Package, ArrowLeft, Loader2, ShoppingBag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';

interface OrderItem {
  id: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface Order {
  id: number;
  orderNumber: string;
  status: string;
  totalPrice: number;
  paymentMethod: string | null;
  paymentStatus: string;
  shippingName: string | null;
  shippingPhone: string;
  shippingAddress: string;
  notes: string | null;
  createdAt: string;
  items: OrderItem[];
}

interface OrderDetailPageProps {
  orderId: number;
  onNavigate: (view: any) => void;
  onAuthRequired: () => void;
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('fa-IR').format(price) + ' تومان';
};

const statusLabel = (status: string) => {
  switch (status) {
    case 'pending': return { text: 'در انتظار تأیید', color: 'bg-amber-100 text-amber-700' };
    case 'confirmed': return { text: 'تأیید شده', color: 'bg-blue-100 text-blue-700' };
    case 'shipped': return { text: 'ارسال شده', color: 'bg-purple-100 text-purple-700' };
    case 'delivered': return { text: 'تحویل داده شده', color: 'bg-emerald-100 text-emerald-700' };
    case 'cancelled': return { text: 'لغو شده', color: 'bg-red-100 text-red-600' };
    default: return { text: status, color: 'bg-gray-100 text-gray-600' };
  }
};

const paymentStatusLabel = (status: string) => {
  switch (status) {
    case 'pending': return 'در انتظار پرداخت';
    case 'paid': return 'پرداخت شده';
    case 'cod_pending': return 'پرداخت در محل';
    case 'failed': return 'ناموفق';
    default: return status;
  }
};

const fadeIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.25 },
};

const persianDate = (dateStr: string) => {
  return new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(dateStr));
};

export function OrderDetailPage({ orderId, onNavigate, onAuthRequired }: OrderDetailPageProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('user_token');
    if (!token) { onAuthRequired(); return; }
    queueMicrotask(() => { setLoading(true); });
    fetch(`/api/orders/${orderId}`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.order) setOrder(data.order);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [orderId, onAuthRequired]);

  const st = order ? statusLabel(order.status) : null;

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
            <BreadcrumbLink onClick={() => onNavigate({ type: 'user', tab: 'orders' })} className="cursor-pointer text-sm">
              سفارش‌های من
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>جزئیات سفارش</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={() => onNavigate({ type: 'user', tab: 'orders' })} className="text-gray-400 hover:text-mersadent-dark">
          <ArrowLeft className="w-4 h-4 ml-1" />
          بازگشت
        </Button>
        <h1 className="text-xl sm:text-2xl font-bold text-mersadent-dark">جزئیات سفارش</h1>
      </div>

      {loading ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      ) : !order ? (
        <div className="text-center py-20">
          <Package className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <p className="text-sm text-gray-400">سفارش یافت نشد</p>
          <Button variant="outline" onClick={() => onNavigate({ type: 'user', tab: 'orders' })} className="mt-4 rounded-xl">
            بازگشت به سفارشات
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Header card */}
          <Card className="border border-gray-100">
            <CardContent className="p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-col gap-1.5">
                  <span className="font-mono text-base font-bold text-mersadent-accent" dir="ltr">{order.orderNumber}</span>
                  <span className="text-xs text-gray-400">{persianDate(order.createdAt)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={`text-xs px-2.5 py-1 ${st?.color}`}>{st?.text}</Badge>
                  <span className="text-base font-extrabold text-mersadent-dark">{formatPrice(order.totalPrice)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shipping info */}
          <Card className="border border-gray-100">
            <CardContent className="p-5">
              <h3 className="text-sm font-bold text-mersadent-dark mb-3">اطلاعات ارسال</h3>
              <div className="bg-gray-50 rounded-xl p-4 flex flex-col gap-1.5 text-sm">
                <p className="text-gray-700">نام: <span className="font-medium text-mersadent-dark">{order.shippingName || '—'}</span></p>
                <p className="text-gray-700">تلفن: <span className="font-medium text-mersadent-dark" dir="ltr">{order.shippingPhone}</span></p>
                <p className="text-gray-700">آدرس: <span className="font-medium text-mersadent-dark">{order.shippingAddress}</span></p>
                {order.notes && <p className="text-gray-500 text-xs mt-1">توضیحات: {order.notes}</p>}
              </div>
              <div className="flex items-center gap-4 mt-4 text-sm">
                <span className="text-gray-500">روش پرداخت:</span>
                <span className="font-medium text-mersadent-dark">{order.paymentMethod === 'online' ? 'آنلاین' : 'پرداخت در محل'}</span>
              </div>
              <div className="flex items-center gap-4 mt-2 text-sm">
                <span className="text-gray-500">وضعیت پرداخت:</span>
                <span className="font-medium text-mersadent-dark">{paymentStatusLabel(order.paymentStatus)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          <Card className="border border-gray-100">
            <CardContent className="p-5">
              <h3 className="text-sm font-bold text-mersadent-dark mb-3">اقلام سفارش ({order.items.length})</h3>
              <div className="flex flex-col gap-0">
                {/* Header */}
                <div className="flex items-center text-xs font-medium text-gray-500 pb-3 border-b border-gray-100">
                  <span className="flex-1">محصول</span>
                  <span className="w-16 text-center">تعداد</span>
                  <span className="w-28 text-left">قیمت واحد</span>
                  <span className="w-28 text-left">جمع</span>
                </div>
                {order.items.map(item => (
                  <div key={item.id} className="flex items-center py-3 border-b border-gray-50 last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-mersadent-dark line-clamp-1">{item.productName}</p>
                    </div>
                    <span className="w-16 text-center text-sm text-gray-600">{new Intl.NumberFormat('fa-IR').format(item.quantity)}</span>
                    <span className="w-28 text-left text-sm text-gray-600">{formatPrice(item.unitPrice)}</span>
                    <span className="w-28 text-left text-sm font-bold text-mersadent-dark">{formatPrice(item.totalPrice)}</span>
                  </div>
                ))}
              </div>
              <Separator className="my-3" />
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-mersadent-dark">جمع کل:</span>
                <span className="text-lg font-extrabold text-mersadent-accent">{formatPrice(order.totalPrice)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </motion.div>
  );
}