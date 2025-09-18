"use client";

import { useState, useEffect } from "react";

interface LoadingState {
  isLoading: boolean;
  loadingMessage: string;
}

let globalLoadingState: LoadingState = {
  isLoading: false,
  loadingMessage: "",
};

const loadingListeners = new Set<(state: LoadingState) => void>();

export function useGlobalLoading() {
  const [loadingState, setLoadingState] = useState<LoadingState>(globalLoadingState);

  useEffect(() => {
    const listener = (state: LoadingState) => {
      setLoadingState(state);
    };

    loadingListeners.add(listener);

    return () => {
      loadingListeners.delete(listener);
    };
  }, []);

  const setLoading = (isLoading: boolean, message: string = "") => {
    globalLoadingState = { isLoading, loadingMessage: message };
    loadingListeners.forEach(listener => listener(globalLoadingState));
  };

  const showLoading = (message: string = "Loading...") => {
    setLoading(true, message);
  };

  const hideLoading = () => {
    setLoading(false);
  };

  return {
    ...loadingState,
    setLoading,
    showLoading,
    hideLoading,
  };
}

