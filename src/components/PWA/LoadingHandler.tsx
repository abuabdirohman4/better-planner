"use client";

import { useState, useEffect } from "react";

interface LoadingHandlerProps {
  children: React.ReactNode;
}

export default function LoadingHandler({ children }: LoadingHandlerProps) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate app loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Better Planner...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

