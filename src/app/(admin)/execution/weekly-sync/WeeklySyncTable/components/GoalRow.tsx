"use client";

import React, { useState, useEffect } from 'react';
import Button from '@/components/ui/button/Button';
import HorizontalGoalDisplay from './HorizontalGoalDisplay';
import HierarchicalGoalDisplay from './HierarchicalGoalDisplay';
import ProgressIndicator from './ProgressIndicator';
import type { GoalRowProps } from '../types';

export default function GoalRow({ slotNumber, goal, progress, onSlotClick, showCompletedTasks }: GoalRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isHierarchicalView, setIsHierarchicalView] = useState(true);
  
  // Cookie key untuk menyimpan state
  const cookieKey = `weekly-goal-slot-${slotNumber}-expanded`;
  
  // Set client flag untuk SSR compatibility
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Load state dari cookies saat component mount (hanya di client)
  useEffect(() => {
    if (!isClient) return;
    
    const savedState = getCookie(cookieKey);
    if (savedState !== null) {
      setIsExpanded(savedState === 'true');
    }
  }, [cookieKey, isClient]);
  
  // Save state ke cookies saat state berubah (hanya di client)
  useEffect(() => {
    if (!isClient) return;
    
    setCookie(cookieKey, isExpanded.toString(), 7); // Expire dalam 7 hari
  }, [isExpanded, cookieKey, isClient]);
  
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };
  
  // Helper functions untuk cookies
  const setCookie = (name: string, value: string, days: number) => {
    if (typeof window === 'undefined') return;
    
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
  };
  
  const getCookie = (name: string): string | null => {
    if (typeof window === 'undefined') return null;
    
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) {
        return c.substring(nameEQ.length, c.length);
      }
    }
    return null;
  };

  const renderGoalContent = () => {
    if (goal && goal.items.length > 0) {
      return (
        <div>
          {/* Toggle Button */}
          <button
            onClick={toggleExpanded}
            className={`w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-t-lg border border-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 ease-in-out hover:shadow-sm active:scale-98 ${isExpanded ? 'rounded-t-lg border-b-0' : 'rounded-lg'}`}
          >
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {isExpanded ? 'Hide' : 'Show'} Task ({goal.items.length})
            </span>
            <svg
              className={`w-4 h-4 text-gray-500 transition-all duration-300 ease-in-out ${
                isExpanded ? 'rotate-180 scale-110' : 'rotate-0 scale-100'
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {/* Collapsible Content */}
          <div 
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              isExpanded 
                ? 'max-h-96 opacity-100 transform translate-y-0' 
                : 'max-h-0 opacity-0 transform -translate-y-2'
            }`}
          >
            <div className="space-y-3">
              <div className="max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-100 dark:scrollbar-track-gray-800">
                <div className="p-4 rounded-b-lg border border-gray-200 border-t-0 dark:border-gray-700">
                  {/* View Mode Toggle and Edit Button - Now inside collapsible content */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setIsHierarchicalView(true)}
                        className={`px-3 py-1 text-xs rounded-full transition-all duration-200 ${
                          isHierarchicalView 
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300' 
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        Tree
                      </button>
                      <button
                        onClick={() => setIsHierarchicalView(false)}
                        className={`px-3 py-1 text-xs rounded-full transition-all duration-200 ${
                          !isHierarchicalView 
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300' 
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        Grid
                      </button>
                    </div>
                    
                    {/* Edit Button */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onSlotClick(slotNumber)}
                      className="flex items-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span>Edit</span>
                    </Button>
                  </div>

                  {/* Task Display */}
                  {isHierarchicalView ? (
                    <HierarchicalGoalDisplay
                      items={goal.items}
                      onClick={() => onSlotClick(slotNumber)}
                      slotNumber={slotNumber}
                      showCompletedTasks={showCompletedTasks}
                    />
                  ) : (
                    <HorizontalGoalDisplay
                      items={goal.items}
                      onClick={() => onSlotClick(slotNumber)}
                      slotNumber={slotNumber}
                      showCompletedTasks={showCompletedTasks}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            Belum ada fokus mingguan
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mb-4">
            Klik tombol di bawah untuk menambahkan quest
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onSlotClick(slotNumber)}
            className="flex items-center space-x-2 mx-auto"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Tetapkan Fokus</span>
          </Button>
        </div>
      );
    }
  };

  return (
    <tr className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
      {/* Mobile Layout - Collapsible */}
      <td className="p-4 md:hidden">
        <div className="space-y-3">
          {/* Progress Indicator */}
          <div className="w-full">
            <ProgressIndicator progress={progress} slotNumber={slotNumber}/>
          </div>

          {/* Goal Content */}
          {renderGoalContent()}
        </div>
      </td>
      
      {/* Desktop Layout - Progress Bar Above + Collapsible Goals */}
      <td className="py-4 px-4 hidden md:table-cell" colSpan={2}>
        <div className="space-y-4">
          {/* Progress Indicator - Above Goals */}
          <div className="w-full">
            <ProgressIndicator progress={progress} slotNumber={slotNumber}/>
          </div>

          {/* Goal Content */}
          {renderGoalContent()}
        </div>
      </td>
    </tr>
  );
}