import { z } from 'zod';

import type { ClientType } from './types';

const CPF_LENGTH = 11;
const MIN_PHONE_LENGTH = 10;
const MAX_PHONE_LENGTH = 11;

export const onlyDigits = (value: string): string => value.replace(/\D/g, '');

export function normalizePhone(value: string): string {
  const digits = onlyDigits(value);

  // Keep a national representation while the user is typing or while a
  // country-prefixed API value is being formatted for display.
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
    return digits.slice(2);
  }

  return digits;
}

export function toBrazilianPhoneDigits(value: string): string {
  const nationalPhone = normalizePhone(value);
  return nationalPhone ? `55${nationalPhone}` : '';
}

export function formatCpf(value: string): string {
  const digits = onlyDigits(value).slice(0, CPF_LENGTH);
  return digits
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2');
}

export function formatPhone(value: string): string {
  const digits = normalizePhone(value).slice(0, MAX_PHONE_LENGTH);

  if (digits.length <= 2) {
    return digits;
  }

  const areaCode = digits.slice(0, 2);
  const localNumber = digits.slice(2);

  if (localNumber.length <= 4) {
    return `(${areaCode}) ${localNumber}`;
  }

  const splitAt = localNumber.length > 8 ? 5 : 4;
  return `(${areaCode}) ${localNumber.slice(0, splitAt)}-${localNumber.slice(splitAt)}`;
}

export function isValidCpf(value: string): boolean {
  const cpf = onlyDigits(value);

  if (cpf.length !== CPF_LENGTH || /^(\d)\1{10}$/.test(cpf)) {
    return false;
  }

  const calculateCheckDigit = (base: string, factor: number): number => {
    const total = base.split('').reduce((sum, digit, index) => {
      return sum + Number(digit) * (factor - index);
    }, 0);
    const digit = (total * 10) % 11;
    return digit === 10 ? 0 : digit;
  };

  const firstCheckDigit = calculateCheckDigit(cpf.slice(0, 9), 10);
  const secondCheckDigit = calculateCheckDigit(cpf.slice(0, 9) + firstCheckDigit, 11);

  return cpf === `${cpf.slice(0, 9)}${firstCheckDigit}${secondCheckDigit}`;
}

export function isValidPhone(value: string): boolean {
  const phone = normalizePhone(value);
  return /^\d+$/.test(phone) && phone.length >= MIN_PHONE_LENGTH && phone.length <= MAX_PHONE_LENGTH;
}

export function isValidBirthDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const today = new Date();

  return (
    year >= 1900 &&
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day &&
    date <= today
  );
}

export const playerRegistrationSchema = z.object({
  name: z.string().trim().min(3, 'Informe o nome completo.').max(120, 'O nome deve ter no máximo 120 caracteres.'),
  cpf: z
    .string()
    .transform(onlyDigits)
    .refine(isValidCpf, 'Informe um CPF válido.'),
  phone: z
    .string()
    .transform(toBrazilianPhoneDigits)
    .refine(isValidPhone, 'Informe um telefone brasileiro válido com DDD.'),
  email: z
    .string()
    .trim()
    .email('Informe um e-mail válido.')
    .transform((value) => value.toLowerCase()),
  date_of_birth: z.string().refine(isValidBirthDate, 'Informe uma data de nascimento válida.'),
  client_type: z.enum(['OPEN_GAME', 'PRIVATE_GAME', 'BOTH'] satisfies [ClientType, ...ClientType[]]),
  profile: z
    .string()
    .trim()
    .max(500, 'O perfil deve ter no máximo 500 caracteres.')
    .optional()
    .transform((value) => value || undefined),
  terms_accepted: z.boolean().refine((accepted) => accepted, 'É necessário registrar o aceite do termo.'),
});

export type PlayerRegistrationInput = z.input<typeof playerRegistrationSchema>;
export type PlayerRegistrationValues = z.output<typeof playerRegistrationSchema>;

export const initialPlayerRegistrationInput: PlayerRegistrationInput = {
  name: '',
  cpf: '',
  phone: '',
  email: '',
  date_of_birth: '',
  client_type: 'BOTH',
  profile: '',
  terms_accepted: false,
};
