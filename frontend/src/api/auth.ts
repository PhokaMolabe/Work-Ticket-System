import { apiClient } from './client';
import { AuthLoginResponse, User } from '../types';

export const authApi = {
  async login(email: string, password: string): Promise<AuthLoginResponse> {
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data.data;
  },

  async me(): Promise<User> {
    const response = await apiClient.get('/auth/me');
    return response.data.data;
  }
};
