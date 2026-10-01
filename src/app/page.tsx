import type { Metadata } from 'next';
import LandingPage from '@/components/landing/LandingPage';
import { copy } from '@/components/landing/copy.id';

export const metadata: Metadata = {
  metadataBase: new URL('https://planner.abuabdirohman.com'),
  title: copy.meta.title,
  description: copy.meta.description,
  keywords: copy.meta.keywords,
  openGraph: {
    title: copy.meta.title,
    description: copy.meta.description,
    type: 'website',
    locale: 'id_ID',
    images: '/images/landing/og.jpg',
  },
  twitter: { card: 'summary_large_image', title: copy.meta.title, description: copy.meta.description },
};

export default function Page() {
  return <LandingPage />;
}
