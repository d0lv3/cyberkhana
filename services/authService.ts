const API_BASE_URL = '/api';

export const authService = {
  register: (userData: { username: string; password: string; universityCode: string }) =>
    fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    }).then(res => res.json()),

  login: (credentials: { username: string; password: string }) =>
    fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    }).then(res => res.json()),

  loginAdmin: (credentials: { username: string; password: string; universityCode: string }) =>
    fetch(`${API_BASE_URL}/auth/login-admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    }).then(res => res.json()),

  loginSuperAdmin: (credentials: { username: string; password: string }) =>
    fetch(`${API_BASE_URL}/auth/login-super-admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    }).then(res => res.json()),

  changeSuperAdminPassword: (data: { currentPassword: string; newPassword: string }) =>
    fetch(`${API_BASE_URL}/auth/super-admin/password`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
      },
      body: JSON.stringify(data),
    }).then(async (res) => {
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || 'Failed to change password');
      return body;
    }),
};
