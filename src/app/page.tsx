'use client';

// ============================================================
// IMPORTS
// ============================================================
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Menu, ChevronLeft, ChevronRight, ChevronDown, Home, Phone,
  Clock, MapPin, Mail, Star, Filter, SlidersHorizontal,
  Package, ShoppingBag, MessageCircle, Truck, Shield, Award,
  Users, FileText, Cog, Lightbulb, Camera, Zap, Settings, ShieldCheck,
  RotateCcw, Send, CheckCircle2, AlertCircle, BookOpen, Calendar, ArrowLeft,
  Wrench, AlertTriangle, ShoppingCart, HeartPulse, ExternalLink,
  LogIn, User, X, Plus, Minus, Loader2, GitCompareArrows, LayoutGrid, Instagram
} from 'lucide-react';
import { AuthModal } from '@/components/auth/AuthModal';
import { CartSidebar } from '@/components/cart/CartSidebar';
import { CartPage } from '@/components/cart/CartPage';
import { CheckoutPage } from '@/components/checkout/CheckoutPage';
import { UserPanel } from '@/components/user/UserPanel';
import { OrderDetailPage } from '@/components/user/OrderDetailPage';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast, Toaster } from 'sonner';
import {
  AdminLogin, AdminLayout, AdminDashboard, AdminProducts,
  AdminCategories, AdminBrands, AdminBlog, AdminBlogCategories, AdminSettings,
  AdminOrders, AdminUsers,
} from '@/components/admin';
import { CompareView, useCompare } from '@/components/compare';
import { ProductCard } from '@/components/product/ProductCard';

// ============================================================
// TYPES
// ============================================================
interface CategoryChild {
  id: number;
  name: string;
  slug: string;
  parentId: number;
  image?: string | null;
  children: CategoryChild[];
  productCount: number;
  order: number;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  parentId: number | null;
  image?: string | null;
  children: CategoryChild[];
  productCount: number;
  order: number;
}

interface Brand {
  id: number;
  name: string;
  slug: string;
  logo: string | null;
  visible: boolean;
  _count: { products: number };
}

interface ProductImage {
  id: number;
  url: string;
  alt: string | null;
  order: number;
}

interface Product {
  id: number;
  name: string;
  slug: string;
  sku: string | null;
  model: string | null;
  price: number | null;
  priceType: string;
  availability: string;
  specs: string | null;
  discountPercent: number;
  description: string | null;
  strengths: string | null;
  weaknesses: string | null;
  country: string | null;
  warranty: string | null;
  weight: string | null;
  categoryId: number;
  brandId: number;
  featured: boolean;
  brand: { id: number; name: string; slug: string };
  category: { id: number; name: string; slug: string; parent?: { id: number; name: string; slug: string; parent?: { id: number; name: string; slug: string } | null } | null };
  images?: ProductImage[];
  tags?: { tag: { id: number; name: string; slug: string; type: string } }[];
}

interface ProductsApiResponse {
  products?: Product[];
}

interface BlogCategory {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  _count: { posts: number };
  order: number;
}

interface BlogPostListItem {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string | null;
  readTime: number;
  createdAt: string;
  category: { id: number; name: string; slug: string };
}

interface BlogPostFull extends BlogPostListItem {
  content: string;
}

interface SearchResult {
  id: number;
  name: string;
  brand: string;
  brandSlug: string;
  category: string;
  categorySlug: string;
  price: number | null;
  priceType: string;
  availability: string;
  model: string | null;
  featured: boolean;
  country: string | null;
  sku: string | null;
}

interface UserData {
  id: number;
  name: string | null;
  phone: string | null;
  email: string | null;
  avatar: string | null;
  userType?: string | null;
}

type PageView =
  | { type: 'home' }
  | { type: 'category'; categoryId: number; slug: string; parentName?: string; parentSlug?: string }
  | { type: 'brand'; brandId: number; brandName: string }
  | { type: 'product'; productId: number }
  | { type: 'search'; query: string }
  | { type: 'about' }
  | { type: 'blog'; categorySlug?: string }
  | { type: 'blogPost'; slug: string }
  | { type: 'adminLogin' }
  | { type: 'admin'; section?: string }
  | { type: 'cart' }
  | { type: 'checkout' }
  | { type: 'user'; tab?: string }
  | { type: 'order-detail'; orderId: number }
  | { type: 'compare' };

// ============================================================
// URL & ROUTING HELPERS
// ============================================================
function viewToUrl(view: PageView): string {
  switch (view.type) {
    case 'home':
      return '/';
    case 'product':
      return `/?product=${view.productId}`;
    case 'category': {
      const p = new URLSearchParams();
      p.set('category', view.slug);
      if (view.categoryId) p.set('cid', String(view.categoryId));
      if (view.parentName) p.set('pname', view.parentName);
      if (view.parentSlug) p.set('pslug', view.parentSlug);
      return `/?${p.toString()}`;
    }
    case 'brand': {
      const p = new URLSearchParams();
      p.set('brand', view.brandName);
      if (view.brandId !== undefined) p.set('bid', String(view.brandId));
      return `/?${p.toString()}`;
    }
    case 'search':
      return `/?q=${encodeURIComponent(view.query)}`;
    case 'about':
      return '/?view=about';
    case 'blog':
      return view.categorySlug ? `/?view=blog&cat=${encodeURIComponent(view.categorySlug)}` : '/?view=blog';
    case 'blogPost':
      return `/?post=${encodeURIComponent(view.slug)}`;
    case 'cart':
      return '/?view=cart';
    case 'checkout':
      return '/?view=checkout';
    case 'user':
      return view.tab ? `/?view=user&tab=${encodeURIComponent(view.tab)}` : '/?view=user';
    case 'order-detail':
      return `/?view=order&id=${view.orderId}`;
    case 'compare':
      return '/?view=compare';
    case 'adminLogin':
      return '/#admin';
    case 'admin':
      return view.section ? `/?view=admin&section=${encodeURIComponent(view.section)}` : '/?view=admin';
    default:
      return '/';
  }
}

function urlToView(searchStr: string, hashStr: string): PageView {
  const hash = (hashStr || '').replace(/^#/, '').toLowerCase();
  if (hash === 'admin') {
    return { type: 'adminLogin' };
  }

  const params = new URLSearchParams(searchStr || '');

  // 1. Product
  const productId = params.get('product');
  if (productId && !isNaN(Number(productId))) {
    return { type: 'product', productId: Number(productId) };
  }

  // 2. Category
  const categorySlug = params.get('category');
  if (categorySlug) {
    const categoryId = Number(params.get('cid')) || 0;
    return {
      type: 'category',
      categoryId,
      slug: categorySlug,
      parentName: params.get('pname') || undefined,
      parentSlug: params.get('pslug') || undefined,
    };
  }

  // 3. Brand
  const brandName = params.get('brand');
  if (brandName) {
    const brandId = Number(params.get('bid')) || 0;
    return { type: 'brand', brandId, brandName };
  }

  // 4. Search
  const query = params.get('q');
  if (query) {
    return { type: 'search', query };
  }

  // 5. Blog post
  const postSlug = params.get('post');
  if (postSlug) {
    return { type: 'blogPost', slug: postSlug };
  }

  // 6. Generic views via ?view=...
  const viewType = params.get('view');
  if (viewType === 'about') return { type: 'about' };
  if (viewType === 'cart') return { type: 'cart' };
  if (viewType === 'checkout') return { type: 'checkout' };
  if (viewType === 'compare') return { type: 'compare' };
  if (viewType === 'blog') {
    const cat = params.get('cat') || undefined;
    return { type: 'blog', categorySlug: cat };
  }
  if (viewType === 'user') {
    const tab = params.get('tab') || undefined;
    return { type: 'user', tab };
  }
  if (viewType === 'order') {
    const orderId = Number(params.get('id'));
    if (orderId && !isNaN(orderId)) {
      return { type: 'order-detail', orderId };
    }
    return { type: 'user', tab: 'orders' };
  }
  if (viewType === 'admin') {
    const section = params.get('section') || 'dashboard';
    return { type: 'admin', section };
  }
  if (viewType === 'admin-login') {
    return { type: 'adminLogin' };
  }

  return { type: 'home' };
}

// ============================================================
// HELPERS
// ============================================================
const formatPrice = (price: number | null) => {
  if (price === null) return 'استعلام قیمت';
  return new Intl.NumberFormat('fa-IR').format(price) + ' تومان';
};

const useDebounce = (value: string, delay: number) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
};

// Category icon mapping
const getCategoryIcon = (slug: string) => {
  switch (slug) {
    case 'endo': return <FileText className="w-7 h-7" />;
    case 'turbine-angle': return <Cog className="w-7 h-7" />;
    case 'curing-scaler': return <Lightbulb className="w-7 h-7" />;
    case 'imaging': return <Camera className="w-7 h-7" />;
    case 'motors': return <Zap className="w-7 h-7" />;
    case 'clinic-equipment': return <Settings className="w-7 h-7" />;
    case 'sterilization-consumables': return <ShieldCheck className="w-7 h-7" />;
    default: return <Package className="w-7 h-7" />;
  }
};

const availabilityLabel = (status: string) => {
  switch (status) {
    case 'in_stock': return { text: 'موجود', variant: 'default' as const, color: 'bg-emerald-100 text-emerald-700' };
    case 'out_of_stock': return { text: 'ناموجود', variant: 'secondary' as const, color: 'bg-red-100 text-red-600' };
    case 'call': return { text: 'تماس بگیرید', variant: 'outline' as const, color: 'bg-amber-100 text-amber-700' };
    default: return { text: 'نامشخص', variant: 'secondary' as const, color: 'bg-gray-100 text-gray-600' };
  }
};

// ============================================================
// ANIMATION VARIANTS
// ============================================================
const fadeIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.25 },
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.05 } },
};

const staggerItem = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

// ============================================================
// PRODUCT CARD is imported from @/components/product/ProductCard
// ============================================================

