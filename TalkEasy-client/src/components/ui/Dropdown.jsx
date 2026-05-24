import React, { useState, useRef, useEffect } from 'react';

const Dropdown = ({
  trigger,
  items = [],
  align = 'right',
  className = '',
  menuClassName = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
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
    center: 'left-1/2 -translate-x-1/2 origin-top'
  };

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {trigger}
      </div>

      {isOpen && (
        <div
          className={`absolute mt-2 w-56 rounded-2xl glass-panel shadow-xl z-50 py-1.5 focus:outline-none transition-all duration-200 ${alignStyles[align]} ${menuClassName}`}
        >
          {items.map((item, idx) => {
            if (item.divider) {
              return <div key={idx} className="border-t border-glass-border my-1" />;
            }
            
            const Icon = item.icon;
            
            return (
              <button
                key={idx}
                onClick={() => {
                  if (item.onClick) item.onClick();
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left font-medium transition-colors cursor-pointer ${item.danger ? 'text-red-500 hover:bg-red-500/10' : 'text-app-text hover:bg-surface-solid-hover'} ${item.className || ''}`}
              >
                {Icon && <Icon size={16} className={item.danger ? 'text-red-500' : 'text-app-text-muted'} />}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Dropdown;
