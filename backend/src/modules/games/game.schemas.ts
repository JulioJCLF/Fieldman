import { z } from 'zod';

import { GAME_TYPES, type CreateGameInput } from './game.types.js';

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const year  = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const day   = Number(value.slice(8, 10));
  const date  = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth()    === month - 1 &&
    date.getUTCDate()     === day
  );
}

const createGameSchema = z.object({
  type: z.enum(GAME_TYPES, {
    errorMap: () => ({ message: 'Tipo de jogo inválido. Use OPEN ou PRIVATE.' }),
  }),
  game_date: z.string().optional()
    .transform((value) => value ?? todayIso())
    .refine(isValidDate, 'Informe uma data válida no formato YYYY-MM-DD.'),
  notes: z.string().trim().max(500, 'As notas devem ter no máximo 500 caracteres.').optional()
    .transform((value) => value || undefined),
}).strict();

const uuidSchema = z.string().uuid('ID de jogo inválido.');

export function parseCreateGame(input: unknown): CreateGameInput {
  return createGameSchema.parse(input);
}

export function parseGameId(input: unknown): string {
  return uuidSchema.parse(input);
}
