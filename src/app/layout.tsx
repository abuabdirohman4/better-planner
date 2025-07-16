import { Outfit } from 'next/font/google';
import { Toaster } from 'sonner';
import { SWRConfig } from 'swr';

import './globals.css';

import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { swrConfig } from '@/lib/swr';

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
        <SWRConfig value={swrConfig}>
          <ThemeProvider>
            <SidebarProvider>{children}</SidebarProvider>
          </ThemeProvider>
          <Toaster 
            position="top-right"
            richColors
          />
        </SWRConfig>
      </body>
    </html>
  );
}
