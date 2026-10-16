'use client';
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Menu, ChevronLeft, ChevronDown, User, LogIn, ShoppingCart, X, ShoppingBag, Package
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useDebounce } from '@/hooks/useDebounce';

// ============================================================
// HEADER
// ============================================================
import { useAppContext } from '@/contexts/AppContext';
import { useAppNavigation } from '@/hooks/useAppNavigation';
export interface SearchResult {
  brand?: string;
  category?: string;
  id: number;
  name: string;
  slug?: string;
  image?: string | null;
  price?: number | null;
  priceType?: string;
}
import { Category, Brand } from '@/contexts/AppContext';

export function Header() {
  const { user, cartCount, setAuthModalOpen, setCartSidebarOpen, logout, categories } = useAppContext();
  const navigate = useAppNavigation();
  const onNavigate = navigate;
  const onAuthRequired = () => setAuthModalOpen(true);
  const onOpenCart = () => setCartSidebarOpen(true);
  const onLogout = logout;
  const onSearch = (query: string) => navigate({ type: 'search', query });
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
    onNavigate({ type: 'product', productId: r.id, slug: r.slug });
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
                          {new Intl.NumberFormat('fa-IR').format(r.price || 0)} تومان
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
                          {(cat.children || []).map((child) => (
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
