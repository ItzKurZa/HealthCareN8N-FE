import { useState, useEffect } from 'react';
import { useAuth } from './presentation/hooks/useAuth';
import { Navbar } from './presentation/components/Navbar';
import { AuthModal } from './presentation/components/AuthModal';
import { HomePage } from './presentation/pages/HomePage';
import { AboutPage } from './presentation/pages/AboutPage';
import { BookingPage } from './presentation/pages/BookingPage';
import { ProfilePage } from './presentation/pages/ProfilePage';
import { GlobalLoading } from './presentation/components/GlobalLoading';
import { DashboardPage } from './presentation/pages/DashboardPage';
import { PatientsPage } from './presentation/pages/PatientsPage';
import { SchedulePage } from './presentation/pages/SchedulePage';
import { CheckInPage } from './presentation/pages/CheckInPage';
import { LookupPage } from './presentation/pages/LookupPage';
import { BookingDetailPage } from './presentation/pages/BookingDetailPage';
import { DoctorDashboardPage } from './presentation/pages/DoctorDashboardPage';
import { DoctorClinicalPage } from './presentation/pages/DoctorClinicalPage';
import { DoctorPatientsPage } from './presentation/pages/DoctorPatientsPage';
import { DoctorRecordsPage } from './presentation/pages/DoctorRecordsPage';
import { DoctorSchedulePage } from './presentation/pages/DoctorSchedulePage';
import { ToastContainer } from './presentation/components/ToastContainer';
import { useToast } from './presentation/contexts/ToastContext';

// --- Import 2 trang mới từ src1 ---
import { CustomerCarePage } from './presentation/pages/CustomerCarePage';
import { CSKHDashboardPage } from './presentation/pages/CSKHDashboardPage';

