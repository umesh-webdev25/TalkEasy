import { Suspense, lazy, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'framer-motion';
import { Sparkles, ArrowRight, Play, ShieldCheck } from 'lucide-react';
import { CTAButton, CTAButtonLink } from '../ui/Buttons';
import Magnetic from '../ui/Magnetic';
import { ChatScreen } from '../mockups/Screens';

const AntigravityBackground = lazy(() => import('../animations/AntigravityBackground'));

export default function Hero() {
  const sectionRef = useRef(null);
  const reduce = useReducedMotion();

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 60, damping: 18 });
  const sy = useSpring(my, { stiffness: 60, damping: 18 });

  const mockRotY = useTransform(sx, [-1, 1], [-5, 5]);
  const mockRotX = useTransform(sy, [-1, 1], [4, -4]);
  const cardX = useTransform(sx, [-1, 1], [-16, 16]);

  const onMouseMove = (e) => {
    if (reduce) return;
    const rect = sectionRef.current?.getBoundingClientRect();
    if (!rect) return;
    mx.set(((e.clientX - rect.left) / rect.width) * 2 - 1);
    my.set(((e.clientY - rect.top) / rect.height) * 2 - 1);
  };

  return (
    <section
      id="hero"
      ref={sectionRef}
      onMouseMove={onMouseMove}
      className="relative flex min-h-[100svh] flex-col items-center overflow-hidden pb-16 pt-[130px] sm:pt-[150px]"
    >
      <div className="bg-grid-faint mask-fade-x absolute inset-0 opacity-70" aria-hidden />
      <div
        className="pointer-events-none absolute top-[-18%] left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-[100%] bg-[var(--text-primary)]/[0.035] blur-3xl"
        aria-hidden
      />
      <Suspense fallback={null}>
        <AntigravityBackground className="opacity-70" color="#8b8b95" />
      </Suspense>

      <div className="relative z-10 mx-auto max-w-[1100px] px-6 text-center flex min-h-[calc(100vh-140px)] flex-col items-center justify-center py-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="inline-flex items-center gap-2 rounded-full border border-[var(--glass-border)] bg-[var(--glass-bg)]/80 px-4 py-1.5 text-[12px] font-medium text-app-text-secondary backdrop-blur"
        >
          <Sparkles size={13} aria-hidden />
          Next-generation AI voice assistant
          <span className="h-1 w-1 rounded-full bg-app-text-muted" aria-hidden />
          <span className="font-semibold text-app-text">v2</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="mt-7 text-balance text-[clamp(2.75rem,7.5vw,6rem)] font-bold leading-[0.98] tracking-[-0.04em] text-app-text"
        >
          Talk Naturally
          <br />
          with AI.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mt-6 max-w-2xl text-balance text-base leading-relaxed text-app-text-secondary sm:text-lg"
        >
          Your intelligent AI assistant for voice conversations, chat, translation, documents, and image generation — all in one beautiful workspace.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mt-9 flex flex-col items-center justify-center gap-3.5 sm:flex-row"
        >
          <Magnetic>
            <CTAButtonLink to="/register" className="min-w-[200px]">
              Start Free
              <ArrowRight size={15} aria-hidden />
            </CTAButtonLink>
          </Magnetic>
          <Magnetic>
            <CTAButton href="#showcase" variant="secondary" className="min-w-[200px]">
              <Play size={14} aria-hidden />
              Watch Demo
            </CTAButton>
          </Magnetic>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[12.5px] font-medium text-app-text-muted"
        >
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={13} aria-hidden />
            Private by default
          </span>
          <span className="h-1 w-1 rounded-full bg-app-text-muted/50" aria-hidden />
          <span>Lightning-fast responses</span>
          <span className="h-1 w-1 rounded-full bg-app-text-muted/50" aria-hidden />
          <span>30+ languages</span>
        </motion.div>
      </div>

      {/* App mockup with mouse parallax */}
      <motion.div
        style={{
          rotateX: mockRotX,
          rotateY: mockRotY,
          transformPerspective: 1200,
          x: cardX,
        }}
        className="relative z-10 mt-16 w-full max-w-[1400px] px-5 sm:px-10"
      >
        <motion.div
          initial={{ opacity: 0, y: 44, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.85, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto overflow-hidden rounded-[24px] border border-[var(--glass-border)] bg-[var(--surface-solid)] shadow-[0_60px_140px_-40px_rgba(0,0,0,0.45)]"
        >
          <div className="absolute inset-x-0 top-0 h-1.5 bg-[var(--text-primary)]/10" aria-hidden />
          <div className="block">
            <ChatScreen className="h-auto w-full" />
          </div>
        </motion.div>
      </motion.div>

      <motion.a
        href="#trusted-by"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: 1.6, duration: 1 }}
        className="absolute bottom-5 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-app-text-muted md:flex"
        aria-label="Scroll down"
      >
        <span className="text-[10px] font-medium uppercase tracking-[0.2em]">Scroll</span>
        <span className="h-8 w-px bg-gradient-to-b from-[var(--text-primary)] to-transparent" aria-hidden />
      </motion.a>
    </section>
  );
}