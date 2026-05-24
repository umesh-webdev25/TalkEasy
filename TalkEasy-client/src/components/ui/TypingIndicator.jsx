import React from 'react';
import { motion } from 'framer-motion';

const TypingIndicator = () => {
  const dotVariants = {
    animate: (i) => ({
      y: [0, -6, 0],
      transition: {
        duration: 0.8,
        repeat: Infinity,
        ease: "easeInOut",
        delay: i * 0.15
      }
    })
  };

  return (
    <div className="flex items-center gap-1.5 px-4 py-3 bg-slate-100 dark:bg-slate-800/60 rounded-2xl rounded-tl-none w-16 border border-slate-200/50 dark:border-white/5">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          custom={i}
          variants={dotVariants}
          animate="animate"
          className="w-1.5 h-1.5 rounded-full bg-brand-blue dark:bg-brand-cyan"
        />
      ))}
    </div>
  );
};

export default TypingIndicator;
