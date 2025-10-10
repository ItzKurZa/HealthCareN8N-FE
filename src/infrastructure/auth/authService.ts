import { apiClient } from '../../config/api';

interface AuthResponse {
  idToken: string;
  refreshToken?: string;
  expiresIn?: string;
  localId?: string;
  email?: string;
  [key: string]: any;
}

export const authService = {
  async signUp(email: string, password: string, fullname: string, phone: string, cccd: string) {
    const response = await apiClient.post<any>('/account/signup', {
      email,
      password,
      fullname,
      phone,
      cccd,
    });

    // Lấy token Firebase
    const token = response.token || response.auth?.idToken;
    if (token) {
      apiClient.setToken(token);
    }

    return response;
  },

  async signIn(email: string, password: string) {
    const response = await apiClient.post<any>('/account/signin', { email, password });

    const token = response.auth?.idToken;
    if (token) {
      apiClient.setToken(token);
    }

    return response.auth;
  },

  async signOut() {
    await apiClient.post('/account/signout');
    apiClient.setToken(null);
  },

  async getCurrentUser() {
    const token = apiClient.getToken();
    if (!token) return null;

    try {
      const response = await apiClient.get<{ profile: any }>('/account/profile');
      return response.profile || null;
    } catch (error) {
      apiClient.setToken(null);
      return null;
    }
  },

  onAuthStateChange(callback: (user: any) => void) {
    const checkAuth = async () => {
      const user = await this.getCurrentUser();
      callback(user);
    };

    checkAuth();
    const interval = setInterval(checkAuth, 60000);

    return {
      data: {
        subscription: {
          unsubscribe: () => clearInterval(interval),
        },
      },
    };
  },
};
