'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search, Package, Eye, Loader2, ChevronLeft, X, Printer
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
  shippingCost: number;
  paymentMethod: string | null;
  paymentStatus: string;
  paymentRef?: string | null;
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
        toast.success('وضعیت ارسال بروزرسانی شد');
      }
    } catch {
      toast.error('خطا در بروزرسانی وضعیت');
    }
    setUpdatingStatus(false);
  };

  const handlePaymentStatusChange = async (newPaymentStatus: string) => {
    if (!orderDetail) return;
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderDetail.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ paymentStatus: newPaymentStatus }),
      });
      if (res.ok) {
        const data = await res.json();
        setOrderDetail(data.order);
        fetchOrders();
        toast.success('وضعیت پرداخت بروزرسانی شد');
      }
    } catch {
      toast.error('خطا در بروزرسانی وضعیت پرداخت');
    }
    setUpdatingStatus(false);
  };

  const totalPages = Math.ceil(total / PER_PAGE);

  return (
    <>
    <div dir="rtl" className="print:hidden">
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
          <DialogHeader className="print:hidden">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-right">جزئیات سفارش</DialogTitle>
                <DialogDescription className="text-right mt-1" dir="ltr">
                  {orderDetail?.orderNumber || selectedOrder?.orderNumber}
                </DialogDescription>
              </div>
              {orderDetail && (
                <Button variant="outline" size="sm" onClick={() => {
                  // A small delay ensures any rendering finishes before print dialog
                  setTimeout(() => window.print(), 100);
                }}>
                  <Printer className="w-4 h-4 ml-2" />
                  چاپ فاکتور
                </Button>
              )}
            </div>
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

              {/* Payment Status - Editable */}
              <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                <div>
                  <p className="text-xs text-gray-500">وضعیت پرداخت</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    روش: {orderDetail.paymentMethod === 'online' ? 'درگاه آنلاین' : orderDetail.paymentMethod === 'cod' ? 'پرداخت در محل' : orderDetail.paymentMethod || '—'}
                    {orderDetail.paymentRef && <span className="font-mono mr-2">• رهگیری: {orderDetail.paymentRef}</span>}
                  </p>
                </div>
                <Select value={orderDetail.paymentStatus} onValueChange={handlePaymentStatusChange} disabled={updatingStatus}>
                  <SelectTrigger className="w-40 h-9 text-xs">
                    {updatingStatus ? <Loader2 className="w-3 h-3 animate-spin" /> : <SelectValue />}
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending" className="text-xs">در انتظار پرداخت</SelectItem>
                    <SelectItem value="paid" className="text-xs">پرداخت شده ✓</SelectItem>
                    <SelectItem value="cod_pending" className="text-xs">پرداخت در محل</SelectItem>
                    <SelectItem value="failed" className="text-xs">ناموفق</SelectItem>
                  </SelectContent>
                </Select>
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

              <div className="flex items-center justify-between mt-2">
                <span className="text-sm font-medium text-gray-500">مبلغ کالاها:</span>
                <span className="text-sm font-bold text-gray-700">{formatPrice(orderDetail.totalPrice - (orderDetail.shippingCost || 0))}</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm font-medium text-gray-500">هزینه ارسال:</span>
                <span className="text-sm font-bold text-gray-700">
                  {orderDetail.shippingCost ? formatPrice(orderDetail.shippingCost) : <span className="text-green-600">رایگان</span>}
                </span>
              </div>
              
              <div className="flex items-center justify-between mt-4">
                <span className="text-sm font-bold text-gray-800">مبلغ قابل پرداخت:</span>
                <span className="text-base font-extrabold text-[#2FC4C9]">{formatPrice(orderDetail.totalPrice)}</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-sm text-gray-400">خطا در بارگذاری جزئیات</div>
          )}
        </DialogContent>
      </Dialog>
    </div>

    {/* ===== PRINTABLE INVOICE ===== */}
    {orderDetail && (
      <div className="hidden print:block fixed inset-0 bg-white z-[99999] p-8 text-black" dir="rtl">
        <style>{`
          @media print {
            body * { visibility: hidden; }
            .print\\:block, .print\\:block * { visibility: visible; }
            .print\\:block { position: absolute; left: 0; top: 0; width: 100%; height: 100%; padding: 2rem; background: white; }
          }
        `}</style>
        
        <div className="flex justify-between items-center border-b-2 border-gray-800 pb-6 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-2">فاکتور فروش مرصادنت</h1>
            <p className="text-gray-600">تأمین‌کننده تخصصی تجهیزات دندانپزشکی</p>
          </div>
          <div className="text-left">
            <p className="font-bold text-gray-800 text-lg" dir="ltr">{orderDetail.orderNumber}</p>
            <p className="text-sm text-gray-600 mt-1">
              تاریخ: {new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(orderDetail.createdAt))}
            </p>
          </div>
        </div>

        <div className="flex justify-between mb-8">
          <div className="w-1/2">
            <h2 className="text-lg font-bold border-b border-gray-200 pb-2 mb-3">مشخصات خریدار</h2>
            <ul className="space-y-2 text-sm text-gray-800">
              <li><span className="text-gray-500 w-16 inline-block">نام:</span> <span className="font-semibold">{orderDetail.shippingName || orderDetail.user?.name || '—'}</span></li>
              <li><span className="text-gray-500 w-16 inline-block">تلفن:</span> <span dir="ltr" className="font-semibold">{orderDetail.shippingPhone}</span></li>
              <li><span className="text-gray-500 w-16 inline-block">آدرس:</span> <span className="font-semibold">{orderDetail.shippingAddress}</span></li>
            </ul>
          </div>
          <div className="w-1/3">
            <h2 className="text-lg font-bold border-b border-gray-200 pb-2 mb-3">وضعیت پرداخت</h2>
            <ul className="space-y-2 text-sm text-gray-800">
              <li><span className="text-gray-500 w-24 inline-block">روش:</span> <span className="font-semibold">{orderDetail.paymentMethod === 'online' ? 'درگاه آنلاین' : orderDetail.paymentMethod === 'cod' ? 'پرداخت در محل' : '—'}</span></li>
              <li><span className="text-gray-500 w-24 inline-block">وضعیت:</span> <span className="font-semibold">{orderDetail.paymentStatus === 'paid' ? 'پرداخت شده' : orderDetail.paymentStatus === 'cod_pending' ? 'پرداخت در محل' : 'در انتظار پرداخت'}</span></li>
              {orderDetail.paymentRef && <li><span className="text-gray-500 w-24 inline-block">کد رهگیری:</span> <span className="font-mono font-semibold">{orderDetail.paymentRef}</span></li>}
            </ul>
          </div>
        </div>

        <table className="w-full text-sm text-right mb-8">
          <thead className="bg-gray-100 text-gray-700 font-bold">
            <tr>
              <th className="p-3 rounded-r-lg">ردیف</th>
              <th className="p-3">شرح کالا</th>
              <th className="p-3 text-center">تعداد</th>
              <th className="p-3">فی (تومان)</th>
              <th className="p-3 rounded-l-lg">جمع (تومان)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orderDetail.items.map((item: any, idx: number) => (
              <tr key={item.id}>
                <td className="p-3 font-medium text-gray-500">{idx + 1}</td>
                <td className="p-3 font-semibold text-gray-800">{item.productName}</td>
                <td className="p-3 text-center">{item.quantity}</td>
                <td className="p-3 text-gray-600">{formatPrice(item.unitPrice)}</td>
                <td className="p-3 font-bold text-gray-900">{formatPrice(item.totalPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end mb-8">
          <div className="w-1/3 bg-gray-50 rounded-xl p-4">
            <div className="flex justify-between text-sm mb-2 text-gray-600">
              <span>مبلغ کالاها:</span>
              <span>{formatPrice(orderDetail.totalPrice - (orderDetail.shippingCost || 0))}</span>
            </div>
            <div className="flex justify-between text-sm mb-3 text-gray-600">
              <span>هزینه ارسال:</span>
              <span>{orderDetail.shippingCost ? formatPrice(orderDetail.shippingCost) : 'رایگان'}</span>
            </div>
            <div className="flex justify-between text-lg font-black text-gray-900 border-t border-gray-200 pt-3">
              <span>جمع کل فاکتور:</span>
              <span>{formatPrice(orderDetail.totalPrice)}</span>
            </div>
          </div>
        </div>

        <div className="text-center text-sm text-gray-500 mt-16 pt-8 border-t border-gray-200">
          با تشکر از خرید شما از مرصادنت
        </div>
      </div>
    )}
    </>
  );
}