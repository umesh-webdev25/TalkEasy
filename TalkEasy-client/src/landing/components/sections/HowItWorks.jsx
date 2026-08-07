import { memo } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Mic, BrainCircuit, Send, Volume2 } from 'lucide-react';
import SectionHeading from '../ui/SectionHeading';
import { useRef } from 'react';

const STEPS = [
  {
    icon: Mic,
    step: '01',
    title: 'Speak',
    desc: 'Press the mic and talk naturally — or just type. TalkEasy understands context, tone and intent.',
  },
  {
    icon: BrainCircuit,
    step: '02',
    title: 'AI Understands',
    desc: 'Frontier speech and language models transcribe, reason and fetch what you need in real time.',
  },
  {
    icon: Send,
    step: '03',
    title: 'Generates Response',
    desc: 'Answers stream back instantly — with sources, documents and images when relevant.',
  },
  {
    icon: Volume2,
    step: '04',
    title: 'Speaks Back',
    desc: 'A natural voice replies in your chosen language, or read the response in a clean card.',
  },
];

export const HowItWorks = memo(function HowItWorks() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 75%', 'end 60%'],
  });
  const lineScale = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <section id="how-it-works" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-[1200px] px-6">
        <SectionHeading
          eyebrow="How it works"
          title="From speech to answer in four steps."
          description="The whole loop takes less than a second — no tabs, no context switching, just conversation."
        />

        <div ref={ref} className="relative mt-16 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          <motion.div
            aria-hidden
            className="absolute left-0 right-0 top-[52px] hidden h-px lg:block"
            style={{
              background:
                'linear-gradient(90deg, transparent, var(--text-primary) 12%, var(--text-primary) 88%, transparent)',
            }}
          >
            <motion.span
              className="absolute inset-0 bg-[var(--text-primary)]"
              style={{ scaleX: lineScale, transformOrigin: 'left', opacity: 0.35 }}
            />
          </motion.div>

          {STEPS.map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
              className="relative flex flex-col items-start lg:items-center lg:text-center"
            >
              <span className="relative z-10 flex h-[52px] w-[52px] items-center justify-center rounded-2xl border border-[var(--glass-border)] bg-[var(--surface-solid)] text-app-text shadow-[0_10px_28px_-12px_rgba(0,0,0,0.25)]">
                <s.icon size={20} aria-hidden />
              </span>
              <span className="mt-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-app-text-muted">
                Step {s.step}
              </span>
              <h3 className="mt-2 text-lg font-semibold tracking-tight text-app-text">{s.title}</h3>
              <p className="mt-2 max-w-[280px] text-[13.5px] leading-relaxed text-app-text-secondary">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
});