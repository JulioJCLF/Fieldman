import { api, ApiError } from '../../../lib/apiClient';
import {
  CHANNEL_SLUG,
  type CreateProductPayload,
  type InventoryChannel,
  type Product,
  type RecordSalePayload,
  type RevenueSummary,
  type Sale,
  type TopCategory,
  type TopProduct,
  type UpdateProductPayload,
} from '../types';

export { ApiError };

function base(channel: InventoryChannel): string {
  return `/api/inventory/${CHANNEL_SLUG[channel]}`;
}

function rangeQuery(range?: { from?: string; to?: string }): string {
  const params = new URLSearchParams();
  if (range?.from) params.set('from', range.from);
  if (range?.to) params.set('to', range.to);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export async function listProducts(channel: InventoryChannel): Promise<Product[]> {
  return api.get<Product[]>(`${base(channel)}/products`);
}

export async function createProduct(channel: InventoryChannel, payload: CreateProductPayload): Promise<Product> {
  return api.post<Product>(`${base(channel)}/products`, payload);
}

export async function updateProduct(channel: InventoryChannel, id: string, payload: UpdateProductPayload): Promise<Product> {
  return api.patch<Product>(`${base(channel)}/products/${id}`, payload);
}

export async function adjustStock(channel: InventoryChannel, id: string, delta: number): Promise<Product> {
  return api.patch<Product>(`${base(channel)}/products/${id}/stock`, { delta });
}

export async function recordSale(channel: InventoryChannel, payload: RecordSalePayload): Promise<Sale> {
  return api.post<Sale>(`${base(channel)}/sales`, payload);
}

export async function getRevenueSummary(channel: InventoryChannel, range?: { from?: string; to?: string }): Promise<RevenueSummary> {
  return api.get<RevenueSummary>(`${base(channel)}/reports/summary${rangeQuery(range)}`);
}

export async function getTopProducts(channel: InventoryChannel, range?: { from?: string; to?: string }): Promise<TopProduct[]> {
  return api.get<TopProduct[]>(`${base(channel)}/reports/top-products${rangeQuery(range)}`);
}

export async function getTopCategories(channel: InventoryChannel, range?: { from?: string; to?: string }): Promise<TopCategory[]> {
  return api.get<TopCategory[]>(`${base(channel)}/reports/top-categories${rangeQuery(range)}`);
}
