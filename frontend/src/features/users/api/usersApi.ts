import { api, ApiError } from '../../../lib/apiClient';
import type { CreateUserPayload, StaffUser, UpdateUserPayload } from '../types';

export { ApiError };

export async function listUsers(): Promise<StaffUser[]> {
  return api.get<StaffUser[]>('/api/users');
}

export async function createUser(payload: CreateUserPayload): Promise<StaffUser> {
  return api.post<StaffUser>('/api/users', payload);
}

export async function updateUser(id: string, payload: UpdateUserPayload): Promise<StaffUser> {
  return api.patch<StaffUser>(`/api/users/${id}`, payload);
}

export async function deleteUser(id: string): Promise<{ id: string }> {
  return api.del<{ id: string }>(`/api/users/${id}`);
}
