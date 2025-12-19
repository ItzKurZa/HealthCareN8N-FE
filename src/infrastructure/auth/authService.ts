import { apiClient } from '../../config/api';

interface SignUpResult {
  token?: string;
  auth?: { idToken: string };
  [key: string]: any;
}

interface SignInResult {
  auth: {
    idToken: string;
    refreshToken?: string;
    expiresIn?: string;
    localId?: string;
    email?: string;
  };
}

interface ProfileResponse {
  profile?: any;
  data?: {
    profile?: any;
  };
  [key: string]: any;
}

export const authService = {
  async signUp(email: string, password: string, fullname: string, phone: string, cccd: string) {
    const response = await apiClient.post<SignUpResult>('/account/signup', {
      email, password, fullname, phone, cccd,
    });
    
    const data = response as any;
    const token = data?.token || data?.auth?.idToken || data?.data?.token;

    if (token) apiClient.setToken(token);
    return data;
  },

  async signIn(email: string, password: string) {
    const response = await apiClient.post<SignInResult>('/account/signin', { email, password });
    
    const data = response as any;
    
    const token = data?.auth?.idToken || data?.token || data?.data?.token;
    if (token) {
        apiClient.setToken(token);
    }

    const refreshToken = data?.auth?.refreshToken || data?.refreshToken;
    if (refreshToken) {
        localStorage.setItem('refresh_token', refreshToken);
    }

    return data?.auth || data;
  },

  async refreshToken() {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) throw new Error('No refresh token available');

    const response = await apiClient.post<any>('/account/refresh', { refreshToken });
    const data = response as any;

    if (data?.idToken) {
        apiClient.setToken(data.idToken);
        if (data.refreshToken) {
            localStorage.setItem('refresh_token', data.refreshToken);
        }
        return data.idToken;
    }
    throw new Error('Refresh failed');
  },

  async signOut() {
    try {
      await apiClient.post('/account/signout');
    } catch (error) {
      console.warn("Logout API failed, but clearing local token anyway.");
    } finally {
      apiClient.setToken(null);
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('current_page');
      window.location.href = '/';
    }
  },

  async getCurrentUser() {
    const token = apiClient.getToken();
    if (!token) {
      return null;
    }

    try {
      const response = await apiClient.get<ProfileResponse>('/account/profile');
      const resAny = response as any; 

      if (resAny.profile) return resAny.profile;
      if (resAny.data && resAny.data.profile) return resAny.data.profile;
      if (resAny.email || resAny.uid) return resAny;

      return null;
    } catch (error: any) {
      if (error.message === 'Unauthorized' || error.message === 'Session expired') {
         apiClient.setToken(null);
      }
      return null;
    }
  },

  async getFullProfileData(userId: string) {
    try {
        const response = await apiClient.get<any>(`/account/profile-data/${userId}`);
        const data = (response as any).data; 
        return data;
    } catch (error) {
        console.error("Error fetching full profile data:", error);
        throw error;
    }
  },

  onAuthStateChange(callback: (user: any) => void) {
    const checkAuth = async () => {
      const user = await this.getCurrentUser();
      callback(user);
    };

    checkAuth();
    const interval = setInterval(checkAuth, 120000); 

    return {
      data: {
        subscription: {
          unsubscribe: () => clearInterval(interval),
        },
      },
    };
  },
};