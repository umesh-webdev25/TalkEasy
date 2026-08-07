import { memo } from 'react';
import { cn } from '../../utils/cn';

const LOGOS = [
  'Linear',
  'Notion',
  'Raycast',
  'Vercel',
  'Loom',
  'Figma',
  'OpenAI',
  'Discord',
];

function Wordmark({ name }) {
  return (
    <span className="inline-flex items-center gap-2.5 whitespace-nowrap text-app-text-muted transition-colors duration-300 hover:text-app-text select-none" aria-hidden>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-50" />
      <span className="text-[15px] font-semibold tracking-tight uppercase">
        {name}
      </span>
    </span>
  );
}

export const LogoLoop = memo(function LogoLoop({ className, speed = 42 }) {
  const row = [...LOGOS, ...LOGOS];
  return (
    <div className={cn('mask-fade-x overflow-hidden', className)}>
      <div
        className="animate-marquee flex w-max items-center gap-14 pr-14 hover:[animation-play-state:paused]"
        style={{ '--marquee-duration': `${speed}s` }}
        role="presentation"
      >
        {row.map((name, i) => (
          <Wordmark key={`${name}-${i}`} name={name} />
        ))}
      </div>
    </div>
  );
});