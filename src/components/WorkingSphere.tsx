/**
 * Working Sphere Component
 * Unified animated sphere for loading and working states
 * Used by AnimatedLogo and GeneratingOverlay
 */
import React from 'react';
import { motion } from 'framer-motion';

interface WorkingSphereProps {
  size?: 'small' | 'large';
  isSwooshing?: boolean;
  onSwooshComplete?: () => void;
}

export function WorkingSphere({
  size = 'small',
  isSwooshing = false,
  onSwooshComplete
}: WorkingSphereProps) {
  const isLarge = size === 'large';
  const sphereSize = isLarge ? 'w-20 h-20' : 'w-8 h-8';
  const insetClasses = {
    outer: isLarge ? '-inset-16' : '-inset-6',
    middle: isLarge ? '-inset-14' : '-inset-5',
    inner: isLarge ? '-inset-12' : '-inset-4',
    glow: isLarge ? '-inset-10' : '-inset-3',
    shadow: isLarge ? '-bottom-2 w-16 h-3' : '-bottom-0.5 w-7 h-1'
  };
  const blurClasses = {
    outer: isLarge ? 'blur-3xl' : 'blur-2xl',
    middle: isLarge ? 'blur-2xl' : 'blur-xl',
    inner: isLarge ? 'blur-xl' : 'blur-lg',
    glow: isLarge ? 'blur-3xl' : 'blur-2xl',
    shadow: isLarge ? 'blur-md' : 'blur-sm'
  };
  const eyeClasses = isLarge ? 'w-2 h-3' : 'w-1 h-1.5';
  const shineClasses = isLarge ? 'top-4 left-6 w-6 h-3 blur-[2px]' : 'top-1 left-2 w-2 h-1 blur-[1px]';

  return (
    <motion.div
      animate={
        isSwooshing
          ? isLarge
            ? {
                y: [0, -100, -200],
                x: [0, 50, 100],
                scale: [1, 0.8, 0],
                opacity: [1, 0.8, 0],
                rotate: [0, 180, 360]
              }
            : {
                x: [0, 200, 400],
                y: [0, -50, -100],
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
        className={`absolute ${insetClasses.outer} rounded-full ${blurClasses.outer} opacity-70 bg-[conic-gradient(from_0deg,#ff0080,#ff8800,#ffff00,#00ff88,#0088ff,#8800ff,#ff0080)]`}
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
        className={`absolute ${insetClasses.middle} rounded-full ${blurClasses.middle} opacity-80 bg-[conic-gradient(from_180deg,#a855f7,#ec4899,#f59e0b,#10b981,#3b82f6,#8b5cf6,#a855f7)]`}
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
        className={`absolute ${insetClasses.inner} rounded-full ${blurClasses.inner} opacity-90 bg-[conic-gradient(from_90deg,#fbbf24,#f472b6,#60a5fa,#34d399,#fbbf24)]`}
      />

      {/* Pulsing glow base */}
      <motion.div
        animate={{
          opacity: [0.4, 0.7, 0.4],
          scale: isLarge ? [1.3, 1.5, 1.3] : [1.2, 1.4, 1.2]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className={`absolute ${insetClasses.glow} bg-gradient-to-r from-violet-500/50 via-fuchsia-500/50 to-cyan-500/50 rounded-full ${blurClasses.glow}`}
      />

      {/* Sparkle particles (only for large size) */}
      {isLarge && [...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          animate={{
            scale: [0, 1, 0],
            opacity: [0, 1, 0],
            rotate: 360
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.3,
            ease: "easeInOut"
          }}
          className="absolute w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]"
          style={{
            left: `${50 + 40 * Math.cos((i * Math.PI * 2) / 6)}%`,
            top: `${50 + 40 * Math.sin((i * Math.PI * 2) / 6)}%`
          }}
        />
      ))}

      {/* Assistant Sphere */}
      <motion.div
        animate={{
          scaleY: [1, 1.1, 0.9, 1],
          scaleX: [1, 0.9, 1.1, 1],
          y: isLarge ? [0, -4, 0] : [0, -2, 0],
          rotate: [0, 5, -5, 0]
        }}
        transition={{
          repeat: Infinity,
          duration: 0.8,
          ease: "easeInOut"
        }}
        className={`relative ${sphereSize}`}
      >
        {/* Sphere Body */}
        <div className={`w-full h-full bg-gradient-to-br from-purple-400 via-purple-500 to-indigo-500 rounded-full ${
          isLarge
            ? 'shadow-[inset_-6px_-6px_16px_rgba(0,0,0,0.3),inset_6px_6px_16px_rgba(255,255,255,0.5)]'
            : 'shadow-[inset_-3px_-3px_8px_rgba(0,0,0,0.2),inset_3px_3px_8px_rgba(255,255,255,0.5)]'
        }`}>
          {/* Shine */}
          <div className={`absolute ${shineClasses} bg-white/70 rounded-full -rotate-[20deg]`} />

          {/* Eyes */}
          <motion.div
            className={`absolute top-[40%] left-[30%] ${eyeClasses} bg-slate-800/90 rounded-full`}
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
            className={`absolute top-[40%] right-[30%] ${eyeClasses} bg-slate-800/90 rounded-full`}
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
        <div className={`absolute ${insetClasses.shadow} left-1/2 -translate-x-1/2 bg-black/30 ${blurClasses.shadow} rounded-full`} />
      </motion.div>
    </motion.div>
  );
}
