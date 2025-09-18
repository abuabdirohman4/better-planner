"use client";

import { useState, useEffect } from "react";

interface PWAState {
  isInstalled: boolean;
  isOnline: boolean;
  canInstall: boolean;
  isUpdateAvailable: boolean;
}

export function usePWA() {
  const [pwaState, setPwaState] = useState<PWAState>({
    isInstalled: false,
    isOnline: true,
    canInstall: false,
    isUpdateAvailable: false,
  });

  useEffect(() => {
    // Check if app is installed
    const checkIfInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isIOSStandalone = (window.navigator as any).standalone;
      return isStandalone || isIOSStandalone;
    };

    // Check online status
    const checkOnlineStatus = () => {
      return navigator.onLine;
    };

    // Check if PWA can be installed
    const checkCanInstall = () => {
      return 'serviceWorker' in navigator && 'PushManager' in window;
    };

    // Update state
    const updateState = () => {
      setPwaState({
        isInstalled: checkIfInstalled(),
        isOnline: checkOnlineStatus(),
        canInstall: checkCanInstall(),
        isUpdateAvailable: false, // This would be set by service worker events
      });
    };

    // Initial check
    updateState();

    // Listen for online/offline events
    const handleOnline = () => {
      setPwaState(prev => ({ ...prev, isOnline: true }));
    };

    const handleOffline = () => {
      setPwaState(prev => ({ ...prev, isOnline: false }));
    };

    // Listen for display mode changes
    const handleDisplayModeChange = () => {
      setPwaState(prev => ({ ...prev, isInstalled: checkIfInstalled() }));
    };

    // Event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('resize', handleDisplayModeChange);

    // Service worker update events
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        setPwaState(prev => ({ ...prev, isUpdateAvailable: true }));
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('resize', handleDisplayModeChange);
    };
  }, []);

  return pwaState;
}

