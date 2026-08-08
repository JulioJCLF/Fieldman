import type { SupabaseClient } from '@supabase/supabase-js';

import type { CreateGameInput, Game, GameStatus, GameType, GamesRepository } from './game.types.js';

interface GameRow {
  id: string;
  type: GameType;
  game_date: string;
  status: GameStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const gameColumns = 'id, type, game_date, status, notes, created_at, updated_at';

function toGame(row: GameRow): Game {
  return {
    id: row.id,
    type: row.type,
    game_date: row.game_date,
    status: row.status,
    notes: row.notes,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export class SupabaseGamesRepository implements GamesRepository {
  public constructor(private readonly supabase: SupabaseClient) {}

  public async create(input: CreateGameInput): Promise<Game> {
    const { data, error } = await this.supabase
      .from('games')
      .insert({ type: input.type, game_date: input.game_date, notes: input.notes ?? null })
      .select(gameColumns)
      .single();

    if (error) throw error;
    return toGame(data as GameRow);
  }

  public async findById(id: string): Promise<Game | null> {
    const { data, error } = await this.supabase
      .from('games')
      .select(gameColumns)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data ? toGame(data as GameRow) : null;
  }

  public async findActive(): Promise<Game | null> {
    const { data, error } = await this.supabase
      .from('games')
      .select(gameColumns)
      .eq('status', 'IN_PROGRESS')
      .maybeSingle();

    if (error) throw error;
    return data ? toGame(data as GameRow) : null;
  }

  public async updateStatus(id: string, status: GameStatus): Promise<Game> {
    const { data, error } = await this.supabase
      .from('games')
      .update({ status })
      .eq('id', id)
      .select(gameColumns)
      .single();

    if (error) throw error;
    return toGame(data as GameRow);
  }

  public async listByDate(date: string): Promise<Game[]> {
    const { data, error } = await this.supabase
      .from('games')
      .select(gameColumns)
      .eq('game_date', date)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data as GameRow[]).map(toGame);
  }
}
