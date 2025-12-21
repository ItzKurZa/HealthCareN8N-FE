import { useState, useEffect } from 'react';
import { User, FileText, Calendar, Trash2, Download, UserCircle, Mail, Phone, CreditCard, Clock, Upload, LogOut, Stethoscope, Users, Activity, Edit2, X, Award, GraduationCap, Briefcase, BarChart3, CheckCircle, AlertCircle } from 'lucide-react';
import { medicalService } from '../../infrastructure/medical/medicalService';
import { bookingService } from '../../infrastructure/booking/bookingService';
import { authService } from '../../infrastructure/auth/authService';
import { doctorService, type PatientBooking } from '../../infrastructure/doctor/doctorService';
import { Chatbot } from '../components/Chatbot';
import { useToast } from '../contexts/ToastContext';
import type { MedicalFile, Booking } from '../../shared/types';

interface ProfilePageProps {
  user: any;
  onSignOutSuccess?: () => void;
}

interface UserProfile {
  uid?: string;
  email?: string;
  fullname?: string;
  phone?: string;
  cccd?: string;
  role?: string;
  doctor_name?: string;
  department?: string;
  departmentId?: string;
  department_info?: {
    id: string;
    name: string;
    description?: string;
  };
  doctor_status?: string;
  doctor_catalog_id?: string;
  consultation_fee?: number;
  license_number?: string;
  qualifications?: string;
  experience?: number;
  specialization?: string;
  statistics?: {
    totalBookings: number;
    totalPatients: number;
    completedBookings: number;
    pendingBookings: number;
    confirmedBookings: number;
    cancelledBookings: number;
  };
  createdAt?: string;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024;

export const ProfilePage = ({ user, onSignOutSuccess }: ProfilePageProps) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'profile' | 'files' | 'bookings' | 'upload' | 'patients'>('profile');
  const [medicalFiles, setMedicalFiles] = useState<MedicalFile[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [doctorBookings, setDoctorBookings] = useState<PatientBooking[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [doctorBookingsLoading, setDoctorBookingsLoading] = useState(false);
  
  // Pagination states
  const [bookingsPage, setBookingsPage] = useState(1);
  const [doctorBookingsPage, setDoctorBookingsPage] = useState(1);
  const [bookingsPagination, setBookingsPagination] = useState<any>(null);
  const [doctorBookingsPagination, setDoctorBookingsPagination] = useState<any>(null);
  const BOOKINGS_PER_PAGE = 10;
  
  // Get user role
  const getUserRole = () => {
    return userProfile?.role || user?.role || 'patient';
  };
  
  const isDoctor = getUserRole() === 'doctor';
  const isAdmin = getUserRole() === 'admin';
  
  // Upload state
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);
  
  // Doctor-specific states
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showMedicalRecordModal, setShowMedicalRecordModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<PatientBooking | null>(null);
  const [medicalRecord, setMedicalRecord] = useState('');
  const [savingRecord, setSavingRecord] = useState(false);
  const [doctorStats, setDoctorStats] = useState({
    totalBookings: 0,
    totalPatients: 0,
    completedBookings: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
    cancelledBookings: 0,
  });

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load user profile
      const profile = await authService.getCurrentUser();
      if (profile) {
        setUserProfile(profile);
      }
      
      const role = profile?.role || user?.role || 'patient';
      
      if (role === 'doctor') {
        // Load doctor bookings (patients' appointments)
        await loadDoctorBookings();
        // Load doctor statistics
        await loadDoctorStatistics();
      } else {
        // Load patient data
        const userId = user.id || user.cccd || user.user_id || user.uid || profile?.uid;
        if (userId) {
          const [filesData, bookingsResult] = await Promise.all([
            medicalService.getUserFiles(userId).catch(() => []),
            bookingService.getUserBookings(userId, bookingsPage, BOOKINGS_PER_PAGE).catch(() => ({ bookings: [], pagination: null })),
          ]);
          setMedicalFiles(filesData);
          setBookings(bookingsResult.bookings || []);
          setBookingsPagination(bookingsResult.pagination);
        }
      }
    } catch (error: any) {
      console.error('Error loading data:', error);
      showToast('Không thể tải dữ liệu. Vui lòng thử lại.', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  const loadDoctorBookings = async () => {
    setDoctorBookingsLoading(true);
    try {
      const doctorName = userProfile?.doctor_name || userProfile?.fullname || user?.fullname || '';
      if (doctorName) {
        const filters: any = {
          page: doctorBookingsPage,
          limit: BOOKINGS_PER_PAGE,
        };
        if (statusFilter !== 'all') {
          filters.status = statusFilter;
        }
        const result = await doctorService.getDoctorBookings(doctorName, filters);
        setDoctorBookings(result.bookings || []);
        setDoctorBookingsPagination(result.pagination);
      }
    } catch (error: any) {
      console.error('Error loading doctor bookings:', error);
      showToast('Không thể tải lịch hẹn. Vui lòng thử lại.', 'error');
    } finally {
      setDoctorBookingsLoading(false);
    }
  };

  const loadDoctorStatistics = async () => {
    try {
      // Nếu profile đã có statistics từ API, sử dụng luôn
      if (userProfile?.statistics) {
        setDoctorStats({
          totalBookings: userProfile.statistics.totalBookings || 0,
          totalPatients: userProfile.statistics.totalPatients || 0,
          completedBookings: userProfile.statistics.completedBookings || 0,
          pendingBookings: userProfile.statistics.pendingBookings || 0,
          confirmedBookings: userProfile.statistics.confirmedBookings || 0,
          cancelledBookings: userProfile.statistics.cancelledBookings || 0,
        });
        return;
      }

      // Fallback: tính từ bookings nếu API chưa có statistics
      const doctorName = userProfile?.doctor_name || userProfile?.fullname || user?.fullname || '';
      if (!doctorName) return;

      // Load all bookings để tính thống kê
      const allBookings = await doctorService.getDoctorBookings(doctorName, {});
      const bookings = allBookings.bookings || [];

      // Tính thống kê
      const uniquePatients = new Set<string>();
      let completed = 0;
      let pending = 0;
      let confirmed = 0;
      let cancelled = 0;

      bookings.forEach((booking) => {
        // Count unique patients
        if (booking.email) uniquePatients.add(booking.email);
        else if (booking.phone) uniquePatients.add(booking.phone);

        // Count by status
        switch (booking.status) {
          case 'completed':
            completed++;
            break;
          case 'pending':
            pending++;
            break;
          case 'confirmed':
            confirmed++;
            break;
          case 'cancelled':
          case 'canceled':
            cancelled++;
            break;
        }
      });

      setDoctorStats({
        totalBookings: bookings.length,
        totalPatients: uniquePatients.size,
        completedBookings: completed,
        pendingBookings: pending,
        confirmedBookings: confirmed,
        cancelledBookings: cancelled,
      });
    } catch (error: any) {
      console.error('Error loading doctor statistics:', error);
    }
  };
  
  const loadPatientBookings = async () => {
    setBookingsLoading(true);
    try {
      const userId = user.id || user.cccd || user.user_id || user.uid || userProfile?.uid;
      if (userId) {
        const bookingsResult = await bookingService.getUserBookings(userId, bookingsPage, BOOKINGS_PER_PAGE);
        setBookings(bookingsResult.bookings || []);
        setBookingsPagination(bookingsResult.pagination);
      }
    } catch (error: any) {
      console.error('Error loading patient bookings:', error);
      showToast('Không thể tải lịch hẹn. Vui lòng thử lại.', 'error');
    } finally {
      setBookingsLoading(false);
    }
  };
  
  useEffect(() => {
    if (isDoctor && activeTab === 'patients' && userProfile) {
      loadDoctorBookings();
    }
  }, [statusFilter, isDoctor, activeTab, doctorBookingsPage, userProfile]);
  
  useEffect(() => {
    if (!isDoctor && activeTab === 'bookings' && userProfile) {
      loadPatientBookings();
    }
  }, [bookingsPage, activeTab, isDoctor, userProfile]);

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
    // Kiểm tra role: Doctor không được hủy lịch (theo RBAC model)
    const role = getUserRole();
    if (role === 'doctor') {
      showToast('Bác sĩ không thể hủy lịch hẹn. Vui lòng liên hệ quản trị viên nếu cần hỗ trợ.', 'warning');
      return;
    }

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];

      if (selectedFile.size > MAX_FILE_SIZE) {
        showToast('File quá lớn. Tối đa 50MB', 'error');
        setFile(null);
        return;
      }

      setFile(selectedFile);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploadLoading(true);

    const userId = user.id || user.cccd || user.user_id || user.uid || userProfile?.uid;
    const fields = {
      userId: userId || '',
      fullname: userProfile?.fullname || user.user_metadata?.full_name || user.email?.split('@')[0] || '',
      email: userProfile?.email || user.email || '',
      phone: userProfile?.phone || user.phone || '',
      notes: description || '',
    };

    try {
      await medicalService.uploadFile(file, fields);
      showToast('Tải file lên thành công!', 'success');
      setFile(null);
      setDescription('');
      
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      // Reload files
      if (userId) {
        const filesData = await medicalService.getUserFiles(userId);
        setMedicalFiles(filesData);
      }
      
      // Switch to files tab
      setActiveTab('files');
    } catch (err: any) {
      showToast(err.message || 'Tải file lên thất bại', 'error');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await authService.signOut();
      showToast('Đăng xuất thành công!', 'success');
      if (onSignOutSuccess) {
        await onSignOutSuccess();
      }
    } catch (error: any) {
      showToast(error.message || 'Đăng xuất thất bại', 'error');
    }
  };
  
