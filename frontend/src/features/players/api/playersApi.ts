import { api, ApiError } from '../../../lib/apiClient';
import type { Player, PlayerRegistrationPayload, PlayerSearchRequest } from '../types';

export { ApiError };

export async function createPlayer(payload: PlayerRegistrationPayload): Promise<Player> {
  return api.post<Player>('/api/players', payload);
}

export async function searchPlayerExact(
  search: PlayerSearchRequest,
  signal: AbortSignal,
): Promise<Player | null> {
  const searchParams = new URLSearchParams({ [search.field]: search.value });

  try {
    const result = await api.get<Player | Player[] | null>(
      `/api/players/search?${searchParams.toString()}`,
      signal,
    );
    return Array.isArray(result) ? result[0] ?? null : result;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}
