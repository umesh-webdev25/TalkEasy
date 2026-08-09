import { useState, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Database, Mic, MessageSquare, Images, FileText } from 'lucide-react';
import SectionHeading from '../ui/SectionHeading';
import ScrollExpand from '../animations/ScrollExpand';
import AppFrame from '../mockups/AppFrame';
import { ShowcaseChatScreen, VoiceCallScreen, ImageGenScreen, PdfChatScreen } from '../mockups/Screens';
import { cn } from '../../utils/cn';

const SCREENS = [
  { id: 'voice', label: 'Voice', icon: Mic, component: VoiceCallScreen },
  { id: 'chat', label: 'Chat', icon: MessageSquare, component: ShowcaseChatScreen },
  { id: 'images', label: 'Images', icon: Images, component: ImageGenScreen },
  { id: 'pdf', label: 'PDF', icon: FileText, component: PdfChatScreen },
];

export const Showcase = memo(function Showcase() {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(SCREENS[0].id);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || reduce) return;
    const t = setInterval(() => {
      setActive((prev) => {
        const idx = SCREENS.findIndex((s) => s.id === prev);
        return SCREENS[(idx + 1) % SCREENS.length].id;
      });
    }, 5000);
    return () => clearInterval(t);
  }, [paused, reduce]);

  const Active = SCREENS.find((s) => s.id === active)?.component || SCREENS[0].component;

  const select = useCallback((id) => {
    setActive(id);
    setPaused(true);
    setTimeout(() => setPaused(false), 12000);
  }, []);

  return (
    <section id="showcase" className="relative pt-12">
      <div className="mx-auto max-w-[1400px] px-6">
        <SectionHeading
          eyebrow="Product Tour"
          title="One workspace. Every capability."
          description="A calm, focused app that adapts to how you work. Scroll to watch it expand — or jump between the screens."
        />
      </div>

      <ScrollExpand className="mt-6">
        <div className="flex flex-col items-center gap-5">
          <div
            className="flex flex-wrap items-center justify-center gap-1 rounded-full border border-[var(--glass-border)] bg-[var(--glass-bg)]/80 p-1.5 backdrop-blur"
            role="tablist"
            aria-label="Product screens"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            {SCREENS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                role="tab"
                aria-selected={active === id}
                onClick={() => select(id)}
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[12.5px] font-semibold transition-all duration-300 cursor-pointer',
                  active === id
                    ? 'bg-app-text text-app-bg shadow-sm'
                    : 'text-app-text-muted hover:text-app-text hover:bg-[var(--glass-bg-hover)]',
                )}
              >
                <Icon size={13} aria-hidden />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          <div className="relative w-full max-w-[1300px] h-[58vh] min-h-[420px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, scale: 0.985 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.985 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0"
              >
                <AppFrame className="h-full">
                  <Active />
                </AppFrame>
              </motion.div>
            </AnimatePresence>
          </div>

          <p className="text-center text-[12.5px] text-app-text-muted">
            Live product mockups — built with the exact interface you'll use.
          </p>
        </div>
      </ScrollExpand>
    </section>
  );
});