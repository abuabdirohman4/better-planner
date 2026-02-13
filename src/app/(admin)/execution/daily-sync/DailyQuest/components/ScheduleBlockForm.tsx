import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import Label from "@/components/form/Label";
import { Slider } from "@/components/ui/slider";
import {
  calculateEndTime,
  formatTimeRange,
  SESSION_DURATION_MINUTES
} from "../utils/scheduleUtils";

// Generate 15-minute interval time options
const TIME_OPTIONS: { label: string; hours: number; minutes: number }[] = [];
for (let h = 0; h < 24; h++) {
  for (let m = 0; m < 60; m += 15) {
    const label = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    TIME_OPTIONS.push({ label, hours: h, minutes: m });
  }
}

interface TimePickerDropdownProps {
  value: string; // "HH:mm" format
  onChange: (hours: number, minutes: number) => void;
  label?: string;
}

function TimePickerDropdown({ value, onChange, label }: TimePickerDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll to current time when opened
  useEffect(() => {
    if (isOpen && listRef.current) {
      const [h, m] = value.split(':').map(Number);
      const index = h * 4 + Math.floor(m / 15);
      const itemHeight = 36; // approx height per item
      listRef.current.scrollTop = Math.max(0, (index - 2) * itemHeight);
    }
  }, [isOpen, value]);

  const handleSelect = (hours: number, minutes: number) => {
    onChange(hours, minutes);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm text-left hover:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
      >
        <span className="font-medium">{value}</span>
        <svg className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div
          ref={listRef}
          className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1"
        >
          {TIME_OPTIONS.map((opt) => {
            const isSelected = opt.label === value;
            return (
              <button
                key={opt.label}
                type="button"
                onClick={() => handleSelect(opt.hours, opt.minutes)}
                className={`w-full text-left px-3 py-2 text-sm transition-colors ${isSelected
                    ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 font-medium'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface ScheduleBlockFormProps {
  initialStartTime?: string;
  initialEndTime?: string;
  initialSessionCount?: number;
  maxSessions: number;
  focusDuration?: number;
  isChecklist?: boolean;
  onSave: (data: { startTime: string; sessionCount: number; duration: number; endTime: string }) => void;
  onCancel: () => void;
}

export function ScheduleBlockForm({
  initialStartTime,
  initialEndTime,
  initialSessionCount = 1,
  maxSessions,
  focusDuration = SESSION_DURATION_MINUTES,
  isChecklist = false,
  onSave,
  onCancel,
}: ScheduleBlockFormProps) {
  // ✅ TIMEZONE-AWARE: Initialize with current WIB time rounded to next 15 min
  const getDefaultStartTime = () => {
    if (initialStartTime) {
      // Parse UTC timestamp and convert to local Date object
      return new Date(initialStartTime);
    }
    // Get current local time (WIB in Indonesia)
    const now = new Date();
    const minutes = now.getMinutes();
    const roundedMinutes = Math.ceil(minutes / 15) * 15;
    now.setMinutes(roundedMinutes);
    now.setSeconds(0);
    now.setMilliseconds(0);
    return now;
  };

  const getDefaultEndTime = () => {
    if (initialEndTime) {
      // Parse UTC timestamp and convert to local Date object
      return new Date(initialEndTime);
    }
    const start = getDefaultStartTime();
    // Default end time: start + 30 minutes for checklist
    return new Date(start.getTime() + 30 * 60000);
  };

  const [startDate, setStartDate] = useState<Date>(getDefaultStartTime());
  const [endDate, setEndDate] = useState<Date>(getDefaultEndTime());
  const [sessionCount, setSessionCount] = useState(initialSessionCount);

  // Format for dropdown display
  const startTimeString = format(startDate, "HH:mm");
  const endTimeString = format(endDate, "HH:mm");

  const handleStartTimeChange = (hours: number, minutes: number) => {
    // ✅ TIMEZONE FIX: Preserve date, only change time (hours & minutes)
    const newDate = new Date(startDate);
    newDate.setHours(hours);
    newDate.setMinutes(minutes);
    newDate.setSeconds(0);
    newDate.setMilliseconds(0);
    setStartDate(newDate);

    // For checklist, auto-adjust end time if it's before start
    if (isChecklist && newDate >= endDate) {
      const newEnd = new Date(newDate.getTime() + 30 * 60000);
      setEndDate(newEnd);
    }
  };

  const handleEndTimeChange = (hours: number, minutes: number) => {
    // ✅ TIMEZONE FIX: Preserve date, only change time (hours & minutes)
    const newDate = new Date(endDate);
    newDate.setHours(hours);
    newDate.setMinutes(minutes);
    newDate.setSeconds(0);
    newDate.setMilliseconds(0);
    // Ensure end is after start
    if (newDate > startDate) {
      setEndDate(newDate);
    }
  };

  // Calculate values based on mode
  const checklistDuration = Math.max(5, Math.round((endDate.getTime() - startDate.getTime()) / 60000));
  const sessionDuration = sessionCount * focusDuration;
  const sessionEndTime = calculateEndTime(startDate.toISOString(), sessionCount, focusDuration);

  const currentDuration = isChecklist ? checklistDuration : sessionDuration;
  const currentEndTimeStr = isChecklist ? endDate.toISOString() : sessionEndTime;

  // ✅ TIMEZONE-AWARE: Convert local WIB time to UTC for storage
  const convertLocalToUTC = (localDate: Date): string => {
    // localDate is in WIB timezone (browser local time)
    // toISOString() automatically converts to UTC
    // This is correct: 17:00 WIB → 10:00 UTC same day
    return localDate.toISOString();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      startTime: convertLocalToUTC(startDate),
      sessionCount: isChecklist ? 1 : sessionCount,
      duration: currentDuration,
      endTime: isChecklist ? convertLocalToUTC(endDate) : currentEndTimeStr,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-card/50">
      {isChecklist ? (
        // Checklist Mode: Start Time + End Time dropdowns
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Start Time</Label>
              <TimePickerDropdown
                value={startTimeString}
                onChange={handleStartTimeChange}
              />
            </div>
            <div className="space-y-2">
              <Label>End Time</Label>
              <TimePickerDropdown
                value={endTimeString}
                onChange={handleEndTimeChange}
              />
            </div>
          </div>

          <div className="p-3 bg-muted rounded-md text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Duration:</span>
              <span>{checklistDuration} min</span>
            </div>
            <div className="flex justify-between font-medium">
              <span className="text-muted-foreground">Time Range:</span>
              <span>{formatTimeRange(startDate.toISOString(), endDate.toISOString())}</span>
            </div>
          </div>
        </>
      ) : (
        // Session Mode: Start Time + Session Slider
        <>
          <div className="space-y-2">
            <Label>Start Time</Label>
            <TimePickerDropdown
              value={startTimeString}
              onChange={handleStartTimeChange}
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>Sessions</Label>
              <span className="text-sm font-medium">{sessionCount} / {maxSessions} available</span>
            </div>
            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant="outline"
                sizeClassName="w-8 h-8 p-0 text-sm"
                onClick={() => setSessionCount(Math.max(1, sessionCount - 1))}
                disabled={sessionCount <= 1}
              >
                -
              </Button>
              <div className="flex-1">
                <Slider
                  value={[sessionCount]}
                  min={1}
                  max={maxSessions}
                  step={1}
                  onValueChange={(vals) => setSessionCount(vals[0])}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                sizeClassName="w-8 h-8 p-0 text-sm"
                onClick={() => setSessionCount(Math.min(maxSessions, sessionCount + 1))}
                disabled={sessionCount >= maxSessions}
              >
                +
              </Button>
            </div>
          </div>

          <div className="p-3 bg-muted rounded-md text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Duration:</span>
              <span>{sessionCount} sessions × {focusDuration}m = {sessionDuration}m</span>
            </div>
            <div className="flex justify-between font-medium">
              <span className="text-muted-foreground">Time Range:</span>
              <span>{formatTimeRange(startDate.toISOString(), sessionEndTime)}</span>
            </div>
          </div>
        </>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="plain" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          Save Block
        </Button>
      </div>
    </form>
  );
}
