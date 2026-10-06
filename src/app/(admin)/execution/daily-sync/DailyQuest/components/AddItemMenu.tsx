"use client";

import React, { useState } from 'react';

export type AddKind = 'MAIN_QUEST' | 'WORK_QUEST' | 'SIDE_QUEST' | 'DAILY_QUEST';

const LABELS: Record<AddKind, string> = {
  MAIN_QUEST: 'HFG',
  WORK_QUEST: 'Work',
  SIDE_QUEST: 'Side',
  DAILY_QUEST: 'Daily',
};

interface AddItemMenuProps {
  kinds: AddKind[];
  onPick: (kind: AddKind) => void;
  label?: string;
  testId?: string;
}

/** Tombol "+ Tambah" dengan pilihan jenis; tiap jenis membuka modal pemilihan yang sudah ada. */
export default function AddItemMenu({ kinds, onPick, label = 'Tambah', testId }: AddItemMenuProps) {
  const [open, setOpen] = useState(false);
  const pill = "rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700 transition-colors hover:bg-brand-200 dark:bg-brand-500/15 dark:text-brand-300";

  if (kinds.length === 1) {
    return (
      <button type="button" data-testid={testId} onClick={() => onPick(kinds[0])} className={`flex-shrink-0 ${pill}`}>
        + {label}
      </button>
    );
  }

  return (
    <div className="relative flex-shrink-0">
      <button
        type="button"
        data-testid={testId}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={pill}
      >
        + {label}
      </button>
      {open ? (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="absolute right-0 top-9 z-50 w-40 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
            {kinds.map((kind) => (
              <button
                key={kind}
                type="button"
                data-testid={`add-kind-${kind}`}
                onClick={() => {
                  setOpen(false);
                  onPick(kind);
                }}
                className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                {LABELS[kind]}
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
