import { useState, useEffect } from "react";
import ComponentCard from '@/components/common/ComponentCard';
import { addMultipleQuests, updateQuests, finalizeQuests } from "../quests/actions";
import { useSearchParams, useRouter } from "next/navigation";
import Button from '@/components/ui/button/Button';
import CustomToast from '@/components/ui/toast/CustomToast';
import Spinner from "@/components/ui/spinner/Spinner";
import { useSidebar } from '@/context/SidebarContext';

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

interface RankedQuest extends Quest {
  score: number;
}

export default function TwelveWeekGoalsUI({ initialQuests = [], initialPairwiseResults = {}, loading = false }: { initialQuests?: { id?: string, title: string, label?: string }[], initialPairwiseResults?: { [key: string]: string }, loading?: boolean }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isExpanded } = useSidebar();
  // Ambil info kuartal dari URL
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
  const localKey = `better-planner-pairwise-${year}-Q${quarter}`;

  // State utama
  const [quests, setQuests] = useState<Quest[]>(
    QUEST_LABELS.map(label => ({ label, title: "" }))
  );
  const [pairwiseResults, setPairwiseResults] = useState<{ [key: string]: string }>({});
  const [ranking, setRanking] = useState<RankedQuest[] | null>(null);
  const [highlightEmpty, setHighlightEmpty] = useState(false);

  // Load pairwise dari initialPairwiseResults (DB) atau localStorage saat mount
  useEffect(() => {
    if (initialPairwiseResults && Object.keys(initialPairwiseResults).length > 0) {
      setPairwiseResults(initialPairwiseResults);
    } else {
      try {
        const saved = localStorage.getItem(localKey);
        if (saved) {
          setPairwiseResults(JSON.parse(saved));
        }
      } catch {}
    }
  }, [localKey, initialPairwiseResults]);

  // Simpan pairwise ke localStorage setiap kali berubah
  useEffect(() => {
    try {
      localStorage.setItem(localKey, JSON.stringify(pairwiseResults));
    } catch {}
  }, [pairwiseResults, localKey]);

  useEffect(() => {
    if (initialQuests && initialQuests.length > 0) {
      // Pad ke 10 quest, label dari DB jika ada
      const padded = QUEST_LABELS.map((label) => {
        const q = initialQuests.find(q => q.label === label);
        return q ? { id: q.id, label: label, title: q.title } : { label, title: "" };
      });
      setQuests(padded);
    } else {
      setQuests(QUEST_LABELS.map(label => ({ label, title: "" })));
    }
  }, [initialQuests]);

  // Kalkulasi ranking
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
    // Mapping id dari initialQuests ke ranking
    const result = quests.map((q, idx) => {
      const initial = initialQuests[idx];
      return {
        ...q,
        score: scores[q.label] || 0,
        id: initial?.id,
      };
    }).sort((a, b) => b.score - a.score);
    setRanking(result);
  }, [pairwiseResults, quests.length, quests, initialQuests]);

  useEffect(() => {
    setPairwiseResults({});
    setRanking(null);
    setHighlightEmpty(false);
  }, [localKey]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[800px]">
        <Spinner size={164} />
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
    setHighlightEmpty(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(localKey);
    }
  };

  // Handler simpan/update quest
  const handleSaveQuests = async () => {
    const questsWithId = quests.filter(q => q.id);
    const newQuests = quests.filter(q => !q.id && q.title.trim() !== "");
    try {
      if (questsWithId.length > 0) {
        await updateQuests(questsWithId.map(q => ({ id: q.id!, title: q.title, label: q.label })));
      }
      if (newQuests.length > 0) {
        await addMultipleQuests(newQuests.map(q => ({ title: q.title, label: q.label })), year, quarter);
      }
      CustomToast.success("Quest berhasil disimpan/diupdate!");
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Gagal menyimpan quest.";
      CustomToast.error(errorMsg);
    }
  };

  // Handler komit main quest
  const handleCommit = async () => {
    if (!ranking) return;
    try {
      // Ambil qParam, year, quarter secara real-time
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
      // Kalkulasi skor priority_score dari pairwiseResults
      const scores: { [label: string]: number } = {};
      quests.forEach(q => { scores[q.label] = 0; });
      Object.values(pairwiseResults).forEach(winner => {
        if (scores[winner] !== undefined) scores[winner] += 1;
      });
      // Array 10 quest lengkap dengan id, title, priority_score
      const questsWithScore = quests
        .map((q, idx) => ({
          id: initialQuests[idx]?.id,
          title: q.title,
          priority_score: scores[q.label] || 0,
        }))
        .filter((q): q is { id: string; title: string; priority_score: number } => typeof q.id === 'string');
      const result = await finalizeQuests(pairwiseResults, questsWithScore, year, quarter);
      localStorage.removeItem(localKey);
      CustomToast.success(result?.message || "Prioritas berhasil ditentukan dan 3 Main Quest telah ditetapkan!");
      if (result?.url) router.push(result.url);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Gagal commit main quest.";
      CustomToast.error(errorMsg);
    }
  };

  return (
    <div className="w-full max-w-none bg-white dark:bg-gray-800 shadow-lg rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col md:flex-row">
      {/* Kiri: Input Quest */}
      <div className="w-full md:w-1/3 md:border-r border-gray-200 dark:border-gray-700 pb-6 md:pb-8 flex flex-col justify-between">
        <ComponentCard className="text-center !shadow-none !bg-transparent !rounded-none !border-0 p-0" title="INPUT 10 QUESTS" classNameTitle="text-xl font-semibold text-gray-900 mt-4 dark:text-white">
          <div className="space-y-5">
            {quests.map((q, idx) => {
              let rankIdx = -1;
              let score = 0;
              if (ranking) {
                const found = ranking.find((r) => r.label === q.label);
                if (found) {
                  rankIdx = ranking.indexOf(found);
                  score = found.score;
                }
              }
              const highlight = rankIdx > -1 && rankIdx < 3 && score > 0;
              return (
                <div
                  key={q.label}
                  className={`flex items-center gap-2 pl-1 relative rounded transition-colors ${highlight ? 'bg-brand-100 border border-brand-400' : ''}`}
                >
                  <span className="w-6 text-right font-bold dark:text-white/90">{q.label}.</span>
                  <input
                    className={`flex-1 h-11 rounded-lg border px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-400 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800 ${highlightEmpty && !q.title.trim() ? 'border-red-500 ring-2 ring-red-200' : ''}`}
                    placeholder={`Quest ${idx+1}`}
                    value={q.title}
                    onChange={e => handleQuestTitleChange(idx, e.target.value)}
                    required
                  />
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
        <div className="mt-2 mx-10 flex">
          <Button
            type="button"
            size="md"
            variant="primary"
            onClick={handleSaveQuests}
            className="w-full"
          >
            Simpan
          </Button>
        </div>
      </div>
      {/* Kanan: Matriks Perbandingan */}
      <div className="w-full md:w-2/3 pb-6 md:pb-8 flex flex-col">
        <ComponentCard className="text-center !shadow-none !bg-transparent !rounded-none !border-0 p-0" title="HIGHEST FIRST" classNameTitle="text-xl font-semibold text-gray-900 mt-4 dark:text-white">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border text-xs">
              <thead>
                <tr>
                  <th className="border px-1 py-1 min-w-14 bg-gray-50"></th>
                  {quests.map((q) => (
                    <th key={q.label} className={`border px-1 py-1 min-w-14 bg-gray-50 font-bold`}>
                      {q.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {quests.map((rowQ, i) => (
                  <tr key={rowQ.label}>
                    <th
                      className={`border px-1 py-1 w-10 ${isExpanded ? 'h-[3.61rem]' : 'h-[3.71rem]'} bg-gray-50 font-bold text-center`}
                    >
                      {rowQ.label}
                    </th>
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
                              <span className="font-bold text-[16px] text-brand-400">{winner}</span>
                            ) : (
                              <div className="flex gap-1 justify-center">
                                <Button
                                  type="button"
                                  size="xs"
                                  variant="outline"
                                  className="!rounded bg-brand-100 hover:bg-brand-200 text-brand-700 text-xs font-semibold border border-brand-200"
                                  onClick={() => handlePairwiseClick(i, j, 'row')}
                                >
                                  {rowQ.label}
                                </Button>
                                <Button
                                  type="button"
                                  size="xs"
                                  variant="outline"
                                  className="!rounded bg-brand-100 hover:bg-brand-200 text-brand-700 text-xs font-semibold border border-brand-200"
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
        <div className="mt-2 mx-10 flex gap-2">
          <Button
            type="button"
            size="md"
            variant="outline"
            onClick={handleReset}
            className="w-full"
          >
            Reset
          </Button>
          <Button
            type="button"
            size="md"
            variant="primary"
            className="w-full"
            onClick={handleCommit}
          >
            Submit
          </Button>
        </div>
      </div>
    </div>
  );
} 