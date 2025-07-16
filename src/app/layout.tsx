import { Outfit } from 'next/font/google';
import { Toaster } from 'sonner';

import './globals.css';

import PreloadProvider from '@/components/common/PreloadProvider';
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
        <PreloadProvider>
          <ThemeProvider>
            <SidebarProvider>{children}</SidebarProvider>
          </ThemeProvider>
          <Toaster 
            position="top-right"
            richColors
          />
        </PreloadProvider>
      </body>
    </html>
  );
}
