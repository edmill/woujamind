/**
 * Animated Logo Component
 * The Woujamind blob mascot logo
 */
import React from 'react';
import { motion } from 'framer-motion';

export function AnimatedLogo() {
  return (
    <div className="relative group cursor-pointer">
      {/* Outer Glow */}
      <motion.div
        animate={{
          rotate: 360,
          scale: [1, 1.1, 1]
        }}
        transition={{
          rotate: { duration: 20, repeat: Infinity, ease: "linear" },
          scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
        }}
        className="absolute -inset-1 rounded-full bg-gradient-to-r from-orange-500 via-yellow-500 to-sky-500 blur opacity-40 group-hover:opacity-75 transition duration-500"
      />

      {/* Blob Container */}
      <div className="relative p-2 flex items-center justify-center">
        {/* The Blob Character */}
        <motion.div
          animate={{
            scaleY: [1, 1.05, 0.95, 1],
            scaleX: [1, 0.95, 1.05, 1],
          }}
          transition={{
            repeat: Infinity,
            duration: 2,
            ease: "easeInOut"
          }}
          className="relative w-12 h-10"
        >
          {/* Blob Body */}
          <div
            className="w-full h-full bg-gradient-to-br from-orange-400 to-sky-500 shadow-[inset_-5px_-5px_10px_rgba(0,0,0,0.1),inset_5px_5px_10px_rgba(255,255,255,0.4)]"
            style={{
              borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%"
            }}
          >
            {/* Shine */}
            <div
              className="absolute top-2 left-3 w-3 h-2 bg-white/60 rounded-full blur-[2px]"
              style={{ transform: "rotate(-20deg)" }}
            />

            {/* Eyes */}
            <div className="absolute top-[35%] left-[25%] w-1.5 h-2 bg-black/80 rounded-full" />
            <div className="absolute top-[35%] right-[25%] w-1.5 h-2 bg-black/80 rounded-full" />
          </div>

          {/* Shadow */}
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-2 bg-black/20 blur-sm rounded-full" />
        </motion.div>
      </div>
    </div>
  );
}
