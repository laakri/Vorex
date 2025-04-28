import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface VoiceAgentResponse {
  response: string;
  action?: {
    type: string;
    payload: any;
  };
}

export const voiceAgentService = {
  async sendMessage(message: string): Promise<VoiceAgentResponse> {
    try {
      const response = await axios.post(`${API_URL}/api/chat`, {
        message,
      });
      return response.data;
    } catch (error) {
      console.error('Error sending message to voice agent:', error);
      throw error;
    }
  },
}; 