// ============================================================
// HEADER
// ============================================================
function Header({
  onNavigate,
  onSearch,
  categories,
  user,
  cartCount,
  onAuthRequired,
  onLogout,
  onOpenCart,
}: {
  onNavigate: (view: PageView) => void;
  onSearch: (query: string) => void;
  categories: Category[];
  user: UserData | null;
  cartCount: number;
  onAuthRequired: () => void;
  onLogout: () => void;
  onOpenCart: () => void;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileCatOpen, setMobileCatOpen] = useState(false);
  const [catMenuOpen, setCatMenuOpen] = useState(false);
  const [activeCat, setActiveCat] = useState<Category | null>(null);
  const catTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const debounced = useDebounce(searchQuery, 300);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const megaMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (debounced.length < 2) {
      queueMicrotask(() => {
        setSearchResults([]);
        setSearchOpen(false);
      });
      return;
    }
    fetch(`/api/search?q=${encodeURIComponent(debounced)}`)
      .then(r => r.json())
      .then(d => {
        setSearchResults(d.results || []);
        setSearchOpen(true);
      })
      .catch(() => {});
  }, [debounced]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearchSelect = (r: SearchResult) => {
    setSearchOpen(false);
    setSearchQuery('');
    onNavigate({ type: 'product', productId: r.id });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchOpen(false);
      onSearch(searchQuery.trim());
    }
  };

  const navItems = [
    { label: 'مقالات آموزشی', action: () => { setMobileOpen(false); onNavigate({ type: 'blog' }); } },
    { label: 'برندها', action: () => { setMobileOpen(false); onNavigate({ type: 'brand', brandId: 0, brandName: 'all' }); } },
    { label: 'درباره ما', action: () => { setMobileOpen(false); onNavigate({ type: 'about' }); } },
  ];

  // Mega menu hover handlers with delay
  const handleCatEnter = (cat: Category | null) => {
    if (catTimeoutRef.current) clearTimeout(catTimeoutRef.current);
    setActiveCat(cat);
  };
  const handleCatLeave = () => {
    catTimeoutRef.current = setTimeout(() => {
      setActiveCat(null);
      setCatMenuOpen(false);
    }, 200);
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200/80 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14 gap-4">
          {/* Logo + Brand Name */}
          <button
            onClick={() => onNavigate({ type: 'home' })}
            className="flex-shrink-0 flex items-center gap-2.5 cursor-pointer group"
          >
            <img src="/logo.png" alt="MersaDent" className="h-8 sm:h-9 w-auto object-contain" />
            <div className="flex flex-col leading-none">
              <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-mersadent-dark group-hover:text-mersadent-accent transition-colors" style={{ fontFamily: "'Geist Mono', monospace" }}>MersaDent</span>
              <span className="text-[11px] sm:text-xs font-bold text-mersadent-accent/70 mt-0.5">مرصادنت</span>
            </div>
          </button>

          {/* Desktop Nav with Mega Menu */}
          <nav className="hidden md:flex items-center gap-1">
            {/* Categories Mega Menu */}
            <div
              ref={megaMenuRef}
              className="relative"
              onMouseEnter={() => { setCatMenuOpen(true); if (catTimeoutRef.current) clearTimeout(catTimeoutRef.current); }}
              onMouseLeave={handleCatLeave}
            >
              <button
                className={`flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg transition-colors ${catMenuOpen ? 'text-mersadent-accent bg-mersadent-accent/5' : 'text-gray-600 hover:text-mersadent-accent'}`}
              >
                دسته‌بندی‌ها
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${catMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Mega Menu Dropdown */}
              <AnimatePresence>
                {catMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full mt-2 right-0 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50"
                    style={{ minWidth: activeCat?.children?.length ? '720px' : '220px', maxWidth: 'min(90vw, 860px)' }}
                    onMouseEnter={() => { if (catTimeoutRef.current) clearTimeout(catTimeoutRef.current); }}
                    onMouseLeave={handleCatLeave}
                  >
                    <div className="flex">
                      {/* Parent categories list */}
                      <div className="w-52 bg-mersadent-bg/50 py-2 border-l border-gray-100">
                        {categories.map((cat) => (
                          <button
                            key={cat.id}
                            onMouseEnter={() => handleCatEnter(cat)}
                            onClick={() => { onNavigate({ type: 'category', categoryId: cat.id, slug: cat.slug }); setCatMenuOpen(false); }}
                            className={`w-full flex items-center justify-between px-4 py-2.5 text-right text-sm transition-colors ${activeCat?.id === cat.id ? 'bg-white text-mersadent-accent font-semibold shadow-sm' : 'text-gray-700 hover:bg-white hover:text-mersadent-dark'}`}
                          >
                            <span>{cat.name}</span>
                            {cat.children?.length ? (
                              <ChevronLeft className="w-3.5 h-3.5 opacity-40" />
                            ) : null}
                          </button>
                        ))}
                        <div className="border-t border-gray-200 mt-1 pt-1">
                          <button
                            onClick={() => { onNavigate({ type: 'category', categoryId: 0, slug: 'all' }); setCatMenuOpen(false); }}
                            className="w-full flex items-center justify-between px-4 py-2.5 text-right text-sm text-mersadent-accent hover:bg-white transition-colors font-medium"
                          >
                            <span>مشاهده همه دسته‌بندی‌ها</span>
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Subcategories panel - each sub-category is a row with grandchildren laid out horizontally */}
                      {activeCat?.children?.length ? (
                        <div className="flex-1 min-w-[460px] flex flex-col">
                          <div className="px-5 pt-4 pb-2 border-b border-gray-100 flex items-center justify-between">
                            <button
                              onClick={() => { onNavigate({ type: 'category', categoryId: activeCat.id, slug: activeCat.slug }); setCatMenuOpen(false); }}
                              className="flex items-center gap-2 text-sm font-bold text-mersadent-dark hover:text-mersadent-accent transition-colors"
                            >
                              {activeCat.name}
                              <span className="text-xs font-normal text-gray-400">
                                ({(activeCat.productCount || 0) + (activeCat.children?.reduce((sum, c) => sum + (c.productCount || 0), 0) || 0)} محصول)
                              </span>
                            </button>
                            <button
                              onClick={() => { onNavigate({ type: 'category', categoryId: activeCat.id, slug: activeCat.slug }); setCatMenuOpen(false); }}
                              className="text-[11px] text-mersadent-accent hover:underline"
                            >
                              مشاهده همه ←
                            </button>
                          </div>
                          <div className="overflow-y-auto max-h-[70vh] py-2">
                            {activeCat.children.map((child) => (
                              <div key={child.id} className="px-5 py-2.5 border-b border-gray-50 last:border-0">
                                <div className="flex items-start gap-3 flex-wrap">
                                  {/* Sub-category title (the "row" label) */}
                                  <button
                                    onClick={() => { onNavigate({ type: 'category', categoryId: child.id, slug: child.slug, parentName: activeCat.name, parentSlug: activeCat.slug }); setCatMenuOpen(false); }}
                                    className="flex-shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm font-semibold text-mersadent-dark hover:bg-mersadent-accent/10 hover:text-mersadent-accent transition-colors"
                                  >
                                    <span>{child.name}</span>
                                    {child.productCount ? (
                                      <span className="text-[10px] font-normal text-gray-400">({child.productCount})</span>
                                    ) : null}
                                  </button>
                                  {/* Grandchildren laid out horizontally next to the sub-category title */}
                                  {child.children && child.children.length > 0 && (
                                    <div className="flex flex-wrap items-center gap-x-1 gap-y-1.5 flex-1 min-w-0">
                                      {child.children.map((grandchild) => (
                                        <button
                                          key={grandchild.id}
                                          onClick={() => { onNavigate({ type: 'category', categoryId: grandchild.id, slug: grandchild.slug, parentName: child.name, parentSlug: child.slug }); setCatMenuOpen(false); }}
                                          className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs text-gray-500 hover:bg-mersadent-accent/5 hover:text-mersadent-accent transition-colors whitespace-nowrap"
                                        >
                                          <span>{grandchild.name}</span>
                                          {grandchild.productCount ? (
                                            <span className="text-[9px] text-gray-300">({grandchild.productCount})</span>
                                          ) : null}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : activeCat ? (
                        <div className="flex-1 p-4 min-w-[260px] flex items-center justify-center">
                          <button
                            onClick={() => { onNavigate({ type: 'category', categoryId: activeCat.id, slug: activeCat.slug }); setCatMenuOpen(false); }}
                            className="flex flex-col items-center gap-3 p-6 rounded-xl bg-mersadent-bg/50 hover:bg-mersadent-accent/5 transition-colors"
                          >
                            <Package className="w-8 h-8 text-mersadent-accent/40" />
                            <span className="text-sm font-medium text-mersadent-dark">مشاهده {activeCat.name}</span>
                            <span className="text-xs text-gray-400">{(activeCat.productCount || 0) + (activeCat.children?.reduce((sum, c) => sum + (c.productCount || 0), 0) || 0)} محصول</span>
                          </button>
                        </div>
                      ) : (
                        <div className="flex-1 p-4 min-w-[260px] flex items-center justify-center">
                          <p className="text-sm text-gray-400">یکی از دسته‌بندی‌ها را انتخاب کنید</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Other nav items */}
            {navItems.map((item) => (
              <button
                key={item.label}
                onClick={item.action}
                className="text-sm font-medium text-gray-600 hover:text-mersadent-accent transition-colors px-3 py-2"
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Search */}
          <div ref={searchRef} className="relative flex-1 max-w-xs sm:max-w-sm">
            <form onSubmit={handleSearchSubmit}>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  ref={inputRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="جستجوی محصول..."
                  className="pr-9 pl-4 h-10 text-sm bg-gray-50 border-gray-200 focus:bg-white focus:border-mersadent-accent rounded-xl"
                  onFocus={() => { if (searchResults.length > 0) setSearchOpen(true); }}
                />
              </div>
            </form>

            {/* Autocomplete dropdown */}
            <AnimatePresence>
              {searchOpen && searchResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute top-full mt-1 w-full bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 max-h-80 overflow-y-auto"
                >
                  {searchResults.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => handleSearchSelect(r)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-mersadent-bg transition-colors text-right"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-mersadent-dark truncate">{r.name}</p>
                        <p className="text-xs text-gray-400">{r.brand} • {r.category}</p>
                      </div>
                      {r.price !== null ? (
                        <span className="text-xs font-medium text-mersadent-accent whitespace-nowrap">
                          {new Intl.NumberFormat('fa-IR').format(r.price)} تومان
                        </span>
                      ) : (
                        <Badge className="bg-mersadent-accent/10 text-mersadent-accent border-mersadent-accent/20 text-[10px]">
                          استعلام
                        </Badge>
                      )}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Header action buttons */}
          <div className="flex items-center gap-1">
            {/* Cart button */}
            <Button variant="ghost" size="icon" onClick={onOpenCart} className="relative text-mersadent-dark hover:text-mersadent-accent">
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -left-0.5 w-4.5 h-4.5 min-w-[18px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {new Intl.NumberFormat('fa-IR').format(cartCount)}
                </span>
              )}
            </Button>

            {/* User button */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-mersadent-dark hover:text-mersadent-accent">
                    <User className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuLabel className="text-right">
                    <div className="font-semibold text-sm">{user.name || 'کاربر'}</div>
                    <div className="text-[11px] text-gray-400 font-normal" dir="ltr">{user.phone || '—'}</div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onNavigate({ type: 'user' })} className="cursor-pointer text-sm text-right">
                    پروفایل من
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onNavigate({ type: 'user' })} className="cursor-pointer text-sm text-right">
                    سفارش‌های من
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onLogout} className="cursor-pointer text-sm text-red-500 text-right focus:text-red-500">
                    خروج
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="ghost" size="icon" onClick={onAuthRequired} className="text-mersadent-dark hover:text-mersadent-accent">
                <LogIn className="w-5 h-5" />
              </Button>
            )}

            {/* Mobile menu */}
            <div className="md:hidden">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-mersadent-dark">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 p-0">
                <SheetTitle className="sr-only">منو</SheetTitle>
                <div className="flex flex-col h-full">
                  <div className="p-4 border-b border-gray-100 flex items-center gap-3">
                    <img src="/logo.png" alt="MersaDent" className="h-8 w-auto object-contain" />
                  </div>
                  <div className="flex-1 py-2">
                    {/* Mobile categories */}
                    <div className="border-b border-gray-100">
                      <button
                        onClick={() => { setMobileCatOpen(!mobileCatOpen); }}
                        className="w-full text-right px-6 py-3 text-sm font-medium text-gray-700 hover:bg-mersadent-bg hover:text-mersadent-accent transition-colors flex items-center justify-between"
                      >
                        <span>دسته‌بندی‌ها</span>
                        <ChevronDown className={`w-4 h-4 transition-transform ${mobileCatOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {mobileCatOpen && categories.map((cat) => (
                        <div key={cat.id}>
                          <button
                            onClick={() => { onNavigate({ type: 'category', categoryId: cat.id, slug: cat.slug }); setMobileOpen(false); setMobileCatOpen(false); }}
                            className="w-full text-right px-10 py-2.5 text-sm text-gray-600 hover:bg-mersadent-bg hover:text-mersadent-accent transition-colors"
                          >
                            {cat.name}
                          </button>
                          {cat.children.map((child) => (
                            <div key={child.id}>
                              <button
                                onClick={() => { onNavigate({ type: 'category', categoryId: child.id, slug: child.slug, parentName: cat.name, parentSlug: cat.slug }); setMobileOpen(false); setMobileCatOpen(false); }}
                                className="w-full text-right px-14 py-2 text-xs text-gray-500 hover:bg-mersadent-bg hover:text-mersadent-accent transition-colors"
                              >
                                {child.name}
                              </button>
                              {child.children && child.children.length > 0 && child.children.map((grandchild) => (
                                <button
                                  key={grandchild.id}
                                  onClick={() => { onNavigate({ type: 'category', categoryId: grandchild.id, slug: grandchild.slug, parentName: child.name, parentSlug: child.slug }); setMobileOpen(false); setMobileCatOpen(false); }}
                                  className="w-full text-right px-18 py-1.5 text-[11px] text-gray-400 hover:bg-mersadent-bg hover:text-mersadent-accent transition-colors"
                                >
                                  {grandchild.name}
                                </button>
                              ))}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                    {navItems.map((item) => (
                      <button
                        key={item.label}
                        onClick={item.action}
                        className="w-full text-right px-6 py-3 text-sm font-medium text-gray-700 hover:bg-mersadent-bg hover:text-mersadent-accent transition-colors"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                  <div className="p-4 border-t border-gray-100 bg-mersadent-bg">
                    <p className="text-xs text-gray-500 text-center">تمامی حقوق محفوظ است © MersaDent</p>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
          </div>
        </div>
      </div>
    </header>
  );
}

// ============================================================
// HERO SLIDER
// ============================================================
interface HeroSlide {
  image: string;
  title: string;
  subtitle: string;
  link?: string;
  objectPosition?: string;
}

const DEFAULT_HERO_SLIDES: HeroSlide[] = [
  {
    image: '/hero-slide-1.png',
    title: 'یونیت دندانپزشکی',
    subtitle: 'بهترین برندهای یونیت با گارانتی اصالت و قیمت مناسب',
    objectPosition: 'center',
    link: '',
  },
  {
    image: '/hero-slide-2.png',
    title: 'تجهیزات دیجیتال',
    subtitle: 'اسکنر، سنسور و تجهیزات دیجیتال دندانپزشکی',
    objectPosition: 'center',
    link: '',
  },
  {
    image: '/hero-slide-3.png',
    title: 'سرویس و تعمیرات',
    subtitle: 'تعمیر تخصصی تمامی تجهیزات دندانپزشکی توسط تیم متخصص',
    objectPosition: 'center',
    link: '',
  },
];

// Resolve a hero slide's CTA link into a navigation action.
// - Internal app paths like "/category/all" → in-app navigation
// - Empty link → default "all categories" view
// - External URLs (http/https) → open in new tab via window.open
function resolveHeroLink(link: string | undefined, onNavigate: (view: PageView) => void) {
  const trimmed = (link || '').trim();
  if (!trimmed) {
    onNavigate({ type: 'category', categoryId: 0, slug: 'all' });
    return;
  }
  if (/^https?:\/\//i.test(trimmed)) {
    window.open(trimmed, '_blank', 'noopener,noreferrer');
    return;
  }
  // Internal path: try to parse common patterns
  // /category/all, /category/<id>, /category/<slug>, /brand/all, /about, /search?q=...
  const catMatch = trimmed.match(/^\/category\/(.+)$/);
  if (catMatch) {
    const rest = catMatch[1];
    if (rest === 'all') {
      onNavigate({ type: 'category', categoryId: 0, slug: 'all' });
    } else if (/^\d+$/.test(rest)) {
      onNavigate({ type: 'category', categoryId: parseInt(rest), slug: rest });
    } else {
      onNavigate({ type: 'category', categoryId: 0, slug: rest });
    }
    return;
  }
  if (/^\/brand(\/|$)/.test(trimmed)) {
    onNavigate({ type: 'brand', brandId: 0, brandName: 'all' });
    return;
  }
  if (/^\/about/.test(trimmed)) {
    onNavigate({ type: 'about' });
    return;
  }
  if (/^\/blog/.test(trimmed)) {
    onNavigate({ type: 'blog' });
    return;
  }
  if (/^\/search\?/.test(trimmed)) {
    const q = new URLSearchParams(trimmed.split('?')[1]).get('q') || '';
    onNavigate({ type: 'search', query: q });
    return;
  }
  // Fallback: open as external/new-tab
  window.open(trimmed, '_blank', 'noopener,noreferrer');
}

function HeroSlider({ onNavigate }: { onNavigate: (view: PageView) => void }) {
  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>(DEFAULT_HERO_SLIDES);
  const [loaded, setLoaded] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartX = useRef(0);
  const currentRef = useRef(0);

  // Fetch admin-configured slides
  useEffect(() => {
    let cancelled = false;
    fetch('/api/hero')
      .then(r => r.json())
      .then(d => {
        if (cancelled) return;
        if (Array.isArray(d.slides) && d.slides.length > 0) {
          setHeroSlides(d.slides.map((s: HeroSlide) => ({ ...s, objectPosition: 'center' })));
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoaded(true); });
    return () => { cancelled = true; };
  }, []);

  const slidesCount = heroSlides.length;

  const goTo = useCallback((index: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrent(index);
    currentRef.current = index;
    setTimeout(() => setIsTransitioning(false), 700);
  }, [isTransitioning]);

  const next = useCallback(() => goTo((current + 1) % slidesCount), [current, goTo, slidesCount]);
  const prev = useCallback(() => goTo((current - 1 + slidesCount) % slidesCount), [current, goTo, slidesCount]);

  // Auto-play
  useEffect(() => {
    if (!loaded || slidesCount <= 1) return;
    intervalRef.current = setInterval(() => {
      goTo((currentRef.current + 1) % slidesCount);
    }, 6000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [goTo, slidesCount, loaded]);

  // Pause on hover
  const pause = () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  const resume = () => {
    if (slidesCount <= 1) return;
    intervalRef.current = setInterval(() => {
      goTo((currentRef.current + 1) % slidesCount);
    }, 6000);
  };

  // Touch handlers for swipe
  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) { if (diff > 0) next(); else prev(); }
  };

  const slide = heroSlides[current] || heroSlides[0];

  return (
    <section
      className="relative w-full h-[50vw] sm:h-[42vw] md:h-[36vw] lg:h-[520px] xl:h-[560px] min-h-[280px] max-h-[600px] overflow-hidden select-none"
      onMouseEnter={pause}
      onMouseLeave={resume}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Slides */}
      {heroSlides.map((s, i) => (
        <div
          key={i}
          className="absolute inset-0 transition-opacity duration-700 ease-in-out"
          style={{ opacity: i === current ? 1 : 0, zIndex: i === current ? 1 : 0 }}
        >
          <img
            src={s.image}
            alt={s.title}
            className="w-full h-full object-cover"
            style={{ objectPosition: s.objectPosition || 'center' }}
            loading={i === 0 ? 'eager' : 'lazy'}
          />
        </div>
      ))}

      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-l from-black/70 via-black/50 to-transparent z-10" />

      {/* Content */}
      <div className="absolute inset-0 z-20 flex items-center">
        <div className="max-w-7xl mx-auto w-full px-5 sm:px-8 lg:px-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="max-w-xl"
            >
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-white leading-tight mb-3">
                {slide.title}
              </h1>
              <p className="text-sm sm:text-base text-white/80 leading-7 mb-6 max-w-md">
                {slide.subtitle}
              </p>
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() => resolveHeroLink(slide.link, onNavigate)}
                  className="bg-mersadent-accent hover:bg-mersadent-accent/90 text-white rounded-xl px-5 sm:px-6 h-10 sm:h-11 font-semibold text-sm sm:text-base"
                >
                  مشاهده تجهیزات
                  <ChevronLeft className="w-4 h-4 mr-2" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => onNavigate({ type: 'about' })}
                  className="bg-white/10 border-white/40 text-white hover:bg-white/20 hover:border-white/70 rounded-xl px-5 sm:px-6 h-10 sm:h-11 font-semibold text-sm sm:text-base backdrop-blur-sm"
                >
                  درباره ما
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Arrow buttons — only when more than 1 slide */}
      {slidesCount > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-30 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/20 text-white flex items-center justify-center transition-colors"
            aria-label="اسلاید قبلی"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <button
            onClick={next}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-30 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/20 text-white flex items-center justify-center transition-colors"
            aria-label="اسلاید بعدی"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Dot indicators */}
      {slidesCount > 1 && (
        <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
          {heroSlides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`rounded-full transition-all duration-300 ${
                i === current
                ? 'w-7 h-2.5 bg-mersadent-accent'
                : 'w-2.5 h-2.5 bg-white/50 hover:bg-white/80'
            }`}
            aria-label={`اسلاید ${i + 1}`}
          />
        ))}
        </div>
      )}
    </section>
  );
}

// ============================================================
// HOMEPAGE
// ============================================================
function HomePage({ onNavigate, user, onAuthRequired, onAddToCart }: { onNavigate: (view: PageView) => void; user: UserData | null; onAuthRequired: () => void; onAddToCart: (productId: number) => void }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [featured, setFeatured] = useState<Product[]>([]);
  const [discounted, setDiscounted] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [allBrandsList, setAllBrandsList] = useState<Brand[]>([]);
  const [totalBrandCount, setTotalBrandCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const featuredRef = useRef<HTMLDivElement>(null);
  const discountRef = useRef<HTMLDivElement>(null);
  const marqueeClipRef = useRef<HTMLDivElement>(null);
  const marqueeRafRef = useRef<number>(0);
  const marqueePausedRef = useRef(false);
  const marqueeLastTimeRef = useRef(0);

  const { toggleCompare, isInCompare } = useCompare();

  const scrollContainer = (ref: React.RefObject<HTMLDivElement | null>, direction: 'left' | 'right') => {
    if (!ref.current) return;
    const scrollAmount = 280;
    ref.current.scrollBy({
      left: direction === 'right' ? scrollAmount : -scrollAmount,
      behavior: 'smooth',
    });
  };



  useEffect(() => {
    Promise.all([
      fetch('/api/categories').then(r => r.ok ? r.json() : []).then(d => Array.isArray(d) ? d : []).catch(() => []),
      fetch('/api/featured').then(r => r.ok ? r.json() : []).then(d => Array.isArray(d) ? d : []).catch(() => []),
      fetch('/api/brands').then(r => r.ok ? r.json() : []).then(d => Array.isArray(d) ? d : []).catch(() => []),
      fetch('/api/brands?all=true').then(r => r.ok ? r.json() : []).then(d => Array.isArray(d) ? d : []).catch(() => []),
      fetch('/api/products?discounted=true&limit=20').then(r => r.ok ? r.json() : {}).then((d: ProductsApiResponse) => Array.isArray(d?.products) ? d.products : []).catch(() => []),
    ])



      .then(([cats, feat, brs, allBrands, discProds]) => {
        setCategories(cats);
        setFeatured(feat);
        setBrands(brs);
        setAllBrandsList(Array.isArray(allBrands) ? allBrands : brs);
        setTotalBrandCount(Array.isArray(allBrands) ? allBrands.length : brs.length);
        setDiscounted(discProds);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Smooth marquee using native scrollLeft
  useEffect(() => {
    if (!brands.length || !marqueeClipRef.current) return;
    const clipper = marqueeClipRef.current;
    const track = clipper.firstElementChild as HTMLElement | null;
    if (!track) return;

    // Measure distance from brand 0 to its next copy
    const card0 = track.children[0] as HTMLElement | null;
    const card0Copy1 = track.children[brands.length] as HTMLElement | null;
    if (!card0 || !card0Copy1) return;
    const singleSetWidth = card0Copy1.getBoundingClientRect().left - card0.getBoundingClientRect().left;
    if (singleSetWidth <= 0) return;

    const SPEED = 50; // px per second
    marqueeLastTimeRef.current = 0;

    // Start scrolled left by one set so both sides have content
    clipper.scrollLeft = singleSetWidth;

    const step = (timestamp: number) => {
      if (!marqueeLastTimeRef.current) marqueeLastTimeRef.current = timestamp;
      const dt = (timestamp - marqueeLastTimeRef.current) / 1000;
      marqueeLastTimeRef.current = timestamp;

      if (!marqueePausedRef.current) {
        clipper.scrollLeft += SPEED * dt;
        if (clipper.scrollLeft >= singleSetWidth) {
          clipper.scrollLeft -= singleSetWidth;
        }
      }

      marqueeRafRef.current = requestAnimationFrame(step);
    };

    marqueeRafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(marqueeRafRef.current);
  }, [brands]);

  return (
    <div className="space-y-8 pb-8">
      {/* ===== HERO SLIDER ===== */}
      <HeroSlider onNavigate={onNavigate} />

      {/* ===== MAIN CATEGORIES ===== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-mersadent-dark">دسته‌بندی محصولات</h2>
          </div>
          <Button
            variant="ghost"
            onClick={() => onNavigate({ type: 'category', categoryId: 0, slug: 'all' })}
            className="text-mersadent-accent text-sm"
          >
            مشاهده همه
            <ChevronLeft className="w-4 h-4 mr-1" />
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2.5"
          >
            {categories.map((cat) => (
              <motion.button
                key={cat.id}
                variants={staggerItem}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onNavigate({
                  type: 'category',
                  categoryId: cat.id,
                  slug: cat.slug,
                })}
                className="flex flex-col items-center gap-2 p-3 sm:p-4 bg-white rounded-xl border border-gray-100 hover:border-mersadent-accent/30 hover:shadow-md transition-all group"
              >
                <div className="p-2.5 rounded-xl bg-mersadent-bg group-hover:bg-mersadent-accent/10 text-mersadent-dark group-hover:text-mersadent-accent transition-colors overflow-hidden">
                  {cat.image ? (
                    <img src={cat.image} alt={cat.name} className="w-7 h-7 sm:w-8 sm:h-8 object-contain" />
                  ) : (
                    getCategoryIcon(cat.slug)
                  )}
                </div>
                <div className="text-center">
                  <span className="text-[11px] sm:text-xs font-semibold text-mersadent-dark block">{cat.name}</span>
                  <span className="text-[9px] sm:text-[10px] text-gray-400 mt-0.5 block">{cat.children.length} زیردسته</span>
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}
      </section>

      {/* ===== FEATURED PRODUCTS ===== */}
      {Array.isArray(featured) && featured.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base sm:text-lg font-bold text-mersadent-dark">محصولات ویژه</h2>
          </div>
          <div className="relative group">
            {/* Scroll arrows - desktop only */}
            {(featured || []).length > 4 && (
              <>
                <button
                  onClick={() => scrollContainer(featuredRef, 'right')}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-white/90 hover:bg-white shadow-md rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex"
                  aria-label="اسکرول به راست"
                >
                  <ChevronRight className="w-5 h-5 text-mersadent-dark" />
                </button>
                <button
                  onClick={() => scrollContainer(featuredRef, 'left')}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-white/90 hover:bg-white shadow-md rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex"
                  aria-label="اسکرول به چپ"
                >
                  <ChevronLeft className="w-5 h-5 text-mersadent-dark" />
                </button>
              </>
            )}
            <div
              ref={featuredRef}
              className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 scroll-smooth [scroll-snap-type:x_mandatory] -mx-4 px-4 sm:mx-0 sm:px-0"
            >
              {featured.map((p) => (
                <div key={p.id} className="flex-shrink-0 w-48 sm:w-56 [scroll-snap-align:start]">
                  <ProductCard
                    product={p}
                    onClick={() => onNavigate({ type: 'product', productId: p.id })}
                    user={user}
                    onAuthRequired={onAuthRequired}
                    onAddToCart={onAddToCart}
                    onToggleCompare={() => toggleCompare(p)}
                    isInCompare={isInCompare(p.id)}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== DISCOUNTED PRODUCTS ===== */}
      {Array.isArray(discounted) && discounted.length > 0 && (
        <section className="bg-gradient-to-r from-red-50 to-orange-50 py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base sm:text-lg font-bold text-mersadent-dark flex items-center gap-2">
                🔥 محصولات تخفیف‌دار
              </h2>
              <Badge className="bg-red-500 text-white text-xs">{(discounted || []).length} محصول</Badge>
            </div>
            <div className="relative group">
              {(discounted || []).length > 4 && (
                <>
                  <button
                    onClick={() => scrollContainer(discountRef, 'right')}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-white/90 hover:bg-white shadow-md rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex"
                    aria-label="اسکرول به راست"
                  >
                    <ChevronRight className="w-5 h-5 text-mersadent-dark" />
                  </button>
                  <button
                    onClick={() => scrollContainer(discountRef, 'left')}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-white/90 hover:bg-white shadow-md rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex"
                    aria-label="اسکرول به چپ"
                  >
                    <ChevronLeft className="w-5 h-5 text-mersadent-dark" />
                  </button>
                </>
              )}
              <div
                ref={discountRef}
                className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 scroll-smooth [scroll-snap-type:x_mandatory] -mx-4 px-4 sm:mx-0 sm:px-0"
              >
                {discounted.map((p) => (
                  <div key={p.id} className="flex-shrink-0 w-48 sm:w-56 [scroll-snap-align:start]">
                    <ProductCard
                      product={p}
                      onClick={() => onNavigate({ type: 'product', productId: p.id })}
                      user={user}
                      onAuthRequired={onAuthRequired}
                      onAddToCart={onAddToCart}
                      onToggleCompare={() => toggleCompare(p)}
                      isInCompare={isInCompare(p.id)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ===== BRANDS MARQUEE ===== */}
      <section className="py-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between mb-3">
          <h2 className="text-base sm:text-lg font-bold text-mersadent-dark">برندها</h2>
          <Button
            variant="ghost"
            onClick={() => onNavigate({ type: 'brand', brandId: 0, brandName: 'all' })}
            className="text-mersadent-accent text-sm"
          >
            مشاهده همه ({totalBrandCount} برند)
            <ChevronLeft className="w-3.5 h-3.5 mr-0.5" />
          </Button>
        </div>

        {loading ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-3 overflow-hidden">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-28 flex-shrink-0 rounded-xl" />
            ))}
          </div>
        ) : (
          <div
            ref={marqueeClipRef}
            dir="ltr"
            className="relative overflow-hidden"
            onMouseEnter={() => { marqueePausedRef.current = true; }}
            onMouseLeave={() => { marqueePausedRef.current = false; }}
          >
            <div className="flex gap-3 w-fit">
              {[0, 1, 2].map((copyIdx) => (
                brands.map((b) => (
                  <button
                    key={`${copyIdx}-${b.id}`}
                    onClick={() => onNavigate({ type: 'brand', brandId: b.id, brandName: b.name })}
                    className="flex flex-col items-center justify-center gap-1.5 w-24 sm:w-28 h-20 flex-shrink-0 bg-white rounded-xl border border-gray-100 hover:border-mersadent-accent/30 hover:shadow-md transition-all group/card cursor-pointer"
                  >
                    {b.logo ? (
                      <img src={b.logo} alt={b.name} className="w-7 h-7 object-contain" />
                    ) : (
                      <Package className="w-6 h-6 text-gray-300 group-hover/card:text-mersadent-accent transition-colors" />
                    )}
                    <span className="text-[10px] sm:text-xs font-semibold text-mersadent-dark truncate w-full text-center px-1">{b.name}</span>
                  </button>
                ))
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ===== BLOG PREVIEW ===== */}
      <BlogPreviewSection onNavigate={onNavigate} />

      {/* ===== CTA ===== */}
      <section className="bg-mersadent-dark text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 text-center">
          <h2 className="text-base sm:text-lg font-bold mb-2">نیاز به مشاوره دارید؟</h2>
          <p className="text-xs sm:text-sm text-gray-400 mb-4">
            کارشناسان ما آماده راهنمایی شما هستند
          </p>
          <Button
            asChild
            className="bg-mersadent-accent hover:bg-mersadent-accent/90 text-white rounded-xl px-6 h-10 font-semibold text-sm"
          >
            <a href="tel:02112345678">
              <Phone className="w-4 h-4 ml-1.5" />
              تماس با ما
            </a>
          </Button>
        </div>
      </section>
    </div>
  );
}

// ============================================================
// CATEGORY ALL PAGE (shows all categories with subcategories)
// ============================================================
function CategoryAllPage({ categories, onNavigate }: { categories: Category[]; onNavigate: (view: PageView) => void }) {
  return (
    <motion.div {...fadeIn} className="max-w-7xl mx-auto px-4 sm:px-6 pb-8">
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
            <BreadcrumbPage>دسته‌بندی‌ها</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="text-xl sm:text-2xl font-bold text-mersadent-dark mb-8">همه دسته‌بندی‌ها</h1>

      <div className="flex flex-col gap-6">
        {categories.map((cat) => (
          <div key={cat.id} className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-mersadent-accent/10 text-mersadent-accent overflow-hidden">
                {cat.image ? (
                  <img src={cat.image} alt={cat.name} className="w-7 h-7 sm:w-8 sm:h-8 object-contain" />
                ) : (
                  getCategoryIcon(cat.slug)
                )}
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-mersadent-dark">{cat.name}</h2>
                <p className="text-xs text-gray-400">{cat.productCount} محصول</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {cat.children.map((child) => (
                <div key={child.id} className="flex flex-col">
                  <button
                    onClick={() => onNavigate({
                      type: 'category',
                      categoryId: child.id,
                      slug: child.slug,
                      parentName: cat.name,
                      parentSlug: cat.slug,
                    })}
                    className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-mersadent-bg hover:bg-mersadent-accent/10 transition-colors text-sm text-gray-600 hover:text-mersadent-accent group"
                  >
                    <span>{child.name}</span>
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <ChevronLeft className="w-3.5 h-3.5 group-hover:text-mersadent-accent" />
                      {child.productCount}
                    </span>
                  </button>
                  {child.children && child.children.length > 0 && (
                    <div className="flex flex-col gap-1 mt-1 mr-2">
                      {child.children.map((grandchild) => (
                        <button
                          key={grandchild.id}
                          onClick={() => onNavigate({
                            type: 'category',
                            categoryId: grandchild.id,
                            slug: grandchild.slug,
                            parentName: child.name,
                            parentSlug: child.slug,
                          })}
                          className="flex items-center justify-between px-3 py-2 rounded-md bg-gray-50 hover:bg-mersadent-accent/10 transition-colors text-xs text-gray-500 hover:text-mersadent-accent group"
                        >
                          <span>{grandchild.name}</span>
                          <span className="text-[10px] text-gray-400">{grandchild.productCount}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ============================================================
// CATEGORY PRODUCTS PAGE
// ============================================================
function CategoryPage({
  view,
  onNavigate,
  categories,
  user,
  onAuthRequired,
  onAddToCart,
}: {
  view: Extract<PageView, { type: 'category' }>;
  onNavigate: (view: PageView) => void;
  categories: Category[];
  user: UserData | null;
  onAuthRequired: () => void;
  onAddToCart: (productId: number) => void;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [brands, setBrands] = useState<Brand[]>([]);
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
      .then((data: Brand[]) => {
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
  if (view.categoryId === 0) {
    return <CategoryAllPage categories={categories} onNavigate={onNavigate} />;
  }

  const categoryName = (() => {
    const cat = categories.find(c => c.id === view.categoryId);
    if (cat) return cat.name;
    for (const c of categories) {
      const sub = c.children.find(ch => ch.id === view.categoryId);
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
                      onClick={() => onNavigate({ type: 'product', productId: p.id })}
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

// ============================================================
// BRAND ALL PAGE
// ============================================================
function BrandAllPage({ brands, onNavigate }: { brands: Brand[]; onNavigate: (view: PageView) => void }) {
  return (
    <motion.div {...fadeIn} className="max-w-7xl mx-auto px-4 sm:px-6 pb-8">
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
            <BreadcrumbPage>برندها</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="text-xl sm:text-2xl font-bold text-mersadent-dark mb-8">همه برندها</h1>

      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
      >
        {brands.map(b => (
          <motion.button
            key={b.id}
            variants={staggerItem}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => onNavigate({ type: 'brand', brandId: b.id, brandName: b.name })}
            className="flex flex-col items-center justify-center gap-3 p-5 bg-white rounded-2xl border border-gray-100 hover:border-mersadent-accent/30 hover:shadow-lg transition-all group"
          >
            <div className="w-16 h-16 rounded-full bg-mersadent-bg flex items-center justify-center group-hover:bg-mersadent-accent/10 transition-colors overflow-hidden">
              {b.logo ? (
                <img src={b.logo} alt={b.name} className="w-full h-full object-contain p-1.5" />
              ) : (
                <Package className="w-8 h-8 text-gray-300 group-hover:text-mersadent-accent transition-colors" />
              )}
            </div>
            <div className="text-center">
              <span className="text-sm font-bold text-mersadent-dark block">{b.name}</span>
              <span className="text-xs text-gray-400 mt-0.5 block">{b._count.products} محصول</span>
            </div>
          </motion.button>
        ))}
      </motion.div>
    </motion.div>
  );
}

// ============================================================
// BRAND PRODUCTS PAGE
// ============================================================
function BrandPage({
  view,
  onNavigate,
  user,
  onAuthRequired,
  onAddToCart,
}: {
  view: Extract<PageView, { type: 'brand' }>;
  onNavigate: (view: PageView) => void;
  user: UserData | null;
  onAuthRequired: () => void;
  onAddToCart: (productId: number) => void;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const { toggleCompare, isInCompare } = useCompare();

  const PER_PAGE = 12;

  useEffect(() => {
    if (view.brandId === 0) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/products?brandId=${view.brandId}&page=${page}&limit=${PER_PAGE}`);
        const data = await res.json();
        if (!cancelled) {
          setProducts(data.products || []);
          setTotal(data.total || 0);
        }
      } catch {}
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [view.brandId, page]);

  const totalPages = Math.ceil(total / PER_PAGE);

  if (view.brandId === 0) return null; // handled by parent

  return (
    <motion.div {...fadeIn} className="max-w-7xl mx-auto px-4 sm:px-6 pb-8">
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
            <BreadcrumbPage>{view.brandName}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-full bg-mersadent-bg flex items-center justify-center">
          <Package className="w-7 h-7 text-mersadent-accent" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-mersadent-dark">{view.brandName}</h1>
          <p className="text-sm text-gray-400">{total} محصول</p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
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
                  onClick={() => onNavigate({ type: 'product', productId: p.id })}
                  user={user}
                  onAuthRequired={onAuthRequired}
                  onAddToCart={onAddToCart}
                  onToggleCompare={() => toggleCompare(p)}
                  isInCompare={isInCompare(p.id)}
                />
              </motion.div>
            ))}
          </motion.div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)} className="gap-1">
                <ChevronRight className="w-4 h-4" />
                قبلی
              </Button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) pageNum = i + 1;
                else if (page <= 3) pageNum = i + 1;
                else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                else pageNum = page - 2 + i;
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
              <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="gap-1">
                بعدی
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}

// ============================================================
// PRODUCT DETAIL PAGE
// ============================================================
function ProductDetailPage({
  view,
  onNavigate,
  user,
  onAuthRequired,
  onAddToCart,
}: {
  view: Extract<PageView, { type: 'product' }>;
  onNavigate: (view: PageView) => void;
  user: UserData | null;
  onAuthRequired: () => void;
  onAddToCart: (productId: number, quantity?: number) => void;
}) {
  const [product, setProduct] = useState<Product | null>(null);
  const [similar, setSimilar] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [addQty, setAddQty] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);

  const { toggleCompare, isInCompare } = useCompare();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/products/${view.productId}`);
        const data = await res.json();
        if (!cancelled) {
          setProduct(data.product);
          setSimilar(data.similar || []);
          setSelectedImage(0);
        }
      } catch {}
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [view.productId]);

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
  const specs: Record<string, string> = product.specs ? (() => { try { return JSON.parse(product.specs); } catch { return {}; } })() : {};
  const canAdd = product.availability === 'in_stock' && product.price !== null && product.priceType !== 'call';

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
                  onNavigate({ type: 'product', productId: p.id });
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
function SearchResultsPage({
  query,
  onNavigate,
  user,
  onAuthRequired,
  onAddToCart,
}: {
  query: string;
  onNavigate: (view: PageView) => void;
  user: UserData | null;
  onAuthRequired: () => void;
  onAddToCart: (productId: number) => void;
}) {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=50`);
        const data = await res.json();
        if (!cancelled) {
          setResults(data.results || []);
        }
      } catch {}
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [query]);

  return (
    <motion.div {...fadeIn} className="max-w-7xl mx-auto px-4 sm:px-6 pb-8">
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
            <BreadcrumbPage>نتایج جستجو</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="text-xl sm:text-2xl font-bold text-mersadent-dark mb-2">
        نتایج جستجو برای: &ldquo;{query}&rdquo;
      </h1>
      <p className="text-sm text-gray-400 mb-8">{results.length} نتیجه یافت شد</p>

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : results.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Search className="w-16 h-16 text-gray-200 mb-4" />
          <h3 className="text-lg font-semibold text-gray-400 mb-2">نتیجه‌ای یافت نشد</h3>
          <p className="text-sm text-gray-400">عبارت دیگری را جستجو کنید</p>
        </div>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="flex flex-col gap-3"
        >
          {results.map(r => (
            <motion.div key={r.id} variants={staggerItem}>
              <Card
                className="cursor-pointer hover:border-mersadent-accent/30 hover:shadow-md transition-all"
                onClick={() => onNavigate({ type: 'product', productId: r.id })}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-mersadent-bg flex items-center justify-center flex-shrink-0">
                    <Package className="w-6 h-6 text-gray-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-mersadent-dark truncate">{r.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-400">{r.brand}</span>
                      <span className="text-xs text-gray-300">•</span>
                      <span className="text-xs text-gray-400">{r.category}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {r.price !== null && r.availability === 'in_stock' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!user) { onAuthRequired(); return; }
                          onAddToCart(r.id);
                        }}
                        className="w-8 h-8 rounded-full bg-white shadow hover:bg-mersadent-accent/10 text-mersadent-dark hover:text-mersadent-accent flex items-center justify-center transition-colors"
                        title="افزودن به سبد خرید"
                      >
                        <ShoppingCart className="w-4 h-4" />
                      </button>
                    )}
                    <div className="text-left">
                      {r.price !== null ? (
                        <span className="text-sm font-bold text-mersadent-dark">
                          {new Intl.NumberFormat('fa-IR').format(r.price)} تومان
                        </span>
                      ) : (
                        <Badge className="bg-mersadent-accent/10 text-mersadent-accent border-mersadent-accent/20 text-[10px]">
                          استعلام
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}

// ============================================================
// ABOUT PAGE
// ============================================================
function AboutPage({ onNavigate }: { onNavigate: (view: PageView) => void }) {
  return (
    <motion.div {...fadeIn} className="max-w-7xl mx-auto px-4 sm:px-6 pb-8">
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
            <BreadcrumbPage>درباره ما</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <img src="/logo.png" alt="MersaDent" className="h-16 w-auto object-contain mx-auto mb-4" />
          <h1 className="text-2xl sm:text-3xl font-extrabold text-mersadent-dark mb-3">درباره مرصادنت</h1>
          <p className="text-base text-gray-500 leading-7">
            MersaDent (مرصادنت) - یکی از معتبرترین تأمین‌کنندگان تجهیزات و مواد مصرفی دندانپزشکی در ایران
          </p>
        </div>

        {/* Content cards */}
        <div className="flex flex-col gap-6">
          <Card className="border-gray-100">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-mersadent-accent/10 text-mersadent-accent flex-shrink-0">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-mersadent-dark mb-2">تاریخچه و تجربه</h2>
                  <p className="text-sm text-gray-500 leading-7">
                    شرکت مرصادنت با بیش از یک دهه تجربه در زمینه واردات و توزیع تجهیزات دندانپزشکی، همواره در تلاش بوده تا بهترین و باکیفیت‌ترین محصولات را در اختیار دندانپزشکان سراسر کشور قرار دهد. ما با ایجاد ارتباط مستقیم با تولیدکنندگان معتبر جهانی، محصولات اصل و با گارانتی را ارائه می‌دهیم.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-100">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-mersadent-accent/10 text-mersadent-accent flex-shrink-0">
                  <Star className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-mersadent-dark mb-2">ماموریت ما</h2>
                  <p className="text-sm text-gray-500 leading-7">
                    ماموریت ما ارائه تجهیزات دندانپزشکی با کیفیت و قیمت مناسب به جامعه دندانپزشکی ایران است. ما معتقدیم که هر دندانپزشک حق دارد از بهترین ابزار و تجهیزات برای درمان بیماران خود بهره‌مند شود.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-100">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-mersadent-accent/10 text-mersadent-accent flex-shrink-0">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-mersadent-dark mb-2">چرا مرصادنت؟</h2>
                  <ul className="text-sm text-gray-500 leading-7 flex flex-col gap-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-mersadent-accent flex-shrink-0 mt-1" />
                      نماینده رسمی برندهای معتبر بین‌المللی
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-mersadent-accent flex-shrink-0 mt-1" />
                      گارانتی اصالت و سلامت کالا
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-mersadent-accent flex-shrink-0 mt-1" />
                      مشاوره رایگان فنی و فروش
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-mersadent-accent flex-shrink-0 mt-1" />
                      ارسال سریع به سراسر کشور
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-mersadent-accent flex-shrink-0 mt-1" />
                      خدمات پس از فروش و پشتیبانی
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================
// BLOG ENTRY BANNER (used in Homepage) — clickable rectangle that
// routes the user to the full articles page instead of previewing posts.
// ============================================================
function BlogPreviewSection({ onNavigate }: { onNavigate: (view: PageView) => void }) {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6">
      <button
        type="button"
        onClick={() => { onNavigate({ type: 'blog' }); window.scrollTo(0, 0); }}
        className="group w-full relative overflow-hidden rounded-2xl border-2 border-mersadent-accent/40 bg-white p-5 sm:p-6 flex items-center justify-between gap-4 text-right hover:border-mersadent-accent hover:shadow-md transition-all"
      >
        {/* Accent side bar */}
        <div className="absolute inset-y-0 right-0 w-1.5 bg-mersadent-accent" aria-hidden="true" />

        {/* Content */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-mersadent-accent text-white flex items-center justify-center shadow-sm group-hover:bg-mersadent-accent/90 transition-colors">
            <BookOpen className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>
          <div className="flex flex-col gap-1 min-w-0">
            <h2 className="text-base sm:text-lg font-bold leading-7 text-mersadent-dark">
              مقالات آموزشی را از اینجا بخوانید
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 leading-6 line-clamp-2">
              جدیدترین مطالب و راهنماهای تخصصی دندانپزشکی را در بخش مقالات دنبال کنید.
            </p>
          </div>
        </div>

        {/* Arrow indicator */}
        <div className="hidden sm:flex flex-shrink-0 items-center gap-1.5 text-mersadent-accent text-sm font-medium ps-2">
          ورود به بخش مقالات
          <ChevronLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
        </div>
        <ChevronLeft className="sm:hidden w-5 h-5 text-mersadent-accent flex-shrink-0" />
      </button>
    </section>
  );
}

// ============================================================
// BLOG LIST PAGE
// ============================================================
function BlogListPage({ onNavigate, categorySlug }: { onNavigate: (view: PageView) => void; categorySlug?: string }) {
  const [posts, setPosts] = useState<BlogPostListItem[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [activeCategory, setActiveCategory] = useState(categorySlug || '');
  const [loading, setLoading] = useState(true);

  const PER_PAGE = 9;

  useEffect(() => {
    fetch('/api/blog-categories')
      .then(r => r.json())
      .then(data => setCategories(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({ page: String(page), limit: String(PER_PAGE) });
        if (activeCategory) params.set('categoryId', activeCategory);
        const res = await fetch(`/api/blog?${params}`);
        const data = await res.json();
        if (!cancelled) {
          setPosts(data.posts || []);
          setTotal(data.total || 0);
        }
      } catch {}
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [page, activeCategory]);

  const totalPages = Math.ceil(total / PER_PAGE);
  const persianDate = (dateStr: string) => {
    return new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(dateStr));
  };

  const getCategoryIcon = (slug: string) => {
    switch (slug) {
      case 'maintenance': return <Wrench className="w-4 h-4" />;
      case 'troubleshooting': return <AlertTriangle className="w-4 h-4" />;
      case 'buying-guide': return <ShoppingCart className="w-4 h-4" />;
      case 'safety-standards': return <HeartPulse className="w-4 h-4" />;
      default: return <BookOpen className="w-4 h-4" />;
    }
  };

  return (
    <motion.div {...fadeIn} className="max-w-7xl mx-auto px-4 sm:px-6 pb-8">
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
            <BreadcrumbPage>مقالات آموزشی</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-mersadent-accent/10 text-mersadent-accent">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-mersadent-dark">مقالات آموزشی</h1>
            <p className="text-sm text-gray-400 mt-0.5">راهنماها و آموزش‌های تخصصی تجهیزات دندانپزشکی</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar - Categories */}
        <aside className="w-full lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-gray-100 p-4 lg:sticky lg:top-24">
            <h3 className="text-sm font-bold text-mersadent-dark mb-3">دسته‌بندی مقالات</h3>
            <div className="flex flex-col gap-1">
              <button
                onClick={() => { setActiveCategory(''); setPage(1); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors ${!activeCategory ? 'bg-mersadent-accent/10 text-mersadent-accent font-semibold' : 'text-gray-600 hover:bg-mersadent-bg hover:text-mersadent-dark'}`}
              >
                <span className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  همه مقالات
                </span>
                <Badge variant="secondary" className="text-[10px] px-1.5">{total}</Badge>
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => { setActiveCategory(cat.slug); setPage(1); }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors ${activeCategory === cat.slug ? 'bg-mersadent-accent/10 text-mersadent-accent font-semibold' : 'text-gray-600 hover:bg-mersadent-bg hover:text-mersadent-dark'}`}
                >
                  <span className="flex items-center gap-2">
                    {getCategoryIcon(cat.slug)}
                    <span className="text-right">{cat.name}</span>
                  </span>
                  <Badge variant="secondary" className="text-[10px] px-1.5">{cat._count.posts}</Badge>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Posts Grid */}
        <div className="flex-1">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-72 rounded-2xl" />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <BookOpen className="w-16 h-16 text-gray-200 mb-4" />
              <h3 className="text-lg font-semibold text-gray-400 mb-2">مقاله‌ای یافت نشد</h3>
              <p className="text-sm text-gray-400">در این دسته‌بندی هنوز مقاله‌ای منتشر نشده است</p>
            </div>
          ) : (
            <>
              <motion.div
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"
              >
                {posts.map((post) => (
                  <motion.div
                    key={post.id}
                    variants={staggerItem}
                    whileHover={{ y: -4 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  >
                    <Card
                      className="cursor-pointer group h-full border border-gray-100 hover:border-mersadent-accent/40 hover:shadow-lg transition-all duration-300 overflow-hidden"
                      onClick={() => onNavigate({ type: 'blogPost', slug: post.slug })}
                    >
                      {/* Cover area */}
                      <div className="relative w-full aspect-[16/10] bg-gradient-to-br from-mersadent-dark/5 to-mersadent-accent/10 flex items-center justify-center overflow-hidden">
                        {post.coverImage ? (
                          <img
                            src={post.coverImage}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <BookOpen className="w-10 h-10 text-mersadent-accent/30 group-hover:text-mersadent-accent/50 transition-colors" />
                        )}
                        <Badge className="absolute top-3 right-3 bg-white/90 text-mersadent-dark text-[10px] font-medium px-2 py-0.5 shadow-sm">
                          {post.category.name}
                        </Badge>
                        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-[11px] text-gray-500">
                          <Clock className="w-3 h-3" />
                          {post.readTime} دقیقه مطالعه
                        </div>
                      </div>
                      <CardContent className="p-4 flex flex-col gap-2">
                        <h3 className="text-sm font-bold text-mersadent-dark leading-6 line-clamp-2 min-h-[2.5rem] group-hover:text-mersadent-accent transition-colors">
                          {post.title}
                        </h3>
                        <p className="text-xs text-gray-500 leading-5 line-clamp-2">
                          {post.excerpt}
                        </p>
                        <div className="flex items-center justify-between pt-2 mt-auto border-t border-gray-50">
                          <span className="text-[11px] text-gray-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {persianDate(post.createdAt)}
                          </span>
                          <span className="text-xs text-mersadent-accent font-medium flex items-center gap-0.5 group-hover:gap-1.5 transition-all">
                            ادامه مطلب
                            <ArrowLeft className="w-3 h-3" />
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage(p => p - 1)}
                    className="h-9 px-3"
                  >
                    <ChevronRight className="w-4 h-4" />
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
                        {pageNum}
                      </Button>
                    );
                  })}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage(p => p + 1)}
                    className="h-9 px-3"
                  >
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

// ============================================================
// BLOG POST PAGE
// ============================================================
function BlogPostPage({ onNavigate, slug }: { onNavigate: (view: PageView) => void; slug: string }) {
  const [post, setPost] = useState<BlogPostFull | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogPostListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/blog/${slug}`);
        if (!res.ok) throw new Error('Not found');
        const data = await res.json();
        if (!cancelled) {
          setPost(data.post);
          setRelatedPosts(data.relatedPosts || []);
        }
      } catch {}
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [slug]);

  const persianDate = (dateStr: string) => {
    return new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(dateStr));
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-8">
        <div className="flex flex-col gap-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/3" />
          <div className="flex gap-4 mt-4">
            <Skeleton className="h-64 flex-1" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <motion.div {...fadeIn} className="max-w-4xl mx-auto px-4 sm:px-6 pb-8 text-center py-20">
        <BookOpen className="w-16 h-16 text-gray-200 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-400 mb-2">مقاله یافت نشد</h2>
        <Button variant="outline" onClick={() => onNavigate({ type: 'blog' })} className="mt-4 text-mersadent-accent border-mersadent-accent/30 hover:bg-mersadent-accent/5">
          بازگشت به مقالات
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
            <BreadcrumbLink onClick={() => onNavigate({ type: 'blog' })} className="cursor-pointer text-sm">
              مقالات آموزشی
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink
              onClick={() => onNavigate({ type: 'blog', categorySlug: post.category.slug })}
              className="cursor-pointer text-sm"
            >
              {post.category.name}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-sm line-clamp-1 max-w-[200px]">{post.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Article Header */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {/* Cover */}
        <div className="w-full aspect-[21/9] bg-gradient-to-br from-mersadent-dark/5 to-mersadent-accent/10 flex items-center justify-center sm:aspect-[21/8] overflow-hidden">
          {post.coverImage ? (
            <img
              src={post.coverImage}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <BookOpen className="w-16 h-16 text-mersadent-accent/30" />
          )}
        </div>

        <div className="p-5 sm:p-8">
          {/* Meta */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <Badge className="bg-mersadent-accent/10 text-mersadent-accent border-mersadent-accent/20 text-xs">
              {post.category.name}
            </Badge>
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Calendar className="w-3.5 h-3.5" />
              {persianDate(post.createdAt)}
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Clock className="w-3.5 h-3.5" />
              {post.readTime} دقیقه مطالعه
            </span>
          </div>

          {/* Title */}
          <h1 className="text-lg sm:text-2xl font-extrabold text-mersadent-dark leading-9 mb-6">
            {post.title}
          </h1>

          {/* Excerpt */}
          <div className="bg-mersadent-bg rounded-xl p-4 mb-8 border-r-4 border-mersadent-accent">
            <p className="text-sm text-gray-600 leading-7 font-medium">{post.excerpt}</p>
          </div>

          {/* Content */}
          <article
            className="blog-content"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* CTA */}
          <div className="mt-10 p-5 bg-mersadent-dark rounded-2xl text-center">
            <h3 className="text-base font-bold text-white mb-2">نیاز به تجهیزات یا مشاوره دارید؟</h3>
            <p className="text-sm text-gray-400 mb-4">کارشناسان مرصادنت آماده راهنمایی شما هستند</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Button asChild className="bg-mersadent-accent hover:bg-mersadent-accent/90 text-white rounded-xl px-6 h-10 font-semibold text-sm">
                <a href="tel:02112345678">
                  <Phone className="w-4 h-4 ml-2" />
                  تماس با کارشناس
                </a>
              </Button>
              <Button
                variant="outline"
                onClick={() => onNavigate({ type: 'category', categoryId: 0, slug: 'all' })}
                className="bg-transparent border-white/40 text-white hover:bg-white/10 rounded-xl px-6 h-10 font-semibold text-sm"
              >
                مشاهده محصولات
                <ChevronLeft className="w-4 h-4 mr-1" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <div className="mt-10">
          <h2 className="text-lg font-bold text-mersadent-dark mb-5">مقالات مرتبط</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {relatedPosts.map(rp => (
              <Card
                key={rp.id}
                className="cursor-pointer group border border-gray-100 hover:border-mersadent-accent/40 hover:shadow-md transition-all overflow-hidden"
                onClick={() => {
                  onNavigate({ type: 'blogPost', slug: rp.slug });
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                <div className="w-full aspect-[16/10] bg-gradient-to-br from-mersadent-dark/5 to-mersadent-accent/10 flex items-center justify-center">
                  <BookOpen className="w-8 h-8 text-mersadent-accent/30 group-hover:text-mersadent-accent/50 transition-colors" />
                </div>
                <CardContent className="p-3">
                  <h3 className="text-xs font-bold text-mersadent-dark leading-5 line-clamp-2 group-hover:text-mersadent-accent transition-colors">
                    {rp.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-2 text-[10px] text-gray-400">
                    <span>{rp.readTime} دقیقه</span>
                    <span>•</span>
                    <span>{persianDate(rp.createdAt)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ============================================================
// MOBILE BOTTOM NAV (hamburger-style footer tab bar)
// ============================================================
function MobileBottomNav({
  currentView,
  user,
  cartCount,
  onNavigate,
  onSearch,
  onOpenCart,
  onAuthRequired,
}: {
  currentView: PageView;
  user: UserData | null;
  cartCount: number;
  onNavigate: (view: PageView) => void;
  onSearch: (query: string) => void;
  onOpenCart: () => void;
  onAuthRequired: () => void;
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Autofocus the search input when the sheet opens
  useEffect(() => {
    if (searchOpen) {
      const t = setTimeout(() => searchInputRef.current?.focus(), 100);
      return () => clearTimeout(t);
    }
  }, [searchOpen]);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Read directly from the DOM input via ref — robust and avoids stale state
    const raw = (searchInputRef.current?.value ?? '').trim();
    if (raw) {
      onSearch(raw);
      setSearchOpen(false);
      if (searchInputRef.current) searchInputRef.current.value = '';
    }
  };

  // Determine which tab is "active" based on the current view
  const activeTab: 'home' | 'categories' | 'search' | 'cart' | 'user' = (() => {
    switch (currentView.type) {
      case 'home': return 'home';
      case 'category': return 'categories';
      case 'search': return 'search';
      case 'cart':
      case 'checkout': return 'cart';
      case 'user':
      case 'order-detail': return 'user';
      default: return 'home';
    }
  })();

  const tabs: Array<{
    key: typeof activeTab;
    label: string;
    icon: React.ReactNode;
    badge?: number;
    onClick: () => void;
  }> = [
    {
      key: 'home',
      label: 'خانه',
      icon: <Home className="w-5 h-5" />,
      onClick: () => { onNavigate({ type: 'home' }); window.scrollTo(0, 0); },
    },
    {
      key: 'categories',
      label: 'دسته‌بندی‌ها',
      icon: <LayoutGrid className="w-5 h-5" />,
      onClick: () => { onNavigate({ type: 'category', categoryId: 0, slug: 'all' }); window.scrollTo(0, 0); },
    },
    {
      key: 'search',
      label: 'جستجو',
      icon: <Search className="w-5 h-5" />,
      onClick: () => setSearchOpen(true),
    },
    {
      key: 'cart',
      label: 'سبد خرید',
      icon: <ShoppingCart className="w-5 h-5" />,
      badge: cartCount,
      onClick: () => onOpenCart(),
    },
    {
      key: 'user',
      label: user ? 'حساب من' : 'ورود',
      icon: <User className="w-5 h-5" />,
      onClick: () => { if (user) { onNavigate({ type: 'user' }); } else { onAuthRequired(); } },
    },
  ];

  return (
    <>
      {/* Fixed bottom tab bar — mobile only */}
      <nav
        aria-label="ناوبری سریع موبایل"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="grid grid-cols-5 h-16">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={tab.onClick}
                aria-label={tab.label}
                aria-current={isActive ? 'page' : undefined}
                className={`relative flex flex-col items-center justify-center gap-1 transition-colors ${
                  isActive
                    ? 'text-mersadent-accent'
                    : 'text-gray-500 hover:text-mersadent-dark'
                }`}
              >
                <span className="relative">
                  {tab.icon}
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className="absolute -top-2 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
                      {new Intl.NumberFormat('fa-IR').format(tab.badge)}
                    </span>
                  )}
                </span>
                <span className={`text-[10px] leading-none ${isActive ? 'font-bold' : 'font-medium'}`}>
                  {tab.label}
                </span>
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-mersadent-accent rounded-b-full" />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Search bottom sheet */}
      <Sheet open={searchOpen} onOpenChange={setSearchOpen}>
        <SheetContent side="bottom" className="p-0">
          <SheetTitle className="sr-only">جستجوی محصول</SheetTitle>
          <div className="p-4 pb-8">
            <form onSubmit={submitSearch} className="flex gap-2">
              <Input
                ref={searchInputRef}
                defaultValue=""
                placeholder="نام محصول، برند یا دسته‌بندی..."
                className="flex-1 h-12 text-base"
                inputMode="search"
              />
              <Button
                type="submit"
                size="icon"
                className="h-12 w-12 bg-mersadent-accent hover:bg-mersadent-accent/90 text-white shrink-0"
                aria-label="جستجو"
              >
                <Search className="w-5 h-5" />
              </Button>
            </form>
            <p className="text-xs text-gray-400 mt-3 text-center">
              برای جستجو Enter را بزنید
            </p>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

// ============================================================
// FOOTER
// ============================================================
function Footer({ onNavigate }: { onNavigate: (view: PageView) => void }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch('/api/categories')
      .then(r => r.json())
      .then(data => setCategories(data))
      .catch(() => {});
    fetch('/api/settings')
      .then(r => r.json())
      .then(d => { if (d?.settings) setSettings(d.settings); })
      .catch(() => {});
  }, []);

  // Normalize a phone string for tel: href (strip non-digits, convert Persian digits)
  const telHref = (raw: string) => {
    if (!raw) return '';
    const persian = '۰۱۲۳۴۵۶۷۸۹';
    let out = '';
    for (const ch of raw) {
      const idx = persian.indexOf(ch);
      out += idx >= 0 ? String(idx) : ch;
    }
    return `tel:${out.replace(/[^\d+]/g, '')}`;
  };

  const phone = settings.phone?.trim() || '';
  const email = settings.email?.trim() || '';
  const address = settings.address?.trim() || '';
  const instagram = settings.instagram?.trim() || '';
  const telegram = settings.telegram?.trim() || '';
  const whatsapp = settings.whatsapp?.trim() || '';
  const hasSocial = instagram || telegram || whatsapp;
  const enamadCode = (settings.enamad_code || '').trim().replace(/[^\d]/g, '');

  return (
    <footer className="bg-mersadent-dark text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10">
          {/* Company info */}
          <div className="col-span-2 md:col-span-1">
            <div className="mb-4">
              <img src="/logo.png" alt="MersaDent" className="h-10 w-auto object-contain" />
            </div>
            <p className="text-sm text-gray-400 leading-7">
              {settings.site_description || 'تأمین‌کننده انواع تجهیزات و مواد مصرفی دندانپزشکی با بهترین کیفیت و قیمت'}
            </p>
            {hasSocial && (
              <div className="flex items-center gap-2 mt-4">
                {instagram && (
                  <a
                    href={instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="اینستاگرام"
                    className="w-9 h-9 rounded-full bg-white/5 hover:bg-mersadent-accent/20 text-gray-300 hover:text-mersadent-accent flex items-center justify-center transition-colors"
                  >
                    <Instagram className="w-4 h-4" />
                  </a>
                )}
                {telegram && (
                  <a
                    href={telegram}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="تلگرام"
                    className="w-9 h-9 rounded-full bg-white/5 hover:bg-mersadent-accent/20 text-gray-300 hover:text-mersadent-accent flex items-center justify-center transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </a>
                )}
                {whatsapp && (
                  <a
                    href={whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="واتساپ"
                    className="w-9 h-9 rounded-full bg-white/5 hover:bg-mersadent-accent/20 text-gray-300 hover:text-mersadent-accent flex items-center justify-center transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-sm font-bold mb-4">دسته‌بندی‌ها</h3>
            <ul className="flex flex-col gap-2">
              {categories.slice(0, 6).map(cat => (
                <li key={cat.id}>
                  <button
                    onClick={() => {
                      onNavigate({ type: 'category', categoryId: cat.id, slug: cat.slug });
                      window.scrollTo(0, 0);
                    }}
                    className="text-sm text-gray-400 hover:text-mersadent-accent transition-colors"
                  >
                    {cat.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Company links */}
          <div>
            <h3 className="text-sm font-bold mb-4">دسترسی سریع</h3>
            <ul className="flex flex-col gap-2">
              {[
                { label: 'صفحه اصلی', action: () => { onNavigate({ type: 'home' }); window.scrollTo(0, 0); } },
                { label: 'مقالات آموزشی', action: () => { onNavigate({ type: 'blog' }); window.scrollTo(0, 0); } },
                { label: 'برندها', action: () => { onNavigate({ type: 'brand', brandId: 0, brandName: 'all' }); window.scrollTo(0, 0); } },
                { label: 'درباره ما', action: () => { onNavigate({ type: 'about' }); window.scrollTo(0, 0); } },
              ].map(item => (
                <li key={item.label}>
                  <button
                    onClick={item.action}
                    className="text-sm text-gray-400 hover:text-mersadent-accent transition-colors"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-bold mb-4">تماس با ما</h3>
            <ul className="flex flex-col gap-3">
              {phone && (
                <li>
                  <a href={telHref(phone)} className="flex items-center gap-2 text-sm text-gray-400 hover:text-mersadent-accent transition-colors">
                    <Phone className="w-4 h-4 text-mersadent-accent flex-shrink-0" />
                    <span dir="ltr" className="text-right">{phone}</span>
                  </a>
                </li>
              )}
              {email && (
                <li>
                  <a href={`mailto:${email}`} className="flex items-center gap-2 text-sm text-gray-400 hover:text-mersadent-accent transition-colors">
                    <Mail className="w-4 h-4 text-mersadent-accent flex-shrink-0" />
                    <span dir="ltr" className="text-right">{email}</span>
                  </a>
                </li>
              )}
              {address && (
                <li>
                  <a
                    href={`https://nshn.ir/search?q=${encodeURIComponent(address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-2 text-sm text-gray-400 hover:text-mersadent-accent transition-colors"
                  >
                    <MapPin className="w-4 h-4 text-mersadent-accent flex-shrink-0 mt-0.5" />
                    <span>{address}</span>
                    <ExternalLink className="w-3 h-3 flex-shrink-0 mt-0.5" />
                  </a>
                </li>
              )}
              <li className="flex items-center gap-2 text-sm text-gray-400">
                <Clock className="w-4 h-4 text-mersadent-accent flex-shrink-0" />
                شنبه تا پنجشنبه ۹ - ۱۸
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Trust badges — e-Namad (auto-shown when enamad_code is set) */}
      {enamadCode && (
        <div className="border-t border-white/10 bg-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-center sm:justify-start">
            <a
              href={`https://trustseal.enamad.ir/?id=${enamadCode}`}
              target="_blank"
              rel="noopener noreferrer"
              referrerPolicy="origin"
              className="inline-block bg-white rounded-md p-1.5 shadow-sm hover:shadow-md transition-shadow"
              aria-label="نماد اعتماد الکترونیکی (ای‌نماد)"
              title="نماد اعتماد الکترونیکی"
            >
              <img
                referrerPolicy="origin"
                src={`https://trustseal.enamad.ir/logo.aspx?id=${enamadCode}`}
                alt="نماد اعتماد الکترونیکی"
                className="h-20 w-auto block"
              />
            </a>
          </div>
        </div>
      )}

      {/* Copyright */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-gray-500">
            © ۱۴۰۴ MersaDent. تمامی حقوق محفوظ است.
          </p>
          <p className="text-xs text-gray-500">
            طراحی و توسعه armangbg
          </p>
        </div>
      </div>
    </footer>
  );
}

// ============================================================
// MAIN APP
// ============================================================
export default function MersadentApp() {
  const [currentView, setCurrentView] = useState<PageView>({ type: 'home' });
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [allBrandsList, setAllBrandsList] = useState<Brand[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [adminSection, setAdminSection] = useState('dashboard');

  // User & Cart state
  const [user, setUser] = useState<UserData | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [cartSidebarOpen, setCartSidebarOpen] = useState(false);

  // Check for existing sessions on mount
  useEffect(() => {
    const adminT = localStorage.getItem('admin_token');
    if (adminT) queueMicrotask(() => setAdminToken(adminT));

    const userT = localStorage.getItem('user_token');
    if (userT) {
      fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${userT}` },
      })
        .then(r => {
          if (r.ok) return r.json();
          throw new Error('Not authenticated');
        })
        .then(data => {
          if (data.user) setUser(data.user);
        })
        .catch(() => {
          localStorage.removeItem('user_token');
        });
    }
  }, []);

  // Fetch cart count when user changes
  const fetchCartCount = useCallback(async () => {
    if (!user) { setCartCount(0); return; }
    try {
      const token = localStorage.getItem('user_token');
      const res = await fetch('/api/cart', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCartCount(data.itemCount || 0);
      }
    } catch {
      // silent
    }
  }, [user]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!user) { if (!cancelled) setCartCount(0); return; }
        const token = localStorage.getItem('user_token');
        const res = await fetch('/api/cart', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (res.ok && !cancelled) {
          const data = await res.json();
          setCartCount(data.itemCount || 0);
        }
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [user]);

  // Add to cart handler
  const handleAddToCart = useCallback(async (productId: number, quantity: number = 1) => {
    try {
      const token = localStorage.getItem('user_token');
      const res = await fetch('/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ productId, quantity }),
      });
      if (res.ok) {
        const data = await res.json();
        setCartCount(data.itemCount || 0);
        toast.success(`${quantity} عدد به سبد خرید اضافه شد`);
      } else {
        const data = await res.json();
        toast.error(data.error || 'خطا در افزودن به سبد خرید');
      }
    } catch {
      toast.error('خطای شبکه');
    }
  }, []);

  // Login success handler
  const handleLoginSuccess = (u: UserData, token: string) => {
    localStorage.setItem('user_token', token);
    setUser(u);
  };

  // Logout handler
  const handleUserLogout = () => {
    localStorage.removeItem('user_token');
    setUser(null);
    setCartCount(0);
    toast.success('با موفقیت خارج شدید');
  };

  // Load categories and brands on mount
  useEffect(() => {
    Promise.all([
      fetch('/api/categories').then(r => r.json()),
      fetch('/api/brands').then(r => r.json()),
      fetch('/api/brands?all=true').then(r => r.json()).catch(() => []),
    ])
      .then(([cats, brs, allBrands]) => {
        setCategories(cats);
        setBrands(brs);
        setAllBrandsList(Array.isArray(allBrands) ? allBrands : brs);
      })
      .catch(() => {});
  }, []);

  // Dynamic SEO: title, meta description, JSON-LD
  useEffect(() => {
    let url = '/api/seo?type=home';
    if (currentView.type === 'category' && currentView.categoryId) {
      url = `/api/seo?type=category&id=${currentView.categoryId}`;
    } else if (currentView.type === 'brand' && currentView.brandId) {
      url = `/api/seo?type=brand&id=${currentView.brandId}`;
    } else if (currentView.type === 'product') {
      url = `/api/seo?type=product&id=${currentView.productId}`;
    }

    fetch(url)
      .then(r => r.json())
      .then(data => {
        if (data.title) {
          document.title = data.title;
        }
        if (data.description) {
          const metaDesc = document.querySelector('meta[name="description"]');
          if (metaDesc) {
            metaDesc.setAttribute('content', data.description);
          } else {
            const meta = document.createElement('meta');
            meta.name = 'description';
            meta.content = data.description;
            document.head.appendChild(meta);
          }
        }
        // JSON-LD injection
        let ldScript = document.querySelector('script[type="application/ld+json"]') as HTMLScriptElement | null;
        if (data.ldJson) {
          if (!ldScript) {
            ldScript = document.createElement('script');
            ldScript.type = 'application/ld+json';
            document.head.appendChild(ldScript);
          }
          ldScript.textContent = typeof data.ldJson === 'string' ? data.ldJson : JSON.stringify(data.ldJson);
        } else if (ldScript) {
          ldScript.remove();
        }
      })
      .catch(() => {});
  }, [currentView]);

  const navigate = useCallback((view: PageView, options?: { replace?: boolean }) => {
    const url = viewToUrl(view);
    const prevDepth = typeof window !== 'undefined' && window.history.state && typeof window.history.state.depth === 'number'
      ? window.history.state.depth
      : 0;
    const nextDepth = options?.replace ? prevDepth : prevDepth + 1;
    const nextState = { view, depth: nextDepth };

    if (typeof window !== 'undefined') {
      try {
        if (options?.replace) {
          window.history.replaceState(nextState, '', url);
        } else {
          window.history.pushState(nextState, '', url);
        }
      } catch {}
    }

    setCurrentView(view);
    if (view.type === 'search') {
      setSearchQuery(view.query);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Browser History & URL synchronization
  useEffect(() => {
    // 1. Initial parse on load (refresh, bookmark, or direct URL entry)
    const initialView = urlToView(window.location.search, window.location.hash);
    if (initialView.type !== 'home') {
      queueMicrotask(() => {
        setCurrentView(initialView);
        if (initialView.type === 'search') {
          setSearchQuery(initialView.query);
        }
      });
    }

    // Set initial history state if not already initialized
    if (!window.history.state || typeof window.history.state.depth !== 'number') {
      try {
        window.history.replaceState({ view: initialView, depth: 0 }, '', window.location.href);
      } catch {}
    }

    // 2. Handle back / forward browser navigation
    const handlePopState = (e: PopStateEvent) => {
      if (e.state && e.state.view) {
        setCurrentView(e.state.view);
        if (e.state.view.type === 'search') {
          setSearchQuery(e.state.view.query);
        }
      } else {
        const parsed = urlToView(window.location.search, window.location.hash);
        setCurrentView(parsed);
        if (parsed.type === 'search') {
          setSearchQuery(parsed.query);
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Hidden admin access — no visible button in the footer.
  // Two discreet ways to reach the admin login:
  //   1) URL hash: open "/#admin" (bookmarkable, shareable with the site owner)
  //   2) Keyboard shortcut: Ctrl + Shift + A (common admin shortcut)
  useEffect(() => {
    const goAdmin = () => navigate({ type: 'adminLogin' });

    // 1) Hash-based access (also handles hash changes after load)
    const checkHash = () => {
      if (window.location.hash.replace(/^#/, '').toLowerCase() === 'admin') {
        goAdmin();
        // Clear the hash so a refresh doesn't keep dropping the visitor
        // straight back into the admin login screen.
        try {
          const depth = (window.history.state?.depth || 0) + 1;
          window.history.replaceState({ view: { type: 'adminLogin' }, depth }, '', window.location.pathname + window.location.search);
        } catch {}
      }
    };
    checkHash();
    window.addEventListener('hashchange', checkHash);

    // 2) Keyboard shortcut: Ctrl + Shift + A
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        goAdmin();
      }
    };
    window.addEventListener('keydown', onKey);

    return () => {
      window.removeEventListener('hashchange', checkHash);
      window.removeEventListener('keydown', onKey);
    };
  }, [navigate]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    navigate({ type: 'search', query });
  }, [navigate]);

  const handleAdminLogin = (token: string) => {
    setAdminToken(token);
    navigate({ type: 'admin', section: 'dashboard' });
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('admin_token');
    setAdminToken(null);
    navigate({ type: 'home' });
  };

  const renderAdminContent = (section: string) => {
    if (!adminToken) return null;
    switch (section) {
      case 'products': return <AdminProducts token={adminToken} />;
      case 'categories': return <AdminCategories token={adminToken} />;
      case 'brands': return <AdminBrands token={adminToken} />;
      case 'blog': return <AdminBlog token={adminToken} />;
      case 'blog-categories': return <AdminBlogCategories token={adminToken} />;
      case 'orders': return <AdminOrders token={adminToken} />;
      case 'users': return <AdminUsers token={adminToken} />;
      case 'settings': return <AdminSettings token={adminToken} />;
      default: return <AdminDashboard token={adminToken} />;
    }
  };

  const renderView = () => {
    switch (currentView.type) {
      case 'adminLogin':
        return <AdminLogin onLoginSuccess={handleAdminLogin} onBack={() => navigate({ type: 'home' })} />;
      case 'admin':
        if (!adminToken) {
          return <AdminLogin onLoginSuccess={handleAdminLogin} onBack={() => navigate({ type: 'home' })} />;
        }
        return (
          <AdminLayout
            activeSection={adminSection}
            onNavigate={setAdminSection}
            onLogout={handleAdminLogout}
          >
            {renderAdminContent(adminSection)}
          </AdminLayout>
        );
      case 'home':
        return <HomePage onNavigate={navigate} user={user} onAuthRequired={() => setAuthModalOpen(true)} onAddToCart={handleAddToCart} />;
      case 'category':
        return <CategoryPage view={currentView} onNavigate={navigate} categories={categories} user={user} onAuthRequired={() => setAuthModalOpen(true)} onAddToCart={handleAddToCart} />;
      case 'brand':
        if (currentView.brandId === 0) {
          return <BrandAllPage brands={allBrandsList} onNavigate={navigate} />;
        }
        return <BrandPage view={currentView} onNavigate={navigate} user={user} onAuthRequired={() => setAuthModalOpen(true)} onAddToCart={handleAddToCart} />;
      case 'product':
        return <ProductDetailPage view={currentView} onNavigate={navigate} user={user} onAuthRequired={() => setAuthModalOpen(true)} onAddToCart={handleAddToCart} />;
      case 'search':
        return <SearchResultsPage query={currentView.query || searchQuery} onNavigate={navigate} user={user} onAuthRequired={() => setAuthModalOpen(true)} onAddToCart={handleAddToCart} />;
      case 'about':
        return <AboutPage onNavigate={navigate} />;
      case 'blog':
        return <BlogListPage onNavigate={navigate} categorySlug={currentView.categorySlug} />;
      case 'blogPost':
        return <BlogPostPage onNavigate={navigate} slug={currentView.slug} />;
      case 'cart':
        return <CartPage user={user} onNavigate={navigate} onAuthRequired={() => setAuthModalOpen(true)} onCartChange={fetchCartCount} />;
      case 'checkout':
        if (!user) { setAuthModalOpen(true); navigate({ type: 'home' }); return null; }
        return <CheckoutPage user={user} onNavigate={navigate} onAuthRequired={() => setAuthModalOpen(true)} onCartChange={fetchCartCount} onOrderSuccess={(orderId, orderNumber) => { navigate({ type: 'order-detail', orderId }); }} />;
      case 'user':
        return <UserPanel user={user} setUser={setUser} onNavigate={navigate} onAuthRequired={() => setAuthModalOpen(true)} defaultTab={(currentView as any).tab} />;
      case 'order-detail':
        return <OrderDetailPage orderId={currentView.orderId} onNavigate={navigate} onAuthRequired={() => setAuthModalOpen(true)} />;
      case 'compare':
        return <CompareView onBack={() => navigate({ type: 'home' })} onNavigateToProduct={(id) => navigate({ type: 'product', productId: id })} />;
      default:
        return <HomePage onNavigate={navigate} user={user} onAuthRequired={() => setAuthModalOpen(true)} onAddToCart={handleAddToCart} />;
    }
  };

  // Admin views render without header/footer
  const isAdminView = currentView.type === 'admin' || currentView.type === 'adminLogin';

  if (isAdminView) {
    return (
      <>
        <Toaster position="top-center" richColors closeButton />
        <AnimatePresence mode="wait">{renderView()}</AnimatePresence>
      </>
    );
  }

  return (
    
      <div className="bg-mersadent-bg">
        <main className="min-w-0 overflow-x-clip py-6 sm:py-8">
          <AnimatePresence mode="wait">
            {renderView()}
          </AnimatePresence>
        </main>

        {/* Auth Modal */}
        <AuthModal
          open={authModalOpen}
          onOpenChange={setAuthModalOpen}
          onLoginSuccess={handleLoginSuccess}
        />

        {/* Cart Sidebar */}
        <CartSidebar
          open={cartSidebarOpen}
          onOpenChange={setCartSidebarOpen}
          user={user}
          onAuthRequired={() => setAuthModalOpen(true)}
          onCartChange={fetchCartCount}
          onViewCart={() => { setCartSidebarOpen(false); navigate({ type: 'cart' }); }}
        />

        
      </div>
    
  );
}