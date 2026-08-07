import { memo } from 'react';
import { Check, ArrowRight } from 'lucide-react';
import SectionHeading from '../ui/SectionHeading';
import Reveal from '../ui/Reveal';
import { CTAButton, CTAButtonLink } from '../ui/Buttons';
import { cn } from '../../utils/cn';

const PLANS = [
  {
    name: 'Starter',
    price: '$0',
    cadence: '/ forever',
    tagline: 'Meet TalkEasy. Chat and voice, free.',
    cta: { label: 'Start Free', to: '/register', href: null },
    features: [
      '50 chats / day',
      '10 voice minutes / month',
      'PDF uploads (3 / month)',
      'Image generation (10 / month)',
      'Standard support',
    ],
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$12',
    cadence: '/ month',
    tagline: 'For people who talk to AI all day.',
    cta: { label: 'Get Started', to: '/register', href: null },
    features: [
      'Unlimited chats & voice',
      'Unlimited PDF & document analysis',
      'Unlimited image generation',
      '30+ language translation & TTS',
      'Conversation memory',
      'Priority support',
    ],
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    cadence: '',
    tagline: 'For teams with serious requirements.',
    cta: { label: 'Contact Sales', to: null, href: '#contact' },
    features: [
      'Everything in Pro',
      'SSO / SAML & SCIM',
      'Dedicated voice pipelines',
      'Custom SLA & onboarding',
      'Data residency options',
    ],
    highlight: false,
  },
];

function PlanCard({ plan, index }) {
  return (
    <Reveal delay={index * 0.08} className={cn(plan.highlight && 'lg:-my-6')} as="div">
      <div
        className={cn(
          'relative flex h-full flex-col rounded-[28px] p-7 transition-all duration-500',
          plan.highlight
            ? 'border border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--bg-app)] shadow-[0_40px_100px_-30px_rgba(0,0,0,0.45)] lg:py-11'
            : 'border border-[var(--glass-border)] bg-[var(--surface-solid)] hover:border-[var(--text-primary)]/40',
        )}
      >
        {plan.highlight && (
          <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-[var(--bg-app)] px-3.5 py-1 text-[11px] font-bold uppercase tracking-wide text-[var(--text-primary)] ring-1 ring-[var(--glass-border)]">
            Most Popular
          </span>
        )}
        <h3 className="text-[15px] font-semibold tracking-tight">{plan.name}</h3>
        <div className="mt-4 flex items-baseline gap-1.5">
          <span className="text-[42px] font-bold leading-none tracking-tight">{plan.price}</span>
          <span className={cn('text-[13px] font-medium', plan.highlight ? 'opacity-70' : 'text-app-text-muted')}>
            {plan.cadence}
          </span>
        </div>
        <p className={cn('mt-2.5 text-[13px] leading-relaxed', plan.highlight ? 'opacity-75' : 'text-app-text-secondary')}>
          {plan.tagline}
        </p>

        <ul className="mt-7 flex-1 space-y-3">
          {plan.features.map((f) => (
            <li key={f} className="flex items-start gap-2.5 text-[13.5px] font-medium">
              <span
                className={cn(
                  'mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full',
                  plan.highlight ? 'bg-[var(--bg-app)] text-[var(--text-primary)]' : 'bg-[var(--glass-bg)] border border-[var(--glass-border)] text-app-text',
                )}
              >
                <Check size={10} aria-hidden />
              </span>
              {f}
            </li>
          ))}
        </ul>

        <div className="mt-8">
          {plan.cta.to ? (
            <CTAButtonLink to={plan.cta.to} variant={plan.highlight ? 'secondary' : 'primary'} className="w-full justify-center">
              {plan.cta.label}
              <ArrowRight size={15} aria-hidden />
            </CTAButtonLink>
          ) : (
            <CTAButton href={plan.cta.href} variant={plan.highlight ? 'secondary' : 'primary'} className="w-full justify-center">
              {plan.cta.label}
              <ArrowRight size={15} aria-hidden />
            </CTAButton>
          )}
        </div>
      </div>
    </Reveal>
  );
}

export const Pricing = memo(function Pricing() {
  return (
    <section id="pricing" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-[1200px] px-6">
        <SectionHeading
          eyebrow="Pricing"
          title="Simple pricing that scales with you."
          description="Start free, upgrade when you're ready. No hidden fees, cancel anytime."
        />

        <div className="mt-16 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {PLANS.map((plan, i) => (
            <PlanCard key={plan.name} plan={plan} index={i} />
          ))}
        </div>

        <Reveal delay={0.1}>
          <p className="mt-10 text-center text-[12.5px] text-app-text-muted">
            All plans include JWT-secured sessions, encryption in transit, and a 14-day Pro trial.
          </p>
        </Reveal>
      </div>
    </section>
  );
});