'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import type { ReflectionField } from '@/types/twelve-week-sync';
import Button from '@/components/ui/button/Button';

interface Props {
  field: ReflectionField;
  label: string;
  value: string | null;
  onUpdate: (field: ReflectionField, value: string) => void;
}

export default function ReflectionQuestions({ field, value: initialValue, onUpdate }: Props) {
  const [value, setValue] = useState(initialValue ?? '');
  const [isSaving, setIsSaving] = useState(false);
  // Ringkas 3 baris; klik -> tampil penuh (tinggi ikut isi, tanpa scroll).
  const [isExpanded, setIsExpanded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el || !isExpanded) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [isExpanded, value]);
  const isDirty = value !== (initialValue ?? '');

  async function handleSave() {
    if (!isDirty) return;
    setIsSaving(true);
    try {
      await onUpdate(field, value);
      toast.success('Tersimpan');
    } catch {
      toast.error('Gagal menyimpan');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="w-full space-y-2">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={e => setValue(e.target.value)}
        onFocus={() => setIsExpanded(true)}
        rows={3}
        placeholder="Tulis di sini..."
        className={`w-full text-sm font-medium border-0 bg-transparent resize-none focus:outline-none text-gray-700 dark:text-gray-300 min-h-[80px] ${
          isExpanded ? 'overflow-hidden' : 'cursor-pointer'
        }`}
      />
      {/* {isDirty && ( */}
        <div className="flex justify-end">
          <Button
            size="xs"
            variant="primary"
            onClick={handleSave}
            loading={isSaving}
            loadingText="Menyimpan..."
          >
            Simpan
          </Button>
        </div>
      {/* )} */}
    </div>
  );
}
