"use client";
import React, { useMemo, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Button from "@/components/ui/button/Button";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";
import { ChevronLeftIcon, ChevronRightIcon } from "@/icons";

// Helper: get week of year
function getWeekOfYear(date: Date) {
  const start = new Date(date.getFullYear(), 0, 1);
  const diff = (date.getTime() - start.getTime()) / 86400000;
  // 0 = Sunday, 1 = Monday, ...
  const day = start.getDay() || 7;
  return Math.ceil((diff + day) / 7);
}

// Helper: get current quarter and year
function getCurrentQuarterYear() {
  const now = new Date();
  const week = getWeekOfYear(now);
  let quarter = 1;
  if (week >= 1 && week <= 13) quarter = 1;
  else if (week >= 14 && week <= 26) quarter = 2;
  else if (week >= 27 && week <= 39) quarter = 3;
  else quarter = 4;
  return { year: now.getFullYear(), quarter };
}

// Helper: parse q param (e.g. 2025-Q2)
function parseQParam(q: string | null): { year: number; quarter: number } {
  if (!q) return getCurrentQuarterYear();
  const match = q.match(/(\d{4})-Q([1-4])/);
  if (match) {
    return { year: parseInt(match[1]), quarter: parseInt(match[2]) };
  }
  return getCurrentQuarterYear();
}

// Helper: format q param
function formatQParam(year: number, quarter: number) {
  return `${year}-Q${quarter}`;
}

// Helper: get previous/next quarter
function getPrevQuarter(year: number, quarter: number) {
  if (quarter === 1) return { year: year - 1, quarter: 4 };
  return { year, quarter: quarter - 1 };
}
function getNextQuarter(year: number, quarter: number) {
  if (quarter === 4) return { year: year + 1, quarter: 1 };
  return { year, quarter: quarter + 1 };
}

// Helper: generate 16 quarter options (2 prev, current, 1 next year)
function generateQuarterOptions(current: { year: number; quarter: number }) {
  const options: { year: number; quarter: number }[] = [];
  const startYear = current.year - 2;
  for (let y = startYear; y <= current.year + 1; y++) {
    for (let q = 1; q <= 4; q++) {
      options.push({ year: y, quarter: q });
    }
  }
  // Sort descending (latest first)
  return options.sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.quarter - a.quarter;
  });
}

const QuarterSelector: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const qParam = searchParams.get("q");
  const { year, quarter } = parseQParam(qParam);

  // Dropdown open state (local, not for value)
  const [isOpen, setIsOpen] = useState(false);

  // Generate options for dropdown
  const options = useMemo(() => generateQuarterOptions({ year, quarter }), [year, quarter]);

  // Handler: set q param in URL
  const setQuarter = (y: number, q: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("q", formatQParam(y, q));
    router.push(`${pathname}?${params.toString()}`);
    setIsOpen(false);
  };

  // Handler: left/right
  const handlePrev = () => {
    const prev = getPrevQuarter(year, quarter);
    setQuarter(prev.year, prev.quarter);
  };
  const handleNext = () => {
    const next = getNextQuarter(year, quarter);
    setQuarter(next.year, next.quarter);
  };

  // Handler: dropdown select
  const handleSelect = (y: number, q: number) => {
    setQuarter(y, q);
  };

  return (
    <div className="flex items-center gap-2">
      <Button size="sm" variant="outline" onClick={handlePrev} aria-label="Sebelumnya">
        <ChevronLeftIcon className="w-5 h-5" />
      </Button>
      <div className="relative">
        <button
          className="flex items-center justify-center gap-1 px-4 py-2.5 rounded-lg border border-gray-400 bg-white dark:text-white dark:bg-gray-900 cursor-pointer min-w-32 dropdown-toggle"
          onClick={() => setIsOpen((v) => !v)}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span>{`Q${quarter} ${year}`}</span>
        </button>
        <Dropdown className="w-32" isOpen={isOpen} onClose={() => setIsOpen(false)}>
          <div className="max-h-64 overflow-y-auto">
            {options.map((opt) => (
              <DropdownItem
                key={formatQParam(opt.year, opt.quarter)}
                onClick={() => handleSelect(opt.year, opt.quarter)}
                className={
                  opt.year === year && opt.quarter === quarter
                    ? "bg-brand-100 dark:bg-brand-900/30 font-semibold !text-center"
                    : "!text-center"
                }
              >
                {`Q${opt.quarter} ${opt.year}`}
              </DropdownItem>
            ))}
          </div>
        </Dropdown>
      </div>
      <Button size="sm" variant="outline" onClick={handleNext} aria-label="Berikutnya">
        <ChevronRightIcon className="w-5 h-5" />
      </Button>
    </div>
  );
};

export default QuarterSelector; 