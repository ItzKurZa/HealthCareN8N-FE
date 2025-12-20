import { useState, useEffect } from 'react';
import { Calendar, Clock, User, Phone, Mail, CheckCircle, XCircle, Settings, FileText, X } from 'lucide-react';
import { doctorService, type PatientBooking } from '../../infrastructure/doctor/doctorService';
import { useToast } from '../contexts/ToastContext';

interface SchedulePageProps {
  user: any;
}

export const SchedulePage = ({ user }: SchedulePageProps) => {
  const { showToast } = useToast();
  const [bookings, setBookings] = useState<PatientBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  
  // Medical record state
  const [showMedicalRecordModal, setShowMedicalRecordModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<PatientBooking | null>(null);
  const [medicalRecord, setMedicalRecord] = useState('');
  const [savingRecord, setSavingRecord] = useState(false);

  // Lấy tên bác sĩ từ user (giả sử có trong user object)
  const doctorName = user?.fullname || user?.user_metadata?.full_name || user?.name || '';

  useEffect(() => {
    if (doctorName) {
      loadBookings();
    } else {
      setError('Không tìm thấy tên bác sĩ. Vui lòng kiểm tra thông tin tài khoản.');
      setLoading(false);
    }
  }, [doctorName, statusFilter, dateFilter]);

  const loadBookings = async () => {
    setLoading(true);
    setError('');
    try {
      const filters: any = {};
      if (statusFilter !== 'all') {
        filters.status = statusFilter;
      }
      if (dateFilter) {
        filters.dateFrom = dateFilter;
        filters.dateTo = dateFilter;
      }
      const result = await doctorService.getDoctorBookings(doctorName, filters);
      // getDoctorBookings trả về { bookings, pagination }
      setBookings(result.bookings || []);
    } catch (err: any) {
      const errorMsg = err.message || 'Không thể tải lịch hẹn';
      setError(errorMsg);
      showToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (bookingId: string, newStatus: PatientBooking['status']) => {
    try {
      await doctorService.updateBookingStatus(bookingId, newStatus);
      setBookings(
        bookings.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
      );
      const statusMessages: Record<string, string> = {
        confirmed: 'Xác nhận lịch hẹn thành công!',
        cancelled: 'Hủy lịch hẹn thành công!',
        completed: 'Hoàn thành lịch hẹn thành công!',
      };
      showToast(statusMessages[newStatus] || 'Cập nhật trạng thái thành công!', 'success');
      loadBookings(); // Reload để lấy dữ liệu mới nhất
    } catch (err: any) {
      const errorMsg = err.message || 'Cập nhật trạng thái thất bại';
      setError(errorMsg);
      showToast(errorMsg, 'error');
    }
  };

  const handleOpenMedicalRecord = (booking: PatientBooking) => {
    setSelectedBooking(booking);
    setMedicalRecord(booking.medical_record || '');
    setShowMedicalRecordModal(true);
  };

  const handleSaveMedicalRecord = async () => {
    if (!selectedBooking) return;

    setSavingRecord(true);
    try {
      await doctorService.updateBookingStatus(selectedBooking.id, undefined, medicalRecord);
      setBookings(
        bookings.map((b) => 
          b.id === selectedBooking.id 
            ? { ...b, medical_record: medicalRecord } 
            : b
        )
      );
      showToast('Ghi hồ sơ bệnh án thành công!', 'success');
      setShowMedicalRecordModal(false);
      loadBookings(); // Reload để lấy dữ liệu mới nhất
    } catch (err: any) {
      showToast(err.message || 'Ghi hồ sơ bệnh án thất bại', 'error');
    } finally {
      setSavingRecord(false);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Nhóm bookings theo ngày
  const groupedBookings = bookings.reduce((acc, booking) => {
    const date = booking.appointment_date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(booking);
    return acc;
  }, {} as Record<string, PatientBooking[]>);

  const sortedDates = Object.keys(groupedBookings).sort();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải lịch hẹn...</p>
        </div>
      </div>
    );
  }

  if (!doctorName) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 flex items-center justify-center">
        <div className="text-center max-w-md">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Không tìm thấy thông tin bác sĩ</h2>
          <p className="text-gray-600 mb-4">
            Vui lòng kiểm tra lại thông tin tài khoản hoặc liên hệ quản trị viên.
          </p>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <Calendar className="w-8 h-8 text-blue-600" />
                <h1 className="text-3xl font-bold text-gray-900">Quản Lý Lịch Hẹn</h1>
              </div>
              <p className="text-gray-600">Quản lý lịch hẹn của bác sĩ {doctorName}</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Lọc theo trạng thái</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="pending">Đang chờ</option>
                <option value="confirmed">Đã xác nhận</option>
                <option value="completed">Đã hoàn thành</option>
                <option value="cancelled">Đã hủy</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Lọc theo ngày</label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {bookings.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Không có lịch hẹn nào</p>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedDates.map((date) => (
              <div key={date} className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5 text-white" />
                    <h2 className="text-xl font-bold text-white">{formatDate(date)}</h2>
                    <span className="text-blue-100 text-sm ml-2">
                      ({groupedBookings[date].length} lịch hẹn)
                    </span>
                  </div>
                </div>

                <div className="p-6">
                  <div className="space-y-4">
                    {groupedBookings[date]
                      .sort((a, b) => a.appointment_time.localeCompare(b.appointment_time))
                      .map((booking) => {
                        const StatusIcon = getStatusIcon(booking.status);
                        return (
                          <div
                            key={booking.id}
                            className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-3">
                                  <div className="flex items-center space-x-2">
                                    <Clock className="w-5 h-5 text-blue-600" />
                                    <span className="text-lg font-semibold text-gray-900">
                                      {booking.appointment_time}
                                    </span>
                                  </div>
                                  <span
                                    className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
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
                                </div>

                                <div className="space-y-2">
                                  <div className="flex items-center space-x-2">
                                    <User className="w-4 h-4 text-gray-400" />
                                    <span className="text-gray-900 font-medium">{booking.full_name}</span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Mail className="w-4 h-4 text-gray-400" />
                                    <span className="text-gray-600 text-sm">{booking.email}</span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Phone className="w-4 h-4 text-gray-400" />
                                    <span className="text-gray-600 text-sm">{booking.phone}</span>
                                  </div>
                                  <div className="mt-3">
                                    <p className="text-sm text-gray-600">
                                      <span className="font-medium">Khoa:</span> {booking.department}
                                    </p>
                                    {booking.reason && (
                                      <p className="text-sm text-gray-600 mt-1">
                                        <span className="font-medium">Lý do:</span> {booking.reason}
                                      </p>
                                    )}
                                    {booking.notes && (
                                      <p className="text-sm text-gray-600 mt-1">
                                        <span className="font-medium">Ghi chú:</span> {booking.notes}
                                      </p>
                                    )}
                                    {booking.medical_record && (
                                      <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                        <p className="text-sm font-medium text-blue-900 mb-1">Hồ sơ bệnh án:</p>
                                        <p className="text-sm text-blue-800 whitespace-pre-wrap">{booking.medical_record}</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="ml-4 flex flex-col space-y-2">
                                {/* Nút ghi hồ sơ bệnh án - chỉ hiện khi đã confirmed hoặc completed */}
                                {(booking.status === 'confirmed' || booking.status === 'completed') && (
                                  <button
                                    onClick={() => handleOpenMedicalRecord(booking)}
                                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm font-medium flex items-center justify-center space-x-1"
                                  >
                                    <FileText className="w-4 h-4" />
                                    <span>{booking.medical_record ? 'Sửa hồ sơ' : 'Ghi hồ sơ'}</span>
                                  </button>
                                )}
                                {booking.status === 'pending' && (
                                  <>
                                    <button
                                      onClick={() => handleStatusChange(booking.id, 'confirmed')}
                                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
                                    >
                                      Xác nhận
                                    </button>
                                  </>
                                )}
                                {booking.status === 'confirmed' && (
                                  <button
                                    onClick={() => handleStatusChange(booking.id, 'completed')}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                                  >
                                    Hoàn thành
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal ghi hồ sơ bệnh án */}
      {showMedicalRecordModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FileText className="w-6 h-6 text-purple-600" />
                <h2 className="text-xl font-bold text-gray-900">Ghi hồ sơ bệnh án</h2>
              </div>
              <button
                onClick={() => setShowMedicalRecordModal(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Bệnh nhân</p>
                <p className="font-semibold text-gray-900">{selectedBooking.full_name}</p>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedBooking.appointment_date} - {selectedBooking.appointment_time}
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hồ sơ bệnh án *
                </label>
                <textarea
                  value={medicalRecord}
                  onChange={(e) => setMedicalRecord(e.target.value)}
                  placeholder="Nhập thông tin khám bệnh, chẩn đoán, đơn thuốc, hướng dẫn điều trị..."
                  rows={10}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Ghi chú: Hồ sơ bệnh án sẽ được lưu trữ và có thể xem lại sau.
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowMedicalRecordModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSaveMedicalRecord}
                  disabled={savingRecord || !medicalRecord.trim()}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {savingRecord ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      <span>Lưu hồ sơ</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

