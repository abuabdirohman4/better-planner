import { Outfit } from 'next/font/google';
import './globals.css';

import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { LoadingProvider } from '@/components/ui/spinner/LoadingProvider';
import { PageLoader } from '@/components/ui/spinner/PageLoader';
import { PagePreloader } from '@/components/common/PagePreloader';
import { Toaster } from 'sonner';

const outfit = Outfit({
  subsets: ["latin"],
  display: 'swap',
  preload: true,
});

export const metadata = {
  title: 'Better Planner',
  description: 'A comprehensive planning and productivity application',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={outfit.className} suppressHydrationWarning>
      <head>
        {/* Preload critical resources */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* DNS prefetch for external domains */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />
      </head>
      <body>
        <LoadingProvider>
          <ThemeProvider>
            <SidebarProvider>
              <PagePreloader />
              <PageLoader />
              {children}
            </SidebarProvider>
          </ThemeProvider>
        </LoadingProvider>
        <Toaster 
          position="top-right"
          richColors
        />
      </body>
    </html>
  );
}
