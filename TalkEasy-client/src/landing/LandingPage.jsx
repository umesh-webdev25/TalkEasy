import { useEffect, memo } from 'react';
import Navbar from './components/sections/Navbar';
import Hero from './components/sections/Hero';
import { TrustedBy } from './components/sections/TrustedBy';
import { Features } from './components/sections/Features';
import { Showcase } from './components/sections/Showcase';
import { WhyTalkEasy } from './components/sections/WhyTalkEasy';
import { HowItWorks } from './components/sections/HowItWorks';
import { Capabilities } from './components/sections/Capabilities';
import { Testimonials } from './components/sections/Testimonials';
import { Pricing } from './components/sections/Pricing';
import { FAQ } from './components/sections/FAQ';
import { CTA } from './components/sections/CTASection';
import { Footer } from './components/sections/Footer';
import TargetCursor from './components/animations/TargetCursor';

function LandingPage() {
  useEffect(() => {
    document.title = 'TalkEasy — The AI Assistant That Listens, Thinks & Speaks Naturally.';
    const meta = document.querySelector('meta[name="description"]');
    if (!meta) return;
    meta.setAttribute(
      'content',
      'TalkEasy is the premium AI voice assistant for voice conversations, chat, translation, documents, and image generation. Fast, private, beautiful.',
    );
  }, []);

  return (
    <>
      <a
        href="#hero"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[10000] focus:rounded-full focus:bg-app-text focus:px-5 focus:py-2.5 focus:text-[13px] focus:font-semibold focus:text-app-bg"
      >
        Skip to content
      </a>
      <TargetCursor />
      <Navbar />
      <main>
        <Hero />
        <TrustedBy />
        <Features />
        <Showcase />
        <WhyTalkEasy />
        <HowItWorks />
        <Capabilities />
        <Testimonials />
        <Pricing />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </>
  );
}

export default memo(LandingPage);