'use client';

import { useState } from 'react';
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
        value={value}
        onChange={e => setValue(e.target.value)}
        rows={3}
        placeholder="Tulis di sini..."
        className="w-full text-sm font-medium border-0 bg-transparent resize-none focus:outline-none text-gray-700 dark:text-gray-300 min-h-[80px]"
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
