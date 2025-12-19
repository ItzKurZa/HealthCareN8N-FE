import { useState, useEffect } from 'react';
import { authService } from '../../infrastructure/auth/authService';

export const useAuth = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Lấy user hiện tại khi mới vào
    authService.getCurrentUser()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));

    // Lắng nghe sự thay đổi trạng thái (login/logout) từ service
    const { data: { subscription } } = authService.onAuthStateChange((user) => {
      setUser(user);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // THÊM: Hàm logout để App.tsx có thể gọi
  const logout = async () => {
    try {
      await authService.signOut(); // Gọi xuống service để xóa session thực tế
      setUser(null); // Cập nhật state cục bộ ngay lập tức
    } catch (error) {
      console.error("Đăng xuất thất bại:", error);
    }
  };

  // Trả về thêm hàm logout
  return { user, loading, logout };
};