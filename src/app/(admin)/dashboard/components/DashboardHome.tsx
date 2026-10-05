import Link from 'next/link';
import { CheckCircleIcon, TaskIcon, TimeIcon, ShootingStarIcon } from '@/lib/icons';
import type { DashboardHome as Data } from '../actions/home/actions';
import HeroCarousel from './HeroCarousel';
import ExpandableText from './ExpandableText';
import type { HfgStepCard, HabitDay } from '../actions/home/logic';

const card = 'rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] shadow-sm';

function Ring({ percent, size, stroke, className, children }: { percent: number; size: number; stroke: number; className?: string; children?: React.ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className={`relative shrink-0 ${className ?? ''}`} style={className ? undefined : { width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full -rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-brand-100 dark:stroke-gray-800" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} strokeLinecap="round"
          className="stroke-brand-500 transition-[stroke-dashoffset] duration-700" strokeDasharray={c} strokeDashoffset={c * (1 - percent / 100)} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  );
}

function Hero({ data }: { data: Data }) {
  const done = data.hfg.reduce((s, c) => s + c.done, 0);
  const total = data.hfg.reduce((s, c) => s + c.total, 0);
  const percent = total ? Math.round((done / total) * 100) : 0;
  return (
    <section data-testid="dashboard-greeting"
      className={`${card} relative overflow-hidden bg-gradient-to-br from-brand-50 via-white to-white dark:from-brand-950/40 dark:via-transparent dark:to-transparent p-5 md:p-8`}>
      <div className="flex gap-6 md:items-center md:justify-between">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-brand-500">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />{data.dateLabel}
          </p>
          <h1 className="mt-2 text-2xl md:text-4xl font-bold tracking-tight text-gray-900 dark:text-white">{data.greeting}</h1>
          <HeroCarousel quote={data.quote} visions={data.visions} />
          <div className="mt-4 flex flex-wrap gap-2">
            {data.isCurrentQuarter ? (
              <span className="inline-flex items-center rounded-full bg-brand-100 dark:bg-brand-500/15 px-3 py-1 text-xs font-semibold text-brand-700 dark:text-brand-300">
                {data.weekLabel}
              </span>
            ) : (
              <span data-testid="dashboard-viewing-other-quarter" className="inline-flex items-center gap-2 rounded-full bg-amber-50 dark:bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300">
                Sedang melihat {data.viewed.label}
                <Link href={`/dashboard?q=${data.currentQParam}`} className="underline underline-offset-2 hover:no-underline">Kembali ke kuartal ini</Link>
              </span>
            )}
          </div>
        </div>
        {total > 0 && (
          <div className="hidden md:flex flex-col items-center gap-2">
            <Ring percent={percent} size={140} stroke={14}>
              <span className="text-4xl font-extrabold text-brand-500 leading-none">{done}<span className="text-base font-semibold text-brand-400">/{total}</span></span>
              <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-gray-500">langkah HFG</span>
            </Ring>
            <p className="text-xs text-gray-500 text-center max-w-[10rem]">Langkah selesai dari 3 HFG {data.isCurrentQuarter ? 'kuartal ini' : data.viewed.label}</p>
          </div>
        )}
      </div>
    </section>
  );
}

function Stat({ icon, tone, value, unit, label, href }: { icon: React.ReactNode; tone: string; value: React.ReactNode; unit?: string; label: string; href: string }) {
  return (
    <Link href={href} className={`${card} p-4 md:p-5 hover:shadow-md transition-shadow`}>
      <span className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${tone}`}>{icon}</span>
      <p className="mt-3 text-3xl font-bold text-gray-900 dark:text-white leading-none">
        {value}{unit && <span className="text-base font-semibold text-gray-500">{unit}</span>}
      </p>
      <p className="mt-1 text-sm text-gray-500">{label}</p>
    </Link>
  );
}

function AreaSpark({ days }: { days: HabitDay[] }) {
  const w = 300, h = 60;
  const pts = days.map((d, i) => [(i / Math.max(1, days.length - 1)) * w, h - (d.percent / 100) * (h - 6) - 3]);
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-16 w-full overflow-visible" role="img"
      aria-label="Persentase habit selesai 14 hari terakhir">
      <defs>
        <linearGradient id="habit-area" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--color-brand-500)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="var(--color-brand-500)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L${w},${h} L0,${h} Z`} fill="url(#habit-area)" />
      <path d={line} fill="none" stroke="var(--color-brand-500)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function HabitToday({ days }: { days: HabitDay[] }) {
  const today = days[days.length - 1] ?? { done: 0, scheduled: 0, percent: 0 };
  return (
    <section data-testid="dashboard-habit-summary" className={`${card} p-5 md:p-6`}>
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-white">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-500/15">
            <CheckCircleIcon className="h-6 w-6 text-brand-500" />
          </span>
          Habit Hari Ini
        </h2>
        <Link href="/habits/today" className="rounded-full bg-brand-50 dark:bg-brand-500/15 px-3 py-1 text-xs font-semibold text-brand-600 dark:text-brand-300 hover:bg-brand-100">
          Buka habit →
        </Link>
      </div>
      <div className="mt-5 grid grid-cols-[auto_1fr] items-center gap-x-5 gap-y-4 md:gap-x-6">
        <Ring percent={today.percent} size={128} stroke={14} className="h-24 w-24 md:h-32 md:w-32 md:row-span-2">
          <span className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white leading-none">{today.done}<span className="text-sm md:text-base font-semibold text-gray-500">/{today.scheduled}</span></span>
          <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-gray-500">selesai</span>
        </Ring>
        <div className="min-w-0">
          <p className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white leading-none">{today.percent}<span className="text-lg md:text-xl font-semibold text-gray-500">%</span></p>
          <p className="mt-1 text-xs text-gray-500">{today.done}/{today.scheduled} habit selesai</p>
        </div>
        <div className="col-span-2 md:col-span-1 md:col-start-2 min-w-0">
          <div className="h-3 w-full rounded-full bg-brand-50 dark:bg-gray-800">
            <div className="h-3 rounded-full bg-gradient-to-r from-brand-600 to-brand-400 transition-[width] duration-700" style={{ width: `${today.percent}%` }} />
          </div>
          <p className="mt-3 text-right text-xs text-gray-500">14 hari terakhir</p>
          <div className="mt-1"><AreaSpark days={days} /></div>
        </div>
      </div>
    </section>
  );
}

function HfgCard({ c, rank, current }: { c: HfgStepCard; rank: number; current: boolean }) {
  return (
    <div data-testid="dashboard-hfg-step-card" className="flex flex-col rounded-xl border border-gray-200 dark:border-gray-800 p-4 hover:border-brand-300 transition-colors">
      <div className="flex items-center gap-3">
        <Ring percent={c.percent} size={64} stroke={7}>
          <span className="text-xs font-bold text-gray-900 dark:text-white">{c.percent}%</span>
        </Ring>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-500">HFG #{rank}</p>
          <p className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2" title={c.title}>{c.title}</p>
          <p className="text-xs text-gray-500 mt-0.5">{c.done} dari {c.total} langkah</p>
        </div>
      </div>
      {c.motivation ? (
        <div className="mt-3"><ExpandableText text={c.motivation} className="text-sm italic text-gray-600 dark:text-gray-400" /></div>
      ) : (
        <Link href="/planning/main-quests" className="mt-3 text-xs font-semibold text-brand-500 hover:underline">Tulis motivasi →</Link>
      )}
      {c.next ? (
        <div className="mt-4 flex flex-1 flex-col rounded-lg bg-gray-50 dark:bg-white/[0.03] p-3">
          <p className="text-xs text-gray-500">Berikutnya · {c.next.milestoneTitle}</p>
          <p className="mt-0.5 text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2" title={c.next.title}>{c.next.title}</p>
          {current && <div className="mt-auto pt-3 flex items-center justify-between gap-2 text-xs">
            {c.next.planned ? (
              <>
                <span className="text-green-600 dark:text-green-400">✓ Ada di rencana minggu ini</span>
                <Link href="/execution/daily-sync" className="font-semibold text-brand-500 hover:underline whitespace-nowrap">Daily Sync →</Link>
              </>
            ) : (
              <>
                <span className="text-gray-500">Belum direncanakan minggu ini</span>
                <Link href="/execution/weekly-sync" className="font-semibold text-brand-500 hover:underline whitespace-nowrap">Weekly Sync →</Link>
              </>
            )}
          </div>}
        </div>
      ) : (
        <p className="mt-4 text-sm text-green-600 dark:text-green-400">Semua langkah selesai 🎉</p>
      )}
    </div>
  );
}

export default function DashboardHome({ data }: { data: Data }) {
  const today = data.habitDays[data.habitDays.length - 1] ?? { done: 0, scheduled: 0 };
  const hfgDone = data.hfg.reduce((s, c) => s + c.done, 0);
  const hfgTotal = data.hfg.reduce((s, c) => s + c.total, 0);
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <Hero data={data} />

      {data.isCurrentQuarter && <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Stat href="/planning/main-quests" tone="bg-brand-50 text-brand-500 dark:bg-brand-500/15" icon={<ShootingStarIcon className="h-6 w-6" />}
          value={hfgDone} unit={`/${hfgTotal}`} label="Langkah HFG" />
        <Stat href="/habits/today" tone="bg-green-50 text-green-600 dark:bg-green-500/15" icon={<CheckCircleIcon className="h-6 w-6" />}
          value={today.done} unit={`/${today.scheduled}`} label="Habit hari ini" />
        <Stat href="/execution/daily-sync" tone="bg-blue-50 text-blue-600 dark:bg-blue-500/15" icon={<TimeIcon className="h-6 w-6" />}
          value={data.focusMinutesToday} unit=" mnt" label="Fokus hari ini" />
        <Stat href="/execution/daily-sync" tone="bg-purple-50 text-purple-600 dark:bg-purple-500/15" icon={<TaskIcon className="h-6 w-6" />}
          value={data.tasksToday.done} unit={`/${data.tasksToday.total}`} label="Tugas hari ini" />
      </div>

      <HabitToday days={data.habitDays} />
      </>}

      {data.hfg.length === 0 ? (
        <section className={`${card} p-5 md:p-6 text-sm text-gray-500`}>
          Belum ada HFG di {data.viewed.label}.{' '}
          <Link href="/planning/main-quests" className="font-semibold text-brand-500 hover:underline">Atur di Main Quests →</Link>
        </section>
      ) : (
        <section data-testid="dashboard-hfg-steps" className={`${card} p-5 md:p-6`}>
          <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-white mb-4">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-500/15">
              <ShootingStarIcon className="h-6 w-6 text-brand-500" />
            </span>
            Progress HFG{!data.isCurrentQuarter && <span className="text-sm font-normal text-gray-500">· {data.viewed.label}</span>}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.hfg.map((c, i) => <HfgCard key={c.questId} c={c} rank={i + 1} current={data.isCurrentQuarter} />)}
          </div>
        </section>
      )}
    </div>
  );
}
