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
    doctorId: '',
    appointmentDate: '',
    appointmentTime: '',
    reason: '',
    notes: '',
  });
  const [departments, setDepartments] = useState<(Department | string)[]>([]);
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
  },[]);

  useEffect(() => {
    if (formData.department) {
      const filtered = doctors.filter((doc) => {
        // Xử lý cả trường hợp department_id là string hoặc object
        const docDeptId = typeof doc.department_id === 'string' 
          ? doc.department_id 
          : doc.department_id;
        return docDeptId === formData.department;
      });
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

      // Sử dụng user.id hoặc user.cccd tùy theo backend yêu cầu
      // Nếu backend dùng cccd làm identifier, thì dùng cccd
      // Nếu backend dùng id, thì dùng id
      const userId = user.id || user.cccd || user.user_id;
      
      await bookingService.createBooking({
        user_id: userId,
        full_name: user.fullname || user.user_metadata?.full_name || user.full_name || '',
        email: user.email || '',
        phone: user.phone || user.user_metadata?.phone || '',
        department: formData.department,
        doctor_name: selectedDoctor?.name || undefined,
        appointment_date: formData.appointmentDate,
        appointment_time: formData.appointmentTime,
        reason: formData.reason || 'Khám bệnh',
        notes: formData.notes || undefined,
      });
      setSuccess(true);
      setFormData({
        department: '',
        doctorId: '',
        appointmentDate: '',
        appointmentTime: '',
        reason: '',
        notes: '',
      });
    } catch (err: any) {
      setError(err.message || 'Failed to create booking 1');
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
            <h1 className="text-3xl font-bold text-gray-900">Đặt Lịch Khám</h1>
          </div>

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-6">
              Đặt lịch thành công! Chúng tôi sẽ liên hệ với bạn sớm để xác nhận.
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
                Khoa *
              </label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Chọn khoa</option>
                {departments.map((dept, index) => {
                  const deptValue = typeof dept === 'string' ? dept : (dept.name || dept.id);
                  const deptLabel = typeof dept === 'string' ? dept : (dept.name || dept.id);
                  return (
                    <option key={index} value={deptValue}>
                      {deptLabel}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bác sĩ
              </label>
              <select
                value={formData.doctorId}
                onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={!formData.department}
              >
                <option value="">Bất kỳ bác sĩ nào có sẵn</option>
                {filteredDoctors.map((doctor, index) => (
                  <option key={index} value={doctor.name}>
                    {doctor.name}
                  </option>
                ))}
              </select>
              {!formData.department && (
                <p className="text-sm text-gray-500 mt-1">
                  Vui lòng chọn khoa trước
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ngày hẹn *
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
                  Giờ hẹn *
                </label>
                <select
                  value={formData.appointmentTime}
                  onChange={(e) => setFormData({ ...formData, appointmentTime: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Chọn giờ</option>
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
                Lý do khám bệnh *
              </label>
              <textarea
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Mô tả lý do khám bệnh, triệu chứng..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ghi chú thêm (Tùy chọn)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Thông tin bổ sung..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 font-medium text-lg flex items-center justify-center space-x-2"
            >
              <Clock className="w-5 h-5" />
              <span>{loading ? 'Đang đặt lịch...' : 'Đặt Lịch'}</span>
            </button>
          </form>
        </div>
      </div>

      <Chatbot />
    </div>
  );
};
