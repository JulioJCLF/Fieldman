/**
 * Cliente HTTP compartilhado por todas as features. Centraliza:
 * - a base URL (VITE_API_BASE_URL)
 * - o envio do token de autenticação (Authorization: Bearer)
 * - o desempacotamento do envelope padrão { success, data, error }
 * - o tratamento de erros (ApiError) e de cancelamento (AbortError)
 */

import { getAccessToken } from './supabase';

export class ApiError extends Error {
  public readonly status: number;

  public constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: string;
}

function getApiBaseUrl(): string {
  return (import.meta.env.VITE_API_BASE_URL ?? '').trim().replace(/\/$/, '');
}

export function isAbortError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    (error as { name?: unknown }).name === 'AbortError'
  );
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { headers, ...rest } = init;
  const requestHeaders = new Headers(headers);
  requestHeaders.set('Accept', 'application/json');

  const token = await getAccessToken();
  if (token) {
    requestHeaders.set('Authorization', `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, { ...rest, headers: requestHeaders });
  } catch (error) {
    if (isAbortError(error)) {
      throw error;
    }
    throw new ApiError('Não foi possível conectar ao servidor. Tente novamente.', 0);
  }

  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;

  if (!response.ok || !payload?.success) {
    throw new ApiError(payload?.error ?? 'Não foi possível concluir a solicitação.', response.status);
  }

  if (payload.data === undefined) {
    throw new ApiError('O servidor retornou uma resposta sem dados.', response.status);
  }

  return payload.data;
}

const JSON_HEADERS = { 'Content-Type': 'application/json' };

/** Atalhos por verbo. `body` é serializado como JSON automaticamente. */
export const api = {
  get:  <T>(path: string, signal?: AbortSignal): Promise<T> =>
    apiRequest<T>(path, { method: 'GET', signal }),

  post: <T>(path: string, body?: unknown): Promise<T> =>
    apiRequest<T>(path, { method: 'POST', headers: JSON_HEADERS, body: body === undefined ? undefined : JSON.stringify(body) }),

  patch: <T>(path: string, body?: unknown): Promise<T> =>
    apiRequest<T>(path, { method: 'PATCH', headers: JSON_HEADERS, body: body === undefined ? undefined : JSON.stringify(body) }),

  del: <T>(path: string): Promise<T> =>
    apiRequest<T>(path, { method: 'DELETE' }),
};
