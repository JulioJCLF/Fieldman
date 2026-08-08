import { useEffect, useState } from 'react';

import { getGameSummary } from '../../tabs/api/tabsApi';
import type { GameTabsSummary } from '../../tabs/types';
import { ApiError, finishGame } from '../api/gamesApi';
import type { Game } from '../types';

interface Props {
  game: Game;
  onGameFinished: (game: Game) => void;
}

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function GameSummaryCard({ game, onGameFinished }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [summary, setSummary]       = useState<GameTabsSummary | null>(null);

  useEffect(() => {
    let cancelled = false;
    getGameSummary(game.id)
      .then((s) => { if (!cancelled) setSummary(s); })
      .catch(() => { /* silencioso — contadores ficam nulos */ });
    return () => { cancelled = true; };
  }, [game.id]);

  async function handleFinish() {
    setError(null);
    setLoading(true);

    try {
      const finished = await finishGame(game.id);
      onGameFinished(finished);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao finalizar jogo.');
      setConfirming(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border border-outline-variant bg-surface-lowest p-5 sm:p-6">
      <div className="flex items-center justify-between gap-4 border-b border-outline-variant pb-4">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
          Jogo atual
        </p>
        <span className="text-[10px] uppercase tracking-[0.12em] text-outline">
          ID · {game.id.slice(0, 8)}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-px border border-outline-variant bg-primary-container text-xs">
        <div className="bg-surface-low p-3 text-center">
          <p className="uppercase tracking-[0.12em] text-outline">Equipados</p>
          <p className="mt-1 text-xl font-bold text-on-surface-variant">
            {summary !== null ? summary.equipped_count : '—'}
          </p>
        </div>
        <div className="bg-surface-low p-3 text-center">
          <p className="uppercase tracking-[0.12em] text-outline">Aluguéis</p>
          <p className="mt-1 text-xl font-bold text-on-surface-variant">
            {summary !== null ? summary.rental_count : '—'}
          </p>
        </div>
        <div className="bg-surface-low p-3 text-center">
          <p className="uppercase tracking-[0.12em] text-outline">Faturamento</p>
          <p className="mt-1 text-base font-bold text-on-surface-variant">
            {summary !== null ? formatCurrency(summary.total_revenue) : '—'}
          </p>
        </div>
      </div>

      {game.notes && (
        <p className="mt-3 text-sm leading-6 text-on-surface-variant">
          <span className="text-[10px] uppercase tracking-[0.12em] text-outline">Obs: </span>
          {game.notes}
        </p>
      )}

      {error && (
        <p className="mt-4 border-l-2 border-error bg-error/5 px-3 py-2 text-xs text-error">
          {error}
        </p>
      )}

      <div className="mt-5 flex justify-end border-t border-outline-variant pt-4">
        {confirming ? (
          <div className="flex items-center gap-3">
            <p className="text-xs text-amber-600">Confirmar finalização?</p>
            <button
              onClick={() => setConfirming(false)}
              disabled={loading}
              className="border border-outline-variant px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-on-surface-variant hover:border-outline disabled:opacity-40"
            >
              Não
            </button>
            <button
              onClick={handleFinish}
              disabled={loading}
              className="border border-error bg-error/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-error hover:bg-error/20 disabled:opacity-40"
            >
              {loading ? 'Finalizando…' : 'Sim, finalizar'}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            className="border border-error/50 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-error transition hover:border-error hover:bg-error/10"
          >
            Finalizar jogo
          </button>
        )}
      </div>
    </div>
  );
}
