import { apiClient } from '../../config/api';
import { Booking, Department, Doctor } from '../../shared/types';

// Cấu hình Cache
const CACHE_KEY = 'booking_metadata_v1';
const CACHE_DURATION = 60 * 60 * 1000; // 1 giờ (60 phút * 60 giây * 1000ms)

interface DeptDoctorResult {
  departments: Department[];
  doctors: Doctor[];
}

export const bookingService = {
  // ... (giữ nguyên hàm createBooking cũ)
  async createBooking(data: Partial<Booking>) {
    const response = await apiClient.post<{ result: Booking }>('/booking', data);
    return response.data;
  },

  // [SỬA ĐỔI] Thêm cơ chế Caching vào hàm này
  async getDepartmentsAndDoctors(forceRefresh = false): Promise<DeptDoctorResult> {
    // 1. Kiểm tra Cache trước (nếu không yêu cầu force refresh)
    if (!forceRefresh) {
      const cachedRaw = localStorage.getItem(CACHE_KEY);
      if (cachedRaw) {
        try {
          const cached = JSON.parse(cachedRaw);
          const now = Date.now();

          // Kiểm tra xem dữ liệu còn hạn sử dụng không (ví dụ: dưới 1 giờ)
          if (now - cached.timestamp < CACHE_DURATION) {
            console.log('🚀 Using cached data for departments/doctors');
            return cached.data; // Trả về ngay lập tức
          }
        } catch (e) {
          console.warn('Cache parsing failed, fetching new data...');
          localStorage.removeItem(CACHE_KEY);
        }
      }
    }

    // 2. Nếu không có Cache hoặc Cache hết hạn -> Gọi API
    console.log('🌐 Fetching fresh data from server...');
    const response = await apiClient.get<{ data: DeptDoctorResult }>('/booking/departments-doctors');
    
    const result = response.data?.data || (response.data as any); 

    const cleanResult: DeptDoctorResult = {
      departments: result.departments || [],
      doctors: result.doctors || []
    };

    // 3. Lưu vào Cache với timestamp hiện tại
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      timestamp: Date.now(),
      data: cleanResult
    }));

    return cleanResult;
  },

  // ... (giữ nguyên hàm getUserBookings cũ)
  async getUserBookings(userId: string): Promise<Booking[]> {
    const response = await apiClient.get<{ result: { bookings: Booking[] } }>(`/booking/${userId}`);
    return response.data?.result?.bookings || [];
  },

  async cancelBooking(bookingId: string): Promise<boolean> {
    try {
      // Gọi API xuống Backend để hủy
      await apiClient.post(`/booking/cancel/${bookingId}`);
      return true;
    } catch (error) {
      console.error('Error cancelling booking:', error);
      throw error;
    }
  },
};