function App() {
  const { user, loading, refreshUser } = useAuth();
  const { toasts, removeToast, showToast } = useToast();
  const [currentPage, setCurrentPage] = useState('home');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isCheckInPage, setIsCheckInPage] = useState(false);

  // 1. Xử lý URL (Deep Linking)
  useEffect(() => {
    const path = window.location.pathname;
    
    // ƯU TIÊN: Link khảo sát công khai (Ví dụ: /survey/123)
    if (path.includes('/survey/')) {
      setCurrentPage('cskh');
    } 
    // Các trang full màn hình khác
    else if (path.includes('/check-in/')) {
      setIsCheckInPage(true);
      setCurrentPage('check-in');
    } else if (path.includes('/booking/')) {
      const bookingId = path.split('/booking/')[1]?.split('/')[0];
      if (bookingId) {
        setCurrentPage('booking-detail');
      }
    } else if (path.includes('/clinical/')) {
      setCurrentPage('doctor-clinical');
    } else if (path === '/booking' || path === '/booking/') {
      handleNavigate('booking');
    } else {
      setIsCheckInPage(false);
    }
  }, [user]);

  // Redirect Doctor về Dashboard
  useEffect(() => {
    const role = getUserRole();
    if (role === 'doctor' && user && currentPage === 'home') {
      setCurrentPage('doctor-dashboard');
    }
  }, [user]);

  // Redirect Admin
  useEffect(() => {
    const role = getUserRole();
    if (role === 'admin' && !isCheckInPage) {
      // Admin được phép xem các trang quản trị và cả trang khảo sát (để test)
      const allowedPages = ['home', 'dashboard', 'patients', 'cskh', 'cskh-dashboard'];
      if (!allowedPages.includes(currentPage)) {
        setCurrentPage('dashboard');
      }
    }
  }, [user, currentPage, isCheckInPage]);

  // Redirect trang cần đăng nhập
  useEffect(() => {
    // LƯU Ý: Đã xóa 'cskh' khỏi đây để bệnh nhân vãng lai có thể truy cập
    const protectedPages = ['booking', 'profile', 'lookup', 'schedule', 'dashboard', 'patients', 'cskh-dashboard'];
    if (!user && protectedPages.includes(currentPage) && !isCheckInPage) {
      setCurrentPage('home');
    }
  }, [user, currentPage, isCheckInPage]);

  const getUserRole = () => {
    if (!user) return null;
    return user.role || 'patient';
  };

  const handleNavigate = (page: string) => {
    const role = getUserRole();
    
    // TRANG KHẢO SÁT (CSKH): Công khai, không cần check gì cả
    if (page === 'cskh') {
      setCurrentPage(page);
      return;
    }

    const protectedPages = ['booking', 'profile', 'lookup'];
    const adminPages = ['dashboard', 'patients'];
    const cskhDashboardPages = ['cskh-dashboard'];
    const doctorPages = ['schedule', 'doctor-dashboard', 'doctor-patients', 'doctor-records', 'doctor-schedule', 'doctor-clinical'];
    
    // Admin check
    if (role === 'admin') {
      const allowedAdminPages = ['home', 'dashboard', 'patients', 'profile', 'cskh', 'cskh-dashboard'];
      if (!allowedAdminPages.includes(page)) {
        showToast('Bạn không có quyền truy cập trang này', 'warning');
        setCurrentPage('dashboard');
        return;
      }
    }
    
    // Doctor check booking
    if (role === 'doctor' && page === 'booking') {
      showToast('Bác sĩ không thể đặt lịch khám.', 'warning');
      return;
    }
    
    // Auth check
    if (!user && (protectedPages.includes(page) || cskhDashboardPages.includes(page))) {
      showToast('Vui lòng đăng nhập để sử dụng tính năng này', 'warning');
      setShowAuthModal(true);
      return;
    }
    
    // Permission checks
    if (adminPages.includes(page) && role !== 'admin') {
      showToast('Bạn không có quyền truy cập trang này', 'warning');
      return;
    }

    // Chỉ Admin hoặc nhân viên CSKH mới được xem Dashboard thống kê
    if (cskhDashboardPages.includes(page) && role !== 'admin' && role !== 'cskh') {
      showToast('Bạn không có quyền xem thống kê', 'warning');
      return;
    }
    
    if (doctorPages.includes(page) && role !== 'doctor' && role !== 'admin') {
      showToast('Bạn không có quyền truy cập trang này', 'warning');
      return;
    }
    
    setCurrentPage(page);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Fullscreen pages
  if (isCheckInPage || currentPage === 'booking-detail' || currentPage === 'doctor-clinical') {
    if (isCheckInPage) return <div className="min-h-screen bg-gray-50"><CheckInPage /><GlobalLoading /></div>;
    if (currentPage === 'booking-detail') return <div className="min-h-screen bg-gray-50"><BookingDetailPage /><GlobalLoading /></div>;
    if (currentPage === 'doctor-clinical') return <div className="min-h-screen bg-gray-50"><DoctorClinicalPage user={user} /><GlobalLoading /></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar 
        currentPage={currentPage} 
        onNavigate={handleNavigate} 
        user={user} 
        userRole={getUserRole()}
        onSignOutSuccess={refreshUser}
      />

      {currentPage === 'home' && <HomePage onNavigate={handleNavigate} />}
      {currentPage === 'about' && <AboutPage />}
      {currentPage === 'lookup' && user && getUserRole() !== 'admin' && <LookupPage />}
      {currentPage === 'booking' && user && getUserRole() !== 'admin' && <BookingPage user={user} />}
      {currentPage === 'profile' && user && getUserRole() !== 'admin' && <ProfilePage user={user} onSignOutSuccess={refreshUser} />}
      
      {/* Admin Dashboard */}
      {currentPage === 'dashboard' && user && getUserRole() === 'admin' && <DashboardPage user={user} />}
      {currentPage === 'patients' && user && getUserRole() === 'admin' && <PatientsPage user={user} />}
      
      {/* --- TRANG CSKH --- */}
      {/* 1. Trang Khảo sát: Công khai, ai có link cũng vào được (currentPage = 'cskh') */}
      {currentPage === 'cskh' && <CustomerCarePage />}
      
      {/* 2. Trang Thống kê: Chỉ Admin hoặc nhân viên CSKH mới thấy */}
      {currentPage === 'cskh-dashboard' && user && (getUserRole() === 'admin' || getUserRole() === 'cskh') && <CSKHDashboardPage />}

      {/* Doctor Dashboard */}
      {currentPage === 'doctor-dashboard' && user && getUserRole() === 'doctor' && <DoctorDashboardPage user={user} />}
      {currentPage === 'schedule' && user && getUserRole() !== 'admin' && <SchedulePage user={user} />}
      {currentPage === 'doctor-patients' && user && getUserRole() === 'doctor' && <DoctorPatientsPage user={user} />}
      {currentPage === 'doctor-records' && user && getUserRole() === 'doctor' && <DoctorRecordsPage user={user} />}
      {currentPage === 'doctor-schedule' && user && getUserRole() === 'doctor' && <DoctorSchedulePage user={user} />}

      {showAuthModal && (
        <AuthModal 
          onClose={() => setShowAuthModal(false)} 
          onAuthSuccess={refreshUser}
        />
      )}

      <ToastContainer toasts={toasts} onClose={removeToast} />
      <GlobalLoading />
    </div>
  );
}

export default App;