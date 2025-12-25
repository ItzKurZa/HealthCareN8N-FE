import { 
  Home, Calendar, User, Activity, BarChart3, 
  Users, Search, FileText, LogOut, 
  PieChart 
} from 'lucide-react';
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
      if (onSignOutSuccess) {
        await onSignOutSuccess();
      }
      onNavigate('home');
    } catch (error: any) {
      showToast(error.message || 'Đăng xuất thất bại', 'error');
    }
  };

  // Helper: CHỈ render link thống kê, link form khảo sát đã bị ẩn đi
  const renderCSKHLinks = () => (
    <>
      <button
        onClick={() => onNavigate('cskh-dashboard')}
        className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition ${
          currentPage === 'cskh-dashboard' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-blue-600'
        }`}
      >
        <PieChart className="w-5 h-5" />
        <span className="font-medium">Thống kê CSKH</span>
      </button>
    </>
  );

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2">
            <Activity className="w-8 h-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-800">HealthCare Plus</span>
          </div>

          <div className="flex items-center space-x-6">
            {/* 1. Menu dành cho ADMIN */}
            {userRole === 'admin' && (
              <>
                {/* Admin xem được thống kê CSKH */}
                {renderCSKHLinks()}
                
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
                    onClick={handleSignOut}
                    className="flex items-center space-x-1 px-3 py-2 rounded-lg transition text-gray-600 hover:text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Đăng xuất</span>
                  </button>
                )}
              </>
            )}

            {/* 2. Menu dành cho NHÂN VIÊN CSKH (Role: cskh) */}
            {userRole === 'cskh' && (
              <>
                {renderCSKHLinks()}

                {user && (
                  <button
                    onClick={handleSignOut}
                    className="flex items-center space-x-1 px-3 py-2 rounded-lg transition text-gray-600 hover:text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Đăng xuất</span>
                  </button>
                )}
              </>
            )}

            {/* 3. Menu dành cho BÁC SĨ (Role: doctor) */}
            {userRole === 'doctor' && (
              <>
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
            )}

            {/* 4. Menu dành cho BỆNH NHÂN (Mặc định) */}
            {/* LƯU Ý: Không hiển thị link 'cskh' ở đây */}
            {userRole !== 'admin' && userRole !== 'doctor' && userRole !== 'cskh' && (
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
          </div>
        </div>
      </div>
    </nav>
  );
};