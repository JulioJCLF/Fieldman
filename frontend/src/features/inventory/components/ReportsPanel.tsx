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
  day: 'Hoje',
  month: 'Mês',
  year: 'Ano',
};

export function ReportsPanel({ channel, refreshKey }: Props) {
  const [period, setPeriod] = useState<Period>('month');
  const [summary, setSummary] = useState<RevenueSummary | null>(null);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [topCategories, setTopCategories] = useState<TopCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
            className={`border px-4 py-2 text-xs font-bold transition ${
              period === p ? 'border-primary bg-primary/10 text-primary' : 'border-outline-variant text-on-surface-variant hover:border-outline'
            }`}>
            {PERIOD_LABELS[p]}
          </button>
        ))}
      </div>

      {loading && <p className="text-xs text-outline">Carregando relatórios…</p>}
      {error && <p className="border-l-2 border-error bg-error/5 px-3 py-2 text-xs text-error">{error}</p>}

      {!loading && !error && summary && (
        <>
          {/* Cartões de faturamento */}
          <div className="grid grid-cols-2 gap-px border border-outline-variant bg-primary-container sm:grid-cols-4">
            <div className="bg-surface-low p-4">
              <p className="text-[10px] text-outline">Faturamento</p>
              <p className="mt-1 text-lg font-bold text-primary">{formatCurrency(summary.revenue)}</p>
            </div>
            <div className="bg-surface-low p-4">
              <p className="text-[10px] text-outline">Lucro</p>
              <p className="mt-1 text-lg font-bold text-on-surface">{formatCurrency(summary.profit)}</p>
            </div>
            <div className="bg-surface-low p-4">
              <p className="text-[10px] text-outline">Unidades</p>
              <p className="mt-1 text-lg font-bold text-on-surface">{summary.units_sold}</p>
            </div>
            <div className="bg-surface-low p-4">
              <p className="text-[10px] text-outline">Vendas</p>
              <p className="mt-1 text-lg font-bold text-on-surface">{summary.sales_count}</p>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {/* Produtos mais vendidos */}
            <div className="border border-outline-variant bg-surface-lowest p-5">
              <p className="text-xs font-bold text-primary">Mais vendidos</p>
              {topProducts.length === 0 ? (
                <p className="mt-3 text-xs text-outline">Sem vendas no período.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {topProducts.map((p, i) => (
                    <li key={p.product_id} className="flex items-center justify-between gap-3 text-xs">
                      <span className="truncate text-on-surface-variant">
                        <span className="text-outline">{i + 1}. </span>{p.name}
                      </span>
                      <span className="shrink-0 text-on-surface-variant">{p.units_sold} un · {formatCurrency(p.revenue)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Por categoria */}
            <div className="border border-outline-variant bg-surface-lowest p-5">
              <p className="text-xs font-bold text-primary">Por categoria</p>
              {topCategories.length === 0 ? (
                <p className="mt-3 text-xs text-outline">Sem vendas no período.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {topCategories.map((c) => (
                    <li key={c.category} className="flex items-center justify-between gap-3 text-xs">
                      <span className="truncate text-on-surface-variant">{c.category}</span>
                      <span className="shrink-0 text-on-surface-variant">{c.units_sold} un · {formatCurrency(c.revenue)}</span>
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
