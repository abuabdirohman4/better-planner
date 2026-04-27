"use client";

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import RichTextEditor from '@/components/ui/rich-text-editor/RichTextEditor';
import Button from '@/components/ui/button/Button';
import type { BrainDumpItem } from '@/types/brain-dump';

interface DayBrainDumpProps {
  date: string;                          // "YYYY-MM-DD"
  existingDump: BrainDumpItem | undefined;
  saveDump: (date: string, content: string) => Promise<void>;
  isSaving: boolean;
}

const DayBrainDump: React.FC<DayBrainDumpProps> = ({
  date,
  existingDump,
  saveDump,
  isSaving,
}) => {
  const [content, setContent] = useState(existingDump?.content ?? '');
  const hasChanges = content !== (existingDump?.content ?? '');

  // Sync content ketika data dari parent berubah (misal setelah save)
  useEffect(() => {
    setContent(existingDump?.content ?? '');
  }, [existingDump]);

  // Format label hari dalam bahasa Indonesia: "Senin, 27 Apr"
  const dayLabel = new Date(date + 'T12:00:00').toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  });

  const handleSave = async () => {
    try {
      await saveDump(date, content);
      toast.success('Brain dump berhasil disimpan');
    } catch {
      // Error toast sudah ditangani di hook
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!isSaving && hasChanges) {
        handleSave();
      }
    }
  };

  const isEmpty = !existingDump;

  return (
    <div className={`rounded-lg border p-4 transition-colors ${
      isEmpty
        ? 'border-dashed border-gray-200 dark:border-gray-700'
        : 'border-gray-200 dark:border-gray-700'
    }`}>
      {/* Header hari */}
      <p className={`text-sm font-medium mb-3 ${
        isEmpty
          ? 'text-gray-400 dark:text-gray-500'
          : 'text-gray-700 dark:text-gray-300'
      }`}>
        {dayLabel}
      </p>

      {/* Editor */}
      <RichTextEditor
        value={content}
        onChange={setContent}
        onKeyDown={handleKeyDown}
        placeholder="Tuliskan apa yang ada di pikiran Anda..."
        className="w-full"
        rows={isEmpty ? 4 : 6}
        disabled={isSaving}
      />

      {/* Save button — tampil hanya jika ada perubahan */}
      {hasChanges && (
        <div className="mt-3">
          <Button
            onClick={handleSave}
            loading={isSaving}
            loadingText="Menyimpan..."
            size="sm"
            variant="primary"
          >
            Simpan
          </Button>
        </div>
      )}
    </div>
  );
};

export default DayBrainDump;
