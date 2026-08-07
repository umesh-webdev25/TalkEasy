export const EASE = [0.22, 1, 0.36, 1];

export const fadeUpVariant = (y = 28, delay = 0) => ({
  initial: { opacity: 0, y },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.7, delay, ease: EASE },
});

export const fadeInVariant = (delay = 0) => ({
  initial: { opacity: 0 },
  whileInView: { opacity: 1 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.9, delay, ease: EASE },
});

export const scaleInVariant = (delay = 0, scale = 0.94) => ({
  initial: { opacity: 0, scale },
  whileInView: { opacity: 1, scale: 1 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.8, delay, ease: EASE },
});

export const staggerContainer = (stagger = 0.1, delay = 0) => ({
  initial: 'hidden',
  whileInView: 'visible',
  viewport: { once: true, margin: '-60px' },
  variants: {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: stagger,
        delayChildren: delay,
      },
    },
  },
});

export const staggerChild = (y = 24) => ({
  hidden: { opacity: 0, y },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: EASE },
  },
});