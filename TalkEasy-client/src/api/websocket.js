import { WS_BASE } from "../config/config";

export const createAudioSocket = (token = "") => {  
  const url = `${WS_BASE}/ws/audio-stream${token ? `?token=${token}` : ""}`;
  return new WebSocket(url);
};