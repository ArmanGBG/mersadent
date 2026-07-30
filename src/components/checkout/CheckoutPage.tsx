'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Home, ShoppingBag, MapPin, Loader2, CheckCircle2, CreditCard, Truck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface CartItem {
  id: number;
  productId: number;
  productName: string;
  brandName: string;
  currentPrice: number;
  priceAtAdd: number;
  quantity: number;
  image: string | null;
}

interface CartData {
  id: number;
  items: CartItem[];
  totalPrice: number;
  itemCount: number;
}

interface Address {
  id: number;
  title: string | null;
  province: string | null;
  city: string | null;
  fullAddress: string;
  postalCode: string | null;
  isDefault: boolean;
}

interface User {
  id: number;
  name: string | null;
  phone: string | null;
  email: string | null;
  avatar: string | null;
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('fa-IR').format(price) + ' تومان';
};

const fadeIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.25 },
};

interface CheckoutPageProps {
  user: User | null;
  onNavigate: (view: any) => void;
  onAuthRequired: () => void;
  onCartChange: () => void;
  onOrderSuccess?: (orderId: number, orderNumber: string) => void;
}

export function CheckoutPage({ user, onNavigate, onAuthRequired, onCartChange, onOrderSuccess }: CheckoutPageProps) {
  const [cart, setCart] = useState<CartData | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<number | null>(null);
  const [shippingName, setShippingName] = useState('');
  const [shippingPhone, setShippingPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cod'>('cod');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successDialog, setSuccessDialog] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [successOrderId, setSuccessOrderId] = useState<number>(0);

  useEffect(() => {
    if (!user) { queueMicrotask(() => { setLoading(false); }); return; }
    const token = localStorage.getItem('user_token');

    Promise.all([
      fetch('/api/cart', { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch('/api/addresses', { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.ok ? r.json() : { addresses: [] }).catch(() => ({ addresses: [] })),
    ]).then(([cartData, addrData]) => {
      if (cartData) setCart(cartData);
      const addrs = addrData.addresses || [];
      setAddresses(addrs);
      if (user?.name) setShippingName(user.name);
      if (user?.phone) setShippingPhone(user.phone);
      const defAddr = addrs.find(a => a.isDefault);
      if (defAddr) {
        setSelectedAddress(defAddr.id);
        setShippingAddress(defAddr.fullAddress);
      }
      setLoading(false);
    });
  }, [user]);

  const handleSelectAddress = (addr: Address) => {
    setSelectedAddress(addr.id);
    setShippingAddress(addr.fullAddress);
  };

  const handleSubmit = async () => {
    if (!shippingPhone || !shippingAddress) {
      toast.error('لطفاً شماره تلفن و آدرس ارسال را وارد کنید');
      return;
    }
    if (cart?.items.length === 0) {
      toast.error('سبد خرید خالی است');
      return;
    }
    setSubmitting(true);
    try {
      const token = localStorage.getItem('user_token');
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          shippingName: shippingName || null,
          shippingPhone,
          shippingAddress,
          notes: notes || null,
          paymentMethod,
        }),
      });
      const data = await res.json();
      if (res.ok || res.status === 201) {
        setOrderNumber(data.orderNumber || '');
        setSuccessOrderId(data.id || 0);
        setSuccessDialog(true);
        onCartChange();
        onOrderSuccess?.(data.id || 0, data.orderNumber || '');
      } else {
        toast.error(data.error || 'خطا در ثبت سفارش');
      }
    } catch {
      toast.error('خطای شبکه');
    }
    setSubmitting(false);
  };

  if (!user) {
    return (
      <motion.div {...fadeIn} className="max-w-4xl mx-auto px-4 sm:px-6 py-20 text-center">
        <ShoppingBag className="w-16 h-16 text-gray-200 mx-auto mb-4" />
        <h2 className="text-lg font-bold text-gray-400 mb-2">برای تکمیل خرید وارد شوید</h2>
        <Button onClick={onAuthRequired} className="mt-4 bg-mersadent-accent hover:bg-mersadent-accent/90 text-white rounded-xl">
          ورود / ثبت‌نام
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div {...fadeIn} className="max-w-6xl mx-auto px-4 sm:px-6 pb-8">
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
            <BreadcrumbLink onClick={() => onNavigate({ type: 'cart' })} className="cursor-pointer text-sm">
              سبد خرید
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>تکمیل سفارش</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="text-xl sm:text-2xl font-bold text-mersadent-dark mb-6">تکمیل سفارش</h1>

      {loading ? (
        <div className="grid md:grid-cols-2 gap-6">
          <Skeleton className="h-96 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      ) : !cart || cart.items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ShoppingBag className="w-16 h-16 text-gray-200 mb-4" />
          <h3 className="text-lg font-semibold text-gray-400 mb-2">سبد خرید خالی است</h3>
          <Button variant="outline" onClick={() => onNavigate({ type: 'home' })} className="mt-4 rounded-xl">
            بازگشت به فروشگاه
          </Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-5 gap-6">
          {/* Left column: Order Summary */}
          <div className="md:col-span-2 order-2 md:order-1">
            <Card className="border border-gray-100 sticky top-24">
              <CardContent className="p-5 flex flex-col gap-4">
                <h3 className="text-sm font-bold text-mersadent-dark">خلاصه سفارش</h3>
                <div className="flex flex-col gap-3 max-h-72 overflow-y-auto">
                  {cart.items.map(item => (
                    <div key={item.id} className="flex gap-3">
                      <div className="w-12 h-12 rounded-lg bg-gray-50 flex-shrink-0 flex items-center justify-center overflow-hidden">
                        {item.image ? (
                          <img src={item.image} alt={item.productName} className="w-full h-full object-cover" />
                        ) : (
                          <ShoppingBag className="w-5 h-5 text-gray-300" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-mersadent-dark line-clamp-1">{item.productName}</p>
                        <p className="text-[10px] text-gray-400">{item.brandName}</p>
                        <p className="text-[10px] text-gray-400">
                          {new Intl.NumberFormat('fa-IR').format(item.quantity)} × {formatPrice(item.priceAtAdd)}
                        </p>
                      </div>
                      <span className="text-xs font-bold text-mersadent-dark flex-shrink-0">
                        {formatPrice(item.priceAtAdd * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">تعداد اقلام:</span>
                  <span className="font-medium">{cart.itemCount} عدد</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-sm font-bold text-mersadent-dark">جمع کل:</span>
                  <span className="text-base font-extrabold text-mersadent-accent">{formatPrice(cart.totalPrice)}</span>
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={submitting || !shippingPhone || !shippingAddress}
                  className="w-full bg-mersadent-accent hover:bg-mersadent-accent/90 text-white rounded-xl h-11 font-semibold mt-2"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'ثبت سفارش'
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right column: Shipping Form */}
          <div className="md:col-span-3 order-1 md:order-2 flex flex-col gap-6">
            {/* Saved Addresses */}
            {addresses.length > 0 && (
              <Card className="border border-gray-100">
                <CardContent className="p-5">
                  <h3 className="text-sm font-bold text-mersadent-dark mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-mersadent-accent" />
                    آدرس‌های ذخیره شده
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {addresses.map(addr => (
                      <button
                        key={addr.id}
                        onClick={() => handleSelectAddress(addr)}
                        className={`p-3 rounded-xl border text-right transition-all ${
                          selectedAddress === addr.id
                            ? 'border-mersadent-accent bg-mersadent-accent/5'
                            : 'border-gray-100 hover:border-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-mersadent-dark">{addr.title || 'آدرس'}</span>
                          {addr.isDefault && (
                            <span className="text-[10px] bg-mersadent-accent/10 text-mersadent-accent px-1.5 py-0 rounded-full">پیش‌فرض</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-2">{addr.fullAddress}</p>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Shipping Form */}
            <Card className="border border-gray-100">
              <CardContent className="p-5 flex flex-col gap-4">
                <h3 className="text-sm font-bold text-mersadent-dark flex items-center gap-2">
                  <Truck className="w-4 h-4 text-mersadent-accent" />
                  اطلاعات ارسال
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-gray-600">نام و نام خانوادگی</label>
                    <Input
                      value={shippingName}
                      onChange={(e) => setShippingName(e.target.value)}
                      placeholder="نام گیرنده"
                      className="h-10 text-sm"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-gray-600">شماره تلفن <span className="text-red-500">*</span></label>
                    <Input
                      value={shippingPhone}
                      onChange={(e) => setShippingPhone(e.target.value)}
                      placeholder="09123456789"
                      className="h-10 text-sm"
                      dir="ltr"
                      maxLength={11}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-gray-600">آدرس کامل <span className="text-red-500">*</span></label>
                  <Textarea
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    placeholder="آدرس کامل شامل خیابان، کوچه، پلاک، واحد"
                    className="min-h-[80px] text-sm resize-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-gray-600">توضیحات (اختیاری)</label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="نکته‌ای برای ارسال (مثلاً: پشت در بگذارید)"
                    className="min-h-[60px] text-sm resize-none"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card className="border border-gray-100">
              <CardContent className="p-5">
                <h3 className="text-sm font-bold text-mersadent-dark mb-4 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-mersadent-accent" />
                  روش پرداخت
                </h3>
                <div className="flex flex-col gap-2">
                  <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${paymentMethod === 'online' ? 'border-mersadent-accent bg-mersadent-accent/5' : 'border-gray-100 hover:border-gray-200'}`}>
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'online'}
                      onChange={() => setPaymentMethod('online')}
                      className="accent-mersadent-accent"
                    />
                    <div>
                      <span className="text-sm font-medium text-mersadent-dark">پرداخت آنلاین</span>
                      <p className="text-xs text-amber-500">به زودی</p>
                    </div>
                  </label>
                  <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${paymentMethod === 'cod' ? 'border-mersadent-accent bg-mersadent-accent/5' : 'border-gray-100 hover:border-gray-200'}`}>
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'cod'}
                      onChange={() => setPaymentMethod('cod')}
                      className="accent-mersadent-accent"
                    />
                    <div>
                      <span className="text-sm font-medium text-mersadent-dark">پرداخت در محل</span>
                      <p className="text-xs text-gray-400">پرداخت هنگام تحویل کالا</p>
                    </div>
                  </label>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Success Dialog */}
      <Dialog open={successDialog} onOpenChange={setSuccessDialog}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader className="items-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-3">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <DialogTitle>✅ سفارش شما با موفقیت ثبت شد</DialogTitle>
            <DialogDescription>
              {orderNumber && (
                <span className="block mt-2 text-sm font-medium text-mersadent-accent" dir="ltr">{orderNumber}</span>
              )}
              سفارش شما با موفقیت ثبت شد و در حال بررسی است.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 mt-2">
            <Button
              onClick={() => { setSuccessDialog(false); onNavigate({ type: 'user', tab: 'orders' }); }}
              className="bg-mersadent-accent hover:bg-mersadent-accent/90 text-white rounded-xl"
            >
              مشاهده سفارشات
            </Button>
            <Button
              variant="outline"
              onClick={() => { setSuccessDialog(false); onNavigate({ type: 'home' }); }}
              className="rounded-xl"
            >
              بازگشت به فروشگاه
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}