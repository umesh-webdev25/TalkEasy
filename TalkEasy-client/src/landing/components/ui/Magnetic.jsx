import { useRef, useCallback } from 'react';
import { motion, useMotionValue, useSpring, useReducedMotion } from 'framer-motion';
import { cn } from '../../utils/cn';

export default function Magnetic({ children, strength = 0.35, className, distance = 120 }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 160, damping: 16, mass: 0.2 });
  const sy = useSpring(y, { stiffness: 160, damping: 16, mass: 0.2 });

  const onMouseMove = useCallback(
    (e) => {
      if (reduce) return;
      const rect = ref.current?.getBoundingClientRect();
      if (!rect) return;
      const relX = e.clientX - (rect.left + rect.width / 2);
      const relY = e.clientY - (rect.top + rect.height / 2);
      const dist = Math.hypot(relX, relY);
      if (dist > distance) return;
      const power = 1 - Math.min(1, dist / distance);
      x.set(relX * strength * power);
      y.set(relY * strength * power);
    },
    [strength, distance, reduce, x, y],
  );

  const onMouseLeave = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  return (
    <motion.div
      ref={ref}
      style={{ x: sx, y: sy }}
      className={cn('inline-flex', className)}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      {children}
    </motion.div>
  );
}