export const GAME_TYPES    = ['OPEN', 'PRIVATE']                       as const;
export const GAME_STATUSES = ['SCHEDULED', 'IN_PROGRESS', 'FINISHED'] as const;

export type GameType   = (typeof GAME_TYPES)[number];
export type GameStatus = (typeof GAME_STATUSES)[number];

export interface Game {
  id: string;
  type: GameType;
  game_date: string;
  status: GameStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateGameInput {
  type: GameType;
  game_date: string;
  notes?: string;
}

/** Jogo com estatísticas agregadas de comandas para a tela de histórico. */
export interface GameHistoryItem extends Game {
  player_count: number;
  equipped_count: number;
  rental_count: number;
  entry_revenue: number;
  refills_revenue: number;
  total_revenue: number;
}

export interface GamesRepository {
  create(input: CreateGameInput): Promise<Game>;
  findById(id: string): Promise<Game | null>;
  findActive(): Promise<Game | null>;
  updateStatus(id: string, status: GameStatus): Promise<Game>;
  listByDate(date: string): Promise<Game[]>;
  listHistoryWithStats(): Promise<GameHistoryItem[]>;
}
