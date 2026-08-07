import { memo, Suspense, lazy } from 'react';
import { ArrowRight } from 'lucide-react';
import { CTAButtonLink } from '../ui/Buttons';
import Magnetic from '../ui/Magnetic';
import Reveal from '../ui/Reveal';

const AntigravityBackground = lazy(() => import('../animations/AntigravityBackground'));

export const CTA = memo(function CTA() {
  return (
    <section id="contact" className="relative overflow-hidden py-28 sm:py-36">
      <div className="bg-grid-faint mask-fade-x absolute inset-0 opacity-60" aria-hidden />
      <Suspense fallback={null}>
        <AntigravityBackground className="opacity-60" color="#8b8b95" />
      </Suspense>

      <div className="relative z-10 mx-auto max-w-[900px] px-6 text-center">
        <Reveal>
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--glass-border)] bg-[var(--glass-bg)]/80 px-4 py-1.5 text-[12px] font-medium text-app-text-secondary backdrop-blur">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" aria-hidden />
            Ready when you are
          </span>
        </Reveal>
        <Reveal delay={0.1}>
          <h2 className="mt-6 text-balance text-[clamp(2.4rem,6vw,4.5rem)] font-bold leading-[1.02] tracking-[-0.04em] text-app-text">
            Ready to experience
            <br />
            the future?
          </h2>
        </Reveal>
        <Reveal delay={0.2}>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-app-text-secondary sm:text-lg">
            Join the thousands of people who replaced five tools with one conversation. Set up in under a minute.
          </p>
        </Reveal>
        <Reveal delay={0.3}>
          <div className="mt-10 flex flex-col items-center justify-center gap-3.5 sm:flex-row">
            <Magnetic>
              <CTAButtonLink to="/register" className="min-w-[220px] px-9">
                Start Free
                <ArrowRight size={15} aria-hidden />
              </CTAButtonLink>
            </Magnetic>
            <a
              href="mailto:talkeasyofficial100@gmail.com"
              className="text-[14px] font-medium text-app-text-secondary underline-offset-4 hover:text-app-text hover:underline transition-colors"
            >
              or talk to us →
            </a>
          </div>
        </Reveal>
        <Reveal delay={0.4}>
          <p className="mt-8 text-[12px] text-app-text-muted">No credit card required · Free forever plan</p>
        </Reveal>
      </div>
    </section>
  );
});