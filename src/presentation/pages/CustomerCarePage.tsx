import { useState } from 'react';
import { 
  HeadphonesIcon, 
  ClipboardList, 
  Phone, 
  ArrowLeft,
  Send,
  Star,
  Loader2,
  CheckCircle,
  XCircle,
  Search,
  User,
  Stethoscope,
  Calendar
} from 'lucide-react';
import { apiClient } from '../../config/api';
import { VoiceSurveyPage } from './VoiceSurveyPage';

interface AppointmentInfo {
  id: string;
  bookingId: string;
  patientName: string;
  phone: string;
  email?: string;
  doctorName: string;
  appointmentDate: string;
  status: string;
}

interface SurveyFormData {
  nps: number;
  csat: number;
  facility: number;
  staff_doctor: string;
  staff_reception: string;
  staff_nurse: string;
  waiting_time: string;
  comment: string;
}

type ViewMode = 'selection' | 'survey' | 'call';

export const CustomerCarePage = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('selection');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Lookup state
  const [lookupPhone, setLookupPhone] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [appointmentInfo, setAppointmentInfo] = useState<AppointmentInfo | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

  // Survey form state
  const [surveyData, setSurveyData] = useState<SurveyFormData>({
    nps: 0,
    csat: 0,
    facility: 0,
    staff_doctor: '',
    staff_reception: '',
    staff_nurse: '',
    waiting_time: '',
    comment: ''
  });

  // Lookup appointment by phone
  const handleLookup = async () => {
    if (!lookupPhone) {
      setLookupError('Vui lòng nhập số điện thoại');
      return;
    }

    try {
      setLookupLoading(true);
      setLookupError(null);
      setAppointmentInfo(null);

      const response = await apiClient.get<{ success: boolean; data?: AppointmentInfo; error?: string }>(
        `/appointments/lookup?phone=${encodeURIComponent(lookupPhone)}`
      );

      // response is already the parsed JSON data (not wrapped in .data)
      const result = response as unknown as { success: boolean; data?: AppointmentInfo; error?: string };
      
      if (result.success && result.data) {
        setAppointmentInfo(result.data);
      } else {
        setLookupError(result.error || 'Không tìm thấy lịch hẹn với số điện thoại này');
      }
    } catch (err: any) {
      setLookupError('Không tìm thấy lịch hẹn. Vui lòng kiểm tra lại số điện thoại.');
    } finally {
      setLookupLoading(false);
    }
  };

  const handleSelectSurvey = () => {
    setViewMode('survey');
    setSubmitSuccess(false);
    setError(null);
  };

  const handleSelectCall = () => {
    setViewMode('call');
    setError(null);
  };

  const handleBack = () => {
    setViewMode('selection');
    setLookupPhone('');
    setAppointmentInfo(null);
    setLookupError(null);
    setSurveyData({
      nps: 0,
      csat: 0,
      facility: 0,
      staff_doctor: '',
      staff_reception: '',
      staff_nurse: '',
      waiting_time: '',
      comment: ''
    });
    setError(null);
    setSubmitSuccess(false);
  };

  // Submit survey
  const handleSubmitSurvey = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!appointmentInfo) {
      setError('Vui lòng tra cứu thông tin lịch hẹn trước');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        booking_id: appointmentInfo.bookingId,
        patient_name: appointmentInfo.patientName,
        phone: appointmentInfo.phone,
        email: appointmentInfo.email || null,
        doctor_name: appointmentInfo.doctorName,
        nps: surveyData.nps,
        csat: surveyData.csat,
        facility: surveyData.facility,
        staff_attitude: {
          doctor_label: surveyData.staff_doctor,
          reception_label: surveyData.staff_reception,
          nurse_label: surveyData.staff_nurse
        },
        waiting_time: surveyData.waiting_time,
        comment: surveyData.comment
      };

      const response = await apiClient.post<{ success: boolean; error?: string }>('/surveys/submit', payload);
      
      // response is already the parsed JSON data
      const result = response as unknown as { success: boolean; error?: string };
      
      if (result.success) {
        setSubmitSuccess(true);
        // Reset form after 3 seconds
        setTimeout(() => {
          handleBack();
        }, 3000);
      } else {
        setError(result.error || 'Không thể gửi khảo sát');
      }
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra');
    } finally {
      setSubmitting(false);
    }
  };



  // Rating component
  const StarRating = ({ 
    value, 
    onChange, 
    max = 5,
    label 
  }: { 
    value: number; 
    onChange: (v: number) => void; 
    max?: number;
    label: string;
  }) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="flex gap-1">
        {[...Array(max)].map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onChange(i + 1)}
            className="focus:outline-none"
          >
            <Star
              className={`w-8 h-8 transition-colors ${
                i < value ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
      <span className="text-sm text-gray-500">{value}/{max}</span>
    </div>
  );

  // NPS Rating (0-10)
  const NPSRating = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Bạn có sẵn sàng giới thiệu phòng khám cho người thân/bạn bè không? (NPS)
      </label>
      <div className="flex gap-1">
        {[...Array(11)].map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onChange(i)}
            className={`w-10 h-10 rounded-lg font-medium transition-colors ${
              i === value 
                ? i <= 6 ? 'bg-red-500 text-white' 
                  : i <= 8 ? 'bg-yellow-500 text-white'
                  : 'bg-green-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {i}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-xs text-gray-500">
        <span>Không bao giờ</span>
        <span>Rất có thể</span>
      </div>
    </div>
  );

  // Selection View
  if (viewMode === 'selection') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center mb-8">
          <HeadphonesIcon className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-800">Chăm Sóc Khách Hàng</h1>
          <p className="text-gray-600 mt-2">Chọn phương thức khảo sát phù hợp với bạn</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Survey Form Option */}
          <div 
            onClick={handleSelectSurvey}
            className="bg-white rounded-2xl shadow-lg p-8 cursor-pointer transform transition hover:scale-105 hover:shadow-xl border-2 border-transparent hover:border-blue-500"
          >
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ClipboardList className="w-10 h-10 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Form Khảo Sát</h2>
              <p className="text-gray-600">
                Điền form đánh giá trải nghiệm của bạn tại phòng khám
              </p>
              <ul className="mt-4 text-left text-sm text-gray-500 space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Đánh giá theo thang điểm
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Nhận xét chi tiết
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Nhanh chóng, tiện lợi
                </li>
              </ul>
            </div>
          </div>

          {/* Voice Call Option */}
          <div 
            onClick={handleSelectCall}
            className="bg-white rounded-2xl shadow-lg p-8 cursor-pointer transform transition hover:scale-105 hover:shadow-xl border-2 border-transparent hover:border-green-500"
          >
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Gọi Điện Khảo Sát</h2>
              <p className="text-gray-600">
                Trò chuyện với AI để chia sẻ trải nghiệm của bạn
              </p>
              <ul className="mt-4 text-left text-sm text-gray-500 space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Trò chuyện tự nhiên
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  AI phân tích cảm xúc
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Powered by ElevenLabs
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Survey Form View
  if (viewMode === 'survey') {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Quay lại
        </button>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <ClipboardList className="w-12 h-12 text-blue-600 mx-auto mb-3" />
            <h1 className="text-2xl font-bold text-gray-800">Form Khảo Sát</h1>
            <p className="text-gray-600">Đánh giá trải nghiệm của bạn tại phòng khám</p>
          </div>

          {submitSuccess ? (
            <div className="text-center py-12">
              <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Cảm ơn bạn!</h2>
              <p className="text-gray-600">Phản hồi của bạn đã được ghi nhận</p>
            </div>
          ) : (
            <form onSubmit={handleSubmitSurvey} className="space-y-6">
              {/* Phone Lookup */}
              <div className="bg-blue-50 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nhập số điện thoại để tra cứu thông tin <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    value={lookupPhone}
                    onChange={(e) => setLookupPhone(e.target.value)}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nhập số điện thoại (VD: 0912345678)"
                  />
                  <button
                    type="button"
                    onClick={handleLookup}
                    disabled={lookupLoading}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
                  >
                    {lookupLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Search className="w-5 h-5" />
                    )}
                    Tra cứu
                  </button>
                </div>
                {lookupError && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <XCircle className="w-4 h-4" />
                    {lookupError}
                  </p>
                )}
              </div>

              {/* Appointment Info Display */}
              {appointmentInfo && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-medium text-green-800 mb-3 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Thông tin lịch khám
                  </h3>
                  <div className="grid md:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-gray-700">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">Bệnh nhân:</span>
                      <span>{appointmentInfo.patientName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">SĐT:</span>
                      <span>{appointmentInfo.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Stethoscope className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">Bác sĩ khám:</span>
                      <span className="text-blue-600 font-medium">{appointmentInfo.doctorName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">Ngày khám:</span>
                      <span>{new Date(appointmentInfo.appointmentDate).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Only show survey questions if appointment is found */}
              {appointmentInfo && (
                <>
                  {/* NPS Score */}
                  <NPSRating 
                    value={surveyData.nps} 
                    onChange={(v) => setSurveyData({...surveyData, nps: v})} 
                  />

                  {/* CSAT Score */}
                  <StarRating
                    value={surveyData.csat}
                    onChange={(v) => setSurveyData({...surveyData, csat: v})}
                    label="Mức độ hài lòng chung (CSAT)"
                  />

                  {/* Facility Score */}
                  <StarRating
                    value={surveyData.facility}
                    onChange={(v) => setSurveyData({...surveyData, facility: v})}
                    label="Cơ sở vật chất"
                  />

                  {/* Staff Attitude */}
                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Đánh giá thái độ nhân viên
                    </label>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Bác sĩ</label>
                        <select
                          value={surveyData.staff_doctor}
                          onChange={(e) => setSurveyData({...surveyData, staff_doctor: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        >
                          <option value="">Chọn đánh giá</option>
                          <option value="Rất hài lòng">Rất hài lòng</option>
                          <option value="Hài lòng">Hài lòng</option>
                          <option value="Bình thường">Bình thường</option>
                          <option value="Không hài lòng">Không hài lòng</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Lễ tân</label>
                        <select
                          value={surveyData.staff_reception}
                          onChange={(e) => setSurveyData({...surveyData, staff_reception: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        >
                          <option value="">Chọn đánh giá</option>
                          <option value="Rất hài lòng">Rất hài lòng</option>
                          <option value="Hài lòng">Hài lòng</option>
                          <option value="Bình thường">Bình thường</option>
                          <option value="Không hài lòng">Không hài lòng</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Điều dưỡng</label>
                        <select
                          value={surveyData.staff_nurse}
                          onChange={(e) => setSurveyData({...surveyData, staff_nurse: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        >
                          <option value="">Chọn đánh giá</option>
                          <option value="Rất hài lòng">Rất hài lòng</option>
                          <option value="Hài lòng">Hài lòng</option>
                          <option value="Bình thường">Bình thường</option>
                          <option value="Không hài lòng">Không hài lòng</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Waiting Time */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Thời gian chờ đợi
                    </label>
                    <select
                      value={surveyData.waiting_time}
                      onChange={(e) => setSurveyData({...surveyData, waiting_time: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                    >
                      <option value="">Chọn thời gian chờ</option>
                      <option value="Dưới 15 phút">Dưới 15 phút</option>
                      <option value="15-30 phút">15-30 phút</option>
                      <option value="30-60 phút">30-60 phút</option>
                      <option value="Trên 60 phút">Trên 60 phút</option>
                    </select>
                  </div>

                  {/* Comment */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Góp ý thêm
                    </label>
                    <textarea
                      value={surveyData.comment}
                      onChange={(e) => setSurveyData({...surveyData, comment: e.target.value})}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none"
                      placeholder="Chia sẻ thêm ý kiến của bạn..."
                    />
                  </div>

                  {error && (
                    <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg flex items-center gap-2">
                      <XCircle className="w-5 h-5" />
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting || !appointmentInfo}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Đang gửi...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Gửi đánh giá
                      </>
                    )}
                  </button>
                </>
              )}
            </form>
          )}
        </div>
      </div>
    );
  }

  // Voice Call View - Sử dụng VoiceSurveyPage component
  if (viewMode === 'call') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Quay lại
        </button>

        <VoiceSurveyPage />
      </div>
    );
  }

  return null;
};
