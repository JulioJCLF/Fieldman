import { useEffect, useState } from 'react';

import { CheckInSection } from '../../tabs/components/CheckInSection';
import { ApiError, getActiveGame } from '../api/gamesApi';
import type { Game } from '../types';
import { CreateGameForm } from './CreateGameForm';
import { GameStatusBanner } from './GameStatusBanner';
import { GameSummaryCard } from './GameSummaryCard';

export function GamePanel() {
  const [activeGame, setActiveGame]   = useState<Game | null>(null);
  const [showForm, setShowForm]       = useState(false);
  const [loadingInit, setLoadingInit] = useState(true);
  const [initError, setInitError]     = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    getActiveGame()
      .then((game) => { if (!cancelled) setActiveGame(game); })
      .catch((err) => {
        if (!cancelled) {
          setInitError(err instanceof ApiError ? err.message : 'Não foi possível verificar o jogo ativo.');
        }
      })
      .finally(() => { if (!cancelled) setLoadingInit(false); });

    return () => { cancelled = true; };
  }, []);

  function handleGameStarted(game: Game) {
    setActiveGame(game);
    setShowForm(false);
  }

  function handleGameFinished(game: Game) {
    if (game.status === 'FINISHED') {
      setActiveGame(null);
    }
  }

  return (
    <section className="border-b border-[#293226] pb-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-lime-300">
            Módulo 02 · games/jogo
          </p>
          <h2 className="mt-2 text-2xl font-black uppercase tracking-tight text-white sm:text-3xl">
            Gestão de jogo.
          </h2>
        </div>
        {!activeGame && !showForm && !loadingInit && (
          <button
            onClick={() => setShowForm(true)}
            className="border border-lime-300 px-4 py-2 font-mono text-xs font-bold uppercase tracking-[0.14em] text-lime-200 transition hover:bg-lime-300 hover:text-[#080b08]"
          >
            Abrir novo jogo →
          </button>
        )}
      </div>

      <div className="mt-5 space-y-4">
        {loadingInit && (
          <p className="font-mono text-xs text-stone-500">Verificando jogo ativo…</p>
        )}

        {initError && (
          <p className="border-l-2 border-red-400 bg-red-400/5 px-3 py-2 font-mono text-xs text-red-300">
            {initError}
          </p>
        )}

        {!loadingInit && !initError && activeGame && (
          <>
            <GameStatusBanner game={activeGame} />
            <GameSummaryCard game={activeGame} onGameFinished={handleGameFinished} />
            <CheckInSection gameId={activeGame.id} />
          </>
        )}

        {!loadingInit && !initError && !activeGame && !showForm && (
          <div className="border border-dashed border-[#384534] px-5 py-6 text-center">
            <p className="font-mono text-xs text-stone-500">
              Nenhum jogo em andamento. Abra um novo jogo para iniciar o check-in.
            </p>
          </div>
        )}

        {showForm && (
          <CreateGameForm
            onGameStarted={handleGameStarted}
            onCancel={() => setShowForm(false)}
          />
        )}
      </div>
    </section>
  );
}
