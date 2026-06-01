import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../context/ChatContext';
import { useVoiceStream } from '../hooks/useVoiceStream';
import { Send, Mic, Paperclip, Globe, Volume2, Copy, ThumbsUp, ThumbsDown, Check, X, ShieldAlert, Sparkles, Sliders, VolumeX, Eye, Image, FileText } from 'lucide-react';
import Button from '../components/ui/Button';
import TypingIndicator from '../components/ui/TypingIndicator';
import VoiceOrb from '../components/ui/VoiceOrb';
import VoiceVisualizer from '../components/ui/VoiceVisualizer';
import Modal from '../components/ui/Modal';
import Card from '../components/ui/Card';

const ChatPage = () => {
  const {
    activeChat,
    sendMessage,
    typing,
    voiceMode,
    setVoiceMode,
    settingsOpen,
    setSettingsOpen,
    assistantMode,
    setAssistantMode,
    webSearch,
    setWebSearch,
    memory,
    setMemory,
    images,
    setImages,
    handleUploadFile
  } = useChat();

  const [inputValue, setInputValue] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [speakingId, setSpeakingId] = useState(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const messagesEndRef = useRef(null);
  const imageInputRef = useRef(null);
  const docInputRef = useRef(null);

  const { isStreaming, isPlaying, transcript, aiResponse, startStreaming, stopStreaming, error: voiceError } = useVoiceStream();

  // Settings states inside modal
  const [voiceType, setVoiceType] = useState('Alloy');
  const [modelType, setModelType] = useState('Gemini 1.5 Pro');
  const [temperature, setTemperature] = useState(0.7);

  const prevChatIdRef = useRef(activeChat?.id);

  const scrollToBottom = (smooth = false) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  useEffect(() => {
    if (!activeChat) return;

    const chatChanged = prevChatIdRef.current !== activeChat.id;
    prevChatIdRef.current = activeChat.id;

    if (chatChanged) {
      // Instant scroll on chat switch or page refresh
      scrollToBottom(false);
    } else {
      // Smooth scroll only on new messages or typing
      scrollToBottom(true);
    }
  }, [activeChat?.messages, activeChat?.id, typing]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    sendMessage(inputValue);
    setInputValue('');
  };

  const handleCopy = (text, messageId) => {
    navigator.clipboard.writeText(text);
    setCopiedId(messageId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSpeak = (text, messageId) => {
    if (speakingId === messageId) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }
    
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);
    setSpeakingId(messageId);
    window.speechSynthesis.speak(utterance);
  };

  const handleMicClick = () => {
    setVoiceMode(true);
    startStreaming();
  };

  const handleSuggestionClick = (suggestionText) => {
    sendMessage(suggestionText);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const response = await handleUploadFile(file, activeChat?.id);
      if (response && response.success) {
        setShowAttachMenu(false);
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-transparent relative mt-0">
      {/* Messages Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 md:space-y-8 custom-scrollbar">
        {activeChat?.messages && activeChat.messages.length > 0 ? (
          activeChat.messages.map((message) => {
            const isUser = message.sender === 'user';
            
            return (
              <div 
                key={message.id} 
                className={`flex items-start gap-3.5 ${isUser ? 'justify-end' : ''}`}
              >
                {/* AI Avatar */}
                {!isUser && (
                  <div className="w-9 h-9 rounded-xl bg-brand-blue flex-shrink-0 flex items-center justify-center text-white active-glow">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                    </svg>
                  </div>
                )}

                <div className={`flex flex-col gap-2 max-w-[85%] sm:max-w-xl md:max-w-2xl ${isUser ? 'items-end' : ''}`}>
                  {/* Chat bubble */}
                  <div 
                    className={`px-5 py-4 rounded-2xl text-sm leading-relaxed border shadow-sm transition-all duration-300 ${
                      isUser 
                        ? 'bg-brand-blue/10 border-brand-blue/20 text-app-text rounded-tr-none' 
                        : 'bg-surface-solid border-glass-border text-app-text rounded-tl-none'
                    }`}
                  >
                    <p className="whitespace-pre-line">{message.text}</p>
                    
                    <div className={`flex items-center gap-1.5 mt-3 pt-3 border-t border-glass-border text-[10px] text-app-text-muted font-medium ${isUser ? 'justify-end' : 'justify-between'}`}>
                      <span>{message.time}</span>
                      
                      {isUser ? (
                        <Check size={12} className="text-brand-blue dark:text-brand-cyan" />
                      ) : (
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => handleCopy(message.text, message.id)}
                            className="hover:text-app-text transition-colors"
                            title="Copy message"
                          >
                            {copiedId === message.id ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
                          </button>
                          
                          <button 
                            onClick={() => handleSpeak(message.text, message.id)}
                            className="hover:text-app-text transition-colors"
                            title="Text to speech"
                          >
                            {speakingId === message.id ? <VolumeX size={13} className="text-brand-blue animate-pulse" /> : <Volume2 size={13} />}
                          </button>

                          <button className="hover:text-app-text transition-colors">
                            <ThumbsUp size={13} />
                          </button>
                          
                          <button className="hover:text-app-text transition-colors">
                            <ThumbsDown size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Suggestion Chips (only on last AI message) */}
                  {!isUser && message.suggestions && message.id === activeChat.messages[activeChat.messages.length - 1].id && !typing && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {message.suggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="px-3.5 py-1.5 border border-glass-border bg-surface-solid hover:bg-brand-blue/5 text-brand-blue dark:text-brand-cyan text-xs font-bold rounded-full transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          /* Empty Chat State */
          <div className="h-full flex flex-col items-center justify-center text-center p-6 select-none max-w-xl mx-auto mt-16 md:mt-24">
            <div className="w-16 h-16 bg-gradient-to-r from-brand-blue to-brand-cyan rounded-3xl flex items-center justify-center text-white active-glow mb-6 animate-bounce">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
              </svg>
            </div>
            
            <h2 className="text-2xl font-extrabold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-600 dark:from-white dark:via-slate-200 dark:to-slate-400 bg-clip-text text-transparent">
              Welcome to TalkEasy AI
            </h2>
            <p className="text-sm text-app-text-secondary mt-2.5 max-w-sm leading-relaxed font-medium">
              Start a high-fidelity workspace by typing below or activating our futuristic voice system.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-8 w-full">
              {[
                "Explain Quantum Physics Basics",
                "Create a Weekly Travel Plan",
                "Code Optimization Checklist",
                "Design a minimalist Dashboard UI"
              ].map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => sendMessage(suggestion)}
                  className="p-4 bg-surface-solid border border-glass-border rounded-2xl hover:border-brand-blue/30 text-left text-xs font-bold text-app-text shadow-sm transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Typing indicator */}
        {typing && (
          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-brand-blue flex-shrink-0 flex items-center justify-center text-white active-glow">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
            </div>
            <TypingIndicator />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <footer className="p-4 md:p-6 bg-transparent shrink-0">
        <div className="max-w-4xl mx-auto flex flex-col items-center">
          <form onSubmit={handleSend} className="w-full flex items-center gap-3 bg-surface-solid rounded-2xl border border-glass-border shadow-lg px-4 py-2.5 backdrop-blur-md">
            
            {/* Voice button */}
            <button
              type="button"
              onClick={handleMicClick}
              className="w-10 h-10 rounded-xl bg-brand-blue text-white shadow-brand-blue/20 shadow-md hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center active-glow cursor-pointer shrink-0"
              title="Voice assistant"
            >
              <Mic size={18} strokeWidth={2.5} />
            </button>

            {/* Input field */}
            <input
              type="text"
              placeholder="Message TalkEasy..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-app-text text-sm placeholder:text-app-text-muted py-2 focus:ring-0 focus:border-none focus:outline-none"
            />

            {/* Action items */}
            <div className="flex items-center gap-2 md:gap-3 text-app-text-muted border-l border-glass-border pl-3.5 shrink-0">
              <div className="relative">
                <button 
                  type="button" 
                  onClick={() => setShowAttachMenu(!showAttachMenu)}
                  className="p-1.5 rounded-lg hover:text-app-text transition-colors cursor-pointer"
                  title="Attach file"
                >
                  <Paperclip size={18} />
                </button>

                {showAttachMenu && (
                  <div className="absolute bottom-full mb-2 -left-12 bg-surface-solid border border-glass-border rounded-xl shadow-lg flex items-center gap-1 p-1.5 backdrop-blur-md z-50 animate-in fade-in zoom-in duration-200">
                    <button
                      type="button"
                      onClick={() => { imageInputRef.current?.click(); setShowAttachMenu(false); }}
                      className="flex items-center justify-center p-2 rounded-lg hover:bg-brand-blue/10 hover:text-brand-blue dark:hover:text-brand-cyan transition-colors group cursor-pointer"
                      title="Upload Image"
                    >
                      <Image size={18} className="text-app-text-muted group-hover:text-brand-blue dark:group-hover:text-brand-cyan transition-colors" />
                    </button>
                    <button
                      type="button"
                      onClick={() => { docInputRef.current?.click(); setShowAttachMenu(false); }}
                      className="flex items-center justify-center p-2 rounded-lg hover:bg-brand-blue/10 hover:text-brand-blue dark:hover:text-brand-cyan transition-colors group cursor-pointer"
                      title="Upload Document"
                    >
                      <FileText size={18} className="text-app-text-muted group-hover:text-brand-blue dark:group-hover:text-brand-cyan transition-colors" />
                    </button>
                  </div>
                )}
                
                {/* Hidden File Inputs */}
                <input
                  type="file"
                  ref={imageInputRef}
                  onChange={handleFileChange}
                  accept="image/png, image/jpeg, image/jpg"
                  className="hidden"
                />
                <input
                  type="file"
                  ref={docInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.txt"
                  className="hidden"
                />
              </div>
              
              <button 
                type="button" 
                onClick={() => setWebSearch(!webSearch)}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${webSearch ? 'text-brand-blue dark:text-brand-cyan' : 'hover:text-app-text'}`}
                title="Search web"
              >
                <Globe size={18} />
              </button>
              
              <button
                type="submit"
                disabled={!inputValue.trim()}
                className="w-10 h-10 rounded-xl bg-brand-blue disabled:bg-surface-solid-hover disabled:text-app-text-muted text-white hover:opacity-95 active:scale-95 transition-all duration-300 flex items-center justify-center cursor-pointer"
              >
                <Send size={16} />
              </button>
            </div>
          </form>
          
          <p className="mt-3.5 text-[11px] text-app-text-muted font-bold uppercase tracking-wider select-none text-center">
            TalkEasy can make mistakes. Consider checking important information.
          </p>
        </div>
      </footer>

      {/* IM-MER-SIVE Voice Mode Overlay */}
      {voiceMode && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/90 dark:bg-black/95 backdrop-blur-2xl p-6">
          {/* Close Voice Overlay */}
          <button
            onClick={() => {
              stopStreaming();
              setVoiceMode(false);
            }}
            className="absolute top-6 right-6 p-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-all cursor-pointer"
            title="Exit Voice Mode"
          >
            <X size={20} />
          </button>

          {/* Model info badge */}
          <div className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[11px] font-bold text-slate-300 select-none uppercase tracking-wider">
            <Sparkles size={12} className="text-brand-cyan" />
            <span>Voice Workstation: {modelType}</span>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center max-w-md w-full">
            {/* Orb component */}
            <VoiceOrb isListening={isStreaming || isPlaying} onClick={() => {
              if (isStreaming) {
                stopStreaming();
              } else {
                startStreaming();
              }
            }} />

            {/* Visualizer showing waves */}
            <div className="w-full mt-10">
              <VoiceVisualizer isPlaying={isStreaming || isPlaying} />
            </div>

            <div className="mt-8 text-center space-y-4">
              <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-widest leading-relaxed">
                {isStreaming ? "Say something, we're listening..." : (isPlaying ? "AI is speaking..." : "Tap the orb to restart microphone capture.")}
              </p>
              
              {transcript && (
                <div className="p-4 bg-white/5 border border-white/10 rounded-xl mt-4">
                  <p className="text-white font-medium italic">"{transcript}"</p>
                </div>
              )}
              
              {aiResponse && (
                <div className="p-4 bg-brand-blue/10 border border-brand-blue/30 rounded-xl mt-2 text-left">
                  <p className="text-brand-cyan font-medium text-sm whitespace-pre-line">{aiResponse}</p>
                </div>
              )}
              
              {voiceError && (
                <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl mt-2">
                  <p className="text-red-400 font-bold text-xs">{voiceError}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Global Settings Modal */}
      <Modal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        title="Settings & Workspace Preferences"
      >
        <div className="space-y-6 pb-2">
          {/* Section 1: AI Engine */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-app-text-muted uppercase tracking-widest flex items-center gap-2">
              <Sparkles size={14} className="text-brand-blue" />
              Intelligence Engine
            </h3>
            
            <div className="grid grid-cols-2 gap-3.5">
              {['Gemini 1.5 Pro', 'Gemini 1.5 Flash', 'Lumina Nexus v2', 'Claude 3.5 Sonnet'].map((model) => (
                <button
                  key={model}
                  onClick={() => setModelType(model)}
                  className={`p-3.5 rounded-xl border text-xs font-bold text-left transition-all duration-300 ${
                    modelType === model 
                      ? 'border-brand-blue bg-brand-blue/5 text-brand-blue dark:text-brand-cyan' 
                      : 'border-glass-border bg-glass-input-bg hover:bg-surface-solid-hover text-app-text'
                  }`}
                >
                  {model}
                </button>
              ))}
            </div>
          </div>

          {/* Section 2: Synthetic Voice */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-app-text-muted uppercase tracking-widest flex items-center gap-2">
              <Sliders size={14} className="text-brand-blue" />
              Synthetic Voice Preset
            </h3>
            
            <div className="grid grid-cols-4 gap-2.5">
              {['Alloy', 'Echo', 'Fable', 'Onyx', 'Nova', 'Shimmer'].map((voice) => (
                <button
                  key={voice}
                  onClick={() => setVoiceType(voice)}
                  className={`py-2 px-3 rounded-lg border text-[11px] font-bold text-center transition-all ${
                    voiceType === voice 
                      ? 'border-brand-blue bg-brand-blue/5 text-brand-blue dark:text-brand-cyan' 
                      : 'border-glass-border bg-glass-input-bg hover:bg-surface-solid-hover text-app-text-secondary'
                  }`}
                >
                  {voice}
                </button>
              ))}
            </div>
          </div>

          {/* Section 3: Parameters */}
          <div className="space-y-4 pt-2 border-t border-glass-border">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-bold text-app-text">Temperature</span>
                <p className="text-[10px] text-app-text-secondary leading-normal">Controls response creativity vs precision</p>
              </div>
              <span className="text-xs font-bold text-brand-blue dark:text-brand-cyan">{temperature}</span>
            </div>
            <input 
              type="range" 
              min="0.1" 
              max="1.5" 
              step="0.1" 
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full accent-brand-blue cursor-pointer" 
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-glass-border">
            <Button variant="secondary" onClick={() => setSettingsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setSettingsOpen(false)}>
              Save Preferences
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ChatPage;
