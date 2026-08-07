import { z } from 'zod';

import { PLAYER_CLIENT_TYPES, type CreatePlayerInput, type PlayerSearchCriterion } from './player.types.js';

const CPF_LENGTH = 11;

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

export function normalizeCpf(value: string): string {
  return digitsOnly(value);
}

export function isValidCpf(value: string): boolean {
  const cpf = normalizeCpf(value);

  if (cpf.length !== CPF_LENGTH || /^(\d)\1{10}$/.test(cpf)) {
    return false;
  }

  const checkDigit = (base: string, factor: number): number => {
    const sum = base.split('').reduce((total, digit, index) => total + Number(digit) * (factor - index), 0);
    const remainder = (sum * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };

  const first = checkDigit(cpf.slice(0, 9), 10);
  const second = checkDigit(`${cpf.slice(0, 9)}${first}`, 11);
  return cpf === `${cpf.slice(0, 9)}${first}${second}`;
}

export function normalizeBrazilianPhone(value: string): string {
  const digits = digitsOnly(value);
  const nationalNumber = digits.startsWith('55') && (digits.length === 12 || digits.length === 13)
    ? digits.slice(2)
    : digits;

  return nationalNumber ? `55${nationalNumber}` : '';
}

export function isValidBrazilianPhone(value: string): boolean {
  return /^55[1-9]\d{9,10}$/.test(normalizeBrazilianPhone(value));
}

function isValidPastDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));
  const parsed = new Date(Date.UTC(year, month - 1, day));
  const currentDate = new Date().toISOString().slice(0, 10);

  return (
    year >= 1900
    && parsed.getUTCFullYear() === year
    && parsed.getUTCMonth() === month - 1
    && parsed.getUTCDate() === day
    && value <= currentDate
  );
}

const cpfSchema = z.string().trim().transform(normalizeCpf).pipe(
  z.string().regex(/^\d{11}$/, 'CPF deve conter 11 d\u00edgitos.').refine(isValidCpf, 'Informe um CPF v\u00e1lido.'),
);

const phoneSchema = z.string().trim().transform(normalizeBrazilianPhone).pipe(
  z.string().refine(isValidBrazilianPhone, 'Informe um telefone brasileiro v\u00e1lido com DDD.'),
);

export const createPlayerSchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome do jogador.').max(120, 'O nome deve ter no m\u00e1ximo 120 caracteres.')
    .transform((value) => value.replace(/\s+/g, ' ')),
  cpf: cpfSchema,
  phone: phoneSchema,
  email: z.string().trim().email('Informe um e-mail v\u00e1lido.').max(254).transform((value) => value.toLowerCase()),
  date_of_birth: z.string().refine(isValidPastDate, 'Informe uma data de nascimento v\u00e1lida e n\u00e3o futura.'),
  client_type: z.enum(PLAYER_CLIENT_TYPES).default('BOTH'),
  profile: z.string().trim().max(500, 'O perfil deve ter no m\u00e1ximo 500 caracteres.').optional()
    .transform((value) => value || undefined),
  terms_accepted: z.boolean().refine((value) => value, 'O aceite do termo digital \u00e9 obrigat\u00f3rio.'),
}).strict();

const queryValueSchema = z.preprocess(
  (value) => (typeof value === 'string' ? value.trim() : undefined),
  z.string().min(1).optional(),
);

const searchQuerySchema = z.object({
  registration_number: queryValueSchema,
  cpf: queryValueSchema,
  phone: queryValueSchema,
}).strict().superRefine((value, context) => {
  const supplied = [value.registration_number, value.cpf, value.phone].filter(Boolean);
  if (supplied.length !== 1) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Informe exatamente um crit\u00e9rio de busca: registration_number, cpf ou phone.',
    });
  }
});

const registrationNumberSchema = z.string().regex(/^[1-9]\d*$/, 'registration_number deve ser um inteiro positivo.')
  .transform(Number);

export function parsePlayerSearchQuery(input: unknown): PlayerSearchCriterion {
  const query = searchQuerySchema.parse(input);

  if (query.registration_number) {
    return { field: 'registration_number', value: registrationNumberSchema.parse(query.registration_number) };
  }

  if (query.cpf) {
    return { field: 'cpf', value: cpfSchema.parse(query.cpf) };
  }

  return { field: 'phone', value: phoneSchema.parse(query.phone) };
}

export function parseCreatePlayer(input: unknown): CreatePlayerInput {
  return createPlayerSchema.parse(input);
}
