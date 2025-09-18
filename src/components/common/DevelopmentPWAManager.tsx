"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function DevelopmentPWAManager() {
  const [isServiceWorkerRegistered, setIsServiceWorkerRegistered] = useState(false);
  const [isDevelopment, setIsDevelopment] = useState(false);

  useEffect(() => {
    setIsDevelopment(process.env.NODE_ENV === 'development');
    
    if (process.env.NODE_ENV === 'development') {
      registerDevelopmentServiceWorker();
    }
  }, []);

  const registerDevelopmentServiceWorker = async () => {
    if (!('serviceWorker' in navigator)) {
      console.log('🔧 Development PWA: Service Worker not supported');
      return;
    }

    try {
      console.log('🔧 Development PWA: Registering development service worker...');
      const registration = await navigator.serviceWorker.register('/sw-dev.js', {
        scope: '/'
      });

      console.log('🔧 Development PWA: Service Worker registered', registration);
      setIsServiceWorkerRegistered(true);
      toast.success('Development PWA enabled!');

      // Listen for updates
      registration.addEventListener('updatefound', () => {
        console.log('🔧 Development PWA: Service Worker update found');
        toast.info('PWA update available!');
      });

    } catch (error) {
      console.error('🔧 Development PWA: Service Worker registration failed', error);
      toast.error('Failed to enable development PWA');
    }
  };

  const unregisterServiceWorker = async () => {
    if (!('serviceWorker' in navigator)) return;

    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (let registration of registrations) {
        await registration.unregister();
        console.log('🔧 Development PWA: Service Worker unregistered');
      }
      setIsServiceWorkerRegistered(false);
      toast.success('Development PWA disabled!');
    } catch (error) {
      console.error('🔧 Development PWA: Failed to unregister', error);
      toast.error('Failed to disable development PWA');
    }
  };

  // Only show in development
  if (!isDevelopment) return null;

  return (
    <div className="fixed top-4 right-4 bg-blue-900 text-white text-xs p-3 rounded-lg z-50 max-w-xs">
      <div className="font-bold mb-2">🔧 Development PWA Manager</div>
      
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span>Service Worker:</span>
          <span className={isServiceWorkerRegistered ? 'text-green-400' : 'text-red-400'}>
            {isServiceWorkerRegistered ? 'Active' : 'Inactive'}
          </span>
        </div>
        
        <div className="flex space-x-2">
          {!isServiceWorkerRegistered ? (
            <button
              onClick={registerDevelopmentServiceWorker}
              className="bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-xs"
            >
              Enable PWA
            </button>
          ) : (
            <button
              onClick={unregisterServiceWorker}
              className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs"
            >
              Disable PWA
            </button>
          )}
        </div>
        
        <div className="text-xs text-blue-200">
          This enables PWA features for testing in development mode.
        </div>
      </div>
    </div>
  );
}
