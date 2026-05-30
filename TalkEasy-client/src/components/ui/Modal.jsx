import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showClose = true,
  className = ''
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-3xl',
    full: 'max-w-full m-4'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 mt-45" >
      {/* Backdrop */}
      {/* <div 
        className="absolute inset-0 bg-slate-900/60  backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      />
       */}
      {/* Modal Content */}
      <div className={`relative w-full ${sizeClasses[size]} glass-panel rounded-3xl shadow-2xl p-6 md:p-8 z-10 transition-transform duration-300 scale-100 flex flex-col max-h-[90vh] ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-glass-border">
          {title && <h2 className="text-xl font-bold text-app-text">{title}</h2>}
          {showClose && (
            <button 
              onClick={onClose} 
              className="p-1.5 rounded-full text-app-text-muted hover:text-app-text hover:bg-surface-solid-hover transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          )}
        </div>
        
        {/* Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
