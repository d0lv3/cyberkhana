import { apiService } from './api';

export const announcementService = {
  getAnnouncements: () =>
    apiService.get('/announcements'),

  getCompetitionAnnouncements: (competitionId: string) =>
    apiService.get(`/announcements/competition/${competitionId}`),

  createAnnouncement: (announcementData: { title: string; content: string }) =>
    apiService.post('/announcements', announcementData),

  createCompetitionAnnouncement: (competitionId: string, announcementData: { title: string; content: string }) =>
    apiService.post(`/announcements/competition/${competitionId}`, announcementData),

  updateAnnouncement: (id: string, announcementData: { title: string; content: string }) =>
    apiService.put(`/announcements/${id}`, announcementData),

  deleteAnnouncement: (id: string) =>
    apiService.delete(`/announcements/${id}`),
};
