"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import Image from "next/image";
import {
  shouldShowInstallPrompt,
  readInstallDismissedAt,
  saveInstallDismissedAt,
} from "@/lib/pwaInstallDismiss";
import { reloadIfVersionSkew } from "@/lib/versionSkew";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

// Dicatat sebelum SW didaftarkan: tanpa controller berarti ini instalasi pertama, bukan update.
const hadControllerAtLoad = typeof navigator !== "undefined" && !!navigator.serviceWorker?.controller;

export default function PWAComponents() {
  const pathname = usePathname();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  // File JS versi lama gagal dimuat di luar React (mis. saat pindah halaman setelah deploy) → muat ulang sekali.
  useEffect(() => {
    const onRejection = (e: PromiseRejectionEvent) => reloadIfVersionSkew(e.reason);
    const onError = (e: ErrorEvent) => reloadIfVersionSkew(e.error ?? { message: e.message });
    window.addEventListener("unhandledrejection", onRejection);
    window.addEventListener("error", onError);
    return () => {
      window.removeEventListener("unhandledrejection", onRejection);
      window.removeEventListener("error", onError);
    };
  }, []);

  // Check if we're on the landing page or auth pages
  const isLandingPage = pathname === '/' || pathname.startsWith('/(full-width-pages)');

  const notifyUpdate = () => {
    if (!hadControllerAtLoad) return; // kunjungan pertama: SW baru terpasang, bukan versi baru
    toast('Versi baru tersedia', {
      id: 'sw-update', // id tetap: dua pemicu tidak menumpuk dua toast
      duration: 15000,
      action: { label: 'Muat ulang', onClick: () => window.location.reload() },
    });
  };

  useEffect(() => {
    // Register main PWA Service Worker (handles both PWA and timer functionality)
    if ('serviceWorker' in navigator) {
      // Register custom service worker with integrated timer functionality
      navigator.serviceWorker.register('/sw-custom.js')
        .then((registration) => {
          console.log('🔧 Main Service Worker registered:', registration);
          
          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New service worker is available
                  notifyUpdate();
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('❌ Service Worker registration failed:', error);
        });
    }

    // Install prompt handler
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('🔔 beforeinstallprompt event fired');
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Tampilkan hanya di halaman terautentikasi dan kalau masa tenang 30 hari sudah lewat
      if (!isLandingPage && shouldShowInstallPrompt(readInstallDismissedAt())) {
        setTimeout(() => {
          setShowInstallPrompt(true);
        }, 3000);
      }
    };

    // Offline/Online handlers
    const handleOnline = () => {
      console.log('🌐 App is online');
      setIsOnline(true);
    };

    const handleOffline = () => {
      console.log('📴 App is offline');
      setIsOnline(false);
    };

    // Service worker update handler
    const handleServiceWorkerUpdate = () => {
      console.log('🔄 Service worker update available');
      notifyUpdate();
    };

    // Event listeners
    if (typeof window !== 'undefined') {
      window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
      
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.addEventListener(
          "controllerchange",
          handleServiceWorkerUpdate
        );
      }
    }

    // Web push: page is visible → SW forwards payload here instead of showing OS notification
    const handleSwMessage = (event: MessageEvent) => {
      const { type, data } = event.data || {};
      if (type !== 'PUSH_RECEIVED' || !data) return;
      // Timer completion is already handled locally (sound + UI) when the app is open
      if (data.kind === 'timer') return;
      toast(data.title, { description: data.body });
    };
    const clearBadge = () => {
      if (document.visibilityState === 'visible' && 'clearAppBadge' in navigator) {
        (navigator as Navigator & { clearAppBadge: () => Promise<void> }).clearAppBadge().catch(() => {});
      }
    };
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleSwMessage);
    }
    document.addEventListener('visibilitychange', clearBadge);
    clearBadge();

    // Check if already installed
    const checkIfInstalled = () => {
      if (typeof window !== 'undefined') {
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
        const isIOSStandalone = (window.navigator as any).standalone;
        
        if (isStandalone || isIOSStandalone) {
          console.log('📱 App is already installed');
          setShowInstallPrompt(false);
        }
      }
    };

    checkIfInstalled();

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
        
        document.removeEventListener('visibilitychange', clearBadge);
        if ("serviceWorker" in navigator) {
          navigator.serviceWorker.removeEventListener('message', handleSwMessage);
          navigator.serviceWorker.removeEventListener(
            "controllerchange",
            handleServiceWorkerUpdate
          );
        }
      }
    };
  }, []);

  const handleInstallClick = async () => {
    console.log('🔔 Install button clicked!');
    
    if (!deferredPrompt) {
      console.log('❌ No deferred prompt available');
      
      // Check if already installed
      if (typeof window !== 'undefined') {
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
        const isIOSStandalone = (window.navigator as any).standalone;
        
        if (isStandalone || isIOSStandalone) {
          toast.info("App is already installed!");
          setShowInstallPrompt(false);
          return;
        }
      }
      
      // Provide manual install instructions for mobile
      if (typeof window !== 'undefined' && navigator) {
        const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (isMobile) {
          toast.info("Tap the share button in your browser and select 'Add to Home Screen'");
          setShowInstallPrompt(false);
          return;
        }
      }
      
      toast.error("Install prompt not available. Please try refreshing the page.");
      return;
    }

    try {
      console.log('🔔 Calling deferredPrompt.prompt()...');
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      console.log('🔔 User choice:', outcome);
      
      if (outcome === "accepted") {
        toast.success("Better Planner installed successfully!");
      } else {
        toast.info("Installation cancelled");
        saveInstallDismissedAt(); // Cancel = diam 30 hari
      }
      
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    } catch (error) {
      console.error("❌ Error during installation:", error);
      toast.error("Failed to install app: " + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleInstallDismiss = () => {
    setShowInstallPrompt(false);
    saveInstallDismissedAt();
  };

  return (
    <>
      {/* Offline Indicator */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 bg-red-500 text-white text-center py-2 px-4 z-50">
          📴 You are currently offline
        </div>
      )}

      {/* Install Prompt - Only show on authenticated pages */}
      {showInstallPrompt && !isLandingPage && (
        <div className="fixed top-20 md:top-4 left-1/2 transform -translate-x-1/2 max-w-sm w-[calc(100%-2rem)] mx-auto bg-white rounded-xl shadow-2xl border border-gray-200 p-4 z-99">
          <div className="flex items-center space-x-4 mb-4">
            <Image
              src="/images/logo/icon-192.png"
              alt="Logo"
              width={48}
              height={48}
              className="h-12 w-12 shrink-0 rounded-xl"
              priority
            />
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Install Better Planner</h3>
              <p className="text-xs text-gray-500">Add to home screen for quick access</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={handleInstallClick} 
              className="flex-1 bg-brand-500 text-white text-sm font-medium py-2.5 px-4 rounded-lg hover:bg-brand-600 transition-colors"
            >
              Install
            </button>
            <button 
              onClick={handleInstallDismiss} 
              className="flex-1 bg-gray-100 text-gray-700 text-sm font-medium py-2.5 px-4 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Not now
            </button>
          </div>
        </div>
      )}
    </>
  );
}

