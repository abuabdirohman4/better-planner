"use client";

import { useEffect, useState } from 'react';
import { SWRConfig, useSWRConfig } from 'swr';

import { prefetchCriticalData } from '@/lib/prefetchUtils';
import { swrConfig } from '@/lib/swr';

interface PreloadProviderProps {
  children: React.ReactNode;
}

/**
 * OPTIMIZED: Provider component that handles minimal critical data prefetching
 * Reduced initial load time with minimal data fetching
 */
export default function PreloadProvider({ children }: PreloadProviderProps) {
  const [isPreloading, setIsPreloading] = useState(true);
  const [preloadError, setPreloadError] = useState<string | null>(null);
  const [fallback, setFallback] = useState<Record<string, unknown>>({});

  useEffect(() => {
    const preloadData = async () => {
      try {
        // OPTIMIZATION: Reduced timeout to prevent blocking the UI
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Prefetch timeout')), 1500); // Reduced from 3s to 1.5s
        });

        // Prefetch minimal critical data with timeout
        const prefetchedFallback = await Promise.race([
          prefetchCriticalData(),
          timeoutPromise
        ]) as Record<string, unknown>;
        
        setFallback(prefetchedFallback);
        setIsPreloading(false);
      } catch (error) {
        console.warn('⚠️ Critical data preloading failed or timed out:', error);
        setPreloadError(error instanceof Error ? error.message : 'Unknown error');
        setIsPreloading(false);
      }
    };

    // Start preloading immediately
    preloadData();
  }, []);

  // OPTIMIZATION: Show minimal loading state
  if (isPreloading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500 mx-auto mb-2" />
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Show error state if preloading failed
  if (preloadError) {
    console.warn('⚠️ Preloading failed, continuing without prefetched data:', preloadError);
    // Continue with the app even if preloading failed
  }

  // Wrap children with SWRConfig that includes both the prefetched fallback and existing config
  return (
    <SWRConfig value={{ ...swrConfig, fallback }}>
      <CachePopulator fallback={fallback} />
      {children}
    </SWRConfig>
  );
}

/**
 * Simple component to populate SWR cache with prefetched data
 */
function CachePopulator({ fallback }: { fallback: Record<string, unknown> }) {
  const { mutate } = useSWRConfig();

  useEffect(() => {
    // OPTIMIZATION: Reduced delay to ensure SWR is ready faster
    const timer = setTimeout(() => {
      // Populate cache with prefetched data using mutate
      Object.entries(fallback).forEach(([key, data]) => {
        try {
          const parsedKey = JSON.parse(key);
          mutate(parsedKey, data, false); // false = don't revalidate
        } catch (error) {
          console.warn('⚠️ Failed to populate cache for key:', key, error);
        }
      });
    }, 50); // Reduced from 100ms to 50ms

    return () => clearTimeout(timer);
  }, [fallback, mutate]);

  return null;
} 