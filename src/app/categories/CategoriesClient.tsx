'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Package } from 'lucide-react';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { useAppContext } from '@/contexts/AppContext';
import { useAppNavigation } from '@/hooks/useAppNavigation';
import Link from 'next/link';


import { Home, ChevronLeft, AlertCircle, ShoppingCart } from 'lucide-react';
const getCategoryIcon = (slug: string) => {
  return <Package className="w-5 h-5 text-mersadent-accent" />;
};


const fadeIn = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.3 }
};

export default function CategoriesClient() {
  const { categories } = useAppContext();
  const navigate = useAppNavigation();
  const onNavigate = navigate;


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
                {(cat as any).image ? (
                  <img src={(cat as any).image} alt={cat.name} className="w-7 h-7 sm:w-8 sm:h-8 object-contain" />
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
              {(cat.children || []).map((child) => (
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
