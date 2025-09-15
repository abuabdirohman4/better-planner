import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';


/**
 * Hook for immediate navigation feedback
 * Provides instant UI updates while data loads
 */
export function useImmediateNavigation() {
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);
  const [currentPath, setCurrentPath] = useState(pathname);

  useEffect(() => {
    if (pathname !== currentPath) {
      setIsNavigating(true);
      setCurrentPath(pathname);
      
      // Reset navigation state after a short delay
      const timer = setTimeout(() => {
        setIsNavigating(false);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [pathname, currentPath]);

  return {
    isNavigating,
    currentPath,
    previousPath: currentPath !== pathname ? currentPath : null
  };
}

/**
 * Hook for optimistic UI updates
 * Shows expected UI immediately, updates when data arrives
 */
export function useOptimisticUI<T>(
  initialData: T,
  fetcher: () => Promise<T>,
  dependencies: unknown[] = []
) {
  const [data, setData] = useState<T>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const result = await fetcher();
        
        if (isMounted) {
          setData(result);
        }
      } catch (err) {
        if (isMounted) {
          setError(err as Error);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  return {
    data,
    isLoading,
    error,
    updateData: setData
  };
}

/**
 * Hook for background data prefetching
 * Preloads data without blocking UI
 */
export function useBackgroundPrefetch<T>(
  fetcher: () => Promise<T>,
  dependencies: unknown[] = []
) {
  const [prefetchedData, setPrefetchedData] = useState<T | null>(null);
  const [isPrefetching, setIsPrefetching] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const prefetch = async () => {
      try {
        setIsPrefetching(true);
        const result = await fetcher();
        
        if (isMounted) {
          setPrefetchedData(result);
        }
      } catch (error) {
        console.warn('Background prefetch failed:', error);
      } finally {
        if (isMounted) {
          setIsPrefetching(false);
        }
      }
    };

    // Prefetch after a short delay to not block initial render
    const timer = setTimeout(prefetch, 100);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  return {
    prefetchedData,
    isPrefetching
  };
}
