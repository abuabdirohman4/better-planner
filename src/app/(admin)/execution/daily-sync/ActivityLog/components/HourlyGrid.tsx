import React from 'react';

interface HourlyGridProps {
  visibleHours?: number[];
  startHour?: number; // legacy/fallback
  endHour?: number;   // legacy/fallback
}

const HourlyGrid: React.FC<HourlyGridProps> = ({ visibleHours, startHour = 0, endHour = 24 }) => {
  // If visibleHours provided, use it. Otherwise fallback to range.
  let hoursToRender = visibleHours;

  if (!hoursToRender) {
    hoursToRender = [];
    for (let h = startHour; h < endHour; h++) hoursToRender.push(h);
  }

  const totalHeight = hoursToRender.length * 60;

  return (
    <div className="absolute top-0 left-0 w-full pointer-events-none" style={{ height: `${totalHeight}px` }}>
      {hoursToRender.map((hour, index) => (
        <div
          key={hour}
          className="absolute w-full border-t border-gray-300 dark:border-gray-700"
          // index * 60 because we are stacking the visible rows 
          style={{ top: `${index * 60}px`, height: '60px' }}
        >
          {/* GCal style: Label is physically on the grid line. 
              Top 0 is the line. To center text vertically on line: -translate-y-1/2.
          */}
          <span className="absolute top-0 left-0 -ml-12 w-10 text-right text-xs text-gray-500 dark:text-gray-400 font-medium -translate-y-1/2">
            {formatHour(hour)}
          </span>
        </div>
      ))}

      {/* Bottom border for the last slot */}
      <div
        className="absolute w-full border-t border-gray-100 dark:border-gray-700"
        style={{ top: `${totalHeight}px` }}
      >
        {/* Optional: Label for the closing hour? usually GCal doesn't show closing label for day view unless scrolling */}
        <span className="absolute left-0 -ml-12 w-10 text-right text-xs text-gray-500 dark:text-gray-400 font-medium -translate-y-1/2">
          {formatHour(hoursToRender[hoursToRender.length - 1] + 1)}
        </span>
      </div>
    </div>
  );
};

// Helper for formatting
const formatHour = (h: number) => `${h.toString().padStart(2, '0')}:00`;

export default HourlyGrid;
