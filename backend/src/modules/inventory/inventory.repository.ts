import type { SupabaseClient } from '@supabase/supabase-js';

import type {
  CreateProductInput,
  DateRange,
  InventoryChannel,
  InventoryRepository,
  Product,
  RecordSaleInput,
  RevenueSummary,
  Sale,
  TopCategory,
  TopProduct,
  UpdateProductInput,
} from './inventory.types.js';

interface ProductRow {
  id: string;
  channel: InventoryChannel;
  name: string;
  category: string;
  cost_price: string;
  sale_price: string;
  stock_qty: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

interface SaleRow {
  id: string;
  channel: InventoryChannel;
  product_id: string;
  tab_id: string | null;
  quantity: number;
  unit_price: string;
  total_price: string;
  sold_at: string;
}

const productColumns = 'id, channel, name, category, cost_price, sale_price, stock_qty, active, created_at, updated_at';
const saleColumns    = 'id, channel, product_id, tab_id, quantity, unit_price, total_price, sold_at';

function toProduct(row: ProductRow): Product {
  return {
    ...row,
    cost_price: Number(row.cost_price),
    sale_price: Number(row.sale_price),
  };
}

function toSale(row: SaleRow): Sale {
  return {
    ...row,
    unit_price:  Number(row.unit_price),
    total_price: Number(row.total_price),
  };
}

/**
 * O Supabase infere relações embutidas como array mesmo quando são 1:1 (FK).
 * Em runtime, uma FK simples vem como objeto único. Este helper normaliza ambos.
 */
function relationOne<T>(relation: T | T[] | null | undefined): T | null {
  if (Array.isArray(relation)) return relation[0] ?? null;
  return relation ?? null;
}

export class SupabaseInventoryRepository implements InventoryRepository {
  public constructor(private readonly supabase: SupabaseClient) {}

  public async createProduct(input: CreateProductInput): Promise<Product> {
    const { data, error } = await this.supabase
      .from('inventory_products')
      .insert({
        channel:    input.channel,
        name:       input.name,
        category:   input.category,
        cost_price: input.cost_price,
        sale_price: input.sale_price,
        stock_qty:  input.stock_qty,
      })
      .select(productColumns)
      .single();

    if (error) throw error;
    return toProduct(data as ProductRow);
  }

  public async listProducts(channel: InventoryChannel): Promise<Product[]> {
    const { data, error } = await this.supabase
      .from('inventory_products')
      .select(productColumns)
      .eq('channel', channel)
      .order('name', { ascending: true });

    if (error) throw error;
    return (data as ProductRow[]).map(toProduct);
  }

  public async findProductById(channel: InventoryChannel, id: string): Promise<Product | null> {
    const { data, error } = await this.supabase
      .from('inventory_products')
      .select(productColumns)
      .eq('channel', channel)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data ? toProduct(data as ProductRow) : null;
  }

  public async updateProduct(channel: InventoryChannel, id: string, input: UpdateProductInput): Promise<Product> {
    const { data, error } = await this.supabase
      .from('inventory_products')
      .update(input)
      .eq('channel', channel)
      .eq('id', id)
      .select(productColumns)
      .single();

    if (error) throw error;
    return toProduct(data as ProductRow);
  }

  public async adjustStock(channel: InventoryChannel, id: string, delta: number): Promise<Product> {
    // Leitura + escrita: o service já validou o novo total; aqui aplicamos.
    const { data, error } = await this.supabase
      .from('inventory_products')
      .update({ stock_qty: delta })
      .eq('channel', channel)
      .eq('id', id)
      .select(productColumns)
      .single();

    if (error) throw error;
    return toProduct(data as ProductRow);
  }

