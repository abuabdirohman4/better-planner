"use client";

import { useState, useEffect } from "react";

export default function MobilePWADebug() {
  const [debugInfo, setDebugInfo] = useState({
    isMobile: false,
    isStandalone: false,
    hasServiceWorker: false,
    hasBeforeInstallPrompt: false,
    userAgent: '',
    displayMode: '',
    isOnline: false,
  });

  useEffect(() => {
    const updateDebugInfo = () => {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                          (window.navigator as any).standalone === true;
      const hasServiceWorker = 'serviceWorker' in navigator;
      const hasBeforeInstallPrompt = 'onbeforeinstallprompt' in window;
      
      setDebugInfo({
        isMobile,
        isStandalone,
        hasServiceWorker,
        hasBeforeInstallPrompt,
        userAgent: navigator.userAgent,
        displayMode: window.matchMedia('(display-mode: standalone)').matches ? 'standalone' : 'browser',
        isOnline: navigator.onLine,
      });
    };

    updateDebugInfo();
    
    // Listen for changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    mediaQuery.addEventListener('change', updateDebugInfo);
    window.addEventListener('online', updateDebugInfo);
    window.addEventListener('offline', updateDebugInfo);

    return () => {
      mediaQuery.removeEventListener('change', updateDebugInfo);
      window.removeEventListener('online', updateDebugInfo);
      window.removeEventListener('offline', updateDebugInfo);
    };
  }, []);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-black bg-opacity-90 text-white text-xs p-3 rounded-lg z-50 max-w-sm">
      <div className="font-bold mb-2">🔍 Mobile PWA Debug</div>
      <div className="space-y-1">
        <div className={`flex justify-between ${debugInfo.isMobile ? 'text-green-400' : 'text-red-400'}`}>
          <span>Mobile:</span>
          <span>{debugInfo.isMobile ? 'Yes' : 'No'}</span>
        </div>
        <div className={`flex justify-between ${debugInfo.isStandalone ? 'text-green-400' : 'text-yellow-400'}`}>
          <span>Standalone:</span>
          <span>{debugInfo.isStandalone ? 'Yes' : 'No'}</span>
        </div>
        <div className={`flex justify-between ${debugInfo.hasServiceWorker ? 'text-green-400' : 'text-red-400'}`}>
          <span>Service Worker:</span>
          <span>{debugInfo.hasServiceWorker ? 'Yes' : 'No'}</span>
        </div>
        <div className={`flex justify-between ${debugInfo.hasBeforeInstallPrompt ? 'text-green-400' : 'text-red-400'}`}>
          <span>Install Prompt:</span>
          <span>{debugInfo.hasBeforeInstallPrompt ? 'Yes' : 'No'}</span>
        </div>
        <div className="flex justify-between">
          <span>Display Mode:</span>
          <span>{debugInfo.displayMode}</span>
        </div>
        <div className={`flex justify-between ${debugInfo.isOnline ? 'text-green-400' : 'text-red-400'}`}>
          <span>Online:</span>
          <span>{debugInfo.isOnline ? 'Yes' : 'No'}</span>
        </div>
      </div>
      
      {!debugInfo.hasBeforeInstallPrompt && (
        <div className="mt-2 p-2 bg-red-900 bg-opacity-50 rounded text-xs">
          <div className="font-bold text-red-300">⚠️ Install Prompt Issues:</div>
          <div className="mt-1 space-y-1">
            {!debugInfo.hasServiceWorker && <div>• Service Worker not available</div>}
            {debugInfo.isStandalone && <div>• Already installed (standalone mode)</div>}
            {!debugInfo.isMobile && <div>• Not on mobile device</div>}
          </div>
        </div>
      )}
    </div>
  );
}
