'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Home, Package } from 'lucide-react';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { useAppContext } from '@/contexts/AppContext';
import { useAppNavigation } from '@/hooks/useAppNavigation';

const fadeIn = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 }
};

const staggerContainer = {
  initial: {},
  animate: { transition: { staggerChildren: 0.05 } }
};

const staggerItem = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 }
};

export default function BrandsClient() {
  const { brands } = useAppContext();
  const navigate = useAppNavigation();

  return (
    <motion.div {...fadeIn} className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink onClick={() => navigate({ type: 'home' })} className="cursor-pointer flex items-center gap-1 text-sm">
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
        {brands.map((b: any) => (
          <motion.button
            key={b.id}
            variants={staggerItem}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => navigate({ type: 'brand', brandId: b.id, brandName: b.slug || b.name })}
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
              <span className="text-xs text-gray-400 mt-0.5 block">{b._count?.products || 0} محصول</span>
            </div>
          </motion.button>
        ))}
      </motion.div>
    </motion.div>
  );
}
