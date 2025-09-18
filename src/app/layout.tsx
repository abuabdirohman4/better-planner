import { Outfit } from 'next/font/google';
import { Toaster } from 'sonner';
import type { Metadata } from 'next';

import './globals.css';

import PreloadProvider from '@/components/common/PreloadProvider';
import PWAComponents from '@/components/PWA';
import SplashScreen from '@/components/PWA/SplashScreen';
import LoadingHandler from '@/components/PWA/LoadingHandler';
import SWRProvider from '@/components/common/SWRProvider';
import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider } from '@/context/ThemeContext';
import PWAHead from './pwa-head';

const outfit = Outfit({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Better Planner",
  description: "A comprehensive project planning and task management app to help you achieve your goals",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Better Planner",
  },
  icons: {
    icon: [
      { url: "/images/logo/logo-icon.svg", sizes: "192x192", type: "image/svg+xml" },
      { url: "/images/logo/logo-icon.svg", sizes: "512x512", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/images/logo/logo-icon.svg", sizes: "192x192", type: "image/svg+xml" },
    ],
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#ffffff",
  colorScheme: "light dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={outfit.className} suppressHydrationWarning>
      <head>
        <PWAHead />
      </head>
      <body>
        {/* Inject global timer for Weekly Sync loading measurement */}
        <script
          dangerouslySetInnerHTML={{
            __html: `if (typeof window !== 'undefined' && window.__WEEKLY_SYNC_START__ === undefined) { window.__WEEKLY_SYNC_START__ = performance.now(); }`,
          }}
        />
        
        {/* PWA Components */}
        <PWAComponents />
        <SplashScreen />
        
        <SWRProvider>
          <PreloadProvider>
            <ThemeProvider>
              <SidebarProvider>
                <LoadingHandler>
                  {children}
                </LoadingHandler>
              </SidebarProvider>
            </ThemeProvider>
            <Toaster
              position="top-right"
              richColors
            />
          </PreloadProvider>
        </SWRProvider>
      </body>
    </html>
  );
}
