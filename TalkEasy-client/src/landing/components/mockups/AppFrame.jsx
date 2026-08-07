import { memo } from 'react';
import { cn } from '../../utils/cn';

export default memo(function AppFrame({ children, chrome = true, className }) {
  return (
    <div
      className={cn(
        'relative flex flex-col rounded-[24px] border border-[var(--glass-border)] bg-[var(--surface-solid)] overflow-hidden',
        'shadow-[0_40px_120px_-30px_rgba(0,0,0,0.35)]',
        className,
      )}
    >
      {chrome && (
        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-[var(--glass-border)] bg-[var(--glass-bg)]/60 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--text-primary)]/15" />
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--text-primary)]/30" />
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--text-primary)]/15" />
          </div>
          <div className="flex-1 max-w-[260px] mx-auto flex items-center justify-center gap-1.5 rounded-lg border border-[var(--glass-border)] bg-[var(--surface-solid)] px-3 py-1 text-[10px] text-app-text-muted font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            talkeasy.ai
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--text-primary)]/40" />
        </div>
      )}
      <div className="flex-1 min-h-0">{children}</div>
    </div>
  );
});