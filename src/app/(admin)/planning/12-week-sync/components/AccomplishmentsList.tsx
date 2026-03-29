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
    <div className="space-y-2">
      {accomplishments.map((item, idx) => (
        <div key={item.id} className="flex items-center gap-2 group">
          <span className="text-sm text-gray-400 w-5 shrink-0">{idx + 1}.</span>
          <span className="flex-1 text-sm text-gray-900 dark:text-white">{item.description}</span>
          <button
            onClick={() => onRemove(item.id)}
            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity text-lg leading-none"
            aria-label="Hapus"
          >
            ×
          </button>
        </div>
      ))}

      <div className="flex gap-2 mt-2">
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder="+ Tambah pencapaian... (Enter untuk simpan)"
          className="flex-1 text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleAdd}
          disabled={!input.trim()}
          className="px-3 py-2 bg-blue-500 text-white text-sm rounded-lg disabled:opacity-40 hover:bg-blue-600 transition-colors"
        >
          Tambah
        </button>
      </div>

      <p className="text-xs text-gray-400">
        {accomplishments.length}/10 pencapaian.{' '}
        {accomplishments.length < 5 && 'Target minimal 5 item.'}
      </p>
    </div>
  );
}
