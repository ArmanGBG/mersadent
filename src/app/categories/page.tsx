import { Metadata } from 'next';
import CategoriesClient from './CategoriesClient';

export const metadata: Metadata = {
  title: 'دسته‌بندی محصولات | مرصادنت',
  description: 'مشاهده تمام دسته‌بندی‌های تجهیزات و مواد دندانپزشکی در مرصادنت.',
  alternates: {
    canonical: '/categories'
  }
};

export default function CategoriesPage() {
  return <CategoriesClient />;
}
