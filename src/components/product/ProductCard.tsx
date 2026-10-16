'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Package, Star, GitCompareArrows, ShoppingCart, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export const formatPrice = (price: number | null) => {
  if (price === null) return 'استعلام قیمت';
  return new Intl.NumberFormat('fa-IR').format(price) + ' تومان';
};

export const availabilityLabel = (status: string) => {
  switch (status) {
    case 'in_stock':
      return { text: 'موجود', variant: 'default' as const, color: 'bg-emerald-100 text-emerald-700' };
    case 'out_of_stock':
      return { text: 'ناموجود', variant: 'secondary' as const, color: 'bg-red-100 text-red-600' };
    case 'low_stock':
      return { text: 'موجودی محدود', variant: 'outline' as const, color: 'bg-amber-100 text-amber-700' };
    case 'coming_soon':
      return { text: 'به زودی', variant: 'outline' as const, color: 'bg-blue-100 text-blue-700' };
    case 'call':
      return { text: 'تماس بگیرید', variant: 'outline' as const, color: 'bg-amber-100 text-amber-700' };
    default:
      return { text: 'نامشخص', variant: 'secondary' as const, color: 'bg-gray-100 text-gray-600' };
  }
};

export function ProductCard({
  product,
  onClick,
  user,
  onAuthRequired,
  onAddToCart,
  onToggleCompare,
  isInCompare = false,
}: {
  product: any;
  onClick?: () => void;
  user?: any;
  onAuthRequired?: () => void;
  onAddToCart?: (productId: number) => void;
  onToggleCompare?: () => void;
  isInCompare?: boolean;
}) {
  const av = availabilityLabel(product.availability);
  const hasDiscount = product.discountPercent > 0 && product.price !== null && product.priceType !== 'call';
  const discountedPrice = hasDiscount ? Math.round(product.price! * (1 - product.discountPercent / 100)) : null;
  const canAdd = product.availability === 'in_stock' && product.price !== null && product.priceType !== 'call' && !!onAddToCart;
  const [adding, setAdding] = useState(false);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      if (onAuthRequired) onAuthRequired();
      return;
    }
    if (adding || !onAddToCart) return;
    setAdding(true);
    await onAddToCart(product.id);
    setAdding(false);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault();
      onClick();
    }
  };

  const cardInner = (
    <Card
      className="cursor-pointer group h-full border border-gray-100 hover:border-mersadent-accent/40 hover:shadow-lg transition-all duration-300 overflow-hidden"
      onClick={handleCardClick}
    >
      <CardContent className="p-3 flex flex-col gap-2">
        {/* Image or placeholder */}
        <div className="relative w-full aspect-square bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg flex items-center justify-center group-hover:from-mersadent-accent/5 group-hover:to-mersadent-accent/10 transition-colors overflow-hidden">
          {product.images && product.images.length > 0 ? (
            <img
              src={product.images[0].url}
              alt={product.images[0].alt || product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <Package className="w-10 h-10 text-gray-300 group-hover:text-mersadent-accent/50 transition-colors" />
          )}
          {/* Top badges: featured + discount */}
          <div className="absolute top-1.5 left-1.5 flex flex-col gap-1">
            {hasDiscount && (
              <Badge className="bg-red-500 text-white text-[9px] px-1.5 py-0">
                تخفیف {product.discountPercent}%
              </Badge>
            )}
            {product.featured && (
              <Badge className="bg-amber-500 text-white text-[9px] px-1 py-0">
                <Star className="w-2.5 h-2.5 ml-0.5" />
                ویژه
              </Badge>
            )}
          </div>
          {/* Compare toggle button */}
          {onToggleCompare && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleCompare();
              }}
              className={`absolute bottom-1.5 left-1.5 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 z-10 ${
                isInCompare
                  ? 'bg-teal-500 text-white shadow-md opacity-100'
                  : 'bg-white/90 text-gray-400 hover:text-teal-500 hover:bg-white shadow-sm opacity-80 group-hover:opacity-100'
              }`}
              title={isInCompare ? 'حذف از لیست مقایسه' : 'افزودن به لیست مقایسه'}
              aria-label={isInCompare ? 'حذف از مقایسه' : 'افزودن به مقایسه'}
              aria-pressed={isInCompare}
            >
              <GitCompareArrows className="w-3.5 h-3.5" />
            </button>
          )}
          {/* Add to cart button */}
          {canAdd && (
            <button
              onClick={handleAddToCart}
              disabled={adding}
              className="absolute bottom-1.5 left-9 w-7 h-7 bg-white/90 hover:bg-mersadent-accent text-mersadent-dark hover:text-white rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-all duration-200 disabled:opacity-60"
              title="افزودن به سبد خرید"
              aria-label="افزودن به سبد خرید"
            >
              {adding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShoppingCart className="w-3.5 h-3.5" />}
            </button>
          )}
          {product.availability === 'out_of_stock' && (
            <div className="absolute inset-0 bg-white/70 rounded-lg flex items-center justify-center">
              <Badge variant="secondary" className="text-red-500 text-xs">
                ناموجود
              </Badge>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 flex flex-col gap-1 min-h-0">
          <span className="text-[10px] text-gray-400 font-medium">{product.brand?.name}</span>
          <h3 className="text-xs font-semibold text-mersadent-dark leading-5 line-clamp-2">
            {product.name}
          </h3>
        </div>

        {/* Price & availability */}
        <div className="flex flex-col gap-1 pt-1.5 border-t border-gray-100">
          {product.priceType === 'call' || product.price === null ? (
            <Badge className="w-fit bg-mersadent-accent/10 text-mersadent-accent border-mersadent-accent/20 text-xs font-medium">
              تماس بگیرید
            </Badge>
          ) : hasDiscount && discountedPrice !== null ? (
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] text-gray-400 line-through">
                {formatPrice(product.price)}
              </span>
              <span className="text-sm font-bold text-red-600">
                {formatPrice(discountedPrice)}
              </span>
            </div>
          ) : (
            <span className="text-sm font-bold text-mersadent-dark">
              {formatPrice(product.price)}
            </span>
          )}
          <span className={`text-[11px] px-2 py-0.5 rounded-full w-fit ${av.color}`}>
            {av.text}
          </span>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <motion.div whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
      {onClick ? (
        cardInner
      ) : (
        <Link href={`/product/${product.slug || product.id}`} className="block h-full">
          {cardInner}
        </Link>
      )}
    </motion.div>
  );
}
