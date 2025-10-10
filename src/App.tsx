import { useState } from 'react';
import { useAuth } from './presentation/hooks/useAuth';
import { Navbar } from './presentation/components/Navbar';
import { AuthModal } from './presentation/components/AuthModal';
import { HomePage } from './presentation/pages/HomePage';
import { AboutPage } from './presentation/pages/AboutPage';
import { BookingPage } from './presentation/pages/BookingPage';
import { UploadPage } from './presentation/pages/UploadPage';
import { ProfilePage } from './presentation/pages/ProfilePage';

function App() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('home');
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleNavigate = (page: string) => {
    if (!user && ['booking', 'upload', 'profile'].includes(page)) {
      setShowAuthModal(true);
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar currentPage={currentPage} onNavigate={handleNavigate} user={user} />

      {currentPage === 'home' && <HomePage onNavigate={handleNavigate} />}
      {currentPage === 'about' && <AboutPage />}
      {currentPage === 'booking' && user && <BookingPage user={user} />}
      {currentPage === 'upload' && user && <UploadPage user={user} />}
      {currentPage === 'profile' && user && <ProfilePage user={user} />}

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </div>
  );
}

export default App;
