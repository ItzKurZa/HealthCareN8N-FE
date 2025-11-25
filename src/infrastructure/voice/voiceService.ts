import { apiClient } from '../../config/api';

export interface VoiceCall {
  id: string;
  appointmentId: string;
  patientName: string;
  phone: string;
  callStatus: string;
  elevenlabsCallId?: string;
  transcript?: string;
  sentiment?: string;
  aiAnalysis?: any;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InitiateCallResponse {
  success: boolean;
  data?: {
    voiceCallId: string;
    callId: string;
    status: string;
    phoneNumber: string;
  };
  error?: string;
  nextAvailableTime?: string;
}

export interface CallStatusResponse {
  success: boolean;
  data?: VoiceCall;
  error?: string;
}

export interface TranscriptResponse {
  success: boolean;
  data?: {
    transcript: string | null;
    sentiment?: string | null;
    aiAnalysis?: any;
    voiceCallId: string;
  };
  error?: string;
}

export interface AllCallsResponse {
  success: boolean;
  data?: VoiceCall[];
  count?: number;
  error?: string;
}

class VoiceService {
  /**
   * Khởi tạo cuộc gọi voice cho appointment
   */
  async initiateCall(appointmentId: string): Promise<InitiateCallResponse> {
    try {
      const response = await apiClient.post<InitiateCallResponse>(
        `/voice-calls/initiate/${appointmentId}`
      );
      return response.data || { success: false, error: 'No response data' };
    } catch (error: any) {
      console.error('Initiate call error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to initiate call',
        nextAvailableTime: error.response?.data?.nextAvailableTime,
      };
    }
  }

  /**
   * Lấy trạng thái cuộc gọi
   */
  async getCallStatus(voiceCallId: string): Promise<CallStatusResponse> {
    try {
      const response = await apiClient.get<CallStatusResponse>(
        `/voice-calls/${voiceCallId}/status`
      );
      return response.data || { success: false, error: 'No response data' };
    } catch (error: any) {
      console.error('Get call status error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to get call status',
      };
    }
  }

  /**
   * Lấy transcript của cuộc gọi
   */
  async getTranscript(voiceCallId: string): Promise<TranscriptResponse> {
    try {
      const response = await apiClient.get<TranscriptResponse>(
        `/voice-calls/${voiceCallId}/transcript`
      );
      return response.data || { success: false, error: 'No response data' };
    } catch (error: any) {
      console.error('Get transcript error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to get transcript',
      };
    }
  }

  /**
   * Lấy danh sách tất cả cuộc gọi
   */
  async getAllCalls(filters?: { status?: string; limit?: number }): Promise<AllCallsResponse> {
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const response = await apiClient.get<AllCallsResponse>(
        `/voice-calls?${params.toString()}`
      );
      return response.data || { success: false, error: 'No response data' };
    } catch (error: any) {
      console.error('Get all calls error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to get calls',
      };
    }
  }

  /**
   * Poll call status until completed or failed
   */
  async pollCallStatus(
    voiceCallId: string,
    onUpdate?: (status: string) => void,
    maxAttempts: number = 60,
    intervalMs: number = 2000
  ): Promise<VoiceCall | null> {
    let attempts = 0;

    return new Promise((resolve) => {
      const interval = setInterval(async () => {
        attempts++;

        const response = await this.getCallStatus(voiceCallId);

        if (response.success && response.data) {
          const status = response.data.callStatus;
          
          if (onUpdate) {
            onUpdate(status);
          }

          // Check if call is in terminal state
          if (
            status === 'completed' ||
            status === 'ended' ||
            status === 'failed' ||
            status === 'cancelled' ||
            attempts >= maxAttempts
          ) {
            clearInterval(interval);
            resolve(response.data);
          }
        } else {
          // Error getting status
          if (attempts >= maxAttempts) {
            clearInterval(interval);
            resolve(null);
          }
        }
      }, intervalMs);
    });
  }

  /**
   * Get call status display text
   */
  getStatusDisplayText(status: string): string {
    const statusMap: { [key: string]: string } = {
      INITIATED: 'Đang khởi tạo...',
      RINGING: 'Đang gọi...',
      IN_PROGRESS: 'Đang gọi...',
      ACTIVE: 'Đang trong cuộc gọi',
      completed: 'Hoàn thành',
      ended: 'Đã kết thúc',
      failed: 'Thất bại',
      cancelled: 'Đã hủy',
      SUCCESS: 'Thành công',
      FAILED: 'Thất bại',
    };

    return statusMap[status] || status;
  }

  /**
   * Get status color for UI
   */
  getStatusColor(status: string): string {
    const colorMap: { [key: string]: string } = {
      INITIATED: 'blue',
      RINGING: 'blue',
      IN_PROGRESS: 'blue',
      ACTIVE: 'green',
      completed: 'green',
      ended: 'gray',
      failed: 'red',
      cancelled: 'gray',
      SUCCESS: 'green',
      FAILED: 'red',
    };

    return colorMap[status] || 'gray';
  }
}

export default new VoiceService();
