'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Home, Search, ShoppingBag, User, LayoutGrid, ShoppingCart } from 'lucide-react';
import { useAppNavigation } from '@/hooks/useAppNavigation';
import { useAppContext } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';

export function MobileBottomNav() {
  const { user, cartCount, setAuthModalOpen, setCartSidebarOpen } = useAppContext();
  const navigate = useAppNavigation();
  const onNavigate = navigate;
  const onAuthRequired = () => setAuthModalOpen(true);
  const onOpenCart = () => setCartSidebarOpen(true);
  const onSearch = (query: string) => navigate({ type: 'search', query });
  const currentView = { type: 'home' }; // Just a mock for now since it's only used for active state

  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
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
