import { useState, useRef, useCallback, useEffect } from 'react';
import { WS_BASE } from '../config/config';
import { getToken } from '../utils/auth';
import { useAudioPlayback } from './useAudioPlayback';
import { useChat } from '../context/ChatContext';

export const useVoiceStream = () => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [error, setError] = useState(null);
  
  const wsRef = useRef(null);
  const audioContextRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const workletNodeRef = useRef(null);
  
  const { queueAudioChunk, isPlaying, stopPlayback } = useAudioPlayback();
  const { sendMessage, setListening, activeChatId, appendMessagesLocal } = useChat();

  const cleanup = useCallback(() => {
    if (workletNodeRef.current) {
      workletNodeRef.current.disconnect();
      workletNodeRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsStreaming(false);
    setListening(false);
  }, [setListening]);

  const transcriptRef = useRef('');

  const connectWebSocket = useCallback(() => {
    return new Promise((resolve, reject) => {
      const token = getToken();
      const wsUrl = `${WS_BASE}/ws/audio-stream${token ? `?token=${token}` : ''}`;
      
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('WebSocket connected');
        resolve(ws);
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'partial_transcript' || data.type === 'final_transcript') {
            setTranscript(data.text);
            if (data.type === 'final_transcript') {
              transcriptRef.current = data.text;
            }
          } else if (data.type === 'llm_streaming_chunk') {
            setAiResponse(prev => prev + data.chunk);
          } else if (data.type === 'tts_audio_chunk') {
            queueAudioChunk(data.audio_base64, data.is_final);
          } else if (data.type === 'llm_streaming_complete') {
            queueAudioChunk('', true);
            if (activeChatId && appendMessagesLocal) {
              const newMsgs = [];
              if (transcriptRef.current) {
                newMsgs.push({
                  id: Date.now().toString() + '-u',
                  sender: 'user',
                  text: transcriptRef.current,
                  time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                });
              }
              if (data.complete_response) {
                newMsgs.push({
                  id: Date.now().toString() + '-ai',
                  sender: 'ai',
                  text: data.complete_response,
                  time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                });
              }
              if (newMsgs.length > 0) {
                appendMessagesLocal(activeChatId, newMsgs, data.complete_response || transcriptRef.current);
              }
              transcriptRef.current = ''; // reset after appending
            }
          } else if (data.type === 'error' || data.type === 'tts_streaming_error' || data.type === 'transcription_error' || data.type === 'llm_streaming_error') {
            setError(data.message);
            cleanup();
          }
        } catch (err) {
          console.error('Error parsing WS message:', err);
        }
      };
      
      ws.onerror = (err) => {
        console.error('WebSocket error:', err);
        setError('WebSocket connection failed');
        reject(err);
      };
      
      ws.onclose = () => {
        console.log('WebSocket closed');
        cleanup();
      };
      
      wsRef.current = ws;
    });
  }, [queueAudioChunk, activeChatId, cleanup]);

  const startStreaming = async () => {
    setError(null);
    setTranscript('');
    setAiResponse('');
    stopPlayback();
    
    try {
      const ws = await connectWebSocket();
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 16000
        } 
      });
      mediaStreamRef.current = stream;
      
      const audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = audioContext;
      
      await audioContext.audioWorklet.addModule('/audio-processor.js');
      
      const source = audioContext.createMediaStreamSource(stream);
      const workletNode = new AudioWorkletNode(audioContext, 'audio-processor');
      workletNodeRef.current = workletNode;
      
      workletNode.port.onmessage = (event) => {
        if (ws.readyState === WebSocket.OPEN) {
          // Send raw PCM Int16 audio chunk
          ws.send(event.data);
        }
      };
      
      source.connect(workletNode);
      workletNode.connect(audioContext.destination);
      
      setIsStreaming(true);
      setListening(true);
    } catch (err) {
      console.error('Failed to start streaming:', err);
      setError(err.message || 'Microphone access denied or error occurred');
      cleanup();
    }
  };

  const stopStreaming = () => {
    // We can stop capturing audio, but keep websocket open to receive final response and TTS
    if (workletNodeRef.current) {
      workletNodeRef.current.disconnect();
      workletNodeRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    // Optional: send a 'end_of_stream' message if backend expects it
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      // wsRef.current.send(JSON.stringify({ type: 'end_of_stream' }));
    }
    setIsStreaming(false);
    setListening(false);
  };

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    isStreaming,
    isPlaying,
    transcript,
    aiResponse,
    error,
    startStreaming,
    stopStreaming,
    cleanup
  };
};
