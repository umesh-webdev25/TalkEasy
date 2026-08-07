import { useRef } from 'react';
import { useReducedMotion, useInView } from 'framer-motion';
import { cn } from '../../utils/cn';
import { isTouchDevice } from '../../hooks/useMediaQuery';
import Antigravity from './Antigravity';

export default function AntigravityBackground({ className, count = 300, color = '#8b8b95' }) {
  const reduce = useReducedMotion();
  const touch = isTouchDevice();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  const enabled = !reduce && !touch && inView;

  return (
    <div ref={ref} className={cn('absolute inset-0 overflow-hidden pointer-events-none', className)} aria-hidden>
      {enabled && (
        <Antigravity
          count={count}
          magnetRadius={5}
          ringRadius={3.5}
          waveSpeed={0.25}
          waveAmplitude={0.25}
          particleSize={1.0}
          lerpSpeed={0.05}
          autoAnimate={true}
          particleVariance={0.5}
        />
      )}
    </div>
  );
}