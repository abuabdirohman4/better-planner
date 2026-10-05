'use client';

import { useEffect, useRef, useState } from 'react';
import type { Quote } from '@/lib/quotes';
import type { VisionSlide } from '../actions/home/logic';

type Term = 't35' | 't10';
const KEY = 'bp-hero-carousel';
const AUTOPLAY_MS = 8000;

export default function HeroCarousel({ quote, visions }: { quote: Quote; visions: VisionSlide[] }) {
  const [index, setIndex] = useState(0);
  const [term, setTerm] = useState<Term>('t35');
  const touchX = useRef<number | null>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem(KEY) ?? 'null');
      if (s && Number.isInteger(s.index) && s.index >= 0) setIndex(s.index);
      if (s && (s.term === 't35' || s.term === 't10')) setTerm(s.term);
    } catch { /* abaikan */ }
  }, []);

  const save = (i: number, t: Term) => {
    try { localStorage.setItem(KEY, JSON.stringify({ index: i, term: t })); } catch { /* abaikan */ }
  };

  const filled = visions.filter((v) => v[term]);
  const count = 1 + filled.length;
  const cur = Math.min(index, count - 1);
  const go = (i: number) => { const n = (i + count) % count; setIndex(n); save(n, term); };
  const pick = (t: Term) => { setTerm(t); save(cur, t); };
  const slide = cur === 0 ? null : filled[cur - 1];

  // Geser otomatis; jeda saat disentuh/di-hover/difokus, mati bila user minta kurangi gerakan.
  useEffect(() => {
    if (paused || count < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = setTimeout(() => setIndex((cur + 1) % count), AUTOPLAY_MS);
    return () => clearTimeout(id);
  }, [paused, count, cur]);

  return (
    <div className="mt-3 max-w-2xl"
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}
      onTouchStart={(e) => { touchX.current = e.touches[0].clientX; setPaused(true); }}
      onTouchEnd={(e) => {
        setPaused(false);
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        touchX.current = null;
        if (Math.abs(dx) > 40) go(cur + (dx < 0 ? 1 : -1));
      }}>
      <div className="flex h-7 items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-500" data-testid="hero-carousel-label">
          {slide ? `Visi · ${slide.area}` : 'Quote hari ini'}
        </p>
        <div className="flex items-center gap-1">
          {slide && (
            <div className="mr-1 inline-flex rounded-full border border-gray-200 dark:border-gray-700 p-0.5 text-[11px] font-semibold">
              {([['t35', '3–5 tahun'], ['t10', '10 tahun']] as const).map(([k, l]) => (
                <button key={k} type="button" onClick={() => pick(k)} aria-pressed={term === k}
                  className={`rounded-full px-2 py-0.5 ${term === k ? 'bg-brand-500 text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>{l}</button>
              ))}
            </div>
          )}
          <button type="button" aria-label="Sebelumnya" onClick={() => go(cur - 1)}
            className="hidden md:inline-flex h-6 w-6 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10">‹</button>
          <button type="button" aria-label="Berikutnya" onClick={() => go(cur + 1)}
            className="hidden md:inline-flex h-6 w-6 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10">›</button>
        </div>
      </div>
      {/* Semua slide ditumpuk di satu sel grid: tinggi = slide terpanjang, tanpa lompat & tanpa ruang kosong. */}
      <div className="mt-1 grid">
        {[null, ...filled].map((v, i) => (
          <div key={v ? v.area : 'quote'} aria-hidden={i !== cur}
            className={`col-start-1 row-start-1 transition-opacity duration-300 ${i === cur ? 'opacity-100' : 'invisible opacity-0'}`}>
            <p className="line-clamp-4 text-sm md:text-base text-gray-600 dark:text-gray-400">“{v ? v[term] : quote.text}”</p>
            {!v && <p className="mt-1 text-xs text-gray-500">— {quote.author}</p>}
          </div>
        ))}
      </div>
      <div className="mt-1 flex items-center gap-1.5">
        {Array.from({ length: count }, (_, i) => (
          <button key={i} type="button" aria-label={`Slide ${i + 1} dari ${count}`} aria-current={i === cur ? 'true' : undefined}
            onClick={() => go(i)} className="p-1">
            <span className={`block h-1.5 rounded-full transition-all ${i === cur ? 'w-4 bg-brand-500' : 'w-1.5 bg-gray-300 dark:bg-gray-700'}`} />
          </button>
        ))}
      </div>
    </div>
  );
}
