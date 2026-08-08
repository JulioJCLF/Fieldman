export const INVENTORY_CHANNELS = ['SNACKBAR', 'STORE'] as const;

export type InventoryChannel = (typeof INVENTORY_CHANNELS)[number];

/** Segmento de URL usado nas rotas da API para cada canal. */
export const CHANNEL_SLUG: Record<InventoryChannel, string> = {
  SNACKBAR: 'snackbar',
  STORE:    'store',
};

export const CHANNEL_LABEL: Record<InventoryChannel, string> = {
  SNACKBAR: 'Lanchonete',
  STORE:    'Loja',
};

export interface Product {
  id: string;
  channel: InventoryChannel;
  name: string;
  category: string;
  cost_price: number;
  sale_price: number;
  stock_qty: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Sale {
  id: string;
  channel: InventoryChannel;
  product_id: string;
  tab_id: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  sold_at: string;
}

export interface RevenueSummary {
  units_sold: number;
  revenue: number;
  cost: number;
  profit: number;
  sales_count: number;
}

export interface TopProduct {
  product_id: string;
  name: string;
  category: string;
  units_sold: number;
  revenue: number;
}

export interface TopCategory {
  category: string;
  units_sold: number;
  revenue: number;
}

export interface CreateProductPayload {
  name: string;
  category: string;
  cost_price: number;
  sale_price: number;
  stock_qty: number;
}

export interface UpdateProductPayload {
  name?: string;
  category?: string;
  cost_price?: number;
  sale_price?: number;
  active?: boolean;
}

export interface RecordSalePayload {
  product_id: string;
  tab_id?: string;
  quantity: number;
}
