import client from './client';

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  points: number;
  created_at: string;
}

export interface PaginatedUsers {
  items: User[];
  total: number;
  page: number;
  limit: number;
}

export const usersApi = {
  list: (params: { search?: string; status?: string; role?: string; page?: number; limit?: number }) =>
    client.get<{ data: PaginatedUsers }>('/admin/users/', { params }),

  get: (id: number) => client.get<{ data: User }>(`/admin/users/${id}`),

  create: (data: { name: string; email: string; role: string }) =>
    client.post<{ data: User }>('/admin/users/', data),

  update: (id: number, data: { name?: string; email?: string }) =>
    client.put<{ data: User }>(`/admin/users/${id}`, data),

  toggleLock: (id: number) =>
    client.patch<{ data: User }>(`/admin/users/${id}/lock`),

  resendOtp: (id: number) =>
    client.post<{ data: {} }>(`/admin/users/${id}/resend-otp`),

  resetOtp: (id: number) =>
    client.post<{ data: {} }>(`/admin/users/${id}/reset-otp`),

  resetPassword: (id: number, data: { password?: string }) =>
    client.post<{ data: { password: string } }>(`/admin/users/${id}/reset-password`, data),
};
