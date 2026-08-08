import { useEffect, useState } from 'react';

import { ApiError, getProjection } from '../api/analyticsApi';
import { formatCurrency, MONTH_LABELS } from '../format';
import type { ProjectionReport } from '../types';
import { BarChart } from './BarChart';

const NEXT_YEAR = new Date().getUTCFullYear() + 1;

export function ProjectionChart() {
  const [report, setReport] = useState<ProjectionReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    <div className="border border-outline-variant bg-surface-lowest p-5">
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs font-bold text-primary">
          Projeção {NEXT_YEAR}
        </p>
        <span className="text-[10px] text-outline">regressão linear</span>
      </div>

      {loading && <p className="mt-4 text-xs text-outline">Calculando projeção…</p>}
      {error && <p className="mt-4 border-l-2 border-error bg-error/5 px-3 py-2 text-xs text-error">{error}</p>}

      {!loading && !error && report && !report.sufficient_data && (
        <div className="mt-4 border-l-2 border-amber-400 bg-amber-400/5 px-4 py-3">
          <p className="text-xs text-amber-600">
            Dados insuficientes para projeção.
          </p>
          <p className="mt-1 text-[10px] text-outline">
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
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant pt-4 text-xs">
            <span className="text-on-surface-variant">Projeção anual: <span className="font-bold text-primary">{formatCurrency(total)}</span></span>
            <span className="text-outline">baseado em {report.based_on_months} meses de dados</span>
          </div>
        </>
      )}
    </div>
  );
}
