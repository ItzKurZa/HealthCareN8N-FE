import { useState, useEffect } from 'react';
import { Phone, RefreshCw, Clock, CheckCircle, XCircle, Loader2, MessageSquare } from 'lucide-react';
import voiceService, { VoiceCall } from '../../infrastructure/voice/voiceService';
import { VoiceCallButton } from '../components/VoiceCallButton';

interface Appointment {
  id: string;
  fullName: string;
  phone: string;
  doctor: string;
  startTimeLocal: string;
  voice_call_attempted?: boolean;
  voice_call_status?: string;
  voice_call_id?: string;
}

export const VoiceCallPage = () => {
  const [calls, setCalls] = useState<VoiceCall[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCall, setSelectedCall] = useState<VoiceCall | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'failed'>('all');

  useEffect(() => {
    loadData();
  }, [filter]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load voice calls
      const filterStatus = filter === 'all' ? undefined : 
                          filter === 'pending' ? 'INITIATED' :
                          filter === 'completed' ? 'completed' : 'failed';
      
      const callsResponse = await voiceService.getAllCalls({ 
        status: filterStatus,
        limit: 50 
      });

      if (callsResponse.success && callsResponse.data) {
        setCalls(callsResponse.data);
      }

      // TODO: Load appointments from your appointments service
      // For now, using empty array
      setAppointments([]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const viewTranscript = async (call: VoiceCall) => {
    setSelectedCall(call);
    setTranscript(null);

    if (call.id) {
      const response = await voiceService.getTranscript(call.id);
      if (response.success && response.data?.transcript) {
        setTranscript(response.data.transcript);
      }
    }
  };

  const getStatusIcon = (status: string) => {
    if (status === 'completed' || status === 'SUCCESS') {
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    } else if (status === 'failed' || status === 'FAILED') {
      return <XCircle className="w-5 h-5 text-red-600" />;
    } else {
      return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />;
    }
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'N/A';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString('vi-VN');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Phone className="w-8 h-8 text-blue-600" />
                Voice Call Management
              </h1>
              <p className="text-gray-600 mt-2">
                Quản lý cuộc gọi voice với ElevenLabs AI Agent
              </p>
            </div>
            <button
              onClick={loadData}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Làm mới
            </button>
          </div>

          {/* Filters */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg transition ${
                filter === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg transition ${
                filter === 'pending' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Đang xử lý
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-4 py-2 rounded-lg transition ${
                filter === 'completed' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Hoàn thành
            </button>
            <button
              onClick={() => setFilter('failed')}
              className={`px-4 py-2 rounded-lg transition ${
                filter === 'failed' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Thất bại
            </button>
          </div>
        </div>

        {/* Appointments with Call Button */}
        {appointments.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Danh sách bệnh nhân cần gọi
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bệnh nhân
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Số điện thoại
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bác sĩ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thời gian
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {appointments.map((apt) => (
                    <tr key={apt.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {apt.fullName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {apt.phone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {apt.doctor}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(apt.startTimeLocal)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <VoiceCallButton
                          appointmentId={apt.id}
                          patientName={apt.fullName}
                          phoneNumber={apt.phone}
                          onCallStarted={() => loadData()}
                          onCallCompleted={() => loadData()}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Call History */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Lịch sử cuộc gọi ({calls.length})
          </h2>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Đang tải...</span>
            </div>
          ) : calls.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Phone className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>Chưa có cuộc gọi nào</p>
            </div>
          ) : (
            <div className="space-y-3">
              {calls.map((call) => (
                <div
                  key={call.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition cursor-pointer"
                  onClick={() => viewTranscript(call)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(call.callStatus)}
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {call.patientName}
                        </h3>
                        <p className="text-sm text-gray-500">{call.phone}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-700">
                        {voiceService.getStatusDisplayText(call.callStatus)}
                      </p>
                      <p className="text-xs text-gray-500 flex items-center gap-1 justify-end">
                        <Clock className="w-3 h-3" />
                        {formatDate(call.createdAt)}
                      </p>
                    </div>
                  </div>

                  {call.sentiment && (
                    <div className="mt-2">
                      <span className={`text-xs px-2 py-1 rounded ${
                        call.sentiment === 'POSITIVE' ? 'bg-green-100 text-green-800' :
                        call.sentiment === 'NEGATIVE' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {call.sentiment}
                      </span>
                    </div>
                  )}

                  {call.transcript && (
                    <button
                      className="mt-2 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        viewTranscript(call);
                      }}
                    >
                      <MessageSquare className="w-4 h-4" />
                      Xem transcript
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Transcript Modal */}
        {selectedCall && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedCall(null)}
          >
            <div
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Transcript - {selectedCall.patientName}
                </h3>

                <div className="mb-4 space-y-2">
                  <p className="text-sm text-gray-600">
                    <strong>Số điện thoại:</strong> {selectedCall.phone}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Trạng thái:</strong>{' '}
                    {voiceService.getStatusDisplayText(selectedCall.callStatus)}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Thời gian:</strong> {formatDate(selectedCall.createdAt)}
                  </p>
                  {selectedCall.sentiment && (
                    <p className="text-sm text-gray-600">
                      <strong>Sentiment:</strong>{' '}
                      <span className={`px-2 py-1 rounded ${
                        selectedCall.sentiment === 'POSITIVE' ? 'bg-green-100 text-green-800' :
                        selectedCall.sentiment === 'NEGATIVE' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedCall.sentiment}
                      </span>
                    </p>
                  )}
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Nội dung cuộc gọi:</h4>
                  {transcript === null ? (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Đang tải transcript...
                    </div>
                  ) : transcript ? (
                    <p className="text-gray-700 whitespace-pre-wrap">{transcript}</p>
                  ) : (
                    <p className="text-gray-500 italic">
                      Transcript chưa khả dụng
                    </p>
                  )}
                </div>

                <button
                  onClick={() => setSelectedCall(null)}
                  className="mt-4 w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
