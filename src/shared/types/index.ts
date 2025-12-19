export interface User {
  id: string;
  cccd: string;
  email: string;
  fullname?: string;
  phone?: string;
  role?: string;
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
  user_id: string;
  department: string;
  doctor_name?: string;
  appointment_date: string;
  appointment_time: string;
  // Tôi bỏ 'reason' đi theo ý bạn, nhớ xóa trong BookingPage nhé
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