import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Menu, X, Sun, Moon, ArrowRight } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { cn } from '../../utils/cn';

const LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Testimonials', href: '#testimonials' },
  { label: 'FAQ', href: '#faq' },
  { label: 'Contact', href: '#contact' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { isDark, toggleTheme } = useTheme();
  const reduce = useReducedMotion();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const close = useCallback(() => setOpen(false), []);

  return (
    <motion.header
      initial={{ y: reduce ? 0 : -64, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'fixed top-0 inset-x-0 z-50 transition-all duration-500',
        scrolled
          ? 'bg-[var(--bg-app)]/80 backdrop-blur-xl border-b border-[var(--glass-border)] shadow-[0_8px_32px_-12px_rgba(0,0,0,0.08)]'
          : 'bg-transparent border-b border-transparent',
      )}
    >
      <nav className="mx-auto max-w-[1400px] px-5 sm:px-8 h-[72px] flex items-center justify-between" aria-label="Main navigation">
        {/* Logo */}
        <a href="#hero" className="flex items-center gap-2.5 shrink-0" aria-label="TalkEasy home">
          <span className="w-9 h-9 rounded-[10px] bg-[var(--text-primary)] text-[var(--bg-app)] flex items-center justify-center text-sm font-bold">
            T
          </span>
          <span className="text-[17px] font-bold tracking-tight text-app-text">
            TalkEasy
          </span>
        </a>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="px-3.5 py-2 rounded-full text-[13.5px] font-medium text-app-text-secondary hover:text-app-text hover:bg-[var(--glass-bg-hover)] transition-colors duration-200"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={toggleTheme}
            className="w-10 h-10 rounded-full flex items-center justify-center text-app-text-secondary hover:text-app-text hover:bg-[var(--glass-bg-hover)] transition-colors"
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <Link
            to="/login"
            className="hidden sm:inline-flex px-4.5 py-2.5 rounded-full text-[13.5px] font-medium text-app-text hover:bg-[var(--glass-bg-hover)] transition-colors"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-app-text text-app-bg pl-4.5 pr-4 py-2.5 text-[13.5px] font-semibold hover:opacity-85 transition-opacity"
          >
            Get Started
            <ArrowRight size={14} aria-hidden />
          </Link>
          <button
            onClick={() => setOpen((v) => !v)}
            className="md:hidden w-10 h-10 rounded-full flex items-center justify-center text-app-text hover:bg-[var(--glass-bg-hover)]"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="md:hidden overflow-hidden border-b border-[var(--glass-border)] bg-[var(--bg-app)]/95 backdrop-blur-xl"
          >
            <div className="px-6 py-6 flex flex-col gap-1">
              {LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={close}
                  className="px-4 py-3 rounded-xl text-[15px] font-medium text-app-text-secondary hover:text-app-text hover:bg-[var(--glass-bg-hover)] transition-colors"
                >
                  {link.label}
                </a>
              ))}
              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-[var(--glass-border)]">
                <Link
                  to="/login"
                  onClick={close}
                  className="flex-1 text-center rounded-full border border-[var(--glass-border-hover)] py-3 text-sm font-semibold text-app-text"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={close}
                  className="flex-1 text-center rounded-full bg-app-text text-app-bg py-3 text-sm font-semibold"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}