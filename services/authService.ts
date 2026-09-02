const API_BASE_URL = '/api';

/**
 * These used to be `.then(res => res.json())`, so a 401 resolved with
 * `{ error: 'Invalid credentials' }` and read as a successful login to any
 * caller that did not think to check.
 */
const parse = async (res: Response) => {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.error || 'Request failed');
  return body;
};

export const authService = {
  register: (userData: { username: string; password: string; universityCode: string }) =>
    fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    }).then(parse),

  login: (credentials: { username: string; password: string }) =>
    fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    }).then(parse),

  loginAdmin: (credentials: { username: string; password: string; universityCode: string }) =>
    fetch(`${API_BASE_URL}/auth/login-admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    }).then(parse),

  loginSuperAdmin: (credentials: { username: string; password: string }) =>
    fetch(`${API_BASE_URL}/auth/login-super-admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    }).then(parse),

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
