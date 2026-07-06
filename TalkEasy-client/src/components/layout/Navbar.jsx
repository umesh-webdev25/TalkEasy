import React, { useState } from "react";
import { Menu, Sun, Moon, Search, LayoutGrid, ChevronDown } from "lucide-react";

import { useTheme } from "../../context/ThemeContext";
import GlobalSearchModal from "../ui/GlobalSearchModal";

const Navbar = ({ onMenuClick, sidebarOpen }) => {
  const { isDark, toggleTheme } = useTheme();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

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
          {/* <div className="w-9 h-9 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center overflow-hidden shadow-sm">
            <img
              src="/robot.png"
              alt="Assistant"
              className="w-full h-full object-cover"
            />
          </div> */}

          <div className="flex flex-col">
            <h1 className="font-extrabold text-app-text text-sm md:text-base flex items-center gap-2">
              TalkEasy Assistant
            </h1>
            <div className="flex items-center gap-2 text-[10px] font-bold mt-0.5">
              <span className="flex items-center gap-1 text-green-500">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>{" "}
                Connected
              </span>
              <span className="text-brand-blue bg-brand-blue/10 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider border border-brand-blue/20">
                GPT-5.5
              </span>
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
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-app-text-secondary hover:bg-surface-solid-hover transition-colors"
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </header>
  );
};

export default Navbar;
