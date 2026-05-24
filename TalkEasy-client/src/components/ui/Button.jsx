import React from 'react';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  onClick,
  disabled = false,
  loading = false,
  icon: Icon,
  type = 'button',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-brand-blue/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none cursor-pointer';
  
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3.5 text-base',
    icon: 'p-2.5 rounded-full'
  };

  const variantStyles = {
    primary: 'bg-gradient-to-r from-brand-blue to-brand-cyan text-white active-glow hover:scale-[1.02] shadow-lg shadow-brand-blue/20',
    secondary: 'bg-glass-input-bg border border-glass-border text-app-text hover:bg-surface-solid-hover',
    outline: 'border border-glass-border text-app-text bg-transparent hover:bg-surface-solid-hover',
    ghost: 'text-app-text-secondary hover:text-app-text hover:bg-surface-solid-hover',
    danger: 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : Icon ? (
        <span className="mr-2"><Icon size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} /></span>
      ) : null}
      {children}
    </button>
  );
};

export default Button;
