import type { SupabaseClient } from '@supabase/supabase-js';

import type { CreatePlayerInput, Player, PlayerClientType, PlayerSearchCriterion, PlayersRepository } from './player.types.js';

interface PlayerRow {
  id: string;
  registration_number: number;
  name: string;
  cpf: string;
  phone: string;
  email: string;
  date_of_birth: string;
  client_type: PlayerClientType;
  profile: string | null;
  terms_accepted: boolean;
  created_at: string;
}

const playerColumns = 'id, registration_number, name, cpf, phone, email, date_of_birth, client_type, profile, terms_accepted, created_at';

function toPlayer(row: PlayerRow): Player {
  return {
    id: row.id,
    registration_number: row.registration_number,
    name: row.name,
    cpf: row.cpf,
    phone: row.phone,
    email: row.email,
    date_of_birth: row.date_of_birth,
    client_type: row.client_type,
    profile: row.profile,
    terms_accepted: row.terms_accepted,
    created_at: row.created_at,
  };
}

export class SupabasePlayersRepository implements PlayersRepository {
  public constructor(private readonly supabase: SupabaseClient) {}

  public async create(input: CreatePlayerInput): Promise<Player> {
    const { data, error } = await this.supabase
      .from('players')
      .insert({
        name: input.name,
        cpf: input.cpf,
        phone: input.phone,
        email: input.email,
        date_of_birth: input.date_of_birth,
        client_type: input.client_type,
        profile: input.profile ?? null,
        terms_accepted: input.terms_accepted,
      })
      .select(playerColumns)
      .single();

    if (error) {
      throw error;
    }

    return toPlayer(data as PlayerRow);
  }

  public async findBy(criteria: PlayerSearchCriterion): Promise<Player | null> {
    const query = this.supabase.from('players').select(playerColumns);
    const result = criteria.field === 'registration_number'
      ? await query.eq('registration_number', criteria.value).maybeSingle()
      : await query.eq(criteria.field, criteria.value).maybeSingle();

    if (result.error) {
      throw result.error;
    }

    return result.data ? toPlayer(result.data as PlayerRow) : null;
  }
}

export function isDuplicateCpfError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const candidate = error as { code?: unknown; message?: unknown; details?: unknown };
  if (candidate.code !== '23505') {
    return false;
  }

  const description = [candidate.message, candidate.details].filter((value): value is string => typeof value === 'string').join(' ');
  return description.toLowerCase().includes('cpf');
}
