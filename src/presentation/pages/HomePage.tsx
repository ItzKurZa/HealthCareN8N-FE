import { Calendar, Upload, FileText, Clock, Shield, Users } from 'lucide-react';

interface HomePageProps {
  onNavigate: (page: string) => void;
}

export const HomePage = ({ onNavigate }: HomePageProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Welcome to HealthCare Plus
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Your trusted healthcare partner providing comprehensive medical services
            with compassion and excellence. Experience modern healthcare at its best.
          </p>
          <div className="mt-8 flex justify-center space-x-4">
            <button
              onClick={() => onNavigate('booking')}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition font-medium text-lg"
            >
              Book Appointment
            </button>
            <button
              onClick={() => onNavigate('about')}
              className="bg-white text-blue-600 px-8 py-3 rounded-lg border-2 border-blue-600 hover:bg-blue-50 transition font-medium text-lg"
            >
              Learn More
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Easy Booking</h3>
            <p className="text-gray-600">
              Schedule appointments with our specialists in just a few clicks. Choose your preferred time and department.
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <Upload className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Medical Records</h3>
            <p className="text-gray-600">
              Securely upload and manage your medical documents. Access your health history anytime, anywhere.
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition">
            <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Digital Profile</h3>
            <p className="text-gray-600">
              View your appointment history and medical uploads all in one place. Stay organized and informed.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-12 mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Why Choose HealthCare Plus?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <Clock className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">24/7 Available</h3>
              <p className="text-gray-600">Round-the-clock emergency care and support</p>
            </div>
            <div className="text-center">
              <Shield className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Secure & Private</h3>
              <p className="text-gray-600">Your data is protected with enterprise-grade security</p>
            </div>
            <div className="text-center">
              <Users className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Expert Team</h3>
              <p className="text-gray-600">Experienced healthcare professionals dedicated to you</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-12 text-white text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl mb-8 text-blue-100">
            Join thousands of patients who trust us with their healthcare needs
          </p>
          <button
            onClick={() => onNavigate('booking')}
            className="bg-white text-blue-600 px-8 py-3 rounded-lg hover:bg-blue-50 transition font-medium text-lg"
          >
            Book Your First Appointment
          </button>
        </div>
      </div>
    </div>
  );
};
