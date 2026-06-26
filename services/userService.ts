import { apiService } from './api';

export const userService = {
  getUserProfile: () =>
    apiService.get('/users/me'),

  getPublicProfile: (userId: string) =>
    apiService.get(`/users/profile/${userId}`),

  getUsers: (universityCode?: string) =>
    apiService.get('/users', universityCode ? { universityCode } : undefined),

  getLeaderboard: (universityCode?: string) =>
    apiService.get('/users/leaderboard', universityCode ? { universityCode } : undefined),

  updateProfile: (data: { displayName?: string; fullName?: string }) =>
    apiService.patch('/users/profile', data),

  updateProfileIcon: (icon: string) =>
    apiService.patch('/users/profile-icon', { icon }),

  getLinuxCourseProgress: () =>
    apiService.get('/users/course-progress/linux'),

  updateLinuxCourseProgress: (data: { completedLectures: string[]; solvedQuestions: string[] }) =>
    apiService.put('/users/course-progress/linux', data),

  getUserLinuxCourseProgressForAdmin: (userId: string) =>
    apiService.get(`/users/${userId}/course-progress/linux`),

  resetUserLinuxCourseProgress: (userId: string) =>
    apiService.delete(`/users/${userId}/course-progress/linux`),

  banUser: (userId: string) =>
    apiService.post(`/users/ban/${userId}`),

  unbanUser: (userId: string) =>
    apiService.post(`/users/unban/${userId}`),

  deleteUser: (userId: string) =>
    apiService.delete(`/users/${userId}`),

  createAdmin: (adminData: any) =>
    apiService.post('/users/create-admin', adminData),

  purchaseHint: (challengeId: string, hintIndex: number, cost: number) =>
    apiService.post('/users/purchase-hint', { challengeId, hintIndex, cost }),
};
