import { apiClient } from './client';
import { Comment, Evidence, PaginatedResponse, Ticket } from '../types';

interface TicketListParams {
  page?: number;
  pageSize?: number;
  status?: string;
  priority?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  assigned?: 'assigned' | 'unassigned' | 'mine';
}

interface QueueParams {
  page?: number;
  pageSize?: number;
  status?: string;
  priority?: string;
  search?: string;
  assigned?: 'assigned' | 'unassigned' | 'mine';
}

export const ticketApi = {
  async list(params: TicketListParams): Promise<PaginatedResponse<Ticket>> {
    const response = await apiClient.get('/tickets', { params });
    return response.data;
  },

  async queue(params: QueueParams): Promise<PaginatedResponse<Ticket>> {
    const response = await apiClient.get('/tickets/queue', { params });
    return response.data;
  },

  async getById(id: string): Promise<Ticket> {
    const response = await apiClient.get(`/tickets/${id}`);
    return response.data.data;
  },

  async create(payload: { title: string; description: string; priority: string }): Promise<Ticket> {
    const response = await apiClient.post('/tickets', payload);
    return response.data.data;
  },

  async update(id: string, payload: Partial<Pick<Ticket, 'title' | 'description' | 'priority'>>): Promise<Ticket> {
    const response = await apiClient.patch(`/tickets/${id}`, payload);
    return response.data.data;
  },

  async assign(id: string, assignedToUserId: string | null): Promise<Ticket> {
    const response = await apiClient.patch(`/tickets/${id}/assign`, { assignedToUserId });
    return response.data.data;
  },

  async updateStatus(id: string, status: string): Promise<Ticket> {
    const response = await apiClient.patch(`/tickets/${id}/status`, { status });
    return response.data.data;
  },

  async listComments(ticketId: string): Promise<Comment[]> {
    const response = await apiClient.get(`/tickets/${ticketId}/comments`);
    return response.data.data;
  },

  async addComment(ticketId: string, body: string): Promise<Comment> {
    const response = await apiClient.post(`/tickets/${ticketId}/comments`, { body });
    return response.data.data;
  },

  async listEvidence(ticketId: string): Promise<Evidence[]> {
    const response = await apiClient.get(`/tickets/${ticketId}/evidence`);
    return response.data.data;
  },

  async uploadEvidence(ticketId: string, file: File): Promise<Evidence> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post(`/tickets/${ticketId}/evidence`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    return response.data.data;
  },

  async downloadEvidence(evidenceId: string): Promise<Blob> {
    const response = await apiClient.get(`/evidence/${evidenceId}/download`, {
      responseType: 'blob'
    });

    return response.data;
  }
};
