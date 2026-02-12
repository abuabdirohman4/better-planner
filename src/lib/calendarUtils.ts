/**
 * Generates time slots for the 24-hour grid
 */
export const generateTimeSlots = (): { hour: number; label: string }[] => {
  return Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    label: `${i.toString().padStart(2, '0')}:00`,
  }));
};

/**
 * Returns a sorted list of unique hours that should be visible.
 * Includes hours overlapping with any task interval.
 */
export const getVisibleHours = (items: any[]): number[] => {
  const occupied = new Set<number>();

  items.forEach(item => {
    const start = new Date(item.start_time);
    const end = new Date(item.end_time);

    // Get start hour
    const startH = start.getHours();

    // Get end hour. If ends at :00, effectively ends at previous hour for grid purposes?
    // Actually, if task is 8:00-9:00. It occupies slot 8.
    // If task is 8:30-9:30. It occupies slot 8 and 9.
    let endH = end.getHours();
    if (end.getMinutes() > 0) {
      // If ends at 9:30, we need to show hour 9.
      // Loop goes < endH + 1
      endH += 1;
    }

    // Special case: if ends exactly at :00, the task visually ends at the start of that hour.
    // e.g. 9:00. We don't necessarily need to show hour 9 IF no other task starts there.
    // But usually we want to show the closing grid line.

    for (let h = startH; h < endH; h++) {
      occupied.add(h);
    }
  });

  // Convert to sorted array
  const hours = Array.from(occupied).sort((a, b) => a - b);

  // If no items, return default range
  if (hours.length === 0) return Array.from({ length: 10 }, (_, i) => i + 8); // 8-17 default

  return hours;
};

/**
 * Maps a real date/time to a visual Y position (pixels) based on visible hours.
 * Returns null if the time is completely outside any visible hour block.
 */
export const getVisualPosition = (dateStr: string, visibleHours: number[]): number | null => {
  const d = new Date(dateStr);
  const hour = d.getHours();
  const minute = d.getMinutes();

  // Find index of this hour in the visible list
  const index = visibleHours.indexOf(hour);

  if (index === -1) {
    // If not found, it might be the end time of a block falling on the next hour?
    // e.g. Task 8:00-9:00. Visible=[8]. End time is 9:00. 
    // We want position of start of 9 => (index of 8 + 1) * 60.

    // Check if it's exactly :00 and the previous hour is in list
    if (minute === 0 && visibleHours.includes(hour - 1)) {
      const prevIndex = visibleHours.indexOf(hour - 1);
      return (prevIndex + 1) * 60;
    }
    return null;
  }

  return index * 60 + minute;
};

/**
 * Calculates start and height for a block in the discontinuous view.
 */
export const calculateDiscontinuousStyle = (
  startTime: string,
  endTime: string,
  visibleHours: number[]
): React.CSSProperties | null => {
  const startY = getVisualPosition(startTime, visibleHours);
  const endY = getVisualPosition(endTime, visibleHours);

  if (startY === null || endY === null) return null;

  return {
    top: `${startY}px`,
    height: `${endY - startY}px`
  };
};

/**
 * Calculates the top position and height for a calendar block
 * @param startTime ISO string of start time
 * @param durationMinutes Duration in minutes
 * @param hourHeight Height of one hour in pixels
 * @returns CSSProperties for top and height
 */
export const calculateBlockStyle = (
  startTime: string,
  durationMinutes: number,
  hourHeight: number = 60
): { top: string; height: string } => {
  const date = new Date(startTime);
  const hours = date.getHours();
  const minutes = date.getMinutes();

  // Calculate total minutes from midnight
  const startMinute = hours * 60 + minutes;

  // Calculate top position (minutes * pixels per minute)
  const pixelsPerMinute = hourHeight / 60;
  const top = startMinute * pixelsPerMinute;

  // Calculate height
  const height = durationMinutes * pixelsPerMinute;

  return {
    top: `${top}px`,
    height: `${height}px`,
  };
};

/**
 * Helper to process overlapping blocks (simple version)
 * Assigns column indices to overlapping blocks
 */
export const processOverlaps = <T extends { start_time: string; duration_minutes: number }>(items: T[]): (T & { colIndex: number; maxCols: number })[] => {
  // Sort by start time
  const sorted = [...items].sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  const processed = sorted.map(item => ({ ...item, colIndex: 0, maxCols: 1 }));

  // Simple greedy algorithm for column assignment
  // This is a basic implementation; for complex schedules a full graph coloring algo might be needed
  // checking overlaps pairwise

  for (let i = 0; i < processed.length; i++) {
    const current = processed[i];
    const currentStart = new Date(current.start_time).getTime();
    const currentEnd = currentStart + current.duration_minutes * 60000;

    // Check against previous items to find overlap
    let overlaps = [];
    for (let j = 0; j < i; j++) {
      const prev = processed[j];
      const prevStart = new Date(prev.start_time).getTime();
      const prevEnd = prevStart + prev.duration_minutes * 60000;

      if (currentStart < prevEnd && currentEnd > prevStart) {
        overlaps.push(prev);
      }
    }

    if (overlaps.length > 0) {
      // Find formatting used columns
      const usedCols = new Set(overlaps.map(o => o.colIndex));
      let col = 0;
      while (usedCols.has(col)) col++;
      current.colIndex = col;
    }
  }

  // Calculate maxCols for each group of overlapping items
  // This part can be improved for "visual groups"

  return processed;
};
