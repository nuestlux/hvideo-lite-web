import client from './client';

export interface ConfigItem {
  key: string;
  value: string;
  description: string | null;
  group: string;
  group_label: string;
  updated_by: number | null;
  updated_at: string | null;
}

export interface ConfigGrouped {
  group: string;
  group_label: string;
  items: ConfigItem[];
}

export const configApi = {
  list: () => client.get<{ data: ConfigItem[] }>('/admin/config/'),

  update: (values: Record<string, string>) =>
    client.put<{ data: ConfigItem[] }>('/admin/config/', { values }),

  resetDefaults: () =>
    client.post<{ data: ConfigItem[]; message: string }>('/admin/config/reset-defaults'),
};
