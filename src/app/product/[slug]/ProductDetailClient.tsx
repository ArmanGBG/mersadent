'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, ChevronLeft, ShoppingCart, Star, Shield, ShieldCheck, Truck, 
  RotateCcw, Info, Phone, Send, Mail, CheckCircle2, HeartPulse, AlertTriangle, 
  FileText, Home, Package, Minus, Plus, Loader2, AlertCircle, ShoppingBag, 
  MessageCircle, GitCompareArrows, Share2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { useAppContext } from '@/contexts/AppContext';
import { useAppNavigation } from '@/hooks/useAppNavigation';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductCard, formatPrice } from '@/components/product/ProductCard';
import { useCompare } from '@/components/compare';

const availabilityLabel = (av: string) => {
  switch (av) {
    case 'in_stock': return { text: 'موجود در انبار', color: 'bg-green-100 text-green-700' };
    case 'low_stock': return { text: 'موجودی محدود', color: 'bg-amber-100 text-amber-700' };
    case 'out_of_stock': return { text: 'ناموجود', color: 'bg-red-100 text-red-700' };
    case 'coming_soon': return { text: 'به زودی', color: 'bg-blue-100 text-blue-700' };
    default: return { text: 'نامشخص', color: 'bg-gray-100 text-gray-700' };
  }
};

const fadeIn = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.3 }
};

