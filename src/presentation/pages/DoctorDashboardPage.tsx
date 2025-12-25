import { useState, useEffect } from 'react';
import { Calendar, Clock, User, Bell, BarChart3, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { doctorService, type PatientBooking } from '../../infrastructure/doctor/doctorService';
import { useToast } from '../contexts/ToastContext';

interface DoctorDashboardPageProps {
  user: any;
}

export const DoctorDashboardPage = ({ user }: DoctorDashboardPageProps) => {
  const { showToast } = useToast();
  const [todayBookings, setTodayBookings] = useState<PatientBooking[]>([]);
  const [upcomingBookings, setUpcomingBookings] = useState<PatientBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    waiting: 0,
    late: 0,
  });

  const doctorName = user?.fullname || user?.user_metadata?.full_name || user?.name || '';

  useEffect(() => {
    if (doctorName) {
      loadTodayBookings();
    }
  }, [doctorName]);

  const loadTodayBookings = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const result = await doctorService.getDoctorBookings(doctorName, {
        dateFrom: today,
        dateTo: today,
      });

      const bookings = result.bookings || [];
      setTodayBookings(bookings);

      // Tính toán thống kê
      const waiting = bookings.filter(b => b.status === 'pending' || b.status === 'confirmed').length;
      const now = new Date();
      const late = bookings.filter(b => {
        if (b.status === 'completed' || b.status === 'cancelled' || b.status === 'canceled') return false;
        const appointmentTime = new Date(`${b.appointment_date} ${b.appointment_time}`);
        return appointmentTime < now;
      }).length;

      setStats({
        total: bookings.length,
        waiting,
        late,
      });

      // Lấy bệnh nhân sắp tới (30-60 phút)
      const upcoming = bookings
        .filter(b => {
          if (b.status === 'completed' || b.status === 'cancelled' || b.status === 'canceled') return false;
          const appointmentTime = new Date(`${b.appointment_date} ${b.appointment_time}`);
          const diffMinutes = (appointmentTime.getTime() - now.getTime()) / (1000 * 60);
          return diffMinutes >= 30 && diffMinutes <= 60;
        })
        .sort((a, b) => {
          const timeA = new Date(`${a.appointment_date} ${a.appointment_time}`).getTime();
          const timeB = new Date(`${b.appointment_date} ${b.appointment_time}`).getTime();
          return timeA - timeB;
        });

      setUpcomingBookings(upcoming);
    } catch (err: any) {
      showToast(err.message || 'Không thể tải lịch hẹn', 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    // Convert 24h format to 12h if needed
    return time;
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Chờ khám';
      case 'confirmed':
        return 'Đã xác nhận';
      case 'completed':
        return 'Đã hoàn thành';
      case 'cancelled':
      case 'canceled':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-gray-600';
      case 'confirmed':
        return 'text-blue-600';
      case 'completed':
        return 'text-green-600';
      case 'cancelled':
      case 'canceled':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const handleBookingClick = (booking: PatientBooking) => {
    window.location.href = `/booking/${booking.submission_id || booking.id}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const today = new Date();
  const todayFormatted = formatDate(today.toISOString().split('T')[0]);

  // Sắp xếp lịch hôm nay theo giờ
  const sortedTodayBookings = [...todayBookings].sort((a, b) => {
    const timeA = a.appointment_time || '';
    const timeB = b.appointment_time || '';
    return timeA.localeCompare(timeB);
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <div className="flex items-center space-x-2 text-gray-600">
            <Calendar className="w-5 h-5" />
            <span className="text-lg">Hôm nay | {todayFormatted}</span>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Tổng lịch khám</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <BarChart3 className="w-12 h-12 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Đang chờ</p>
                <p className="text-3xl font-bold text-gray-900">{stats.waiting}</p>
              </div>
              <Clock className="w-12 h-12 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Trễ</p>
                <p className="text-3xl font-bold text-gray-900">{stats.late}</p>
              </div>
              <AlertCircle className="w-12 h-12 text-red-500" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bệnh nhân sắp tới */}
          {upcomingBookings.length > 0 && (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Bell className="w-5 h-5 text-orange-500" />
                  <h2 className="text-xl font-bold text-gray-900">Bệnh nhân sắp tới</h2>
                </div>
                <div className="space-y-3">
                  {upcomingBookings.slice(0, 5).map((booking) => (
                    <div
                      key={booking.id}
                      className="p-3 bg-orange-50 border border-orange-200 rounded-lg cursor-pointer hover:bg-orange-100 transition"
                      onClick={() => handleBookingClick(booking)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">{booking.full_name || booking.fullname}</p>
                          <p className="text-sm text-gray-600">{formatTime(booking.appointment_time)}</p>
                        </div>
                        <Clock className="w-5 h-5 text-orange-500" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Lịch hôm nay */}
          <div className={upcomingBookings.length > 0 ? 'lg:col-span-2' : 'lg:col-span-3'}>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center space-x-2 mb-6">
                <Calendar className="w-5 h-5 text-blue-500" />
                <h2 className="text-xl font-bold text-gray-900">Lịch hôm nay</h2>
              </div>

              {sortedTodayBookings.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Không có lịch hẹn nào hôm nay</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sortedTodayBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition"
                      onClick={() => handleBookingClick(booking)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 flex-1">
                          <div className="text-lg font-semibold text-blue-600 min-w-[80px]">
                            {formatTime(booking.appointment_time)}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">
                              {booking.full_name || booking.fullname}
                            </p>
                            {booking.phone && (
                              <p className="text-sm text-gray-600">{booking.phone}</p>
                            )}
                          </div>
                          <div className={`font-medium ${getStatusColor(booking.status)}`}>
                            {getStatusText(booking.status)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
