"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { pwaConfig } from "@/lib/pwa-config";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PWAComponents() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);

  useEffect(() => {
    // Install prompt handler
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('🔔 Install prompt event triggered!');
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show install prompt after user engagement
      setTimeout(() => {
        console.log('🔔 Showing install prompt...');
        setShowInstallPrompt(true);
      }, pwaConfig.installPrompt.delay);
    };

    // Offline/Online handlers
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("You're back online!");
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      toast.warning("You're currently offline. Some features may be limited.");
    };

    // Service worker update handler
    const handleServiceWorkerUpdate = () => {
      setShowUpdatePrompt(true);
    };

    // Event listeners
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener(
        "controllerchange",
        handleServiceWorkerUpdate
      );
    }

    // Check initial online status
    setIsOnline(navigator.onLine);

    // Fallback: Show install prompt if beforeinstallprompt doesn't fire
    const fallbackTimer = setTimeout(() => {
      if (!deferredPrompt && !showInstallPrompt) {
        console.log('🔔 Fallback: Showing install prompt...');
        setShowInstallPrompt(true);
      }
    }, pwaConfig.installPrompt.fallbackDelay);

    return () => {
      clearTimeout(fallbackTimer);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.removeEventListener(
          "controllerchange",
          handleServiceWorkerUpdate
        );
      }
    };
  }, [deferredPrompt, showInstallPrompt]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === "accepted") {
        toast.success("Better Planner installed successfully!");
      } else {
        toast.info("Installation cancelled");
      }
      
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    } catch (error) {
      console.error("Error during installation:", error);
      toast.error("Failed to install app");
    }
  };

  const handleInstallDismiss = () => {
    setShowInstallPrompt(false);
    // Don't show again for this session
    sessionStorage.setItem("pwa-install-dismissed", "true");
  };

  const handleUpdateClick = () => {
    window.location.reload();
  };

  const handleUpdateDismiss = () => {
    setShowUpdatePrompt(false);
  };

  // Don't show install prompt if dismissed in this session
  useEffect(() => {
    if (sessionStorage.getItem("pwa-install-dismissed")) {
      setShowInstallPrompt(false);
    }
  }, []);

  return (
    <>
      {/* Offline Indicator */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 bg-red-500 text-white text-center py-2 px-4 z-50 flex items-center justify-center">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          You are currently offline
        </div>
      )}

      {/* Update Available */}
      {showUpdatePrompt && (
        <div className="fixed top-0 left-0 right-0 bg-blue-500 text-white text-center py-2 px-4 z-50 flex items-center justify-center">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          New version available
          <button 
            onClick={handleUpdateClick}
            className="ml-4 bg-white text-blue-500 px-3 py-1 rounded text-sm font-medium hover:bg-gray-100 transition-colors"
          >
            Update
          </button>
          <button 
            onClick={handleUpdateDismiss}
            className="ml-2 text-blue-200 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>
      )}

      {/* Install Prompt */}
      {showInstallPrompt && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 max-w-sm w-full mx-4 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 z-50">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <Image 
                src="/images/logo/logo-icon.svg" 
                alt="Better Planner Icon" 
                width={32} 
                height={32}
                className="text-white"
              />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Install Better Planner</h3>
              <p className="text-xs text-gray-500">Add to home screen for quick access</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={handleInstallClick} 
              className="flex-1 bg-blue-600 text-white text-sm font-medium py-2.5 px-4 rounded-lg hover:bg-blue-700 transition-colors"
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
