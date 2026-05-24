import React from 'react';

const Input = React.forwardRef(({
  label,
  error,
  helperText,
  icon: Icon,
  type = 'text',
  className = '',
  id,
  ...props
}, ref) => {
  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-xs font-semibold uppercase tracking-wider text-app-text-secondary">
          {label}
        </label>
      )}
      
      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3.5 text-app-text-muted pointer-events-none">
            <Icon size={18} />
          </div>
        )}
        <input
          id={id}
          ref={ref}
          type={type}
          className={`w-full glass-input bg-glass-input-bg border border-glass-border rounded-xl py-3 px-4 text-sm placeholder:text-app-text-muted text-app-text outline-none transition-all duration-300 ${Icon ? 'pl-11' : ''} ${error ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' : 'focus:border-brand-blue/50 focus:ring-brand-blue/20'} ${className}`}
          {...props}
        />
      </div>

      {error ? (
        <span className="text-[11px] text-red-500 font-medium">{error}</span>
      ) : helperText ? (
        <span className="text-[11px] text-app-text-muted">{helperText}</span>
      ) : null}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
