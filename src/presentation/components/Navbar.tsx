import { Home, Calendar, User, Activity, BarChart3, Users, Clock, Search, FileText, Settings as SettingsIcon } from 'lucide-react';
import { authService } from '../../infrastructure/auth/authService';
import { useToast } from '../contexts/ToastContext';

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  user: any;
  userRole?: string | null;
  onSignOutSuccess?: () => void;
}

export const Navbar = ({ currentPage, onNavigate, user, userRole, onSignOutSuccess }: NavbarProps) => {
  const { showToast } = useToast();
  const handleSignOut = async () => {
    try {
      await authService.signOut();
      showToast('Đăng xuất thành công!', 'success');
      // Refresh auth state immediately after successful signout
      if (onSignOutSuccess) {
        await onSignOutSuccess();
      }
      // Redirect về trang home sau khi đăng xuất
      onNavigate('home');
    } catch (error: any) {
      showToast(error.message || 'Đăng xuất thất bại', 'error');
    }
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2">
            <Activity className="w-8 h-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-800">HealthCare Plus</span>
          </div>

          <div className="flex items-center space-x-6">
            {/* Admin chỉ thấy các trang quản lý */}
            {userRole === 'admin' ? (
              <>
            <button
              onClick={() => onNavigate('home')}
              className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition ${
                currentPage === 'home' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              <Home className="w-5 h-5" />
              <span className="font-medium">Home</span>
            </button>
                <button
                  onClick={() => onNavigate('dashboard')}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition ${
                    currentPage === 'dashboard' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-blue-600'
                  }`}
                >
                  <BarChart3 className="w-5 h-5" />
                  <span className="font-medium">Thống Kê</span>
                </button>
                <button
                  onClick={() => onNavigate('patients')}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition ${
                    currentPage === 'patients' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-blue-600'
                  }`}
                >
                  <Users className="w-5 h-5" />
                  <span className="font-medium">Bệnh Nhân</span>
                </button>
                {user && (
                  <button
                    onClick={() => onNavigate('profile')}
                    className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition ${
                      currentPage === 'profile' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-blue-600'
                    }`}
                  >
                    <User className="w-5 h-5" />
                    <span className="font-medium">Profile</span>
                  </button>
                )}
              </>
            ) : (
              <>
                {userRole === 'doctor' ? (
                  <>
                    {/* Menu tối giản cho Doctor - chỉ giữ các menu chính */}
                    <button
                      onClick={() => onNavigate('doctor-dashboard')}
                      className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition ${
                        currentPage === 'doctor-dashboard' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-blue-600'
                      }`}
                    >
                      <BarChart3 className="w-5 h-5" />
                      <span className="font-medium">Dashboard</span>
                    </button>
                    <button
                      onClick={() => onNavigate('schedule')}
                      className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition ${
                        currentPage === 'schedule' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-blue-600'
                      }`}
                    >
                      <Calendar className="w-5 h-5" />
                      <span className="font-medium">Lịch Khám</span>
                    </button>
                    <button
                      onClick={() => onNavigate('doctor-patients')}
                      className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition ${
                        currentPage === 'doctor-patients' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-blue-600'
                      }`}
                    >
                      <Users className="w-5 h-5" />
                      <span className="font-medium">Bệnh Nhân</span>
                    </button>
                    <button
                      onClick={() => onNavigate('doctor-records')}
                      className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition ${
                        currentPage === 'doctor-records' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-blue-600'
                      }`}
                    >
                      <FileText className="w-5 h-5" />
                      <span className="font-medium">Hồ Sơ</span>
                    </button>
                    {user && (
                      <button
                        onClick={() => onNavigate('profile')}
                        className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition ${
                          currentPage === 'profile' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-blue-600'
                        }`}
                      >
                        <User className="w-5 h-5" />
                        <span className="font-medium">Profile</span>
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    {/* Patient menu - giữ nguyên */}
                    <button
                      onClick={() => onNavigate('home')}
                      className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition ${
                        currentPage === 'home' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-blue-600'
                      }`}
                    >
                      <Home className="w-5 h-5" />
                      <span className="font-medium">Home</span>
                    </button>

                    <button
                      onClick={() => onNavigate('lookup')}
                      className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition ${
                        currentPage === 'lookup' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-blue-600'
                      }`}
                    >
                      <Search className="w-5 h-5" />
                      <span className="font-medium">Tra Cứu</span>
                    </button>

                    <button
                      onClick={() => onNavigate('booking')}
                      className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition ${
                        currentPage === 'booking' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-blue-600'
                      }`}
                    >
                      <Calendar className="w-5 h-5" />
                      <span className="font-medium">Booking</span>
                    </button>

                    {user && (
                      <button
                        onClick={() => onNavigate('profile')}
                        className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition ${
                          currentPage === 'profile' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-blue-600'
                        }`}
                      >
                        <User className="w-5 h-5" />
                        <span className="font-medium">Profile</span>
                      </button>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
