import { useState, useEffect } from 'react';
import { User, Calendar, Clock, FileText, Save, X, Stethoscope, Pill, Clipboard } from 'lucide-react';
import { doctorService, type PatientBooking } from '../../infrastructure/doctor/doctorService';
import { useToast } from '../contexts/ToastContext';

interface DoctorClinicalPageProps {
  user: any;
  bookingId?: string;
}

export const DoctorClinicalPage = ({ user, bookingId }: DoctorClinicalPageProps) => {
  const { showToast } = useToast();
  const [booking, setBooking] = useState<PatientBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    symptoms: '',
    diagnosis: '',
    prescription: '',
    notes: '',
  });

  // Template suggestions
  const templates = {
    common: {
      symptoms: 'Đau đầu, sốt nhẹ, ho khan',
      diagnosis: 'Cảm cúm thông thường',
      prescription: 'Paracetamol 500mg x 2 viên/ngày\nVitamin C 1000mg x 1 viên/ngày',
    },
    respiratory: {
      symptoms: 'Ho, khó thở, đau ngực',
      diagnosis: 'Viêm phế quản',
      prescription: 'Amoxicillin 500mg x 3 lần/ngày\nThuốc ho siro x 3 lần/ngày',
    },
  };

  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  useEffect(() => {
    if (bookingId) {
      loadBooking();
    } else {
      // Get booking ID from URL
      const path = window.location.pathname;
      if (path.includes('/clinical/')) {
        const id = path.split('/clinical/')[1]?.split('/')[0];
        if (id) {
          loadBookingById(id);
        }
      }
    }
  }, [bookingId]);

  const loadBooking = async () => {
    // Implementation depends on how booking is passed
  };

  const loadBookingById = async (id: string) => {
    setLoading(true);
    try {
      const doctorName = user?.fullname || user?.user_metadata?.full_name || user?.name || '';
      const result = await doctorService.getDoctorBookings(doctorName, {});
      const found = result.bookings.find(b => (b.submission_id || b.id) === id);
      if (found) {
        setBooking(found);
        // Load existing medical record if available
        if (found.medical_record) {
          // Parse medical record (format: symptoms|diagnosis|prescription|notes)
          const parts = found.medical_record.split('|');
          setFormData({
            symptoms: parts[0] || '',
            diagnosis: parts[1] || '',
            prescription: parts[2] || '',
            notes: parts[3] || '',
          });
        }
      } else {
        showToast('Không tìm thấy lịch hẹn', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Không thể tải thông tin', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelect = (templateKey: string) => {
    const template = templates[templateKey as keyof typeof templates];
    if (template) {
      setFormData({
        ...formData,
        symptoms: template.symptoms,
        diagnosis: template.diagnosis,
        prescription: template.prescription,
      });
      setSelectedTemplate(templateKey);
    }
  };

  const handleSave = async () => {
    if (!booking) return;

    setSaving(true);
    try {
      // Combine form data into medical record
      const medicalRecord = `${formData.symptoms}|${formData.diagnosis}|${formData.prescription}|${formData.notes}`;
      
      await doctorService.updateBookingStatus(booking.id, 'completed', medicalRecord);
      showToast('Lưu hồ sơ bệnh án thành công!', 'success');
      
      // Optionally redirect back
      setTimeout(() => {
        window.location.href = '/schedule';
      }, 1500);
    } catch (err: any) {
      showToast(err.message || 'Lưu thất bại', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Keyboard shortcut: Ctrl + S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        if (booking) {
          handleSave();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booking]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 flex items-center justify-center">
        <div className="text-center">
          <X className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Không tìm thấy lịch hẹn</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Khám Bệnh</h1>
            <div className="flex items-center space-x-4 text-gray-600">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5" />
                <span>{booking.appointment_date}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5" />
                <span>{booking.appointment_time}</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Template Selector */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">Mẫu sẵn:</span>
            <button
              onClick={() => handleTemplateSelect('common')}
              className={`px-4 py-2 rounded-lg text-sm transition ${
                selectedTemplate === 'common'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Cảm cúm thông thường
            </button>
            <button
              onClick={() => handleTemplateSelect('respiratory')}
              className={`px-4 py-2 rounded-lg text-sm transition ${
                selectedTemplate === 'respiratory'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Hô hấp
            </button>
          </div>
        </div>

        {/* Main Content - 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Patient Information */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
              <User className="w-6 h-6 text-blue-600" />
              <span>Thông tin bệnh nhân</span>
            </h2>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Họ và tên</p>
                <p className="font-semibold text-gray-900 text-lg">{booking.full_name || booking.fullname}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">Tuổi</p>
                <p className="font-semibold text-gray-900">-</p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">Giới tính</p>
                <p className="font-semibold text-gray-900">-</p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">Số điện thoại</p>
                <p className="font-semibold text-gray-900">{booking.phone}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">Email</p>
                <p className="font-semibold text-gray-900">{booking.email}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">Khoa</p>
                <p className="font-semibold text-gray-900">{booking.department}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">Tiền sử</p>
                <p className="font-semibold text-gray-900">-</p>
              </div>

              {booking.reason && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Lý do khám</p>
                  <p className="font-semibold text-gray-900">{booking.reason}</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Medical Record */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
              <Stethoscope className="w-6 h-6 text-green-600" />
              <span>Hồ sơ khám bệnh</span>
            </h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                  <Clipboard className="w-4 h-4" />
                  <span>Triệu chứng</span>
                </label>
                <textarea
                  value={formData.symptoms}
                  onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                  placeholder="Nhập triệu chứng của bệnh nhân..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                  <Stethoscope className="w-4 h-4" />
                  <span>Chẩn đoán</span>
                </label>
                <textarea
                  value={formData.diagnosis}
                  onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                  placeholder="Nhập chẩn đoán..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                  <Pill className="w-4 h-4" />
                  <span>Đơn thuốc</span>
                </label>
                <textarea
                  value={formData.prescription}
                  onChange={(e) => setFormData({ ...formData, prescription: e.target.value })}
                  placeholder="Nhập đơn thuốc (có thể gợi ý thuốc)..."
                  rows={5}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Gợi ý: Paracetamol, Amoxicillin, Ibuprofen...
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                  <FileText className="w-4 h-4" />
                  <span>Ghi chú</span>
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Ghi chú thêm, hướng dẫn điều trị..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                />
              </div>
            </div>

            {/* Save Button */}
            <div className="mt-6 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Nhấn <kbd className="px-2 py-1 bg-gray-100 rounded">Ctrl + S</kbd> để lưu nhanh
              </p>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>Lưu hồ sơ</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
