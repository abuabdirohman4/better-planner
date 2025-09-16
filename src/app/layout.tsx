import { Outfit } from 'next/font/google';
import { Toaster } from 'sonner';

import './globals.css';

import PreloadProvider from '@/components/common/PreloadProvider';
import SWRProvider from '@/components/common/SWRProvider';
import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider } from '@/context/ThemeContext';

const outfit = Outfit({
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={outfit.className} suppressHydrationWarning>
      <body>
        {/* Inject global timer for Weekly Sync loading measurement */}
        <script
          dangerouslySetInnerHTML={{
            __html: `if (typeof window !== 'undefined' && window.__WEEKLY_SYNC_START__ === undefined) { window.__WEEKLY_SYNC_START__ = performance.now(); }`,
          }}
        />
               <SWRProvider>
                 <PreloadProvider>
                   <ThemeProvider>
                     <SidebarProvider>{children}</SidebarProvider>
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
