'use client';

import { useState, useEffect } from 'react';
import { useDebounce } from 'use-debounce';
import type { QuarterlyReview, ReflectionField } from '@/types/twelve-week-sync';

const QUESTIONS: { field: ReflectionField; label: string; placeholder: string }[] = [
  {
    field: 'challenges_faced',
    label: 'Kesulitan apa yang saya hadapi dalam proses 12 Minggu ini?',
    placeholder: 'Ceritakan tantangan, hambatan, atau hal yang tidak berjalan sesuai rencana...',
  },
  {
    field: 'advice_for_next',
    label: 'Nasihat dari saya untuk 12 Minggu ke depan',
    placeholder: 'Apa yang ingin kamu sampaikan ke dirimu sendiri untuk kuartal berikutnya?',
  },
  {
    field: 'reward',
    label: 'Reward Untuk Diri Saya',
    placeholder: 'Bagaimana cara merayakan pencapaian kuartal ini?',
  },
  {
    field: 'goals_needing_commitment',
    label: 'Goal mana yang memerlukan komitmen Anda kembali?',
    placeholder: 'Goal yang masih relevan tapi butuh fokus lebih...',
  },
  {
    field: 'goals_needing_revision',
    label: 'Goal mana yang perlu Anda revisi?',
    placeholder: 'Goal yang perlu diubah, dihapus, atau disesuaikan...',
  },
];

function ReflectionFieldItem({ question, initialValue, onUpdate }: {
  question: typeof QUESTIONS[0];
  initialValue: string;
  onUpdate: (field: ReflectionField, value: string) => void;
}) {
  const [value, setValue] = useState(initialValue);
  const [debouncedValue] = useDebounce(value, 1000);

  useEffect(() => {
    if (debouncedValue !== initialValue) {
      onUpdate(question.field, debouncedValue);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedValue]);

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {question.label}
      </label>
      <textarea
        value={value}
        onChange={e => setValue(e.target.value)}
        rows={3}
        maxLength={2000}
        placeholder={question.placeholder}
        className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <p className="text-xs text-gray-400 text-right">{value.length}/2000</p>
    </div>
  );
}

interface Props {
  review: QuarterlyReview;
  onUpdate: (field: ReflectionField, value: string) => void;
}

export default function ReflectionQuestions({ review, onUpdate }: Props) {
  return (
    <div className="space-y-6">
      {QUESTIONS.map(q => (
        <ReflectionFieldItem
          key={q.field}
          question={q}
          initialValue={review[q.field] ?? ''}
          onUpdate={onUpdate}
        />
      ))}
    </div>
  );
}
