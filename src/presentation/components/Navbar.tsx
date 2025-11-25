import { Home, Calendar, Upload, User, LogOut, Activity, Phone } from 'lucide-react';
import { authService } from '../../infrastructure/auth/authService';

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  user: any;
}

export const Navbar = ({ currentPage, onNavigate, user }: NavbarProps) => {
  const handleSignOut = async () => {
    try {
      await authService.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
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
              onClick={() => onNavigate('booking')}
              className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition ${
                currentPage === 'booking' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              <Calendar className="w-5 h-5" />
              <span className="font-medium">Booking</span>
            </button>

            <button
              onClick={() => onNavigate('upload')}
              className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition ${
                currentPage === 'upload' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              <Upload className="w-5 h-5" />
              <span className="font-medium">Upload</span>
            </button>

            <button
              onClick={() => onNavigate('profile')}
              className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition ${
                currentPage === 'profile' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              <User className="w-5 h-5" />
              <span className="font-medium">Profile</span>
            </button>

            <button
              onClick={() => onNavigate('voicecalls')}
              className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition ${
                currentPage === 'voicecalls' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              <Phone className="w-5 h-5" />
              <span className="font-medium">Voice Calls</span>
            </button>

            {user && (
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-1 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 transition"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Sign Out</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
