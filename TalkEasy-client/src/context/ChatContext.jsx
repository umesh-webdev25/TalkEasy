import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getToken } from '../utils/auth';
import { API_BASE } from '../config/config';
import { useNavigate } from 'react-router-dom';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [activeChat, setActiveChat] = useState(null);
  
  // Sidebar State
  const [activeSidebarView, setActiveSidebarView] = useState('chats'); // 'chats', 'history', 'starred', 'files', 'tools'
  
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
          title: h.toolType ? `${h.toolType} Chat` : 'Chat Session',
          time: new Date(h.last_updated || h.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          preview: h.messages && h.messages.length > 0 ? h.messages[h.messages.length - 1].content.substring(0, 30) + '...' : 'No messages yet',
          isStarred: h.isStarred || false,
          toolType: h.toolType || null
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

  const loadFiles = useCallback(async () => {
    if (!getToken()) return;
    try {
      const response = await fetch(`${API_BASE}/agent/files/all`, { headers: getHeaders() });
      const data = await response.json();
      if (data.success) {
        setFiles(data.files || []);
      }
    } catch (err) {
      console.error("Error loading files", err);
    }
  }, [getHeaders]);

  useEffect(() => {
    if (getToken()) {
      loadChats();
      loadFiles();
    }
  }, [loadChats, loadFiles]);

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

  const createNewChat = (initialText = '', toolType = null) => {
    const newId = Date.now().toString(); // Use a timestamp or UUID for new session
    const newChat = {
      id: newId,
      title: toolType ? `${toolType} Chat` : 'New Conversation',
      time: 'Just Now',
      preview: initialText || 'No messages yet',
      isStarred: false,
      toolType: toolType
    };

    setChats(prev => [newChat, ...prev]);
    setActiveChatId(newId);

    if (initialText) {
      sendMessage(initialText, newId, toolType);
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

  const toggleStarChat = async (id, isStarred) => {
    try {
      const response = await fetch(`${API_BASE}/agent/chat/${id}/star`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ isStarred })
      });
      if (response.ok) {
        setChats(prev => prev.map(c => c.id === id ? { ...c, isStarred } : c));
      }
    } catch (err) {
      console.error("Error toggling star", err);
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

  const sendMessage = async (text, overrideSessionId = null, overrideToolType = null) => {
    const sessionId = overrideSessionId || activeChatId;
    if (!text.trim() || !sessionId) return;
    
    const currentChat = chats.find(c => c.id === sessionId);
    const toolType = overrideToolType || (currentChat ? currentChat.toolType : null);

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
        body: JSON.stringify({ text, toolType })
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

  const handleUploadFile = async (file, linkedChatId = null) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (linkedChatId) {
        formData.append("linked_chat_id", linkedChatId);
      }
      const response = await fetch(`${API_BASE}/agent/files/upload`, {
        method: "POST",
        headers: {
          ...(getToken() ? { 'Authorization': `Bearer ${getToken()}` } : {})
        },
        body: formData
      });
      const data = await response.json();
      if (data.success) {
        await loadFiles();
        return data;
      }
    } catch (err) {
      console.error("Upload error", err);
    }
    return { success: false };
  };

  const deleteFile = async (fileId) => {
    // Optimistically update
    const prevFiles = [...files];
    setFiles(prev => prev.filter(f => f.fileId !== fileId));
    
    try {
      const response = await fetch(`${API_BASE}/agent/files/${fileId}`, {
        method: "DELETE",
        headers: getHeaders()
      });
      const data = await response.json();
      if (!data.success) {
        setFiles(prevFiles);
      }
      return data;
    } catch (err) {
      console.error("Delete error", err);
      setFiles(prevFiles);
      return { success: false };
    }
  };

  const openFile = (file) => {
    createNewChat(`Analyze this file: ${file.fileName}`, 'file_analyzer');
  };

  const analyzeFile = async (fileId, query, sessionId = null) => {
    try {
      const response = await fetch(`${API_BASE}/agent/files/${fileId}/analyze`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ query, sessionId })
      });
      return await response.json();
    } catch (err) {
      console.error("Analyze error", err);
      return { success: false };
    }
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
      toggleStarChat,
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
      setFiles,
      handleUploadFile,
      deleteFile,
      openFile,
      analyzeFile,
      loadChats,
      loadFiles,
      loadingChats,
      activeSidebarView,
      setActiveSidebarView
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
