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

  async getUserBookings(userId: string): Promise<Booking[]> {
    const response = await apiClient.get<{ bookings: Booking[] }>(`/booking/user/${userId}`);
    return response.bookings || [];
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
};
