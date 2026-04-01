'use client';

import { useState, useRef } from 'react';
import type { Accomplishment } from '@/types/twelve-week-sync';

interface Props {
  accomplishments: Accomplishment[];
  onAdd: (description: string) => void;
  onRemove: (id: string) => void;
}

export default function AccomplishmentsList({ accomplishments, onAdd, onRemove }: Props) {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAdd = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setInput('');
    inputRef.current?.focus();
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {accomplishments.map((item, idx) => (
          <div key={item.id} className="flex items-start gap-2 group">
            <span className="text-xs font-bold text-gray-400 w-5 pt-0.5 shrink-0">{idx + 1}.</span>
            <span className="flex-1 text-sm font-medium text-gray-900 dark:text-white leading-relaxed">{item.description}</span>
            <button
              onClick={() => onRemove(item.id)}
              className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all p-1 -m-1"
              aria-label="Hapus"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mt-4">
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder="+ Tambah pencapaian..."
          className="flex-1 h-10 text-sm border border-gray-200 dark:border-gray-700 rounded-xl px-4 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
        />
        <button
          onClick={handleAdd}
          disabled={!input.trim()}
          className="px-4 h-10 bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold rounded-xl disabled:opacity-40 transition-all whitespace-nowrap active:scale-95"
        >
          Tambah
        </button>
      </div>

      {accomplishments.length === 0 && (
        <p className="text-sm text-gray-500 italic pb-2 text-center">Belum ada pencapaian.</p>
      )}
    </div>
  );
}
