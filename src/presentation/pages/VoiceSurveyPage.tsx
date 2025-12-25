import { useState } from 'react';
import { Phone, Search, User, Calendar, Stethoscope, Loader2, ExternalLink } from 'lucide-react';
import voiceService from '../../infrastructure/voice/voiceService';

interface AppointmentInfo {
  id: string;
  fullName: string;
  phone: string;
  doctor: string;
  appointmentDate: string;
}

export const VoiceSurveyPage = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [appointmentInfo, setAppointmentInfo] = useState<AppointmentInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCallStarting, setIsCallStarting] = useState(false);
  const [callSuccess, setCallSuccess] = useState(false);
  const [sessionUrl, setSessionUrl] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!phoneNumber.trim()) {
      setError('Vui lòng nhập số điện thoại');
      return;
    }

    setLoading(true);
    setError(null);
    setAppointmentInfo(null);
    setCallSuccess(false);

    try {
      // TODO: Replace with actual API call to search appointment by phone
      // For now, using mock data
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock appointment data
      setAppointmentInfo({
        id: 'apt_' + Date.now(),
        fullName: 'Nguyễn Thị Nguyên',
        phone: phoneNumber,
        doctor: 'BS. Phạm Minh Đức',
        appointmentDate: '2025-11-26',
      });
    } catch (err) {
      setError('Không tìm thấy thông tin lịch hẹn');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const startVoiceCall = async () => {
    if (!appointmentInfo) return;

    setIsCallStarting(true);
    setError(null);
    setCallSuccess(false);
    setSessionUrl(null);
    
    try {
      console.log('🎯 Initiating voice call for:', appointmentInfo.fullName);
      
      // Gọi backend để lưu thông tin lịch hẹn + tạo ElevenLabs conversation
      const response = await fetch('https://bennett-unvanquishable-liquidly.ngrok-free.dev/api/voice-calls/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({
          appointmentId: appointmentInfo.id,
          patientName: appointmentInfo.fullName,
          phone: appointmentInfo.phone,
          doctor: appointmentInfo.doctor,
          appointmentDate: appointmentInfo.appointmentDate
        })
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Không thể khởi tạo cuộc gọi');
      }

      console.log('✅ Voice call initiated:', result.data);
      
      // Tạo URL với agent ID
      const agentId = 'agent_0301kd7d8z2ae25rnr5ear1qxhft';
      const url = `https://elevenlabs.io/app/talk-to?agent_id=${agentId}`;
      
      setSessionUrl(url);
      setCallSuccess(true);
      
      // Auto-open in new window
      setTimeout(() => {
        const callWindow = window.open(url, 'ElevenLabsCall', 'width=800,height=600,resizable=yes');
        
        if (!callWindow) {
          setError('Trình duyệt chặn popup. Vui lòng click nút "Mở cửa sổ gọi" bên dưới.');
        } else {
          console.log('✅ Voice call window opened successfully');
        }
      }, 300);
      
    } catch (err: any) {
      console.error('Start call error:', err);
      setError(err.message || 'Không thể bắt đầu cuộc gọi. Vui lòng thử lại.');
    } finally {
      setIsCallStarting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <Phone className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Gọi Điện Khảo Sát
          </h1>
          <p className="text-gray-600">
            Trò chuyện với AI qua ElevenLabs
          </p>
        </div>

        {/* Search Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Search className="inline w-4 h-4 mr-1" />
            Tra cứu theo số điện thoại *
          </label>
          <div className="flex gap-3">
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Nhập số điện thoại để kiểm tra lịch hẹn"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Đang tìm...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Tra cứu
                </>
              )}
            </button>
          </div>
          {error && !appointmentInfo && (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          )}
          <p className="mt-2 text-sm text-gray-500">
            Nhập số điện thoại để kiểm tra lịch hẹn
          </p>
        </div>

        {/* Appointment Info */}
        {appointmentInfo && (
          <div className="bg-white rounded-lg shadow-lg p-8 animate-fadeIn">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Phone className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                Thông tin lịch hẹn
              </h2>
            </div>

            <div className="bg-green-50 rounded-lg p-6 mb-6 space-y-3">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="text-sm text-gray-600">Họ tên</p>
                  <p className="font-semibold text-gray-900">{appointmentInfo.fullName}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="text-sm text-gray-600">Số điện thoại</p>
                  <p className="font-semibold text-gray-900">{appointmentInfo.phone}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Stethoscope className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="text-sm text-gray-600">Bác sĩ</p>
                  <p className="font-semibold text-gray-900">{appointmentInfo.doctor}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="text-sm text-gray-600">Ngày khám</p>
                  <p className="font-semibold text-gray-900">{appointmentInfo.appointmentDate}</p>
                </div>
              </div>
            </div>

            {/* Start Call Button */}
            <button
              onClick={startVoiceCall}
              disabled={isCallStarting || callSuccess}
              className={`w-full px-6 py-4 rounded-lg transition flex items-center justify-center gap-3 text-lg font-semibold shadow-lg hover:shadow-xl disabled:cursor-not-allowed ${
                callSuccess
                  ? 'bg-green-600 text-white'
                  : 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400'
              }`}
            >
              {isCallStarting ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Đang khởi tạo cuộc gọi...
                </>
              ) : callSuccess ? (
                <>
                  <Phone className="w-6 h-6" />
                  ✅ Cuộc gọi đã được khởi tạo!
                </>
              ) : (
                <>
                  <Phone className="w-6 h-6" />
                  Bắt đầu cuộc gọi khảo sát
                </>
              )}
            </button>

            {callSuccess && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg space-y-3">
                <p className="text-sm text-green-800 font-semibold">
                  ✅ Phiên gọi đã được tạo thành công!
                </p>
                <p className="text-sm text-green-700">
                  Cửa sổ gọi sẽ mở tự động. Nếu không thấy, click nút bên dưới:
                </p>
                {sessionUrl && (
                  <a
                    href={sessionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Mở cửa sổ gọi
                  </a>
                )}
              </div>
            )}

            {error && appointmentInfo && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <p className="mt-4 text-sm text-gray-500 text-center">
              Hệ thống sẽ mở cửa sổ mới để bắt đầu cuộc gọi với AI
            </p>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <p className="text-sm text-blue-800">
            <strong>Powered by ElevenLabs</strong> Voice AI
          </p>
        </div>
      </div>
    </div>
  );
};
