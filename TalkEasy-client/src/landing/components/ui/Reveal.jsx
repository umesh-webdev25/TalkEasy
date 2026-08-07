import { motion, useReducedMotion } from 'framer-motion';
import { EASE } from '../../utils/motion';

export default function Reveal({
  children,
  delay = 0,
  y = 28,
  duration = 0.7,
  className,
  as = 'div',
}) {
  const reduce = useReducedMotion();
  const Tag = motion[as] || motion.div;

  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y: reduce ? 0 : y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-70px' }}
      transition={{ duration, delay, ease: EASE }}
    >
      {children}
    </Tag>
  );
}