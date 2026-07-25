import api from "./client";

export const sendTextMessage = async (
  sessionId,
  message
) => {
  const response = await api.post(
    `/chat/text/${sessionId}`,
    {
      text: message,
    }
  );

  return response.data;
};

export const getChatHistory = async (
  sessionId
) => {
  const response = await api.get(
    `/chat/history/${sessionId}`
  );

  return response.data;
};

export const clearChatHistory = async (
  sessionId
) => {
  const response = await api.delete(
    `/chat/history/${sessionId}`
  );

  return response.data;
};

export const getAllChats = async () => {
  const response = await api.get(
    "/chat/history"
  );

  return response.data;
};

export const searchChatMessages = async (query, sessionId = null) => {
  let url = `/chat/search?query=${encodeURIComponent(query)}`;
  if (sessionId) {
    url += `&session_id=${encodeURIComponent(sessionId)}`;
  }
  const response = await api.get(url);
  return response.data;
};