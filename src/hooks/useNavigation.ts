"use client";
import { useRouter } from 'next/navigation';
import { useLoading } from '@/components/ui/spinner/LoadingProvider';
import { useCallback } from 'react';

export const useNavigation = () => {
  const router = useRouter();
  const { showLoading, hideLoading } = useLoading();

  const navigate = useCallback((href: string) => {
    showLoading();
    
    // Use a small delay to ensure loading state is shown
    setTimeout(() => {
      router.push(href);
      // Hide loading after navigation completes
      setTimeout(() => {
        hideLoading();
      }, 100);
    }, 50);
  }, [router, showLoading, hideLoading]);

  const navigateBack = useCallback(() => {
    showLoading();
    
    setTimeout(() => {
      router.back();
      setTimeout(() => {
        hideLoading();
      }, 100);
    }, 50);
  }, [router, showLoading, hideLoading]);

  const replace = useCallback((href: string) => {
    showLoading();
    
    setTimeout(() => {
      router.replace(href);
      setTimeout(() => {
        hideLoading();
      }, 100);
    }, 50);
  }, [router, showLoading, hideLoading]);

  return {
    navigate,
    navigateBack,
    replace,
    router,
  };
}; 