  public async recordSale(input: RecordSaleInput, unitPrice: number, newStock: number): Promise<Sale> {
    const { data, error } = await this.supabase
      .from('inventory_sales')
      .insert({
        channel:     input.channel,
        product_id:  input.product_id,
        tab_id:      input.tab_id ?? null,
        quantity:    input.quantity,
        unit_price:  unitPrice,
        total_price: unitPrice * input.quantity,
      })
      .select(saleColumns)
      .single();

    if (error) throw error;

    const { error: stockError } = await this.supabase
      .from('inventory_products')
      .update({ stock_qty: newStock })
      .eq('id', input.product_id);

    if (stockError) throw stockError;

    return toSale(data as SaleRow);
  }

  public async listSales(channel: InventoryChannel, range: DateRange): Promise<Sale[]> {
    const { data, error } = await this.supabase
      .from('inventory_sales')
      .select(saleColumns)
      .eq('channel', channel)
      .gte('sold_at', range.from)
      .lte('sold_at', range.to)
      .order('sold_at', { ascending: false });

    if (error) throw error;
    return (data as SaleRow[]).map(toSale);
  }

  public async getRevenueSummary(channel: InventoryChannel, range: DateRange): Promise<RevenueSummary> {
    const { data, error } = await this.supabase
      .from('inventory_sales')
      .select('quantity, total_price, product_id, inventory_products ( cost_price )')
      .eq('channel', channel)
      .gte('sold_at', range.from)
      .lte('sold_at', range.to);

    if (error) throw error;

    const rows = data as unknown as Array<{ quantity: number; total_price: string; inventory_products: { cost_price: string } | { cost_price: string }[] | null }>;

    let unitsSold = 0;
    let revenue   = 0;
    let cost      = 0;

    for (const row of rows) {
      const qty      = row.quantity;
      const product  = relationOne(row.inventory_products);
      const rowCost  = Number(product?.cost_price ?? 0) * qty;
      unitsSold += qty;
      revenue   += Number(row.total_price);
      cost      += rowCost;
    }

    return {
      units_sold:  unitsSold,
      revenue,
      cost,
      profit:      revenue - cost,
      sales_count: rows.length,
    };
  }

  public async getTopProducts(channel: InventoryChannel, range: DateRange, limit: number): Promise<TopProduct[]> {
    const { data, error } = await this.supabase
      .from('inventory_sales')
      .select('product_id, quantity, total_price, inventory_products ( name, category )')
      .eq('channel', channel)
      .gte('sold_at', range.from)
      .lte('sold_at', range.to);

    if (error) throw error;

    const rows = data as unknown as Array<{
      product_id: string;
      quantity: number;
      total_price: string;
      inventory_products: { name: string; category: string } | { name: string; category: string }[] | null;
    }>;

    const map = new Map<string, TopProduct>();
    for (const row of rows) {
      const product = relationOne(row.inventory_products);
      const current = map.get(row.product_id) ?? {
        product_id: row.product_id,
        name:       product?.name ?? 'Produto removido',
        category:   product?.category ?? 'Geral',
        units_sold: 0,
        revenue:    0,
      };
      current.units_sold += row.quantity;
      current.revenue    += Number(row.total_price);
      map.set(row.product_id, current);
    }

    return [...map.values()]
      .sort((a, b) => b.units_sold - a.units_sold)
      .slice(0, limit);
  }

  public async getTopCategories(channel: InventoryChannel, range: DateRange): Promise<TopCategory[]> {
    const { data, error } = await this.supabase
      .from('inventory_sales')
      .select('quantity, total_price, inventory_products ( category )')
      .eq('channel', channel)
      .gte('sold_at', range.from)
      .lte('sold_at', range.to);

    if (error) throw error;

    const rows = data as unknown as Array<{ quantity: number; total_price: string; inventory_products: { category: string } | { category: string }[] | null }>;

    const map = new Map<string, TopCategory>();
    for (const row of rows) {
      const category = relationOne(row.inventory_products)?.category ?? 'Geral';
      const current  = map.get(category) ?? { category, units_sold: 0, revenue: 0 };
      current.units_sold += row.quantity;
      current.revenue    += Number(row.total_price);
      map.set(category, current);
    }

    return [...map.values()].sort((a, b) => b.revenue - a.revenue);
  }
}
