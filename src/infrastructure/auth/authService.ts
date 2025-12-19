import { apiClient } from '../../config/api';

// 1. Định nghĩa rõ kiểu dữ liệu trả về từ API để code sạch hơn
interface SignUpResult {
  token?: string;
  auth?: {
    idToken: string;
  };
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

interface ProfileResult {
  profile: any;
}

export const authService = {
  async signUp(email: string, password: string, fullname: string, phone: string, cccd: string) {
    // Truyền interface SignUpResult vào generic <...>
    const response = await apiClient.post<SignUpResult>('/account/signup', {
      email,
      password,
      fullname,
      phone,
      cccd,
    });

    // SỬA: Lấy dữ liệu từ thuộc tính .data
    const data = response.data;

    // Logic fallback: token có thể nằm ở data.token hoặc data.auth.idToken tùy backend
    const token = data?.token || data?.auth?.idToken;

    if (token) {
      apiClient.setToken(token);
    }

    return data;
  },

  async signIn(email: string, password: string) {
    // Truyền interface SignInResult
    const response = await apiClient.post<SignInResult>('/account/signin', { email, password });

    // SỬA: Lấy dữ liệu từ thuộc tính .data
    const data = response.data;
    const token = data?.auth?.idToken;

    if (token) {
      apiClient.setToken(token);
    }

    return data?.auth;
  },

  async signOut() {
    try {
      await apiClient.post('/account/signout');
    } catch (error) {
      console.warn("Logout API failed, but clearing local token anyway.", error);
    } finally {
      apiClient.setToken(null);
    }
  },

  async getCurrentUser() {
    const token = apiClient.getToken();
    if (!token) return null;

    try {
      // Truyền interface ProfileResult
      const response = await apiClient.get<ProfileResult>('/account/profile');

      // SỬA: Truy cập vào response.data.profile
      return response.data?.profile || null;
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