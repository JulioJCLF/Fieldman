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
    <div className="border border-[#2d382a] bg-[#0d120d] p-5">
      <div className="flex items-center justify-between gap-4">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-lime-300">Faturamento mensal</p>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setYear((y) => y - 1)}
            className="border border-[#384534] px-2.5 py-1 font-mono text-xs text-stone-400 hover:border-stone-500">←</button>
          <span className="font-mono text-sm font-bold text-stone-200">{year}</span>
          <button type="button" onClick={() => setYear((y) => y + 1)}
            className="border border-[#384534] px-2.5 py-1 font-mono text-xs text-stone-400 hover:border-stone-500">→</button>
        </div>
      </div>

      {loading && <p className="mt-4 font-mono text-xs text-stone-500">Carregando…</p>}
      {error && <p className="mt-4 border-l-2 border-red-400 bg-red-400/5 px-3 py-2 font-mono text-xs text-red-300">{error}</p>}

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

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#2d382a] pt-4 font-mono text-xs">
            <span className="text-stone-400">Total {year}: <span className="font-bold text-lime-300">{formatCurrency(report.total)}</span></span>

            {/* Comparação mês atual vs mesmo mês do ano anterior */}
            {comparison && (
              <span className="text-stone-400">
                {MONTH_LABELS[comparison.month - 1]}/{comparison.current_year} vs {comparison.previous_year}:{' '}
                {comparison.delta_pct === null ? (
                  <span className="text-stone-500">sem base anterior</span>
                ) : (
                  <span className={comparison.delta_pct >= 0 ? 'font-bold text-lime-300' : 'font-bold text-red-400'}>
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
