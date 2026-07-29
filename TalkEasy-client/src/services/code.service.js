import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api/v1';

export const codeService = {
  generateCode: async (prompt, token) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/code/generate`, { prompt, options: { stream: false } }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};
