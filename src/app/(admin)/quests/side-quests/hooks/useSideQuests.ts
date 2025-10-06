"use client";

import { useState, useEffect } from 'react';
import { getSideQuests, updateSideQuestStatus } from '../actions/sideQuestActions';
import { SideQuest } from '../types';

export function useSideQuests() {
  const [sideQuests, setSideQuests] = useState<SideQuest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSideQuests = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getSideQuests();
      setSideQuests(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch side quests');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleStatus = async (taskId: string, currentStatus: 'TODO' | 'IN_PROGRESS' | 'DONE') => {
    try {
      const newStatus = currentStatus === 'DONE' ? 'TODO' : 'DONE';
      await updateSideQuestStatus(taskId, newStatus);
      
      // Update local state
      setSideQuests(prev => 
        prev.map(quest => 
          quest.id === taskId 
            ? { ...quest, status: newStatus, updated_at: new Date().toISOString() }
            : quest
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  useEffect(() => {
    fetchSideQuests();
  }, []);

  return {
    sideQuests,
    isLoading,
    error,
    refetch: fetchSideQuests,
    toggleStatus
  };
}
