'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search, Package, Eye, Loader2, ChevronLeft, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface AdminOrderItem {
  id: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface AdminOrder {
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
  user: { id: number; name: string | null; phone: string | null; email: string | null };
  items: AdminOrderItem[];
  _count?: { items: number };
}

interface AdminOrdersProps {
  token: string;
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('fa-IR').format(price) + ' تومان';
};

const statusOptions = [
  { value: '', label: 'همه' },
  { value: 'pending', label: 'در انتظار تأیید' },
  { value: 'confirmed', label: 'تأیید شده' },
  { value: 'shipped', label: 'ارسال شده' },
  { value: 'delivered', label: 'تحویل داده شده' },
  { value: 'cancelled', label: 'لغو شده' },
];

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

export function AdminOrders({ token }: AdminOrdersProps) {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [orderDetail, setOrderDetail] = useState<AdminOrder | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const PER_PAGE = 15;

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PER_PAGE),
      });
      if (statusFilter) params.set('status', statusFilter);
      if (search) params.set('search', search);

      const res = await fetch(`/api/admin/orders?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
        setTotal(data.total || 0);
      }
    } catch {
      // silent
    }
    setLoading(false);
  }, [token, page, statusFilter, search]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(PER_PAGE),
        });
        if (statusFilter) params.set('status', statusFilter);
        if (search) params.set('search', search);

        setLoading(true);
        const res = await fetch(`/api/admin/orders?${params}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) {
            setOrders(data.orders || []);
            setTotal(data.total || 0);
          }
        }
      } catch {
        // silent
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [token, page, statusFilter, search]);

  const handleViewOrder = async (orderId: number) => {
    setDetailLoading(true);
    setSelectedOrder(orders.find(o => o.id === orderId) || null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setOrderDetail(data.order);
      }
    } catch {
      // silent
    }
    setDetailLoading(false);
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!orderDetail) return;
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderDetail.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const data = await res.json();
        setOrderDetail(data.order);
        fetchOrders();
        toast.success('وضعیت سفارش بروزرسانی شد');
      }
    } catch {
      toast.error('خطا در بروزرسانی وضعیت');
    }
    setUpdatingStatus(false);
  };

  const totalPages = Math.ceil(total / PER_PAGE);

  return (
    <div dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-800">مدیریت سفارشات</h2>
          <p className="text-sm text-gray-500">{total} سفارش</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="شماره سفارش یا نام مشتری..."
              className="pr-9 h-9 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {statusOptions.map(opt => (
          <button
            key={opt.value}
            onClick={() => { setStatusFilter(opt.value); setPage(1); }}
            className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
              statusFilter === opt.value
                ? 'bg-[#2FC4C9] text-white font-semibold'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16">
          <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">سفارشی یافت نشد</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-right px-4 py-3 font-medium text-gray-600 w-10">#</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">شماره سفارش</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">مشتری</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">تاریخ</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">مبلغ</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">وضعیت</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order, idx) => {
                  const st = statusLabel(order.status);
                  const rowNum = (page - 1) * PER_PAGE + idx + 1;
                  return (
                    <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 text-xs text-gray-400">{new Intl.NumberFormat('fa-IR').format(rowNum)}</td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-[#2FC4C9] font-semibold" dir="ltr">{order.orderNumber}</span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">{order.shippingName || order.user?.name || '—'}</p>
                        <p className="text-xs text-gray-400" dir="ltr">{order.shippingPhone}</p>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="text-xs text-gray-500">
                          {new Intl.DateTimeFormat('fa-IR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(order.createdAt))}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-gray-800">{formatPrice(order.totalPrice)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${st.color}`}>{st.text}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleViewOrder(order.id)}
                          className="h-8 text-xs text-[#2FC4C9] hover:text-[#2FC4C9]/80"
                        >
                          <Eye className="w-3.5 h-3.5 ml-1" />
                          جزئیات
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 p-4 border-t border-gray-100">
              <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="h-8 text-xs">
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>
              {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                let p = page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i;
                if (p < 1) p = 1;
                if (p > totalPages) p = totalPages;
                return (
                  <Button
                    key={i}
                    size="sm"
                    variant={page === p ? 'default' : 'outline'}
                    onClick={() => setPage(p)}
                    className={page === p ? 'bg-[#2FC4C9] hover:bg-[#2FC4C9]/90 text-white h-8 w-8 p-0 text-xs' : 'h-8 w-8 p-0 text-xs'}
                  >
                    {p}
                  </Button>
                );
              })}
              <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="h-8 text-xs">
                <ChevronLeft className="w-3.5 h-3.5 rotate-180" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ===== ORDER DETAIL DIALOG ===== */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => { if (!open) { setSelectedOrder(null); setOrderDetail(null); } }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-right">جزئیات سفارش</DialogTitle>
            <DialogDescription className="text-right" dir="ltr">
              {orderDetail?.orderNumber || selectedOrder?.orderNumber}
            </DialogDescription>
          </DialogHeader>

          {detailLoading ? (
            <div className="flex flex-col gap-3 py-4">
              <Skeleton className="h-20 rounded-lg" />
              <Skeleton className="h-20 rounded-lg" />
            </div>
          ) : orderDetail ? (
            <div className="flex flex-col gap-4 mt-2" dir="rtl">
              {/* Status change */}
              <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                <div>
                  <p className="text-xs text-gray-500">وضعیت سفارش</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${statusLabel(orderDetail.status).color}`}>
                    {statusLabel(orderDetail.status).text}
                  </span>
                </div>
                <Select value={orderDetail.status} onValueChange={handleStatusChange} disabled={updatingStatus}>
                  <SelectTrigger className="w-36 h-9 text-xs">
                    {updatingStatus ? <Loader2 className="w-3 h-3 animate-spin" /> : <SelectValue />}
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.filter(o => o.value).map(opt => (
                      <SelectItem key={opt.value} value={opt.value} className="text-xs">{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Payment Status */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">وضعیت پرداخت:</span>
                <span className="font-medium">{paymentStatusLabel(orderDetail.paymentStatus)}</span>
              </div>

              <Separator />

              {/* Customer Info */}
              <div>
                <p className="text-sm font-semibold text-gray-800 mb-2">اطلاعات مشتری</p>
                <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-600 flex flex-col gap-1">
                  <p>نام: {orderDetail.shippingName || orderDetail.user?.name || '—'}</p>
                  <p>تلفن: <span dir="ltr">{orderDetail.shippingPhone}</span></p>
                  <p>ایمیل: {orderDetail.user?.email || '—'}</p>
                  <p>آدرس: {orderDetail.shippingAddress}</p>
                  {orderDetail.notes && <p>توضیحات: {orderDetail.notes}</p>}
                </div>
              </div>

              <Separator />

              {/* Items */}
              <div>
                <p className="text-sm font-semibold text-gray-800 mb-2">اقلام سفارش ({orderDetail.items.length})</p>
                <div className="flex flex-col gap-2">
                  {orderDetail.items.map(item => (
                    <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-800 line-clamp-1">{item.productName}</p>
                        <p className="text-[10px] text-gray-400">
                          {new Intl.NumberFormat('fa-IR').format(item.quantity)} × {formatPrice(item.unitPrice)}
                        </p>
                      </div>
                      <span className="text-xs font-bold text-gray-800 flex-shrink-0 mr-3">{formatPrice(item.totalPrice)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-800">جمع کل:</span>
                <span className="text-base font-extrabold text-[#2FC4C9]">{formatPrice(orderDetail.totalPrice)}</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-sm text-gray-400">خطا در بارگذاری جزئیات</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}