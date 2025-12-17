/**
 * Generating Overlay Component
 * Shows a blurred placeholder with animated sphere during generation
 */
import React from 'react';
import { motion } from 'framer-motion';

interface GeneratingOverlayProps {
  statusText: string;
  onSwooshComplete?: () => void;
  isSwooshing?: boolean;
}

export function GeneratingOverlay({
  statusText,
  onSwooshComplete,
  isSwooshing = false
}: GeneratingOverlayProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex items-center justify-center"
    >
      {/* Blurred placeholder background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-30 dark:opacity-20 bg-[linear-gradient(to_right,#0ea5e9_1px,transparent_1px),linear-gradient(to_bottom,#0ea5e9_1px,transparent_1px)] bg-[length:40px_40px]" />

        {/* Radial gradients */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(251,146,60,0.15),transparent_50%),radial-gradient(circle_at_70%_80%,rgba(14,165,233,0.15),transparent_50%)]" />

        {/* Blur overlay */}
        <div className="absolute inset-0 backdrop-blur-sm bg-white/30 dark:bg-black/30" />
      </div>

      {/* Centered animated sphere */}
      <div className="relative z-10 flex flex-col items-center gap-6">
        <motion.div
          animate={
            isSwooshing
              ? {
                  y: [0, -100, -200],
                  x: [0, 50, 100],
                  scale: [1, 0.8, 0],
                  opacity: [1, 0.8, 0],
                  rotate: [0, 180, 360]
                }
              : {}
          }
          transition={
            isSwooshing
              ? {
                  duration: 0.8,
                  ease: [0.34, 1.56, 0.64, 1]
                }
              : {}
          }
          onAnimationComplete={() => {
            if (isSwooshing && onSwooshComplete) {
              onSwooshComplete();
            }
          }}
          className="relative"
        >
          {/* Outer rotating rainbow ring */}
          <motion.div
            animate={{
              rotate: 360,
              scale: [1, 1.15, 1]
            }}
            transition={{
              rotate: { duration: 3, repeat: Infinity, ease: "linear" },
              scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
            }}
            className="absolute -inset-16 rounded-full blur-3xl opacity-70 bg-[conic-gradient(from_0deg,#ff0080,#ff8800,#ffff00,#00ff88,#0088ff,#8800ff,#ff0080)]"
          />

          {/* Middle counter-rotating ring */}
          <motion.div
            animate={{
              rotate: -360,
              opacity: [0.6, 1, 0.6]
            }}
            transition={{
              rotate: { duration: 2, repeat: Infinity, ease: "linear" },
              opacity: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
            }}
            className="absolute -inset-14 rounded-full blur-2xl opacity-80 bg-[conic-gradient(from_180deg,#a855f7,#ec4899,#f59e0b,#10b981,#3b82f6,#8b5cf6,#a855f7)]"
          />

          {/* Inner fast-spinning bright ring */}
          <motion.div
            animate={{
              rotate: 360,
              scale: [0.9, 1.2, 0.9]
            }}
            transition={{
              rotate: { duration: 1.5, repeat: Infinity, ease: "linear" },
              scale: { duration: 1, repeat: Infinity, ease: "easeInOut" }
            }}
            className="absolute -inset-12 rounded-full blur-xl opacity-90 bg-[conic-gradient(from_90deg,#fbbf24,#f472b6,#60a5fa,#34d399,#fbbf24)]"
          />

          {/* Pulsing glow base */}
          <motion.div
            animate={{
              opacity: [0.4, 0.7, 0.4],
              scale: [1.3, 1.5, 1.3]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute -inset-10 bg-gradient-to-r from-violet-500/50 via-fuchsia-500/50 to-cyan-500/50 rounded-full blur-3xl"
          />

          {/* Sparkle particles */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              animate={{
                scale: [0, 1.5, 0],
                opacity: [0, 1, 0],
                rotate: 360
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.25,
                ease: "easeInOut"
              }}
              className="absolute w-3 h-3 rounded-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.9)]"
              style={{
                left: `${50 + 50 * Math.cos((i * Math.PI * 2) / 8)}%`,
                top: `${50 + 50 * Math.sin((i * Math.PI * 2) / 8)}%`
              }}
            />
          ))}

          {/* Assistant Sphere */}
          <motion.div
            animate={{
              scaleY: [1, 1.1, 0.9, 1],
              scaleX: [1, 0.9, 1.1, 1],
              y: [0, -4, 0],
              rotate: [0, 5, -5, 0]
            }}
            transition={{
              repeat: Infinity,
              duration: 0.8,
              ease: "easeInOut"
            }}
            className="relative w-20 h-20"
          >
            {/* Sphere Body */}
            <div className="w-full h-full bg-gradient-to-br from-purple-400 via-purple-500 to-indigo-500 shadow-[inset_-6px_-6px_16px_rgba(0,0,0,0.3),inset_6px_6px_16px_rgba(255,255,255,0.5)] rounded-full">
              {/* Shine */}
              <div className="absolute top-4 left-6 w-6 h-3 bg-white/70 rounded-full blur-[2px] -rotate-[20deg]" />

              {/* Eyes */}
              <motion.div
                className="absolute top-[40%] left-[30%] w-2 h-3 bg-slate-800/90 rounded-full"
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
                className="absolute top-[40%] right-[30%] w-2 h-3 bg-slate-800/90 rounded-full"
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
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-16 h-3 bg-black/30 blur-md rounded-full" />
          </motion.div>
        </motion.div>

        {/* Status text */}
        {!isSwooshing && statusText && (
          <motion.div
            key={statusText}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="font-semibold text-lg text-slate-700 dark:text-slate-200 bg-white/90 dark:bg-slate-800/90 px-6 py-3 rounded-2xl border-2 border-slate-200 dark:border-slate-700 backdrop-blur-md shadow-2xl"
          >
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full"
              />
              <span>{statusText}</span>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
