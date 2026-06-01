import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getToken } from '../utils/auth';
import { API_BASE } from '../config/config';
import { useNavigate } from 'react-router-dom';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [activeChat, setActiveChat] = useState(null);
  
  const [voiceMode, setVoiceMode] = useState(false);
  const [listening, setListening] = useState(false);
  const [typing, setTyping] = useState(false);
  const [loadingChats, setLoadingChats] = useState(false);
  
  // Settings
  const [assistantMode, setAssistantMode] = useState('Professional');
  const [webSearch, setWebSearch] = useState(true);
  const [memory, setMemory] = useState(true);
  const [images, setImages] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  // Files
  const [files, setFiles] = useState([]);
  const navigate = useNavigate();

  const getHeaders = useCallback(() => {
    const token = getToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  }, []);

  const loadChats = useCallback(async () => {
    if (!getToken()) return;
    setLoadingChats(true);
    try {
      const response = await fetch(`${API_BASE}/agent/chat/all`, { headers: getHeaders() });
      const data = await response.json();
      if (data.success && data.chat_histories) {
        const formatted = data.chat_histories.map(h => ({
          id: h.session_id,
          title: 'Chat Session',
          time: new Date(h.last_updated || h.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          preview: h.messages && h.messages.length > 0 ? h.messages[h.messages.length - 1].content.substring(0, 30) + '...' : 'No messages yet',
        }));
        setChats(formatted);
        if (formatted.length > 0 && !activeChatId) {
          setActiveChatId(formatted[0].id);
        }
      }
    } catch (err) {
      console.error("Error loading chats", err);
    } finally {
      setLoadingChats(false);
    }
  }, [getHeaders, activeChatId]);

  useEffect(() => {
    if (getToken()) {
      loadChats();
    }
  }, [loadChats]);

  const loadHistory = useCallback(async (sessionId) => {
    if (!sessionId || !getToken()) return;
    try {
      const response = await fetch(`${API_BASE}/agent/chat/${sessionId}/history`, { headers: getHeaders() });
      const data = await response.json();
      if (data.success || Array.isArray(data)) {
        const historyData = Array.isArray(data) ? data : (data.messages || []);
        
        setActiveChat(prev => {
          const formattedHistory = historyData.map((m, i) => ({
            id: `msg-${i}`,
            sender: m.role === 'user' ? 'user' : 'ai',
            text: m.content,
            time: m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''
          }));

          // Preserve optimistic messages if backend returns empty history for a newly created session
          if (historyData.length === 0 && prev && prev.id === sessionId && prev.messages && prev.messages.length > 0) {
            return prev;
          }

          return {
            ...(prev && prev.id === sessionId ? prev : { id: sessionId, title: 'Chat Session' }),
            id: sessionId,
            messages: formattedHistory
          };
        });
      }
    } catch (err) {
      console.error("Error loading history", err);
    }
  }, [getHeaders]);

  useEffect(() => {
    if (activeChatId) {
      loadHistory(activeChatId);
    } else {
      setActiveChat(null);
    }
  }, [activeChatId, loadHistory]);

  const createNewChat = (initialText = '') => {
    const newId = Date.now().toString(); // Use a timestamp or UUID for new session
    const newChat = {
      id: newId,
      title: 'New Conversation',
      time: 'Just Now',
      preview: initialText || 'No messages yet',
    };

    setChats(prev => [newChat, ...prev]);
    setActiveChatId(newId);

    if (initialText) {
      sendMessage(initialText, newId);
    }
  };

  const deleteChat = async (id) => {
    try {
      const response = await fetch(`${API_BASE}/agent/chat/${id}/history`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (response.ok) {
        setChats(prev => prev.filter(c => c.id !== id));
        if (activeChatId === id) {
          const remaining = chats.filter(c => c.id !== id);
          if (remaining.length > 0) {
            setActiveChatId(remaining[0].id);
          } else {
            setActiveChatId(null);
          }
        }
      }
    } catch (err) {
      console.error("Error deleting chat", err);
    }
  };

  const appendMessagesLocal = useCallback((sessionId, newMessages, previewText) => {
    setActiveChat(prev => prev && prev.id === sessionId ? {
      ...prev,
      messages: [...(prev.messages || []), ...newMessages]
    } : prev);
    
    if (previewText) {
      setChats(prev => prev.map(c => c.id === sessionId ? { ...c, preview: previewText, time: 'Just Now' } : c));
    }
  }, []);

  const sendMessage = async (text, overrideSessionId = null) => {
    const sessionId = overrideSessionId || activeChatId;
    if (!text.trim() || !sessionId) return;

    const userMsg = {
      id: Date.now().toString() + '-u',
      sender: 'user',
      text: text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Optimistically update UI
    setActiveChat(prev => prev ? {
      ...prev,
      messages: [...(prev.messages || []), userMsg]
    } : {
      id: sessionId,
      title: 'Chat Session',
      messages: [userMsg]
    });
    
    setChats(prev => prev.map(c => c.id === sessionId ? { ...c, preview: text, time: 'Just Now' } : c));

    setTyping(true);
    try {
      const response = await fetch(`${API_BASE}/agent/chat/${sessionId}/text`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ text })
      });
      
      const data = await response.json();
      
      if (data.success && data.llm_response) {
        const aiMsg = {
          id: Date.now().toString() + '-ai',
          sender: 'ai',
          text: data.llm_response,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        
        setActiveChat(prev => prev && prev.id === sessionId ? {
          ...prev,
          messages: [...(prev.messages || []), aiMsg]
        } : prev);
        
        setChats(prev => prev.map(c => c.id === sessionId ? { ...c, preview: data.llm_response.substring(0, 30) + '...' } : c));
      } else if (response.status === 401) {
        navigate('/login');
      }
    } catch (err) {
      console.error("Error sending message", err);
    } finally {
      setTyping(false);
    }
  };

  // Voice Interaction Placeholders
  const startVoiceInput = () => {
    setListening(true);
    // VoiceStream hook will handle actual audio capturing and sending
  };

  const stopVoiceInput = () => {
    setListening(false);
  };

  const handleUploadFile = (file) => {
    setFiles(prev => [
      {
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        type: file.name.split('.').pop().toUpperCase(),
        color: file.name.endsWith('.pdf') ? 'red' : file.name.endsWith('.csv') ? 'green' : 'orange'
      },
      ...prev
    ]);
  };

  return (
    <ChatContext.Provider value={{
      chats,
      activeChatId,
      activeChat,
      setActiveChatId,
      sendMessage,
      appendMessagesLocal,
      createNewChat,
      deleteChat,
      voiceMode,
      setVoiceMode,
      listening,
      setListening,
      startVoiceInput,
      stopVoiceInput,
      typing,
      assistantMode,
      setAssistantMode,
      webSearch,
      setWebSearch,
      memory,
      setMemory,
      images,
      setImages,
      settingsOpen,
      setSettingsOpen,
      files,
      handleUploadFile,
      loadChats,
      loadingChats
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
