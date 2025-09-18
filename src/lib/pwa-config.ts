/**
 * PWA Configuration for Better Planner
 * Separate configuration to avoid development warnings
 */

export const pwaConfig = {
  // PWA features configuration
  installPrompt: {
    enabled: true,
    delay: 5000, // 5 seconds
    fallbackDelay: 10000, // 10 seconds fallback
  },
  
  // Offline configuration
  offline: {
    enabled: true,
    cacheStrategy: 'networkFirst',
    maxCacheSize: 50, // MB
  },
  
  // Service Worker configuration
  serviceWorker: {
    enabled: process.env.NODE_ENV === 'production',
    scope: '/',
    updateInterval: 60000, // 1 minute
  },
  
  // Debug configuration
  debug: {
    enabled: process.env.NODE_ENV === 'development',
    showDebugPanel: true,
    logLevel: 'info',
  },
  
  // Install prompt conditions
  installConditions: {
    minEngagementTime: 5000, // 5 seconds
    minPageViews: 1,
    excludePaths: ['/signin', '/signup'],
  },
};

export const isPWAEnabled = () => {
  return typeof window !== 'undefined' && 
         'serviceWorker' in navigator && 
         window.matchMedia('(display-mode: standalone)').matches;
};

export const canInstallPWA = () => {
  return typeof window !== 'undefined' && 
         'onbeforeinstallprompt' in window;
};
