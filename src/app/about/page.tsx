import { Metadata } from 'next';
import AboutClient from './AboutClient';

export const metadata: Metadata = {
  title: 'درباره ما | مرصادنت',
  description: 'آشنایی با فروشگاه مرصادنت، تأمین‌کننده تجهیزات دندانپزشکی در ایران.',
};

export default function AboutPage() {
  return <AboutClient />;
}
