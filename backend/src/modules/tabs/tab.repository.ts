import type { SupabaseClient } from '@supabase/supabase-js';

import type {
  CreateRefillInput,
  CreateTabInput,
  EntryStatus,
  GameTabsSummary,
  GatewayPayment,
  ItemType,
  PaymentGwStatus,
  PaymentMethod,
  PaymentStatus,
  Refill,
  TabModality,
  TabWithRefills,
  TabsRepository,
} from './tab.types.js';

interface RefillRow {
  id: string;
  tab_id: string;
  item_type: ItemType;
  description: string;
  quantity: number;
  total_price: string;
  payment_status: PaymentStatus;
  created_at: string;
}

interface GatewayPaymentRow {
  id: string;
  tab_id: string;
  gateway_transaction_id: string | null;
  method: PaymentMethod;
  amount: string;
  status: PaymentGwStatus;
  created_at: string;
}

interface TabRow {
  id: string;
  game_id: string;
  player_id: string | null;
  guest_name: string | null;
  player_name: string;
  modality: TabModality;
  entry_fee: string;
  entry_status: EntryStatus;
  created_at: string;
  updated_at: string;
  consumables_refills: RefillRow[];
  gateway_payments: GatewayPaymentRow[];
}

const tabSelect = `
  id, game_id, player_id, guest_name, player_name, modality, entry_fee, entry_status, created_at, updated_at,
  consumables_refills ( id, tab_id, item_type, description, quantity, total_price, payment_status, created_at ),
  gateway_payments ( id, tab_id, gateway_transaction_id, method, amount, status, created_at )
`;

function toRefill(row: RefillRow): Refill {
  return { ...row, total_price: Number(row.total_price) };
}

function toPayment(row: GatewayPaymentRow): GatewayPayment {
  return { ...row, amount: Number(row.amount) };
}

function toTabWithRefills(row: TabRow): TabWithRefills {
  return {
    id: row.id,
    game_id: row.game_id,
    player_id: row.player_id,
    guest_name: row.guest_name,
    player_name: row.player_name,
    modality: row.modality,
    entry_fee: Number(row.entry_fee),
    entry_status: row.entry_status,
    created_at: row.created_at,
    updated_at: row.updated_at,
    refills:  (row.consumables_refills ?? []).map(toRefill),
    payments: (row.gateway_payments   ?? []).map(toPayment),
  };
}

export class SupabaseTabsRepository implements TabsRepository {
  public constructor(private readonly supabase: SupabaseClient) {}

  public async createTab(input: CreateTabInput): Promise<TabWithRefills> {
    const { data, error } = await this.supabase
      .from('tabs')
      .insert({
        game_id:     input.game_id,
        player_id:   input.player_id ?? null,
        guest_name:  input.guest_name ?? null,
        player_name: input.player_name,
        modality:    input.modality,
        entry_fee:   input.entry_fee,
      })
      .select(tabSelect)
      .single();

    if (error) throw error;
    return toTabWithRefills(data as TabRow);
  }

  public async findTabById(id: string): Promise<TabWithRefills | null> {
    const { data, error } = await this.supabase
      .from('tabs')
      .select(tabSelect)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data ? toTabWithRefills(data as TabRow) : null;
  }

  public async listTabsByGame(gameId: string): Promise<TabWithRefills[]> {
    const { data, error } = await this.supabase
      .from('tabs')
      .select(tabSelect)
      .eq('game_id', gameId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data as TabRow[]).map(toTabWithRefills);
  }

