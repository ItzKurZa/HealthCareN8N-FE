import { useState, useEffect } from 'react';
import { Search, Calendar, Clock, User, Phone, Mail, Building2, Stethoscope, FileText, CheckCircle, XCircle, AlertCircle, X, Edit2, Trash2 } from 'lucide-react';
import { bookingService } from '../../infrastructure/booking/bookingService';
import { useToast } from '../contexts/ToastContext';
import type { Booking, Department, Doctor } from '../../shared/types';

export const LookupPage = () => {
  const { showToast } = useToast();
  const [searchType, setSearchType] = useState<'id' | 'phone'>('id');
  const [searchValue, setSearchValue] = useState('');
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [departments, setDepartments] = useState<(Department | string)[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [editFormData, setEditFormData] = useState({
    department: '',
    doctorId: '',
    appointmentDate: '',
    appointmentTime: '',
    reason: '',
    notes: '',
  });

  const timeSlots = [
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '12:00 PM', '12:30 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
    '04:00 PM', '04:30 PM', '05:00 PM',
  ];

  useEffect(() => {
    if (showEditModal) {
      loadDepartmentsAndDoctors();
    }
  }, [showEditModal]);

  useEffect(() => {
    if (editFormData.department && doctors.length > 0) {
      const filtered = doctors.filter((doc) => {
        const docDeptId = typeof doc.department_id === 'string' 
          ? doc.department_id 
          : doc.department_id;
        return docDeptId === editFormData.department;
      });
      setFilteredDoctors(filtered);
    } else {
      setFilteredDoctors([]);
    }
  }, [editFormData.department, doctors]);

  const loadDepartmentsAndDoctors = async () => {
    try {
      const { departments: depts, doctors: docs } = await bookingService.getDepartmentsAndDoctors();
      setDepartments(depts);
      setDoctors(docs);
    } catch (err: any) {
      showToast('Không thể tải danh sách khoa và bác sĩ', 'error');
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchValue.trim()) {
      showToast('Vui lòng nhập thông tin tra cứu', 'warning');
      return;
    }

    setLoading(true);
    setBooking(null);
    setSearched(true);

    try {
      if (searchType === 'id') {
        // Tra cứu theo mã đặt lịch
        const bookingData = await bookingService.getBookingById(searchValue.trim());
        setBooking(bookingData);
        showToast('Tìm thấy thông tin đặt lịch!', 'success');
      } else {
        // Tra cứu theo số điện thoại
        // TODO: Cần tạo API endpoint mới cho search by phone
        showToast('Tính năng tra cứu theo số điện thoại đang được phát triển', 'info');
      }
    } catch (err: any) {
      setBooking(null);
      showToast(err.message || 'Không tìm thấy thông tin đặt lịch', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled':
      case 'canceled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'completed':
        return CheckCircle;
      case 'cancelled':
      case 'canceled':
        return XCircle;
      case 'pending':
        return AlertCircle;
      default:
        return AlertCircle;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Đã xác nhận';
      case 'pending':
        return 'Đang chờ';
      case 'cancelled':
      case 'canceled':
        return 'Đã hủy';
      case 'completed':
        return 'Đã hoàn thành';
      default:
        return status;
    }
  };

  const handleCancelBooking = async () => {
    if (!booking) return;
    
    if (!window.confirm('Bạn có chắc chắn muốn hủy lịch hẹn này?')) {
      return;
    }

    setCancelling(true);
    try {
      const bookingCode = booking.submission_id || booking.id;
      await bookingService.cancelBookingByCode(bookingCode);
      // Refresh booking data
      const updatedBooking = await bookingService.getBookingById(bookingCode);
      setBooking(updatedBooking);
      showToast('Hủy lịch hẹn thành công!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Hủy lịch hẹn thất bại', 'error');
    } finally {
      setCancelling(false);
    }
  };

  const handleOpenEditModal = () => {
    if (!booking) return;
    
    // Parse appointment date and time from booking
    let appointmentDate = '';
    if (booking.appointment_date) {
      // Check if already in YYYY-MM-DD format
      if (booking.appointment_date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        appointmentDate = booking.appointment_date;
      } else {
        // Try to parse as Date and convert to YYYY-MM-DD
        try {
          const date = new Date(booking.appointment_date);
          if (!isNaN(date.getTime())) {
            // Use local date to avoid timezone issues
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            appointmentDate = `${year}-${month}-${day}`;
          } else {
            appointmentDate = booking.appointment_date;
          }
        } catch (err) {
          appointmentDate = booking.appointment_date;
        }
      }
    }
    
    const appointmentTime = booking.appointment_time || '';
    
    setEditFormData({
      department: booking.department || '',
      doctorId: booking.doctor_name || '',
      appointmentDate: appointmentDate,
      appointmentTime: appointmentTime,
      reason: booking.reason || '',
      notes: booking.notes || '',
    });
    setShowEditModal(true);
  };

  const handleUpdateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking) return;

    setUpdating(true);
    try {
      const selectedDoctor = doctors.find((d) => d.name === editFormData.doctorId);
      const bookingCode = booking.submission_id || booking.id;
      
      // Validate: nếu có date thì phải có time và ngược lại
      if (editFormData.appointmentDate && !editFormData.appointmentTime) {
        showToast('Vui lòng chọn cả ngày và giờ khám', 'error');
        setUpdating(false);
        return;
      }
      
      if (editFormData.appointmentTime && !editFormData.appointmentDate) {
        showToast('Vui lòng chọn cả ngày và giờ khám', 'error');
        setUpdating(false);
        return;
      }
      
      const updatePayload: any = {
        department: editFormData.department,
        reason: editFormData.reason || 'Khám bệnh',
      };
      
      if (selectedDoctor?.name) {
        updatePayload.doctor_name = selectedDoctor.name;
      }
      
      // Chỉ gửi date và time nếu cả hai đều có
      if (editFormData.appointmentDate && editFormData.appointmentTime) {
        updatePayload.appointment_date = editFormData.appointmentDate;
        updatePayload.appointment_time = editFormData.appointmentTime;
      }
      
      if (editFormData.notes) {
        updatePayload.notes = editFormData.notes;
      }
      
      await bookingService.updateBookingByCode(bookingCode, updatePayload);
      
      // Refresh booking data
      const updatedBooking = await bookingService.getBookingById(bookingCode);
      setBooking(updatedBooking);
      setShowEditModal(false);
      showToast('Thay đổi lịch hẹn thành công!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Thay đổi lịch hẹn thất bại', 'error');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Search className="w-10 h-10 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">Tra Cứu Lịch Hẹn</h1>
          </div>
          <p className="text-lg text-gray-600">
            Nhập mã đặt lịch để tra cứu thông tin lịch hẹn của bạn
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <form onSubmit={handleSearch} className="space-y-6">
            {/* Search Type Toggle */}
            <div className="flex items-center space-x-4 mb-6">
              <span className="text-sm font-medium text-gray-700">Tra cứu theo:</span>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => {
                    setSearchType('id');
                    setSearchValue('');
                    setBooking(null);
                    setSearched(false);
                  }}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                    searchType === 'id'
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Mã đặt lịch
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSearchType('phone');
                    setSearchValue('');
                    setBooking(null);
                    setSearched(false);
                  }}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                    searchType === 'phone'
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  disabled
                >
                  Số điện thoại (Sắp có)
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {searchType === 'id' ? 'Mã đặt lịch' : 'Số điện thoại'}
              </label>
              <div className="flex space-x-3">
                <input
                  type={searchType === 'id' ? 'text' : 'tel'}
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder={searchType === 'id' ? 'Nhập mã đặt lịch (ví dụ: abc123)' : 'Nhập số điện thoại'}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Đang tìm...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-5 h-5" />
                      <span>Tìm kiếm</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Results */}
        {searched && !loading && (
          <>
            {booking ? (
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                {/* Status Banner */}
                <div className={`${getStatusColor(booking.status)} px-6 py-4 border-b-2`}>
                  <div className="flex items-center space-x-3">
                    {(() => {
                      const StatusIcon = getStatusIcon(booking.status);
                      return <StatusIcon className="w-6 h-6" />;
                    })()}
                    <div>
                      <h2 className="text-xl font-bold">Thông Tin Đặt Lịch</h2>
                      <p className="text-sm opacity-90">Trạng thái: {getStatusText(booking.status)}</p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {/* Booking Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <div className="bg-blue-100 p-2 rounded-lg">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Họ và tên</p>
                          <p className="font-semibold text-gray-900">{booking.full_name}</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <div className="bg-blue-100 p-2 rounded-lg">
                          <Phone className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Số điện thoại</p>
                          <p className="font-semibold text-gray-900">{booking.phone || 'N/A'}</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <div className="bg-blue-100 p-2 rounded-lg">
                          <Mail className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Email</p>
                          <p className="font-semibold text-gray-900">{booking.email || 'N/A'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <div className="bg-blue-100 p-2 rounded-lg">
                          <Calendar className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Ngày khám</p>
                          <p className="font-semibold text-gray-900">
                            {booking.appointment_date
                              ? new Date(booking.appointment_date).toLocaleDateString('vi-VN', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                })
                              : 'N/A'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <div className="bg-blue-100 p-2 rounded-lg">
                          <Clock className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Giờ khám</p>
                          <p className="font-semibold text-gray-900">{booking.appointment_time || 'N/A'}</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <div className="bg-blue-100 p-2 rounded-lg">
                          <Building2 className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Khoa</p>
                          <p className="font-semibold text-gray-900">{booking.department || 'N/A'}</p>
                        </div>
                      </div>

                      {booking.doctor_name && (
                        <div className="flex items-start space-x-3">
                          <div className="bg-blue-100 p-2 rounded-lg">
                            <Stethoscope className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Bác sĩ</p>
                            <p className="font-semibold text-gray-900">{booking.doctor_name}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Booking ID */}
                  <div className="bg-blue-50 rounded-lg p-4 mb-6">
                    <p className="text-sm text-gray-500 mb-1">Mã đặt lịch</p>
                    <p className="font-mono text-lg font-bold text-blue-600">{booking.submission_id || booking.id}</p>
                  </div>

                  {/* Reason & Notes */}
                  {booking.reason && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <p className="text-sm text-gray-500 mb-1">Lý do khám</p>
                      <p className="text-gray-900">{booking.reason}</p>
                    </div>
                  )}

                  {booking.notes && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-500 mb-1">Ghi chú</p>
                      <p className="text-gray-900">{booking.notes}</p>
                    </div>
                  )}

                  {/* Actions */}
                  {(booking.status === 'pending' || booking.status === 'confirmed') && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <div className="flex flex-col sm:flex-row gap-3">
                        <a
                          href={`/check-in/${booking.submission_id || booking.id}`}
                          className="inline-flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                        >
                          <FileText className="w-5 h-5" />
                          <span>Xem trang Check-in</span>
                        </a>
                        
                        <button
                          onClick={handleOpenEditModal}
                          className="inline-flex items-center justify-center space-x-2 px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition font-medium"
                        >
                          <Edit2 className="w-5 h-5" />
                          <span>Thay đổi lịch</span>
                        </button>
                        
                        <button
                          onClick={handleCancelBooking}
                          disabled={cancelling}
                          className="inline-flex items-center justify-center space-x-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {cancelling ? (
                            <>
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                              <span>Đang hủy...</span>
                            </>
                          ) : (
                            <>
                              <Trash2 className="w-5 h-5" />
                              <span>Hủy lịch</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Không tìm thấy thông tin</h3>
                <p className="text-gray-600 mb-6">
                  Vui lòng kiểm tra lại mã đặt lịch hoặc liên hệ với phòng khám để được hỗ trợ.
                </p>
                <button
                  onClick={() => {
                    setSearchValue('');
                    setSearched(false);
                    setBooking(null);
                  }}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  Tra cứu lại
                </button>
              </div>
            )}
          </>
        )}

        {/* Info Section */}
        {!searched && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Hướng dẫn tra cứu</h3>
            <div className="space-y-3 text-gray-600">
              <div className="flex items-start space-x-3">
                <div className="bg-blue-100 rounded-full p-1 mt-1">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                </div>
                <p>Nhập mã đặt lịch mà bạn đã nhận được sau khi đặt lịch thành công</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-blue-100 rounded-full p-1 mt-1">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                </div>
                <p>Mã đặt lịch thường được gửi qua email hoặc SMS sau khi đặt lịch</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-blue-100 rounded-full p-1 mt-1">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                </div>
                <p>Nếu không tìm thấy, vui lòng kiểm tra lại mã hoặc liên hệ phòng khám</p>
              </div>
            </div>
          </div>
        )}

        {/* Edit Booking Modal */}
        {showEditModal && booking && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Thay Đổi Lịch Hẹn</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleUpdateBooking} className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Khoa *
                  </label>
                  <select
                    value={editFormData.department}
                    onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value, doctorId: '' })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Chọn khoa</option>
                    {departments.map((dept, index) => {
                      const deptValue = typeof dept === 'string' ? dept : (dept.name || dept.id);
                      const deptLabel = typeof dept === 'string' ? dept : (dept.name || dept.id);
                      return (
                        <option key={index} value={deptValue}>
                          {deptLabel}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bác sĩ
                  </label>
                  <select
                    value={editFormData.doctorId}
                    onChange={(e) => setEditFormData({ ...editFormData, doctorId: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={!editFormData.department}
                  >
                    <option value="">Bất kỳ bác sĩ nào có sẵn</option>
                    {filteredDoctors.map((doctor, index) => (
                      <option key={index} value={doctor.name}>
                        {doctor.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ngày hẹn *
                    </label>
                    <input
                      type="date"
                      value={editFormData.appointmentDate}
                      onChange={(e) => setEditFormData({ ...editFormData, appointmentDate: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Giờ hẹn *
                    </label>
                    <select
                      value={editFormData.appointmentTime}
                      onChange={(e) => setEditFormData({ ...editFormData, appointmentTime: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Chọn giờ</option>
                      {timeSlots.map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lý do khám bệnh *
                  </label>
                  <textarea
                    value={editFormData.reason}
                    onChange={(e) => setEditFormData({ ...editFormData, reason: e.target.value })}
                    placeholder="Mô tả lý do khám bệnh, triệu chứng..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ghi chú thêm (Tùy chọn)
                  </label>
                  <textarea
                    value={editFormData.notes}
                    onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                    placeholder="Thông tin bổ sung..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={updating}
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {updating ? 'Đang cập nhật...' : 'Cập nhật lịch'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
