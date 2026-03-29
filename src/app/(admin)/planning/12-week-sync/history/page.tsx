import { getQuarterlyReviewHistory } from '../actions/quarterly-review/actions';
import { getQuarterString } from '@/lib/quarterUtils';
import Link from 'next/link';

export const metadata = {
  title: '12 Week Sync History | Better Planner',
};

function groupByYear(reviews: any[]) {
  return reviews.reduce((acc, r) => {
    const y = r.year;
    if (!acc[y]) acc[y] = [];
    acc[y].push(r);
    return acc;
  }, {} as Record<number, any[]>);
}

export default async function HistoryPage() {
  const result = await getQuarterlyReviewHistory();
  const reviews = result.data ?? [];
  const grouped = groupByYear(reviews);
  const years = Object.keys(grouped).map(Number).sort((a, b) => b - a);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          12 Week Sync — History
        </h1>
        <Link href="/planning/12-week-sync" className="text-sm text-blue-500 hover:underline">
          ← Current Quarter
        </Link>
      </div>

      {reviews.length === 0 ? (
        <div className="p-8 text-center bg-gray-50 dark:bg-gray-800/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Belum ada review yang selesai.
          </p>
          <Link 
            href="/planning/12-week-sync" 
            className="inline-block mt-4 text-sm font-medium text-blue-500 hover:underline"
          >
            Mulai review sekarang →
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {years.map(year => (
            <div key={year}>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                {year}
              </h2>
              <div className="space-y-2">
                {grouped[year].map((r: any) => (
                  <Link
                    key={r.id}
                    href={`/planning/12-week-sync?q=${r.year}-Q${r.quarter}`}
                    className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-400 transition-colors group"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white group-hover:text-blue-500 transition-colors">
                        {getQuarterString(r.year, r.quarter)}
                      </p>
                      {r.completed_at && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          Selesai {new Date(r.completed_at).toLocaleDateString('id-ID', {
                            day: 'numeric', month: 'long', year: 'numeric'
                          })}
                        </p>
                      )}
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      r.is_completed
                        ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20'
                        : 'text-amber-600 bg-amber-50 dark:bg-amber-900/20'
                    }`}>
                      {r.is_completed ? '✓ Selesai' : 'Draft'}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
