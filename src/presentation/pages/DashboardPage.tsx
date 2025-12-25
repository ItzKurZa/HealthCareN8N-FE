import { useState, useEffect } from 'react';
import { BarChart3, Users, Calendar, CheckCircle, XCircle, Clock, TrendingUp } from 'lucide-react';
import { adminService, type Statistics } from '../../infrastructure/admin/adminService';
import { authService } from '../../infrastructure/auth/authService';
import { useToast } from '../contexts/ToastContext';

interface DashboardPageProps {
  user: any;
}

export const DashboardPage = ({ user }: DashboardPageProps) => {
  const { showToast } = useToast();
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    loadStatistics();
    loadUserProfile();
  }, []);
  
  const loadUserProfile = async () => {
    try {
      const profile = await authService.getCurrentUser();
      if (profile) {
        setUserProfile(profile);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const loadStatistics = async () => {
    setLoading(true);
    setError('');
    try {
      const stats = await adminService.getStatistics();
      setStatistics(stats);
    } catch (err: any) {
      const errorMsg = err.message || 'Không thể tải thống kê';
      setError(errorMsg);
      showToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading statistics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadStatistics}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!statistics) {
    return null;
  }

  const statCards = [
    {
      title: 'Tổng số bệnh nhân',
      value: statistics.totalPatients,
      icon: Users,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Tổng số lịch hẹn',
      value: statistics.totalBookings,
      icon: Calendar,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Đang chờ xử lý',
      value: statistics.pendingBookings,
      icon: Clock,
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-50',
    },
    {
      title: 'Đã xác nhận',
      value: statistics.confirmedBookings,
      icon: CheckCircle,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Đã hoàn thành',
      value: statistics.completedBookings,
      icon: TrendingUp,
      color: 'bg-indigo-500',
      bgColor: 'bg-indigo-50',
    },
    {
      title: 'Đã hủy',
      value: statistics.cancelledBookings,
      icon: XCircle,
      color: 'bg-red-500',
      bgColor: 'bg-red-50',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3">
            <BarChart3 className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Bảng Thống Kê</h1>
            </div>
            {userProfile && (
              <div className="text-right">
                <p className="text-sm text-gray-600">Xin chào,</p>
                <p className="text-lg font-semibold text-gray-900">
                  {userProfile.fullname || userProfile.email?.split('@')[0] || 'Admin'}
                </p>
              </div>
            )}
          </div>
          <p className="text-gray-600">Tổng quan về hoạt động của hệ thống</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {statCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium mb-1">{card.title}</p>
                    <p className="text-3xl font-bold text-gray-900">{card.value}</p>
                  </div>
                  <div className={`${card.bgColor} p-4 rounded-lg`}>
                    <Icon className={`w-8 h-8 ${card.color}`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Lịch hẹn theo khoa</h2>
            {statistics.bookingsByDepartment.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Chưa có dữ liệu</p>
            ) : (
              <div className="space-y-4">
                {statistics.bookingsByDepartment.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-gray-700 font-medium">{item.department}</span>
                    <div className="flex items-center space-x-3">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${(item.count / statistics.totalBookings) * 100}%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-gray-900 font-bold w-12 text-right">{item.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Lịch hẹn theo ngày</h2>
            {statistics.bookingsByDate.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Chưa có dữ liệu</p>
            ) : (
              <div className="space-y-4">
                {statistics.bookingsByDate.slice(0, 7).map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-gray-700 font-medium">
                      {new Date(item.date).toLocaleDateString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </span>
                    <div className="flex items-center space-x-3">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{
                            width: `${(item.count / Math.max(...statistics.bookingsByDate.map((d) => d.count))) * 100}%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-gray-900 font-bold w-12 text-right">{item.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

