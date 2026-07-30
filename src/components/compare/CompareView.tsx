'use client';

// ============================================================
// CompareView - Main product comparison table
// MersaDent (مرصادنت) - Persian RTL dental equipment store
// ============================================================
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  GitCompareArrows,
  Trash2,
  X,
  Package,
  CheckCircle2,
  Minus,
  Tag,
  Star,
  AlertTriangle,
  ShoppingCart,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCompare } from './CompareProvider';
import { cn } from '@/lib/utils';

// ============================================================
// HELPERS
// ============================================================
const faNum = (n: number) => new Intl.NumberFormat('fa-IR').format(n);

const formatPrice = (price: number | null): string => {
  if (price === null) return 'استعلام قیمت';
  return new Intl.NumberFormat('fa-IR').format(price) + ' تومان';
};

const availabilityInfo = (status: string) => {
  switch (status) {
    case 'in_stock':
      return { text: 'موجود', color: 'text-emerald-700', bg: 'bg-emerald-100', dot: 'bg-emerald-500' };
    case 'out_of_stock':
      return { text: 'ناموجود', color: 'text-red-600', bg: 'bg-red-100', dot: 'bg-red-500' };
    case 'call':
      return { text: 'تماس بگیرید', color: 'text-amber-700', bg: 'bg-amber-100', dot: 'bg-amber-500' };
    default:
      return { text: 'نامشخص', color: 'text-gray-500', bg: 'bg-gray-100', dot: 'bg-gray-400' };
  }
};

// ============================================================
// COLUMN COLORS (NO blue / indigo)
// ============================================================
interface ColumnColor {
  name: string;
  cell: string;       // light cell bg
  cellStrong: string; // stronger cell bg (for header)
  text: string;       // value text color
  textOnAccent: string;
  border: string;     // subtle border
  accent: string;     // solid accent bg
  accentSoft: string; // soft accent bg
  ring: string;       // ring color
  dot: string;        // bullet dot bg
  hex: string;
}

const COLUMN_COLORS: ColumnColor[] = [
  {
    name: 'teal',
    cell: 'bg-teal-50/50',
    cellStrong: 'bg-teal-50',
    text: 'text-teal-700',
    textOnAccent: 'text-teal-700',
    border: 'border-teal-200',
    accent: 'bg-teal-500',
    accentSoft: 'bg-teal-100',
    ring: 'ring-teal-300',
    dot: 'bg-teal-500',
    hex: '#2FC4C9',
  },
  {
    name: 'emerald',
    cell: 'bg-emerald-50/50',
    cellStrong: 'bg-emerald-50',
    text: 'text-emerald-700',
    textOnAccent: 'text-emerald-700',
    border: 'border-emerald-200',
    accent: 'bg-emerald-500',
    accentSoft: 'bg-emerald-100',
    ring: 'ring-emerald-300',
    dot: 'bg-emerald-500',
    hex: '#10B981',
  },
  {
    name: 'amber',
    cell: 'bg-amber-50/50',
    cellStrong: 'bg-amber-50',
    text: 'text-amber-700',
    textOnAccent: 'text-amber-700',
    border: 'border-amber-200',
    accent: 'bg-amber-500',
    accentSoft: 'bg-amber-100',
    ring: 'ring-amber-300',
    dot: 'bg-amber-500',
    hex: '#F59E0B',
  },
  {
    name: 'rose',
    cell: 'bg-rose-50/50',
    cellStrong: 'bg-rose-50',
    text: 'text-rose-700',
    textOnAccent: 'text-rose-700',
    border: 'border-rose-200',
    accent: 'bg-rose-500',
    accentSoft: 'bg-rose-100',
    ring: 'ring-rose-300',
    dot: 'bg-rose-500',
    hex: '#F43F5E',
  },
];

// ============================================================
// SUB-COMPONENTS
// ============================================================

/** Sticky label cell (rightmost column in RTL). */
function LabelCell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'sticky right-0 z-20 flex items-center bg-gray-50 p-3 text-xs font-bold text-mersadent-dark',
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Full-width section divider row. */
function SectionHeader({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="col-span-full z-10 flex items-center gap-2 bg-mersadent-accent/10 border-y border-mersadent-accent/20 px-3 py-2.5 text-xs font-bold text-mersadent-dark sm:text-sm">
      {icon && <span className="text-mersadent-accent">{icon}</span>}
      {children}
    </div>
  );
}

/** Empty-value placeholder dash. */
function EmptyDash() {
  return <span className="text-gray-300">—</span>;
}

