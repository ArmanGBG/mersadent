import { Metadata } from 'next';
import { db } from '@/lib/db';
import { notFound, redirect } from 'next/navigation';
import CategoryClient from './CategoryClient';

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: { [key: string]: string | string[] | undefined };
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const { slug: rawSlug } = resolvedParams;
  const slug = decodeURIComponent(rawSlug);

  if (slug === 'all') {
    return { title: 'همه دسته‌بندی‌ها | مرصادنت' };
  }
  // Try to find by slug first
  let category = await db.category.findUnique({
    where: { slug: slug },
    select: { name: true, parent: { select: { name: true } } }
  });

  // If not found by slug, maybe it's a numeric ID (old format)?
  if (!category && /^\d+$/.test(slug)) {
    category = await db.category.findUnique({
      where: { id: parseInt(slug) },
      select: { name: true, parent: { select: { name: true } } }
    });
  }

  if (!category) {
    return { title: 'دسته‌بندی پیدا نشد | مرصادنت' };
  }

  const title = `${category.name} ${category.parent ? ' - ' + category.parent.name : ''} | قیمت و خرید تجهیزات دندانپزشکی - مرصادنت`;
  
  return {
    title,
    description: `خرید ${category.name} با بهترین قیمت، تضمین اصالت و گارانتی. مرصادنت تامین‌کننده تخصصی تجهیزات و مواد دندانپزشکی.`,
    alternates: {
      canonical: `/category/${slug}`
    }
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const resolvedParams = await params;
  const { slug: rawSlug2 } = resolvedParams;
  const slug = decodeURIComponent(rawSlug2);

  if (slug === 'all') {
    redirect('/categories');
  }
  let category = await db.category.findUnique({
    where: { slug: slug },
    include: { parent: true }
  });

  if (!category && /^\d+$/.test(slug)) {
    category = await db.category.findUnique({
      where: { id: parseInt(slug) },
      include: { parent: true }
    });
    if (category && category.slug) {
      redirect(`/category/${category.slug}`);
    }
  }

  if (!category) {
    notFound();
  }

  return (
    <CategoryClient 
      initialCategory={{
        ...category,
        categoryId: category.id,
        parentName: category.parent?.name
      }} 
    />
  );
}
