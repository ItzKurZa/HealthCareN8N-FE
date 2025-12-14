import { apiClient } from '../../config/api';
import type { Booking } from '../../shared/types';

export interface Statistics {
  totalPatients: number;
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  bookingsByDepartment: { department: string; count: number }[];
  bookingsByDate: { date: string; count: number }[];
}

export interface PatientBooking extends Booking {
  full_name: string;
  email: string;
  phone: string;
}

export const adminService = {
  async getStatistics(): Promise<Statistics> {
    const response = await apiClient.get<{ statistics: Statistics }>('/admin/statistics');
    return response.statistics || {
      totalPatients: 0,
      totalBookings: 0,
      pendingBookings: 0,
      confirmedBookings: 0,
      completedBookings: 0,
      cancelledBookings: 0,
      bookingsByDepartment: [],
      bookingsByDate: [],
    };
  },

  async getAllBookings(filters?: {
    status?: string;
    department?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<PatientBooking[]> {
    const queryParams = new URLSearchParams();
    if (filters?.status) queryParams.append('status', filters.status);
    if (filters?.department) queryParams.append('department', filters.department);
    if (filters?.dateFrom) queryParams.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) queryParams.append('dateTo', filters.dateTo);

    const queryString = queryParams.toString();
    const endpoint = `/admin/bookings${queryString ? `?${queryString}` : ''}`;
    
    const response = await apiClient.get<{ bookings: PatientBooking[] }>(endpoint);
    return response.bookings || [];
  },

  async updateBookingStatus(bookingId: string, status: Booking['status']): Promise<Booking> {
    const response = await apiClient.put<{ booking: Booking }>(`/admin/bookings/${bookingId}`, {
      status,
    });
    if (!response.booking) {
      throw new Error('Failed to update booking status');
    }
    return response.booking;
  },
};

