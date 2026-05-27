const WS_BASE =
  import.meta.env.VITE_WS_BASE;

export const createAudioSocket = () => {  
  return new WebSocket(
    `${WS_BASE}/ws/audio-stream`
  );
};