/**
 * Animated Logo Component
 * The Woujamind logo with animated assistant
 */
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type SphereState = 'hidden' | 'idle' | 'working' | 'swoosh';

interface AnimatedLogoProps {
  sphereState?: SphereState;
  onSwooshComplete?: () => void;
}

export function AnimatedLogo({ sphereState = 'idle', onSwooshComplete }: AnimatedLogoProps) {
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
        <AnimatePresence>
          {sphereState !== 'hidden' && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={
                sphereState === 'swoosh'
                  ? {
                      x: [0, 200, 400],
                      y: [0, -50, -100],
                      scale: [1, 0.8, 0],
                      opacity: [1, 0.8, 0],
                      rotate: [0, 180, 360]
                    }
                  : { scale: 1, opacity: 1 }
              }
              exit={{ scale: 0, opacity: 0 }}
              transition={
                sphereState === 'swoosh'
                  ? {
                      duration: 0.8,
                      ease: [0.34, 1.56, 0.64, 1]
                    }
                  : { duration: 0.3 }
              }
              onAnimationComplete={() => {
                if (sphereState === 'swoosh' && onSwooshComplete) {
                  onSwooshComplete();
                }
              }}
              className="absolute left-[calc(50%-2px)] top-[calc(52%+10px)] -translate-y-1/2 -translate-x-1/2"
            >
              {/* Outer Glow */}
              <motion.div
                animate={{
                  rotate: 360,
                  scale: sphereState === 'working' ? [1, 1.2, 1] : [1, 1.1, 1]
                }}
                transition={{
                  rotate: { duration: sphereState === 'working' ? 2 : 20, repeat: Infinity, ease: "linear" },
                  scale: { duration: sphereState === 'working' ? 0.5 : 3, repeat: Infinity, ease: "easeInOut" }
                }}
                className="absolute -inset-2 rounded-full bg-gradient-to-r from-orange-400 via-amber-400 to-blue-400 blur-md opacity-50 group-hover:opacity-75 transition duration-500"
              />

              {/* Assistant Sphere */}
              <motion.div
                animate={
                  sphereState === 'working'
                    ? {
                        scaleY: [1, 1.1, 0.9, 1],
                        scaleX: [1, 0.9, 1.1, 1],
                        y: [0, -2, 0],
                        rotate: [0, 5, -5, 0]
                      }
                    : {
                        scaleY: [1, 1.02, 0.98, 1],
                        scaleX: [1, 0.98, 1.02, 1],
                        y: [0, -1, 0]
                      }
                }
                transition={{
                  repeat: Infinity,
                  duration: sphereState === 'working' ? 0.8 : 2.5,
                  ease: "easeInOut"
                }}
                className="relative w-8 h-8"
              >
            {/* Sphere Body */}
            <div
              className="w-full h-full bg-gradient-to-br from-orange-400 via-amber-400 to-blue-500 shadow-[inset_-3px_-3px_8px_rgba(0,0,0,0.2),inset_3px_3px_8px_rgba(255,255,255,0.5)] rounded-full"
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
        </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Brand Text */}
      <div className="flex flex-col">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-500 via-orange-400 to-blue-500 bg-clip-text text-transparent">
          Woujamind
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
          AI Sprite Sheet Generator
        </p>
      </div>
    </div>
  );
}
