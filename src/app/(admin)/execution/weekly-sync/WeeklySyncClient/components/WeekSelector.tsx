import React from 'react';
import Button from '@/components/ui/button/Button';
import { Dropdown } from '@/components/ui/dropdown/Dropdown';
import { DropdownItem } from '@/components/ui/dropdown/DropdownItem';

import type { WeekSelectorProps } from '../types';

export function WeekSelector({ 
  displayWeek, 
  totalWeeks, 
  isWeekDropdownOpen, 
  setIsWeekDropdownOpen, 
  handleSelectWeek, 
  goPrevWeek, 
  goNextWeek 
}: WeekSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <Button size="sm" variant="outline" onClick={goPrevWeek} disabled={displayWeek <= 1}>
        &lt;
      </Button>
      <div className="relative">
        <button
          className="flex items-center justify-center gap-1 px-8 py-2.5 rounded-lg border border-gray-400 bg-white dark:text-white dark:bg-gray-900 cursor-pointer min-w-24 dropdown-toggle hover:bg-gray-50 dark:hover:bg-gray-800"
          onClick={() => setIsWeekDropdownOpen(!isWeekDropdownOpen)}
          aria-haspopup="listbox"
          aria-expanded={isWeekDropdownOpen}
        >
          <span>Week {displayWeek}</span>
        </button>
        <Dropdown className="w-28 !right-1" isOpen={isWeekDropdownOpen} onClose={() => setIsWeekDropdownOpen(false)}>
          <div className="max-h-64 overflow-y-auto">
            {Array.from({ length: totalWeeks }, (_, i) => (
              <DropdownItem
                key={i + 1}
                onClick={() => handleSelectWeek(i + 1)}
                className={displayWeek === i + 1 ? "bg-brand-100 dark:bg-brand-900/30 font-semibold !text-center" : "!text-center"}
              >
                Week {i + 1}
              </DropdownItem>
            ))}
          </div>
        </Dropdown>
      </div>
      <Button size="sm" variant="outline" onClick={goNextWeek} disabled={displayWeek >= totalWeeks}>
        &gt;
      </Button>
    </div>
  );
}