  public async getGameSummary(gameId: string): Promise<GameTabsSummary> {
    const { data: tabs, error } = await this.supabase
      .from('tabs')
      .select('id, modality, entry_fee, entry_status')
      .eq('game_id', gameId);

    if (error) throw error;

    const tabList = tabs as Array<{ id: string; modality: TabModality; entry_fee: string; entry_status: EntryStatus }>;
    const tabIds  = tabList.map((t) => t.id);

    let refillsRevenue = 0;
    if (tabIds.length > 0) {
      const { data: refills, error: refillsError } = await this.supabase
        .from('consumables_refills')
        .select('total_price')
        .in('tab_id', tabIds)
        .eq('payment_status', 'PAID');

      if (refillsError) throw refillsError;
      refillsRevenue = (refills as Array<{ total_price: string }>)
        .reduce((sum, r) => sum + Number(r.total_price), 0);
    }

    const equippedCount  = tabList.filter((t) => t.modality === 'EQUIPPED').length;
    const rentalCount    = tabList.filter((t) => t.modality === 'RENTAL').length;
    const entryRevenue   = tabList
      .filter((t) => t.entry_status === 'PAID')
      .reduce((sum, t) => sum + Number(t.entry_fee), 0);

    return {
      equipped_count:       equippedCount,
      rental_count:         rentalCount,
      total_entry_revenue:  entryRevenue,
      total_refills_revenue: refillsRevenue,
      total_revenue:        entryRevenue + refillsRevenue,
    };
  }

  public async addRefill(input: CreateRefillInput): Promise<Refill> {
    const { data, error } = await this.supabase
      .from('consumables_refills')
      .insert({
        tab_id:         input.tab_id,
        item_type:      input.item_type,
        description:    input.description,
        quantity:       input.quantity,
        total_price:    input.total_price,
        payment_status: input.payment_status,
      })
      .select('id, tab_id, item_type, description, quantity, total_price, payment_status, created_at')
      .single();

    if (error) throw error;
    return toRefill(data as RefillRow);
  }

  public async findRefillById(tabId: string, refillId: string): Promise<Refill | null> {
    const { data, error } = await this.supabase
      .from('consumables_refills')
      .select('id, tab_id, item_type, description, quantity, total_price, payment_status, created_at')
      .eq('id', refillId)
      .eq('tab_id', tabId)
      .maybeSingle();

    if (error) throw error;
    return data ? toRefill(data as RefillRow) : null;
  }

  public async markRefillPaid(refillId: string): Promise<Refill> {
    const { data, error } = await this.supabase
      .from('consumables_refills')
      .update({ payment_status: 'PAID' })
      .eq('id', refillId)
      .select('id, tab_id, item_type, description, quantity, total_price, payment_status, created_at')
      .single();

    if (error) throw error;
    return toRefill(data as RefillRow);
  }

  public async checkout(
    tabId: string,
    method: PaymentMethod,
    amount: number,
    openRefillIds: string[],
  ): Promise<GatewayPayment> {
    const { data: payment, error: paymentError } = await this.supabase
      .from('gateway_payments')
      .insert({ tab_id: tabId, method, amount, status: 'APPROVED' })
      .select('id, tab_id, gateway_transaction_id, method, amount, status, created_at')
      .single();

    if (paymentError) throw paymentError;

    if (openRefillIds.length > 0) {
      const { error: refillsError } = await this.supabase
        .from('consumables_refills')
        .update({ payment_status: 'PAID' })
        .in('id', openRefillIds);

      if (refillsError) throw refillsError;
    }

    const { error: tabError } = await this.supabase
      .from('tabs')
      .update({ entry_status: 'PAID' })
      .eq('id', tabId);

    if (tabError) throw tabError;

    return toPayment(payment as GatewayPaymentRow);
  }

  public async settleTab(tabId: string, openRefillIds: string[]): Promise<void> {
    if (openRefillIds.length > 0) {
      const { error: refillsError } = await this.supabase
        .from('consumables_refills')
        .update({ payment_status: 'PAID' })
        .in('id', openRefillIds);

      if (refillsError) throw refillsError;
    }

    const { error: tabError } = await this.supabase
      .from('tabs')
      .update({ entry_status: 'PAID' })
      .eq('id', tabId);

    if (tabError) throw tabError;
  }
}
