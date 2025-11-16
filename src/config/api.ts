const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

type LoadingListener = (isLoading: boolean) => void;

let pendingRequests = 0;
const loadingListeners = new Set<LoadingListener>();

export const loadingEvents = {
  subscribe(listener: LoadingListener) {
    loadingListeners.add(listener);
    // trả về hàm để hủy
    return () => loadingListeners.delete(listener);
  },
  set(isLoading: boolean) {
    loadingListeners.forEach((l) => l(isLoading));
  },
};

const startGlobalLoading = () => {
  pendingRequests += 1;
  if (pendingRequests === 1) {
    loadingEvents.set(true);
  }
};

const stopGlobalLoading = () => {
  pendingRequests = Math.max(0, pendingRequests - 1);
  if (pendingRequests === 0) {
    loadingEvents.set(false);
  }
};


class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setToken(token: string | null) {
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  private getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    startGlobalLoading();
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Request failed');
      }

      return data;
    } catch (error: any) {
      throw new Error(error.message || 'Network error');
    } finally {
      stopGlobalLoading();
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  async uploadFile<T>(
    endpoint: string,
    file: File,
    additionalData?: any
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);

    if (additionalData) {
      Object.keys(additionalData).forEach((key) => {
        formData.append(key, additionalData[key]);
      });
    }

    const headers: HeadersInit = {};
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    startGlobalLoading();
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers,
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Upload failed');
      }

      return data;
    } catch (error: any) {
      throw new Error(error.message || 'Network error');
    } finally {
      stopGlobalLoading();
    }
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
