import { memo } from 'react';
import { motion } from 'framer-motion';
import { Mic } from 'lucide-react';
import { cn } from '../../utils/cn';

export const Waveform = memo(function Waveform({ className, barCount = 24, active = true }) {
  const bars = Array.from({ length: barCount }, (_, i) => 0.35 + (Math.sin(i * 1.7) * 0.5 + 0.6) * 0.55);
  return (
    <div className={cn('flex items-end justify-center gap-[3px] h-full', className)} aria-hidden>
      {bars.map((h, i) => (
        <motion.span
          key={i}
          className="w-[3px] rounded-full bg-current origin-bottom"
          initial={{ scaleY: 0.3 }}
          animate={active ? { scaleY: [0.3, h, 0.3] } : { scaleY: 0.3 }}
          transition={{
            duration: 1 + (i % 5) * 0.15,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: (i % 6) * 0.08,
          }}
        />
      ))}
    </div>
  );
});

export const VoiceOrb = memo(function VoiceOrb({ size = 240, active = true, className }) {
  return (
    <div
      className={cn('relative flex items-center justify-center', className)}
      style={{ width: size, height: size }}
      aria-hidden
    >
      {[0.55, 0.78, 1].map((scale, i) => (
        <motion.span
          key={i}
          className="absolute inset-0 rounded-full border border-[var(--text-primary)]/15"
          animate={active ? { scale: [scale * 0.85, scale], opacity: [0.5, 0] } : { opacity: 0 }}
          transition={{
            duration: 2.4,
            repeat: Infinity,
            ease: 'easeOut',
            delay: i * 0.35,
          }}
        />
      ))}
      <motion.span
        className="absolute inset-0 rounded-full bg-[var(--text-primary)]/[0.04]"
        animate={active ? { scale: [1, 1.06] } : {}}
        transition={{ duration: 1.6, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
      />
      <span className="absolute inset-[24%] rounded-full bg-[var(--glass-bg)] border border-[var(--glass-border)] shadow-[0_18px_50px_-12px_rgba(0,0,0,0.25)] flex items-center justify-center">
        <span className="absolute inset-x-8 bottom-6 h-5 text-app-text opacity-70">
          <Waveform active={active} barCount={14} />
        </span>
        <Mic className="w-8 h-8 text-app-text" aria-hidden />
      </span>
    </div>
  );
});