const API_BASE_URL = '/api';

class ApiService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  }

  private async parseResponseBody(response: Response, tolerateInvalidJson: boolean) {
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const text = await response.text();
      if (!text.trim()) {
        return null;
      }

      try {
        return JSON.parse(text);
      } catch {
        if (tolerateInvalidJson) {
          return null;
        }
        throw new Error('Invalid JSON response from API');
      }
    }

    const text = await response.text();
    return text.trim() ? text : null;
  }

  private async handleResponse(response: Response) {
    const body = await this.parseResponseBody(response, !response.ok);

    if (!response.ok) {
      const message = typeof body === 'object' && body !== null && 'error' in body
        ? String((body as { error: unknown }).error)
        : typeof body === 'string' && body.length > 0
          ? body
          : `API request failed (${response.status})`;

      // Auto-logout on expired/invalid auth token (but not competition security code errors)
      if (response.status === 401 && message.includes('authentication token')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return;
      }

      throw new Error(message);
    }

    return body;
  }

  async get(endpoint: string, params?: Record<string, string>) {
    let url = `${API_BASE_URL}${endpoint}`;
    if (params) {
      const searchParams = new URLSearchParams(params);
      url += `?${searchParams.toString()}`;
    }

    const response = await fetch(url, {
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse(response);
  }

  async post(endpoint: string, data?: any) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse(response);
  }

  async put(endpoint: string, data: any) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    return this.handleResponse(response);
  }

  async patch(endpoint: string, data: any) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    return this.handleResponse(response);
  }

  async delete(endpoint: string) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse(response);
  }
}

export const apiService = new ApiService();
