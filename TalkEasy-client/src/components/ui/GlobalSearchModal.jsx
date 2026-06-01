import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader, MessageSquare, ExternalLink, Globe, X } from 'lucide-react';
import { searchChatMessages } from '../../api/chatApi';
import Modal from './Modal';
import { useChat } from '../../context/ChatContext';

const GlobalSearchModal = ({ isOpen, onClose }) => {
  const { activeChatId, setActiveChatId } = useChat();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchScope, setSearchScope] = useState('all'); // 'all' or 'current'
  const [error, setError] = useState('');
  const inputRef = useRef(null);
  
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 100);
    }
    if (!isOpen) {
      setQuery('');
      setResults([]);
      setSearchScope('all');
    }
  }, [isOpen]);

  useEffect(() => {
    const fetchResults = async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }
      setIsLoading(true);
      setError('');
      try {
        const sessionId = searchScope === 'current' ? activeChatId : null;
        const data = await searchChatMessages(query, sessionId);
        if (data.success) {
          setResults(data.results || []);
        } else {
          setError(data.error || 'Failed to search messages');
          setResults([]);
        }
      } catch (err) {
        console.error("Search error:", err);
        setError("Error connecting to search service");
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(fetchResults, 400); // Debounce
    return () => clearTimeout(timer);
  }, [query, searchScope, activeChatId]);

  const handleResultClick = (sessionId) => {
    if (sessionId !== activeChatId) {
      setActiveChatId(sessionId);
    }
    onClose();
  };

  const renderHighlight = (text, highlight) => {
    if (!highlight) return text;
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === highlight.toLowerCase() ? (
            <span key={i} className="bg-brand-blue/30 text-brand-blue dark:text-brand-cyan px-1 rounded">{part}</span>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Search Messages" size="md" className='mt-22'>
      <div className="flex flex-col h-[300px] ">
        {/* Search Input */}
        <div className="relative mb-4 shrink-0">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-app-text-muted">
            <Search size={18} />
          </div>
          <input
            ref={inputRef}
            type="text"
            className="w-full bg-glass-input-bg border border-glass-border rounded-xl py-3 pl-10 pr-4 text-sm outline-none text-app-text placeholder:text-app-text-muted focus:ring-2 focus:ring-brand-blue/30 transition-all duration-300"
            placeholder="Search through messages..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-app-text-muted hover:text-app-text transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Scope Toggle */}
        <div className="flex bg-surface-solid border border-glass-border rounded-lg p-1 mb-4 shrink-0">
          <button
            className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-bold rounded-md transition-all ${
              searchScope === 'all' ? 'bg-brand-blue/10 text-brand-blue dark:text-brand-cyan' : 'text-app-text-muted hover:text-app-text'
            }`}
            onClick={() => setSearchScope('all')}
          >
            <Globe size={14} /> All Sessions
          </button>
          <button
            className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-bold rounded-md transition-all ${
              searchScope === 'current' ? 'bg-brand-blue/10 text-brand-blue dark:text-brand-cyan' : 'text-app-text-muted hover:text-app-text'
            }`}
            onClick={() => setSearchScope('current')}
            disabled={!activeChatId}
            title={!activeChatId ? "No active session" : ""}
          >
            <MessageSquare size={14} /> Current Session
          </button>
        </div>

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar -mx-2 px-2">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-app-text-muted gap-3">
              <Loader size={24} className="animate-spin text-brand-blue" />
              <p className="text-xs font-semibold">Searching messages...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full text-red-400 gap-2">
              <p className="text-sm font-semibold">{error}</p>
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-2 pb-4">
              {results.map((r, idx) => (
                <div 
                  key={idx}
                  onClick={() => handleResultClick(r.session_id)}
                  className="p-3 bg-surface-solid border border-glass-border hover:border-brand-blue/30 rounded-xl cursor-pointer transition-all duration-200 group"
                >
                  <div className="flex justify-between items-start mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wide ${
                        r.message?.sender === 'user' ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-300' : 'bg-brand-blue/10 text-brand-blue dark:text-brand-cyan'
                      }`}>
                        {r.message?.sender}
                      </span>
                      <span className="text-[10px] text-app-text-muted font-medium">
                        {r.created_at ? new Date(r.created_at).toLocaleDateString() : ''} {r.message?.time}
                      </span>
                    </div>
                    {r.session_id !== activeChatId && (
                      <span className="text-[10px] text-brand-blue dark:text-brand-cyan opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                        Go to chat <ExternalLink size={10} />
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-app-text line-clamp-3">
                    {renderHighlight(r.message?.content || '', query)}
                  </p>
                </div>
              ))}
            </div>
          ) : query.trim() ? (
            <div className="flex flex-col items-center justify-center h-full text-app-text-muted gap-2">
              <Search size={32} className="opacity-20 mb-2" />
              <p className="text-sm font-semibold">No messages found</p>
              <p className="text-xs opacity-70">Try using different keywords</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-app-text-muted gap-2">
              <MessageSquare size={32} className="opacity-20 mb-2" />
              <p className="text-sm font-semibold">Type to search history</p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default GlobalSearchModal;
