export interface StaffUser {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
}

export interface CreateUserPayload {
  email: string;
  password: string;
}

export interface UpdateUserPayload {
  email?: string;
  password?: string;
}
