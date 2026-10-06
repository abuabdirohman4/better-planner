import React from 'react';

interface DailyCardShellProps {
  testId: string;
  icon: React.ReactNode;
  title: string;
  hint?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}

/** Kartu bagian Daily Sync: ikon-dalam-kotak + judul, aksi di kanan (docs/design-system.md). */
export default function DailyCardShell({ testId, icon, title, hint, action, children }: DailyCardShellProps) {
  return (
    <section
      data-testid={testId}
      className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03] md:p-6"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-500 dark:bg-brand-500/15">
            {icon}
          </span>
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
            {hint ? <p className="text-xs text-gray-500">{hint}</p> : null}
          </div>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
