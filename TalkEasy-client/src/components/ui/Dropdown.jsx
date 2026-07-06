import React, { useState, useRef, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';

const Dropdown = ({
  trigger,
  items = [],
  align = 'right',
  className = '',
  menuClassName = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSubmenuIndex, setActiveSubmenuIndex] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setActiveSubmenuIndex(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const alignStyles = {
    left: 'left-0 origin-top-left',
    right: 'right-0 origin-top-right',
    center: 'left-1/2 -translate-x-1/2 origin-top',
    'top-left': 'left-0 bottom-full mb-2 origin-bottom-left',
    'top-right': 'right-0 bottom-full mb-2 origin-bottom-right',
  };

  const renderItems = (itemList, isSubmenu = false) => {
    return itemList.map((item, idx) => {
      if (item.divider) {
        return <div key={idx} className="border-t border-glass-border my-1" />;
      }
      
      const Icon = item.icon;
      const hasSubmenu = item.submenu && item.submenu.length > 0;
      const isSubmenuOpen = activeSubmenuIndex === idx;

      return (
        <div key={idx} className="relative">
          {item.render ? (
            <div 
              onClick={(e) => {
                if (hasSubmenu) {
                  e.stopPropagation();
                  setActiveSubmenuIndex(isSubmenuOpen ? null : idx);
                } else if (item.onClick) {
                  item.onClick();
                  setIsOpen(false);
                  setActiveSubmenuIndex(null);
                }
              }}
              className={`w-full ${item.className || ''}`}
            >
               {item.render()}
            </div>
          ) : (
            <button
              onClick={(e) => {
                if (hasSubmenu) {
                  e.stopPropagation();
                  setActiveSubmenuIndex(isSubmenuOpen ? null : idx);
                } else {
                  if (item.onClick) item.onClick();
                  setIsOpen(false);
                  setActiveSubmenuIndex(null);
                }
              }}
              className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 text-sm text-left font-medium transition-colors cursor-pointer ${item.danger ? 'text-red-500 hover:bg-red-500/10' : 'text-app-text hover:bg-surface-solid-hover'} ${item.className || ''}`}
            >
              <div className="flex items-center gap-3">
                {Icon && <Icon size={16} className={item.danger ? 'text-red-500' : 'text-app-text-muted'} />}
                <span>{item.label}</span>
              </div>
            </button>
          )}

          {/* Submenu rendering */}
          {hasSubmenu && isSubmenuOpen && (
             <div className="absolute left-full bottom-0 ml-2 w-72 rounded-2xl glass-panel shadow-xl z-50 py-1.5 focus:outline-none transition-all duration-200">
                {renderItems(item.submenu, true)}
             </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {trigger}
      </div>

      {isOpen && (
        <div
          className={`absolute w-72 rounded-2xl glass-panel shadow-xl z-50 py-1.5 focus:outline-none transition-all duration-200 ${alignStyles[align]} ${menuClassName}`}
        >
          {renderItems(items)}
        </div>
      )}
    </div>
  );
};

export default Dropdown;
