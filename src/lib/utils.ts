import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Detects if the user is on a Mac system
 * @returns {boolean} True if running on Mac, false otherwise
 */
export function isMac(): boolean {
  if (typeof navigator === 'undefined') return false;
  return navigator.platform.toUpperCase().indexOf('MAC') >= 0;
}

/**
 * Checks if the correct modifier key is pressed for keyboard shortcuts
 * @param event - Keyboard event
 * @returns {boolean} True if the correct modifier key is pressed
 */
export function isModifierKeyPressed(event: KeyboardEvent): boolean {
  return isMac() ? event.metaKey : event.ctrlKey;
}

/**
 * Detects if the current screen size is desktop (≥ 768px)
 * @returns {boolean} True if screen width is desktop size, false otherwise
 */
export function isDesktop(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= 768;
}

/**
 * Detects if the current screen size is mobile (< 768px)
 * @returns {boolean} True if screen width is mobile size, false otherwise
 */
export function isMobile(): boolean {
  return !isDesktop();
}

/**
 * Get progress color hex code based on percentage
 * @param percentage - Progress percentage (0-100)
 * @returns Hex color code
 */
export function getProgressColor(percentage: number): string {
  if (percentage >= 75) return '#10b981'; // green-500
  if (percentage >= 30) return '#f97316'; // orange-500
  return '#ef4444'; // red-500
}

/**
 * Get progress color Tailwind class for background
 * @param percentage - Progress percentage (0-100)
 * @returns Tailwind background color class
 */
export function getProgressColorClass(percentage: number): string {
  if (percentage >= 75) return 'bg-green-500';
  if (percentage >= 30) return 'bg-orange-500';
  return 'bg-red-500';
}

/**
 * Get progress color Tailwind class for text
 * @param percentage - Progress percentage (0-100)
 * @returns Tailwind text color class
 */
export function getProgressTextColorClass(percentage: number): string {
  if (percentage >= 75) return 'text-green-600 dark:text-green-400';
  if (percentage >= 30) return 'text-orange-600 dark:text-orange-400';
  return 'text-red-600 dark:text-red-400';
}

/**
 * Get progress color Tailwind class for stroke (SVG)
 * @param percentage - Progress percentage (0-100)
 * @returns Tailwind stroke color class
 */
export function getProgressStrokeColorClass(percentage: number): string {
  if (percentage >= 75) return 'stroke-green-500';
  if (percentage >= 30) return 'stroke-orange-500';
  return 'stroke-red-500';
}

