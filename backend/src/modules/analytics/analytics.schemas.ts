import { z } from 'zod';

import type { DateRange } from './analytics.types.js';

function isValidDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
}

const rangeSchema = z.object({
  from: z.string().optional(),
  to:   z.string().optional(),
});

/** Faixa com default: início do mês corrente → agora. */
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

export function parseYear(input: unknown, fallback = new Date().getUTCFullYear()): number {
  const n = typeof input === 'string' ? Number(input) : NaN;
  return Number.isInteger(n) && n >= 2000 && n <= 2100 ? n : fallback;
}

/** Lista de anos para o comparativo multi-anos (ex: ?years=2024,2025,2026). */
export function parseYears(input: unknown): number[] {
  const now = new Date().getUTCFullYear();
  if (typeof input !== 'string' || input.trim() === '') {
    return [now - 2, now - 1, now];
  }
  const years = input
    .split(',')
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isInteger(n) && n >= 2000 && n <= 2100);
  return years.length > 0 ? [...new Set(years)].sort((a, b) => a - b) : [now - 2, now - 1, now];
}

export function parseMonth(input: unknown, fallback = new Date().getUTCMonth() + 1): number {
  const n = typeof input === 'string' ? Number(input) : NaN;
  return Number.isInteger(n) && n >= 1 && n <= 12 ? n : fallback;
}
