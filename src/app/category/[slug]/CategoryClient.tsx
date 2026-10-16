'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, ChevronDown, Filter, ChevronLeft, Loader2, Info, Search, Package, GitCompareArrows
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

import { Separator } from '@/components/ui/separator';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { Drawer, DrawerTrigger, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter, DrawerClose } from '@/components/ui/drawer';
import { formatPrice } from '@/components/product/ProductCard';
import { RotateCcw, Home, SlidersHorizontal } from 'lucide-react';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
// } from '@/components/ui/checkbox';
import { useAppContext } from '@/contexts/AppContext';
import { useAppNavigation } from '@/hooks/useAppNavigation';
import { ProductCard } from '@/components/product/ProductCard';
import { useCompare } from '@/components/compare';
import { toast } from 'sonner';


const staggerContainer = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const staggerItem = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 }
};

const fadeIn = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.3 }
};

export default function CategoryClient({ initialCategory }: { initialCategory: any }) {
  const { user, setAuthModalOpen, categories } = useAppContext();
  const navigate = useAppNavigation();
  const onNavigate = navigate;
  const onAuthRequired = () => setAuthModalOpen(true);
  
  // mock for backward compatibility in the component
  const onAddToCart = async (productId: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        onAuthRequired();
        return;
      }
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ productId, quantity: 1 })
      });
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
        return;
      }
      toast.success('محصول به سبد خرید اضافه شد');
      window.dispatchEvent(new Event('cart-updated'));
    } catch {
      toast.error('ارتباط با سرور برقرار نشد');
    }
  };

  const view = {
    type: 'category',
    categoryId: initialCategory.categoryId,
    slug: initialCategory.slug,
    name: initialCategory.name,
    parentName: initialCategory.parentName,
    parentSlug: initialCategory.parent?.slug
  };

  const [products, setProducts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [brands, setBrands] = useState<any[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<number[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000000]);
  const [sliderValue, setSliderValue] = useState<[number, number]>([0, 100000000]);
  const [maxPrice, setMaxPrice] = useState(100000000);
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('');

  const { toggleCompare, isInCompare } = useCompare();
  const [sort, setSort] = useState('newest');
  const [filterOpen, setFilterOpen] = useState(false);
  const sliderTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const PER_PAGE = 12;

  const fetchProducts = useCallback(async () => {
    if (view.categoryId === 0) return;
    setLoading(true);
    const params = new URLSearchParams({
      categoryId: String(view.categoryId),
      page: String(page),
      limit: String(PER_PAGE),
      sort,
    });
    if (selectedBrands.length > 0) params.set('brandId', selectedBrands.join(','));
    if (priceRange[0] > 0) params.set('minPrice', String(priceRange[0]));
    if (priceRange[1] < maxPrice) params.set('maxPrice', String(priceRange[1]));
    if (availabilityFilter) params.set('availability', availabilityFilter);

    try {
      const res = await fetch(`/api/products?${params}`);
      const data = await res.json();
      setProducts(data.products || []);
      setTotal(data.total || 0);
    } catch {
      setProducts([]);
      setTotal(0);
    }
    setLoading(false);
  }, [view.categoryId, page, selectedBrands, priceRange, availabilityFilter, sort, maxPrice]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => { if (sliderTimerRef.current) clearTimeout(sliderTimerRef.current); };
  }, []);

  useEffect(() => {
    if (view.categoryId === 0) return;
    // Fetch brands for this category
    fetch(`/api/brands?categoryId=${view.categoryId}`)
      .then(r => r.json())
      .then((data: any[]) => {
        setBrands(data);
      })
      .catch(() => {});
  }, [view.categoryId]);

  useEffect(() => {
    if (view.categoryId === 0) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          categoryId: String(view.categoryId),
          page: String(page),
          limit: String(PER_PAGE),
          sort,
        });
        if (selectedBrands.length > 0) params.set('brandId', selectedBrands.join(','));
        if (priceRange[0] > 0) params.set('minPrice', String(priceRange[0]));
        if (priceRange[1] < maxPrice) params.set('maxPrice', String(priceRange[1]));
        if (availabilityFilter) params.set('availability', availabilityFilter);
        const res = await fetch(`/api/products?${params}`);
        const data = await res.json();
        if (!cancelled) {
          setProducts(data.products || []);
          setTotal(data.total || 0);
        }
      } catch {
        if (!cancelled) {
          setProducts([]);
          setTotal(0);
        }
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [view.categoryId, page, selectedBrands, priceRange, availabilityFilter, sort, maxPrice]);

  // Find max price on first load
  useEffect(() => {
    if (view.categoryId === 0) return;
    fetch(`/api/products?categoryId=${view.categoryId}&limit=1&sort=price-desc`)
      .then(r => r.json())
      .then(data => {
        if (data.products?.[0]?.price) {
          const mp = Math.ceil(data.products[0].price / 1000000) * 1000000;
          setMaxPrice(mp);
          setPriceRange([0, mp]);
          setSliderValue([0, mp]);
        }
      })
      .catch(() => {});
  }, [view.categoryId]);

  const handleSliderChange = (val: number[]) => {
    const range = val as [number, number];
    setSliderValue(range);
    if (sliderTimerRef.current) clearTimeout(sliderTimerRef.current);
    sliderTimerRef.current = setTimeout(() => {
      setPriceRange(range);
      setPage(1);
    }, 400);
  };

  const clearFilters = () => {
    setSelectedBrands([]);
    setPriceRange([0, maxPrice]);
    setSliderValue([0, maxPrice]);
    setAvailabilityFilter('');
    setPage(1);
    if (sliderTimerRef.current) clearTimeout(sliderTimerRef.current);
  };

  const totalPages = Math.ceil(total / PER_PAGE);

  // "All categories" page
  if (view.categoryId === 0) { navigate({ type: 'categories' }); return null; }

  const categoryName = (() => {
    const cat = categories.find(c => c.id === view.categoryId);
    if (cat) return cat.name;
    for (const c of categories) {
      const sub = (c as any).children?.find((ch: any) => ch.id === view.categoryId);
      if (sub) return sub.name;
    }
    return view.slug;
  })();

  const renderFilterContent = () => (
    <div className="flex flex-col gap-6">
      {/* Brands */}
      <div>
        <h3 className="text-sm font-bold text-mersadent-dark mb-3">برند</h3>
        <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
          {brands.map(b => {
            const isActive = selectedBrands.includes(b.id);
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => {
                  if (isActive) {
                    setSelectedBrands(prev => prev.filter(id => id !== b.id));
                  } else {
                    setSelectedBrands(prev => [...prev, b.id]);
                  }
                  setPage(1);
                }}
                className="flex items-center gap-2 cursor-pointer group w-full text-right"
              >
                <span
                  className={`w-4 h-4 rounded-[4px] border-2 flex items-center justify-center shrink-0 transition-all ${
                    isActive
                      ? 'bg-[#2FC4C9] border-[#2FC4C9]'
                      : 'border-gray-300 group-hover:border-[#2FC4C9]/50'
                  }`}
                >
                  {isActive && (
                    <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </span>
                <span className={`text-sm transition-colors ${isActive ? 'text-mersadent-dark font-medium' : 'text-gray-600 group-hover:text-mersadent-dark'}`}>
                  {b.name}
                </span>
                <span className="text-xs text-gray-400 mr-auto">({b._count.products})</span>
              </button>
            );
          })}
        </div>
      </div>

      <Separator />

      {/* Price Range */}
      <div>
        <h3 className="text-sm font-bold text-mersadent-dark mb-3">محدوده قیمت</h3>
        <Slider
          value={sliderValue}
          onValueChange={handleSliderChange}
          min={0}
          max={maxPrice}
          step={500000}
          className="mb-2"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>{formatPrice(sliderValue[0])}</span>
          <span>{formatPrice(sliderValue[1])}</span>
        </div>
      </div>

      <Separator />

      {/* Availability */}
      <div>
        <h3 className="text-sm font-bold text-mersadent-dark mb-3">وضعیت موجودی</h3>
        <div className="flex flex-col gap-2">
          {[
            { value: '', label: 'همه' },
            { value: 'in_stock', label: 'موجود' },
            { value: 'out_of_stock', label: 'ناموجود' },
          ].map(opt => (
            <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="availability"
                value={opt.value}
                checked={availabilityFilter === opt.value}
                onChange={(e) => {
                  setAvailabilityFilter(e.target.value);
                  setPage(1);
                }}
                className="accent-mersadent-accent"
              />
              <span className="text-sm text-gray-600">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      <Button
        variant="outline"
        onClick={clearFilters}
        className="mt-2 text-sm border-mersadent-accent/30 text-mersadent-accent hover:bg-mersadent-accent/5"
      >
        <RotateCcw className="w-3.5 h-3.5 ml-1" />
        پاک کردن فیلترها
      </Button>
    </div>
  );

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
          {view.parentName && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink
                  onClick={() => onNavigate({
                    type: 'category',
                    categoryId: categories.find(c => c.name === view.parentName)?.id || 0,
                    slug: view.parentSlug || '',
                  })}
                  className="cursor-pointer text-sm"
                >
                  {view.parentName}
                </BreadcrumbLink>
              </BreadcrumbItem>
            </>
          )}
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{categoryName}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Title row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-mersadent-dark">{categoryName}</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">{total} محصول</span>
          {/* Mobile filter trigger */}
          <div className="sm:hidden">
            <Drawer open={filterOpen} onOpenChange={setFilterOpen}>
              <DrawerTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <SlidersHorizontal className="w-4 h-4" />
                  فیلتر
                </Button>
              </DrawerTrigger>
              <DrawerContent>
                <DrawerHeader className="border-b border-gray-100">
                  <DrawerTitle>فیلتر محصولات</DrawerTitle>
                </DrawerHeader>
                <div className="p-4 max-h-[60vh] overflow-y-auto">
                  {renderFilterContent()}
                </div>
                <DrawerFooter className="border-t border-gray-100">
                  <DrawerClose asChild>
                    <Button className="bg-mersadent-accent text-white">اعمال فیلتر</Button>
                  </DrawerClose>
                </DrawerFooter>
              </DrawerContent>
            </Drawer>
          </div>
          <Select value={sort} onValueChange={(v) => { setSort(v); setPage(1); }}>
            <SelectTrigger className="w-36 h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">جدیدترین</SelectItem>
              <SelectItem value="price-asc">ارزان‌ترین</SelectItem>
              <SelectItem value="price-desc">گران‌ترین</SelectItem>
              <SelectItem value="name">الفبایی</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Desktop Sidebar */}
        <aside className="hidden sm:block w-56 flex-shrink-0">
          <div className="sticky top-20 bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="text-sm font-bold text-mersadent-dark mb-4 flex items-center gap-2">
              <Filter className="w-4 h-4" />
              فیلترها
            </h2>
            {renderFilterContent()}
          </div>
        </aside>

        {/* Product grid */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-64 rounded-xl" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Package className="w-16 h-16 text-gray-200 mb-4" />
              <h3 className="text-lg font-semibold text-gray-400 mb-2">محصولی یافت نشد</h3>
              <p className="text-sm text-gray-400">فیلترهای خود را تغییر دهید</p>
            </div>
          ) : (
            <>
              <motion.div
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
              >
                {products.map(p => (
                  <motion.div key={p.id} variants={staggerItem}>
                    <ProductCard
                      product={p}
                      onClick={() => onNavigate({ type: 'product', productId: p.id, slug: p.slug })}
                      user={user}
                      onAuthRequired={onAuthRequired}
                      onAddToCart={onAddToCart}
                      onToggleCompare={() => toggleCompare(p)}
                      isInCompare={isInCompare(p.id)}
                    />
                  </motion.div>
                ))}
              </motion.div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                    className="gap-1"
                  >
                    <ChevronRight className="w-4 h-4" />
                    قبلی
                  </Button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={page === pageNum ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPage(pageNum)}
                        className={page === pageNum ? 'bg-mersadent-accent hover:bg-mersadent-accent/90 text-white' : 'w-9 h-9 p-0'}
                      >
                        {new Intl.NumberFormat('fa-IR').format(pageNum)}
                      </Button>
                    );
                  })}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === totalPages}
                    onClick={() => setPage(p => p + 1)}
                    className="gap-1"
                  >
                    بعدی
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
