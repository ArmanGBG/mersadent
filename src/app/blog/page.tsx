import { Metadata } from 'next';
import BlogClient from './BlogClient';

export const metadata: Metadata = {
  title: 'وبلاگ و مقالات آموزشی | مرصادنت',
  description: 'آخرین مقالات آموزشی و اخبار تجهیزات دندانپزشکی در مرصادنت.',
};

export default function BlogPage() {
  return <BlogClient />;
}
