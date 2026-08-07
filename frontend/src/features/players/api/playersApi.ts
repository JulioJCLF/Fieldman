import type { Player, PlayerRegistrationPayload, PlayerSearchRequest } from '../types';

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export class ApiError extends Error {
  public readonly status: number;

  public constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

function isAbortError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    (error as { name?: unknown }).name === 'AbortError'
  );
}

function getApiBaseUrl(): string {
  return (import.meta.env.VITE_API_BASE_URL ?? '').trim().replace(/\/$/, '');
}

function apiUrl(path: string): string {
  return `${getApiBaseUrl()}${path}`;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { headers, ...requestInit } = init;
  let response: Response;
  const requestHeaders = new Headers(headers);
  requestHeaders.set('Accept', 'application/json');

  try {
    response = await fetch(apiUrl(path), {
      ...requestInit,
      headers: requestHeaders,
    });
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

export async function createPlayer(payload: PlayerRegistrationPayload): Promise<Player> {
  return request<Player>('/api/players', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function searchPlayerExact(
  search: PlayerSearchRequest,
  signal: AbortSignal,
): Promise<Player | null> {
  const searchParams = new URLSearchParams({ [search.field]: search.value });

  try {
    const result = await request<Player | Player[] | null>(`/api/players/search?${searchParams.toString()}`, {
      signal,
    });

    return Array.isArray(result) ? result[0] ?? null : result;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }

    throw error;
  }
}
