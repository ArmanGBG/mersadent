'use client';

import React, { useState, useEffect } from 'react';
import { Phone, ShoppingBag, ShoppingCart, Shield, ChevronUp, Package, ArrowRight, MapPin, Loader2, Mail, XCircle, ChevronDown, CreditCard, User, CheckCircle, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface AdminUserDetailProps {
  userId: number;
  token: string;
  onBack: () => void;
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('fa-IR').format(price) + ' تومان';
};

const persianDate = (date: string) => {
  return new Date(date).toLocaleDateString('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export function AdminUserDetail({ userId, token, onBack }: AdminUserDetailProps) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);

  // Browser history management: push a state when entering detail view,
  // and listen for popstate (browser back button) to call onBack
  useEffect(() => {
    window.history.pushState({ adminUserDetail: true }, '');
    const handlePopState = (e: PopStateEvent) => {
      onBack();
    };
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [onBack]);

  useEffect(() => {
    fetchUser();
  }, [userId]);

  const fetchUser = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
        onBack();
      } else {
        setUser(data.user);
      }
    } catch {
      toast.error('خطا در دریافت اطلاعات مشتری');
      onBack();
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-[#2FC4C9]" />
        <p className="text-gray-500 font-medium">در حال دریافت اطلاعات مشتری...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <Button variant="ghost" onClick={onBack} className="h-10 w-10 p-0 text-gray-500 hover:text-gray-900 bg-gray-50">
          <ArrowRight className="w-5 h-5" />
        </Button>
        <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-2xl shrink-0">
          {user.avatar ? <img src={user.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" /> : (user.name ? user.name.charAt(0) : 'U')}
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
            {user.name || 'کاربر بدون نام'}
            {user.userType && (
              <span className="bg-[#2FC4C9]/10 text-[#2FC4C9] text-xs px-3 py-1 rounded-full font-medium">
                {user.userType}
              </span>
            )}
            <span className={`text-xs px-3 py-1 rounded-full font-medium ${user.isActive ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
              {user.isActive ? 'وضعیت فعال' : 'حساب مسدود'}
            </span>
          </h2>
          <div className="flex items-center gap-6 text-sm text-gray-500 mt-1">
            <span className="flex items-center gap-1.5"><Phone className="w-4 h-4" /> <span dir="ltr">{user.phone || '—'}</span></span>
            {user.email && <span className="flex items-center gap-1.5"><Mail className="w-4 h-4" /> <span>{user.email}</span></span>}
            <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> <span>عضویت: {persianDate(user.createdAt).split(' ')[0]}</span></span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-500"><ShoppingBag className="w-6 h-6" /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">تعداد کل سفارشات</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{user.totalOrders}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500"><Shield className="w-6 h-6" /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">مجموع پرداخت‌های موفق</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{formatPrice(user.totalSpent)}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-500"><MapPin className="w-6 h-6" /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">آدرس‌های ثبت شده</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{user.addresses?.length || 0}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Addresses Box */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="bg-gray-50/50 border-b border-gray-100 px-5 py-4 font-bold text-gray-800 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-gray-400" /> لیست آدرس‌ها
            </div>
            <div className="p-5 space-y-4">
              {user.addresses && user.addresses.length > 0 ? (
                user.addresses.map((addr: any, i: number) => (
                  <div key={addr.id} className={`p-4 rounded-xl border ${i === 0 ? 'bg-blue-50/30 border-blue-100' : 'bg-gray-50 border-gray-100'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-bold text-gray-900">{addr.province} - {addr.city}</span>
                      {i === 0 && <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">پیش‌فرض</span>}
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">{addr.fullAddress}</p>
                    <div className="mt-3 text-xs text-gray-500 flex flex-wrap gap-3">
                      <span>پلاک: {addr.plaque || '-'}</span>
                      <span>واحد: {addr.unit || '-'}</span>
                      <span>کد پستی: {addr.postalCode || '-'}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-gray-400">
                  <MapPin className="w-10 h-10 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">هیچ آدرسی ثبت نشده است.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="bg-gray-50/50 border-b border-gray-100 px-5 py-4 font-bold text-gray-800 flex items-center gap-2">
              <Package className="w-5 h-5 text-gray-400" /> تاریخچه کامل سفارشات
            </div>
            <div className="p-0 overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead className="bg-gray-50 border-b border-gray-100 text-gray-500">
                  <tr>
                    <th className="px-5 py-3 font-semibold">شماره سفارش</th>
                    <th className="px-5 py-3 font-semibold">تاریخ</th>
                    <th className="px-5 py-3 font-semibold">اقلام</th>
                    <th className="px-5 py-3 font-semibold">مبلغ کل</th>
                    <th className="px-5 py-3 font-semibold">وضعیت ارسال</th>
                    <th className="px-5 py-3 font-semibold">پرداخت</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {user.orders && user.orders.length > 0 ? (
                    user.orders.map((order: any) => (
                      <React.Fragment key={order.id}>
                        <tr 
                          onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                          className={`transition-colors cursor-pointer ${expandedOrderId === order.id ? 'bg-blue-50/40' : 'hover:bg-gray-50/50'}`}
                        >
                          <td className="px-5 py-4 font-mono font-bold text-gray-700 flex items-center gap-2">
                            {expandedOrderId === order.id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                            MDC-{order.id}
                          </td>
                          <td className="px-5 py-4 text-gray-600">{persianDate(order.createdAt).split(' ')[0]}</td>
                          <td className="px-5 py-4">
                            <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded font-medium">{order.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0} عدد کالا</span>
                          </td>
                          <td className="px-5 py-4 font-bold text-gray-900">{formatPrice(order.totalPrice)}</td>
                          <td className="px-5 py-4">
                            {(() => {
                              switch(order.status) {
                                case 'delivered': return <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md text-xs w-fit"><CheckCircle className="w-3.5 h-3.5"/> تحویل داده شده</span>;
                                case 'cancelled': return <span className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded-md text-xs w-fit"><XCircle className="w-3.5 h-3.5"/> لغو شده</span>;
                                case 'pending': return <span className="flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-1 rounded-md text-xs w-fit"><Package className="w-3.5 h-3.5"/> در انتظار تأیید</span>;
                                case 'confirmed': return <span className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-1 rounded-md text-xs w-fit"><CheckCircle className="w-3.5 h-3.5"/> تأیید شده</span>;
                                case 'shipped': return <span className="flex items-center gap-1 text-purple-600 bg-purple-50 px-2 py-1 rounded-md text-xs w-fit"><Package className="w-3.5 h-3.5"/> ارسال شده</span>;
                                case 'processing': return <span className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-1 rounded-md text-xs w-fit"><Package className="w-3.5 h-3.5"/> در حال پردازش</span>;
                                default: return <span className="flex items-center gap-1 text-gray-600 bg-gray-50 px-2 py-1 rounded-md text-xs w-fit"><Package className="w-3.5 h-3.5"/> {order.status}</span>;
                              }
                            })()}
                          </td>
                          <td className="px-5 py-4">
                            {(() => {
                              const ps = order.paymentStatus?.toLowerCase();
                              switch(ps) {
                                case 'paid': return <span className="text-emerald-600 font-medium bg-emerald-50 px-2 py-1 rounded text-xs flex items-center gap-1 w-fit"><CheckCircle className="w-3 h-3"/> پرداخت شده</span>;
                                case 'failed': return <span className="text-red-500 font-medium bg-red-50 px-2 py-1 rounded text-xs flex items-center gap-1 w-fit"><XCircle className="w-3 h-3"/> ناموفق</span>;
                                case 'cod_pending': return <span className="text-amber-600 font-medium bg-amber-50 px-2 py-1 rounded text-xs flex items-center gap-1 w-fit"><CreditCard className="w-3 h-3"/> پرداخت در محل</span>;
                                default: return <span className="text-gray-500 font-medium bg-gray-50 px-2 py-1 rounded text-xs flex items-center gap-1 w-fit"><CreditCard className="w-3 h-3"/> در انتظار پرداخت</span>;
                              }
                            })()}
                          </td>
                        </tr>
                        {/* Expanded Details Row */}
                        {expandedOrderId === order.id && (
                          <tr className="bg-blue-50/20 border-b border-blue-100">
                            <td colSpan={6} className="p-0">
                              <div className="px-10 py-6">
                                <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                                  <ShoppingCart className="w-4 h-4 text-blue-500" /> ریز اقلام سفارش
                                </h4>
                                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                  <table className="w-full text-xs text-right">
                                    <thead className="bg-gray-50 border-b border-gray-100 text-gray-500">
                                      <tr>
                                        <th className="px-4 py-3 font-semibold">محصول</th>
                                        <th className="px-4 py-3 font-semibold text-center">تعداد</th>
                                        <th className="px-4 py-3 font-semibold">فی (زمان خرید)</th>
                                        <th className="px-4 py-3 font-semibold">قیمت کل</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                      {order.items?.map((item: any) => (
                                        <tr key={item.id} className="hover:bg-gray-50/50">
                                          <td className="px-4 py-3 flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                                              {item.product?.images?.[0]?.url ? (
                                                <img src={item.product.images[0].url} alt="" className="w-full h-full object-cover" />
                                              ) : (
                                                <Package className="w-5 h-5 text-gray-400" />
                                              )}
                                            </div>
                                            <span className="font-medium text-gray-800 line-clamp-1">{item.product?.name || 'محصول نامشخص'}</span>
                                          </td>
                                          <td className="px-4 py-3 text-center font-medium">{item.quantity}</td>
                                          <td className="px-4 py-3 text-gray-600">{formatPrice(item.unitPrice)}</td>
                                          <td className="px-4 py-3 font-bold text-gray-900">{formatPrice(item.unitPrice * item.quantity)}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                                <div className="mt-4 flex flex-col items-end text-sm text-gray-600 gap-1 border-t pt-3">
                                  <div className="flex justify-between w-64">
                                    <span>مبلغ کالاها:</span>
                                    <span className="font-medium text-gray-800">{formatPrice(order.totalPrice - (order.shippingCost || 0))}</span>
                                  </div>
                                  <div className="flex justify-between w-64">
                                    <span>هزینه ارسال:</span>
                                    <span className="font-medium text-gray-800">
                                      {order.shippingCost ? formatPrice(order.shippingCost) : <span className="text-green-600">رایگان</span>}
                                    </span>
                                  </div>
                                  <div className="flex justify-between w-64 text-base font-bold text-gray-900 mt-1 border-t pt-2">
                                    <span>مبلغ قابل پرداخت:</span>
                                    <span>{formatPrice(order.totalPrice)}</span>
                                  </div>
                                </div>
                                
                                {/* Payment & Shipping Extra Details */}
                                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center">
                                    <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><CreditCard className="w-3.5 h-3.5"/> اطلاعات پرداخت</p>
                                    <p className="text-sm font-medium text-gray-800">وضعیت: {order.paymentStatus?.toLowerCase() === 'paid' ? 'پرداخت شده' : order.paymentStatus === 'failed' ? 'ناموفق' : order.paymentStatus === 'cod_pending' ? 'پرداخت در محل' : 'در انتظار پرداخت'}</p>
                                    <p className="text-xs text-gray-500 mt-1">روش: {order.paymentMethod === 'online' ? 'درگاه آنلاین' : order.paymentMethod === 'cod' ? 'پرداخت در محل' : order.paymentMethod || '—'}</p>
                                    {order.paymentRef && <p className="text-xs text-gray-500 mt-1 font-mono">کد رهگیری: {order.paymentRef}</p>}
                                    <p className="text-xs text-gray-500 mt-1">شماره سفارش: {order.orderNumber}</p>
                                  </div>
                                  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center">
                                    <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><MapPin className="w-3.5 h-3.5"/> آدرس ارسال</p>
                                    <p className="text-xs text-gray-700 leading-relaxed">
                                      {order.shippingAddress || 'ثبت نشده'}
                                    </p>
                                  </div>
                                  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center">
                                    <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Phone className="w-3.5 h-3.5"/> گیرنده</p>
                                    <p className="text-sm font-medium text-gray-800">{order.shippingName || user.name || '—'}</p>
                                    <p className="text-xs text-gray-500 mt-1" dir="ltr">{order.shippingPhone || user.phone || '—'}</p>
                                    {order.notes && <p className="text-xs text-amber-600 mt-2">یادداشت: {order.notes}</p>}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center text-gray-400">
                        <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>این مشتری هنوز سفارشی ثبت نکرده است.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
