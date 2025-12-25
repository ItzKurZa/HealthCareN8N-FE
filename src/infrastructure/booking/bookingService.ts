import { apiClient } from '../../config/api';
import type { Booking, Department, Doctor } from '../../shared/types';

export const bookingService = {
  async createBooking(booking: Omit<Booking, 'id' | 'created_at' | 'status'>): Promise<Booking> {
    try {
      const response = await apiClient.post<{ booking: Booking }>('/booking', booking);
      if (!response.booking) {
        throw new Error('Không thể tạo đặt lịch. Vui lòng thử lại.');
      }
      return response.booking;
    } catch (error: any) {
      // Re-throw with better message if it's already a user-friendly error
      throw error;
    }
  },

  async getUserBookings(userId: string, page?: number, limit?: number): Promise<{ bookings: Booking[]; pagination?: any }> {
    const queryParams = new URLSearchParams();
    if (page) queryParams.append('page', page.toString());
    if (limit) queryParams.append('limit', limit.toString());
    
    const queryString = queryParams.toString();
    const endpoint = `/booking/user/${userId}${queryString ? `?${queryString}` : ''}`;
    
    const response = await apiClient.get<{ bookings: Booking[]; pagination?: any }>(endpoint);
    return {
      bookings: response.bookings || [],
      pagination: response.pagination,
    };
  },

  async updateBooking(bookingId: string, updates: Partial<Booking>): Promise<Booking> {
    const response = await apiClient.put<{ booking: Booking }>(`/booking/${bookingId}`, updates);

    if (!response.booking) {
      throw new Error('Failed to update booking');
    }

    return response.booking;
  },

  async getDepartmentsAndDoctors(): Promise<{ departments: Department[]; doctors: Doctor[] }> {
    try {
      const response = await apiClient.get('/booking/departments-doctors');
      const { departments = [], doctors = [] } = response || {};
      return { departments, doctors };
    } catch (err) {
      console.error('❌ Error fetching departments and doctors:', err);
      return { departments: [], doctors: [] };
    }
  },

  async cancelBooking(bookingId: string): Promise<Booking> {
    const response = await apiClient.put<{ booking: Booking }>(`/booking/${bookingId}`, {
      status: 'cancelled',
    });
    if (!response.booking) {
      throw new Error('Failed to cancel booking');
    }
    return response.booking;
  },

  async cancelBookingByCode(bookingCode: string): Promise<Booking> {
    const response = await apiClient.put<{ booking: Booking }>(`/booking/code/${bookingCode}`, {
      status: 'cancelled',
    });
    if (!response.booking) {
      throw new Error('Failed to cancel booking');
    }
    return response.booking;
  },

  async updateBookingByCode(bookingCode: string, updates: Partial<Booking>): Promise<Booking> {
    const response = await apiClient.put<{ booking: Booking }>(`/booking/code/${bookingCode}`, updates);
    if (!response.booking) {
      throw new Error('Failed to update booking');
    }
    return response.booking;
  },

  async getBookingById(bookingId: string): Promise<Booking> {
    const response = await apiClient.get<{ booking: Booking }>(`/booking/check-in/${bookingId}`);
    if (!response.booking) {
      throw new Error('Không tìm thấy đặt lịch');
    }
    return response.booking;
  },

  async checkInBooking(bookingId: string): Promise<Booking> {
    const response = await apiClient.post<{ booking: Booking; message?: string }>(`/booking/check-in/${bookingId}`);
    if (!response.booking) {
      throw new Error('Check-in thất bại');
    }
    return response.booking;
  },
};
