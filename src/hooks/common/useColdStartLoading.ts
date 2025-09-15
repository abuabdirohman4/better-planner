import { useEffect, useState } from 'react';

interface ColdStartConfig {
  isFirstVisit: boolean;
  cacheKey: string;
  preloadData: () => Promise<void>;
  onCacheReady: () => void;
}

/**
 * Hook for Cold Start Loading Strategy
 * - First visit: Long loading + comprehensive preload
 * - Subsequent visits: Fast loading from cache
 */
export function useColdStartLoading(config: ColdStartConfig) {
  const [isLoading, setIsLoading] = useState(true);
  const [isFirstVisit, setIsFirstVisit] = useState(config.isFirstVisit);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('Initializing...');

  useEffect(() => {
    const loadData = async () => {
      try {
        if (isFirstVisit) {
          // First visit - comprehensive loading
          setLoadingMessage('First time setup...');
          setLoadingProgress(10);
          
          // Preload critical data
          await config.preloadData();
          
          setLoadingMessage('Building cache...');
          setLoadingProgress(50);
          
          // Mark as not first visit
          localStorage.setItem(`${config.cacheKey}-visited`, 'true');
          setIsFirstVisit(false);
          
          setLoadingMessage('Finalizing...');
          setLoadingProgress(90);
          
          // Small delay to show progress
          await new Promise(resolve => setTimeout(resolve, 500));
        } else {
          // Subsequent visits - fast loading
          setLoadingMessage('Loading from cache...');
          setLoadingProgress(30);
          
          // Quick cache check and load
          await config.preloadData();
          
          setLoadingProgress(80);
        }
        
        setLoadingProgress(100);
        setLoadingMessage('Ready!');
        
        // Notify cache is ready
        config.onCacheReady();
        
        // Small delay for smooth transition
        await new Promise(resolve => setTimeout(resolve, 200));
        
        setIsLoading(false);
      } catch (error) {
        console.error('Cold start loading failed:', error);
        setIsLoading(false);
      }
    };

    loadData();
  }, [config, isFirstVisit]);

  return {
    isLoading,
    isFirstVisit,
    loadingProgress,
    loadingMessage,
    estimatedTime: isFirstVisit ? '2-3 seconds' : '< 500ms'
  };
}

/**
 * Hook for checking if it's first visit
 */
export function useFirstVisitCheck(cacheKey: string) {
  const [isFirstVisit, setIsFirstVisit] = useState(true);

  useEffect(() => {
    const hasVisited = localStorage.getItem(`${cacheKey}-visited`);
    setIsFirstVisit(!hasVisited);
  }, [cacheKey]);

  return isFirstVisit;
}

/**
 * Hook for preloading critical data
 */
export function useCriticalDataPreload() {
  const [preloadStatus, setPreloadStatus] = useState<{
    quests: boolean;
    weeklyData: boolean;
    dailyData: boolean;
    dashboard: boolean;
  }>({
    quests: false,
    weeklyData: false,
    dailyData: false,
    dashboard: false
  });

  const preloadAllData = async () => {
    try {
      // Preload quests
      setPreloadStatus(prev => ({ ...prev, quests: true }));
      // Add quest preloading logic here
      
      // Preload weekly data
      setPreloadStatus(prev => ({ ...prev, weeklyData: true }));
      // Add weekly data preloading logic here
      
      // Preload daily data
      setPreloadStatus(prev => ({ ...prev, dailyData: true }));
      // Add daily data preloading logic here
      
      // Preload dashboard
      setPreloadStatus(prev => ({ ...prev, dashboard: true }));
      // Add dashboard preloading logic here
      
    } catch (error) {
      console.error('Preload failed:', error);
    }
  };

  return {
    preloadStatus,
    preloadAllData,
    isPreloadComplete: Object.values(preloadStatus).every(Boolean)
  };
}
