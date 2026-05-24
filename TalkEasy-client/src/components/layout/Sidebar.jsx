import React, { useState, useEffect } from 'react';
import { MessageSquare, History, Star, FolderOpen, Wrench, Plus, Search, Trash, X, Menu } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import Button from '../ui/Button';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { chats, activeChatId, setActiveChatId, createNewChat, deleteChat, loadingChats } = useChat();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const navItems = [
    { label: 'Chats', icon: MessageSquare, active: true },
    { label: 'History', icon: History },
    { label: 'Starred', icon: Star },
    { label: 'Files', icon: FolderOpen },
    { label: 'Tools', icon: Wrench, badge: 'New' }
  ];

  const filteredChats = chats.filter(chat => 
    chat.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    chat.preview.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/30 dark:bg-black/60 md:hidden backdrop-blur-sm"
          onClick={toggleSidebar}
        />
      )}

      <aside 
        className={`fixed md:relative top-0 bottom-0 left-0 z-45 flex flex-col glass-panel min-h-screen ${isMounted ? 'transition-all duration-300' : 'transition-none'} overflow-hidden ${
          isOpen 
            ? 'w-72 translate-x-0 opacity-100 border-r border-glass-border' 
            : 'w-0 -translate-x-full opacity-0 pointer-events-none border-none'
        }`}
      >
        <div className="w-72 flex flex-col h-full shrink-0">
          {/* Sidebar Header */}
          <div className="p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-brand-blue rounded-xl flex items-center justify-center text-white active-glow">
                <MessageSquare size={18} strokeWidth={2.5} />
              </div>
              <span className="font-extrabold text-lg bg-gradient-to-r from-brand-blue to-brand-cyan bg-clip-text text-transparent">
                TalkEasy
              </span>
            </div>
            <button 
              onClick={toggleSidebar} 
              className="p-1.5 rounded-lg text-app-text-muted hover:bg-surface-solid-hover transition-colors"
            >
              <Menu size={18} />
            </button>
          </div>

          {/* New Chat Button */}
          <div className="px-4 mb-4">
            <Button 
              onClick={() => {
                createNewChat();
                if (window.innerWidth < 768) toggleSidebar();
              }}
              className="w-full justify-between py-3"
            >
              <span className="flex items-center gap-2">
                <Plus size={18} strokeWidth={2.5} />
                New Chat
              </span>
              <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] bg-white/20 rounded-md font-mono opacity-85">
                ⌘ N
              </kbd>
            </Button>
          </div>

          {/* Navigation Items */}
          <nav className="px-3 space-y-1">
            {navItems.map((item, idx) => {
              const Icon = item.icon;
              return (
                <a
                  key={idx}
                  href="#"
                  className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-300 ${
                    item.active
                      ? 'bg-brand-blue/10 text-brand-blue dark:text-brand-cyan'
                      : 'text-app-text-secondary hover:bg-surface-solid-hover'
                  }`}
                >
                  <Icon size={18} className={item.active ? 'text-brand-blue dark:text-brand-cyan' : 'text-app-text-muted'} />
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <span className="bg-brand-blue dark:bg-brand-cyan/20 text-white dark:text-brand-cyan text-[10px] px-2 py-0.5 rounded-full font-bold">
                      {item.badge}
                    </span>
                  )}
                </a>
              );
            })}
          </nav>

          {/* Recent Chats Header */}
          <div className="mt-6 px-5 pb-2 text-xs font-bold text-app-text-muted uppercase tracking-wider flex items-center justify-between">
            <span>Recent Chats</span>
            <button 
              onClick={() => setShowSearch(!showSearch)} 
              className="p-1 rounded-md text-app-text-muted hover:text-app-text transition-colors"
            >
              <Search size={14} />
            </button>
          </div>

          {/* Search bar within recent chats */}
          {showSearch && (
            <div className="px-4 mb-3">
              <input
                type="text"
                placeholder="Filter chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-glass-input-bg border border-glass-border rounded-xl py-2 px-3 text-xs outline-none text-app-text placeholder:text-app-text-muted focus:ring-1 focus:ring-brand-blue/30 transition-all duration-300"
              />
            </div>
          )}

          {/* Recent Chats List */}
          <div className="flex-1 px-3 space-y-1.5 overflow-y-auto custom-scrollbar">
            {loadingChats ? (
              <div className="text-center py-6 text-xs text-brand-blue dark:text-brand-cyan font-medium animate-pulse">
                Loading chats...
              </div>
            ) : filteredChats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => {
                  setActiveChatId(chat.id);
                  if (window.innerWidth < 768) toggleSidebar();
                }}
                className={`relative px-4 py-3 rounded-xl cursor-pointer group transition-all duration-300 border ${
                  chat.id === activeChatId
                    ? 'bg-surface-solid border-glass-border shadow-sm'
                    : 'hover:bg-surface-solid-hover border-transparent'
                }`}
              >
                <div className="flex items-center justify-between mb-1 gap-2">
                  <span className="font-bold text-sm text-app-text truncate pr-6">
                    {chat.title}
                  </span>
                  <span className="text-[10px] text-app-text-muted shrink-0 font-semibold">
                    {chat.time}
                  </span>
                </div>
                <p className="text-xs text-app-text-secondary truncate pr-6">
                  {chat.preview}
                </p>
                
                {/* Delete Button on Hover */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteChat(chat.id);
                  }}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-app-text-muted hover:text-red-500 hover:bg-surface-solid-hover opacity-0 group-hover:opacity-100 transition-all duration-200"
                >
                  <Trash size={13} />
                </button>
              </div>
            ))}

            {!loadingChats && filteredChats.length === 0 && (
              <div className="text-center py-6 text-xs text-app-text-muted font-medium">
                No chats found
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
