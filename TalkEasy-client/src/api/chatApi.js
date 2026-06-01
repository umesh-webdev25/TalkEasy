import api from "./client";

export const sendTextMessage = async (
  sessionId,
  message
) => {
  const response = await api.post(
    `/agent/chat/${sessionId}/text`,
    {
      message,
    }
  );

  return response.data;
};

export const getChatHistory = async (
  sessionId
) => {
  const response = await api.get(
    `/agent/chat/${sessionId}/history`
  );

  return response.data;
};

export const clearChatHistory = async (
  sessionId
) => {
  const response = await api.delete(
    `/agent/chat/${sessionId}/history`
  );

  return response.data;
};

export const getAllChats = async () => {
  const response = await api.get(
    "/agent/chat/all"
  );

  return response.data;
};

export const searchChatMessages = async (query, sessionId = null) => {
  let url = `/agent/chat/search?query=${encodeURIComponent(query)}`;
  if (sessionId) {
    url += `&session_id=${encodeURIComponent(sessionId)}`;
  }
  const response = await api.get(url);
  return response.data;
};