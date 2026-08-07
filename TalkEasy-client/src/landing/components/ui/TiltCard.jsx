import { useRef, useCallback } from 'react';
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'framer-motion';
import { cn } from '../../utils/cn';

export default function TiltCard({ children, className, maxTilt = 8, glare = true }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();

  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const gx = useMotionValue(50);
  const gy = useMotionValue(50);

  const rotateX = useSpring(rx, { stiffness: 180, damping: 20 });
  const rotateY = useSpring(ry, { stiffness: 180, damping: 20 });

  const glareOpacity = useTransform(
    [gx, gy],
    ([x, y]) => Math.max(0, 1 - Math.hypot(x - 50, y - 50) / 60),
  );

  const onMouseMove = useCallback(
    (e) => {
      if (reduce) return;
      const rect = ref.current?.getBoundingClientRect();
      if (!rect) return;
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      ry.set((px - 0.5) * maxTilt);
      rx.set((0.5 - py) * maxTilt);
      gx.set(px * 100);
      gy.set(py * 100);
    },
    [maxTilt, reduce, rx, ry, gx, gy],
  );

  const onMouseLeave = useCallback(() => {
    rx.set(0);
    ry.set(0);
    gx.set(50);
    gy.set(50);
  }, [rx, ry, gx, gy]);

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d', perspective: 900 }}
      className={cn('relative will-change-transform', className)}
    >
      {children}
      {glare && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit] mix-blend-overlay"
          style={{
            opacity: glareOpacity,
            background:
              'radial-gradient(circle at var(--gx, 50%) var(--gy, 50%), rgba(190,190,190,0.55) 0%, rgba(255,255,255,0) 65%)',
            '--gx': gx,
            '--gy': gy,
          }}
        />
      )}
    </motion.div>
  );
}