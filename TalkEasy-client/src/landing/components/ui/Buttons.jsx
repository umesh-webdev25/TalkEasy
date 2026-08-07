import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../../utils/cn';

const base =
  'group relative inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--text-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-app)] disabled:opacity-50 disabled:pointer-events-none cursor-pointer select-none';

const variants = {
  primary:
    'bg-app-text text-app-bg px-7 py-3.5 text-[15px] shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_32px_-8px_rgba(0,0,0,0.28)] hover:-translate-y-0.5',
  secondary:
    'border border-[var(--glass-border-hover)] bg-[var(--glass-bg)] text-app-text px-7 py-3.5 text-[15px] hover:border-[var(--text-primary)] hover:-translate-y-0.5',
  ghost:
    'text-app-text px-4 py-2 text-sm hover:bg-[var(--glass-bg-hover)]',
};

export const CTAButton = forwardRef(function CTAButton(
  { variant = 'primary', className, children, ...props },
  ref,
) {
  return (
    <a ref={ref} className={cn(base, variants[variant], className)} {...props}>
      {children}
    </a>
  );
});

export const CTAButtonLink = forwardRef(function CTAButtonLink(
  { variant = 'primary', to, className, children, ...props },
  ref,
) {
  return (
    <Link ref={ref} to={to} className={cn(base, variants[variant], className)} {...props}>
      {children}
    </Link>
  );
});

export const ArrowIcon = ({ className }) => (
  <svg
    className={cn('w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5', className)}
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden
  >
    <path d="M2 8h11M9 3.5 13.5 8 9 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);