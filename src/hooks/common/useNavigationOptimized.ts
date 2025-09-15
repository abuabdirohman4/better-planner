import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';


/**
 * Hook for navigation-optimized data fetching
 * Provides immediate loading states and progressive data loading
 */
export function useNavigationOptimized<T>(
  fetcher: () => Promise<T>,
  dependencies: unknown[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const result = await fetcher();
        
        if (isMounted) {
          setData(result);
          setIsInitialLoad(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err as Error);
          setIsInitialLoad(false);
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
    isInitialLoad,
    refetch: () => {
      setIsLoading(true);
      setIsInitialLoad(true);
    }
  };
}

/**
 * Hook for page transition optimization
 * Provides smooth transitions between pages
 */
export function usePageTransition() {
  const pathname = usePathname();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [previousPath, setPreviousPath] = useState<string | null>(null);

  useEffect(() => {
    if (previousPath && previousPath !== pathname) {
      setIsTransitioning(true);
      
      // Reset transition state after a short delay
      const timer = setTimeout(() => {
        setIsTransitioning(false);
      }, 300);

      return () => clearTimeout(timer);
    }
    
    setPreviousPath(pathname);
  }, [pathname, previousPath]);

  return {
    isTransitioning,
    currentPath: pathname,
    previousPath
  };
}

/**
 * Hook for prefetching data on hover
 * Preloads data when user hovers over navigation links
 */
export function usePrefetchOnHover<T>(
  fetcher: () => Promise<T>
) {
  const [prefetchedData, setPrefetchedData] = useState<T | null>(null);
  const [isPrefetching, setIsPrefetching] = useState(false);

  const prefetch = async () => {
    if (prefetchedData || isPrefetching) return;

    try {
      setIsPrefetching(true);
      const data = await fetcher();
      setPrefetchedData(data);
    } catch (error) {
      console.warn('Prefetch failed:', error);
    } finally {
      setIsPrefetching(false);
    }
  };

  const clearPrefetch = () => {
    setPrefetchedData(null);
  };

  return {
    prefetchedData,
    isPrefetching,
    prefetch,
    clearPrefetch
  };
}
