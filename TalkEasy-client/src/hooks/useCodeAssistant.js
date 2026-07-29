import { useState, useCallback } from 'react';
import { codeService } from '../services/code.service.js';

export const useCodeAssistant = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  const generateCode = useCallback(async (prompt, token) => {
    setIsGenerating(true);
    setError(null);
    try {
      const response = await codeService.generateCode(prompt, token);
      return response.data.content;
    } catch (err) {
      setError(err.error || 'Failed to generate code');
      throw err;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return { generateCode, isGenerating, error };
};
