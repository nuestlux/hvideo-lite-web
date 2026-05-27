import client from './client';

export interface ConfigItem {
  key: string;
  value: string;
  description: string | null;
  updated_by: number | null;
  updated_at: string | null;
}

export const configApi = {
  list: () => client.get<{ data: ConfigItem[] }>('/admin/config/'),

  update: (values: Record<string, string>) =>
    client.put<{ data: ConfigItem[] }>('/admin/config/', { values }),

  testEmail: () =>
    client.post<{ data: {}; message: string }>('/admin/config/test-email'),

  resetDefaults: () =>
    client.post<{ data: ConfigItem[]; message: string }>('/admin/config/reset-defaults'),
};
