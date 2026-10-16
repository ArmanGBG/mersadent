import { db } from '@/lib/db';
import { notFound, redirect } from 'next/navigation';
import { Metadata } from 'next';
import ProductDetailClient from './ProductDetailClient';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const rawSlug = resolvedParams.slug;
  const slug = decodeURIComponent(rawSlug);
  const isId = /^\d+$/.test(slug);

  let product;
  if (isId) {
    product = await db.product.findUnique({
      where: { id: parseInt(slug) },
      select: { name: true, metaTitle: true, metaDescription: true, keywords: true, images: { take: 1 } },
    });
  } else {
    product = await db.product.findFirst({
      where: { slug: slug, visible: true },
      select: { name: true, metaTitle: true, metaDescription: true, keywords: true, images: { take: 1 } },
    });
  }

  if (!product) return { title: 'محصول یافت نشد' };

  return {
    title: product.metaTitle || `${product.name} | مرصادنت`,
    description: product.metaDescription || `خرید ${product.name} با بهترین قیمت از مرصادنت`,
    keywords: product.keywords ? product.keywords.split(',') : undefined,
    openGraph: {
      title: product.metaTitle || product.name,
      description: product.metaDescription || `خرید ${product.name} با بهترین قیمت`,
      images: product.images[0] ? [{ url: product.images[0].url }] : [],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const resolvedParams = await params;
  const rawSlug = resolvedParams.slug;
  const slug = decodeURIComponent(rawSlug);
  const isId = /^\d+$/.test(slug);

  let product;
  if (isId) {
    product = await db.product.findUnique({
      where: { id: parseInt(slug) },
      include: {
        brand: true,
        category: { include: { parent: true } },
        images: { orderBy: { order: 'asc' } },
        tags: { include: { tag: true } }
      }
    });
    if (product && product.slug) {
      redirect(`/product/${encodeURIComponent(product.slug)}`);
    }
  } else {
    product = await db.product.findFirst({
      where: { slug: slug, visible: true },
      include: {
        brand: true,
        category: { include: { parent: true } },
        images: { orderBy: { order: 'asc' } },
        tags: { include: { tag: true } }
      }
    });
  }

  if (!product) {
    notFound();
  }

  const related = await db.product.findMany({
    where: { 
      categoryId: product.categoryId, 
      id: { not: product.id },
      visible: true 
    },
    include: { brand: true, images: { take: 1, orderBy: { order: 'asc' } } },
    take: 10,
    orderBy: { createdAt: 'desc' }
  });

  return (
    <ProductDetailClient 
      initialProduct={product as any} 
      relatedProducts={related as any} 
    />
  );
}
