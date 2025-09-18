"use client";

import { useState, useEffect } from "react";
import { pwaConfig } from "@/lib/pwa-config";

/**
 * PWA Development Mode Component
 * Shows PWA features in development without service worker issues
 */
export default function PWADevelopmentMode() {
  const [isVisible, setIsVisible] = useState(false);
  const [installPromptShown, setInstallPromptShown] = useState(false);

  useEffect(() => {
    // Only show in development mode
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    // Show development mode indicator
    setIsVisible(true);

    // Show install prompt after delay
    const timer = setTimeout(() => {
      setInstallPromptShown(true);
    }, pwaConfig.installPrompt.delay);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 bg-yellow-500 text-black p-3 rounded-lg text-sm max-w-sm z-50">
      <div className="font-bold mb-2">🔧 PWA Development Mode</div>
      
      <div className="space-y-1 text-xs">
        <div>• Service Worker: Disabled (dev mode)</div>
        <div>• Install Prompt: {installPromptShown ? '✅ Ready' : '⏳ Waiting...'}</div>
        <div>• Offline Mode: Simulated</div>
        <div>• Debug Panel: Enabled</div>
      </div>
      
      <div className="mt-2 text-xs text-yellow-800">
        💡 PWA features work in production build
      </div>
    </div>
  );
}
