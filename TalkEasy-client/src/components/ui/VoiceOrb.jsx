import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff } from 'lucide-react';

const VoiceOrb = ({ isListening, onClick }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 select-none">
      <div className="relative flex items-center justify-center">
        {/* Ambient Glow */}
        <AnimatePresence>
          {isListening && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{
                scale: [1, 1.4, 1.1, 1.3, 1],
                opacity: [0.5, 0.8, 0.6, 0.9, 0.5],
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute w-52 h-52 rounded-full bg-gradient-to-r from-brand-blue via-brand-cyan to-brand-violet opacity-60 filter blur-3xl"
            />
          )}
        </AnimatePresence>

        {/* Outer Pulsing Ring */}
        <motion.div
          animate={isListening ? {
            scale: [1, 1.15, 0.98, 1.1, 1],
            rotate: 360,
          } : { scale: 1 }}
          transition={{
            scale: { duration: 4, repeat: Infinity, ease: "easeInOut" },
            rotate: { duration: 25, repeat: Infinity, ease: "linear" }
          }}
          className="relative w-44 h-44 rounded-full p-[2px] bg-gradient-to-r from-brand-blue/30 via-brand-cyan/20 to-brand-violet/30 flex items-center justify-center cursor-pointer shadow-2xl"
          onClick={onClick}
        >
          {/* Inner glass orb container */}
          <div className="w-full h-full rounded-full glass-panel bg-white/5 dark:bg-black/40 backdrop-blur-3xl flex items-center justify-center overflow-hidden border border-white/20">
            {/* Spinning background gradients */}
            <motion.div
              animate={isListening ? {
                x: [-10, 10, -5, 5, -10],
                y: [-10, 5, -12, 8, -10],
                scale: [1, 1.2, 0.9, 1.1, 1]
              } : { x: 0, y: 0 }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute w-36 h-36 rounded-full bg-gradient-to-tr from-brand-blue/40 via-brand-cyan/20 to-brand-violet/40 filter blur-xl opacity-80"
            />

            {/* Core Orb Sphere */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              animate={isListening ? {
                scale: [1, 1.08, 0.95, 1.04, 1],
                backgroundColor: ['rgba(0, 102, 255, 0.2)', 'rgba(0, 209, 255, 0.25)', 'rgba(132, 71, 255, 0.2)', 'rgba(0, 102, 255, 0.2)']
              } : {}}
              transition={{ duration: 4, repeat: Infinity }}
              className="relative w-28 h-28 rounded-full bg-white/10 dark:bg-white/5 border border-white/20 dark:border-white/10 shadow-inner flex items-center justify-center z-10 backdrop-blur-md"
            >
              {/* Mic Icon */}
              <motion.div
                animate={isListening ? {
                  scale: [1, 1.1, 1],
                  color: ['#0066ff', '#00d1ff', '#8447ff', '#0066ff']
                } : {}}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-slate-700 dark:text-slate-200"
              >
                {isListening ? (
                  <Mic className="w-8 h-8" />
                ) : (
                  <Mic className="w-8 h-8 opacity-75 group-hover:opacity-100" />
                )}
              </motion.div>
            </motion.div>
          </div>
        </motion.div>

        {/* Ambient Wave Particles when Listening */}
        {isListening && [1, 2, 3].map((i) => (
          <motion.div
            key={i}
            initial={{ scale: 0.8, opacity: 0.5 }}
            animate={{ scale: 2.2, opacity: 0 }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              delay: i * 0.7,
              ease: "easeOut"
            }}
            className="absolute w-44 h-44 border border-brand-cyan/30 rounded-full pointer-events-none"
          />
        ))}
      </div>

      <motion.p
        initial={{ opacity: 0.8 }}
        animate={isListening ? { opacity: [0.5, 1, 0.5] } : { opacity: 0.8 }}
        transition={{ duration: 2, repeat: Infinity }}
        className="mt-6 text-sm font-semibold tracking-wider text-brand-blue uppercase dark:text-brand-cyan"
      >
        {isListening ? 'TalkEasy is Listening...' : 'Click Orb to Talk'}
      </motion.p>
    </div>
  );
};

export default VoiceOrb;
