import { useState, useEffect } from 'react';
import { Users, Search, Filter, Calendar, Phone, Mail, CheckCircle, XCircle, Clock } from 'lucide-react';
import { adminService, type PatientBooking } from '../../infrastructure/admin/adminService';
import { useToast } from '../contexts/ToastContext';

interface PatientsPageProps {
  user: any;
}

export const PatientsPage = ({ user }: PatientsPageProps) => {
  const { showToast } = useToast();
  const [bookings, setBookings] = useState<PatientBooking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<PatientBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [departments, setDepartments] = useState<string[]>([]);

  useEffect(() => {
    loadBookings();
  }, []);

  useEffect(() => {
    filterBookings();
  }, [searchTerm, statusFilter, departmentFilter, bookings]);

  const loadBookings = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminService.getAllBookings();
      setBookings(data);
      const uniqueDepartments = Array.from(new Set(data.map((b) => b.department)));
      setDepartments(uniqueDepartments);
    } catch (err: any) {
      const errorMsg = err.message || 'Không thể tải danh sách lịch hẹn';
      setError(errorMsg);
      showToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const filterBookings = () => {
    let filtered = [...bookings];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.full_name.toLowerCase().includes(term) ||
          b.email.toLowerCase().includes(term) ||
          b.phone.includes(term) ||
          b.department.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((b) => b.status === statusFilter);
    }

    if (departmentFilter !== 'all') {
      filtered = filtered.filter((b) => b.department === departmentFilter);
    }

    setFilteredBookings(filtered);
  };

  const handleStatusChange = async (bookingId: string, newStatus: PatientBooking['status']) => {
    try {
      await adminService.updateBookingStatus(bookingId, newStatus);
      setBookings(
        bookings.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
      );
      const statusMessages: Record<string, string> = {
        confirmed: 'Xác nhận lịch hẹn thành công!',
        cancelled: 'Hủy lịch hẹn thành công!',
        completed: 'Hoàn thành lịch hẹn thành công!',
      };
      showToast(statusMessages[newStatus] || 'Cập nhật trạng thái thành công!', 'success');
    } catch (err: any) {
      const errorMsg = err.message || 'Cập nhật trạng thái thất bại';
      setError(errorMsg);
      showToast(errorMsg, 'error');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return CheckCircle;
      case 'pending':
        return Clock;
      case 'cancelled':
        return XCircle;
      case 'completed':
        return CheckCircle;
      default:
        return Clock;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading patients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <Users className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Danh Sách Bệnh Nhân</h1>
          </div>
          <p className="text-gray-600">Quản lý lịch hẹn của bệnh nhân</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên, email, số điện thoại..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="pending">Đang chờ</option>
                <option value="confirmed">Đã xác nhận</option>
                <option value="completed">Đã hoàn thành</option>
                <option value="cancelled">Đã hủy</option>
              </select>
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Tất cả khoa</option>
                {departments.map((dept, index) => (
                  <option key={index} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {filteredBookings.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Không tìm thấy lịch hẹn nào</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bệnh nhân
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Khoa
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bác sĩ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ngày & Giờ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredBookings.map((booking) => {
                    const StatusIcon = getStatusIcon(booking.status);
                    return (
                      <tr key={booking.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{booking.full_name}</div>
                            <div className="text-sm text-gray-500 flex items-center space-x-1 mt-1">
                              <Mail className="w-3 h-3" />
                              <span>{booking.email}</span>
                            </div>
                            <div className="text-sm text-gray-500 flex items-center space-x-1 mt-1">
                              <Phone className="w-3 h-3" />
                              <span>{booking.phone}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{booking.department}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {booking.doctor_name || 'Chưa chỉ định'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-1 text-sm text-gray-900">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {new Date(booking.appointment_date).toLocaleDateString('vi-VN')}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500">{booking.appointment_time}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                              booking.status
                            )}`}
                          >
                            <StatusIcon className="w-3 h-3" />
                            <span>
                              {booking.status === 'pending'
                                ? 'Đang chờ'
                                : booking.status === 'confirmed'
                                ? 'Đã xác nhận'
                                : booking.status === 'completed'
                                ? 'Đã hoàn thành'
                                : 'Đã hủy'}
                            </span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            {booking.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleStatusChange(booking.id, 'confirmed')}
                                  className="text-green-600 hover:text-green-900"
                                >
                                  Xác nhận
                                </button>
                                <button
                                  onClick={() => handleStatusChange(booking.id, 'cancelled')}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Hủy
                                </button>
                              </>
                            )}
                            {booking.status === 'confirmed' && (
                              <button
                                onClick={() => handleStatusChange(booking.id, 'completed')}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                Hoàn thành
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

