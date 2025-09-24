"use client";

import React, { useState, useEffect } from 'react';
import Button from '@/components/ui/button/Button';
import HorizontalGoalDisplay from './HorizontalGoalDisplay';
import ProgressIndicator from './ProgressIndicator';
import type { GoalRowProps } from '../types';

export default function GoalRow({ slotNumber, goal, progress, onSlotClick }: GoalRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isClient, setIsClient] = useState(false);
  
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

  return (
    <tr className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
      {/* Mobile Layout - Collapsible */}
      <td className="p-4 md:hidden">
        <div className="space-y-3">
          {/* Progress Indicator */}
          <div className="w-full">
            <ProgressIndicator progress={progress} slotNumber={slotNumber}/>
          </div>

          {/* Collapsible Focus Selector */}
          {goal && goal.items.length > 0 ? (
            <div className="space-y-2">
              {/* Toggle Button */}
              <button
                onClick={toggleExpanded}
                className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 ease-in-out hover:shadow-sm active:scale-98"
              >
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {isExpanded ? 'Sembunyikan' : 'Tampilkan'} Task ({goal.items.length})
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
                <div className="pt-2">
                  <HorizontalGoalDisplay
                    items={goal.items}
                    onClick={() => onSlotClick(slotNumber)}
                    slotNumber={slotNumber}
                  />
                </div>
              </div>
            </div>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onSlotClick(slotNumber)}
              className="w-full justify-start"
            >
              + Tetapkan Fokus
            </Button>
          )}
        </div>
      </td>
      
      {/* Desktop Layout - Side by Side */}
      <td className={`py-4 hidden md:table-cell ${goal && goal.items.length > 0 ? 'px-4' : 'px-7'}`}>
        {goal && goal.items.length > 0 ? (
          <HorizontalGoalDisplay
            items={goal.items}
            onClick={() => onSlotClick(slotNumber)}
            slotNumber={slotNumber}
          />
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onSlotClick(slotNumber)}
            className="w-full justify-start"
          >
            + Tetapkan Fokus
          </Button>
        )}
      </td>
      
      {/* Desktop Progress Indicator */}
      <td className="py-4 px-4 w-32 hidden md:table-cell">
        <ProgressIndicator progress={progress} slotNumber={slotNumber} />
      </td>
    </tr>
  );
}
