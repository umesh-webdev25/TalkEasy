import { memo } from 'react';
import {
  Mic,
  MessageSquare,
  Sparkles,
  FileText,
  Languages,
  AudioLines,
  Volume2,
  BrainCircuit,
  Moon,
  Zap,
} from 'lucide-react';
import SectionHeading from '../ui/SectionHeading';
import TiltCard from '../ui/TiltCard';
import Reveal from '../ui/Reveal';
import { cn } from '../../utils/cn';
import { Waveform } from '../mockups/VoiceOrb';

function FeatureCard({ icon: Icon, title, desc, visual, span, delay, className }) {
  return (
    <Reveal delay={delay} className={className}>
      <TiltCard maxTilt={5} className="h-full">
        <div
          className={cn(
            'group relative flex h-full min-h-[240px] flex-col overflow-hidden rounded-[24px] border border-[var(--glass-border)] bg-[var(--surface-solid)] p-6 transition-all duration-500',
            'hover:border-[var(--text-primary)]/40 hover:shadow-[0_28px_70px_-24px_rgba(0,0,0,0.35)]',
            span,
          )}
        >
          {visual && <div className="pointer-events-none absolute inset-0">{visual}</div>}
          <div className="relative z-10 flex h-full flex-col">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] text-app-text">
              <Icon size={18} aria-hidden />
            </span>
            <h3 className="mt-5 text-[17px] font-semibold tracking-tight text-app-text">{title}</h3>
            <p className="mt-2 max-w-md text-[13.5px] leading-relaxed text-app-text-secondary">{desc}</p>
          </div>
        </div>
      </TiltCard>
    </Reveal>
  );
}

const ChatBubbles = () => (
  <div className="absolute inset-x-6 bottom-5 flex flex-col gap-2" aria-hidden>
    <span className="max-w-[72%] self-end rounded-2xl rounded-br-md bg-[var(--text-primary)] px-3.5 py-2 text-[11px] text-[var(--bg-app)]">
      Summarize my meeting notes
    </span>
    <span className="max-w-[78%] self-start rounded-2xl rounded-bl-md border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3.5 py-2 text-[11px] text-app-text">
      Done — 3 action items extracted from your voice recording.
    </span>
  </div>
);

const ImageTiles = () => (
  <div className="absolute inset-x-6 bottom-5 grid grid-cols-4 gap-1.5" aria-hidden>
    {['bg-zinc-900', 'bg-zinc-400', 'bg-zinc-700', 'bg-zinc-300'].map((t, i) => (
      <span key={i} className={cn('h-12 rounded-lg opacity-90', t)} />
    ))}
  </div>
);

const TinyWave = () => (
  <div className="absolute inset-x-6 bottom-4 h-9 text-app-text-muted opacity-70" aria-hidden>
    <Waveform barCount={16} />
  </div>
);

const MiniPdf = () => (
  <div className="absolute -right-6 -top-6 flex gap-2 rotate-[8deg]" aria-hidden>
    {[2, 4].map((i) => (
      <span
        key={i}
        className="flex h-16 w-11 flex-col gap-1 rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] p-2 opacity-90"
      >
        <span className="text-[7px] font-bold text-app-text-muted">PDF</span>
        <span className="h-0.5 w-full bg-[var(--text-primary)]/30" />
        <span className="h-0.5 w-4/5 bg-[var(--text-primary)]/20" />
        <span className="h-0.5 w-full bg-[var(--text-primary)]/15" />
      </span>
    ))}
  </div>
);

const Globe = ({ flip = false }) => (
  <div
    className={cn(
      'absolute -top-8 flex h-36 w-36 items-center justify-center rounded-[20%] border border-[var(--glass-border)] bg-[var(--glass-bg)] text-app-text',
      flip ? '-left-8 -rotate-12' : '-right-8 rotate-12',
    )}
    aria-hidden
  >
    <span className="px-3 text-[13px] font-semibold tracking-tight">Translate →</span>
  </div>
);

const MemoryBars = () => {
  const rows = [42, 68, 55, 90, 48, 78];
  return (
    <div className="absolute inset-x-6 bottom-5 flex items-end gap-1.5" aria-hidden>
      {rows.map((h, i) => (
        <span
          key={i}
          className="w-2 rounded-full bg-[var(--text-primary)] opacity-20"
          style={{ height: `${h * 0.5}px` }}
        />
      ))}
    </div>
  );
};

