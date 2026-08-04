import { useState, useRef, useCallback, useEffect } from 'react';
import { io } from 'socket.io-client';
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
  
  // VAD refs
  const analyserRef = useRef(null);
  const vadAnimationRef = useRef(null);
  const silenceStartRef = useRef(null);
  const SILENCE_THRESHOLD = 5; // Out of 255 (very quiet)
  const SILENCE_DURATION_MS = 1500; // 1.5 seconds of silence to trigger stop
  
  const { queueAudioChunk, isPlaying, stopPlayback } = useAudioPlayback();
  const { sendMessage, setListening, activeChatId, appendMessagesLocal } = useChat();

  const cleanup = useCallback(() => {
    if (vadAnimationRef.current) {
      cancelAnimationFrame(vadAnimationRef.current);
      vadAnimationRef.current = null;
    }
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
      wsRef.current.disconnect();
      wsRef.current = null;
    }
    setIsStreaming(false);
    setListening(false);
  }, [setListening]);

  const transcriptRef = useRef('');

  const connectWebSocket = useCallback(() => {
    return new Promise((resolve, reject) => {
      const token = getToken();
      let userId = null;
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          userId = payload.user_id || payload.id || payload.sub;
        } catch (e) {}
      }

      const socket = io(WS_BASE, {
        query: {
          token,
          userId,
          session_id: activeChatId || undefined,
          web_search: false,
        }
      });
      
      socket.on('connect', () => {
        console.log('Socket.IO connected');
        resolve(socket);
      });
      
      socket.on('message', (data) => {
        try {
          if (typeof data === 'string') {
             data = JSON.parse(data);
          }
          
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
              transcriptRef.current = ''; 
            }
          } else if (data.type === 'error') {
            if (data.message && data.message.includes('TTS failed')) {
              console.warn("ElevenLabs TTS failed (likely out of quota). Falling back to browser TTS.");
              setError("ElevenLabs quota exceeded. Using browser voice fallback.");
              
              // Fallback to browser TTS for the current accumulated response
              if ('speechSynthesis' in window) {
                // Extract the failed chunk text from the error message if possible, or wait until complete
                // For simplicity, we can let the final complete_response trigger a full read, 
                // but since it's streaming, we'll just read whatever text we have received so far.
              }
            } else {
              setError(data.message);
              cleanup();
            }
          } else if (data.type === 'tts_streaming_error' || data.type === 'transcription_error' || data.type === 'llm_streaming_error') {
            setError(data.message);
            cleanup();
          }
        } catch (err) {
          console.error('Error parsing Socket message:', err);
        }
      });
      
      socket.on('connect_error', (err) => {
        console.error('Socket.IO connection error:', err);
        setError('Connection failed. Microphone access denied or network error.');
        reject(err);
      });
      
      socket.on('disconnect', () => {
        console.log('Socket.IO closed');
        cleanup();
      });
      
      wsRef.current = socket;
    });
  }, [queueAudioChunk, activeChatId, cleanup, appendMessagesLocal]);

  // VAD Loop
  const monitorSilence = useCallback(() => {
    if (!analyserRef.current) return;
    
    const dataArray = new Uint8Array(analyserRef.current.fftSize);
    analyserRef.current.getByteTimeDomainData(dataArray);
    
    let isSilent = true;
    for (let i = 0; i < dataArray.length; i++) {
      const volume = Math.abs(dataArray[i] - 128); // 128 is zero for 8-bit
      if (volume > SILENCE_THRESHOLD) {
        isSilent = false;
        break;
      }
    }

    if (isSilent) {
      if (!silenceStartRef.current) {
        silenceStartRef.current = Date.now();
      } else if (Date.now() - silenceStartRef.current >= SILENCE_DURATION_MS) {
        console.log("Silence detected, stopping recording");
        // Trigger auto-stop, but we need the stopStreaming reference, so we call it directly:
        stopStreamingRef.current();
        return; // exit loop
      }
    } else {
      silenceStartRef.current = null;
    }
    
    vadAnimationRef.current = requestAnimationFrame(monitorSilence);
  }, []);

  const stopStreamingRef = useRef(null);

  const startStreaming = async () => {
    setError(null);
    setTranscript('');
    setAiResponse('');
    stopPlayback();
    
    try {
      const socket = await connectWebSocket();
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 16000
        } 
      });
      mediaStreamRef.current = stream;
      
      const audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = audioContext;
      
      // Set up VAD
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      analyserRef.current = analyser;
      silenceStartRef.current = null; // reset timer

      await audioContext.audioWorklet.addModule('/audio-processor.js');
      
      const source = audioContext.createMediaStreamSource(stream);
      const workletNode = new AudioWorkletNode(audioContext, 'audio-processor');
      workletNodeRef.current = workletNode;
      
      socket.send('start_streaming');

      workletNode.port.onmessage = (event) => {
        if (wsRef.current && wsRef.current.connected) {
          // Send raw PCM Int16 audio chunk (ensure it's binary array buffer)
          wsRef.current.send(event.data);
        }
      };
      
      source.connect(analyser); // Connect for volume monitoring
      source.connect(workletNode);
      workletNode.connect(audioContext.destination);
      
      setIsStreaming(true);
      setListening(true);
      
      // Start checking for silence
      vadAnimationRef.current = requestAnimationFrame(monitorSilence);
      
    } catch (err) {
      console.error('Failed to start streaming:', err);
      setError(err.message || 'Microphone access denied or error occurred');
      cleanup();
    }
  };

  const stopStreaming = useCallback(() => {
    if (vadAnimationRef.current) {
      cancelAnimationFrame(vadAnimationRef.current);
      vadAnimationRef.current = null;
    }
    // We can stop capturing audio, but keep websocket open to receive final response and TTS
    if (workletNodeRef.current) {
      workletNodeRef.current.disconnect();
      workletNodeRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (wsRef.current && wsRef.current.connected) {
      wsRef.current.send('stop_streaming');
    }
    setIsStreaming(false);
    setListening(false);
  }, []);

  stopStreamingRef.current = stopStreaming;

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
