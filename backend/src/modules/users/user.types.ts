/** Usuário de staff que acessa o console (armazenado no Supabase Auth). */
export interface StaffUser {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
}

export interface CreateUserInput {
  email: string;
  password: string;
}

export interface UpdateUserInput {
  email?: string;
  password?: string;
}
