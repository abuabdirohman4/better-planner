"use client";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import React, { useMemo, useState } from "react";

import Button from "@/components/ui/button/Button";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";
import { ChevronLeftIcon, ChevronRightIcon } from "@/icons";
import { 
  parseQParam, 
  formatQParam, 
  getPrevQuarter, 
  getNextQuarter,
  getQuarterString,
  generateQuarterOptions
} from "@/lib/quarterUtils";

// Helper: check if QuarterSelector should be hidden based on current pathname
function shouldHideQuarterSelector(pathname: string): boolean {
  const hiddenPaths = [
    '/planning/vision',
    '/settings',
    '/profile',
  ];
  
  return hiddenPaths.some(path => pathname.startsWith(path));
}

const QuarterSelector: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const qParam = searchParams.get("q");
  const { year, quarter } = parseQParam(qParam);

  const [isOpen, setIsOpen] = useState(false);
  const options = useMemo(() => generateQuarterOptions({ year, quarter }), [year, quarter]);
  
  // Check if component should be hidden based on current pathname
  const isHidden = shouldHideQuarterSelector(pathname);

  // If component should be hidden, return null AFTER all hooks
  if (isHidden) {
    return null;
  }

  const setQuarter = (y: number, q: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("q", formatQParam(y, q));
    router.push(`${pathname}?${params.toString()}`);
    setIsOpen(false);
  };

  const handlePrev = () => {
    const prev = getPrevQuarter(year, quarter);
    setQuarter(prev.year, prev.quarter);
  };
  
  const handleNext = () => {
    const next = getNextQuarter(year, quarter);
    setQuarter(next.year, next.quarter);
  };
  
  const handleSelect = (y: number, q: number) => {
    setQuarter(y, q);
  };

  const handleDropdownToggle = () => {
    setIsOpen((v) => !v);
  };

  return (
    <div className="flex items-center gap-2">
      <Button size="sm" variant="outline" onClick={handlePrev} aria-label="Sebelumnya">
        <ChevronLeftIcon className="w-5 h-5" />
      </Button>
      <div className="relative">
        <button
          className="flex items-center justify-center gap-1 px-4 py-2.5 rounded-lg border border-gray-400 bg-white dark:text-white dark:bg-gray-900 cursor-pointer min-w-32 dropdown-toggle hover:bg-gray-50 dark:hover:bg-gray-800"
          onClick={handleDropdownToggle}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span>{getQuarterString(year, quarter)}</span>
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
                {getQuarterString(opt.year, opt.quarter)}
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