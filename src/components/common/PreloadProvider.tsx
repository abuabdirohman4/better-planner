"use client";

import { useEffect, useState } from 'react';
import { SWRConfig, useSWRConfig } from 'swr';

import { prefetchCriticalData } from '@/lib/prefetchUtils';
import { swrConfig } from '@/lib/swr';

interface PreloadProviderProps {
  children: React.ReactNode;
}

/**
 * Provider component that handles critical data prefetching
 * This component runs once when the app loads to prefetch essential data
 */
export default function PreloadProvider({ children }: PreloadProviderProps) {
  const [isPreloading, setIsPreloading] = useState(true);
  const [preloadError, setPreloadError] = useState<string | null>(null);
  const [fallback, setFallback] = useState<Record<string, unknown>>({});

  useEffect(() => {
    const preloadData = async () => {
      try {
        // Prefetch critical data
        const prefetchedFallback = await prefetchCriticalData();
        setFallback(prefetchedFallback);
        setIsPreloading(false);
      } catch (error) {
        console.error('❌ Critical data preloading failed:', error);
        setPreloadError(error instanceof Error ? error.message : 'Unknown error');
        setIsPreloading(false);
      }
    };

    // Start preloading immediately
    preloadData();
  }, []);

  // Show loading state if preloading is still in progress
  if (isPreloading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto mb-4" />
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
    // Add a small delay to ensure SWR is ready
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
    }, 100); // 100ms delay

    return () => clearTimeout(timer);
  }, [fallback, mutate]);

  return null;
} 