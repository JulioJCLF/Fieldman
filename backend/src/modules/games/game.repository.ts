import type { SupabaseClient } from '@supabase/supabase-js';

import type { EntryStatus, TabModality } from '../tabs/tab.types.js';
import type { CreateGameInput, Game, GameHistoryItem, GameStatus, GameType, GamesRepository } from './game.types.js';

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

  /**
   * Lista os jogos (mais recentes primeiro) com estatísticas agregadas das
   * comandas. Faz apenas 3 consultas (jogos, comandas, recargas pagas) e
   * agrega em memória, evitando N+1. Receita segue a mesma definição do
   * resumo por jogo: entradas pagas + recargas pagas.
   */
  public async listHistoryWithStats(): Promise<GameHistoryItem[]> {
    const { data: gamesData, error } = await this.supabase
      .from('games')
      .select(gameColumns)
      .order('game_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) throw error;
    const games = (gamesData as GameRow[]).map(toGame);
    if (games.length === 0) return [];

    const gameIds = games.map((g) => g.id);
    const { data: tabsData, error: tabsError } = await this.supabase
      .from('tabs')
      .select('id, game_id, modality, entry_fee, entry_status')
      .in('game_id', gameIds);

    if (tabsError) throw tabsError;
    const tabs = tabsData as Array<{ id: string; game_id: string; modality: TabModality; entry_fee: string; entry_status: EntryStatus }>;

    const tabToGame = new Map(tabs.map((t) => [t.id, t.game_id]));
    let refills: Array<{ tab_id: string; total_price: string }> = [];
    if (tabs.length > 0) {
      const { data: refillsData, error: refillsError } = await this.supabase
        .from('consumables_refills')
        .select('tab_id, total_price')
        .in('tab_id', tabs.map((t) => t.id))
        .eq('payment_status', 'PAID');

      if (refillsError) throw refillsError;
      refills = refillsData as Array<{ tab_id: string; total_price: string }>;
    }

    interface Acc { players: number; equipped: number; rental: number; entry: number; refills: number }
    const stats = new Map<string, Acc>(games.map((g) => [g.id, { players: 0, equipped: 0, rental: 0, entry: 0, refills: 0 }]));

    for (const tab of tabs) {
      const acc = stats.get(tab.game_id);
      if (!acc) continue;
      acc.players += 1;
      if (tab.modality === 'EQUIPPED') acc.equipped += 1;
      else if (tab.modality === 'RENTAL') acc.rental += 1;
      if (tab.entry_status === 'PAID') acc.entry += Number(tab.entry_fee);
    }

    for (const refill of refills) {
      const gameId = tabToGame.get(refill.tab_id);
      const acc = gameId ? stats.get(gameId) : undefined;
      if (acc) acc.refills += Number(refill.total_price);
    }

    return games.map((game) => {
      const acc = stats.get(game.id) ?? { players: 0, equipped: 0, rental: 0, entry: 0, refills: 0 };
      return {
        ...game,
        player_count:    acc.players,
        equipped_count:  acc.equipped,
        rental_count:    acc.rental,
        entry_revenue:   acc.entry,
        refills_revenue: acc.refills,
        total_revenue:   acc.entry + acc.refills,
      };
    });
  }
}
