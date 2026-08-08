import type { SupabaseClient } from '@supabase/supabase-js';

import type {
  AnalyticsRepository,
  DateRange,
  EntryRow,
  GameRow,
  RefillRow,
  SaleRow,
} from './analytics.types.js';

export class SupabaseAnalyticsRepository implements AnalyticsRepository {
  public constructor(private readonly supabase: SupabaseClient) {}

  public async getEntries(range: DateRange): Promise<EntryRow[]> {
    const { data, error } = await this.supabase
      .from('tabs')
      .select('created_at, modality, entry_fee, entry_status')
      .gte('created_at', range.from)
      .lte('created_at', range.to);

    if (error) throw error;

    return (data as Array<{ created_at: string; modality: 'EQUIPPED' | 'RENTAL'; entry_fee: string; entry_status: 'PENDING' | 'PAID' }>)
      .map((row) => ({
        at:       row.created_at,
        modality: row.modality,
        amount:   Number(row.entry_fee),
        paid:     row.entry_status === 'PAID',
      }));
  }

  public async getRefills(range: DateRange): Promise<RefillRow[]> {
    const { data, error } = await this.supabase
      .from('consumables_refills')
      .select('created_at, item_type, total_price, payment_status')
      .gte('created_at', range.from)
      .lte('created_at', range.to);

    if (error) throw error;

    return (data as Array<{ created_at: string; item_type: 'REFILL' | 'SNACKBAR' | 'STORE'; total_price: string; payment_status: 'PAID' | 'OPEN' }>)
      .map((row) => ({
        at:        row.created_at,
        item_type: row.item_type,
        amount:    Number(row.total_price),
        paid:      row.payment_status === 'PAID',
      }));
  }

  public async getSales(range: DateRange): Promise<SaleRow[]> {
    const { data, error } = await this.supabase
      .from('inventory_sales')
      .select('sold_at, channel, total_price')
      .gte('sold_at', range.from)
      .lte('sold_at', range.to);

    if (error) throw error;

    return (data as Array<{ sold_at: string; channel: 'SNACKBAR' | 'STORE'; total_price: string }>)
      .map((row) => ({
        at:      row.sold_at,
        channel: row.channel,
        amount:  Number(row.total_price),
      }));
  }

  public async getGames(range: DateRange): Promise<GameRow[]> {
    // Jogos são atribuídos por game_date (data do jogo), não pelo timestamp de criação.
    const { data, error } = await this.supabase
      .from('games')
      .select('game_date, type')
      .gte('game_date', range.from.slice(0, 10))
      .lte('game_date', range.to.slice(0, 10));

    if (error) throw error;

    return (data as Array<{ game_date: string; type: 'OPEN' | 'PRIVATE' }>)
      .map((row) => ({
        at:   `${row.game_date}T00:00:00.000Z`,
        type: row.type,
      }));
  }
}
