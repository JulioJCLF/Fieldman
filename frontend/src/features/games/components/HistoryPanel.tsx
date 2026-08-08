import { useCallback, useEffect, useState } from 'react';

import { Alert, Badge, Button, Card, formatCurrency } from '../../../components/ui';
import { listTabs } from '../../tabs/api/tabsApi';
import type { TabWithRefills } from '../../tabs/types';
import { ApiError, getGameHistory } from '../api/gamesApi';
import type { GameHistoryItem, GameStatus } from '../types';

const STATUS_LABEL: Record<GameStatus, string> = {
  SCHEDULED: 'Agendado',
  IN_PROGRESS: 'Em andamento',
  FINISHED: 'Finalizado',
};

const STATUS_TONE: Record<GameStatus, 'neutral' | 'success' | 'info' | 'warning'> = {
  SCHEDULED: 'warning',
  IN_PROGRESS: 'info',
  FINISHED: 'success',
};

function formatDate(value: string): string {
  // game_date vem como YYYY-MM-DD; evita fuso tratando como data local simples.
  const [y, m, d] = value.split('-');
  return d && m && y ? `${d}/${m}/${y}` : value;
}

export function HistoryPanel() {
  const [games, setGames] = useState<GameHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setGames(await getGameHistory());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível carregar o histórico.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const totals = games.reduce(
    (acc, g) => ({
      games: acc.games + 1,
      players: acc.players + g.player_count,
      revenue: acc.revenue + g.total_revenue,
    }),
    { games: 0, players: 0, revenue: 0 },
  );

  return (
    <>
      <section className="border-b border-outline-variant pb-8">
        <p className="text-xs font-bold text-primary">Módulo 07 · games/histórico</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-on-surface sm:text-5xl">Histórico de jogos.</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-on-surface-variant">
          Todos os jogos já realizados, com participantes e faturamento. Clique em um jogo para ver as comandas.
        </p>
      </section>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <SummaryTile label="Jogos" value={String(totals.games)} />
        <SummaryTile label="Jogadores (total)" value={String(totals.players)} />
        <SummaryTile label="Faturamento" value={formatCurrency(totals.revenue)} highlight />
      </div>

      <div className="mt-6">
        <Card title="Jogos realizados" actions={<Button variant="ghost" size="sm" onClick={() => void load()}>Atualizar</Button>}>
          {error && <div className="mb-4"><Alert>{error}</Alert></div>}

          {loading ? (
            <p className="py-8 text-center text-sm text-on-surface-variant">Carregando histórico…</p>
          ) : games.length === 0 ? (
            <p className="py-8 text-center text-sm text-on-surface-variant">Nenhum jogo registrado ainda.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-outline-variant text-left text-xs font-medium text-outline">
                    <th className="pb-3 pr-4 font-medium">Data</th>
                    <th className="pb-3 pr-4 font-medium">Tipo</th>
                    <th className="pb-3 pr-4 font-medium">Status</th>
                    <th className="pb-3 pr-4 text-right font-medium">Jogadores</th>
                    <th className="pb-3 pr-4 text-right font-medium">Entradas</th>
                    <th className="pb-3 pr-4 text-right font-medium">Recargas</th>
                    <th className="pb-3 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {games.map((g) => (
                    <GameRow
                      key={g.id}
                      game={g}
                      expanded={expanded === g.id}
                      onToggle={() => setExpanded(expanded === g.id ? null : g.id)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}

function SummaryTile({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-xl border border-outline-variant bg-surface-lowest p-5 shadow-panel">
      <p className="text-xs font-medium text-outline">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${highlight ? 'text-primary' : 'text-on-surface'}`}>{value}</p>
    </div>
  );
}

function GameRow({ game, expanded, onToggle }: { game: GameHistoryItem; expanded: boolean; onToggle: () => void }) {
  return (
    <>
      <tr className="cursor-pointer transition hover:bg-surface-low" onClick={onToggle}>
        <td className="py-3 pr-4">
          <span className="inline-flex items-center gap-2 font-medium text-on-surface">
            <span className={`text-outline transition ${expanded ? 'rotate-90' : ''}`}>›</span>
            {formatDate(game.game_date)}
          </span>
        </td>
        <td className="py-3 pr-4 text-on-surface-variant">{game.type === 'OPEN' ? 'Aberto' : 'Fechado'}</td>
        <td className="py-3 pr-4"><Badge tone={STATUS_TONE[game.status]}>{STATUS_LABEL[game.status]}</Badge></td>
        <td className="py-3 pr-4 text-right text-on-surface-variant">
          {game.player_count}
          <span className="ml-1 text-xs text-outline">({game.equipped_count}e / {game.rental_count}a)</span>
        </td>
        <td className="py-3 pr-4 text-right text-on-surface-variant">{formatCurrency(game.entry_revenue)}</td>
        <td className="py-3 pr-4 text-right text-on-surface-variant">{formatCurrency(game.refills_revenue)}</td>
        <td className="py-3 text-right font-semibold text-on-surface">{formatCurrency(game.total_revenue)}</td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={7} className="bg-surface-low px-4 py-4">
            <GameDetail gameId={game.id} notes={game.notes} />
          </td>
        </tr>
      )}
    </>
  );
}

function GameDetail({ gameId, notes }: { gameId: string; notes: string | null }) {
  const [tabs, setTabs] = useState<TabWithRefills[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listTabs(gameId)
      .then((data) => { if (!cancelled) setTabs(data); })
      .catch((err) => { if (!cancelled) setError(err instanceof ApiError ? err.message : 'Erro ao carregar comandas.'); });
    return () => { cancelled = true; };
  }, [gameId]);

  if (error) return <Alert>{error}</Alert>;
  if (!tabs) return <p className="text-sm text-on-surface-variant">Carregando comandas…</p>;

  return (
    <div>
      {notes && <p className="mb-3 text-sm text-on-surface-variant"><span className="font-medium text-on-surface">Observações:</span> {notes}</p>}
      {tabs.length === 0 ? (
        <p className="text-sm text-on-surface-variant">Nenhuma comanda neste jogo.</p>
      ) : (
        <ul className="divide-y divide-outline-variant rounded-lg border border-outline-variant bg-surface-lowest">
          {tabs.map((tab) => {
            const refillsTotal = tab.refills.reduce((s, r) => s + Number(r.total_price), 0);
            return (
              <li key={tab.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm">
                <span className="font-medium text-on-surface">{tab.player_name}</span>
                <div className="flex items-center gap-3 text-on-surface-variant">
                  <Badge tone="neutral">{tab.modality === 'EQUIPPED' ? 'Equipado' : 'Aluguel'}</Badge>
                  <span>Entrada {formatCurrency(Number(tab.entry_fee))}</span>
                  <Badge tone={tab.entry_status === 'PAID' ? 'success' : 'warning'}>
                    {tab.entry_status === 'PAID' ? 'Pago' : 'Pendente'}
                  </Badge>
                  <span>{tab.refills.length} recarga(s) · {formatCurrency(refillsTotal)}</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
