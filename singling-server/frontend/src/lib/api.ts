import axios from 'axios';
import { config } from '@/config';

export const apiClient = axios.create({
  baseURL: `${config.apiUrl}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

// Attach JWT to every request if available
apiClient.interceptors.request.use((req) => {
  if (typeof window !== 'undefined') {
    const token = sessionStorage.getItem('token');
    if (token) req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export const authApi = {
  getToken: (userId: string, username: string) =>
    apiClient.post<{ success: boolean; data: { accessToken: string; expiresIn: string } }>(
      '/auth/token',
      { userId, username },
    ),
};

export const roomApi = {
  list: () => apiClient.get<{ success: boolean; data: import('@/types').Room[] }>('/rooms'),
  get: (roomId: string) =>
    apiClient.get<{ success: boolean; data: import('@/types').Room }>(`/rooms/${roomId}`),
  create: (name: string, maxParticipants?: number) =>
    apiClient.post<{ success: boolean; data: import('@/types').Room }>('/rooms', {
      name,
      maxParticipants,
    }),
};
