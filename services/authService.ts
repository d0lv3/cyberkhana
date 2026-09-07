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
  register: (userData: {
    username: string;
    password: string;
    universityCode: string;
    acceptedTerms: boolean;
  }) =>
    fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    }).then(parse),

  /**
   * Records that the signed-in user accepts the current Terms.
   *
   * Sends no body: the server takes the user from the token, the version from
   * its own config and the timestamp from its own clock, so there is nothing
   * here worth the client's opinion.
   */
  acceptTerms: () =>
    fetch(`${API_BASE_URL}/auth/accept-terms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
      },
    }).then(parse),

  /** Records that the signed-in ambassador accepts the Ambassador Agreement. */
  acceptAmbassadorAgreement: () =>
    fetch(`${API_BASE_URL}/auth/accept-ambassador-agreement`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
      },
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
