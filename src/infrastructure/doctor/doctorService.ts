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
  medical_record?: string; // Hồ sơ bệnh án
}

export const doctorService = {
  async getDoctorBookings(doctorName: string, filters?: {
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  }): Promise<{ bookings: PatientBooking[]; pagination?: any }> {
    const queryParams = new URLSearchParams();
    queryParams.append('doctor', doctorName);
    if (filters?.status) queryParams.append('status', filters.status);
    if (filters?.dateFrom) queryParams.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) queryParams.append('dateTo', filters.dateTo);
    if (filters?.page) queryParams.append('page', filters.page.toString());
    if (filters?.limit) queryParams.append('limit', filters.limit.toString());

    const queryString = queryParams.toString();
    const endpoint = `/doctor/bookings?${queryString}`;
    
    const response = await apiClient.get<{ bookings: PatientBooking[]; pagination?: any }>(endpoint);
    return {
      bookings: response.bookings || [],
      pagination: response.pagination,
    };
  },

  async getDoctorSchedule(doctorName: string, dateFrom: string, dateTo: string): Promise<DoctorSchedule[]> {
    const response = await apiClient.get<{ schedule: DoctorSchedule[] }>(
      `/doctor/schedule?doctor=${encodeURIComponent(doctorName)}&dateFrom=${dateFrom}&dateTo=${dateTo}`
    );
    return response.schedule || [];
  },

  async updateBookingStatus(bookingId: string, status?: Booking['status'], medicalRecord?: string): Promise<Booking> {
    const body: any = {};
    if (status) body.status = status;
    if (medicalRecord !== undefined) body.medical_record = medicalRecord;
    
    const response = await apiClient.put<{ booking: Booking }>(`/doctor/bookings/${bookingId}`, body);
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

