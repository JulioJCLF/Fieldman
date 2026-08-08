import { useEffect, useState } from 'react';

import { ApiError, getOverview } from '../api/analyticsApi';
import { formatCurrency } from '../format';
import type { OverviewReport } from '../types';

type Period = 'day' | 'month' | 'year';

const PERIOD_LABELS: Record<Period, string> = { day: 'Hoje', month: 'Mês', year: 'Ano' };

function rangeForPeriod(period: Period): { from: string; to: string } {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const d = now.getUTCDate();
  const iso = (date: Date) => date.toISOString().slice(0, 10);

  if (period === 'day') {
    const today = iso(new Date(Date.UTC(y, m, d)));
    return { from: today, to: today };
  }
  if (period === 'month') {
    return { from: iso(new Date(Date.UTC(y, m, 1))), to: iso(new Date(Date.UTC(y, m + 1, 0))) };
  }
  return { from: iso(new Date(Date.UTC(y, 0, 1))), to: iso(new Date(Date.UTC(y, 11, 31))) };
}

export function OverviewCards() {
  const [period, setPeriod]   = useState<Period>('month');
  const [report, setReport]   = useState<OverviewReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getOverview(rangeForPeriod(period))
      .then((r) => { if (!cancelled) setReport(r); })
      .catch((err) => { if (!cancelled) setError(err instanceof ApiError ? err.message : 'Erro ao carregar visão geral.'); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [period]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-lime-300">Visão geral</p>
        <div className="flex gap-2">
          {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
            <button key={p} type="button" onClick={() => setPeriod(p)}
              className={`border px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-[0.12em] transition ${
                period === p ? 'border-lime-300 bg-lime-300/10 text-lime-300' : 'border-[#384534] text-stone-400 hover:border-stone-500'
              }`}>
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {loading && <p className="font-mono text-xs text-stone-500">Carregando…</p>}
      {error && <p className="border-l-2 border-red-400 bg-red-400/5 px-3 py-2 font-mono text-xs text-red-300">{error}</p>}

      {!loading && !error && report && (
        <>
          <div className="border border-lime-300/30 bg-lime-300/5 p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-stone-500">Faturamento total</p>
            <p className="mt-1 text-3xl font-black text-lime-300">{formatCurrency(report.revenue.total)}</p>
          </div>

          <div className="grid grid-cols-2 gap-px border border-[#34402f] bg-[#34402f] font-mono sm:grid-cols-3 lg:grid-cols-5">
            {[
              ['Equipado', report.revenue.entry_equipped],
              ['Aluguel', report.revenue.entry_rental],
              ['Recargas', report.revenue.refills],
              ['Lanchonete', report.revenue.snackbar],
              ['Loja', report.revenue.store],
            ].map(([label, value]) => (
              <div key={label as string} className="bg-[#111711] p-4">
                <p className="text-[10px] uppercase tracking-[0.12em] text-stone-500">{label}</p>
                <p className="mt-1 text-sm font-bold text-stone-200">{formatCurrency(value as number)}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-px border border-[#34402f] bg-[#34402f] font-mono sm:grid-cols-4">
            {[
              ['Jogos', report.counts.games],
              ['Equipados', report.counts.equipped],
              ['Aluguéis', report.counts.rental],
              ['Recargas', report.counts.refills],
            ].map(([label, value]) => (
              <div key={label as string} className="bg-[#111711] p-4">
                <p className="text-[10px] uppercase tracking-[0.12em] text-stone-500">{label}</p>
                <p className="mt-1 text-xl font-bold text-stone-200">{value as number}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
