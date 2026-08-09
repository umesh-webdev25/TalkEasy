import Reveal from './Reveal';
import { cn } from '../../utils/cn';

export default function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'center',
  className,
}) {
  const alignCls =
    align === 'center' ? 'items-center text-center' : 'items-start text-left';

  return (
    <div className={cn('flex flex-col gap-4 max-w-2xl mx-auto', alignCls, className)}>
      {eyebrow && (
        <Reveal delay={0}>
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
            <span className="h-px w-6 bg-[var(--text-primary)]" aria-hidden />
            {eyebrow}
            <span className="h-px w-6 bg-[var(--text-primary)]" aria-hidden />
          </span>
        </Reveal>
      )}
      <Reveal delay={0.05}>
        <h2 className="text-[clamp(2.5rem,6vw,4.5rem)] font-bold tracking-[-0.03em] leading-[1.05] text-balance">
          {title}
        </h2>
      </Reveal>
      {description && (
        <Reveal delay={0.12}>
          <p className="text-lg sm:text-xl text-app-text-secondary leading-relaxed text-balance">
            {description}
          </p>
        </Reveal>
      )}
    </div>
  );
}