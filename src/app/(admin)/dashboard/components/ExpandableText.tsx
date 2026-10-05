'use client';

import { useEffect, useRef, useState } from 'react';

export default function ExpandableText({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [open, setOpen] = useState(false);
  const [clamped, setClamped] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (el && !open) setClamped(el.scrollHeight > el.clientHeight + 1);
  }, [text, open]);

  return (
    <div>
      <p ref={ref} className={`${className ?? ''} ${open ? '' : 'line-clamp-2'}`}>“{text}”</p>
      {(clamped || open) && (
        <button type="button" onClick={() => setOpen(!open)} className="mt-0.5 text-xs font-semibold text-brand-500 hover:underline">
          {open ? 'tutup' : 'lihat semua'}
        </button>
      )}
    </div>
  );
}
