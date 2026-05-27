import client from './client';

export interface Transaction {
  id: number;
  user_id: number;
  user_name?: string | null;
  user_email?: string | null;
  type: string;
  service: string | null;
  point: number;
  balance_before: number;
  balance_after: number;
  reason: string | null;
  created_at: string | null;
}

export interface PaginatedTransactions {
  items: Transaction[];
  total: number;
  page: number;
  limit: number;
}

export interface PointStats {
  total_issued: number;
  total_consumed: number;
  total_circulating: number;
  by_service: Record<string, number>;
}

export const pointsApi = {
  adjust: (userId: number, data: { point: number; reason: string }) =>
    client.post<{ data: { transaction: Transaction; new_balance: number } }>(`/admin/users/${userId}/points`, data),

  listAdmin: (params?: { user_id?: number; service?: string; txn_type?: string; search?: string; sort_by?: string; sort_order?: string; page?: number; limit?: number }) =>
    client.get<{ data: PaginatedTransactions }>('/admin/transactions', { params }),

  listMine: (params?: { service?: string; page?: number; limit?: number }) =>
    client.get<{ data: PaginatedTransactions }>('/me/transactions', { params }),

  stats: () =>
    client.get<{ data: PointStats }>('/admin/points/stats'),
};
