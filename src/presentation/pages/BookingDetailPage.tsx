import { useState, useEffect } from 'react';
import { Calendar, Clock, User, Phone, Mail, Building2, Stethoscope, XCircle, CheckCircle, AlertCircle, ArrowLeft, Trash2 } from 'lucide-react';
import { bookingService } from '../../infrastructure/booking/bookingService';
import { useToast } from '../contexts/ToastContext';
import type { Booking } from '../../shared/types';

interface BookingDetailPageProps {
  bookingId?: string;
}

export const BookingDetailPage = ({ bookingId }: BookingDetailPageProps) => {
  const navigate = (path: string) => {
    window.location.href = path;
  };
  const { showToast } = useToast();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [currentBookingId, setCurrentBookingId] = useState<string>('');

  useEffect(() => {
    // Get booking ID from URL or props
    const path = window.location.pathname;
    let idToUse = bookingId;
    
    if (!idToUse && path.includes('/booking/')) {
      // Extract ID from URL: /booking/{id} or /booking/{id}/cancel
      const match = path.match(/\/booking\/([^\/]+)/);
      if (match) {
        idToUse = match[1];
      }
    }
    
    if (idToUse) {
      setCurrentBookingId(idToUse);
      loadBooking(idToUse);
    } else {
      showToast('Không tìm thấy mã đặt lịch', 'error');
      setTimeout(() => navigate('/lookup'), 2000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadBooking = async (id: string) => {
    setLoading(true);
    try {
      const bookingData = await bookingService.getBookingById(id);
      setBooking(bookingData);
    } catch (err: any) {
      showToast(err.message || 'Không tìm thấy thông tin đặt lịch', 'error');
      setTimeout(() => navigate('/lookup'), 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!booking) return;
    
    if (!window.confirm('Bạn có chắc chắn muốn hủy lịch hẹn này?')) {
      return;
    }

    setCancelling(true);
    try {
      await bookingService.cancelBooking(booking.id);
      showToast('Hủy lịch hẹn thành công!', 'success');
      // Reload booking để cập nhật status
      if (currentBookingId) {
        await loadBooking(currentBookingId);
      }
    } catch (err: any) {
      showToast(err.message || 'Hủy lịch hẹn thất bại', 'error');
    } finally {
      setCancelling(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Đã xác nhận';
      case 'pending':
        return 'Chờ xác nhận';
      case 'cancelled':
        return 'Đã hủy';
      case 'completed':
        return 'Hoàn thành';
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return CheckCircle;
      case 'pending':
        return AlertCircle;
      case 'cancelled':
        return XCircle;
      case 'completed':
        return CheckCircle;
      default:
        return AlertCircle;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('vi-VN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải thông tin đặt lịch...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Không tìm thấy thông tin đặt lịch</p>
          <button
            onClick={() => navigate('/lookup')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Quay lại tra cứu
          </button>
        </div>
      </div>
    );
  }

  const StatusIcon = getStatusIcon(booking.status);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Quay lại</span>
        </button>

        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Chi Tiết Đặt Lịch</h1>
                {booking.submission_id && (
                  <p className="text-blue-100">
                    Mã đặt lịch: <span className="font-mono font-semibold">{booking.submission_id}</span>
                  </p>
                )}
              </div>
              <div className={`px-4 py-2 rounded-lg border-2 flex items-center space-x-2 ${getStatusColor(booking.status)}`}>
                <StatusIcon className="w-5 h-5" />
                <span className="font-semibold">{getStatusText(booking.status)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Booking Details */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Thông Tin Đặt Lịch</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Patient Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <User className="w-5 h-5 text-blue-600" />
                <span>Thông tin bệnh nhân</span>
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <User className="w-5 h-5 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-600">Họ và tên</p>
                    <p className="font-semibold text-gray-900">{booking.fullname || 'N/A'}</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Phone className="w-5 h-5 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-600">Số điện thoại</p>
                    <p className="font-semibold text-gray-900">{booking.phone || 'N/A'}</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Mail className="w-5 h-5 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-semibold text-gray-900">{booking.email || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Appointment Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <span>Thông tin lịch hẹn</span>
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <Calendar className="w-5 h-5 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-600">Ngày khám</p>
                    <p className="font-semibold text-gray-900">{formatDate(booking.appointment_date)}</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Clock className="w-5 h-5 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-600">Giờ khám</p>
                    <p className="font-semibold text-gray-900">{booking.appointment_time || 'N/A'}</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Building2 className="w-5 h-5 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-600">Khoa</p>
                    <p className="font-semibold text-gray-900">{booking.department || 'N/A'}</p>
                  </div>
                </div>
                
                {booking.doctor_name && (
                  <div className="flex items-start space-x-3">
                    <Stethoscope className="w-5 h-5 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-600">Bác sĩ</p>
                      <p className="font-semibold text-gray-900">{booking.doctor_name}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Additional Information */}
          {(booking.reason || booking.notes) && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin bổ sung</h3>
              <div className="space-y-3">
                {booking.reason && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Lý do khám</p>
                    <p className="text-gray-900">{booking.reason}</p>
                  </div>
                )}
                {booking.notes && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Ghi chú</p>
                    <p className="text-gray-900">{booking.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Medical Record (if available) */}
          {booking.medical_record && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Stethoscope className="w-5 h-5 text-green-600" />
                <span>Hồ sơ bệnh án</span>
              </h3>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-gray-900 whitespace-pre-wrap">{booking.medical_record}</p>
              </div>
            </div>
          )}
        </div>

        {/* Actions - Chỉ hiển thị khi chưa hủy và chưa hoàn thành */}
        {booking.status !== 'cancelled' && booking.status !== 'canceled' && booking.status !== 'completed' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Thao tác</h3>
                <p className="text-sm text-gray-600">
                  Bạn có thể hủy lịch hẹn hoặc check-in khi đến phòng khám
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <a
                  href={`/check-in/${booking.submission_id || booking.id}`}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  Check-in
                </a>
                {(booking.status === 'pending' || booking.status === 'confirmed') && (
                  <button
                    onClick={handleCancel}
                    disabled={cancelling}
                    className="px-6 py-3 border-2 border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    <Trash2 className="w-5 h-5" />
                    <span>{cancelling ? 'Đang hủy...' : 'Hủy lịch hẹn'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
