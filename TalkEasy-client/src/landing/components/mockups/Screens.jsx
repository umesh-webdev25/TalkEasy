import { memo } from 'react';
import { cn } from '../../utils/cn';

function Avatar({ initials, className }) {
  return (
    <span
      className={cn(
        'flex items-center justify-center rounded-full bg-[var(--text-primary)] text-[var(--bg-app)] font-semibold shrink-0',
        className,
      )}
    >
      {initials}
    </span>
  );
}

function Bubble({ from, children, time }) {
  const isAI = from === 'ai';
  return (
    <div className={cn('flex items-end gap-2', isAI ? 'justify-start' : 'justify-end')}>
      {isAI && <Avatar initials="TE" className="w-6 h-6 text-[9px]" />}
      <div
        className={cn(
          'px-3.5 py-2.5 rounded-2xl text-[11px] leading-relaxed max-w-[75%]',
          isAI
            ? 'bg-[var(--glass-bg)] border border-[var(--glass-border)] text-app-text rounded-bl-md'
            : 'bg-[var(--text-primary)] text-[var(--bg-app)] rounded-br-md',
        )}
      >
        {children}
        {time && (
          <span className={cn('block mt-1 text-[9px]', isAI ? 'text-app-text-muted' : 'opacity-60')}>
            {time}
          </span>
        )}
      </div>
    </div>
  );
}

export const ChatScreen = memo(function ChatScreen({ className }) {
  return (
    <div className={cn('flex flex-col gap-2.5 p-4 h-full overflow-hidden', className)}>
      <div className="mx-auto px-3 py-1 rounded-full bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[9px] text-app-text-muted font-medium">
        Today
      </div>
      <Bubble from="ai">
        Hey! I'm TalkEasy. Ask me anything — I can chat, read your PDFs, translate, or generate images.
      </Bubble>
      <Bubble from="user" time="12:41">
        Summarize this PDF for me and translate the key points to Spanish.
      </Bubble>
      <Bubble from="ai" time="12:42">
        Done. The report projects 34% revenue growth in Q3. Key points translated to Spanish for you 👇
      </Bubble>
      <Bubble from="ai">
        <span className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-[var(--text-primary)]/10 border border-[var(--glass-border)] flex items-center justify-center text-[9px]">📄</span>
          <span>
            <span className="block font-semibold">Q3_Report.pdf</span>
            <span className="block text-[9px] text-app-text-muted">3 pages · analyzed</span>
          </span>
        </span>
      </Bubble>
    </div>
  );
});

export const VoiceCallScreen = memo(function VoiceCallScreen({ className }) {
  return (
    <div className={cn('relative h-full flex flex-col items-center justify-center gap-6 p-6 overflow-hidden', className)}>
      <div className="absolute inset-0 bg-grid-faint opacity-60" aria-hidden />
      <div className="relative flex flex-col items-center gap-5">
        <div className="relative">
          <span className="absolute inset-0 rounded-full border border-[var(--text-primary)]/10 animate-pulse-slow" />
          <Avatar initials="TE" className="w-24 h-24 text-2xl" />
          <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-500 border-2 border-[var(--bg-app)]" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold">TalkEasy Voice</p>
          <p className="text-[10px] text-app-text-muted mt-0.5 font-medium">Live · 16 kHz · studio quality</p>
        </div>
        <div className="flex items-end justify-center gap-1 h-10 text-app-text" aria-hidden>
          {Array.from({ length: 32 }, (_, i) => (
            <span
              key={i}
              className="w-1 rounded-full bg-current animate-pulse-slow"
              style={{
                height: `${18 + Math.abs(Math.sin(i * 0.9)) * 60}%`,
                animationDuration: `${0.9 + (i % 7) * 0.14}s`,
                animationDelay: `${(i % 5) * 0.09}s`,
              }}
            />
          ))}
        </div>
        <div className="flex items-center gap-3">
          <span className="w-11 h-11 rounded-full border border-[var(--glass-border)] bg-[var(--glass-bg)] flex items-center justify-center text-[11px]">🔇</span>
          <span className="w-14 h-14 rounded-full bg-[var(--text-primary)] text-[var(--bg-app)] flex items-center justify-center text-[11px]">📞</span>
          <span className="w-11 h-11 rounded-full border border-[var(--glass-border)] bg-[var(--glass-bg)] flex items-center justify-center text-[11px]">✎</span>
        </div>
      </div>
    </div>
  );
});

export const ImageGenScreen = memo(function ImageGenScreen({ className }) {
  const tiles = [
    { label: 'Midnight city', tone: 'bg-zinc-800 text-zinc-300' },
    { label: 'Abstract bloom', tone: 'bg-zinc-200 text-zinc-600' },
    { label: 'Isometric office', tone: 'bg-zinc-700 text-zinc-300' },
    { label: 'Neon waves', tone: 'bg-zinc-300 text-zinc-700' },
  ];
  return (
    <div className={cn('flex flex-col gap-3 p-4 h-full overflow-hidden', className)}>
      <div className="flex items-center gap-2 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3.5 py-2.5">
        <span className="text-[11px] text-app-text flex-1 truncate">a minimal 3D isometric workspace with soft shadows</span>
        <span className="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-[var(--text-primary)] text-[var(--bg-app)] shrink-0">Generate</span>
      </div>
      <div className="grid grid-cols-4 gap-2 flex-1 min-h-0">
        {tiles.map((tile) => (
          <div key={tile.label} className={cn('relative rounded-xl overflow-hidden border border-[var(--glass-border)]', tile.tone)}>
            <span className="absolute inset-0 flex items-center justify-center text-[9px] font-medium opacity-80 px-1 text-center">
              {tile.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
});

export const PdfChatScreen = memo(function PdfChatScreen({ className }) {
  return (
    <div className={cn('grid grid-cols-[1fr_1.6fr] h-full overflow-hidden', className)}>
      <div className="border-r border-[var(--glass-border)] p-3 flex flex-col gap-2 overflow-hidden">
        <p className="text-[10px] font-semibold text-app-text-muted px-1">Documents</p>
        {[
          { name: 'Q3_Report.pdf', pages: '3 pages' },
          { name: 'Resume_TE.pdf', pages: '2 pages' },
          { name: 'Whitepaper.pdf', pages: '12 pages' },
        ].map((doc, i) => (
          <div key={doc.name} className={cn('flex items-center gap-2.5 rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] px-2.5 py-2', i === 0 && 'ring-1 ring-[var(--text-primary)]')}>
            <span className="w-6 h-7 rounded bg-red-500/15 border border-red-500/25 flex items-center justify-center text-[9px]">PDF</span>
            <span className="min-w-0">
              <span className="block text-[10px] font-medium truncate">{doc.name}</span>
              <span className="block text-[8px] text-app-text-muted">{doc.pages}</span>
            </span>
          </div>
        ))}
        <div className="flex-1 rounded-lg border border-dashed border-[var(--glass-border)] flex items-center justify-center text-[9px] text-app-text-muted">
          Drop a document to analyze
        </div>
      </div>
      <div className="flex flex-col gap-2.5 p-3.5 overflow-hidden">
        <Bubble from="user" time="14:02">What are the key findings in chapter 2?</Bubble>
        <Bubble from="ai" time="14:02">
          Chapter 2 outlines three findings: adoption grew 41% quarter over quarter, retention improved 12%, and the APAC region is your fastest-growing segment.
        </Bubble>
        <Bubble from="user">Can you quote the exact sentence on pricing?</Bubble>
        <Bubble from="ai">"The annual plan includes unlimited voice minutes and priority GPU access." — §2.4</Bubble>
      </div>
    </div>
  );
});