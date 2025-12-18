import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Calendar, Clock, User, Phone, Mail, Building2, Stethoscope, Loader2 } from 'lucide-react';
import { bookingService } from '../../infrastructure/booking/bookingService';
import { useToast } from '../contexts/ToastContext';
import type { Booking } from '../../shared/types';

export const CheckInPage = () => {
  const { showToast } = useToast();
  // Extract booking ID from URL path
  const bookingId = window.location.pathname.split('/check-in/')[1]?.split('?')[0] || 
                    new URLSearchParams(window.location.search).get('id');
  
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [alreadyCheckedIn, setAlreadyCheckedIn] = useState(false);

  useEffect(() => {
    if (bookingId) {
      loadBooking();
    } else {
      setError('Không tìm thấy mã đặt lịch');
      setLoading(false);
    }
  }, [bookingId]);

  const loadBooking = async () => {
    try {
      setLoading(true);
      setError('');
      const bookingData = await bookingService.getBookingById(bookingId!);
      setBooking(bookingData);
      
      // Kiểm tra xem đã check-in chưa (nếu có field checked_in_at hoặc status là checked_in)
      if (bookingData.status === 'checked_in' || (bookingData as any).checked_in_at) {
        setAlreadyCheckedIn(true);
      }
    } catch (err: any) {
      setError(err.message || 'Không tìm thấy đặt lịch');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!bookingId) return;
    
    try {
      setCheckingIn(true);
      setError('');
      const updatedBooking = await bookingService.checkInBooking(bookingId);
      setBooking(updatedBooking);
      setSuccess(true);
      setAlreadyCheckedIn(true);
      showToast('Check-in thành công!', 'success');
    } catch (err: any) {
      const errorMsg = err.message || 'Check-in thất bại. Vui lòng thử lại.';
      setError(errorMsg);
      showToast(errorMsg, 'error');
    } finally {
      setCheckingIn(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md w-full">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Đang tải thông tin đặt lịch...</p>
        </div>
      </div>
    );
  }

  if (error && !booking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md w-full">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Lỗi</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.href = '/'}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  if (!booking) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Check-in Phòng Khám</h1>
          <p className="text-gray-600">Vui lòng xác nhận thông tin đặt lịch của bạn</p>
        </div>

        {/* Booking Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
          {/* Status Banner */}
          {success || alreadyCheckedIn ? (
            <div className="bg-green-500 text-white p-4 text-center">
              <CheckCircle className="h-8 w-8 mx-auto mb-2" />
              <p className="font-semibold">
                {success ? 'Check-in thành công!' : 'Đã được check-in trước đó'}
              </p>
            </div>
          ) : (
            <div className="bg-blue-600 text-white p-4 text-center">
              <p className="font-semibold">Sẵn sàng check-in</p>
            </div>
          )}

          <div className="p-6">
            {/* Booking Info */}
            <div className="space-y-4 mb-6">
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-blue-600 mt-1" />
                <div>
                  <p className="text-sm text-gray-500">Họ và tên</p>
                  <p className="font-semibold text-gray-800">{booking.full_name}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-blue-600 mt-1" />
                <div>
                  <p className="text-sm text-gray-500">Số điện thoại</p>
                  <p className="font-semibold text-gray-800">{booking.phone || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-blue-600 mt-1" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-semibold text-gray-800">{booking.email || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-blue-600 mt-1" />
                <div>
                  <p className="text-sm text-gray-500">Ngày khám</p>
                  <p className="font-semibold text-gray-800">{booking.appointment_date || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-blue-600 mt-1" />
                <div>
                  <p className="text-sm text-gray-500">Giờ khám</p>
                  <p className="font-semibold text-gray-800">{booking.appointment_time || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Building2 className="h-5 w-5 text-blue-600 mt-1" />
                <div>
                  <p className="text-sm text-gray-500">Khoa</p>
                  <p className="font-semibold text-gray-800">{booking.department || 'N/A'}</p>
                </div>
              </div>

              {booking.doctor_name && (
                <div className="flex items-start gap-3">
                  <Stethoscope className="h-5 w-5 text-blue-600 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Bác sĩ</p>
                    <p className="font-semibold text-gray-800">{booking.doctor_name}</p>
                  </div>
                </div>
              )}

              {booking.reason && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500 mb-1">Lý do khám</p>
                  <p className="text-gray-800">{booking.reason}</p>
                </div>
              )}
            </div>

            {/* Booking ID */}
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-500 mb-1">Mã đặt lịch</p>
              <p className="font-mono text-lg font-bold text-blue-600">{booking.submission_id || booking.id}</p>
            </div>

            {/* Check-in Info */}
            {!success && !alreadyCheckedIn && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-yellow-800">
                  <strong>Lưu ý:</strong> Bạn chỉ có thể check-in trước giờ khám 15 phút. Nếu quá sớm hoặc quá muộn, hệ thống sẽ thông báo lỗi.
                </p>
              </div>
            )}

            {/* Check-in Button */}
            {!success && !alreadyCheckedIn && (
              <button
                onClick={handleCheckIn}
                disabled={checkingIn}
                className="w-full py-4 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {checkingIn ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  'Xác nhận Check-in'
                )}
              </button>
            )}

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <button
            onClick={() => window.location.href = '/'}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Về trang chủ
          </button>
        </div>
      </div>
    </div>
  );
};
