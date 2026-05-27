import client from './client';

export interface PointPackage {
  id: number;
  name: string;
  type: 'STANDARD' | 'ENTERPRISE';
  price?: number;
  points?: number;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PointPackageCreate {
  name: string;
  type: 'STANDARD' | 'ENTERPRISE';
  price?: number;
  points?: number;
  description?: string;
  is_active?: boolean;
}

export interface PointPackageUpdate {
  name?: string;
  type?: 'STANDARD' | 'ENTERPRISE';
  price?: number;
  points?: number;
  description?: string;
  is_active?: boolean;
}

export const packagesApi = {
  list: () => client.get<{ data: PointPackage[] }>('/packages'),
  listAdmin: () => client.get<{ data: PointPackage[] }>('/admin/packages'),
  create: (data: PointPackageCreate) => client.post<{ data: PointPackage }>('/admin/packages', data),
  update: (id: number, data: PointPackageUpdate) => client.put<{ data: PointPackage }>(`/admin/packages/${id}`, data),
  delete: (id: number) => client.delete<{ data: any }>(`/admin/packages/${id}`),
  contactEnterprise: (data: any) => client.post<{ data: any; message: string }>('/packages/contact-enterprise', data),
};

