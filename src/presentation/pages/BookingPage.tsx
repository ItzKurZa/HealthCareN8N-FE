import { useState, useEffect } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { bookingService } from '../../infrastructure/booking/bookingService';
import { Chatbot } from '../components/Chatbot';
import type { Department, Doctor } from '../../shared/types';

interface BookingPageProps {
  user: any;
}

export const BookingPage = ({ user }: BookingPageProps) => {
  const [formData, setFormData] = useState({
    department: '',
    doctorId: '', // Lưu ý: Biến này nên lưu ID hoặc Name tùy vào logic backend, ở đây ta sẽ dùng Name để khớp logic cũ
    appointmentDate: '',
    appointmentTime: '',
    notes: '',
  });

  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const timeSlots = [
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '12:00 PM', '12:30 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
    '04:00 PM', '04:30 PM', '05:00 PM',
  ];

  useEffect(() => {
    loadDepartmentsAndDoctors();
  }, []);

  useEffect(() => {
    if (formData.department) {
      // SỬA: Giả định Department là object có id. Nếu dept là string, logic này cần sửa lại.
      // Ở đây ta giả định Department có field 'id' hoặc 'name'
      const filtered = doctors.filter(
        (doc) => doc.department_id === formData.department
      );
      setFilteredDoctors(filtered);
    } else {
      setFilteredDoctors([]);
    }
  }, [formData.department, doctors]);

  const loadDepartmentsAndDoctors = async () => {
    setDataLoading(true);
    try {
      const { departments: depts, doctors: docs } = await bookingService.getDepartmentsAndDoctors();
      setDepartments(depts);
      setDoctors(docs);
    } catch (err: any) {
      setError('Failed to load departments and doctors');
    } finally {
      setDataLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      const selectedDoctor = doctors.find((d) => d.name === formData.doctorId);

      // SỬA ĐỔI TẠI ĐÂY
      await bookingService.createBooking({
        user_id: user.cccd,
        department: formData.department,
        doctor_name: selectedDoctor?.name || undefined,
        appointment_date: formData.appointmentDate,
        appointment_time: formData.appointmentTime,
        notes: formData.notes || undefined,
      });

      setSuccess(true);
      setFormData({
        department: '',
        doctorId: '',
        appointmentDate: '',
        appointmentTime: '',
        notes: '',
      });
    } catch (err: any) {
      setError(err.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  if (dataLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading booking form...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-center space-x-3 mb-6">
            <Calendar className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Book Appointment</h1>
          </div>

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-6">
              Appointment booked successfully! We will contact you soon to confirm.
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department *
              </label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select a department</option>
                {/* SỬA: Truy cập vào thuộc tính của object department (ví dụ .id và .name) */}
                {departments.map((dept: any, index) => (
                  <option key={index} value={dept.id || dept.name || dept}>
                    {dept.name || dept}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Doctor
              </label>
              <select
                value={formData.doctorId}
                onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={!formData.department}
              >
                <option value="">Any available doctor</option>
                {filteredDoctors.map((doctor, index) => (
                  <option key={index} value={doctor.name}>
                    {doctor.name}
                  </option>
                ))}
              </select>
              {!formData.department && (
                <p className="text-sm text-gray-500 mt-1">
                  Please select a department first
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Appointment Date *
                </label>
                <input
                  type="date"
                  value={formData.appointmentDate}
                  onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Appointment Time *
                </label>
                <select
                  value={formData.appointmentTime}
                  onChange={(e) => setFormData({ ...formData, appointmentTime: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select time</option>
                  {timeSlots.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes (Optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any additional information..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 font-medium text-lg flex items-center justify-center space-x-2"
            >
              <Clock className="w-5 h-5" />
              <span>{loading ? 'Booking...' : 'Book Appointment'}</span>
            </button>
          </form>
        </div>
      </div>

      {/* SỬA: Truyền prop user vào Chatbot */}
      <Chatbot user={user} />
    </div>
  );
};