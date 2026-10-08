import React from 'react';

/** Baris kosong bergaris putus seperti slot di buku; dipakai Daily Focus & Tugas Lain. */
export default function EmptySlots({ count, testId }: { count: number; testId: string }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={`slot-${i}`}
          data-testid={testId}
          className="mb-2 flex items-center gap-3 rounded-lg border border-dashed border-gray-200 px-3 py-2.5 dark:border-gray-700"
        >
          <span className="h-6 w-6 flex-shrink-0 rounded-md border-2 border-gray-200 dark:border-gray-700" aria-hidden />
          <span className="flex-1 border-b border-dotted border-gray-300 dark:border-gray-600" aria-hidden />
        </div>
      ))}
    </>
  );
}
