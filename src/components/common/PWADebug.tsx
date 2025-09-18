"use client";

import { useState, useEffect } from "react";

export default function PWADebug() {
  const [debugInfo, setDebugInfo] = useState({
    isOnline: true,
    serviceWorkerSupported: false,
    serviceWorkerRegistered: false,
    manifestLoaded: false,
    beforeInstallPromptSupported: false,
    isStandalone: false,
    userAgent: "",
  });

  useEffect(() => {
    const checkPWAStatus = () => {
      const isOnline = navigator.onLine;
      const serviceWorkerSupported = "serviceWorker" in navigator;
      const beforeInstallPromptSupported = "onbeforeinstallprompt" in window;
      const isStandalone = window.matchMedia("(display-mode: standalone)").matches || 
                          (window.navigator as any).standalone === true;
      const userAgent = navigator.userAgent;

      // Check if service worker is registered
      let serviceWorkerRegistered = false;
      if (serviceWorkerSupported) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
          serviceWorkerRegistered = registrations.length > 0;
          setDebugInfo(prev => ({ ...prev, serviceWorkerRegistered }));
        });
      }

      // Check if manifest is loaded
      const manifestLink = document.querySelector('link[rel="manifest"]');
      const manifestLoaded = !!manifestLink;

      setDebugInfo({
        isOnline,
        serviceWorkerSupported,
        serviceWorkerRegistered,
        manifestLoaded,
        beforeInstallPromptSupported,
        isStandalone,
        userAgent,
      });
    };

    checkPWAStatus();

    // Check every 2 seconds
    const interval = setInterval(checkPWAStatus, 2000);

    return () => clearInterval(interval);
  }, []);

  if (process.env.NODE_ENV === "production") {
    return null; // Don't show debug info in production
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-90 text-white p-4 rounded-lg text-xs max-w-sm z-50">
      <h3 className="font-bold mb-2">🔧 PWA Debug Info</h3>
      
      <div className="space-y-1">
        <div className="flex justify-between">
          <span>Online:</span>
          <span className={debugInfo.isOnline ? "text-green-400" : "text-red-400"}>
            {debugInfo.isOnline ? "✅" : "❌"}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>SW Supported:</span>
          <span className={debugInfo.serviceWorkerSupported ? "text-green-400" : "text-red-400"}>
            {debugInfo.serviceWorkerSupported ? "✅" : "❌"}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>SW Registered:</span>
          <span className={debugInfo.serviceWorkerRegistered ? "text-green-400" : "text-red-400"}>
            {debugInfo.serviceWorkerRegistered ? "✅" : "❌"}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>Manifest:</span>
          <span className={debugInfo.manifestLoaded ? "text-green-400" : "text-red-400"}>
            {debugInfo.manifestLoaded ? "✅" : "❌"}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>Install Prompt:</span>
          <span className={debugInfo.beforeInstallPromptSupported ? "text-green-400" : "text-red-400"}>
            {debugInfo.beforeInstallPromptSupported ? "✅" : "❌"}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>Standalone:</span>
          <span className={debugInfo.isStandalone ? "text-green-400" : "text-red-400"}>
            {debugInfo.isStandalone ? "✅" : "❌"}
          </span>
        </div>
      </div>
      
      <div className="mt-2 pt-2 border-t border-gray-600">
        <div className="text-xs text-gray-300">
          <div>Browser: {debugInfo.userAgent.includes('Chrome') ? 'Chrome' : 'Other'}</div>
          <div>Mobile: {debugInfo.userAgent.includes('Mobile') ? 'Yes' : 'No'}</div>
        </div>
      </div>
      
      <div className="mt-2 text-xs text-yellow-300">
        💡 Install prompt should appear after 5-10 seconds
      </div>
    </div>
  );
}
