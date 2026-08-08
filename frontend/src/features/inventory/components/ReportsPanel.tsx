import { useEffect, useState } from 'react';

import { ApiError, getRevenueSummary, getTopCategories, getTopProducts } from '../api/inventoryApi';
import { formatCurrency, rangeForPeriod } from '../format';
import type { InventoryChannel, RevenueSummary, TopCategory, TopProduct } from '../types';

interface Props {
  channel: InventoryChannel;
  /** Muda para forçar recarga dos relatórios (ex: após uma venda). */
  refreshKey: number;
}

type Period = 'day' | 'month' | 'year';

const PERIOD_LABELS: Record<Period, string> = {
  day:   'Hoje',
  month: 'Mês',
  year:  'Ano',
};

export function ReportsPanel({ channel, refreshKey }: Props) {
  const [period, setPeriod]         = useState<Period>('month');
  const [summary, setSummary]       = useState<RevenueSummary | null>(null);
  const [topProducts, setTopProducts]   = useState<TopProduct[]>([]);
  const [topCategories, setTopCategories] = useState<TopCategory[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const range = rangeForPeriod(period);

    setLoading(true);
    setError(null);

    Promise.all([
      getRevenueSummary(channel, range),
      getTopProducts(channel, range),
      getTopCategories(channel, range),
    ])
      .then(([s, p, c]) => {
        if (cancelled) return;
        setSummary(s);
        setTopProducts(p);
        setTopCategories(c);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Erro ao carregar relatórios.');
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [channel, period, refreshKey]);

  return (
    <div className="space-y-5">
      {/* Seletor de período */}
      <div className="flex gap-2">
        {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
          <button key={p} type="button" onClick={() => setPeriod(p)}
            className={`border px-4 py-2 font-mono text-xs font-bold uppercase tracking-[0.14em] transition ${
              period === p ? 'border-lime-300 bg-lime-300/10 text-lime-300' : 'border-[#384534] text-stone-400 hover:border-stone-500'
            }`}>
            {PERIOD_LABELS[p]}
          </button>
        ))}
      </div>

      {loading && <p className="font-mono text-xs text-stone-500">Carregando relatórios…</p>}
      {error && <p className="border-l-2 border-red-400 bg-red-400/5 px-3 py-2 font-mono text-xs text-red-300">{error}</p>}

      {!loading && !error && summary && (
        <>
          {/* Cartões de faturamento */}
          <div className="grid grid-cols-2 gap-px border border-[#34402f] bg-[#34402f] font-mono sm:grid-cols-4">
            <div className="bg-[#111711] p-4">
              <p className="text-[10px] uppercase tracking-[0.12em] text-stone-500">Faturamento</p>
              <p className="mt-1 text-lg font-bold text-lime-300">{formatCurrency(summary.revenue)}</p>
            </div>
            <div className="bg-[#111711] p-4">
              <p className="text-[10px] uppercase tracking-[0.12em] text-stone-500">Lucro</p>
              <p className="mt-1 text-lg font-bold text-stone-200">{formatCurrency(summary.profit)}</p>
            </div>
            <div className="bg-[#111711] p-4">
              <p className="text-[10px] uppercase tracking-[0.12em] text-stone-500">Unidades</p>
              <p className="mt-1 text-lg font-bold text-stone-200">{summary.units_sold}</p>
            </div>
            <div className="bg-[#111711] p-4">
              <p className="text-[10px] uppercase tracking-[0.12em] text-stone-500">Vendas</p>
              <p className="mt-1 text-lg font-bold text-stone-200">{summary.sales_count}</p>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {/* Produtos mais vendidos */}
            <div className="border border-[#2d382a] bg-[#0d120d] p-5">
              <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-lime-300">Mais vendidos</p>
              {topProducts.length === 0 ? (
                <p className="mt-3 font-mono text-xs text-stone-500">Sem vendas no período.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {topProducts.map((p, i) => (
                    <li key={p.product_id} className="flex items-center justify-between gap-3 font-mono text-xs">
                      <span className="truncate text-stone-300">
                        <span className="text-stone-600">{i + 1}. </span>{p.name}
                      </span>
                      <span className="shrink-0 text-stone-400">{p.units_sold} un · {formatCurrency(p.revenue)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Por categoria */}
            <div className="border border-[#2d382a] bg-[#0d120d] p-5">
              <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-lime-300">Por categoria</p>
              {topCategories.length === 0 ? (
                <p className="mt-3 font-mono text-xs text-stone-500">Sem vendas no período.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {topCategories.map((c) => (
                    <li key={c.category} className="flex items-center justify-between gap-3 font-mono text-xs">
                      <span className="truncate text-stone-300">{c.category}</span>
                      <span className="shrink-0 text-stone-400">{c.units_sold} un · {formatCurrency(c.revenue)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
