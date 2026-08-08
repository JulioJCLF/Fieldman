export const INVENTORY_CHANNELS = ['SNACKBAR', 'STORE'] as const;

export type InventoryChannel = (typeof INVENTORY_CHANNELS)[number];

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

export interface CreateProductInput {
  channel: InventoryChannel;
  name: string;
  category: string;
  cost_price: number;
  sale_price: number;
  stock_qty: number;
}

export interface UpdateProductInput {
  name?: string;
  category?: string;
  cost_price?: number;
  sale_price?: number;
  active?: boolean;
}

export interface RecordSaleInput {
  channel: InventoryChannel;
  product_id: string;
  tab_id?: string;
  quantity: number;
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

export interface DateRange {
  from: string;
  to: string;
}

export interface InventoryRepository {
  createProduct(input: CreateProductInput): Promise<Product>;
  listProducts(channel: InventoryChannel): Promise<Product[]>;
  findProductById(channel: InventoryChannel, id: string): Promise<Product | null>;
  updateProduct(channel: InventoryChannel, id: string, input: UpdateProductInput): Promise<Product>;
  adjustStock(channel: InventoryChannel, id: string, delta: number): Promise<Product>;
  recordSale(input: RecordSaleInput, unitPrice: number, newStock: number): Promise<Sale>;
  listSales(channel: InventoryChannel, range: DateRange): Promise<Sale[]>;
  getRevenueSummary(channel: InventoryChannel, range: DateRange): Promise<RevenueSummary>;
  getTopProducts(channel: InventoryChannel, range: DateRange, limit: number): Promise<TopProduct[]>;
  getTopCategories(channel: InventoryChannel, range: DateRange): Promise<TopCategory[]>;
}
