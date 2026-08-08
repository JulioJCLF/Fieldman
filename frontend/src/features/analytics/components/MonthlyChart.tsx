import { useEffect, useState } from 'react';

import { ApiError, compareMonths, getMonthly } from '../api/analyticsApi';
import { formatCurrency, MONTH_LABELS } from '../format';
import type { MonthComparison, MonthlyReport } from '../types';
import { BarChart } from './BarChart';

const CURRENT_MONTH = new Date().getUTCMonth() + 1;

export function MonthlyChart() {
  const [year, setYear]           = useState(new Date().getUTCFullYear());
  const [report, setReport]       = useState<MonthlyReport | null>(null);
  const [comparison, setComparison] = useState<MonthComparison | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([getMonthly(year), compareMonths(year, CURRENT_MONTH)])
      .then(([r, c]) => { if (!cancelled) { setReport(r); setComparison(c); } })
      .catch((err) => { if (!cancelled) setError(err instanceof ApiError ? err.message : 'Erro ao carregar dados mensais.'); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [year]);

  const isCurrentYear = year === new Date().getUTCFullYear();

  return (
    <div className="border border-outline-variant bg-surface-lowest p-5">
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Faturamento mensal</p>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setYear((y) => y - 1)}
            className="border border-outline-variant px-2.5 py-1 text-xs text-on-surface-variant hover:border-outline">←</button>
          <span className="text-sm font-bold text-on-surface">{year}</span>
          <button type="button" onClick={() => setYear((y) => y + 1)}
            className="border border-outline-variant px-2.5 py-1 text-xs text-on-surface-variant hover:border-outline">→</button>
        </div>
      </div>

      {loading && <p className="mt-4 text-xs text-outline">Carregando…</p>}
      {error && <p className="mt-4 border-l-2 border-error bg-error/5 px-3 py-2 text-xs text-error">{error}</p>}

      {!loading && !error && report && (
        <>
          <div className="mt-5">
            <BarChart
              bars={report.months.map((m) => ({
                label:     MONTH_LABELS[m.month - 1],
                value:     m.revenue,
                highlight: isCurrentYear && m.month === CURRENT_MONTH,
              }))}
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant pt-4 text-xs">
            <span className="text-on-surface-variant">Total {year}: <span className="font-bold text-primary">{formatCurrency(report.total)}</span></span>

            {/* Comparação mês atual vs mesmo mês do ano anterior */}
            {comparison && (
              <span className="text-on-surface-variant">
                {MONTH_LABELS[comparison.month - 1]}/{comparison.current_year} vs {comparison.previous_year}:{' '}
                {comparison.delta_pct === null ? (
                  <span className="text-outline">sem base anterior</span>
                ) : (
                  <span className={comparison.delta_pct >= 0 ? 'font-bold text-primary' : 'font-bold text-error'}>
                    {comparison.delta_pct >= 0 ? '+' : ''}{comparison.delta_pct.toFixed(1)}%
                  </span>
                )}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