export default function ProductDetailClient({
  initialProduct,
  relatedProducts,
}: {
  initialProduct: any;
  relatedProducts: any[];
}) {
  const { user, setCartCount, setAuthModalOpen, setCartSidebarOpen } = useAppContext();
  const navigate = useAppNavigation();
  const onNavigate = navigate; // for backward compatibility in the component
  
  const [product, setProduct] = useState<any>(initialProduct);
  const [similar, setSimilar] = useState<any[]>(relatedProducts);
  const [loading, setLoading] = useState(false);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [addQty, setAddQty] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);

  

  useEffect(() => {
    setProduct(initialProduct);
    setSimilar(relatedProducts || []);
    setSelectedImage(0);
  }, [initialProduct, relatedProducts]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <Skeleton className="h-6 w-48 mb-6" />
        <div className="grid md:grid-cols-2 gap-8">
          <Skeleton className="h-80 rounded-2xl" />
          <div className="flex flex-col gap-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 text-center">
        <AlertCircle className="w-16 h-16 text-gray-200 mx-auto mb-4" />
        <h2 className="text-lg font-bold text-gray-400">محصول یافت نشد</h2>
        <Button variant="outline" onClick={() => onNavigate({ type: 'home' })} className="mt-4">
          بازگشت به خانه
        </Button>
      </div>
    );
  }

  const av = availabilityLabel(product.availability);
  const { toggleCompare, isInCompare } = useCompare();
  
  const specs: Record<string, string> = product.specs ? (() => { try { return JSON.parse(product.specs); } catch { return {}; } })() : {};
  const canAdd = product.availability === 'in_stock' && product.price !== null && product.priceType !== 'call';

  const onAuthRequired = () => {
    setAuthModalOpen(true);
  };

  const onAddToCart = async (productId: number, quantity: number = 1) => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    const token = localStorage.getItem('user_token');
    try {
      const res = await fetch('/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ productId, quantity }),
      });
      if (res.ok) {
        toast.success('محصول به سبد خرید اضافه شد');
        const data = await res.json();
        setCartCount(data.itemCount || 0);
        setCartSidebarOpen(true);
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || 'مشکلی پیش آمد');
      }
    } catch {
      toast.error('ارتباط با سرور برقرار نشد');
    }
  };

  const handleAddToCart = async () => {
    if (!user) { onAuthRequired(); return; }
    if (addingToCart) return;
    setAddingToCart(true);
    await onAddToCart(product.id, addQty);
    setAddingToCart(false);
    setAddQty(1);
  };

  return (
    <motion.div {...fadeIn} className="max-w-7xl mx-auto px-4 sm:px-6 pb-8">
      {/* Breadcrumb */}
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink onClick={() => onNavigate({ type: 'home' })} className="cursor-pointer flex items-center gap-1 text-sm">
              <Home className="w-3.5 h-3.5" />
              خانه
            </BreadcrumbLink>
          </BreadcrumbItem>
          {product.category.parent && (() => {
            const parent = product.category.parent;
            const grandParent = parent.parent;

            return (
              <>
                {grandParent && (
                  <>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbLink
                        onClick={() => onNavigate({
                          type: 'category',
                          categoryId: grandParent.id,
                          slug: grandParent.slug,
                        })}
                        className="cursor-pointer text-sm"
                      >
                        {grandParent.name}
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                  </>
                )}
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink
                    onClick={() => onNavigate({
                      type: 'category',
                      categoryId: parent.id,
                      slug: parent.slug,
                    })}
                    className="cursor-pointer text-sm"
                  >
                    {parent.name}
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </>
            );
          })()}
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink
              onClick={() => onNavigate({
                type: 'category',
                categoryId: product.categoryId,
                slug: product.category.slug,
                parentName: product.category.parent?.name,
                parentSlug: product.category.parent?.slug,
              })}
              className="cursor-pointer text-sm"
            >
              {product.category.name}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="truncate max-w-[150px]">{product.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Back button */}
      <Button
        variant="ghost"
        onClick={() => {
          if (typeof window !== 'undefined' && window.history.state && window.history.state.depth > 0) {
            window.history.back();
          } else {
            onNavigate({ type: 'home' });
          }
        }}
        className="mb-6 gap-1.5 text-sm text-gray-500 hover:text-mersadent-dark"
      >
        <ChevronRight className="w-4 h-4" />
        بازگشت
      </Button>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Image Gallery */}
        <div className="space-y-3">
          {/* Main image */}
          <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl flex items-center justify-center aspect-square max-h-[450px] overflow-hidden">
            {product.images && product.images.length > 0 ? (
              <img
                src={product.images[selectedImage].url}
                alt={product.images[selectedImage].alt || product.name}
                className="w-full h-full object-contain p-2"
              />
            ) : (
              <Package className="w-24 h-24 text-gray-200" />
            )}
            {product.featured && (
              <Badge className="absolute top-4 left-4 bg-amber-500 text-white">
                <Star className="w-3.5 h-3.5 ml-1" />
                ویژه
              </Badge>
            )}
          </div>
          {/* Thumbnails */}
          {product.images && product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {product.images.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(idx)}
                  className={`flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                    idx === selectedImage
                      ? 'border-mersadent-accent'
                      : 'border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <img
                    src={img.url}
                    alt={img.alt || product.name}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="text-xs">{product.brand.name}</Badge>
              {product.model && (
                <Badge variant="outline" className="text-xs">مدل {product.model}</Badge>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-mersadent-dark leading-9">{product.name}</h1>
          </div>

          {/* Price */}
          <div className="flex flex-col gap-2">
            {product.priceType === 'call' || product.price === null ? (
              <Badge className="w-fit bg-mersadent-accent/10 text-mersadent-accent border-mersadent-accent/20 px-4 py-1.5 text-sm font-semibold">
                تماس بگیرید
              </Badge>
            ) : product.discountPercent > 0 ? (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-extrabold text-red-600">
                    {formatPrice(Math.round(product.price! * (1 - product.discountPercent / 100)))}
                  </span>
                  <Badge className="bg-red-500 text-white text-sm px-2.5 py-0.5 font-bold">
                    {product.discountPercent}% تخفیف
                  </Badge>
                </div>
                <span className="text-sm text-gray-400 line-through">
                  {formatPrice(product.price)}
                </span>
              </div>
            ) : (
              <span className="text-2xl font-extrabold text-mersadent-dark">{formatPrice(product.price)}</span>
            )}
          </div>

          {/* Availability */}
          <div className="flex items-center gap-2">
            <span className={`text-xs px-3 py-1 rounded-full ${av.color}`}>{av.text}</span>
          </div>

          <Separator />

          {/* Specs */}
          {(Object.keys(specs).length > 0 || product.sku || product.country || product.warranty || product.weight) && (
            <div>
              <h3 className="text-sm font-bold text-mersadent-dark mb-3">مشخصات فنی</h3>
              <div className="bg-mersadent-bg rounded-xl p-4 flex flex-col gap-2">
                {product.sku && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">کد محصول (SKU)</span>
                    <span className="font-medium text-mersadent-dark">{product.sku}</span>
                  </div>
                )}
                {product.country && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">کشور سازنده</span>
                    <span className="font-medium text-mersadent-dark">{product.country}</span>
                  </div>
                )}
                {product.warranty && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">گارانتی</span>
                    <span className="font-medium text-mersadent-dark">{product.warranty}</span>
                  </div>
                )}
                {product.weight && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">وزن</span>
                    <span className="font-medium text-mersadent-dark">{product.weight}</span>
                  </div>
                )}
                {Object.entries(specs).map(([key, val]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="text-gray-500">{key}</span>
                    <span className="font-medium text-mersadent-dark">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Category info */}
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>دسته‌بندی: </span>
            <button
              onClick={() => onNavigate({
                type: 'category',
                categoryId: product.categoryId,
                slug: product.category.slug,
                parentName: product.category.parent?.name,
                parentSlug: product.category.parent?.slug,
              })}
              className="text-mersadent-accent hover:underline"
            >
              {product.category.name}
            </button>
            {product.category.parent && (
              <span>({product.category.parent.name})</span>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 mt-2">
            {canAdd && (
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setAddQty(q => Math.max(1, q - 1))}
                    className="w-10 h-11 flex items-center justify-center text-gray-500 hover:text-mersadent-accent hover:bg-mersadent-accent/5 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-10 text-center text-sm font-bold text-mersadent-dark">
                    {new Intl.NumberFormat('fa-IR').format(addQty)}
                  </span>
                  <button
                    onClick={() => setAddQty(q => q + 1)}
                    className="w-10 h-11 flex items-center justify-center text-gray-500 hover:text-mersadent-accent hover:bg-mersadent-accent/5 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <Button
                  onClick={handleAddToCart}
                  disabled={addingToCart}
                  className="flex-1 bg-mersadent-accent hover:bg-mersadent-accent/90 text-white h-12 rounded-xl font-semibold"
                >
                  {addingToCart ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ShoppingCart className="w-4 h-4 ml-2" /> افزودن به سبد خرید</>}
                </Button>
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                className={`h-12 rounded-xl font-semibold gap-2 sm:w-auto w-full border-2 ${isInCompare(product.id) ? 'border-teal-400 text-teal-600 bg-teal-50 hover:bg-teal-100' : 'border-gray-200 text-gray-500 hover:text-teal-600 hover:border-teal-300'}`}
                onClick={() => toggleCompare(product)}
                aria-pressed={isInCompare(product.id)}
              >
                <GitCompareArrows className="w-4 h-4" />
                {isInCompare(product.id) ? 'در لیست مقایسه' : 'افزودن به مقایسه'}
              </Button>
              <Button
                className="flex-1 bg-mersadent-dark/10 hover:bg-mersadent-dark/15 text-mersadent-dark h-12 rounded-xl font-semibold"
                onClick={() => setOrderDialogOpen(true)}
              >
                <MessageCircle className="w-4 h-4 ml-2" />
                مشاوره فنی
              </Button>
              {!canAdd && (
                <Button
                  className="flex-1 bg-mersadent-accent hover:bg-mersadent-accent/90 text-white h-12 rounded-xl font-semibold"
                  onClick={() => setOrderDialogOpen(true)}
                >
                  <ShoppingBag className="w-4 h-4 ml-2" />
                  ثبت سفارش / استعلام
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Strengths, Weaknesses, Description */}
      {(product.strengths || product.weaknesses || product.description) && (
        <div className="mt-8 space-y-6">
          {/* Strengths */}
          {(() => {
            let items: string[] = [];
            if (product.strengths) {
              try { items = JSON.parse(product.strengths); } catch { items = []; }
            }
            if (items.length === 0) return null;
            return (
              <div className="bg-emerald-50/60 border border-emerald-200/60 rounded-xl p-5">
                <h3 className="text-sm font-bold text-emerald-800 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  نقاط قوت
                </h3>
                <ul className="space-y-2">
                  {items.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })()}

          {/* Weaknesses */}
          {(() => {
            let items: string[] = [];
            if (product.weaknesses) {
              try { items = JSON.parse(product.weaknesses); } catch { items = []; }
            }
            if (items.length === 0) return null;
            return (
              <div className="bg-amber-50/60 border border-amber-200/60 rounded-xl p-5">
                <h3 className="text-sm font-bold text-amber-800 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  نقاط ضعف
                </h3>
                <ul className="space-y-2">
                  {items.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })()}

          {/* Description */}
          {product.description && (
            <div className="bg-gray-50/60 border border-gray-200/60 rounded-xl p-5">
              <h3 className="text-sm font-bold text-mersadent-dark mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-mersadent-accent" />
                توضیحات محصول
              </h3>
              <div
                className="text-sm text-gray-700 leading-7 whitespace-pre-line"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            </div>
          )}
        </div>
      )}

      {/* Similar Products */}
      {similar.length > 0 && (
        <div className="mt-12">
          <h2 className="text-lg font-bold text-mersadent-dark mb-6">محصولات مشابه</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {similar.map(p => (
              <ProductCard
                key={p.id}
                product={p}
                onClick={() => {
                  window.scrollTo(0, 0);
                  onNavigate({ type: 'product', productId: p.id, slug: p.slug });
                }}
                user={user}
                onAuthRequired={onAuthRequired}
                onAddToCart={onAddToCart}
                onToggleCompare={() => toggleCompare(p)}
                isInCompare={isInCompare(p.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Order Dialog */}
      <Dialog open={orderDialogOpen} onOpenChange={setOrderDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>ثبت سفارش / استعلام قیمت</DialogTitle>
            <DialogDescription>
              برای ثبت سفارش یا استعلام قیمت {product.name}، با ما تماس بگیرید.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <a href="tel:02112345678" className="flex items-center gap-3 p-3 bg-mersadent-bg rounded-xl hover:bg-mersadent-accent/5 transition-colors">
              <Phone className="w-5 h-5 text-mersadent-accent" />
              <div>
                <p className="text-sm font-medium text-mersadent-dark">تماس تلفنی</p>
                <p className="text-xs text-gray-500">۰۲۱-۱۲۳۴۵۶۷۸</p>
              </div>
            </a>
            <div className="flex items-center gap-3 p-3 bg-mersadent-bg rounded-xl">
              <Send className="w-5 h-5 text-mersadent-accent" />
              <div>
                <p className="text-sm font-medium text-mersadent-dark">پیام در واتساپ</p>
                <p className="text-xs text-gray-500">۰۹۱۲-۱۲۳۴۵۶۷</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-mersadent-bg rounded-xl">
              <Mail className="w-5 h-5 text-mersadent-accent" />
              <div>
                <p className="text-sm font-medium text-mersadent-dark">ایمیل</p>
                <p className="text-xs text-gray-500">info@mersadent.com</p>
              </div>
            </div>
          </div>
          <Button
            onClick={() => {
              setOrderDialogOpen(false);
              toast.success('درخواست شما ثبت شد. کارشناسان ما به زودی با شما تماس خواهند گرفت.');
            }}
            className="bg-mersadent-accent hover:bg-mersadent-accent/90 text-white"
          >
            <CheckCircle2 className="w-4 h-4 ml-2" />
            ثبت درخواست
          </Button>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

// ============================================================
// SEARCH RESULTS PAGE
// ============================================================
