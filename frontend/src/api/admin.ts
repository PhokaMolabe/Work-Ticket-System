import { apiClient } from './client';
import { AuditLog, PaginatedResponse } from '../types';

interface AuditQuery {
  page?: number;
  pageSize?: number;
  actorUserId?: string;
  action?: string;
  dateFrom?: string;
  dateTo?: string;
}

export const adminApi = {
  async listAuditLogs(params: AuditQuery): Promise<PaginatedResponse<AuditLog>> {
    const response = await apiClient.get('/admin/audit-logs', { params });
    return response.data;
  },

  async exportAuditLogs(format: 'json' | 'csv', params: AuditQuery): Promise<Blob> {
    const response = await apiClient.get('/admin/audit-logs/export', {
      params: {
        ...params,
        format
      },
      responseType: 'blob'
    });

    return response.data;
  }
};
