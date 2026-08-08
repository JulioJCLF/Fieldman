import type { AuthError, SupabaseClient, User } from '@supabase/supabase-js';

import { HttpError } from '../../shared/errors.js';
import type { CreateUserInput, StaffUser, UpdateUserInput } from './user.types.js';

export interface UserServicePort {
  list(): Promise<StaffUser[]>;
  create(input: CreateUserInput): Promise<StaffUser>;
  update(id: string, input: UpdateUserInput): Promise<StaffUser>;
  remove(id: string): Promise<void>;
}

function toStaffUser(user: User): StaffUser {
  return {
    id: user.id,
    email: user.email ?? '',
    created_at: user.created_at,
    last_sign_in_at: user.last_sign_in_at ?? null,
  };
}

/** Traduz erros do Supabase Auth para HttpError com mensagens amigáveis. */
function toHttpError(error: AuthError): HttpError {
  const status = error.status ?? 400;
  if (status === 422 || /already been registered|already exists/i.test(error.message)) {
    return new HttpError(409, 'Já existe um usuário com este e-mail.');
  }
  if (status === 404) {
    return new HttpError(404, 'Usuário não encontrado.');
  }
  return new HttpError(status >= 400 && status < 500 ? status : 400, 'Não foi possível concluir a operação de usuário.');
}

/** Gerencia os usuários de staff usando a API admin do Supabase Auth. */
export class UserService implements UserServicePort {
  public constructor(private readonly supabase: SupabaseClient) {}

  public async list(): Promise<StaffUser[]> {
    const { data, error } = await this.supabase.auth.admin.listUsers();
    if (error) {
      throw toHttpError(error);
    }
    return data.users
      .map(toStaffUser)
      .sort((a, b) => a.email.localeCompare(b.email));
  }

  public async create(input: CreateUserInput): Promise<StaffUser> {
    const { data, error } = await this.supabase.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true,
    });
    if (error || !data.user) {
      throw error ? toHttpError(error) : new HttpError(400, 'Não foi possível criar o usuário.');
    }
    return toStaffUser(data.user);
  }

  public async update(id: string, input: UpdateUserInput): Promise<StaffUser> {
    const { data, error } = await this.supabase.auth.admin.updateUserById(id, {
      email: input.email,
      password: input.password,
    });
    if (error || !data.user) {
      throw error ? toHttpError(error) : new HttpError(404, 'Usuário não encontrado.');
    }
    return toStaffUser(data.user);
  }

  public async remove(id: string): Promise<void> {
    const { error } = await this.supabase.auth.admin.deleteUser(id);
    if (error) {
      throw toHttpError(error);
    }
  }
}
