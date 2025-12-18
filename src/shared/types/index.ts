export interface User {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  created_at: string;
}

export interface MedicalFile {
  id: string;
  user_id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  description?: string;
  uploaded_at: string;
}

export interface Booking {
  id: string;
  submission_id?: string; // Mã đặt lịch chính là submissionId
  user_id: string;
  department: string;
  doctor_name?: string;
  appointment_date: string;
  appointment_time: string;
  reason: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface Department {
  id: string;
  name: string;
  description?: string;
}

export interface Doctor {
  id: string;
  name: string;
  department_id: string;
  department_name?: string;
  specialization?: string;
  available?: boolean;
}

export interface UserRole {
  role: 'patient' | 'doctor' | 'admin';
}

export interface PatientStatistics {
  totalPatients: number;
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  completedBookings: number;
  cancelledBookings: number;
}
