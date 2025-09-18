"use client";

import { useState, useEffect } from "react";

interface SplashScreenProps {
  children: React.ReactNode;
}

export default function SplashScreen({ children }: SplashScreenProps) {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Show splash screen for 1.5 seconds
    const splashTimer = setTimeout(() => {
      setShowSplash(false);
    }, 1500);

    return () => clearTimeout(splashTimer);
  }, []);

  // Show splash screen
  if (showSplash) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center z-50">
        <div className="text-center text-white">
          {/* App Logo */}
          <div className="w-20 h-20 mx-auto mb-6 bg-white rounded-2xl flex items-center justify-center shadow-lg">
            <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          
          {/* App Name */}
          <h1 className="text-2xl font-bold mb-2">Better Planner</h1>
          <p className="text-blue-100 text-sm">Your productivity companion</p>
          
          {/* Loading Animation */}
          <div className="mt-8 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        </div>
      </div>
    );
  }


  // App is ready
  return <>{children}</>;
}

