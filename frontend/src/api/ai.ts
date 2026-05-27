import client from './client';

export interface Job {
  id: number;
  user_id: number;
  module: string;
  status: string;
  input_file: string | null;
  input_file_id: number | null;
  config: Record<string, any> | null;
  result: Record<string, any> | null;
  confidence: string | null;
  error: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string | null;
  batch_id: string | null;
  country: string | null;
}

export interface PaginatedJobs {
  items: Job[];
  total: number;
  page: number;
  limit: number;
}

export interface VideoAnalysis {
  file_name: string;
  file_size: number;
  mime_type: string | null;
  repairable: boolean;
  errors: { type: string; severity: string; description: string }[];
  recommended_mode: string;
  has_critical_errors?: boolean;
  recommends_reference?: boolean;
  can_repair_with_ai?: boolean;
  can_repair_with_reference?: boolean;
}

export interface BatchProcessResult {
  batch_id: string;
  jobs: Job[];
}

export const aiApi = {
  process: (module: string, fileId: number, config?: Record<string, any>) =>
    client.post<{ data: Job | BatchProcessResult }>('/ai/process', null, {
      params: { module, file_id: fileId, config: JSON.stringify(config || {}) },
    }),

  processAdvanced: (params: { module: string; file_id: number; reference_file_id?: number; config: string }) =>
    client.post<{ data: Job | BatchProcessResult }>('/ai/process', null, { params }),

  listJobs: (params?: { module?: string; page?: number; limit?: number }) =>
    client.get<{ data: PaginatedJobs }>('/ai/jobs', { params }),

  getJob: (id: number) =>
    client.get<{ data: Job }>(`/ai/jobs/${id}`),

  getBatchJobs: (batchId: string) =>
    client.get<{ data: Job[] }>('/ai/jobs/batch', { params: { batch_id: batchId } }),

  analyzeVideo: (fileId: number) =>
    client.post<{ data: VideoAnalysis }>('/ai/video/analyze', null, { params: { file_id: fileId } }),

  extractFrames: (fileId: number) =>
    client.post<{ data: { frames: { index: number; time: number; url?: string; mock?: boolean }[]; total: number } }>('/ai/video/frames', null, { params: { file_id: fileId } }),
};
