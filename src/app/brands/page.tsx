import { Metadata } from 'next';
import BrandsClient from './BrandsClient';

export const metadata: Metadata = {
  title: 'برندهای تجهیزات دندانپزشکی | مرصادنت',
  description: 'مشاهده و خرید تمامی برندهای معتبر تجهیزات دندانپزشکی در مرصادنت.',
};

export default function BrandsPage() {
  return <BrandsClient />;
}
