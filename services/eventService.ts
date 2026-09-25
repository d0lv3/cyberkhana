import { apiService } from './api';

export const eventService = {
  details: (id: string) => apiService.get(`/competitions/${id}/event`),
  candidates: (id: string, search: string) => apiService.get(`/competitions/${id}/registration-candidates`, { search }),
  register: (id: string, team: { teamAction: 'create' | 'join'; name?: string; inviteCode?: string }) => apiService.post(`/competitions/${id}/register`, team),
  unregister: (id: string) => apiService.delete(`/competitions/${id}/register`),
  createTeam: (id: string, name: string) => apiService.post(`/competitions/${id}/teams`, { name }),
  joinTeam: (id: string, inviteCode: string) => apiService.post(`/competitions/${id}/teams/join`, { inviteCode }),
  leaveTeam: (id: string) => apiService.delete(`/competitions/${id}/teams/me`),
  addMember: (id: string, teamId: string, userId: string) => apiService.post(`/competitions/${id}/teams/${teamId}/members`, { userId }),
  removeMember: (id: string, teamId: string, userId: string) => apiService.delete(`/competitions/${id}/teams/${teamId}/members/${userId}`),
  leaderboard: (id: string, mode: 'team' | 'individual') => apiService.get(`/competitions/${id}/leaderboard`, { mode }),
  invitations: () => apiService.get('/competitions/invitations'),
  respond: (id: string, status: 'accepted' | 'declined') => apiService.post(`/competitions/${id}/invitation`, { status }),
  addParticipant: (id: string, userId: string) => apiService.post(`/competitions/${id}/registrations`, { userId }),
  removeParticipant: (id: string, userId: string) => apiService.delete(`/competitions/${id}/registrations/${userId}`),
  adjust: (id: string, teamId: string, amount: number, reason: string) => apiService.post(`/competitions/${id}/teams/${teamId}/adjustments`, { amount, reason }),
  disqualify: (id: string, teamId: string, reason: string) => apiService.post(`/competitions/${id}/teams/${teamId}/disqualification`, { reason }),
  reinstate: (id: string, teamId: string) => apiService.delete(`/competitions/${id}/teams/${teamId}/disqualification`),
  /** Partial update: name, description, capacity, schedule, and `invite` / `revoke` university codes. */
  updateSettings: (id: string, settings: Record<string, unknown>) => apiService.patch(`/competitions/${id}/settings`, settings),
};
