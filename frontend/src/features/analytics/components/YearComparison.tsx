import { useEffect, useState } from 'react';

import { ApiError, compareYears } from '../api/analyticsApi';
import { formatCurrency } from '../format';
import type { YearTotal } from '../types';
import { BarChart } from './BarChart';

const CURRENT_YEAR = new Date().getUTCFullYear();
const DEFAULT_YEARS = [CURRENT_YEAR - 2, CURRENT_YEAR - 1, CURRENT_YEAR];

export function YearComparison() {
  const [totals, setTotals]   = useState<YearTotal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    compareYears(DEFAULT_YEARS)
      .then((t) => { if (!cancelled) setTotals(t); })
      .catch((err) => { if (!cancelled) setError(err instanceof ApiError ? err.message : 'Erro ao comparar anos.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="border border-[#2d382a] bg-[#0d120d] p-5">
      <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-lime-300">Comparativo entre anos</p>

      {loading && <p className="mt-4 font-mono text-xs text-stone-500">Carregando…</p>}
      {error && <p className="mt-4 border-l-2 border-red-400 bg-red-400/5 px-3 py-2 font-mono text-xs text-red-300">{error}</p>}

      {!loading && !error && (
        <div className="mt-5">
          <BarChart
            bars={totals.map((t) => ({
              label:     String(t.year),
              value:     t.revenue,
              highlight: t.year === CURRENT_YEAR,
            }))}
          />
          <div className="mt-4 space-y-1 border-t border-[#2d382a] pt-4 font-mono text-xs">
            {totals.map((t) => (
              <div key={t.year} className="flex justify-between">
                <span className="text-stone-400">{t.year}</span>
                <span className="font-bold text-stone-200">{formatCurrency(t.revenue)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