const SocialBand = () => (
  <div className="absolute inset-x-6 bottom-5 flex items-center justify-between" aria-hidden>
    <span className="flex -space-x-2.5">
      {['EK', 'AS', 'JP', 'MN', '+'].map((a, i) => (
        <span
          key={i}
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-full border-2 border-[var(--surface-solid)] text-[10px] font-semibold',
            i % 2 ? 'bg-[var(--text-primary)] text-[var(--bg-app)]' : 'bg-[var(--glass-bg)] text-app-text',
          )}
        >
          {a}
        </span>
      ))}
    </span>
    <span className="text-[13px] font-semibold text-app-text">40k+ teams</span>
  </div>
);

const FEATURES = [
  {
    icon: Mic,
    title: 'Voice Assistant',
    desc: 'Have natural, real-time conversations. Talk with your AI and hear it respond — hands-free, in your own language.',
    span: 'lg:col-span-7 lg:row-span-2',
    visual: (
      <div className="absolute right-0 top-1/2 hidden -translate-y-1/2 lg:block" aria-hidden>
        <div className="relative flex h-[300px] w-[300px] items-center justify-center">
          <span className="absolute inset-0 rounded-full border border-[var(--text-primary)]/10 animate-pulse-slow" />
          <span className="absolute inset-[18%] rounded-full bg-[var(--glass-bg)] border border-[var(--glass-border)] shadow-[0_24px_60px_-20px_rgba(0,0,0,0.3)]">
            <span className="absolute inset-3 flex items-end justify-center pb-6 text-app-text opacity-70">
              <Waveform barCount={14} active />
            </span>
            <span className="absolute inset-0 flex items-center justify-center">
              <Mic size={26} />
            </span>
          </span>
        </div>
      </div>
    ),
  },
  {
    icon: MessageSquare,
    title: 'Intelligent AI Chat',
    desc: 'Lightning-fast answers with full conversation memory — ask anything, in any style.',
    span: 'lg:col-span-5',
    visual: <ChatBubbles />,
  },
  {
    icon: Sparkles,
    title: 'Image Generator',
    desc: 'Turn words into stunning images with a single prompt, right out in the chat.',
    span: 'lg:col-span-4',
    visual: <ImageTiles />,
  },
  {
    icon: FileText,
    title: 'PDF Reader',
    desc: 'Upload a document and ask questions. Talk directly to your files.',
    span: 'lg:col-span-4',
    visual: <MiniPdf />,
  },
  {
    icon: Languages,
    title: 'Translator',
    desc: 'Translate messages and documents across 30+ languages instantly.',
    span: 'lg:col-span-4',
    visual: <Globe />,
  },
  {
    icon: AudioLines,
    title: 'Speech to Text',
    desc: 'Real-time, accurate transcription of any voice.',
    span: 'lg:col-span-3',
    visual: <TinyWave />,
  },
  {
    icon: Volume2,
    title: 'Text to Speech',
    desc: 'Studio-quality voices that speak answers aloud.',
    span: 'lg:col-span-3',
    visual: <TinyWave />,
  },
  {
    icon: BrainCircuit,
    title: 'Conversation Memory',
    desc: 'Context carried across every session.',
    span: 'lg:col-span-3',
    visual: <MemoryBars />,
  },
  {
    icon: Moon,
    title: 'Dark Mode',
    desc: 'Obsidian-calm interface built for night.',
    span: 'lg:col-span-3',
    visual: <Globe flip />,
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    desc: 'GPU-accelerated responses in milliseconds.',
    span: 'lg:col-span-6',
  },
  {
    icon: null,
    title: 'Rated 5 stars',
    desc: 'The most beautiful AI workspace on the web.',
    span: 'lg:col-span-6',
    visual: <SocialBand />,
    noIcon: true,
  },
];

export const Features = memo(function Features() {
  return (
    <section id="features" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-[1400px] px-6">
        <SectionHeading
          eyebrow="Features"
          title="Everything your conversations need."
          description="One beautifully minimal workspace for voice, chat, documents, translation, and image generation — engineered for speed and privacy."
        />

        <div className="mt-16 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-12">
          {FEATURES.map((f, i) => (
            <FeatureCard
              key={f.title}
              {...f}
              className={cn('sm:col-span-2', f.span)}
              delay={(i % 3) * 0.06}
              icon={f.noIcon ? Sparkles : f.icon}
            />
          ))}
        </div>
      </div>
    </section>
  );
});