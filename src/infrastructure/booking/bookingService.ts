import { apiClient } from '../../config/api';
import type { Booking, Department, Doctor } from '../../shared/types';

export const bookingService = {
  async createBooking(booking: Omit<Booking, 'id' | 'created_at' | 'status'>): Promise<Booking> {
    const response = await apiClient.post<{ booking: Booking }>('/booking', booking);

    if (!response.data?.booking) {
      throw new Error('Failed to create booking');
    }

    return response.data.booking;
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

  async cancelBooking(bookingId: string): Promise<void> {
    await apiClient.put(`/booking/${bookingId}/cancel`, { status: 'cancelled' });
  },

  async getDepartmentsAndDoctors(): Promise<{ departments: Department[]; doctors: Doctor[] }> {
  try {
    const response = await apiClient.get<{ departments: Department[]; doctors: Doctor[] }>('/booking/departments-doctors');

    const departments = response.data?.departments || [];
    const doctors = response.data?.doctors || [];

    return { departments, doctors };
  } catch (err) {
    console.error('Error fetching departments and doctors:', err);
    return { departments: [], doctors: [] };
  }
}

};
