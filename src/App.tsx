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

function App() {
  const { user, loading, refreshUser } = useAuth();
  const { toasts, removeToast, showToast } = useToast();
  const [currentPage, setCurrentPage] = useState('home');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isCheckInPage, setIsCheckInPage] = useState(false);

  // Check if current path is check-in page, booking detail page, booking page, or clinical page
  useEffect(() => {
    const path = window.location.pathname;
    if (path.includes('/check-in/')) {
      setIsCheckInPage(true);
      setCurrentPage('check-in');
    } else if (path.includes('/booking/')) {
      // Handle booking detail route (with ID)
      const bookingId = path.split('/booking/')[1]?.split('/')[0];
      if (bookingId) {
        setCurrentPage('booking-detail');
      }
    } else if (path.includes('/clinical/')) {
      // Handle clinical page route
      setCurrentPage('doctor-clinical');
    } else if (path === '/booking' || path === '/booking/') {
      // Handle booking page route (without ID) - use handleNavigate to check auth and permissions
      handleNavigate('booking');
    } else {
      setIsCheckInPage(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Auto redirect doctor to dashboard on login
  useEffect(() => {
    const role = getUserRole();
    if (role === 'doctor' && user && currentPage === 'home') {
      setCurrentPage('doctor-dashboard');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Redirect admin về dashboard nếu đang ở trang không được phép
  useEffect(() => {
    const role = getUserRole();
    if (role === 'admin' && !isCheckInPage) {
      const allowedPages = ['home', 'dashboard', 'patients'];
      if (!allowedPages.includes(currentPage)) {
        setCurrentPage('dashboard');
      }
    }
  }, [user, currentPage, isCheckInPage]);

  // Redirect về home nếu đã đăng xuất và đang ở trang yêu cầu đăng nhập
  useEffect(() => {
    const protectedPages = ['booking', 'profile', 'lookup', 'schedule', 'dashboard', 'patients'];
    if (!user && protectedPages.includes(currentPage) && !isCheckInPage) {
      setCurrentPage('home');
    }
  }, [user, currentPage, isCheckInPage]);

  const getUserRole = () => {
    if (!user) return null;
    // Lấy role từ user profile (từ backend API /account/profile)
    // Backend trả về profile với field role từ Firestore
    return user.role || 'patient'; // Mặc định là patient nếu không có role
  };

  const handleNavigate = (page: string) => {
    const role = getUserRole();
    const protectedPages = ['booking', 'profile', 'lookup']; // Yêu cầu đăng nhập cho tra cứu và đặt lịch
    const adminPages = ['dashboard', 'patients'];
    const doctorPages = ['schedule', 'doctor-dashboard', 'doctor-patients', 'doctor-records', 'doctor-schedule', 'doctor-clinical'];
    
    // Admin chỉ được truy cập các trang quản lý
    if (role === 'admin') {
      const allowedAdminPages = ['home', 'dashboard', 'patients', 'profile'];
      if (!allowedAdminPages.includes(page)) {
        showToast('Bạn không có quyền truy cập trang này', 'warning');
        setCurrentPage('dashboard'); // Redirect về dashboard
        return;
      }
    }
    
    // Doctor không được đặt lịch (theo RBAC model)
    if (role === 'doctor' && page === 'booking') {
      showToast('Bác sĩ không thể đặt lịch khám. Vui lòng liên hệ quản trị viên nếu cần hỗ trợ.', 'warning');
      return;
    }
    
    // Yêu cầu đăng nhập cho tra cứu và đặt lịch
    if (!user && protectedPages.includes(page)) {
      showToast('Vui lòng đăng nhập để sử dụng tính năng này', 'warning');
      setShowAuthModal(true);
      return;
    }
    
    // Kiểm tra quyền truy cập
    if (adminPages.includes(page) && role !== 'admin') {
      showToast('Bạn không có quyền truy cập trang này', 'warning');
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

  // If check-in page, booking detail page, or clinical page, don't show navbar
  if (isCheckInPage || currentPage === 'booking-detail' || currentPage === 'doctor-clinical') {
    if (isCheckInPage) {
      return (
        <div className="min-h-screen bg-gray-50">
          <CheckInPage />
          <GlobalLoading />
        </div>
      );
    }
    if (currentPage === 'booking-detail') {
      return (
        <div className="min-h-screen bg-gray-50">
          <BookingDetailPage />
          <GlobalLoading />
        </div>
      );
    }
    if (currentPage === 'doctor-clinical') {
      return (
        <div className="min-h-screen bg-gray-50">
          <DoctorClinicalPage user={user} />
          <GlobalLoading />
        </div>
      );
    }
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
      {/* Yêu cầu đăng nhập cho tra cứu và đặt lịch */}
      {currentPage === 'lookup' && user && getUserRole() !== 'admin' && <LookupPage />}
      {currentPage === 'booking' && user && getUserRole() !== 'admin' && <BookingPage user={user} />}
      {currentPage === 'profile' && user && getUserRole() !== 'admin' && <ProfilePage user={user} onSignOutSuccess={refreshUser} />}
      {/* Admin Dashboard */}
      {currentPage === 'dashboard' && user && getUserRole() === 'admin' && <DashboardPage user={user} />}
      {currentPage === 'patients' && user && getUserRole() === 'admin' && <PatientsPage user={user} />}
      {/* Doctor Dashboard */}
      {currentPage === 'doctor-dashboard' && user && getUserRole() === 'doctor' && <DoctorDashboardPage user={user} />}
      {/* Doctor và Patient thấy */}
      {currentPage === 'schedule' && user && getUserRole() !== 'admin' && <SchedulePage user={user} />}
      {/* Doctor only pages */}
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