/** Wrapper for a value cell with column coloring. */
function ValueCell({
  index,
  children,
  className,
  strong,
}: {
  index: number;
  children: React.ReactNode;
  className?: string;
  strong?: boolean;
}) {
  const c = COLUMN_COLORS[index];
  return (
    <div
      className={cn(
        'p-3 text-sm transition-colors',
        strong ? c.cellStrong : c.cell,
        className,
      )}
    >
      {children}
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================
interface CompareViewProps {
  onBack: () => void;
  onNavigateToProduct?: (productId: number) => void;
}

export function CompareView({ onBack, onNavigateToProduct }: CompareViewProps) {
  const { items, removeFromCompare, clearCompare, rootCategoryName, maxItems } = useCompare();

  // Collect the union of all spec keys across products
  const allSpecKeys = useMemo(() => {
    const keys = new Set<string>();
    items.forEach((item) => Object.keys(item.specs).forEach((k) => keys.add(k)));
    return Array.from(keys);
  }, [items]);

  // ---------- EMPTY STATE ----------
  if (items.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6"
        dir="rtl"
      >
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-teal-50">
          <GitCompareArrows className="h-12 w-12 text-teal-400" />
        </div>
        <h1 className="mb-2 text-xl font-bold text-mersadent-dark sm:text-2xl">
          لیست مقایسه خالی است
        </h1>
        <p className="mb-6 text-sm text-gray-400">
          برای مقایسه محصولات، آن‌ها را با استفاده از دکمه مقایسه روی هر محصول به این لیست اضافه کنید.
        </p>
        <Button
          onClick={onBack}
          className="gap-1.5 bg-teal-500 text-white hover:bg-teal-600"
        >
          <ArrowRight className="h-4 w-4" />
          بازگشت به فروشگاه
        </Button>
      </motion.div>
    );
  }

  const n = items.length;
  const gridTemplateColumns = `minmax(120px, 150px) repeat(${n}, minmax(190px, 1fr))`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25 }}
      className="mx-auto max-w-7xl px-3 pb-24 sm:px-6"
      dir="rtl"
    >
      {/* ===== HEADER ===== */}
      <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={onBack}
            className="gap-1.5 px-2 text-sm text-gray-500 hover:text-mersadent-dark"
          >
            <ArrowRight className="h-4 w-4" />
            بازگشت
          </Button>
          <div className="h-6 w-px bg-gray-200" />
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
              <GitCompareArrows className="h-5 w-5" />
            </div>
            <div className="flex flex-col leading-tight">
              <h1 className="text-lg font-extrabold text-mersadent-dark sm:text-xl">
                مقایسه محصولات
              </h1>
              <span className="text-[11px] text-gray-400">
                {faNum(n)} محصول
                {rootCategoryName ? ` • ${rootCategoryName}` : ''}
              </span>
            </div>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={clearCompare}
          className="gap-1.5 self-start text-gray-400 hover:bg-red-50 hover:text-red-500 sm:self-auto"
        >
          <Trash2 className="h-4 w-4" />
          پاک کردن لیست
        </Button>
      </div>

      {/* ===== MIN-2 HINT ===== */}
      {n === 1 && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>برای مقایسه، حداقل یک محصول دیگر از همان دسته‌بندی اضافه کنید.</span>
        </div>
      )}

      {/* ===== COMPARISON GRID ===== */}
      <div className="overflow-x-auto rounded-2xl ring-1 ring-gray-200 scrollbar-hide -mx-3 px-3 sm:mx-0 sm:px-0">
        <div
          className="grid min-w-[760px] gap-px overflow-hidden rounded-2xl bg-gray-200/70"
          style={{ gridTemplateColumns }}
        >
          {/* ---------- HEADER ROW ---------- */}
          <LabelCell className="bg-gray-100 text-gray-400">محصول</LabelCell>
          {items.map((item, i) => {
            const c = COLUMN_COLORS[i];
            const isRef = i === 0;
            return (
              <div
                key={item.id}
                className={cn(
                  'relative flex flex-col gap-2 p-3',
                  c.cellStrong,
                  isRef && 'ring-2 ring-inset ring-teal-300',
                )}
              >
                {/* Colored top border (4px) */}
                <div className={cn('absolute inset-x-0 top-0 h-1', c.accent)} />

                {/* Reference badge */}
                {isRef && (
                  <div className="absolute left-2 top-2 z-10">
                    <Badge className="bg-teal-500 px-1.5 py-0 text-[9px] text-white">
                      <Star className="ml-0.5 h-2.5 w-2.5" />
                      مرجع
                    </Badge>
                  </div>
                )}

                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => removeFromCompare(item.id)}
                  className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-white/80 text-gray-400 shadow-sm transition-colors hover:bg-red-50 hover:text-red-500"
                  aria-label={`حذف ${item.name} از مقایسه`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>

                {/* Image */}
                <button
                  type="button"
                  onClick={() => onNavigateToProduct?.(item.id)}
                  className="mx-auto mt-3 flex aspect-square w-full max-w-[140px] items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm"
                >
                  {item.images && item.images.length > 0 ? (
                    <img
                      src={item.images[0].url}
                      alt={item.images[0].alt || item.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Package className="h-10 w-10 text-gray-300" />
                  )}
                </button>

                {/* Brand */}
                <span className={cn('text-center text-[11px] font-medium', c.text)}>
                  {item.brand.name || '—'}
                </span>

                {/* Name */}
                <button
                  type="button"
                  onClick={() => onNavigateToProduct?.(item.id)}
                  className="line-clamp-2 text-center text-xs font-bold leading-5 text-mersadent-dark hover:text-mersadent-accent"
                >
                  {item.name}
                </button>

                {/* Quick add-to-cart hint */}
                {item.availability === 'in_stock' && item.price !== null && item.priceType !== 'call' && (
                  <div className={cn('mx-auto mt-1 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium', c.accentSoft, c.text)}>
                    <ShoppingCart className="h-3 w-3" />
                    قابل خرید
                  </div>
                )}
              </div>
            );
          })}

          {/* ---------- SECTION: اطلاعات پایه ---------- */}
          <SectionHeader icon={<Tag className="h-3.5 w-3.5" />}>اطلاعات پایه</SectionHeader>

          {/* Price */}
          <LabelCell>قیمت</LabelCell>
          {items.map((item, i) => {
            const c = COLUMN_COLORS[i];
            const hasDiscount = item.discountPercent > 0 && item.price !== null && item.priceType !== 'call';
            const discounted = hasDiscount
              ? Math.round(item.price! * (1 - item.discountPercent / 100))
              : null;
            return (
              <ValueCell key={item.id} index={i}>
                {item.priceType === 'call' || item.price === null ? (
                  <span className={cn('text-xs font-semibold', c.text)}>تماس بگیرید</span>
                ) : hasDiscount && discounted !== null ? (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[11px] text-gray-400 line-through">
                      {formatPrice(item.price)}
                    </span>
                    <span className={cn('text-sm font-extrabold', c.text)}>
                      {formatPrice(discounted)}
                    </span>
                  </div>
                ) : (
                  <span className={cn('text-sm font-extrabold', c.text)}>
                    {formatPrice(item.price)}
                  </span>
                )}
              </ValueCell>
            );
          })}

          {/* Availability */}
          <LabelCell>وضعیت</LabelCell>
          {items.map((item, i) => {
            const av = availabilityInfo(item.availability);
            return (
              <ValueCell key={item.id} index={i}>
                <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium', av.bg, av.color)}>
                  <span className={cn('h-1.5 w-1.5 rounded-full', av.dot)} />
                  {av.text}
                </span>
              </ValueCell>
            );
          })}

          {/* Discount */}
          <LabelCell>تخفیف</LabelCell>
          {items.map((item, i) => {
            const c = COLUMN_COLORS[i];
            const hasDiscount = item.discountPercent > 0 && item.price !== null && item.priceType !== 'call';
            return (
              <ValueCell key={item.id} index={i}>
                {hasDiscount ? (
                  <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold', c.accentSoft, c.text)}>
                    {faNum(item.discountPercent)}٪ تخفیف
                  </span>
                ) : (
                  <EmptyDash />
                )}
              </ValueCell>
            );
          })}

          {/* ---------- SECTION: جزئیات محصول ---------- */}
          <SectionHeader icon={<Package className="h-3.5 w-3.5" />}>جزئیات محصول</SectionHeader>

          {/* Country */}
          <LabelCell>کشور سازنده</LabelCell>
          {items.map((item, i) => (
            <ValueCell key={item.id} index={i}>
              {item.country ? (
                <span className={cn('font-medium', COLUMN_COLORS[i].text)}>{item.country}</span>
              ) : (
                <EmptyDash />
              )}
            </ValueCell>
          ))}

          {/* Warranty */}
          <LabelCell>گارانتی</LabelCell>
          {items.map((item, i) => (
            <ValueCell key={item.id} index={i}>
              {item.warranty ? (
                <span className={cn('font-medium', COLUMN_COLORS[i].text)}>{item.warranty}</span>
              ) : (
                <EmptyDash />
              )}
            </ValueCell>
          ))}

          {/* Weight */}
          <LabelCell>وزن</LabelCell>
          {items.map((item, i) => (
            <ValueCell key={item.id} index={i}>
              {item.weight ? (
                <span className={cn('font-medium', COLUMN_COLORS[i].text)}>{item.weight}</span>
              ) : (
                <EmptyDash />
              )}
            </ValueCell>
          ))}

          {/* SKU */}
          <LabelCell>کد محصول (SKU)</LabelCell>
          {items.map((item, i) => (
            <ValueCell key={item.id} index={i}>
              {item.sku ? (
                <span className={cn('font-mono text-xs ltr:text-left', COLUMN_COLORS[i].text)} dir="ltr">
                  {item.sku}
                </span>
              ) : (
                <EmptyDash />
              )}
            </ValueCell>
          ))}

          {/* Model */}
          <LabelCell>مدل</LabelCell>
          {items.map((item, i) => (
            <ValueCell key={item.id} index={i}>
              {item.model ? (
                <span className={cn('font-medium', COLUMN_COLORS[i].text)} dir="ltr">
                  {item.model}
                </span>
              ) : (
                <EmptyDash />
              )}
            </ValueCell>
          ))}

          {/* ---------- SECTION: مشخصات فنی ---------- */}
          {allSpecKeys.length > 0 && (
            <>
              <SectionHeader icon={<CheckCircle2 className="h-3.5 w-3.5" />}>
                مشخصات فنی
              </SectionHeader>
              {allSpecKeys.map((key) => (
                <React.Fragment key={key}>
                  <LabelCell>{key}</LabelCell>
                  {items.map((item, i) => {
                    const val = item.specs[key];
                    return (
                      <ValueCell key={item.id} index={i}>
                        {val ? (
                          <span className={cn('font-medium', COLUMN_COLORS[i].text)}>{val}</span>
                        ) : (
                          <EmptyDash />
                        )}
                      </ValueCell>
                    );
                  })}
                </React.Fragment>
              ))}
            </>
          )}

          {/* ---------- SECTION: نقاط قوت ---------- */}
          <SectionHeader icon={<Star className="h-3.5 w-3.5" />}>نقاط قوت</SectionHeader>
          <LabelCell>نقاط قوت</LabelCell>
          {items.map((item, i) => {
            const c = COLUMN_COLORS[i];
            return (
              <ValueCell key={item.id} index={i}>
                {item.strengths.length > 0 ? (
                  <ul className="flex flex-col gap-1.5">
                    {item.strengths.map((s, idx) => (
                      <li key={idx} className="flex items-start gap-1.5 text-xs">
                        <CheckCircle2 className={cn('mt-0.5 h-3.5 w-3.5 flex-shrink-0', c.text)} />
                        <span className="text-mersadent-dark">{s}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyDash />
                )}
              </ValueCell>
            );
          })}

          {/* ---------- SECTION: نقاط ضعف ---------- */}
          <SectionHeader icon={<AlertTriangle className="h-3.5 w-3.5" />}>نقاط ضعف</SectionHeader>
          <LabelCell>نقاط ضعف</LabelCell>
          {items.map((item, i) => (
            <ValueCell key={item.id} index={i}>
              {item.weaknesses.length > 0 ? (
                <ul className="flex flex-col gap-1.5">
                  {item.weaknesses.map((w, idx) => (
                    <li key={idx} className="flex items-start gap-1.5 text-xs">
                      <Minus className={cn('mt-0.5 h-3.5 w-3.5 flex-shrink-0', COLUMN_COLORS[i].text)} />
                      <span className="text-gray-600">{w}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyDash />
              )}
            </ValueCell>
          ))}

          {/* ---------- FOOTER ACTION ROW ---------- */}
          <LabelCell className="bg-gray-100">عملیات</LabelCell>
          {items.map((item, i) => (
            <ValueCell key={item.id} index={i} strong>
              <div className="flex flex-col gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onNavigateToProduct?.(item.id)}
                  className={cn('w-full gap-1.5 text-xs', COLUMN_COLORS[i].border, COLUMN_COLORS[i].text, 'hover:bg-white')}
                >
                  مشاهده محصول
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeFromCompare(item.id)}
                  className="w-full gap-1.5 text-xs text-gray-400 hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  حذف از مقایسه
                </Button>
              </div>
            </ValueCell>
          ))}
        </div>
      </div>

      {/* ===== HELPER NOTE ===== */}
      <p className="mt-4 flex items-center gap-1.5 text-[11px] text-gray-400">
        <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />
        محصول اول به عنوان مرجع در نظر گرفته شده است. حداکثر {faNum(maxItems)} محصول قابل مقایسه است.
      </p>
    </motion.div>
  );
}
