'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

// Need to match types from page.tsx (or import them)
// For now, declare them inline or we'll adjust imports.
export interface UserData {
  id: number;
  name: string | null;
  phone: string | null;
  email: string | null;
  userType?: string | null;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  parentId: number | null;
  children?: Category[];
  productCount?: number;
}

export interface Brand {
  id: number;
  name: string;
  slug: string;
}

interface AppContextType {
  user: UserData | null;
  setUser: React.Dispatch<React.SetStateAction<UserData | null>>;
  cartCount: number;
  setCartCount: React.Dispatch<React.SetStateAction<number>>;
  fetchCartCount: () => Promise<void>;
  authModalOpen: boolean;
  setAuthModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  cartSidebarOpen: boolean;
  setCartSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  categories: Category[];
  brands: Brand[];
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [cartSidebarOpen, setCartSidebarOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  // Auth initialization
  useEffect(() => {
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

  // Global Categories and Brands fetcher
  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.ok ? res.json() : [])
      .then(data => setCategories(Array.isArray(data) ? data : []))
      .catch(() => {});

    fetch('/api/brands')
      .then(res => res.ok ? res.json() : [])
      .then(data => setBrands(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const fetchCartCount = useCallback(async () => {
    if (!user) { setCartCount(0); return; }
    try {
      const token = localStorage.getItem('user_token');
      if (!token) return;
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

  // Fetch cart initially when user changes
  useEffect(() => {
    fetchCartCount();
  }, [fetchCartCount]);

  const logout = useCallback(() => {
    localStorage.removeItem('user_token');
    setUser(null);
    setCartCount(0);
  }, []);

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        cartCount,
        setCartCount,
        fetchCartCount,
        authModalOpen,
        setAuthModalOpen,
        cartSidebarOpen,
        setCartSidebarOpen,
        categories,
        brands,
        logout
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
