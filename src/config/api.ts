const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

class ApiClient {
  private baseUrl: string;
  private onUnauthorized?: () => void;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setupInterceptors(onUnauthorized: () => void) {
    this.onUnauthorized = onUnauthorized;
  }

  setToken(token: string | null) {
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  // Hàm phụ trợ để xử lý lỗi 401 tập trung (Logout)
  private handle401() {
    this.setToken(null);
    localStorage.removeItem('refresh_token'); // Xóa cả refresh token
    if (this.onUnauthorized) {
      this.onUnauthorized();
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      // Dùng let để có thể gán lại response sau khi retry
      let response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
      });

      if (response.status === 401) {
        const refreshToken = this.getRefreshToken();
        
        if (refreshToken) {
          try {
            console.log("Token expired, attempting silent refresh...");
            
            const refreshResponse = await fetch(`${this.baseUrl}/account/refresh`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refreshToken })
            });

            if (refreshResponse.ok) {
              const refreshData = await refreshResponse.json();
              const newIdToken = refreshData.idToken || refreshData.id_token;
              const newRefreshToken = refreshData.refreshToken || refreshData.refresh_token;

              if (newIdToken) {
                this.setToken(newIdToken);
                if (newRefreshToken) {
                  localStorage.setItem('refresh_token', newRefreshToken);
                }

                headers['Authorization'] = `Bearer ${newIdToken}`;

                response = await fetch(`${this.baseUrl}${endpoint}`, {
                  ...options,
                  headers,
                });
              }
            } else {
              throw new Error('Refresh failed');
            }
          } catch (refreshError) {
            console.error("Session refresh failed:", refreshError);
            this.handle401();
            throw new Error('Session expired');
          }
        } else {
          this.handle401();
          throw new Error('Unauthorized');
        }
      }

      if (response.status === 204) {
          return { data: null as any };
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Request failed');
      }

      return data;
    } catch (error: any) {
      throw new Error(error.message || 'Network error');
    }
  }

  // Các phương thức HTTP cơ bản
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

  async uploadFile<T>(endpoint: string, file: File, additionalData?: any): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);

    if (additionalData) {
      Object.keys(additionalData).forEach((key) => {
        formData.append(key, additionalData[key]);
      });
    }

    const headers: Record<string, string> = {};
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      let response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers,
        body: formData,
      });

      // [LOGIC MỚI] Áp dụng logic refresh token cho cả upload file
      if (response.status === 401) {
         const refreshToken = this.getRefreshToken();
         if (refreshToken) {
            try {
                const refreshResponse = await fetch(`${this.baseUrl}/account/refresh`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refreshToken })
                });

                if (refreshResponse.ok) {
                    const refreshData = await refreshResponse.json();
                    const newIdToken = refreshData.idToken;
                    
                    if (newIdToken) {
                        this.setToken(newIdToken);
                        if (refreshData.refreshToken) localStorage.setItem('refresh_token', refreshData.refreshToken);
                        
                        // Retry upload
                        headers['Authorization'] = `Bearer ${newIdToken}`;
                        response = await fetch(`${this.baseUrl}${endpoint}`, {
                            method: 'POST',
                            headers,
                            body: formData,
                        });
                    }
                } else {
                    this.handle401();
                    throw new Error('Unauthorized');
                }
            } catch (e) {
                this.handle401();
                throw new Error('Session expired');
            }
         } else {
             this.handle401();
             throw new Error('Unauthorized');
         }
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Upload failed');
      }

      return data;
    } catch (error: any) {
      throw new Error(error.message || 'Network error');
    }
  }
}

export const apiClient = new ApiClient(API_BASE_URL);