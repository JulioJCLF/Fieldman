import type { Game } from '../types';

interface Props {
  game: Game;
}

const TYPE_LABEL: Record<string, string> = {
  OPEN: 'JOGO ABERTO',
  PRIVATE: 'JOGO FECHADO',
};

function formatDate(iso: string): string {
  const [year, month, day] = iso.split('-');
  return `${day}/${month}/${year}`;
}

export function GameStatusBanner({ game }: Props) {
  return (
    <div className="flex items-center justify-between gap-4 border border-primary/30 bg-primary/5 px-5 py-3">
      <div className="flex items-center gap-4">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
        </span>
        <div className="">
          <span className="text-xs font-bold text-primary">
            {TYPE_LABEL[game.type] ?? game.type}
          </span>
          <span className="ml-3 text-xs text-on-surface-variant">
            {formatDate(game.game_date)}
          </span>
        </div>
      </div>
      <span className="text-[10px] font-bold text-primary/70">
        EM ANDAMENTO
      </span>
    </div>
  );
}
