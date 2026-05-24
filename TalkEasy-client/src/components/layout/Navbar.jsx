import React from 'react';
import { Menu, Sun, Moon, Search, LayoutGrid, ChevronDown, User, Settings, LogOut } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import Dropdown from '../ui/Dropdown';

const Navbar = ({ onMenuClick, sidebarOpen }) => {
  const { activeChat, setSettingsOpen } = useChat();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/login');
  };

  const profileItems = [
    { 
      label: 'My Profile', 
      icon: User, 
      onClick: () => alert('Profile page under development') 
    },
    { 
      label: 'Settings', 
      icon: Settings, 
      onClick: () => setSettingsOpen(true) 
    },
    { divider: true },
    { 
      label: 'Sign Out', 
      icon: LogOut, 
      danger: true, 
      onClick: handleLogout 
    }
  ];

  return (
    <header className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-glass-border bg-glass-bg backdrop-blur-md sticky top-0 z-30">
      <div className="flex items-center gap-3.5">
        {/* Menu toggle */}
        {!sidebarOpen && (
          <button 
            onClick={onMenuClick}
            className="p-2 rounded-xl text-app-text-secondary hover:bg-surface-solid-hover transition-colors"
          >
            <Menu size={20} />
          </button>
        )}

        {/* Conversation details */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-blue/10 flex items-center justify-center text-brand-blue dark:text-brand-cyan shadow-sm border border-brand-blue/15">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-1 cursor-pointer">
              <h1 className="font-extrabold text-app-text text-sm md:text-base truncate max-w-[120px] xs:max-w-[180px] sm:max-w-xs">
                {activeChat ? activeChat.title : 'New Conversation'}
              </h1>
              <ChevronDown size={14} className="text-app-text-muted" />
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-[10px] text-app-text-muted font-bold uppercase tracking-wider">Online</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 md:gap-3">
        {/* Search button */}
        <button className="p-2 rounded-xl text-app-text-secondary hover:bg-surface-solid-hover transition-colors">
          <Search size={18} />
        </button>

        {/* Layout Grid details */}
        <button className="hidden sm:inline-flex p-2 rounded-xl text-app-text-secondary hover:bg-surface-solid-hover transition-colors">
          <LayoutGrid size={18} />
        </button>

        {/* Theme toggle */}
        <button 
          onClick={toggleTheme}
          className="p-2 rounded-xl text-app-text-secondary hover:bg-surface-solid-hover transition-colors"
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* User profile dropdown */}
        <div className="flex items-center pl-2 md:pl-3 border-l border-glass-border">
          <Dropdown
            trigger={
              <div className="flex items-center gap-2 cursor-pointer group">
                <img 
                  alt="Profile" 
                  className="w-8 h-8 rounded-xl border border-glass-border group-hover:border-brand-blue/50 transition-colors"
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100&h=100"
                />
                <span className="hidden md:inline-block text-xs font-bold text-app-text group-hover:text-brand-blue transition-colors">
                  John Doe
                </span>
                <ChevronDown size={14} className="hidden md:inline-block text-app-text-muted group-hover:text-app-text transition-colors" />
              </div>
            }
            items={profileItems}
            align="right"
          />
        </div>
      </div>
    </header>
  );
};

export default Navbar;
