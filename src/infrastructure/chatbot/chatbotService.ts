import { apiClient } from '../../config/api';
import type { ChatMessage } from '../../shared/types';

export interface ChatbotResponse {
  user: any;
  reply: string;
  [key: string]: any;
}

export const chatbotService = {
  async sendMessage(message: string, user_id: string): Promise<ChatbotResponse> {
    try {
      const response = await apiClient.post<ChatbotResponse>('/chatbot/send', {
        user_id,
        message,
      });

      return response.reply;
    } catch (error: any) {
      console.error('Error sending message:', error);
      return { reply: 'Something went wrong. Please try again later.', user: null };
    }
  },
};
