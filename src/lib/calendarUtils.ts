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

    const startH = start.getHours();
    let endH = end.getHours();
    if (end.getMinutes() > 0) {
      endH += 1;
    }

    for (let h = startH; h < endH; h++) {
      occupied.add(h);
    }
  });

  const hours = Array.from(occupied).sort((a, b) => a - b);

  if (hours.length === 0) return Array.from({ length: 10 }, (_, i) => i + 8);

  return hours;
};

/**
 * Maps a real date/time to a visual Y position (pixels) based on visible hours.
 */
export const getVisualPosition = (dateStr: string, visibleHours: number[]): number | null => {
  const d = new Date(dateStr);
  const hour = d.getHours();
  const minute = d.getMinutes();

  const index = visibleHours.indexOf(hour);

  if (index === -1) {
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
 */
export const calculateBlockStyle = (
  startTime: string,
  durationMinutes: number,
  hourHeight: number = 60
): { top: string; height: string } => {
  const date = new Date(startTime);
  const hours = date.getHours();
  const minutes = date.getMinutes();

  const startMinute = hours * 60 + minutes;
  const pixelsPerMinute = hourHeight / 60;
  const top = startMinute * pixelsPerMinute;
  const height = durationMinutes * pixelsPerMinute;

  return {
    top: `${top}px`,
    height: `${height}px`,
  };
};

/**
 * Google Calendar-style overlap processing.
 * Groups overlapping items into clusters, assigns column indices,
 * and sets maxCols so each item knows its width fraction.
 */
export const processOverlaps = <T extends { start_time: string; end_time?: string; duration_minutes: number }>(items: T[]): (T & { colIndex: number; maxCols: number })[] => {
  if (items.length === 0) return [];

  const sorted = [...items].sort((a, b) => {
    const diff = new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
    if (diff !== 0) return diff;
    return b.duration_minutes - a.duration_minutes;
  });

  type ProcessedItem = T & { colIndex: number; maxCols: number; _startMs: number; _endMs: number };

  const processed: ProcessedItem[] = sorted.map(item => ({
    ...item,
    colIndex: 0,
    maxCols: 1,
    _startMs: new Date(item.start_time).getTime(),
    _endMs: item.end_time
      ? new Date(item.end_time).getTime()
      : new Date(item.start_time).getTime() + item.duration_minutes * 60000,
  }));

  const itemOverlaps = (a: ProcessedItem, b: ProcessedItem) =>
    a._startMs < b._endMs && a._endMs > b._startMs;

  // Group items into overlap clusters via BFS
  const visited = new Set<number>();
  const clusters: number[][] = [];

  for (let i = 0; i < processed.length; i++) {
    if (visited.has(i)) continue;
    const cluster: number[] = [];
    const queue = [i];
    visited.add(i);

    while (queue.length > 0) {
      const idx = queue.shift()!;
      cluster.push(idx);
      for (let j = 0; j < processed.length; j++) {
        if (visited.has(j)) continue;
        if (itemOverlaps(processed[idx], processed[j])) {
          visited.add(j);
          queue.push(j);
        }
      }
    }
    clusters.push(cluster);
  }

  // Assign columns within each cluster
  for (const cluster of clusters) {
    cluster.sort((a, b) => processed[a]._startMs - processed[b]._startMs);
    let maxCol = 0;

    for (let ci = 0; ci < cluster.length; ci++) {
      const idx = cluster[ci];
      const usedCols = new Set<number>();

      for (let cj = 0; cj < ci; cj++) {
        const otherIdx = cluster[cj];
        if (itemOverlaps(processed[idx], processed[otherIdx])) {
          usedCols.add(processed[otherIdx].colIndex);
        }
      }

      let col = 0;
      while (usedCols.has(col)) col++;
      processed[idx].colIndex = col;
      if (col > maxCol) maxCol = col;
    }

    const totalCols = maxCol + 1;
    for (const idx of cluster) {
      processed[idx].maxCols = totalCols;
    }
  }

  return processed.map(({ _startMs, _endMs, ...rest }) => rest as T & { colIndex: number; maxCols: number });
};
