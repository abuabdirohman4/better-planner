"use client";
import { addMultipleQuests, commitTopQuests, updateQuests } from '../quests/actions';
import ComponentCard from '@/components/common/ComponentCard';
import Button from '@/components/ui/button/Button';
import { showSuccessToast, showErrorToast } from '@/components/ui/toast/CustomToast';
import { useState } from 'react';

function shuffleArray<T>(array: T[]): T[] {
  // Fisher-Yates shuffle
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function getAllPairings(n: number) {
  // Generate all unique pairs for n items
  const pairs: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      pairs.push([i, j]);
    }
  }
  return shuffleArray(pairs);
}

interface Quest { id: string; title: string; }

function getErrorMessage(e: unknown, fallback = 'Terjadi kesalahan') {
  if (typeof e === 'object' && e !== null && 'message' in e) {
    const maybeError = e as { message?: unknown };
    if (typeof maybeError.message === 'string') {
      return maybeError.message;
    }
  }
  return fallback;
}

export default function TwelveWeekGoals({ year, quarter, initialQuests = [] }: { year: number, quarter: number, initialQuests?: Quest[] }) {
  const [step, setStep] = useState<'input' | 'tournament' | 'finish' | 'resume'>(initialQuests.length === 10 ? 'resume' : 'input');
  const [inputs, setInputs] = useState<string[]>(initialQuests.length === 10 ? initialQuests.map(q => q.title) : Array(10).fill(""));
  const [quests, setQuests] = useState<Quest[]>(initialQuests);
  const [pairings, setPairings] = useState<[number, number][]>([]);
  const [currentPair, setCurrentPair] = useState(0);
  const [scores, setScores] = useState<number[]>(Array(10).fill(0));
  const [top3, setTop3] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Handle input change
  const handleInputChange = (idx: number, value: string) => {
    setInputs(arr => arr.map((v, i) => (i === idx ? value : v)));
  };

  // Simpan 10 quest & mulai turnamen
  const handleSaveAndStart = async () => {
    setLoading(true);
    try {
      const res = await addMultipleQuests(inputs, year, quarter);
      showSuccessToast(res.message || 'Berhasil!');
      setQuests(res.quests);
      setPairings(getAllPairings(10));
      setStep('tournament');
    } catch (e: unknown) {
      showErrorToast(getErrorMessage(e, 'Gagal menyimpan quest'));
    } finally {
      setLoading(false);
    }
  };

  // Simpan perubahan judul quest & lanjutkan turnamen
  const handleUpdateAndResume = async () => {
    setLoading(true);
    try {
      const updated = quests.map((q, i) => ({ id: q.id, title: inputs[i] }));
      await updateQuests(updated);
      setQuests(updated);
      setPairings(getAllPairings(10));
      setStep('tournament');
      showSuccessToast('Perubahan quest berhasil disimpan!');
    } catch (e: unknown) {
      showErrorToast(getErrorMessage(e, 'Gagal update quest'));
    } finally {
      setLoading(false);
    }
  };

  // Pilih pemenang pada satu pairing
  const handlePickWinner = (winnerIdx: number) => {
    setScores(prev => {
      const next = [...prev];
      next[winnerIdx]++;
      return next;
    });
    if (currentPair + 1 < pairings.length) {
      setCurrentPair(currentPair + 1);
    } else {
      // Tournament selesai, ambil top 3
      const sorted = scores
        .map((score, idx) => ({ idx, score: currentPair === pairings.length - 1 ? score + 1 : score }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map(item => quests[item.idx]?.id)
        .filter(Boolean);
      setTop3(sorted);
      setStep('finish');
    }
  };

  // Commit 3 main quest
  const handleCommitTop3 = async () => {
    setLoading(true);
    try {
      await commitTopQuests(top3);
      showSuccessToast('Selamat! 3 Main Quest telah ditetapkan.');
      // redirect akan dilakukan oleh server action
    } catch (e: unknown) {
      showErrorToast(getErrorMessage(e, 'Gagal meng-commit quest'));
    } finally {
      setLoading(false);
    }
  };

  // --- Render ---
  if (step === 'resume' && quests.length === 10) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <ComponentCard title="Edit 10 Kandidat Quest Sebelum Turnamen">
          <div className="space-y-4 mb-6">
            {inputs.map((val, idx) => (
              <div key={quests[idx].id} className="flex items-center gap-3">
                <span className="w-6 text-right font-bold">{idx + 1}.</span>
                <input
                  className="flex-1 h-11 rounded-lg border px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                  value={val}
                  onChange={e => setInputs(arr => arr.map((v, i) => i === idx ? e.target.value : v))}
                  disabled={loading}
                  required
                />
              </div>
            ))}
          </div>
          <Button
            className="w-full"
            type="button"
            variant="primary"
            onClick={handleUpdateAndResume}
            disabled={loading || inputs.some(q => !q.trim())}
          >
            Simpan Perubahan & Lanjutkan Turnamen
          </Button>
        </ComponentCard>
      </div>
    );
  }

  if (step === 'input') {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <ComponentCard title="Masukkan 10 Highest First Priority Quest">
          <div className="space-y-4">
            {inputs.map((val, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <span className="w-6 text-right font-bold">{idx + 1}.</span>
                <input
                  className="flex-1 h-11 rounded-lg border px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                  placeholder={`Quest #${idx + 1}`}
                  value={val}
                  onChange={e => handleInputChange(idx, e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            ))}
          </div>
          <Button
            className="w-full mt-6"
            type="button"
            variant="primary"
            disabled={inputs.some(q => !q.trim()) || loading}
            onClick={handleSaveAndStart}
          >
            Simpan & Mulai Prioritas
          </Button>
        </ComponentCard>
      </div>
    );
  }

  if (step === 'tournament' && quests.length === 10 && pairings.length > 0) {
    const [a, b] = pairings[currentPair];
    return (
      <div className="max-w-2xl mx-auto py-8">
        <ComponentCard title="Turnamen Prioritas: Pilih Quest Lebih Penting">
          <div className="flex flex-col items-center gap-6">
            <div className="text-gray-600 mb-2">Perbandingan {currentPair + 1} dari {pairings.length}</div>
            <div className="flex gap-6 w-full">
              <Button
                className="flex-1 text-lg py-8"
                type="button"
                variant="primary"
                onClick={() => handlePickWinner(a)}
                disabled={loading}
              >
                {quests[a]?.title}
              </Button>
              <div className="flex items-center font-bold text-gray-500">VS</div>
              <Button
                className="flex-1 text-lg py-8"
                type="button"
                variant="primary"
                onClick={() => handlePickWinner(b)}
                disabled={loading}
              >
                {quests[b]?.title}
              </Button>
            </div>
          </div>
        </ComponentCard>
      </div>
    );
  }

  if (step === 'finish' && top3.length === 3) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <ComponentCard title="3 Main Quest Teratas">
          <ol className="list-decimal pl-6 space-y-2 mb-6">
            {top3.map((id) => (
              <li key={id} className="font-semibold text-lg text-brand-600">
                {quests.find(q => q.id === id)?.title}
              </li>
            ))}
          </ol>
          <Button
            className="w-full"
            type="button"
            variant="primary"
            onClick={handleCommitTop3}
            disabled={loading}
          >
            Selesai & Jadikan Main Quest
          </Button>
        </ComponentCard>
      </div>
    );
  }

  return null;
}
