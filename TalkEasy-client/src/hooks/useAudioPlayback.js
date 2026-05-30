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
      audioContextRef.current.resume();
    }

    isPlayingRef.current = true;
    setIsPlaying(true);
    
    const audioData = audioQueueRef.current.shift();
    
    try {
      // Decode the audio data
      const audioBuffer = await audioContextRef.current.decodeAudioData(audioData);
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      
      source.onended = () => {
        playNextInQueue();
      };
      
      source.start(0);
    } catch (error) {
      console.error('Error decoding audio data:', error);
      playNextInQueue(); // Skip this chunk on error
    }
  }, []);

  const base64ToArrayBuffer = (base64) => {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  };

  const chunkBufferRef = useRef([]);

  const queueAudioChunk = useCallback((base64Audio, isFinal) => {
    const arrayBuffer = base64ToArrayBuffer(base64Audio);
    chunkBufferRef.current.push(arrayBuffer);
    
    if (isFinal) {
      // Concatenate all chunks into a single ArrayBuffer
      const totalLength = chunkBufferRef.current.reduce((acc, val) => acc + val.byteLength, 0);
      const combined = new Uint8Array(totalLength);
      let offset = 0;
      for (const buffer of chunkBufferRef.current) {
        combined.set(new Uint8Array(buffer), offset);
        offset += buffer.byteLength;
      }
      
      audioQueueRef.current.push(combined.buffer);
      chunkBufferRef.current = [];
      
      if (!isPlayingRef.current) {
        playNextInQueue();
      }
    }
  }, [playNextInQueue]);

  const stopPlayback = useCallback(() => {
    audioQueueRef.current = [];
    chunkBufferRef.current = [];
    setIsPlaying(false);
    isPlayingRef.current = false;
    // We cannot easily stop a currently playing BufferSource without a reference,
    // but clearing the queue prevents further playback.
    // Ideally, we'd keep a ref to the active sourceNode and call sourceNode.stop().
  }, []);

  return {
    isPlaying,
    queueAudioChunk,
    stopPlayback
  };
};
