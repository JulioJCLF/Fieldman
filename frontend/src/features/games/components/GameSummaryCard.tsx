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
    <div className="border border-[#384534] bg-[#0d120d] p-5 sm:p-6">
      <div className="flex items-center justify-between gap-4 border-b border-[#2d382a] pb-4">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-lime-300">
          Jogo atual
        </p>
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-stone-500">
          ID · {game.id.slice(0, 8)}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-px border border-[#34402f] bg-[#34402f] font-mono text-xs">
        <div className="bg-[#111711] p-3 text-center">
          <p className="uppercase tracking-[0.12em] text-stone-500">Equipados</p>
          <p className="mt-1 text-xl font-bold text-stone-300">
            {summary !== null ? summary.equipped_count : '—'}
          </p>
        </div>
        <div className="bg-[#111711] p-3 text-center">
          <p className="uppercase tracking-[0.12em] text-stone-500">Aluguéis</p>
          <p className="mt-1 text-xl font-bold text-stone-300">
            {summary !== null ? summary.rental_count : '—'}
          </p>
        </div>
        <div className="bg-[#111711] p-3 text-center">
          <p className="uppercase tracking-[0.12em] text-stone-500">Faturamento</p>
          <p className="mt-1 text-base font-bold text-stone-300">
            {summary !== null ? formatCurrency(summary.total_revenue) : '—'}
          </p>
        </div>
      </div>

      {game.notes && (
        <p className="mt-3 text-sm leading-6 text-stone-400">
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-stone-500">Obs: </span>
          {game.notes}
        </p>
      )}

      {error && (
        <p className="mt-4 border-l-2 border-red-400 bg-red-400/5 px-3 py-2 font-mono text-xs text-red-300">
          {error}
        </p>
      )}

      <div className="mt-5 flex justify-end border-t border-[#2d382a] pt-4">
        {confirming ? (
          <div className="flex items-center gap-3">
            <p className="font-mono text-xs text-amber-300">Confirmar finalização?</p>
            <button
              onClick={() => setConfirming(false)}
              disabled={loading}
              className="border border-[#384534] px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-[0.12em] text-stone-400 hover:border-stone-500 disabled:opacity-40"
            >
              Não
            </button>
            <button
              onClick={handleFinish}
              disabled={loading}
              className="border border-red-400 bg-red-400/10 px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-[0.12em] text-red-300 hover:bg-red-400/20 disabled:opacity-40"
            >
              {loading ? 'Finalizando…' : 'Sim, finalizar'}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            className="border border-red-400/50 px-4 py-2 font-mono text-xs font-bold uppercase tracking-[0.14em] text-red-400 transition hover:border-red-400 hover:bg-red-400/10"
          >
            Finalizar jogo
          </button>
        )}
      </div>
    </div>
  );
}
