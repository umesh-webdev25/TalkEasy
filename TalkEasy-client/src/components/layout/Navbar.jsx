import React, { useState, useEffect } from 'react';
import {
  Menu, Sun, Moon, Search, LayoutGrid,
  ChevronDown, User, Settings, LogOut, Star
} from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import Dropdown from '../ui/Dropdown';
import { getUserById } from '../../api/authApi';   // ← ID‑based API
import ProfileModal from './ProfileModal';
import GlobalSearchModal from '../ui/GlobalSearchModal';

const Navbar = ({ onMenuClick, sidebarOpen }) => {
  const { activeChat, setSettingsOpen, toggleStarChat } = useChat();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [userInitials, setUserInitials] = useState('');
  const [user, setUser] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  // -----------------------------------------------------------------
  // 1️⃣ Fetch the full user profile once on mount (via ID)
  // -----------------------------------------------------------------
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const stored = localStorage.getItem('user');
        // console.log('Stored user data from localStorage:', stored);
        if (!stored) return;
        const { id: userId } = JSON.parse(stored);
        // console.log('Parsed userId:', userId);

        // The token in the Axios interceptor authenticates this call
        const response = await getUserById(userId);
        // console.log('API response from getUserById:', response);

        // Save full user
        setUser(response.user);
        // console.log('Set user state with:', response.user);

        const first = response.user.first_name?.[0] ?? '';
        const last  = response.user.last_name?.[0] ?? '';
        setUserInitials(`${first}${last}`.toUpperCase());
      } catch (error) {
        console.log('Failed to fetch user', error);
      }
    };
    fetchUser();
  }, []);
  // -----------------------------------------------------------------
  // 2️⃣ Log whenever the `user` state changes (helps debugging)
  // -----------------------------------------------------------------
  // useEffect(() => {
  //   console.log('⚡️ user state updated:', user);
  // }, [user]);
  // -----------------------------------------------------------------
  // 3️⃣ Logout handler
  // -----------------------------------------------------------------
  const handleLogout = () => {
    navigate('/login');
  };

  const profileItems = [
    { label: 'My Profile', icon: User, onClick: () => setIsProfileOpen(true) },
    { label: 'Settings',   icon: Settings, onClick: () => setSettingsOpen(true) },
    { divider: true },
    { label: 'Sign Out',   icon: LogOut, danger: true, onClick: handleLogout }
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

        {/* Assistant details */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center overflow-hidden shadow-sm">
            <img src="/robot.png" alt="Assistant" className="w-full h-full object-cover" />
          </div>

          <div className="flex flex-col">
            <h1 className="font-extrabold text-app-text text-sm md:text-base flex items-center gap-2">
              TalkEasy Assistant
            </h1>
            <div className="flex items-center gap-2 text-[10px] font-bold mt-0.5">
              <span className="flex items-center gap-1 text-green-500">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Connected
              </span>
              <span className="text-brand-blue bg-brand-blue/10 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider border border-brand-blue/20">GPT-5.5</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right‑hand controls */}
      <div className="flex items-center gap-1.5 md:gap-3">
        {/* Search button */}
        <button 
          onClick={() => setIsSearchOpen(true)}
          className="p-2 rounded-xl text-app-text-secondary hover:bg-surface-solid-hover transition-colors"
        >
          <Search size={18} />
        </button>

        {/* Layout grid */}
        <button className="hidden sm:inline-flex p-2 rounded-xl text-app-text-secondary hover:bg-surface-solid-hover transition-colors">
          <LayoutGrid size={18} />
        </button>

        {/* Theme toggle */}
        <button onClick={toggleTheme} className="p-2 rounded-xl text-app-text-secondary hover:bg-surface-solid-hover transition-colors">
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* User profile dropdown */}
        <div className="flex items-center pl-2 md:pl-3 border-l border-glass-border">
          <Dropdown
            trigger={
              <div className="flex items-center gap-2 cursor-pointer group">
                {/* Avatar circle showing initials */}
                <div className="w-10 h-10 rounded-xl bg-brand-blue/10 flex items-center justify-center text-sm font-bold text-app-text border border-glass-border">
                  {userInitials}
                </div>

                {/* Show initials as name on larger screens */}
                {/* <span className="hidden md:inline-block text-xs font-bold text-app-text group-hover:text-brand-blue transition-colors">
                  {userInitials}
                </span> */}

                <ChevronDown size={14} className="hidden md:inline-block text-app-text-muted group-hover:text-app-text transition-colors" />
              </div>
            }
            items={profileItems}
            align="right"
          />
        </div>
      </div>

      <ProfileModal 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
        user={user} 
        userInitials={userInitials} 
      />

      <GlobalSearchModal 
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </header>
  );
};

export default Navbar;
