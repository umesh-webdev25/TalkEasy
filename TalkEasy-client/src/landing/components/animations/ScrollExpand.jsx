import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useReducedMotion } from 'framer-motion';
import { cn } from '../../utils/cn';

gsap.registerPlugin(ScrollTrigger);

export default function ScrollExpand({ children, className, startScale = 0.58 }) {
  const sectionRef = useRef(null);
  const targetRef = useRef(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        targetRef.current,
        { scale: startScale, opacity: 0.6, y: 60 },
        {
          scale: 1,
          opacity: 1,
          y: 0,
          ease: 'none',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 85%',
            end: 'top top',
            scrub: true,
          },
        },
      );
    }, sectionRef);

    return () => {
      ctx.revert();
    };
  }, [reduce, startScale]);

  return (
    <section ref={sectionRef} className={cn('relative', className)}>
      <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden px-4 sm:px-6">
        <div ref={targetRef} className="w-full max-w-[1400px] will-change-transform">
          {children}
        </div>
      </div>
    </section>
  );
}