  // Doctor-specific handlers
  const handleOpenMedicalRecord = (booking: PatientBooking) => {
    setSelectedBooking(booking);
    setMedicalRecord(booking.medical_record || '');
    setShowMedicalRecordModal(true);
  };
  
  const handleSaveMedicalRecord = async () => {
    if (!selectedBooking) return;
    
    setSavingRecord(true);
    try {
      await doctorService.updateBookingStatus(
        selectedBooking.id,
        undefined,
        medicalRecord
      );
      showToast('Ghi hồ sơ bệnh án thành công!', 'success');
      setShowMedicalRecordModal(false);
      await loadDoctorBookings();
    } catch (error: any) {
      showToast(error.message || 'Ghi hồ sơ thất bại', 'error');
    } finally {
      setSavingRecord(false);
    }
  };
  
  const handleStatusChange = async (bookingId: string, newStatus: PatientBooking['status']) => {
    try {
      await doctorService.updateBookingStatus(bookingId, newStatus);
      showToast('Cập nhật trạng thái thành công!', 'success');
      await loadDoctorBookings();
    } catch (error: any) {
      showToast(error.message || 'Cập nhật trạng thái thất bại', 'error');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString: string, timeString?: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      const dateStr = date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      return timeString ? `${dateStr} ${timeString}` : dateStr;
    } catch {
      return dateString;
    }
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
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-white bg-opacity-20 p-4 rounded-full">
                  <User className="w-12 h-12" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">
                    {userProfile?.fullname || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}
                  </h1>
                  <p className="text-blue-100">{userProfile?.email || user.email || ''}</p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-2 px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition text-white"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Đăng xuất</span>
              </button>
            </div>
          </div>

          <div className="border-b">
            <div className="flex">
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex-1 px-6 py-4 font-medium transition ${
                  activeTab === 'profile'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <UserCircle className="w-5 h-5" />
                  <span>Thông tin cá nhân</span>
                </div>
              </button>
              
              {isDoctor ? (
                <button
                  onClick={() => setActiveTab('patients')}
                  className={`flex-1 px-6 py-4 font-medium transition ${
                    activeTab === 'patients'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-blue-600'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Users className="w-5 h-5" />
                    <span>Lịch hẹn bệnh nhân ({doctorBookings.length})</span>
                  </div>
                </button>
              ) : (
                <>
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
                      <span>Lịch sử khám ({bookings.length})</span>
                    </div>
                  </button>
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
                      <span>Hồ sơ y tế ({medicalFiles.length})</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab('upload')}
                    className={`flex-1 px-6 py-4 font-medium transition ${
                      activeTab === 'upload'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-600 hover:text-blue-600'
                    }`}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <Upload className="w-5 h-5" />
                      <span>Tải lên</span>
                    </div>
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="p-8">
            {loading && activeTab === 'profile' ? (
              <div className="text-center py-12">
                <p className="text-gray-600">Đang tải...</p>
              </div>
            ) : (
              <>
                {activeTab === 'profile' && (
                  <div className="max-w-4xl">
                    {/* Thống kê cho doctor */}
                    {isDoctor && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white rounded-xl shadow-lg p-4 border-l-4 border-blue-500">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-600 mb-1">Tổng lịch hẹn</p>
                              <p className="text-2xl font-bold text-gray-900">{doctorStats.totalBookings}</p>
                            </div>
                            <Calendar className="w-8 h-8 text-blue-500" />
                          </div>
                        </div>
                        <div className="bg-white rounded-xl shadow-lg p-4 border-l-4 border-green-500">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-600 mb-1">Bệnh nhân</p>
                              <p className="text-2xl font-bold text-gray-900">{doctorStats.totalPatients}</p>
                            </div>
                            <Users className="w-8 h-8 text-green-500" />
                          </div>
                        </div>
                        <div className="bg-white rounded-xl shadow-lg p-4 border-l-4 border-purple-500">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-600 mb-1">Đã hoàn thành</p>
                              <p className="text-2xl font-bold text-gray-900">{doctorStats.completedBookings}</p>
                            </div>
                            <CheckCircle className="w-8 h-8 text-purple-500" />
                          </div>
                        </div>
                        <div className="bg-white rounded-xl shadow-lg p-4 border-l-4 border-yellow-500">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-600 mb-1">Đang chờ</p>
                              <p className="text-2xl font-bold text-gray-900">{doctorStats.pendingBookings}</p>
                            </div>
                            <Clock className="w-8 h-8 text-yellow-500" />
                          </div>
                        </div>
                      </div>
                    )}

                    <div className={`bg-gradient-to-r ${isDoctor ? 'from-green-50 to-emerald-50' : 'from-blue-50 to-indigo-50'} rounded-lg p-6 mb-6`}>
                      <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
                        {isDoctor && <Stethoscope className="w-6 h-6 text-green-600" />}
                        <span>Thông tin {isDoctor ? 'bác sĩ' : 'cá nhân'}</span>
                      </h2>
                      <div className="space-y-4">
                        {isDoctor && userProfile?.doctor_name && (
                          <div className="flex items-start space-x-4">
                            <Stethoscope className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-sm text-gray-600 mb-1">Tên bác sĩ</p>
                              <p className="text-lg font-semibold text-gray-900">
                                {userProfile.doctor_name}
                              </p>
                            </div>
                          </div>
                        )}
                        
                        {isDoctor && userProfile?.department && (
                          <div className="flex items-start space-x-4">
                            <Activity className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-sm text-gray-600 mb-1">Khoa / Chuyên khoa</p>
                              <p className="text-lg font-semibold text-gray-900">
                                {userProfile.department}
                              </p>
                              {userProfile?.department_info?.description && (
                                <p className="text-sm text-gray-600 mt-1">
                                  {userProfile.department_info.description}
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        {isDoctor && userProfile?.doctor_status && (
                          <div className="flex items-start space-x-4">
                            <AlertCircle className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-sm text-gray-600 mb-1">Trạng thái</p>
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                userProfile.doctor_status === 'active' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {userProfile.doctor_status === 'active' ? 'Đang hoạt động' : 'Không hoạt động'}
                              </span>
                            </div>
                          </div>
                        )}
                        
                        {isDoctor && (
                          <div className="flex items-start space-x-4">
                            <CreditCard className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-sm text-gray-600 mb-1">Phí khám</p>
                              <p className="text-lg font-semibold text-gray-900">
                                {userProfile?.consultation_fee ? `${userProfile.consultation_fee.toLocaleString('vi-VN')} VNĐ` : 'Chưa cập nhật'}
                              </p>
                            </div>
                          </div>
                        )}
                        
                        {isDoctor && (
                          <div className="flex items-start space-x-4">
                            <FileText className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-sm text-gray-600 mb-1">Số giấy phép hành nghề</p>
                              <p className="text-lg font-semibold text-gray-900">
                                {userProfile?.license_number || 'Chưa cập nhật'}
                              </p>
                            </div>
                          </div>
                        )}

                        {isDoctor && (
                          <div className="flex items-start space-x-4">
                            <GraduationCap className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-sm text-gray-600 mb-1">Bằng cấp / Chứng chỉ</p>
                              <p className="text-lg font-semibold text-gray-900">
                                {userProfile?.qualifications || 'Chưa cập nhật'}
                              </p>
                            </div>
                          </div>
                        )}

                        {isDoctor && (
                          <div className="flex items-start space-x-4">
                            <Briefcase className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-sm text-gray-600 mb-1">Kinh nghiệm</p>
                              <p className="text-lg font-semibold text-gray-900">
                                {userProfile?.experience ? `${userProfile.experience} năm` : 'Chưa cập nhật'}
                              </p>
                            </div>
                          </div>
                        )}

                        {isDoctor && (
                          <div className="flex items-start space-x-4">
                            <Award className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-sm text-gray-600 mb-1">Chuyên môn</p>
                              <p className="text-lg font-semibold text-gray-900">
                                {userProfile?.specialization || userProfile?.department || 'Chưa cập nhật'}
                              </p>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-start space-x-4">
                          <UserCircle className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm text-gray-600 mb-1">Họ và tên</p>
                            <p className="text-lg font-semibold text-gray-900">
                              {userProfile?.fullname || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Chưa cập nhật'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start space-x-4">
                          <Mail className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm text-gray-600 mb-1">Email</p>
                            <p className="text-lg font-semibold text-gray-900">
                              {userProfile?.email || user.email || 'Chưa cập nhật'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start space-x-4">
                          <Phone className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm text-gray-600 mb-1">Số điện thoại</p>
                            <p className="text-lg font-semibold text-gray-900">
                              {userProfile?.phone || user.phone || 'Chưa cập nhật'}
                            </p>
                          </div>
                        </div>
                        
                        {!isDoctor && (
                          <div className="flex items-start space-x-4">
                            <CreditCard className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-sm text-gray-600 mb-1">CCCD/CMND</p>
                              <p className="text-lg font-semibold text-gray-900">
                                {userProfile?.cccd || user.cccd || 'Chưa cập nhật'}
                              </p>
                            </div>
                          </div>
                        )}
                        
                        {userProfile?.createdAt && (
                          <div className="flex items-start space-x-4">
                            <Clock className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-sm text-gray-600 mb-1">Ngày tham gia</p>
                              <p className="text-lg font-semibold text-gray-900">
                                {formatDate(userProfile.createdAt)}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Thông tin bổ sung cho doctor */}
                    {isDoctor && (
                      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
                          <BarChart3 className="w-5 h-5 text-green-600" />
                          <span>Thống kê hoạt động</span>
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          <div className="p-4 bg-blue-50 rounded-lg">
                            <p className="text-sm text-gray-600 mb-1">Tổng lịch hẹn</p>
                            <p className="text-2xl font-bold text-blue-600">{doctorStats.totalBookings}</p>
                          </div>
                          <div className="p-4 bg-green-50 rounded-lg">
                            <p className="text-sm text-gray-600 mb-1">Bệnh nhân đã khám</p>
                            <p className="text-2xl font-bold text-green-600">{doctorStats.totalPatients}</p>
                          </div>
                          <div className="p-4 bg-purple-50 rounded-lg">
                            <p className="text-sm text-gray-600 mb-1">Đã hoàn thành</p>
                            <p className="text-2xl font-bold text-purple-600">{doctorStats.completedBookings}</p>
                          </div>
                          <div className="p-4 bg-yellow-50 rounded-lg">
                            <p className="text-sm text-gray-600 mb-1">Đang chờ</p>
                            <p className="text-2xl font-bold text-yellow-600">{doctorStats.pendingBookings}</p>
                          </div>
                          <div className="p-4 bg-indigo-50 rounded-lg">
                            <p className="text-sm text-gray-600 mb-1">Đã xác nhận</p>
                            <p className="text-2xl font-bold text-indigo-600">{doctorStats.confirmedBookings}</p>
                          </div>
                          <div className="p-4 bg-red-50 rounded-lg">
                            <p className="text-sm text-gray-600 mb-1">Đã hủy</p>
                            <p className="text-2xl font-bold text-red-600">{doctorStats.cancelledBookings}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'files' && (
                  <div className="space-y-4">
                    {medicalFiles.length === 0 ? (
                      <div className="text-center py-12">
                        <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">Chưa có file y tế nào</p>
                        <button
                          onClick={() => setActiveTab('upload')}
                          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                          Tải file lên ngay
                        </button>
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

                {activeTab === 'upload' && (
                  <div className="max-w-2xl">
                    <div className="mb-6">
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">Tải lên hồ sơ y tế</h2>
                      <p className="text-gray-600">
                        Tải lên hồ sơ y tế, kết quả xét nghiệm, đơn thuốc hoặc các tài liệu liên quan đến sức khỏe.
                        Định dạng hỗ trợ: PDF (Tối đa 50MB)
                      </p>
                    </div>

                    <form onSubmit={handleUploadSubmit} className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Chọn File *
                        </label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition">
                          <input
                            id="file-input"
                            type="file"
                            onChange={handleFileChange}
                            accept=".pdf"
                            className="hidden"
                            required
                          />
                          <label
                            htmlFor="file-input"
                            className="cursor-pointer flex flex-col items-center"
                          >
                            <FileText className="w-12 h-12 text-gray-400 mb-3" />
                            <span className="text-blue-600 font-medium hover:underline">
                              Click để chọn file
                            </span>
                            <span className="text-sm text-gray-500 mt-2">
                              PDF tối đa 50MB
                            </span>
                          </label>
                        </div>

                        {file && (
                          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <FileText className="w-6 h-6 text-blue-600" />
                                <div>
                                  <p className="font-medium text-gray-900">{file.name}</p>
                                  <p className="text-sm text-gray-600">{formatFileSize(file.size)}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Mô tả (Tùy chọn)
                        </label>
                        <textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Mô tả ngắn gọn về tài liệu"
                          rows={4}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={uploadLoading || !file}
                        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 font-medium text-lg flex items-center justify-center space-x-2"
                      >
                        <Upload className="w-5 h-5" />
                        <span>{uploadLoading ? 'Đang tải lên...' : 'Tải file lên'}</span>
                      </button>
                    </form>

                    <div className="mt-8 pt-8 border-t">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Lưu ý quan trọng</h3>
                      <ul className="space-y-2 text-sm text-gray-600">
                        <li>• Tất cả file được mã hóa và lưu trữ an toàn</li>
                        <li>• Bạn có thể xem tất cả file đã tải lên trong tab "Hồ sơ y tế"</li>
                        <li>• Bác sĩ sẽ có quyền truy cập file của bạn trong lịch hẹn</li>
                        <li>• Vui lòng đảm bảo file rõ ràng và dễ đọc</li>
                      </ul>
                    </div>
                  </div>
                )}

                {activeTab === 'bookings' && (
                  <div className="space-y-4">
                    {bookingsLoading ? (
                      <div className="text-center py-12">
                        <p className="text-gray-600">Đang tải lịch hẹn...</p>
                      </div>
                    ) : bookings.length === 0 ? (
                      <div className="text-center py-12">
                        <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">Chưa có lịch hẹn nào</p>
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
                                  {booking.status === 'confirmed' ? 'Đã xác nhận' :
                                   booking.status === 'pending' ? 'Chờ xác nhận' :
                                   booking.status === 'cancelled' ? 'Đã hủy' :
                                   booking.status === 'completed' ? 'Hoàn thành' : booking.status}
                                </span>
                              </div>
                              
                              {booking.submission_id && (
                                <div className="mb-3">
                                  <p className="text-sm text-gray-600">
                                    <span className="font-medium">Mã đặt lịch:</span>{' '}
                                    <span className="font-mono font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                      {booking.submission_id}
                                    </span>
                                  </p>
                                </div>
                              )}
                              
                              {booking.doctor_name && (
                                <p className="text-gray-700 mb-2">
                                  <span className="font-medium">Bác sĩ:</span> {booking.doctor_name}
                                </p>
                              )}
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600 mb-3">
                                <p>
                                  <span className="font-medium">Ngày khám:</span>{' '}
                                  {formatDate(booking.appointment_date)}
                                </p>
                                <p>
                                  <span className="font-medium">Giờ khám:</span>{' '}
                                  {booking.appointment_time || 'N/A'}
                                </p>
                                <p>
                                  <span className="font-medium">Lý do khám:</span> {booking.reason || 'N/A'}
                                </p>
                                {booking.created_at && (
                                  <p>
                                    <span className="font-medium">Ngày đặt:</span>{' '}
                                    {formatDate(booking.created_at)}
                                  </p>
                                )}
                              </div>
                              
                              {booking.notes && (
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                  <p className="text-sm text-gray-600">
                                    <span className="font-medium">Ghi chú:</span> {booking.notes}
                                  </p>
                                </div>
                              )}
                              
                              {(booking.status === 'pending' || booking.status === 'confirmed') && (
                                <div className="mt-4 flex gap-2">
                                  <a
                                    href={`/check-in/${booking.submission_id || booking.id}`}
                                    className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition text-sm"
                                  >
                                    Xem trang Check-in
                                  </a>
                                  {booking.status === 'pending' && getUserRole() !== 'doctor' && (
                                    <button
                                      onClick={() => handleCancelBooking(booking.id)}
                                      className="px-4 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition text-sm"
                                    >
                                      Hủy lịch
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                    
                    {/* Pagination for patient bookings */}
                    {bookingsPagination && bookingsPagination.totalPages > 1 && (
                      <div className="flex items-center justify-center space-x-2 mt-6">
                        <button
                          onClick={() => setBookingsPage(prev => Math.max(1, prev - 1))}
                          disabled={bookingsPage === 1}
                          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Trước
                        </button>
                        <span className="px-4 py-2 text-gray-700">
                          Trang {bookingsPagination.page} / {bookingsPagination.totalPages} ({bookingsPagination.total} lịch hẹn)
                        </span>
                        <button
                          onClick={() => setBookingsPage(prev => Math.min(bookingsPagination.totalPages, prev + 1))}
                          disabled={bookingsPage === bookingsPagination.totalPages}
                          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Sau
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {isDoctor && activeTab === 'patients' && (
                  <div className="space-y-6">
                    {/* Filter */}
                    <div className="flex items-center space-x-4">
                      <label className="text-sm font-medium text-gray-700">Lọc theo trạng thái:</label>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="all">Tất cả</option>
                        <option value="pending">Chờ xác nhận</option>
                        <option value="confirmed">Đã xác nhận</option>
                        <option value="completed">Hoàn thành</option>
                        <option value="cancelled">Đã hủy</option>
                      </select>
                    </div>

                    {/* Bookings List */}
                    {doctorBookingsLoading ? (
                      <div className="text-center py-12">
                        <p className="text-gray-600">Đang tải lịch hẹn...</p>
                      </div>
                    ) : doctorBookings.length === 0 ? (
                      <div className="text-center py-12">
                        <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">Chưa có lịch hẹn nào</p>
                      </div>
                    ) : (
                      doctorBookings.map((booking) => (
                        <div
                          key={booking.id}
                          className="border border-gray-200 rounded-lg p-6 hover:border-green-300 transition bg-white"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-3">
                                <h3 className="font-semibold text-gray-900 text-lg">
                                  {booking.full_name}
                                </h3>
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                    booking.status
                                  )}`}
                                >
                                  {booking.status === 'confirmed' ? 'Đã xác nhận' :
                                   booking.status === 'pending' ? 'Chờ xác nhận' :
                                   booking.status === 'cancelled' ? 'Đã hủy' :
                                   booking.status === 'completed' ? 'Hoàn thành' : booking.status}
                                </span>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600 mb-3">
                                <p>
                                  <span className="font-medium">Email:</span> {booking.email}
                                </p>
                                <p>
                                  <span className="font-medium">SĐT:</span> {booking.phone}
                                </p>
                                <p>
                                  <span className="font-medium">Khoa:</span> {booking.department}
                                </p>
                                <p>
                                  <span className="font-medium">Ngày khám:</span>{' '}
                                  {formatDate(booking.appointment_date)}
                                </p>
                                <p>
                                  <span className="font-medium">Giờ khám:</span>{' '}
                                  {booking.appointment_time || 'N/A'}
                                </p>
                                {booking.submission_id && (
                                  <p>
                                    <span className="font-medium">Mã đặt lịch:</span>{' '}
                                    <span className="font-mono text-blue-600">{booking.submission_id}</span>
                                  </p>
                                )}
                              </div>
                              
                              {booking.reason && (
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                  <p className="text-sm text-gray-600">
                                    <span className="font-medium">Lý do khám:</span> {booking.reason}
                                  </p>
                                </div>
                              )}
                              
                              {booking.medical_record && (
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                  <p className="text-sm text-gray-600">
                                    <span className="font-medium">Hồ sơ bệnh án:</span>
                                  </p>
                                  <p className="text-sm text-gray-700 mt-1 bg-gray-50 p-3 rounded">
                                    {booking.medical_record}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Actions */}
                          <div className="flex items-center space-x-2 pt-4 border-t border-gray-200">
                            {(booking.status === 'pending' || booking.status === 'confirmed') && (
                              <>
                                <select
                                  value={booking.status}
                                  onChange={(e) => handleStatusChange(booking.id, e.target.value as PatientBooking['status'])}
                                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                >
                                  <option value="pending">Chờ xác nhận</option>
                                  <option value="confirmed">Đã xác nhận</option>
                                  <option value="completed">Hoàn thành</option>
                                </select>
                                <button
                                  onClick={() => handleOpenMedicalRecord(booking)}
                                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
                                >
                                  <FileText className="w-4 h-4" />
                                  <span>Ghi hồ sơ</span>
                                </button>
                              </>
                            )}
                            {booking.status === 'completed' && (
                              <button
                                onClick={() => handleOpenMedicalRecord(booking)}
                                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
                              >
                                <Edit2 className="w-4 h-4" />
                                <span>{booking.medical_record ? 'Sửa hồ sơ' : 'Ghi hồ sơ'}</span>
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                    
                    {/* Pagination for doctor bookings */}
                    {doctorBookingsPagination && doctorBookingsPagination.totalPages > 1 && (
                      <div className="flex items-center justify-center space-x-2 mt-6">
                        <button
                          onClick={() => setDoctorBookingsPage(prev => Math.max(1, prev - 1))}
                          disabled={doctorBookingsPage === 1}
                          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Trước
                        </button>
                        <span className="px-4 py-2 text-gray-700">
                          Trang {doctorBookingsPagination.page} / {doctorBookingsPagination.totalPages} ({doctorBookingsPagination.total} lịch hẹn)
                        </span>
                        <button
                          onClick={() => setDoctorBookingsPage(prev => Math.min(doctorBookingsPagination.totalPages, prev + 1))}
                          disabled={doctorBookingsPage === doctorBookingsPagination.totalPages}
                          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Sau
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Medical Record Modal */}
      {showMedicalRecordModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">
                Ghi hồ sơ bệnh án - {selectedBooking.full_name}
              </h3>
              <button
                onClick={() => {
                  setShowMedicalRecordModal(false);
                  setSelectedBooking(null);
                  setMedicalRecord('');
                }}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-4 space-y-2">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Bệnh nhân:</span> {selectedBooking.full_name}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Ngày khám:</span> {formatDate(selectedBooking.appointment_date)} {selectedBooking.appointment_time}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Khoa:</span> {selectedBooking.department}
                </p>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hồ sơ bệnh án *
                </label>
                <textarea
                  value={medicalRecord}
                  onChange={(e) => setMedicalRecord(e.target.value)}
                  placeholder="Nhập hồ sơ bệnh án, chẩn đoán, đơn thuốc..."
                  rows={10}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowMedicalRecordModal(false);
                    setSelectedBooking(null);
                    setMedicalRecord('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSaveMedicalRecord}
                  disabled={savingRecord || !medicalRecord.trim()}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                >
                  {savingRecord ? 'Đang lưu...' : 'Lưu hồ sơ'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Chatbot user={user}/>
    </div>
  );
};
