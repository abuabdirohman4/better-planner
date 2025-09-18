"use client";

import { useOfflineSync } from "@/hooks/common/useOfflineSync";
import { RiWifiOffLine, RiRefreshLine, RiCheckLine } from "react-icons/ri";

export default function OfflineSyncIndicator() {
  const { isOnline, pendingActions, isSyncing, handleSync, hasPendingActions } = useOfflineSync();

  if (!hasPendingActions && isOnline) return null;

  return (
    <div className="flex items-center space-x-2">
      {/* Offline Indicator */}
      {!isOnline && (
        <div className="flex items-center space-x-1 text-red-500">
          <RiWifiOffLine className="w-4 h-4" />
          <span className="text-sm font-medium">Offline</span>
        </div>
      )}

      {/* Pending Actions Indicator */}
      {hasPendingActions && (
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 text-orange-500">
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">{pendingActions} pending</span>
          </div>
          
          {isOnline && (
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="flex items-center space-x-1 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSyncing ? (
                <>
                  <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Syncing...</span>
                </>
              ) : (
                <>
                  <RiRefreshLine className="w-3 h-3" />
                  <span>Sync</span>
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Success Indicator */}
      {isOnline && !hasPendingActions && (
        <div className="flex items-center space-x-1 text-green-500">
          <RiCheckLine className="w-4 h-4" />
          <span className="text-sm font-medium">Synced</span>
        </div>
      )}
    </div>
  );
}
