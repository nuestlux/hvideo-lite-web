import client from './client';

export interface Profile {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  points: number;
  avatar_url?: string;
  created_at: string;
}

export const profileApi = {
  get: () => client.get<{ data: Profile }>('/profile'),

  update: (data: { name?: string; email?: string }) =>
    client.put<{ data: Profile }>('/profile', data),

  changePassword: (oldPassword: string, newPassword: string) =>
    client.put<{ data: {} }>('/profile/change-password', { old_password: oldPassword, new_password: newPassword }),

  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return client.post<{ data: Profile }>('/profile/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
