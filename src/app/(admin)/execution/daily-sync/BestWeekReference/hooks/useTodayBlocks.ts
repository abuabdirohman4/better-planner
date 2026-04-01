import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { getActiveTemplate, getBlocksForTemplate } from '@/app/(admin)/planning/best-week/actions';
import type { BestWeekBlock, DayCode } from '@/lib/best-week/types';

function getTodayDayCode(): DayCode {
  const day = new Date().getDay(); // 0=Sun, 1=Mon, ...
  const map: DayCode[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  return map[day];
}

export function useTodayBlocks() {
  const [now, setNow] = useState(new Date());
  const { data: template } = useSWR('best-week-active-template', getActiveTemplate);

  const { data: blocks } = useSWR(
    template?.id ? `best-week-blocks-${template.id}` : null,
    () => getBlocksForTemplate(template!.id)
  );

  // Update current time every 30 seconds to ensure highlight changes automatically
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const todayCode = getTodayDayCode();
  const todayBlocks: BestWeekBlock[] = (blocks ?? [])
    .filter(b => b.days.includes(todayCode))
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  const getCurrentBlock = (): BestWeekBlock | null => {
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:00`;
    return todayBlocks.find(b => b.start_time <= currentTime && b.end_time > currentTime) ?? null;
  };

  return {
    todayBlocks,
    currentBlock: getCurrentBlock(),
    todayCode,
    hasTemplate: !!template,
    isLoading: template === undefined,
  };
}

