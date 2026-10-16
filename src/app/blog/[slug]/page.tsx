import { Metadata } from 'next';
import BlogPostClient from './BlogPostClient';
import { db } from '@/lib/db';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const { slug } = resolvedParams;
  const post = await db.blogPost.findUnique({
    where: { slug: slug },
    select: { title: true, excerpt: true, coverImage: true },
  });

  if (!post) return { title: 'مقاله یافت نشد' };

  return {
    title: `${post.title} | مرصادنت`,
    description: post.excerpt || post.title,
    
    openGraph: {
      title: post.title,
      description: post.excerpt || post.title,
      images: post.coverImage ? [{ url: post.coverImage }] : [],
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const { slug } = resolvedParams;
  return <BlogPostClient slug={slug} />;
}
