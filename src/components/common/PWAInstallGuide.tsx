"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";

interface PWAInstallGuideProps {
  onClose: () => void;
}

export default function PWAInstallGuide({ onClose }: PWAInstallGuideProps) {
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const userAgent = navigator.userAgent;
    setIsIOS(/iPhone|iPad|iPod/i.test(userAgent));
    setIsAndroid(/Android/i.test(userAgent));
    setIsStandalone(
      (window.navigator as any).standalone || 
      window.matchMedia('(display-mode: standalone)').matches
    );
  }, []);

  if (isStandalone) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl p-6 max-w-sm w-full">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">App Already Installed!</h3>
            <p className="text-gray-600 mb-4">Better Planner is already running as a PWA.</p>
            <button
              onClick={onClose}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-sm w-full">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Install Better Planner</h3>
          <p className="text-gray-600">Add to your home screen for quick access</p>
        </div>

        <div className="space-y-4">
          {isIOS ? (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">📱 For iPhone/iPad:</h4>
              <ol className="text-sm text-gray-600 space-y-1">
                <li>1. Tap the <strong>Share</strong> button (□↑)</li>
                <li>2. Scroll down and tap <strong>"Add to Home Screen"</strong></li>
                <li>3. Tap <strong>"Add"</strong> to install</li>
              </ol>
            </div>
          ) : isAndroid ? (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">📱 For Android:</h4>
              <ol className="text-sm text-gray-600 space-y-1">
                <li>1. Tap the <strong>menu button</strong> (⋮)</li>
                <li>2. Tap <strong>"Add to Home screen"</strong></li>
                <li>3. Tap <strong>"Add"</strong> to install</li>
              </ol>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">📱 For Mobile:</h4>
              <ol className="text-sm text-gray-600 space-y-1">
                <li>1. Look for <strong>"Install App"</strong> in browser menu</li>
                <li>2. Or tap <strong>Share</strong> → <strong>"Add to Home Screen"</strong></li>
                <li>3. Follow the prompts to install</li>
              </ol>
            </div>
          )}

          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">💡 Why install?</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Quick access from home screen</li>
              <li>• Works offline</li>
              <li>• Feels like a native app</li>
              <li>• No need to open browser</li>
            </ul>
          </div>
        </div>

        <div className="flex space-x-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Maybe later
          </button>
          <button
            onClick={() => {
              toast.info("Follow the steps above to install the app!");
              onClose();
            }}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
