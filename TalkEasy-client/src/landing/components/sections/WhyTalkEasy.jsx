import { memo } from 'react';
import { motion } from 'framer-motion';
import { Mic, Zap, ShieldCheck, Lock, BrainCircuit, Languages } from 'lucide-react';
import SectionHeading from '../ui/SectionHeading';
import Reveal from '../ui/Reveal';
import { Waveform } from '../mockups/VoiceOrb';
import { cn } from '../../utils/cn';

const BENEFITS = [
  {
    icon: Mic,
    title: 'Natural Voice',
    desc: 'Conversational latency under 300ms makes talking with AI feel effortless.',
  },
  {
    icon: Zap,
    title: 'Incredibly Fast',
    desc: 'Streaming responses begin before you finish speaking.',
  },
  {
    icon: ShieldCheck,
    title: 'Secure',
    desc: 'JWT-authenticated sessions and encrypted transport on every request.',
  },
  {
    icon: Lock,
    title: 'Private',
    desc: 'Your conversations are never used to train models. Ever.',
  },
  {
    icon: BrainCircuit,
    title: 'Modern AI',
    desc: 'Powered by frontier language and speech models, continuously upgraded.',
  },
  {
    icon: Languages,
    title: 'Multi-language',
    desc: 'Speak, read and translate in 30+ languages natively.',
  },
];

function Illustration() {
  return (
    <div className="relative flex h-full min-h-[480px] items-center justify-center">
      <div className="bg-grid-faint mask-fade-x absolute inset-0 opacity-60" aria-hidden />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="relative flex h-[340px] w-[340px] items-center justify-center sm:h-[400px] sm:w-[400px]"
      >
        <span className="absolute inset-0 rounded-full border border-[var(--glass-border)] animate-spin-slow" aria-hidden>
          <span className="absolute left-1/2 top-0 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--text-primary)]" />
        </span>
        <span className="absolute inset-8 rounded-full border border-dashed border-[var(--glass-border)]" aria-hidden />
        <span className="absolute inset-20 rounded-full border border-[var(--glass-border)] bg-[var(--glass-bg)] shadow-[0_30px_80px_-24px_rgba(0,0,0,0.3)]" aria-hidden>
          <span className="absolute inset-4 rounded-full bg-[var(--text-primary)]/[0.04]" />
          <span className="absolute inset-x-8 bottom-8 flex h-10 items-end text-app-text opacity-80" aria-hidden>
            <Waveform barCount={18} active />
          </span>
          <span className="absolute inset-0 flex items-center justify-center">
            <Mic size={30} />
          </span>
        </span>

        {[
          { text: 'Private by design', cls: 'top-6 -left-4 sm:-left-10' },
          { text: '< 300ms latency', cls: 'top-1/3 -right-2 sm:-right-8' },
          { text: '30+ languages', cls: 'bottom-8 -left-2 sm:-left-6' },
          { text: 'Studio voices', cls: 'bottom-24 right-0 sm:-right-6' },
        ].map((chip, i) => (
          <motion.span
            key={chip.text}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 + i * 0.12, duration: 0.5 }}
            className={cn(
              'absolute rounded-full border border-[var(--glass-border)] bg-[var(--glass-bg)]/90 px-3.5 py-1.5 text-[11.5px] font-semibold text-app-text shadow-[0_12px_30px_-10px_rgba(0,0,0,0.2)] backdrop-blur',
              chip.cls,
            )}
          >
            {chip.text}
          </motion.span>
        ))}
      </motion.div>
    </div>
  );
}

export const WhyTalkEasy = memo(function WhyTalkEasy() {
  return (
    <section id="why" className="relative py-24 sm:py-32 border-t border-[var(--glass-border)] bg-[var(--glass-bg)]/30">
      <div className="mx-auto max-w-[1400px] px-6">
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-2 lg:gap-10">
          <Illustration />

          <div>
            <SectionHeading
              align="left"
              eyebrow="Why TalkEasy"
              title="Designed for how humans actually talk."
              description="Every detail — from voice latency to visual calm — is tuned so the AI disappears and the conversation takes over."
              className="mx-0"
            />
            <div className="mt-10 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              {BENEFITS.map((b, i) => (
                <Reveal key={b.title} delay={i * 0.06}>
                  <div className="group flex items-start gap-3.5 rounded-2xl border border-[var(--glass-border)] bg-[var(--surface-solid)] p-4 transition-colors duration-300 hover:border-[var(--text-primary)]/40">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] text-app-text">
                      <b.icon size={16} aria-hidden />
                    </span>
                    <span>
                      <span className="block text-[14px] font-semibold text-app-text">{b.title}</span>
                      <span className="mt-1 block text-[12.5px] leading-relaxed text-app-text-secondary">{b.desc}</span>
                    </span>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});