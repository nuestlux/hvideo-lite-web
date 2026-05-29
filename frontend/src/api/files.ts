import client from './client';

export interface FileItem {
  id: number;
  user_id: number;
  name: string;
  original_name: string;
  size: number;
  mime_type: string | null;
  folder: string;
  processed: string;
  created_at: string | null;
}

export interface PaginatedFiles {
  items: FileItem[];
  total: number;
  page: number;
  limit: number;
}

export interface FileQuota {
  used: number;
  limit: number;
  percent: number;
}

export const filesApi = {
  list: (params?: {
    folder?: string;
    processed?: string;
    search?: string;
    file_type?: string;
    sort_by?: string;
    sort_order?: string;
    page?: number;
    limit?: number;
  }) =>
    client.get<{ data: PaginatedFiles }>('/files', { params }),

  upload: (file: File, folder?: string, onProgress?: (percent: number) => void) => {
    const form = new FormData();
    form.append('file', file);
    return client.post<{ data: FileItem }>('/files/upload', form, {
      params: { folder: folder || '/' },
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (e.total && onProgress) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      },
    });
  },

  download: (id: number) => {
    window.open(`/api/files/${id}/download`, '_blank');
  },

  delete: (id: number) =>
    client.delete<{ data: {} }>(`/files/${id}`),

  quota: () =>
    client.get<{ data: FileQuota }>('/files/quota'),
};
