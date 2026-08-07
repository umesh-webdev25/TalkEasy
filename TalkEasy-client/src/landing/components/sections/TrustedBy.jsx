import { memo } from 'react';
import { LogoLoop } from '../animations/LogoLoop';
import Reveal from '../ui/Reveal';

export const TrustedBy = memo(function TrustedBy() {
  return (
    <section id="trusted-by" className="relative py-16 sm:py-20 border-y border-[var(--glass-border)] bg-[var(--glass-bg)]/40">
      <div className="mx-auto max-w-[1400px] px-6">
        <Reveal>
          <p className="text-center text-[12px] font-semibold uppercase tracking-[0.22em] text-app-text-muted">
            Trusted by teams at
          </p>
        </Reveal>
        <Reveal delay={0.1} className="mt-8">
          <LogoLoop speed={38} />
        </Reveal>
      </div>
    </section>
  );
});