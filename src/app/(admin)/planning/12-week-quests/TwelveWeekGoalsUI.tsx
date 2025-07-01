import { useState, useEffect } from "react";
import ComponentCard from '@/components/common/ComponentCard';

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

export default function TwelveWeekGoalsUI({ initialQuests = [] }: { initialQuests?: { id?: string, title: string }[] }) {
  // State utama
  const [quests, setQuests] = useState<Quest[]>(
    QUEST_LABELS.map(label => ({ label, title: "" }))
  );
  const [pairwiseResults, setPairwiseResults] = useState<{ [key: string]: string }>({});
  const [ranking, setRanking] = useState<{ label: string, title: string, score: number }[] | null>(null);

  // Auto-populasi quest dari initialQuests saat mount
  useEffect(() => {
    if (initialQuests && initialQuests.length > 0) {
      // Pad ke 10 quest, label A-J
      const padded = QUEST_LABELS.map((label, idx) => {
        const q = initialQuests[idx];
        return q ? { id: q.id, label, title: q.title } : { label, title: "" };
      });
      setQuests(padded);
    }
  }, [initialQuests]);

  // Handler input quest
  const handleQuestTitleChange = (idx: number, value: string) => {
    setQuests(qs => {
      const next = [...qs];
      next[idx] = { ...next[idx], title: value };
      return next;
    });
  };

  // Handler klik tombol perbandingan
  const handlePairwiseClick = (row: number, col: number, winner: 'row' | 'col') => {
    const key = `${quests[row].label}-${quests[col].label}`;
    setPairwiseResults(prev => ({
      ...prev,
      [key]: winner === 'row' ? quests[row].label : quests[col].label
    }));
  };

  // Kalkulasi skor kemenangan
  const handleCalculateRanking = () => {
    const scores: { [label: string]: number } = {};
    quests.forEach(q => { scores[q.label] = 0; });
    Object.values(pairwiseResults).forEach(winner => {
      if (scores[winner] !== undefined) scores[winner] += 1;
    });
    const result = quests.map(q => ({ ...q, score: scores[q.label] || 0 }))
      .sort((a, b) => b.score - a.score);
    setRanking(result);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8 max-w-6xl mx-auto">
      {/* Kiri: Input Quest */}
      <div>
        <ComponentCard title="Masukkan 10 Kandidat Quest (A-J)">
          <div className="space-y-4">
            {quests.map((q, idx) => (
              <div key={q.label} className="flex items-center gap-3">
                <span className="w-6 text-right font-bold">{q.label}.</span>
                <input
                  className="flex-1 h-11 rounded-lg border px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                  placeholder={`Judul Quest ${q.label}`}
                  value={q.title}
                  onChange={e => handleQuestTitleChange(idx, e.target.value)}
                  required
                />
              </div>
            ))}
          </div>
        </ComponentCard>
      </div>
      {/* Kanan: Matriks Perbandingan */}
      <div>
        <ComponentCard title="Matriks Perbandingan Biner (A-J)">
          <div className="overflow-x-auto">
            <table className="min-w-max border-collapse border text-xs">
              <thead>
                <tr>
                  <th className="border px-2 py-1 bg-gray-50"></th>
                  {quests.map((q) => (
                    <th key={q.label} className="border px-2 py-1 bg-gray-50 font-bold">
                      {q.label}<br /><span className="font-normal text-[10px]">{q.title || <span className="text-gray-300">(kosong)</span>}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {quests.map((rowQ, i) => (
                  <tr key={rowQ.label}>
                    <th className="border px-2 py-1 bg-gray-50 font-bold text-left">{rowQ.label}<br /><span className="font-normal text-[10px]">{rowQ.title || <span className="text-gray-300">(kosong)</span>}</span></th>
                    {quests.map((colQ, j) => {
                      if (i === j) {
                        return <td key={colQ.label} className="border px-2 py-1 bg-gray-100 text-center">-</td>;
                      }
                      if (i < j) {
                        const key = `${rowQ.label}-${colQ.label}`;
                        const winner = pairwiseResults[key];
                        return (
                          <td key={colQ.label} className="border px-2 py-1 text-center">
                            {winner ? (
                              <span className="font-bold text-brand-600">{winner}</span>
                            ) : (
                              <div className="flex gap-1 justify-center">
                                <button
                                  type="button"
                                  className="px-2 py-1 rounded bg-brand-100 hover:bg-brand-200 text-brand-700 text-xs font-semibold border border-brand-200"
                                  onClick={() => handlePairwiseClick(i, j, 'row')}
                                >
                                  {rowQ.label}
                                </button>
                                <button
                                  type="button"
                                  className="px-2 py-1 rounded bg-brand-100 hover:bg-brand-200 text-brand-700 text-xs font-semibold border border-brand-200"
                                  onClick={() => handlePairwiseClick(i, j, 'col')}
                                >
                                  {colQ.label}
                                </button>
                              </div>
                            )}
                          </td>
                        );
                      }
                      // i > j
                      const key = `${colQ.label}-${rowQ.label}`;
                      const winner = pairwiseResults[key];
                      return (
                        <td key={colQ.label} className="border px-2 py-1 text-center text-gray-500">
                          {winner ? <span className="font-bold">{winner}</span> : ''}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-6">
            <button
              type="button"
              className="w-full py-2 rounded bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm"
              onClick={handleCalculateRanking}
            >
              Hitung & Urutkan Prioritas
            </button>
          </div>
          {ranking && (
            <div className="mt-6">
              <h3 className="font-bold mb-2">Ranking Quest Berdasarkan Kemenangan:</h3>
              <ol className="list-decimal pl-6 space-y-1">
                {ranking.map((q) => (
                  <li key={q.label} className="font-semibold text-brand-700">
                    {q.label} - {q.title || <span className="text-gray-400">(kosong)</span>} <span className="text-gray-500 font-normal">({q.score} kemenangan)</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </ComponentCard>
      </div>
    </div>
  );
} 