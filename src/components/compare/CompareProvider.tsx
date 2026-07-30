'use client';

// ============================================================
// CompareProvider - React context for product comparison state
// MersaDent (مرصادنت) - Persian RTL dental equipment store
// ============================================================
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { toast } from 'sonner';

// ============================================================
// TYPES
// ============================================================

/**
 * A normalized product representation used for comparison.
 * JSON-string fields from the source product (specs / strengths /
 * weaknesses) are parsed into structured values here.
 */
export interface CompareProduct {
  id: number;
  name: string;
  slug: string;
  price: number | null;
  priceType: string;
  availability: string;
  sku: string | null;
  model: string | null;
  country: string | null;
  warranty: string | null;
  weight: string | null;
  brand: { id: number; name: string; slug: string };
  category: { id: number; name: string };
  images: { id: number; url: string; alt: string | null }[];
  tags: { id: number; name: string; slug: string; type: string }[];
  specs: Record<string, string>;
  discountPercent: number;
  strengths: string[];
  weaknesses: string[];
}

interface CompareContextValue {
  items: CompareProduct[];
  rootCategoryId: number | null;
  rootCategoryName: string | null;
  /** Add a product to the compare list (respects same-root-category rule). Returns true on success. */
  addToCompare: (
    product: CompareProduct,
    rootCategoryId: number,
    rootCategoryName?: string,
  ) => boolean;
  /** Remove a single product from the compare list. */
  removeFromCompare: (id: number) => void;
  /** Clear the whole compare list. */
  clearCompare: () => void;
  /** Whether a product id is currently in the compare list. */
  isInCompare: (id: number) => boolean;
  /** Convenience: toggle a raw page Product in/out of the compare list. */
  toggleCompare: (product: CompareProductLike) => void;
  count: number;
  maxItems: number;
}

/**
 * Loose shape accepted by `toggleCompare` / `toCompareProduct`.
 * Matches the page's `Product` type without importing it (avoids circular deps).
 */
export interface CompareProductLike {
  id: number;
  name: string;
  slug: string;
  price: number | null;
  priceType: string;
  availability: string;
  sku?: string | null;
  model?: string | null;
  country?: string | null;
  warranty?: string | null;
  weight?: string | null;
  discountPercent?: number;
  specs?: string | null;
  strengths?: string | null;
  weaknesses?: string | null;
  brand?: { id: number; name: string; slug: string } | null;
  category?: {
    id: number;
    name: string;
    parent?: {
      id: number;
      name?: string;
      parent?: { id: number; name?: string } | null;
    } | null;
  } | null;
  images?: { id: number; url: string; alt?: string | null }[];
  tags?:
    | { tag: { id: number; name: string; slug: string; type: string } }[]
    | { id: number; name: string; slug: string; type: string }[];
}

// ============================================================
// CONSTANTS
// ============================================================
const MAX_ITEMS = 4;
const STORAGE_KEY = 'mersadent_compare_v1';

const CompareContext = createContext<CompareContextValue | null>(null);

// ============================================================
// HELPERS
// ============================================================

/**
 * Compute the root (top-level) category from a 3-level category chain.
 * Returns `{ id, name }` of the topmost parent, or the category itself
 * if it has no parent.
 */
export function getRootCategoryId(category: {
  id: number;
  name?: string;
  parent?: {
    id: number;
    name?: string;
    parent?: { id: number; name?: string } | null;
  } | null;
} | null | undefined): { id: number; name: string } | null {
  if (!category) return null;
  if (category.parent?.parent) {
    return {
      id: category.parent.parent.id,
      name: category.parent.parent.name || '',
    };
  }
  if (category.parent) {
    return { id: category.parent.id, name: category.parent.name || '' };
  }
  return { id: category.id, name: category.name || '' };
}

/**
 * Convert a raw page Product (with JSON-string spec fields) into a
 * normalized CompareProduct ready to be stored in the compare list.
 */
export function toCompareProduct(p: CompareProductLike): CompareProduct {
  let specs: Record<string, string> = {};
  if (p.specs) {
    try {
      specs =
        typeof p.specs === 'string' ? JSON.parse(p.specs) : (p.specs as Record<string, string>);
    } catch {
      specs = {};
    }
  }

  let strengths: string[] = [];
  if (p.strengths) {
    try {
      strengths =
        typeof p.strengths === 'string' ? JSON.parse(p.strengths) : (p.strengths as string[]);
    } catch {
      strengths = [];
    }
  }

  let weaknesses: string[] = [];
  if (p.weaknesses) {
    try {
      weaknesses =
        typeof p.weaknesses === 'string'
          ? JSON.parse(p.weaknesses)
          : (p.weaknesses as string[]);
    } catch {
      weaknesses = [];
    }
  }

  const tags: CompareProduct['tags'] = (p.tags || []).map((t: any) =>
    t.tag
      ? { id: t.tag.id, name: t.tag.name, slug: t.tag.slug, type: t.tag.type }
      : { id: t.id, name: t.name, slug: t.slug, type: t.type },
  );

  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: p.price ?? null,
    priceType: p.priceType,
    availability: p.availability,
    sku: p.sku ?? null,
    model: p.model ?? null,
    country: p.country ?? null,
    warranty: p.warranty ?? null,
    weight: p.weight ?? null,
    brand: p.brand
      ? { id: p.brand.id, name: p.brand.name, slug: p.brand.slug }
      : { id: 0, name: '', slug: '' },
    category: p.category
      ? { id: p.category.id, name: p.category.name }
      : { id: 0, name: '' },
    images: (p.images || []).map((img) => ({
      id: img.id,
      url: img.url,
      alt: img.alt ?? null,
    })),
    tags,
    specs,
    discountPercent: p.discountPercent ?? 0,
    strengths,
    weaknesses,
  };
}

