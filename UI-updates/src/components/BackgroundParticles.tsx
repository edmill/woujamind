/**
 * Floating background particles animation
 */
import React from 'react';
import { motion } from 'framer-motion';

export const BackgroundParticles = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute opacity-20 dark:opacity-10"
          initial={{
            x: Math.random() * 100 + "%",
            y: Math.random() * 100 + "%",
            scale: Math.random() * 0.5 + 0.5,
          }}
          animate={{
            y: [null, Math.random() * 100 + "%"],
            x: [null, Math.random() * 100 + "%"],
            rotate: [0, 360],
          }}
          transition={{
            duration: Math.random() * 20 + 20,
            repeat: Infinity,
            ease: "linear",
            repeatType: "reverse"
          }}
        >
          {i % 2 === 0 ? (
            <div className="w-32 h-32 rounded-full bg-orange-500 blur-3xl" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-sky-500 blur-3xl" />
          )}
        </motion.div>
      ))}
    </div>
  );
};
