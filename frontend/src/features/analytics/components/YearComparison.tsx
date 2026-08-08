import { useEffect, useState } from 'react';

import { ApiError, compareYears } from '../api/analyticsApi';
import { formatCurrency } from '../format';
import type { YearTotal } from '../types';
import { BarChart } from './BarChart';

const CURRENT_YEAR = new Date().getUTCFullYear();
const DEFAULT_YEARS = [CURRENT_YEAR - 2, CURRENT_YEAR - 1, CURRENT_YEAR];

export function YearComparison() {
  const [totals, setTotals] = useState<YearTotal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    compareYears(DEFAULT_YEARS)
      .then((t) => { if (!cancelled) setTotals(t); })
      .catch((err) => { if (!cancelled) setError(err instanceof ApiError ? err.message : 'Erro ao comparar anos.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="border border-outline-variant bg-surface-lowest p-5">
      <p className="text-xs font-bold text-primary">Comparativo entre anos</p>

      {loading && <p className="mt-4 text-xs text-outline">Carregando…</p>}
      {error && <p className="mt-4 border-l-2 border-error bg-error/5 px-3 py-2 text-xs text-error">{error}</p>}

      {!loading && !error && (
        <div className="mt-5">
          <BarChart
            bars={totals.map((t) => ({
              label: String(t.year),
              value: t.revenue,
              highlight: t.year === CURRENT_YEAR,
            }))}
          />
          <div className="mt-4 space-y-1 border-t border-outline-variant pt-4 text-xs">
            {totals.map((t) => (
              <div key={t.year} className="flex justify-between">
                <span className="text-on-surface-variant">{t.year}</span>
                <span className="font-bold text-on-surface">{formatCurrency(t.revenue)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
