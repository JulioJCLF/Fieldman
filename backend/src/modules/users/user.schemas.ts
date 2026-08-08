import { z } from 'zod';

import type { CreateUserInput, UpdateUserInput } from './user.types.js';

const emailSchema = z.string().trim().email('Informe um e-mail válido.').max(254)
  .transform((value) => value.toLowerCase());

const passwordSchema = z.string().min(8, 'A senha deve ter ao menos 8 caracteres.').max(72);

const createUserSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
}).strict();

const updateUserSchema = z.object({
  email: emailSchema.optional(),
  password: passwordSchema.optional(),
}).strict().refine(
  (value) => value.email !== undefined || value.password !== undefined,
  { message: 'Informe um novo e-mail ou uma nova senha.' },
);

const userIdSchema = z.string().uuid('Identificador de usuário inválido.');

export function parseUserId(value: unknown): string {
  return userIdSchema.parse(value);
}

export function parseCreateUser(payload: unknown): CreateUserInput {
  return createUserSchema.parse(payload);
}

export function parseUpdateUser(payload: unknown): UpdateUserInput {
  return updateUserSchema.parse(payload);
}
