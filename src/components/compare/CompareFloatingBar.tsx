'use client';

// ============================================================
// CompareFloatingBar - Sticky bottom bar showing compare items
// MersaDent (مرصادنت) - Persian RTL dental equipment store
// ============================================================
import { motion, AnimatePresence } from 'framer-motion';
import { X, GitCompareArrows, Trash2, Package } from 'lucide-react';
import { useCompare } from './CompareProvider';
import { Button } from '@/components/ui/button';

const faNum = (n: number) => new Intl.NumberFormat('fa-IR').format(n);



import { useAppNavigation } from '@/hooks/useAppNavigation';
export function CompareFloatingBar() {
  const navigate = useAppNavigation();
  const { items, removeFromCompare, clearCompare, count, maxItems } = useCompare();

  return (
    <AnimatePresence>
      {items.length > 0 && (
        <motion.div
          initial={{ y: 140, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 140, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 30 }}
          className="fixed inset-x-0 bottom-0 z-50 px-2 pb-2 sm:px-4 sm:pb-4"
          dir="rtl"
        >
          <div className="mx-auto max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-gray-200/70">
            {/* Top accent line */}
            <div className="h-1 w-full bg-gradient-to-l from-teal-400 via-emerald-400 to-amber-400" />

            <div className="flex items-center gap-2 p-2.5 sm:gap-3 sm:p-3">
              {/* Icon + count */}
              <div className="flex flex-shrink-0 items-center gap-2">
                <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                  <GitCompareArrows className="h-5 w-5" />
                  <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-teal-500 px-1 text-[10px] font-bold text-white shadow">
                    {faNum(count)}
                  </span>
                </div>
                <div className="hidden flex-col leading-tight sm:flex">
                  <span className="text-[11px] text-gray-400">مقایسه محصولات</span>
                  <span className="text-xs font-bold text-mersadent-dark">
                    {faNum(count)} محصول برای مقایسه
                  </span>
                </div>
              </div>

              <div className="hidden h-10 w-px bg-gray-100 sm:block" />

              {/* Items thumbnails (scrollable) */}
              <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto scrollbar-hide">
                <AnimatePresence mode="popLayout" initial={false}>
                  {items.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.6 }}
                      transition={{ duration: 0.18 }}
                      className="group relative flex-shrink-0"
                    >
                      <div className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 p-1.5">
                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-gray-100 to-gray-200">
                          {item.images && item.images.length > 0 ? (
                            <img
                              src={item.images[0].url}
                              alt={item.images[0].alt || item.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Package className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                        <span className="max-w-[90px] truncate text-xs font-medium text-mersadent-dark sm:max-w-[120px]">
                          {item.name}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFromCompare(item.id)}
                        className="absolute -left-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-white text-gray-400 shadow-md ring-1 ring-gray-200 transition-colors hover:bg-red-50 hover:text-red-500"
                        aria-label={`حذف ${item.name} از لیست مقایسه`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Empty slots hint */}
                {count < maxItems && (
                  <div className="hidden flex-shrink-0 items-center gap-1.5 rounded-xl border border-dashed border-gray-200 px-3 py-2 text-[11px] text-gray-400 sm:flex">
                    <span>افزودن محصول دیگر</span>
                    <span className="font-bold text-gray-300">
                      ({faNum(count)}/{faNum(maxItems)})
                    </span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-shrink-0 items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearCompare}
                  className="hidden h-10 gap-1.5 px-3 text-gray-400 hover:bg-red-50 hover:text-red-500 sm:flex"
                  aria-label="پاک کردن لیست مقایسه"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="hidden md:inline">پاک کردن</span>
                </Button>
                <Button
                  onClick={() => navigate({ type: 'compare' })}
                  size="sm"
                  className="h-10 gap-1.5 bg-teal-500 px-4 font-semibold text-white shadow-md hover:bg-teal-600"
                >
                  <GitCompareArrows className="h-4 w-4" />
                  مقایسه کن
                </Button>
              </div>
            </div>

            {/* Mobile-only count text */}
            <div className="flex items-center justify-between px-3 pb-2 sm:hidden">
              <span className="text-[11px] text-gray-400">
                {faNum(count)} محصول برای مقایسه
              </span>
              <button
                type="button"
                onClick={clearCompare}
                className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-red-500"
              >
                <Trash2 className="h-3 w-3" />
                پاک کردن
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
