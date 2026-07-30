'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Package, ChevronDown, ChevronRight, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import catalogData from '@/lib/catalog-data.json';

interface CatalogItem {
  name: string;
  items: string[];
}

interface CatalogCategory {
  id: number;
  name: string;
  subcategories: CatalogItem[];
}

interface CatalogData {
  categories: CatalogCategory[];
}

const data = catalogData as CatalogData;

function CategoryCard({
  category,
  isExpanded,
  onToggle,
  searchQuery,
}: {
  category: CatalogCategory;
  isExpanded: boolean;
  onToggle: () => void;
  searchQuery: string;
}) {
  const allItems = category.subcategories.flatMap((sub) => sub.items);
  const totalItems = allItems.length;
  const totalSubcategories = category.subcategories.length;

  const filteredSubcategories = useMemo(() => {
    if (!searchQuery) return category.subcategories;
    return category.subcategories
      .map((sub) => ({
        ...sub,
        items: sub.items.filter((item) =>
          item.includes(searchQuery) || sub.name.includes(searchQuery),
        ),
      }))
      .filter((sub) => sub.items.length > 0 || sub.name.includes(searchQuery));
  }, [category.subcategories, searchQuery]);

  return (
    <Card className="overflow-hidden border-gray-200 hover:border-mersadent-accent/40 hover:shadow-lg transition-all duration-300">
      <CardContent className="p-0">
        <button
          onClick={onToggle}
          className="w-full text-right p-4 flex items-center justify-between hover:bg-mersadent-bg/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-mersadent-accent/10 flex items-center justify-center text-mersadent-accent">
              <Package className="w-5 h-5" />
            </div>
            <div className="text-right">
              <h3 className="font-bold text-mersadent-dark text-sm">{category.name}</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {totalSubcategories} زیردسته • {totalItems} آیتم
              </p>
            </div>
          </div>
          <ChevronDown
            className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <Separator />
              <div className="p-4 space-y-4">
                {filteredSubcategories.length > 0 ? (
                  filteredSubcategories.map((sub, idx) => (
                    <div key={idx}>
                      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                        <ChevronRight className="w-3 h-3" />
                        {sub.name}
                      </h4>
                      {sub.items.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 mr-4">
                          {sub.items.map((item, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-50 text-gray-600 hover:bg-mersadent-accent/10 hover:text-mersadent-accent transition-colors"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-300 italic mr-4">بدون آیتم</span>
                      )}
                    </div>
                  ))
                ) : searchQuery ? (
                  <p className="text-sm text-gray-400 text-center py-4">نتیجه‌ای یافت نشد</p>
                ) : null}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

export default function CatalogPage() {
  const [expandedCategory, setExpandedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleCategory = (id: number) => {
    setExpandedCategory((prev) => (prev === id ? null : id));
  };

  const filteredCategories = useMemo(() => {
    if (!searchQuery) return data.categories;
    return data.categories.filter(
      (cat) =>
        cat.name.includes(searchQuery) ||
        cat.subcategories.some(
          (sub) =>
            sub.name.includes(searchQuery) ||
            sub.items.some((item) => item.includes(searchQuery)),
        ),
    );
  }, [searchQuery]);

  const totalItems = useMemo(
    () => data.categories.reduce((sum, cat) => sum + cat.subcategories.reduce((s, sub) => s + sub.items.length, 0), 0),
    [],
  );

  const totalSubcategories = useMemo(
    () => data.categories.reduce((sum, cat) => sum + cat.subcategories.length, 0),
    [],
  );

  return (
    <div className="min-h-screen bg-mersadent-bg">
      {/* Hero Section */}
      <section className="bg-mersadent-dark py-12 sm:py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">
            فهرست دسته‌بندی محصولات
          </h1>
          <p className="text-mersadent-accent/80 text-sm sm:text-base max-w-lg mx-auto">
            تمام دسته‌بندی‌های تجهیزات دندانپزشکی را مرور کنید و محصولات مورد نظر خود را پیدا کنید
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Badge variant="secondary" className="bg-white/10 text-white border-white/20 text-xs">
              {data.categories.length} دسته‌بندی
            </Badge>
            <Badge variant="secondary" className="bg-white/10 text-white border-white/20 text-xs">
              {totalSubcategories} زیردسته
            </Badge>
            <Badge variant="secondary" className="bg-white/10 text-white border-white/20 text-xs">
              {totalItems} آیتم
            </Badge>
          </div>
        </div>
      </section>

      {/* Search Bar */}
      <section className="sticky top-14 z-30 bg-white border-b border-gray-200 py-3 px-4">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="جستجوی دسته‌بندی یا محصول..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-9 pl-4 h-10 text-sm bg-gray-50 border-gray-200 focus:bg-white focus:border-mersadent-accent rounded-xl"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <Badge variant="secondary" className="bg-mersadent-accent/10 text-mersadent-accent border-mersadent-accent/20 text-xs">
            {filteredCategories.length} دسته‌بندی
          </Badge>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="max-w-6xl mx-auto py-6 px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCategories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              isExpanded={expandedCategory === category.id}
              onToggle={() => toggleCategory(category.id)}
              searchQuery={searchQuery}
            />
          ))}
        </div>

        {filteredCategories.length === 0 && (
          <div className="text-center py-16">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-400 text-sm">دسته‌بندی‌ای با این معیار یافت نشد</p>
          </div>
        )}
      </section>
    </div>
  );
}