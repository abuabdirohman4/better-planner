import ComponentCard from '@/components/common/ComponentCard';
import type { Quest } from "../hooks";
import PairwiseCell from './PairwiseCell';

interface PairwiseMatrixProps {
  quests: Quest[];
  pairwiseResults: { [key: string]: string };
  onPairwiseClick: (row: number, col: number, winner: 'row' | 'col') => void;
  isExpanded: boolean;
}

export default function PairwiseMatrix({ 
  quests, 
  pairwiseResults, 
  onPairwiseClick, 
  isExpanded 
}: PairwiseMatrixProps) {
  return (
    <ComponentCard className="text-center !shadow-none !bg-transparent !rounded-none !border-0 p-0" title="HIGHEST FIRST" classNameTitle="text-xl font-semibold text-gray-900 mt-4 dark:text-white">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse border text-xs">
          <thead>
            <tr>
              <th className="border px-1 py-1 min-w-14 bg-gray-50" />
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
                {quests.map((colQ, j) => (
                  <PairwiseCell
                    key={colQ.label}
                    rowQ={rowQ}
                    colQ={colQ}
                    i={i}
                    j={j}
                    pairwiseResults={pairwiseResults}
                    onPairwiseClick={onPairwiseClick}
                  />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ComponentCard>
  );
}
