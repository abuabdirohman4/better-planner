import { useState, useEffect, useCallback } from 'react';

export function useErrorHandling(ultraFastError: any, mutateUltraFast: () => void) {
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Error handling
  useEffect(() => {
    if (ultraFastError) {
      const errorMessage = ultraFastError.message || 'Failed to load data';
      setError(errorMessage);
      
      // Auto-clear error after 5 seconds
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [ultraFastError]);

  // Retry logic
  const handleRetry = useCallback(() => {
    setError(null);
    setRetryCount(prev => prev + 1);
    mutateUltraFast();
  }, [mutateUltraFast]);

  return {
    error,
    setError,
    retryCount,
    handleRetry
  };
}
