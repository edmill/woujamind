/**
 * Animated Logo Component
 * The Woujamind logo with animated assistant
 */
import React from 'react';
import { motion } from 'framer-motion';

export function AnimatedLogo() {
  return (
    <div className="relative group cursor-pointer flex items-center gap-3">
      {/* Colorful W Logo with Animated Sphere */}
      <div className="relative h-[84px] flex items-center">
        <img
          src="/logo.png"
          alt="W"
          className="h-[84px] w-auto object-contain"
          style={{ imageRendering: '-webkit-optimize-contrast' }}
        />

        {/* Animated Assistant Sphere - positioned on the W */}
        <div className="absolute left-[calc(50%-2px)] top-[calc(52%+10px)] -translate-y-1/2 -translate-x-1/2">
          {/* Outer Glow */}
          <motion.div
            animate={{
              rotate: 360,
              scale: [1, 1.1, 1]
            }}
            transition={{
              rotate: { duration: 20, repeat: Infinity, ease: "linear" },
              scale: { duration: 3, repeat: Infinity, ease: "easeInOut" }
            }}
            className="absolute -inset-2 rounded-full bg-gradient-to-r from-sky-400 via-blue-400 to-purple-400 blur-md opacity-50 group-hover:opacity-75 transition duration-500"
          />

          {/* Assistant Sphere */}
          <motion.div
            animate={{
              scaleY: [1, 1.02, 0.98, 1],
              scaleX: [1, 0.98, 1.02, 1],
              y: [0, -1, 0]
            }}
            transition={{
              repeat: Infinity,
              duration: 2.5,
              ease: "easeInOut"
            }}
            className="relative w-8 h-8"
          >
            {/* Sphere Body */}
            <div
              className="w-full h-full bg-gradient-to-br from-sky-400 to-blue-600 shadow-[inset_-3px_-3px_8px_rgba(0,0,0,0.2),inset_3px_3px_8px_rgba(255,255,255,0.5)] rounded-full"
            >
              {/* Shine */}
              <div
                className="absolute top-1 left-2 w-2 h-1 bg-white/70 rounded-full blur-[1px]"
                style={{ transform: "rotate(-20deg)" }}
              />

              {/* Eyes */}
              <motion.div
                className="absolute top-[40%] left-[30%] w-1 h-1.5 bg-slate-800/90 rounded-full"
                animate={{
                  scaleY: [1, 0.1, 1],
                }}
                transition={{
                  duration: 0.15,
                  repeat: Infinity,
                  repeatDelay: 3,
                  ease: "easeInOut"
                }}
              />
              <motion.div
                className="absolute top-[40%] right-[30%] w-1 h-1.5 bg-slate-800/90 rounded-full"
                animate={{
                  scaleY: [1, 0.1, 1],
                }}
                transition={{
                  duration: 0.15,
                  repeat: Infinity,
                  repeatDelay: 3,
                  ease: "easeInOut"
                }}
              />
            </div>

            {/* Shadow */}
            <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-7 h-1 bg-black/20 blur-sm rounded-full" />
          </motion.div>
        </div>
      </div>

      {/* Brand Text */}
      <div className="flex flex-col">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-sky-500 bg-clip-text text-transparent">
          Woujamind
        </h1>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          AI Sprite Sheet Generator
        </p>
      </div>
    </div>
  );
}
