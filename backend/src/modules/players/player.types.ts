export const PLAYER_CLIENT_TYPES = ['OPEN_GAME', 'PRIVATE_GAME', 'BOTH'] as const;

export type PlayerClientType = (typeof PLAYER_CLIENT_TYPES)[number];

export interface Player {
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

export interface CreatePlayerInput {
  name: string;
  cpf: string;
  phone: string;
  email: string;
  date_of_birth: string;
  client_type: PlayerClientType;
  profile?: string | undefined;
  terms_accepted: boolean;
}

export type PlayerSearchCriterion =
  | { field: 'registration_number'; value: number }
  | { field: 'cpf'; value: string }
  | { field: 'phone'; value: string };

export interface PlayersRepository {
  create(input: CreatePlayerInput): Promise<Player>;
  findBy(criteria: PlayerSearchCriterion): Promise<Player | null>;
}
