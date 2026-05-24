import React from 'react';
import { motion } from 'framer-motion';

const VoiceVisualizer = ({ isPlaying = true }) => {
  const bars = Array.from({ length: 24 });
  
  // Custom delays and base heights for organic variation
  const getAnimationProps = (index) => {
    if (!isPlaying) return { height: '8px' };
    
    return {
      height: [
        '8px',
        `${Math.max(16, Math.sin(index * 0.4) * 60 + 35)}px`,
        '12px',
        `${Math.max(10, Math.cos(index * 0.5) * 45 + 30)}px`,
        '8px'
      ],
      transition: {
        duration: 1.2 + (index % 5) * 0.15,
        repeat: Infinity,
        ease: "easeInOut",
        delay: (index % 4) * 0.1
      }
    };
  };

  const getBarColor = (index) => {
    if (index % 3 === 0) return 'bg-brand-blue opacity-90';
    if (index % 3 === 1) return 'bg-brand-cyan opacity-80';
    return 'bg-brand-violet opacity-75';
  };

  return (
    <div className="flex items-center justify-center gap-[3px] h-24 px-6 py-2 rounded-2xl bg-white/5 dark:bg-black/20 border border-white/5 backdrop-blur-sm w-full max-w-md mx-auto">
      {bars.map((_, idx) => (
        <motion.div
          key={idx}
          animate={getAnimationProps(idx)}
          className={`w-1 rounded-full ${getBarColor(idx)}`}
          style={{ height: '8px' }}
        />
      ))}
    </div>
  );
};

export default VoiceVisualizer;
