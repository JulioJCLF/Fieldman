import { useEffect, useState } from 'react';

import { ApiError, getProjection } from '../api/analyticsApi';
import { formatCurrency, MONTH_LABELS } from '../format';
import type { ProjectionReport } from '../types';
import { BarChart } from './BarChart';

const NEXT_YEAR = new Date().getUTCFullYear() + 1;

export function ProjectionChart() {
  const [report, setReport]   = useState<ProjectionReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getProjection(NEXT_YEAR)
      .then((r) => { if (!cancelled) setReport(r); })
      .catch((err) => { if (!cancelled) setError(err instanceof ApiError ? err.message : 'Erro ao gerar projeção.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const total = report?.months.reduce((s, m) => s + m.projected_revenue, 0) ?? 0;

  return (
    <div className="border border-[#2d382a] bg-[#0d120d] p-5">
      <div className="flex items-center justify-between gap-4">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-lime-300">
          Projeção {NEXT_YEAR}
        </p>
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-stone-500">regressão linear</span>
      </div>

      {loading && <p className="mt-4 font-mono text-xs text-stone-500">Calculando projeção…</p>}
      {error && <p className="mt-4 border-l-2 border-red-400 bg-red-400/5 px-3 py-2 font-mono text-xs text-red-300">{error}</p>}

      {!loading && !error && report && !report.sufficient_data && (
        <div className="mt-4 border-l-2 border-amber-400 bg-amber-400/5 px-4 py-3">
          <p className="font-mono text-xs text-amber-300">
            Dados insuficientes para projeção.
          </p>
          <p className="mt-1 font-mono text-[10px] text-stone-500">
            São necessários ao menos 3 meses de dados reais (atual: {report.based_on_months}).
            A projeção é liberada conforme o histórico de faturamento acumula.
          </p>
        </div>
      )}

      {!loading && !error && report && report.sufficient_data && (
        <>
          <div className="mt-5">
            <BarChart bars={report.months.map((m) => ({ label: MONTH_LABELS[m.month - 1], value: m.projected_revenue }))} />
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#2d382a] pt-4 font-mono text-xs">
            <span className="text-stone-400">Projeção anual: <span className="font-bold text-lime-300">{formatCurrency(total)}</span></span>
            <span className="text-stone-500">baseado em {report.based_on_months} meses de dados</span>
          </div>
        </>
      )}
    </div>
  );
}
