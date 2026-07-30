'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Home, ShoppingBag, X, Minus, Plus, Loader2, ArrowLeft, Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
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

interface CartPageProps {
  user: User | null;
  onNavigate: (view: any) => void;
  onAuthRequired: () => void;
  onCartChange: () => void;
}

export function CartPage({ user, onNavigate, onAuthRequired, onCartChange }: CartPageProps) {
  const [cart, setCart] = useState<CartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchCart = async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    try {
      const token = localStorage.getItem('user_token');
      const res = await fetch('/api/cart', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCart(data);
      }
    } catch {
      // silent
    }
    setLoading(false);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user) { if (!cancelled) setLoading(false); return; }
      if (!cancelled) setLoading(true);
      try {
        const token = localStorage.getItem('user_token');
        const res = await fetch('/api/cart', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setCart(data);
        }
      } catch {
        // silent
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user]);

  const handleUpdateQuantity = async (itemId: number, newQuantity: number) => {
    setUpdating(`qty-${itemId}`);
    try {
      const token = localStorage.getItem('user_token');
      const res = await fetch('/api/cart/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ itemId, quantity: newQuantity }),
      });
      if (res.ok) {
        const data = await res.json();
        setCart(data);
        onCartChange();
      }
    } catch {
      toast.error('خطا در بروزرسانی');
    }
    setUpdating(null);
  };

  const handleRemoveItem = async (itemId: number) => {
    setUpdating(`rm-${itemId}`);
    try {
      const token = localStorage.getItem('user_token');
      const res = await fetch('/api/cart/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ itemId }),
      });
      if (res.ok) {
        const data = await res.json();
        setCart(data);
        onCartChange();
        toast.success('محصول از سبد خرید حذف شد');
      }
    } catch {
      toast.error('خطا در حذف محصول');
    }
    setUpdating(null);
  };

  const isUpdating = (id: number) => updating === `qty-${id}` || updating === `rm-${id}`;

  if (!user) {
    return (
      <motion.div {...fadeIn} className="max-w-4xl mx-auto px-4 sm:px-6 py-20 text-center">
        <ShoppingBag className="w-16 h-16 text-gray-200 mx-auto mb-4" />
        <h2 className="text-lg font-bold text-gray-400 mb-2">برای مشاهده سبد خرید وارد شوید</h2>
        <Button
          onClick={onAuthRequired}
          className="mt-4 bg-mersadent-accent hover:bg-mersadent-accent/90 text-white rounded-xl"
        >
          ورود / ثبت‌نام
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
            <BreadcrumbPage>سبد خرید</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="text-xl sm:text-2xl font-bold text-mersadent-dark mb-6">سبد خرید</h1>

      {loading ? (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : !cart || cart.items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ShoppingBag className="w-16 h-16 text-gray-200 mb-4" />
          <h3 className="text-lg font-semibold text-gray-400 mb-2">سبد خرید شما خالی است</h3>
          <Button
            variant="outline"
            onClick={() => onNavigate({ type: 'home' })}
            className="mt-4 rounded-xl border-mersadent-accent/30 text-mersadent-accent hover:bg-mersadent-accent/5"
          >
            بازگشت به فروشگاه
          </Button>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Items list */}
          <div className="flex-1 flex flex-col gap-3">
            {cart.items.map((item) => (
              <Card key={item.id} className="border border-gray-100 overflow-hidden">
                <CardContent className="p-4 flex gap-4">
                  {/* Image */}
                  <button
                    onClick={() => onNavigate({ type: 'product', productId: item.productId })}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg bg-gray-50 flex-shrink-0 flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    {item.image ? (
                      <img src={item.image} alt={item.productName} className="w-full h-full object-cover" />
                    ) : (
                      <ShoppingBag className="w-8 h-8 text-gray-300" />
                    )}
                  </button>

                  {/* Info */}
                  <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                    <button
                      onClick={() => onNavigate({ type: 'product', productId: item.productId })}
                      className="text-sm font-semibold text-mersadent-dark leading-5 line-clamp-2 text-right hover:text-mersadent-accent transition-colors"
                    >
                      {item.productName}
                    </button>
                    <span className="text-xs text-gray-400">{item.brandName}</span>
                    <span className="text-sm font-bold text-mersadent-dark">{formatPrice(item.priceAtAdd)}</span>
                  </div>

                  {/* Controls */}
                  <div className="flex flex-col items-end gap-3 flex-shrink-0">
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      disabled={isUpdating(item.id)}
                      className="text-gray-300 hover:text-red-500 transition-colors"
                    >
                      {isUpdating(item.id) && updating === `rm-${item.id}` ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                    <div className="flex items-center gap-0 border border-gray-200 rounded-lg">
                      <button
                        onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                        disabled={isUpdating(item.id) || item.quantity <= 1}
                        className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-mersadent-accent disabled:opacity-30 transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center text-sm font-semibold text-mersadent-dark">
                        {new Intl.NumberFormat('fa-IR').format(item.quantity)}
                      </span>
                      <button
                        onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                        disabled={isUpdating(item.id)}
                        className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-mersadent-accent disabled:opacity-30 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className="text-sm font-bold text-mersadent-dark">
                      {formatPrice(item.priceAtAdd * item.quantity)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Summary */}
          <div className="w-full lg:w-80 flex-shrink-0">
            <Card className="border border-gray-100 sticky top-24">
              <CardContent className="p-5 flex flex-col gap-4">
                <h3 className="text-sm font-bold text-mersadent-dark">خلاصه سفارش</h3>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">تعداد اقلام:</span>
                  <span className="font-medium text-mersadent-dark">{cart.itemCount} عدد</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">جمع کل:</span>
                  <span className="font-bold text-mersadent-dark">{formatPrice(cart.totalPrice)}</span>
                </div>
                <Separator />
                <Button
                  onClick={() => onNavigate({ type: 'checkout' })}
                  className="w-full bg-mersadent-accent hover:bg-mersadent-accent/90 text-white rounded-xl h-11 font-semibold"
                >
                  ادامه به پرداخت
                </Button>
                <Button
                  variant="outline"
                  onClick={() => onNavigate({ type: 'home' })}
                  className="w-full rounded-xl border-gray-200 text-gray-600"
                >
                  <ArrowLeft className="w-4 h-4 ml-1.5" />
                  بازگشت به فروشگاه
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </motion.div>
  );
}