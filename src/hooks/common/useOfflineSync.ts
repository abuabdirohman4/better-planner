"use client";

import { useEffect, useState } from "react";
import { syncOfflineActions, hasOfflineActions, getOfflineActionsCount } from "@/lib/offlineUtils";
import { toast } from "sonner";

export const useOfflineSync = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingActions, setPendingActions] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    // Check initial online status
    setIsOnline(navigator.onLine);
    setPendingActions(getOfflineActionsCount());

    // Online/offline event listeners
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("You're back online!");
      
      // Auto-sync when coming back online
      if (hasOfflineActions()) {
        handleSync();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning("You're currently offline. Changes will be synced when you're back online.");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Check for pending actions periodically
    const interval = setInterval(() => {
      setPendingActions(getOfflineActionsCount());
    }, 5000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, []);

  const handleSync = async () => {
    if (!isOnline || isSyncing) return;

    setIsSyncing(true);
    
    try {
      const { success, failed } = await syncOfflineActions();
      
      if (success > 0) {
        toast.success(`${success} offline action(s) synced successfully!`);
      }
      
      if (failed > 0) {
        toast.error(`${failed} action(s) failed to sync. Please try again.`);
      }
      
      setPendingActions(getOfflineActionsCount());
    } catch (error) {
      console.error("Sync failed:", error);
      toast.error("Failed to sync offline actions");
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    isOnline,
    pendingActions,
    isSyncing,
    handleSync,
    hasPendingActions: pendingActions > 0,
  };
};
