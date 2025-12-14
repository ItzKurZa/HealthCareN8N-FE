import { apiClient } from '../../config/api';
import type { Booking } from '../../shared/types';

export interface DoctorSchedule {
  id: string;
  doctor_name: string;
  date: string;
  time_slots: {
    time: string;
    available: boolean;
    booking_id?: string;
  }[];
}

export interface PatientBooking extends Booking {
  full_name: string;
  email: string;
  phone: string;
}

export const doctorService = {
  async getDoctorBookings(doctorName: string, filters?: {
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<PatientBooking[]> {
    const queryParams = new URLSearchParams();
    queryParams.append('doctor', doctorName);
    if (filters?.status) queryParams.append('status', filters.status);
    if (filters?.dateFrom) queryParams.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) queryParams.append('dateTo', filters.dateTo);

    const queryString = queryParams.toString();
    const endpoint = `/doctor/bookings?${queryString}`;
    
    const response = await apiClient.get<{ bookings: PatientBooking[] }>(endpoint);
    return response.bookings || [];
  },

  async getDoctorSchedule(doctorName: string, dateFrom: string, dateTo: string): Promise<DoctorSchedule[]> {
    const response = await apiClient.get<{ schedule: DoctorSchedule[] }>(
      `/doctor/schedule?doctor=${encodeURIComponent(doctorName)}&dateFrom=${dateFrom}&dateTo=${dateTo}`
    );
    return response.schedule || [];
  },

  async updateBookingStatus(bookingId: string, status: Booking['status']): Promise<Booking> {
    const response = await apiClient.put<{ booking: Booking }>(`/doctor/bookings/${bookingId}`, {
      status,
    });
    if (!response.booking) {
      throw new Error('Failed to update booking status');
    }
    return response.booking;
  },

  async updateScheduleAvailability(
    doctorName: string,
    date: string,
    time: string,
    available: boolean
  ): Promise<void> {
    await apiClient.put('/doctor/schedule/availability', {
      doctor_name: doctorName,
      date,
      time,
      available,
    });
  },
};

