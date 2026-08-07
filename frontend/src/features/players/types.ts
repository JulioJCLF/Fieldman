export const CLIENT_TYPES = ['OPEN_GAME', 'PRIVATE_GAME', 'BOTH'] as const;

export type ClientType = (typeof CLIENT_TYPES)[number];

export interface Player {
  id: string;
  registration_number: number;
  name: string;
  cpf: string;
  phone: string;
  email: string;
  /** Present when the backend migration includes the documented registration field. */
  date_of_birth?: string | null;
  client_type: ClientType;
  profile?: string | null;
  terms_accepted: boolean;
  created_at?: string;
}

export interface PlayerRegistrationPayload {
  name: string;
  cpf: string;
  phone: string;
  email: string;
  date_of_birth: string;
  client_type: ClientType;
  profile?: string;
  terms_accepted: boolean;
}

export type PlayerSearchField = 'registration_number' | 'cpf' | 'phone';

export interface PlayerSearchRequest {
  field: PlayerSearchField;
  value: string;
}
