import { useState, useEffect } from "react";
import ComponentCard from '@/components/common/ComponentCard';
import { addMultipleQuests, updateQuests } from "../quests/actions";
import { useSearchParams } from "next/navigation";
import Button from '@/components/ui/button/Button';
import CustomToast from '@/components/ui/toast/CustomToast';

// Komponen ini adalah client UI/presentasi dan interaksi utama untuk 12 Week Goals.
// - Menerima data quest dari parent (props initialQuests).
// - Menampilkan UI input quest, matriks pairwise, ranking, dsb.
// - Mengelola state interaktif (input, pairwise, ranking) di client.
// - Tidak melakukan fetch data ke server secara langsung.

const QUEST_LABELS = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'
];

interface Quest {
  id?: string;
  label: string;
  title: string;
}

export default function TwelveWeekGoalsUI({ initialQuests = [], loading = false }: { initialQuests?: { id?: string, title: string }[], loading?: boolean }) {
  // State utama
  const [quests, setQuests] = useState<Quest[]>(
    QUEST_LABELS.map(label => ({ label, title: "" }))
  );
  const [pairwiseResults, setPairwiseResults] = useState<{ [key: string]: string }>({});
  const [ranking, setRanking] = useState<{ label: string, title: string, score: number }[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [highlightEmpty, setHighlightEmpty] = useState(false);
  const [saving, setSaving] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    if (initialQuests && initialQuests.length > 0) {
      // Pad ke 10 quest, label A-J
      const padded = QUEST_LABELS.map((label, idx) => {
        const q = initialQuests[idx];
        return q ? { id: q.id, label, title: q.title } : { label, title: "" };
      });
      setQuests(padded);
    } else {
      setQuests(QUEST_LABELS.map(label => ({ label, title: "" })));
    }
  }, [initialQuests]);

  // Otomatis hitung ranking setiap pairwiseResults berubah, tapi JANGAN urutkan quests
  useEffect(() => {
    const filledQuests = quests.filter(q => q.title.trim() !== "");
    if (filledQuests.length < 2) {
      setRanking(null);
      return;
    }
    const scores: { [label: string]: number } = {};
    quests.forEach(q => { scores[q.label] = 0; });
    Object.values(pairwiseResults).forEach(winner => {
      if (scores[winner] !== undefined) scores[winner] += 1;
    });
    const result = quests.map(q => ({ ...q, score: scores[q.label] || 0 }))
      .sort((a, b) => b.score - a.score);
    setRanking(result);
  }, [pairwiseResults, quests.length]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[700px]">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  // Handler input quest
  const handleQuestTitleChange = (idx: number, value: string) => {
    setQuests(qs => {
      const next = [...qs];
      next[idx] = { ...next[idx], title: value };
      return next;
    });
    setHighlightEmpty(false);
    setError(null);
  };

  // Handler klik tombol perbandingan
  const handlePairwiseClick = (row: number, col: number, winner: 'row' | 'col') => {
    const key = `${quests[row].label}-${quests[col].label}`;
    setPairwiseResults(prev => ({
      ...prev,
      [key]: winner === 'row' ? quests[row].label : quests[col].label
    }));
  };

  // Reset matrix & ranking
  const handleReset = () => {
    setPairwiseResults({});
    setRanking(null);
    setError(null);
    setHighlightEmpty(false);
  };

  // Handler simpan/update quest
  const handleSaveQuests = async () => {
    setSaving(true);
    const questsWithId = quests.filter(q => q.id);
    const newQuests = quests.filter(q => !q.id && q.title.trim() !== "");
    try {
      // Update semua quest yang punya id (meskipun title kosong)
      if (questsWithId.length > 0) {
        await updateQuests(questsWithId.map(q => ({ id: q.id!, title: q.title })));
      }
      // Insert quest baru (tanpa id, dan title tidak kosong)
      if (newQuests.length > 0) {
        const qParam = searchParams.get("q");
        let year = new Date().getFullYear();
        let quarter = 1;
        if (qParam) {
          const match = qParam.match(/(\d{4})-Q([1-4])/);
          if (match) {
            year = parseInt(match[1]);
            quarter = parseInt(match[2]);
          }
        }
        await addMultipleQuests(newQuests.map(q => q.title), year, quarter);
      }
      CustomToast.success("Quest berhasil disimpan/diupdate!");
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Gagal menyimpan quest.";
      CustomToast.error(errorMsg);
    }
    setSaving(false);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 py-8 w-full max-w-none px-4 md:px-12">
      {/* Kiri: Input Quest */}
      <div className="col-span-1 md:col-span-4">
        <ComponentCard className="text-center" title="10 Quests (Achievement Goal & End Result)" classNameTitle="text-xl font-semibold text-gray-900 mt-4 dark:text-white">
          <div className="space-y-4">
            {quests.map((q, idx) => {
              // Cari ranking index quest ini (berdasarkan skor)
              let rankIdx = -1;
              let score = 0;
              if (ranking) {
                const found = ranking.find((r) => r.label === q.label);
                if (found) {
                  rankIdx = ranking.indexOf(found);
                  score = found.score;
                }
              }
              // Highlight 3 teratas hanya jika score > 0
              const highlight = rankIdx > -1 && rankIdx < 3 && score > 0;
              return (
                <div
                  key={q.label}
                  className={`flex items-center gap-3 relative rounded transition-colors ${highlight ? 'bg-brand-100 border border-brand-400' : ''}`}
                >
                  <span className="w-6 text-right font-bold dark:text-white/90">{q.label}.</span>
                  <input
                    className={`flex-1 h-11 rounded-lg border px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-400 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800 ${highlightEmpty && !q.title.trim() ? 'border-red-500 ring-2 ring-red-200' : ''}`}
                    placeholder={`Quest ${idx+1}`}
                    value={q.title}
                    onChange={e => handleQuestTitleChange(idx, e.target.value)}
                    required
                  />
                  {/* Score box kanan atas */}
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 mr-2">
                    <span className="inline-block min-w-[28px] px-2 py-0.5 rounded bg-gray-200 text-xs font-bold text-gray-700 border border-gray-300 text-center select-none">
                      {score}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </ComponentCard>
        <div className="mt-4 flex gap-2 mx-10">
          <Button
            type="button"
            size="md"
            variant="primary"
            onClick={handleSaveQuests}
            disabled={saving}
            className="w-full"
          >
            {saving ? (
              <>
                <span className="inline-block mr-2 align-middle animate-spin">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                  </svg>
                </span>
                Menyimpan...
              </>
            ) : "Simpan"}
          </Button>
        </div>
      </div>
      {/* Kanan: Matriks Perbandingan */}
      <div className="col-span-1 md:col-span-8">
        <ComponentCard className="text-center" title="HIGHEST FIRST" classNameTitle="text-xl font-semibold text-gray-900 mt-4 dark:text-white">
          <div className="overflow-x-auto">
            <table className="min-w-max border-collapse border text-xs">
              <thead>
                <tr>
                  <th className="border px-1 py-1 w-16 bg-gray-50"></th>
                  {quests.map((q) => (
                    <th key={q.label} className="border px-1 py-1 w-24 bg-gray-50 font-bold">
                      {q.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {quests.map((rowQ, i) => (
                  <tr key={rowQ.label}>
                    <th className="border px-1 py-1 w-10 h-14 bg-gray-50 font-bold text-center">{rowQ.label}</th>
                    {quests.map((colQ, j) => {
                      if (i === j) {
                        return <td key={colQ.label} className="border px-1 py-1 bg-gray-100 text-center"></td>;
                      }
                      if (i < j) {
                        const key = `${rowQ.label}-${colQ.label}`;
                        const winner = pairwiseResults[key];
                        return (
                          <td key={colQ.label} className="border px-1 py-1 text-center">
                            {winner ? (
                              <span className="font-bold text-lg text-brand-400">{winner}</span>
                            ) : (
                              <div className="flex gap-1 justify-center">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  className="px-1 py-1 !rounded bg-brand-100 hover:bg-brand-200 text-brand-700 text-xs font-semibold border border-brand-200"
                                  onClick={() => handlePairwiseClick(i, j, 'row')}
                                >
                                  {rowQ.label}
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  className="px-1 py-1 !rounded bg-brand-100 hover:bg-brand-200 text-brand-700 text-xs font-semibold border border-brand-200"
                                  onClick={() => handlePairwiseClick(i, j, 'col')}
                                >
                                  {colQ.label}
                                </Button>
                              </div>
                            )}
                          </td>
                        );
                      }
                      // i > j: cell bawah, tampilkan kotak abu-abu kosong
                      return (
                        <td key={colQ.label} className="border px-1 py-1 bg-gray-100 text-center"></td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ComponentCard>
        <div className="mt-4 flex gap-2">
          {error && (
            <div className="mt-3 text-red-600 font-semibold text-sm">{error}</div>
          )}
          <div className="flex gap-2 mx-10 items-end w-full">
            <Button
              type="button"
              size="md"
              variant="outline"
              onClick={handleReset}
              className="w-full"
            >
              Reset Matrix & Ranking
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 