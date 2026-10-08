"use client";

import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { notifyActivityLogsChanged } from '@/lib/swr';
import { setActivityLogJournalField } from '../PomodoroTimer/actions/timerSessionActions';

type Field = 'what_done' | 'what_think';

/** Satu isian OMJ: tumbuh mengikuti isi, tersimpan 800 ms setelah berhenti mengetik. */
function JournalField({ logId, field, label, initial, placeholder, onStatus, compact }: {
  logId: string; field: Field; label: string; initial: string; placeholder: string; compact: boolean;
  onStatus: (s: 'saving' | 'saved' | 'idle') => void;
}) {
  const [text, setText] = useState(initial);
  const ref = useRef<HTMLTextAreaElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Isi ulang dari server hanya saat tidak sedang diketik; kalau tidak, hasil refetch setelah simpan
  // menimpa ketikan terbaru dan kursor melompat ke akhir.
  useEffect(() => {
    const typing = document.activeElement === ref.current || timer.current !== null;
    if (!typing) setText(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial]);
  useEffect(() => setText(initial), [logId]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [text]);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const change = (v: string) => {
    setText(v);
    onStatus('saving');
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      timer.current = null;
      try {
        await setActivityLogJournalField(logId, field, v);
        onStatus('saved');
        notifyActivityLogsChanged();
      } catch {
        onStatus('idle');
        toast.error('Gagal menyimpan jurnal');
      }
    }, 800);
  };

  return (
    <label className="block">
      {compact ? <span className="sr-only">{label}</span> : <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">{label}</span>}
      <textarea
        ref={ref}
        rows={1}
        value={text}
        onChange={(e) => change(e.target.value)}
        data-testid={`journal-${field}-${logId}`}
        placeholder={compact ? `${label}?` : placeholder}
        className="mt-1 w-full resize-none overflow-hidden rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:border-brand-400 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
      />
    </label>
  );
}

/** Dua pertanyaan One Minute Journal satu siklus (app-2pxn); `compact` = label jadi teks samar di kotak. */
export default function JournalFields({ logId, whatDone, whatThink, onStatus = () => {}, compact = false }: {
  logId: string; whatDone: string | null | undefined; whatThink: string | null | undefined;
  onStatus?: (s: 'saving' | 'saved' | 'idle') => void; compact?: boolean;
}) {
  return (
    <div className="space-y-2">
      <JournalField logId={logId} field="what_done" label="Apa yang diselesaikan" initial={whatDone ?? ''} placeholder="Apa yang selesai di siklus ini?" onStatus={onStatus} compact={compact} />
      <JournalField logId={logId} field="what_think" label="Yang masih dipikirkan" initial={whatThink ?? ''} placeholder="Ide, hambatan, atau langkah berikutnya" onStatus={onStatus} compact={compact} />
    </div>
  );
}
