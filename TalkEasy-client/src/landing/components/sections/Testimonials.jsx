import { memo } from 'react';
import { Star } from 'lucide-react';
import SectionHeading from '../ui/SectionHeading';
import Reveal from '../ui/Reveal';
import { cn } from '../../utils/cn';

const TESTIMONIALS = [
  {
    quote:
      'The voice mode is uncanny. It feels like talking to a colleague, not an AI. I dictate entire reports now and it just works.',
    name: 'Elena Kovač',
    role: 'Product Manager · NorthPixel',
    initials: 'EK',
  },
  {
    quote:
      'I dropped every other PDF tool the day I tried the document chat. Questions about a 200-page report are answered instantly.',
    name: 'Arjun Singh',
    role: 'Analyst · Meridian Capital',
    initials: 'AS',
  },
  {
    quote:
      'Easily the most beautiful AI interface I have used. Fast, focused, zero clutter. This is what a premium product looks like.',
    name: 'Julia Petrova',
    role: 'Design Director · Studio Nox',
    initials: 'JP',
  },
  {
    quote:
      'Translation plus voice means my calls with overseas clients are seamless. It quietly became my most-used tool.',
    name: 'Marco Núñez',
    role: 'Founder · Brightly',
    initials: 'MN',
  },
  {
    quote:
      'Privacy was my concern — nothing leaves our workspace. Our legal team approved it in a day.',
    name: 'Hana Yoshida',
    role: 'Security Lead · Kite Systems',
    initials: 'HY',
  },
  {
    quote:
      'Switched from three tools to one. Setup took five minutes and the team has not looked back since.',
    name: 'Theo Laurent',
    role: 'CTO · Casper Studio',
    initials: 'TL',
  },
];

function Stars() {
  return (
    <div className="flex items-center gap-1 text-app-text" role="img" aria-label="5 out of 5 stars">
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} size={14} fill="currentColor" aria-hidden />
      ))}
    </div>
  );
}

export const Testimonials = memo(function Testimonials() {
  return (
    <section id="testimonials" className="relative py-24 sm:py-32 border-t border-[var(--glass-border)] bg-[var(--glass-bg)]/30">
      <div className="mx-auto max-w-[1400px] px-6">
        <SectionHeading
          eyebrow="Testimonials"
          title="Loved by calm, busy people."
          description="Thousands of teams run their conversations through TalkEasy every day. Here's what a few of them say."
        />

        <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <Reveal key={t.name} delay={(i % 3) * 0.08}>
              <figure className="group flex h-full flex-col justify-between rounded-[24px] border border-[var(--glass-border)] bg-[var(--surface-solid)] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_28px_60px_-24px_rgba(0,0,0,0.3)]">
                <div>
                  <Stars />
                  <blockquote className="mt-4 text-[14.5px] leading-relaxed text-app-text">“{t.quote}”</blockquote>
                </div>
                <figcaption className="mt-6 flex items-center gap-3">
                  <span
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-full text-[11px] font-semibold',
                      i % 2 ? 'bg-[var(--text-primary)] text-[var(--bg-app)]' : 'border border-[var(--glass-border)] bg-[var(--glass-bg)] text-app-text',
                    )}
                  >
                    {t.initials}
                  </span>
                  <span>
                    <span className="block text-[13px] font-semibold text-app-text">{t.name}</span>
                    <span className="block text-[12px] text-app-text-muted">{t.role}</span>
                  </span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
});