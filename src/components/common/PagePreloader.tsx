"use client";
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

// List of critical pages to preload
const CRITICAL_PAGES = [
  '/dashboard',
  '/planning/vision',
  '/planning/main-quests',
  '/planning/12-week-quests',
  '/execution/daily-sync',
  '/execution/weekly-sync',
];

export const PagePreloader: React.FC = () => {
  const pathname = usePathname();

  useEffect(() => {
    // Preload critical pages when user is on main pages
    if (pathname === '/dashboard' || pathname.startsWith('/planning') || pathname.startsWith('/execution')) {
      CRITICAL_PAGES.forEach(page => {
        if (page !== pathname) {
          // Prefetch the page
          const link = document.createElement('link');
          link.rel = 'prefetch';
          link.href = page;
          document.head.appendChild(link);
        }
      });
    }
  }, [pathname]);

  return null;
}; 