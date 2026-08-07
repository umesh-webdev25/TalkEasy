import { memo } from 'react';
import { cn } from '../../utils/cn';

function StatCard({ label, value, hint }) {
  return (
    <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-3">
      <p className="text-[9px] text-app-text-muted font-medium uppercase tracking-wider">{label}</p>
      <p className="text-lg font-bold text-app-text mt-1">{value}</p>
      <p className="text-[9px] text-app-text-muted mt-0.5">{hint}</p>
    </div>
  );
}

function ConversationRow({ title, preview, time, active }) {
  return (
    <div className={cn('flex items-center gap-2.5 rounded-lg px-2.5 py-2', active ? 'bg-[var(--text-primary)] text-[var(--bg-app)]' : 'hover:bg-[var(--glass-bg-hover)]')}>
      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', active ? 'bg-current' : 'bg-app-text-muted/40')}>
      </span>
      <span className="min-w-0 flex-1">
        <span className={cn('block text-[10px] font-semibold truncate', active ? 'text-[var(--bg-app)]' : 'text-app-text')}>{title}</span>
        <span className={cn('block text-[9px] truncate', active ? 'opacity-70' : 'text-app-text-muted')}>{preview}</span>
      </span>
      <span className={cn('text-[8px] shrink-0', active ? 'opacity-70' : 'text-app-text-muted')}>{time}</span>
    </div>
  );
}

export const DashboardScreen = memo(function DashboardScreen({ className }) {
  return (
    <div className={cn('flex h-full overflow-hidden', className)}>
      <aside className="w-11 border-r border-[var(--glass-border)] bg-[var(--surface-solid)] flex flex-col items-center py-3 gap-2 shrink-0">
        <span className="w-7 h-7 rounded-lg bg-[var(--text-primary)] text-[var(--bg-app)] flex items-center justify-center text-[10px] font-bold">T</span>
        {['⌂', '💬', '🎙️', '🖼️', '📄', '🌐'].map((icon, i) => (
          <span key={i} className={cn('w-9 h-9 rounded-lg flex items-center justify-center text-[13px]', i === 1 ? 'bg-[var(--glass-bg-hover)]' : 'text-app-text-muted')}>
            {icon}
          </span>
        ))}
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--glass-border)]">
          <p className="text-[11px] font-semibold truncate">Morning briefing</p>
          <span className="w-6 h-6 rounded-full bg-[var(--text-primary)] text-[var(--bg-app)] flex items-center justify-center text-[8px] font-semibold">EK</span>
        </div>
        <div className="flex-1 p-3 grid grid-cols-2 gap-2 min-h-0">
          <div className="flex flex-col gap-2 min-h-0">
            <StatCard label="Messages today" value="128" hint="+24% vs yesterday" />
            <StatCard label="Voice minutes" value="36m" hint="12 conversations" />
            <div className="flex-1 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-2 min-h-0">
              <p className="text-[9px] font-semibold text-app-text-muted px-1 pb-1.5">Recent</p>
              <ConversationRow title="Design sprint summary" preview="You: can you recap the action items?" active />
              <ConversationRow title="Beta launch" preview="Draft announcement ready" time="09:41" />
              <ConversationRow title="Travel to Berlin" preview="Itinerary (PDF) analyzed" time="08:12" />
            </div>
          </div>
          <div className="flex flex-col gap-2 min-h-0">
            <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-2">
              <p className="text-[9px] font-semibold text-app-text-muted uppercase">Assistant status</p>
              <div className="flex items-end justify-between gap-1 h-7 mt-2" aria-hidden>
                {Array.from({ length: 16 }, (_, i) => (
                  <span key={i} className="flex-1 rounded-full bg-[var(--text-primary)] opacity-[0.18]" style={{ height: `${20 + Math.abs(Math.sin(i * 1.2)) * 70}%` }} />
                ))}
              </div>
            </div>
            <ConversationRow title="Voice notes" preview="Summarized 3 recordings" time="07:30" active={false} />
            <div className="flex-1 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] overflow-hidden min-h-0">
              <p className="text-[9px] font-semibold text-app-text-muted px-3 pt-2.5">Generated image</p>
              <div className="h-[55%] mx-3 my-2 rounded-lg bg-zinc-400 dark:bg-zinc-800 flex items-center justify-center">
                <span className="text-[9px] text-white/80 font-medium">3D isometric workspace</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});