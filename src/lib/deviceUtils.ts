/**
 * Device detection utilities for mobile optimization
 */

/**
 * Detect if current device is mobile
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check user agent
  const userAgent = navigator.userAgent || '';
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  
  // Check screen size
  const screenWidth = window.innerWidth;
  const isMobileScreen = screenWidth <= 768;
  
  // Check touch support
  const isTouchDevice = 'ontouchstart' in window;
  
  return mobileRegex.test(userAgent) || isMobileScreen || isTouchDevice;
}

/**
 * Get device type for performance optimization
 */
export function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';
  
  const screenWidth = window.innerWidth;
  
  if (screenWidth <= 768) return 'mobile';
  if (screenWidth <= 1024) return 'tablet';
  return 'desktop';
}

/**
 * Check if device has low memory (for performance optimization)
 */
export function isLowMemoryDevice(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check if device memory API is available
  if ('deviceMemory' in navigator) {
    const deviceMemory = (navigator as { deviceMemory?: number }).deviceMemory;
    return deviceMemory !== undefined && deviceMemory <= 2; // 2GB or less
  }
  
  // Fallback: assume mobile devices have lower memory
  return isMobileDevice();
}

/**
 * Get optimal bundle loading strategy based on device
 */
export function getBundleStrategy(): 'lazy' | 'eager' | 'progressive' {
  const deviceType = getDeviceType();
  const isLowMemory = isLowMemoryDevice();
  
  if (deviceType === 'mobile' || isLowMemory) {
    return 'lazy';
  }
  
  if (deviceType === 'tablet') {
    return 'progressive';
  }
  
  return 'eager';
}

/**
 * Mobile-optimized cache configuration
 */
export function getMobileCacheConfig() {
  const deviceType = getDeviceType();
  const isLowMemory = isLowMemoryDevice();
  
  if (deviceType === 'mobile' || isLowMemory) {
    return {
      dedupingInterval: 30 * 60 * 1000, // 30 minutes for mobile
      errorRetryCount: 1, // Reduced retries
      errorRetryInterval: 5000, // Longer retry interval
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      keepPreviousData: true,
    };
  }
  
  return {
    dedupingInterval: 15 * 60 * 1000, // 15 minutes for desktop
    errorRetryCount: 2,
    errorRetryInterval: 2000,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    keepPreviousData: true,
  };
} 