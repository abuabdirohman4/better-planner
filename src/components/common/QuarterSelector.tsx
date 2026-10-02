"use client";
import React, { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import Button from "@/components/ui/button/Button";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";
import { ChevronLeftIcon, ChevronRightIcon } from "@/lib/icons";
import { 
  getPrevQuarter, 
  getNextQuarter,
  getQuarterString,
  generateQuarterOptions,
  formatQParam,
  parseQParam
} from "@/lib/quarterUtils";
import { useQuarterStore } from "@/stores/quarterStore";

// Halaman yang tidak terikat quarter.
const HIDDEN_PATHS = ['/planning/vision', '/settings', '/habits'];
// Halaman server yang membaca quarter dari ?q=, bukan dari store.
const URL_QUARTER_PATHS = ['/execution/brain-dump', '/planning/12-week-sync', '/dashboard'];

const QuarterSelector: React.FC = () => {
  const { year, quarter, setQuarter } = useQuarterStore();
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const qParam = searchParams.get("q");
  const options = useMemo(() => generateQuarterOptions({ year, quarter }), [year, quarter]);

  // ?q= di URL menang atas store; halaman URL-driven tanpa ?q= diberi quarter dari store.
  useEffect(() => {
    if (qParam) {
      const fromUrl = parseQParam(qParam);
      if (fromUrl.year !== year || fromUrl.quarter !== quarter) setQuarter(fromUrl.year, fromUrl.quarter);
    } else if (URL_QUARTER_PATHS.some((p) => pathname.startsWith(p))) {
      router.replace(`${pathname}?q=${formatQParam(year, quarter)}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, qParam]);

  const updateURL = (newYear: number, newQuarter: number) => {
    const qParam = formatQParam(newYear, newQuarter);
    const currentPath = window.location.pathname;
    const newURL = `${currentPath}?q=${qParam}`;
    router.replace(newURL);
  };

  const handlePrev = () => {
    const prev = getPrevQuarter(year, quarter);
    setQuarter(prev.year, prev.quarter);
    updateURL(prev.year, prev.quarter);
  };
  
  const handleNext = () => {
    const next = getNextQuarter(year, quarter);
    setQuarter(next.year, next.quarter);
    updateURL(next.year, next.quarter);
  };
  
  const handleSelect = (y: number, q: number) => {
    setQuarter(y, q);
    updateURL(y, q);
    setIsOpen(false);
  };

  const handleDropdownToggle = () => {
    setIsOpen((v) => !v);
  };

  if (HIDDEN_PATHS.some((p) => pathname.startsWith(p))) return null;

  return (
    <div className="flex items-center gap-1">
      <Button size="sm" sizeClassName="p-1.5" variant="outline" onClick={handlePrev} aria-label="Sebelumnya" data-testid="quarter-prev">
        <ChevronLeftIcon className="w-5 h-5" />
      </Button>
      <div className="relative">
        <button
          className="flex items-center justify-center gap-1 px-3 py-1.5 text-sm font-medium whitespace-nowrap rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:text-white dark:bg-gray-900 cursor-pointer min-w-[84px] dropdown-toggle hover:bg-gray-50 dark:hover:bg-gray-800"
          onClick={handleDropdownToggle}
          data-testid="quarter-toggle"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span>{getQuarterString(year, quarter)}</span>
        </button>
        <Dropdown className="w-full" isOpen={isOpen} onClose={() => setIsOpen(false)}>
          <div className="max-h-64 overflow-y-auto">
            {options.map((opt) => (
              <DropdownItem
                key={`${opt.year}-Q${opt.quarter}`}
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
      <Button size="sm" sizeClassName="p-1.5" variant="outline" onClick={handleNext} aria-label="Berikutnya" data-testid="quarter-next">
        <ChevronRightIcon className="w-5 h-5" />
      </Button>
    </div>
  );
};

export default QuarterSelector; 