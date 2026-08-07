import { memo, Suspense, lazy } from 'react';
import {
  MessageSquare,
  Mic,
  Images,
  FileText,
  Languages,
  Globe,
  BrainCircuit,
  Workflow,
} from 'lucide-react';
import SectionHeading from '../ui/SectionHeading';
import Reveal from '../ui/Reveal';
import { cn } from '../../utils/cn';

const CubesBackground = lazy(() => import('../animations/CubesBackground'));

const CAPABILITIES = [
  { icon: MessageSquare, title: 'Chat', desc: 'Natural multi-turn conversation' },
  { icon: Mic, title: 'Voice', desc: 'Real-time speech in both directions' },
  { icon: Images, title: 'Images', desc: 'Generate & analyze visuals' },
  { icon: FileText, title: 'PDF', desc: 'Read and reason over documents' },
  { icon: Languages, title: 'Translation', desc: '30+ languages, instant' },
  { icon: Globe, title: 'Search', desc: 'Live web answers with sources' },
  { icon: BrainCircuit, title: 'Memory', desc: 'Context across sessions' },
  { icon: Workflow, title: 'Automation', desc: 'Summarize, extract, transform' },
];

export const Capabilities = memo(function Capabilities() {
  return (
    <section id="capabilities" className="relative overflow-hidden py-24 sm:py-32 border-t border-[var(--glass-border)]">
      <Suspense fallback={null}>
        <CubesBackground color="#8b8b95" className="opacity-60" />
      </Suspense>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-full bg-gradient-to-b from-[var(--bg-app)] via-transparent to-[var(--bg-app)] opacity-80" aria-hidden />

      <div className="relative z-10 mx-auto max-w-[1200px] px-6">
        <SectionHeading
          eyebrow="AI Capabilities"
          title="A full AI toolkit in one place."
          description="Stop juggling five tools. TalkEasy assembles everything a modern assistant should do."
        />

        <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {CAPABILITIES.map((c, i) => (
            <Reveal key={c.title} delay={(i % 4) * 0.06}>
              <div className="group flex h-full flex-col gap-4 rounded-[24px] border border-[var(--glass-border)] bg-[var(--surface-solid)]/80 p-6 backdrop-blur transition-colors duration-300 hover:border-[var(--text-primary)]/40 hover:bg-[var(--surface-solid)]">
                <span className={cn(
                  'flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] text-app-text transition-transform duration-300 group-hover:scale-105',
                )}>
                  <c.icon size={18} aria-hidden />
                </span>
                <div>
                  <h3 className="text-[15px] font-semibold tracking-tight text-app-text">{c.title}</h3>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-app-text-secondary">{c.desc}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
});