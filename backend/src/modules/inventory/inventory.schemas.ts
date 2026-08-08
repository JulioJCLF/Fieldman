import { z } from 'zod';

import {
  type CreateProductInput,
  type DateRange,
  type InventoryChannel,
  type RecordSaleInput,
  type UpdateProductInput,
} from './inventory.types.js';

const uuidSchema = z.string().uuid('ID inválido.');

/** Mapeia o segmento de URL (snackbar/store) para o enum do canal. */
const CHANNEL_BY_SLUG: Record<string, InventoryChannel> = {
  snackbar: 'SNACKBAR',
  store:    'STORE',
};

const createProductSchema = z.object({
  name:       z.string().trim().min(2, 'Informe o nome do produto.').max(120),
  category:   z.string().trim().min(1).max(80).optional().transform((v) => v || 'Geral'),
  cost_price: z.number({ invalid_type_error: 'Custo deve ser um número.' }).nonnegative('O custo não pode ser negativo.'),
  sale_price: z.number({ invalid_type_error: 'Preço de venda deve ser um número.' }).nonnegative('O preço não pode ser negativo.'),
  stock_qty:  z.number({ invalid_type_error: 'Estoque deve ser um número.' }).int().min(0, 'O estoque não pode ser negativo.').optional().transform((v) => v ?? 0),
}).strict();

const updateProductSchema = z.object({
  name:       z.string().trim().min(2).max(120).optional(),
  category:   z.string().trim().min(1).max(80).optional(),
  cost_price: z.number().nonnegative().optional(),
  sale_price: z.number().nonnegative().optional(),
  active:     z.boolean().optional(),
}).strict().refine((data) => Object.keys(data).length > 0, {
  message: 'Informe ao menos um campo para atualizar.',
});

const adjustStockSchema = z.object({
  delta: z.number({ invalid_type_error: 'A variação de estoque deve ser um número.' }).int('A variação deve ser um inteiro.'),
}).strict();

const recordSaleSchema = z.object({
  product_id: uuidSchema,
  tab_id:     z.string().uuid('ID de comanda inválido.').optional(),
  quantity:   z.number({ invalid_type_error: 'Quantidade deve ser um número.' }).int().min(1, 'Quantidade mínima é 1.'),
}).strict();

function isValidDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
}

const rangeSchema = z.object({
  from: z.string().optional(),
  to:   z.string().optional(),
});

export function parseChannel(input: unknown): InventoryChannel {
  const slug = typeof input === 'string' ? input.toLowerCase() : '';
  const channel = CHANNEL_BY_SLUG[slug];
  if (!channel) {
    throw new z.ZodError([{
      code: z.ZodIssueCode.custom,
      path: ['channel'],
      message: 'Canal inválido. Use "snackbar" ou "store".',
    }]);
  }
  return channel;
}

export function parseCreateProduct(body: unknown, channel: InventoryChannel): CreateProductInput {
  return { ...createProductSchema.parse(body), channel };
}

export function parseUpdateProduct(body: unknown): UpdateProductInput {
  return updateProductSchema.parse(body);
}

export function parseStockDelta(body: unknown): number {
  return adjustStockSchema.parse(body).delta;
}

export function parseRecordSale(body: unknown, channel: InventoryChannel): RecordSaleInput {
  return { ...recordSaleSchema.parse(body), channel };
}

export function parseProductId(input: unknown): string {
  return uuidSchema.parse(input);
}

/** Faixa de datas com default: início do mês corrente até agora. */
export function parseDateRange(query: unknown): DateRange {
  const parsed = rangeSchema.parse(query);
  const now    = new Date();

  const from = parsed.from && isValidDate(parsed.from)
    ? `${parsed.from}T00:00:00.000Z`
    : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();

  const to = parsed.to && isValidDate(parsed.to)
    ? `${parsed.to}T23:59:59.999Z`
    : now.toISOString();

  return { from, to };
}

export function parseLimit(input: unknown, fallback = 10): number {
  const n = typeof input === 'string' ? Number(input) : NaN;
  return Number.isInteger(n) && n > 0 && n <= 100 ? n : fallback;
}
