import { useState, useEffect, useRef, useCallback } from 'react';

export const useAudioPlayback = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef(null);
  const audioQueueRef = useRef([]);
  const isPlayingRef = useRef(false);

  useEffect(() => {
    // Initialize AudioContext on first user interaction
    const initAudioContext = () => {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      } else if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
    };
    
    window.addEventListener('click', initAudioContext, { once: true });
    return () => {
      window.removeEventListener('click', initAudioContext);
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const playNextInQueue = useCallback(async () => {
    if (audioQueueRef.current.length === 0) {
      setIsPlaying(false);
      isPlayingRef.current = false;
      return;
    }

    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    isPlayingRef.current = true;
    setIsPlaying(true);
    
    const audioData = audioQueueRef.current.shift();
    
    try {
      // Decode the audio data
      const audioBuffer = await audioContextRef.current.decodeAudioData(audioData);
      const source = audioContextRef.current.createBufferSource();
      activeSourceRef.current = source;
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      
      source.onended = () => {
        if (activeSourceRef.current === source) {
          activeSourceRef.current = null;
        }
        playNextInQueue();
      };
      
      source.start(0);
    } catch (error) {
      console.error('Error decoding audio data:', error);
      playNextInQueue(); // Skip this chunk on error
    }
  }, []);

  const base64ToArrayBuffer = (base64) => {
    if (!base64) return new ArrayBuffer(0);
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  };

  const activeSourceRef = useRef(null);

  const queueAudioChunk = useCallback((base64Audio, isFinal) => {
    const arrayBuffer = base64ToArrayBuffer(base64Audio);
    
    if (arrayBuffer.byteLength > 0) {
      audioQueueRef.current.push(arrayBuffer);
      
      if (!isPlayingRef.current) {
        playNextInQueue();
      }
    }
  }, [playNextInQueue]);

  const stopPlayback = useCallback(() => {
    audioQueueRef.current = [];
    setIsPlaying(false);
    isPlayingRef.current = false;
    if (activeSourceRef.current) {
      try {
        activeSourceRef.current.stop();
      } catch (e) {
        console.error('Error stopping playback:', e);
      }
      activeSourceRef.current = null;
    }
  }, []);

  return {
    isPlaying,
    queueAudioChunk,
    stopPlayback
  };
};
