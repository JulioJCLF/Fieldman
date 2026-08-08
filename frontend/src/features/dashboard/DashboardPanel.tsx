import { useEffect, useState } from 'react';

import { formatCurrency } from '../../components/ui';
import type { AppView } from '../../navigation';
import { ApiError, getOverview } from '../analytics/api/analyticsApi';
import type { OverviewReport } from '../analytics/types';

interface Props {
  onNavigate: (view: AppView) => void;
}

const SHORTCUTS: { view: AppView; title: string; description: string }[] = [
  { view: 'reception', title: 'Recepção', description: 'Cadastrar jogadores e localizar fichas.' },
  { view: 'games', title: 'Jogos', description: 'Abrir jogo, iniciar e fazer check-in.' },
  { view: 'history', title: 'Histórico', description: 'Jogos realizados e faturamento por partida.' },
  { view: 'snackbar', title: 'Lanchonete', description: 'Vendas e produtos da lanchonete.' },
  { view: 'store', title: 'Loja', description: 'Vendas e produtos da loja.' },
  { view: 'analytics', title: 'Gestão', description: 'Relatórios, comparativos e projeções.' },
  { view: 'users', title: 'Usuários', description: 'Gerenciar quem acessa o sistema.' },
];

function allTimeRange(): { from: string; to: string } {
  return { from: '2020-01-01', to: new Date().toISOString().slice(0, 10) };
}

export function DashboardPanel({ onNavigate }: Props) {
  const [overview, setOverview] = useState<OverviewReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getOverview(allTimeRange())
      .then((data) => { if (!cancelled) setOverview(data); })
      .catch((err) => { if (!cancelled) setError(err instanceof ApiError ? err.message : 'Não foi possível carregar os indicadores.'); });
    return () => { cancelled = true; };
  }, []);

  const revenue = overview?.revenue;
  const counts = overview?.counts;
  const players = counts ? counts.equipped + counts.rental : 0;

  return (
    <>
      <section className="border-b border-outline-variant pb-8">
        <p className="text-xs font-bold text-primary">Central operacional</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-on-surface sm:text-5xl">Painel geral.</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-on-surface-variant">
          Visão rápida do campo e atalhos para cada área da operação.
        </p>
      </section>

      {error && (
        <p className="mt-6 rounded-lg border-l-4 border-error bg-error/10 px-3 py-2 text-sm text-error">{error}</p>
      )}

      {/* KPIs */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Faturamento total" value={revenue ? formatCurrency(revenue.total) : '—'} highlight />
        <Kpi label="Jogos realizados" value={counts ? String(counts.games) : '—'} />
        <Kpi label="Jogadores atendidos" value={counts ? String(players) : '—'} />
        <Kpi label="Recargas vendidas" value={counts ? String(counts.refills) : '—'} />
      </div>

      {/* Composição do faturamento */}
      {revenue && (
        <div className="mt-4 rounded-xl border border-outline-variant bg-surface-lowest p-5 shadow-panel sm:p-6">
          <p className="text-xs font-medium text-outline">Composição do faturamento</p>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-5">
            <Breakdown label="Entrada equipado" value={revenue.entry_equipped} total={revenue.total} />
            <Breakdown label="Entrada aluguel" value={revenue.entry_rental} total={revenue.total} />
            <Breakdown label="Recargas" value={revenue.refills} total={revenue.total} />
            <Breakdown label="Lanchonete" value={revenue.snackbar} total={revenue.total} />
            <Breakdown label="Loja" value={revenue.store} total={revenue.total} />
          </div>
        </div>
      )}

      {/* Atalhos */}
      <h2 className="mt-10 text-lg font-semibold text-on-surface">Acessar áreas</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SHORTCUTS.map((s) => (
          <button
            key={s.view}
            type="button"
            onClick={() => onNavigate(s.view)}
            className="group rounded-xl border border-outline-variant bg-surface-lowest p-5 text-left shadow-panel transition hover:border-primary hover:shadow-panel-lg"
          >
            <div className="flex items-center justify-between">
              <p className="text-base font-semibold text-on-surface">{s.title}</p>
              <span className="text-outline transition group-hover:translate-x-0.5 group-hover:text-primary">→</span>
            </div>
            <p className="mt-1.5 text-sm leading-6 text-on-surface-variant">{s.description}</p>
          </button>
        ))}
      </div>
    </>
  );
}

function Kpi({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-xl border border-outline-variant bg-surface-lowest p-5 shadow-panel">
      <p className="text-xs font-medium text-outline">{label}</p>
      <p className={`mt-1 text-3xl font-semibold ${highlight ? 'text-primary' : 'text-on-surface'}`}>{value}</p>
    </div>
  );
}

function Breakdown({ label, value, total }: { label: string; value: number; total: number }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <p className="text-xs text-outline">{label}</p>
      <p className="mt-1 text-sm font-semibold text-on-surface">{formatCurrency(value)}</p>
      <p className="text-xs text-outline">{pct}%</p>
    </div>
  );
}
