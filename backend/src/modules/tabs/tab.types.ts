export const TAB_MODALITIES     = ['EQUIPPED', 'RENTAL']                              as const;
export const ENTRY_STATUSES     = ['PENDING', 'PAID']                                 as const;
export const ITEM_TYPES         = ['REFILL', 'SNACKBAR', 'STORE']                     as const;
export const PAYMENT_STATUSES   = ['PAID', 'OPEN']                                    as const;
export const PAYMENT_METHODS    = ['PIX', 'CARD', 'CASH']                             as const;
export const PAYMENT_GW_STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'REFUNDED']   as const;

export type TabModality     = (typeof TAB_MODALITIES)[number];
export type EntryStatus     = (typeof ENTRY_STATUSES)[number];
export type ItemType        = (typeof ITEM_TYPES)[number];
export type PaymentStatus   = (typeof PAYMENT_STATUSES)[number];
export type PaymentMethod   = (typeof PAYMENT_METHODS)[number];
export type PaymentGwStatus = (typeof PAYMENT_GW_STATUSES)[number];

export interface Tab {
  id: string;
  game_id: string;
  player_id: string | null;
  guest_name: string | null;
  player_name: string;
  modality: TabModality;
  entry_fee: number;
  entry_status: EntryStatus;
  created_at: string;
  updated_at: string;
}

export interface Refill {
  id: string;
  tab_id: string;
  item_type: ItemType;
  description: string;
  quantity: number;
  total_price: number;
  payment_status: PaymentStatus;
  created_at: string;
}

export interface GatewayPayment {
  id: string;
  tab_id: string;
  gateway_transaction_id: string | null;
  method: PaymentMethod;
  amount: number;
  status: PaymentGwStatus;
  created_at: string;
}

export interface TabWithRefills extends Tab {
  refills: Refill[];
  payments: GatewayPayment[];
}

export interface GameTabsSummary {
  equipped_count: number;
  rental_count: number;
  total_entry_revenue: number;
  total_refills_revenue: number;
  total_revenue: number;
}

export interface CreateTabInput {
  game_id: string;
  player_id?: string;
  guest_name?: string;
  player_name: string;
  modality: TabModality;
  entry_fee: number;
}

export interface CreateRefillInput {
  tab_id: string;
  item_type: ItemType;
  description: string;
  quantity: number;
  total_price: number;
  payment_status: PaymentStatus;
}

export interface TabsRepository {
  createTab(input: CreateTabInput): Promise<TabWithRefills>;
  findTabById(id: string): Promise<TabWithRefills | null>;
  listTabsByGame(gameId: string): Promise<TabWithRefills[]>;
  getGameSummary(gameId: string): Promise<GameTabsSummary>;
  addRefill(input: CreateRefillInput): Promise<Refill>;
  findRefillById(tabId: string, refillId: string): Promise<Refill | null>;
  markRefillPaid(refillId: string): Promise<Refill>;
  checkout(tabId: string, method: PaymentMethod, amount: number, openRefillIds: string[]): Promise<GatewayPayment>;
  /** Marca comanda + recargas em aberto como pagas SEM inserir novo pagamento (usado na conciliação PIX). */
  settleTab(tabId: string, openRefillIds: string[]): Promise<void>;
}
