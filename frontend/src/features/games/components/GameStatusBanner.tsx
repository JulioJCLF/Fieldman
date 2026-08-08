import type { Game } from '../types';

interface Props {
  game: Game;
}

const TYPE_LABEL: Record<string, string> = {
  OPEN:    'JOGO ABERTO',
  PRIVATE: 'JOGO FECHADO',
};

function formatDate(iso: string): string {
  const [year, month, day] = iso.split('-');
  return `${day}/${month}/${year}`;
}

export function GameStatusBanner({ game }: Props) {
  return (
    <div className="flex items-center justify-between gap-4 border border-lime-300/30 bg-lime-300/5 px-5 py-3">
      <div className="flex items-center gap-4">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lime-300 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-lime-300" />
        </span>
        <div className="font-mono">
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-lime-300">
            {TYPE_LABEL[game.type] ?? game.type}
          </span>
          <span className="ml-3 text-xs text-stone-400">
            {formatDate(game.game_date)}
          </span>
        </div>
      </div>
      <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-lime-300/70">
        EM ANDAMENTO
      </span>
    </div>
  );
}
