import { apiClient } from '../../config/api';
import type { Booking, Department, Doctor } from '../../shared/types';

export const bookingService = {
  async createBooking(booking: Omit<Booking, 'id' | 'created_at' | 'status'>): Promise<Booking> {
    const response = await apiClient.post<{ booking: Booking }>('/booking', booking);
  },

  async getUserBookings(userId: string): Promise<Booking[]> {
    const response = await apiClient.get<{ bookings: Booking[] }>(`/booking/user/${userId}`);
    return response.data?.bookings || [];
  },

  async updateBooking(bookingId: string, updates: Partial<Booking>): Promise<Booking> {
    const response = await apiClient.put<{ booking: Booking }>(`/booking/${bookingId}`, updates);

    if (!response.data?.booking) {
      throw new Error('Failed to update booking');
    }

    return response.data.booking;
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
}

};
