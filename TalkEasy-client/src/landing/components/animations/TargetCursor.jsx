import { useEffect, useState, useCallback } from 'react';
import { motion, useMotionValue, useSpring, useReducedMotion } from 'framer-motion';
import { useMediaQuery } from '../../hooks/useMediaQuery';

const INTERACTIVE = 'a, button, [role="button"], input, textarea, select, label, [data-cursor="pointer"]';

export default function TargetCursor() {
  const reduce = useReducedMotion();
  const finePointer = useMediaQuery('(pointer: fine)');
  const enabled = !reduce && finePointer;
  const [hovering, setHovering] = useState(false);
  const [pressed, setPressed] = useState(false);

  const mx = useMotionValue(-100);
  const my = useMotionValue(-100);
  const rx = useSpring(mx, { stiffness: 260, damping: 28, mass: 0.5 });
  const ry = useSpring(my, { stiffness: 260, damping: 28, mass: 0.5 });
  const dx = useSpring(mx, { stiffness: 900, damping: 50, mass: 0.2 });
  const dy = useSpring(my, { stiffness: 900, damping: 50, mass: 0.2 });

  const onMove = useCallback((e) => {
    mx.set(e.clientX);
    my.set(e.clientY);
  }, [mx, my]);

  useEffect(() => {
    if (!enabled) return;
    const onOver = (e) => setHovering(e.target.closest(INTERACTIVE) !== null);
    const onDown = () => setPressed(true);
    const onUp = () => setPressed(false);
    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mouseover', onOver, { passive: true });
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseover', onOver);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
    };
  }, [enabled, onMove]);

  if (!enabled) return null;

  return (
    <>
      <motion.div
        aria-hidden
        className="pointer-events-none fixed top-0 left-0 z-[9998] hidden lg:block"
        style={{ x: rx, y: ry }}
      >
        <motion.div
          className="-translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--text-primary)] mix-blend-difference"
          animate={{
            width: hovering ? 56 : 32,
            height: hovering ? 56 : 32,
            scale: pressed ? 0.85 : 1,
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 24 }}
        />
      </motion.div>
      <motion.div
        aria-hidden
        className="pointer-events-none fixed top-0 left-0 z-[9999] hidden lg:block"
        style={{ x: dx, y: dy }}
      >
        <motion.div
          className="-translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--text-primary)] mix-blend-difference"
          animate={{ scale: hovering ? 0 : 1, opacity: pressed ? 0.5 : 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
      </motion.div>
    </>
  );
}