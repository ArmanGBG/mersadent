'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { ShoppingBag, Trash2, Minus, Plus, Loader2, Package, ArrowRight } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

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

interface UserData {
  id: number;
  name: string | null;
  phone: string | null;
  email: string | null;
  avatar: string | null;
}

interface CartSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserData | null;
  onAuthRequired: () => void;
  onCartChange: () => void;
  onViewCart: () => void;
}

export function CartSidebar({ open, onOpenChange, user, onAuthRequired, onCartChange, onViewCart }: CartSidebarProps) {
  const [cart, setCart] = useState<CartData | null>(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchCart = useCallback(async () => {
    if (!user) return;
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
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (open && user) {
      fetchCart();
    }
    if (!open) {
      setCart(null);
    }
  }, [open, user, fetchCart]);

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

  const itemCountText = cart ? new Intl.NumberFormat('fa-IR').format(cart.items.length) : '۰';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-full sm:max-w-md p-0 flex flex-col">
        {/* Header */}
        <SheetHeader className="p-4 border-b border-gray-100 flex-shrink-0">
          <SheetTitle className="flex items-center gap-2 text-right">
            <span className="text-lg">🛒</span>
            <span>سبد خرید</span>
            <span className="text-xs bg-mersadent-accent/10 text-mersadent-accent px-2 py-0.5 rounded-full font-medium">
              ({itemCountText} محصول)
            </span>
          </SheetTitle>
        </SheetHeader>

        {/* Body */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Not logged in */}
          {!user ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 p-6">
              <ShoppingBag className="w-16 h-16 text-gray-200" />
              <p className="text-sm text-gray-500 text-center">برای مشاهده سبد خرید ابتدا وارد شوید</p>
              <Button
                onClick={() => { onOpenChange(false); onAuthRequired(); }}
                className="bg-mersadent-accent hover:bg-mersadent-accent/90 text-white rounded-xl"
              >
                ورود / ثبت‌نام
              </Button>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 text-mersadent-accent animate-spin" />
            </div>
          ) : !cart || cart.items.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center h-full gap-4 p-6">
              <ShoppingBag className="w-16 h-16 text-gray-200" />
              <p className="text-sm text-gray-500 text-center font-medium">سبد خرید شما خالی است</p>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="rounded-xl border-mersadent-accent/30 text-mersadent-accent hover:bg-mersadent-accent/5"
              >
                <ArrowRight className="w-4 h-4 ml-2" />
                بازگشت به فروشگاه
              </Button>
            </div>
          ) : (
            /* Items list */
            <div className="max-h-[60vh] overflow-y-auto">
              <div className="flex flex-col divide-y divide-gray-50">
                {cart.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-3 p-4 hover:bg-gray-50/50 transition-colors"
                  >
                    {/* Image 48x48 */}
                    <div className="w-12 h-12 rounded-lg bg-gray-50 flex-shrink-0 flex items-center justify-center overflow-hidden border border-gray-100">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.productName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="w-5 h-5 text-gray-300" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                      <h4 className="text-sm font-medium text-mersadent-dark leading-5 line-clamp-2">
                        {item.productName}
                      </h4>
                      <span className="text-xs text-gray-400">{item.brandName}</span>

                      {/* Price row */}
                      <span className="text-sm font-medium text-mersadent-dark mt-1">
                        {formatPrice(item.priceAtAdd * item.quantity)}
                      </span>
                    </div>

                    {/* Quantity + Remove controls */}
                    <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                      {/* Quantity controls */}
                      <div className="flex items-center gap-0 border border-gray-200 rounded-lg">
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                          disabled={isUpdating(item.id) || item.quantity <= 1}
                          className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-mersadent-accent disabled:opacity-30 transition-colors rounded-r-lg"
                          aria-label="کاهش تعداد"
                        >
                          {updating === `qty-${item.id}` ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Minus className="w-3 h-3" />
                          )}
                        </button>
                        <span className="w-7 text-center text-xs font-semibold text-mersadent-dark select-none">
                          {new Intl.NumberFormat('fa-IR').format(item.quantity)}
                        </span>
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                          disabled={isUpdating(item.id)}
                          className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-mersadent-accent disabled:opacity-30 transition-colors rounded-l-lg"
                          aria-label="افزایش تعداد"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Remove button */}
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        disabled={isUpdating(item.id)}
                        className="w-7 h-7 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30"
                        aria-label="حذف از سبد خرید"
                      >
                        {updating === `rm-${item.id}` ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer - sticky bottom */}
        {user && cart && cart.items.length > 0 && (
          <div className="flex-shrink-0 border-t border-gray-100 bg-white">
            <div className="p-4 flex flex-col gap-3">
              {/* Total */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">جمع کل:</span>
                <span className="text-base font-bold text-mersadent-dark">
                  {formatPrice(cart.totalPrice)}
                </span>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="w-full rounded-xl border-gray-200 text-gray-600 hover:bg-gray-50 h-11 text-sm font-medium"
                >
                  ادامه خرید
                </Button>
                <Button
                  onClick={onViewCart}
                  className="w-full bg-mersadent-accent hover:bg-mersadent-accent/90 text-white rounded-xl h-11 text-sm font-semibold"
                >
                  مشاهده سبد خرید
                  <ArrowRight className="w-4 h-4 mr-2" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}