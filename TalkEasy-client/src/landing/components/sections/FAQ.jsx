import { useState, memo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Plus } from 'lucide-react';
import SectionHeading from '../ui/SectionHeading';
import Reveal from '../ui/Reveal';
import { cn } from '../../utils/cn';

const FAQS = [
  {
    q: 'How does the voice assistant work?',
    a: 'Press the microphone, speak naturally, and TalkEasy transcribes in real time, thinks, then answers in chat or with a natural voice. The whole loop typically completes in under a second.',
  },
  {
    q: 'Is my data private and secure?',
    a: 'Yes. Sessions are protected with JWT authentication and all traffic is encrypted in transit. Your conversation history is never sold and never used to train models.',
  },
  {
    q: 'Can I upload and chat with PDFs?',
    a: 'Absolutely. Upload a document, and TalkEasy extracts its content and reason over it — sums, quotes, and highlights from any chapter, instantly.',
  },
  {
    q: 'Which languages are supported?',
    a: '30+ languages across voice transcription, text-to-speech, and translation. The AI auto-detects the language you speak.',
  },
  {
    q: 'Does the free plan include voice?',
    a: 'It does — 10 voice minutes per month, plus 50 chats a day. Upgrade to Pro for unlimited voice and documents.',
  },
  {
    q: 'Can I generate and analyze images?',
    a: 'Yes. Describe an image for generation, or upload one for visual analysis and conversation — both included on every plan.',
  },
];

function FaqItem({ item, open, onToggle, index }) {
  const reduce = useReducedMotion();
  const panelId = `faq-panel-${index}`;
  const buttonId = `faq-button-${index}`;

  return (
    <div
      className={cn(
        'rounded-[20px] border transition-colors duration-300',
        open ? 'border-[var(--text-primary)]/40 bg-[var(--surface-solid)]' : 'border-[var(--glass-border)] bg-transparent hover:border-[var(--text-primary)]/30',
      )}
    >
      <button
        id={buttonId}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left cursor-pointer"
      >
        <span className="text-[15.5px] font-semibold tracking-tight text-app-text">{item.q}</span>
        <motion.span
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors', open ? 'border-(--text-primary) bg-app-text text-app-bg' : 'border-[var(--glass-border)] text-app-text-muted')}
        >
          <Plus size={15} aria-hidden />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={panelId}
            role="region"
            aria-labelledby={buttonId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: reduce ? 0 : 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p className="px-6 pb-6 text-[14px] leading-relaxed text-app-text-secondary">{item.a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export const FAQ = memo(function FAQ() {
  const [open, setOpen] = useState(0);
  const toggle = (i) => setOpen((cur) => (cur === i ? -1 : i));

  return (
    <section id="faq" className="relative py-24 sm:py-32 border-t border-[var(--glass-border)] bg-[var(--glass-bg)]/30">
      <div className="mx-auto max-w-[840px] px-6">
        <SectionHeading
          eyebrow="FAQ"
          title="Questions, answered."
          description="Everything you might want to know before you start."
        />

        <div className="mt-12 flex flex-col gap-3">
          {FAQS.map((item, i) => (
            <Reveal key={item.q} delay={i * 0.05} y={16}>
              <FaqItem item={item} index={i} open={open === i} onToggle={() => toggle(i)} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
});