// ============================================================
// PROVIDER
// ============================================================
export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CompareProduct[]>([]);
  const [rootCategoryId, setRootCategoryId] = useState<number | null>(null);
  const [rootCategoryName, setRootCategoryName] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage on mount (deferred to avoid synchronous setState
  // in the effect body, matching the codebase's existing pattern).
  useEffect(() => {
    queueMicrotask(() => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const data = JSON.parse(raw);
          if (Array.isArray(data.items)) {
            setItems(data.items);
            setRootCategoryId(data.rootCategoryId ?? null);
            setRootCategoryName(data.rootCategoryName ?? null);
          }
        }
      } catch {
        /* ignore */
      }
      setHydrated(true);
    });
  }, []);

  // Persist to localStorage whenever state changes (after hydration)
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ items, rootCategoryId, rootCategoryName }),
      );
    } catch {
      /* ignore */
    }
  }, [items, rootCategoryId, rootCategoryName, hydrated]);

  const isInCompare = useCallback((id: number) => items.some((i) => i.id === id), [items]);

  const addToCompare = useCallback(
    (
      product: CompareProduct,
      rootCatId: number,
      rootCatName?: string,
    ): boolean => {
      // Already in list
      if (items.some((i) => i.id === product.id)) {
        toast.info('این محصول هم‌اکنون در لیست مقایسه وجود دارد');
        return false;
      }
      // Root-category mismatch
      if (items.length > 0 && rootCategoryId !== null && rootCatId !== rootCategoryId) {
        toast.warning('برای مقایسه، محصولات باید از یک دسته‌بندی باشند', {
          description: rootCategoryName
            ? `دسته‌بندی فعلی لیست: ${rootCategoryName}`
            : undefined,
        });
        return false;
      }
      // Max items reached
      if (items.length >= MAX_ITEMS) {
        toast.warning(
          `حداکثر ${new Intl.NumberFormat('fa-IR').format(MAX_ITEMS)} محصول قابل مقایسه است`,
          {
            description: 'برای افزودن محصول جدید، یکی از موارد را حذف کنید.',
          },
        );
        return false;
      }
      // Add
      setItems((prev) => [...prev, product]);
      if (items.length === 0) {
        setRootCategoryId(rootCatId);
        setRootCategoryName(rootCatName || product.category.name || '');
      }
      toast.success('محصول به لیست مقایسه افزوده شد', {
        description: `${new Intl.NumberFormat('fa-IR').format(items.length + 1)} از ${new Intl.NumberFormat('fa-IR').format(MAX_ITEMS)} محصول`,
      });
      return true;
    },
    [items, rootCategoryId, rootCategoryName],
  );

  const removeFromCompare = useCallback((id: number) => {
    setItems((prev) => {
      const next = prev.filter((i) => i.id !== id);
      if (next.length === 0) {
        setRootCategoryId(null);
        setRootCategoryName(null);
      }
      return next;
    });
  }, []);

  const clearCompare = useCallback(() => {
    setItems([]);
    setRootCategoryId(null);
    setRootCategoryName(null);
    toast.success('لیست مقایسه پاک شد');
  }, []);

  const toggleCompare = useCallback(
    (product: CompareProductLike) => {
      if (isInCompare(product.id)) {
        removeFromCompare(product.id);
        return;
      }
      const cp = toCompareProduct(product);
      const root = getRootCategoryId(product.category);
      if (!root) {
        toast.error('امکان افزودن این محصول به مقایسه وجود ندارد');
        return;
      }
      addToCompare(cp, root.id, root.name);
    },
    [isInCompare, removeFromCompare, addToCompare],
  );

  const value = useMemo<CompareContextValue>(
    () => ({
      items,
      rootCategoryId,
      rootCategoryName,
      addToCompare,
      removeFromCompare,
      clearCompare,
      isInCompare,
      toggleCompare,
      count: items.length,
      maxItems: MAX_ITEMS,
    }),
    [
      items,
      rootCategoryId,
      rootCategoryName,
      addToCompare,
      removeFromCompare,
      clearCompare,
      isInCompare,
      toggleCompare,
    ],
  );

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}

// ============================================================
// HOOK
// ============================================================
export function useCompare(): CompareContextValue {
  const ctx = useContext(CompareContext);
  if (!ctx) {
    throw new Error('useCompare must be used within a CompareProvider');
  }
  return ctx;
}
