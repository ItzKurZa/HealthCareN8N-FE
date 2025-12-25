import { Phone, Loader2 } from 'lucide-react';
import { useState } from 'react';
import voiceService from '../../infrastructure/voice/voiceService';

interface VoiceCallButtonProps {
  appointmentId: string;
  patientName: string;
  phoneNumber: string;
  disabled?: boolean;
  onCallStarted?: (voiceCallId: string) => void;
  onCallCompleted?: (status: string) => void;
  onError?: (error: string) => void;
}

export const VoiceCallButton = ({
  appointmentId,
  patientName,
  phoneNumber,
  disabled = false,
  onCallStarted,
  onCallCompleted,
  onError,
}: VoiceCallButtonProps) => {
  const [isInitiating, setIsInitiating] = useState(false);
  const [isInCall, setIsInCall] = useState(false);
  const [callStatus, setCallStatus] = useState<string>('');
  const [voiceCallId, setVoiceCallId] = useState<string | null>(null);

  const handleInitiateCall = async () => {
    setIsInitiating(true);
    setCallStatus('Đang khởi tạo cuộc gọi...');

    try {
      const response = await voiceService.initiateCall(appointmentId);

      if (response.success && response.data) {
        const { voiceCallId: newCallId, status } = response.data;
        setVoiceCallId(newCallId);
        setIsInCall(true);
        setCallStatus(voiceService.getStatusDisplayText(status));

        if (onCallStarted) {
          onCallStarted(newCallId);
        }

        // Start polling for status updates
        pollCallStatus(newCallId);
      } else {
        const errorMsg = response.error || 'Không thể khởi tạo cuộc gọi';
        setCallStatus(errorMsg);
        
        if (onError) {
          onError(errorMsg);
        }

        // Show error for 3 seconds then reset
        setTimeout(() => {
          setCallStatus('');
          setIsInitiating(false);
        }, 3000);
      }
    } catch (error: any) {
      const errorMsg = error.message || 'Lỗi kết nối';
      setCallStatus(errorMsg);
      
      if (onError) {
        onError(errorMsg);
      }

      setTimeout(() => {
        setCallStatus('');
        setIsInitiating(false);
      }, 3000);
    }
  };

  const pollCallStatus = async (callId: string) => {
    try {
      const finalCall = await voiceService.pollCallStatus(
        callId,
        (status) => {
          setCallStatus(voiceService.getStatusDisplayText(status));
        }
      );

      if (finalCall) {
        setIsInCall(false);
        setIsInitiating(false);
        setCallStatus(voiceService.getStatusDisplayText(finalCall.callStatus));

        if (onCallCompleted) {
          onCallCompleted(finalCall.callStatus);
        }

        // Reset after 5 seconds
        setTimeout(() => {
          setCallStatus('');
          setVoiceCallId(null);
        }, 5000);
      } else {
        setIsInCall(false);
        setIsInitiating(false);
        setCallStatus('Không thể theo dõi trạng thái cuộc gọi');

        setTimeout(() => {
          setCallStatus('');
          setVoiceCallId(null);
        }, 3000);
      }
    } catch (error) {
      setIsInCall(false);
      setIsInitiating(false);
      setCallStatus('Lỗi theo dõi cuộc gọi');

      setTimeout(() => {
        setCallStatus('');
        setVoiceCallId(null);
      }, 3000);
    }
  };

  const getButtonColor = () => {
    if (disabled || isInitiating) return 'bg-gray-400 cursor-not-allowed';
    if (isInCall) return 'bg-green-600 hover:bg-green-700';
    return 'bg-blue-600 hover:bg-blue-700';
  };

  const getStatusColor = () => {
    if (!callStatus) return '';
    if (callStatus.includes('Thất bại') || callStatus.includes('Lỗi')) {
      return 'text-red-600';
    }
    if (callStatus.includes('Hoàn thành') || callStatus.includes('Thành công')) {
      return 'text-green-600';
    }
    return 'text-blue-600';
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleInitiateCall}
        disabled={disabled || isInitiating || isInCall}
        className={`${getButtonColor()} text-white px-4 py-2 rounded-lg transition flex items-center gap-2`}
        title={`Gọi cho ${patientName} - ${phoneNumber}`}
      >
        {isInitiating || isInCall ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Đang gọi...</span>
          </>
        ) : (
          <>
            <Phone className="w-4 h-4" />
            <span className="text-sm">Gọi điện</span>
          </>
        )}
      </button>

      {callStatus && (
        <div className={`text-xs ${getStatusColor()} text-center max-w-xs`}>
          {callStatus}
        </div>
      )}

      {voiceCallId && (
        <div className="text-xs text-gray-500">
          ID: {voiceCallId.substring(0, 8)}...
        </div>
      )}
    </div>
  );
};
