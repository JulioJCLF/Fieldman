import { z } from 'zod';

import {
  ITEM_TYPES,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  TAB_MODALITIES,
  type CreateRefillInput,
  type CreateTabInput,
  type PaymentMethod,
} from './tab.types.js';

const uuidSchema = z.string().uuid('ID inválido.');

const createTabSchema = z.object({
  player_id:   z.string().uuid('ID de jogador inválido.').optional(),
  guest_name:  z.string().trim().min(2, 'Nome do avulso deve ter no mínimo 2 caracteres.').max(120).optional(),
  player_name: z.string().trim().min(2, 'Informe o nome do jogador.').max(120),
  modality:    z.enum(TAB_MODALITIES, {
    errorMap: () => ({ message: 'Modalidade inválida. Use EQUIPPED ou RENTAL.' }),
  }),
  entry_fee: z.number({ invalid_type_error: 'Taxa de entrada deve ser um número.' })
    .nonnegative('A taxa de entrada não pode ser negativa.'),
}).strict().refine(
  (data) => data.player_id !== undefined || data.guest_name !== undefined,
  { message: 'Informe o jogador cadastrado (player_id) ou o nome do avulso (guest_name).' },
);

const createRefillSchema = z.object({
  item_type:      z.enum(ITEM_TYPES, { errorMap: () => ({ message: 'Tipo de item inválido.' }) }),
  description:    z.string().trim().min(2, 'Informe a descrição do item.').max(200),
  quantity:       z.number({ invalid_type_error: 'Quantidade deve ser um número.' }).int().min(1, 'Quantidade mínima é 1.'),
  total_price:    z.number({ invalid_type_error: 'Preço deve ser um número.' }).nonnegative('O preço não pode ser negativo.'),
  payment_status: z.enum(PAYMENT_STATUSES, { errorMap: () => ({ message: 'Status de pagamento inválido.' }) }),
}).strict();

const checkoutSchema = z.object({
  method: z.enum(PAYMENT_METHODS, { errorMap: () => ({ message: 'Método de pagamento inválido. Use PIX, CARD ou CASH.' }) }),
}).strict();

export function parseCreateTab(body: unknown, gameId: string): CreateTabInput {
  const parsed = createTabSchema.parse(body);
  return { ...parsed, game_id: gameId };
}

export function parseCreateRefill(body: unknown, tabId: string): CreateRefillInput {
  const parsed = createRefillSchema.parse(body);
  return { ...parsed, tab_id: tabId };
}

export function parseCheckoutMethod(body: unknown): PaymentMethod {
  return checkoutSchema.parse(body).method;
}

export function parseTabId(input: unknown): string {
  return uuidSchema.parse(input);
}

export function parseRefillId(input: unknown): string {
  return uuidSchema.parse(input);
}

export function parseGameId(input: unknown): string {
  return uuidSchema.parse(input);
}
