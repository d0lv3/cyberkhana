import { apiService } from './api';

export const universityService = {
  getUniversities: () =>
    apiService.get('/universities'),

  createUniversity: (university: { name: string; code: string }) =>
    apiService.post('/universities', university),

  deleteUniversity: (id: string) =>
    apiService.delete(`/universities/${id}`),

  // Admin: read/update only their OWN university (resolved server-side from the token).
  getMyUniversity: () =>
    apiService.get('/universities/mine'),

  updateMyUniversity: (data: { name?: string; description?: string; website?: string }) =>
    apiService.patch('/universities/mine', data),
};
