import { useState, useEffect } from 'react';
import { useAuth } from './presentation/hooks/useAuth';
import { Navbar } from './presentation/components/Navbar';
import { AuthModal } from './presentation/components/AuthModal';
import { HomePage } from './presentation/pages/HomePage';
import { AboutPage } from './presentation/pages/AboutPage';
import { BookingPage } from './presentation/pages/BookingPage';
import { UploadPage } from './presentation/pages/UploadPage';
import { ProfilePage } from './presentation/pages/ProfilePage';
import { GlobalLoading } from './presentation/components/GlobalLoading';
import { DashboardPage } from './presentation/pages/DashboardPage';
import { PatientsPage } from './presentation/pages/PatientsPage';
import { SchedulePage } from './presentation/pages/SchedulePage';
import { CheckInPage } from './presentation/pages/CheckInPage';
import { LookupPage } from './presentation/pages/LookupPage';
import { ToastContainer } from './presentation/components/ToastContainer';
import { useToast } from './presentation/contexts/ToastContext';

function App() {
  const { user, loading, refreshUser } = useAuth();
  const { toasts, removeToast } = useToast();
  const [currentPage, setCurrentPage] = useState('home');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isCheckInPage, setIsCheckInPage] = useState(false);

  // Check if current path is check-in page
  useEffect(() => {
    const path = window.location.pathname;
    if (path.includes('/check-in/')) {
      setIsCheckInPage(true);
      setCurrentPage('check-in');
    } else {
      setIsCheckInPage(false);
    }
  }, []);

  const getUserRole = () => {
    if (!user) return null;
    // Kiểm tra role từ user object
    // Có thể là user.role, user.user_metadata?.role, hoặc user.email để xác định
    return user.role || user.user_metadata?.role || 
           (user.email?.includes('admin') ? 'admin' : 
            user.email?.includes('doctor') ? 'doctor' : 'patient');
  };

  const handleNavigate = (page: string) => {
    const role = getUserRole();
    const protectedPages = ['booking', 'upload', 'profile'];
    const adminPages = ['dashboard', 'patients'];
    const doctorPages = ['schedule'];
    
    if (!user && protectedPages.includes(page)) {
      setShowAuthModal(true);
      return;
    }
    
    // Kiểm tra quyền truy cập
    if (adminPages.includes(page) && role !== 'admin') {
      alert('Bạn không có quyền truy cập trang này');
      return;
    }
    
    if (doctorPages.includes(page) && role !== 'doctor' && role !== 'admin') {
      alert('Bạn không có quyền truy cập trang này');
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

  // If check-in page, don't show navbar
  if (isCheckInPage) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CheckInPage />
        <GlobalLoading />
      </div>
    );
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
      {currentPage === 'lookup' && <LookupPage />}
      {currentPage === 'booking' && user && <BookingPage user={user} />}
      {currentPage === 'upload' && user && <UploadPage user={user} />}
      {currentPage === 'profile' && user && <ProfilePage user={user} />}
      {currentPage === 'dashboard' && user && <DashboardPage user={user} />}
      {currentPage === 'patients' && user && <PatientsPage user={user} />}
      {currentPage === 'schedule' && user && <SchedulePage user={user} />}

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
