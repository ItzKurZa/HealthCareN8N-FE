import { apiClient } from '../../config/api';
// XÓA dòng import ChatMessage nếu không dùng đến để hết báo lỗi "never read"

export interface ChatbotResponse {
  user: any;
  reply: string;
  [key: string]: any;
}

export const chatbotService = {
  async sendMessage(message: string, user_id: string): Promise<ChatbotResponse> {
    try {
      // Gọi API
      const response = await apiClient.post<ChatbotResponse>('/chatbot/send', {
        user_id,
        message,
      });

      // SỬA: Kiểm tra xem response.data có tồn tại không
      if (!response.data) {
        throw new Error('No response data received');
      }

      // SỬA: Trả về toàn bộ object data (bao gồm user và reply)
      // Thay vì return response.reply (chỉ là string), ta trả về đúng kiểu ChatbotResponse
      return response.data;

    } catch (error: any) {
      console.error('Error sending message:', error);
      
      // Trả về object fallback đúng chuẩn ChatbotResponse
      return { 
        reply: 'Something went wrong. Please try again later.', 
        user: null 
      };
    }
  },
};