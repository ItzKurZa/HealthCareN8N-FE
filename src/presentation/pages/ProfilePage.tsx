import { useState, useEffect } from 'react';
import { User, FileText, Calendar, Trash2, Download } from 'lucide-react';
import { medicalService } from '../../infrastructure/medical/medicalService';
import { bookingService } from '../../infrastructure/booking/bookingService';
import { Chatbot } from '../components/Chatbot';
import { useToast } from '../contexts/ToastContext';
import type { MedicalFile, Booking } from '../../shared/types';

interface ProfilePageProps {
  user: any;
}

export const ProfilePage = ({ user }: ProfilePageProps) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'files' | 'bookings'>('files');
  const [medicalFiles, setMedicalFiles] = useState<MedicalFile[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Sử dụng user.id hoặc user.cccd tùy theo backend yêu cầu
      const userId = user.id || user.cccd || user.user_id;
      const [filesData, bookingsData] = await Promise.all([
        medicalService.getUserFiles(userId),
        bookingService.getUserBookings(userId),
      ]);
      setMedicalFiles(filesData);
      setBookings(bookingsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa file này?')) {
      try {
        await medicalService.deleteFile(fileId);
        setMedicalFiles(medicalFiles.filter((f) => f.id !== fileId));
        showToast('Xóa file thành công!', 'success');
      } catch (error: any) {
        showToast(error.message || 'Xóa file thất bại', 'error');
      }
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn hủy lịch hẹn này?')) {
      try {
        await bookingService.cancelBooking(bookingId);
        setBookings(bookings.map((b) => b.id === bookingId ? { ...b, status: 'cancelled' } : b));
        showToast('Hủy lịch hẹn thành công!', 'success');
      } catch (error: any) {
        showToast(error.message || 'Hủy lịch hẹn thất bại', 'error');
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-12 text-white">
            <div className="flex items-center space-x-4">
              <div className="bg-white bg-opacity-20 p-4 rounded-full">
                <User className="w-12 h-12" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">{user.user_metadata?.full_name || 'User'}</h1>
                <p className="text-blue-100">{user.email}</p>
              </div>
            </div>
          </div>

          <div className="border-b">
            <div className="flex">
              <button
                onClick={() => setActiveTab('files')}
                className={`flex-1 px-6 py-4 font-medium transition ${
                  activeTab === 'files'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>Medical Files ({medicalFiles.length})</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('bookings')}
                className={`flex-1 px-6 py-4 font-medium transition ${
                  activeTab === 'bookings'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <Calendar className="w-5 h-5" />
                  <span>Appointments ({bookings.length})</span>
                </div>
              </button>
            </div>
          </div>

          <div className="p-8">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-gray-600">Loading...</p>
              </div>
            ) : (
              <>
                {activeTab === 'files' && (
                  <div className="space-y-4">
                    {medicalFiles.length === 0 ? (
                      <div className="text-center py-12">
                        <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">No medical files uploaded yet</p>
                      </div>
                    ) : (
                      medicalFiles.map((file) => (
                        <div
                          key={file.id}
                          className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-4 flex-1">
                              <FileText className="w-10 h-10 text-blue-600 flex-shrink-0" />
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 mb-1">
                                  {file.file_name}
                                </h3>
                                {file.description && (
                                  <p className="text-gray-600 text-sm mb-2">{file.description}</p>
                                )}
                                <div className="flex items-center space-x-4 text-sm text-gray-500">
                                  <span>Uploaded: {formatDate(file.uploaded_at)}</span>
                                  <span>Size: {(file.file_size / 1024).toFixed(2)} KB</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <a
                                href={file.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              >
                                <Download className="w-5 h-5" />
                              </a>
                              <button
                                onClick={() => handleDeleteFile(file.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'bookings' && (
                  <div className="space-y-4">
                    {bookings.length === 0 ? (
                      <div className="text-center py-12">
                        <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">No appointments booked yet</p>
                      </div>
                    ) : (
                      bookings.map((booking) => (
                        <div
                          key={booking.id}
                          className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-3">
                                <h3 className="font-semibold text-gray-900 text-lg">
                                  {booking.department}
                                </h3>
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                    booking.status
                                  )}`}
                                >
                                  {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                                </span>
                              </div>
                              {booking.doctor_name && (
                                <p className="text-gray-600 mb-2">Dr. {booking.doctor_name}</p>
                              )}
                              <div className="space-y-1 text-sm text-gray-600">
                                <p>
                                  <span className="font-medium">Date:</span>{' '}
                                  {formatDate(booking.appointment_date)}
                                </p>
                                <p>
                                  <span className="font-medium">Time:</span>{' '}
                                  {booking.appointment_time}
                                </p>
                                <p>
                                  <span className="font-medium">Reason:</span> {booking.reason}
                                </p>
                                {booking.notes && (
                                  <p>
                                    <span className="font-medium">Notes:</span> {booking.notes}
                                  </p>
                                )}
                              </div>
                            </div>
                            {booking.status === 'pending' && (
                              <button
                                onClick={() => handleCancelBooking(booking.id)}
                                className="px-4 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <Chatbot user={user}/>
    </div>
  );
};
