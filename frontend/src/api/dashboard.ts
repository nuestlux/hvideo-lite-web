import client from './client';

export interface ChartDataPoint {
  date: string;
  value: number;
}

export interface SuccessTrendPoint {
  date: string;
  rate: number;
}

export interface ModulePoint {
  name: string;
  value: number;
}

export interface TopOfficer {
  id: number;
  name: string;
  email: string;
  points: number;
  txns: number;
}

export interface AdminDashboard {
  summary: { total_users: number; total_jobs: number; success_rate: number };
  daily_volume: ChartDataPoint[];
  success_trend: SuccessTrendPoint[];
  weekly_issued: ChartDataPoint[];
  weekly_consumed: ChartDataPoint[];
  by_module: ModulePoint[];
  top_officers: TopOfficer[];
}

export interface OfficerDashboard {
  points: number;
  total_jobs: number;
  success_rate: number;
  weekly_volume: ChartDataPoint[];
  recent_txns: { time: string; point: number; balance_after: number; reason: string | null }[];
}

export interface ServerHealth {
  cpu: { percent: number; cores: number };
  memory: { used: number; total: number; percent: number };
  disk: { used: number; total: number; percent: number };
  gpu: { id: number; name: string; load: number; memory_used: number; memory_total: number }[];
  timestamp: string;
}

export const dashboardApi = {
  admin: () => client.get<{ data: AdminDashboard }>('/dashboard/admin'),
  officer: () => client.get<{ data: OfficerDashboard }>('/dashboard/officer'),
  serverHealth: () => client.get<{ data: ServerHealth }>('/health/server'),
};
