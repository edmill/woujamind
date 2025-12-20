/**
 * Animated Logo Component
 * The Woujamind logo with animated assistant
 */
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useSpring } from 'framer-motion';

type SphereState = 'hidden' | 'idle' | 'working' | 'swoosh';

interface AnimatedLogoProps {
  sphereState?: SphereState;
  onSwooshComplete?: () => void;
}

export function AnimatedLogo({ sphereState = 'idle', onSwooshComplete }: AnimatedLogoProps) {
  const logoContainerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Smooth spring animation for cursor following
  const springConfig = { damping: 20, stiffness: 150, mass: 0.5 };
  const x = useSpring(0, springConfig);
  const y = useSpring(0, springConfig);

  useEffect(() => {
    const container = logoContainerRef.current;
    if (!container) return;

    // Initialize to default position
    const updateDefaultPosition = () => {
      const rect = container.getBoundingClientRect();
      const defaultX = rect.width * 0.45;
      const defaultY = rect.height * 0.52 + 10;
      if (!isHovered) {
        x.set(defaultX);
        y.set(defaultY);
      }
    };

    // Set initial position
    updateDefaultPosition();

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      // Calculate mouse position relative to the logo container
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Only follow if mouse is within the container bounds
      if (
        mouseX >= 0 &&
        mouseX <= rect.width &&
        mouseY >= 0 &&
        mouseY <= rect.height
      ) {
        setIsHovered(true);
        // Update spring values - sphere follows the cursor
        x.set(mouseX);
        y.set(mouseY);
      }
    };

    const handleMouseLeave = () => {
      setIsHovered(false);
      // Return to default position when mouse leaves
      updateDefaultPosition();
    };

    // Track mouse over the entire window, but position relative to logo container
    window.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [x, y, isHovered]);

  return (
    <div className="relative group cursor-pointer flex items-center gap-3">
      {/* Colorful W Logo with Animated Sphere */}
      <div ref={logoContainerRef} className="relative h-[84px] flex items-center">
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
              className="absolute -translate-y-1/2 -translate-x-1/2 pointer-events-none"
              style={
                sphereState === 'swoosh'
                  ? undefined
                  : {
                      x,
                      y
                    }
              }
            >
              {/* Outer Glow */}
              {sphereState === 'working' ? (
                <>
                  {/* Outer rotating rainbow ring */}
                  <motion.div
                    animate={{
                      rotate: 360,
                      scale: [1, 1.1, 1]
                    }}
                    transition={{
                      rotate: { duration: 3, repeat: Infinity, ease: "linear" },
                      scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                    }}
                    className="absolute -inset-6 rounded-full blur-2xl opacity-70 bg-[conic-gradient(from_0deg,#ff0080,#ff8800,#ffff00,#00ff88,#0088ff,#8800ff,#ff0080)]"
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
                    className="absolute -inset-5 rounded-full blur-xl opacity-80 bg-[conic-gradient(from_180deg,#a855f7,#ec4899,#f59e0b,#10b981,#3b82f6,#8b5cf6,#a855f7)]"
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
                    className="absolute -inset-4 rounded-full blur-lg opacity-90 bg-[conic-gradient(from_90deg,#fbbf24,#f472b6,#60a5fa,#34d399,#fbbf24)]"
                  />

                  {/* Pulsing glow base */}
                  <motion.div
                    animate={{
                      opacity: [0.4, 0.7, 0.4],
                      scale: [1.2, 1.4, 1.2]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="absolute -inset-3 bg-gradient-to-r from-violet-500/50 via-fuchsia-500/50 to-cyan-500/50 rounded-full blur-2xl"
                  />

                  {/* Sparkle particles */}
                  {[...Array(6)].map((_, i) => (
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
                </>
              ) : (
                <motion.div
                  animate={{
                    rotate: 360,
                    scale: [1, 1.1, 1]
                  }}
                  transition={{
                    rotate: { duration: 20, repeat: Infinity, ease: "linear" },
                    scale: { duration: 3, repeat: Infinity, ease: "easeInOut" }
                  }}
                  className="absolute -inset-2 rounded-full blur-md opacity-50 group-hover:opacity-75 transition duration-500 bg-gradient-to-r from-teal-400 to-orange-400"
                />
              )}

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
              className={`w-full h-full shadow-[inset_-3px_-3px_8px_rgba(0,0,0,0.2),inset_3px_3px_8px_rgba(255,255,255,0.5)] rounded-full ${
                sphereState === 'working'
                  ? 'bg-gradient-to-br from-purple-400 via-purple-500 to-indigo-500'
                  : 'bg-gradient-to-br from-teal-400 to-orange-500'
              }`}
            >
              {/* Shine */}
              <div
                className="absolute top-1 left-2 w-2 h-1 bg-white/70 rounded-full blur-[1px] -rotate-[20deg]"
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
        <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-500 to-orange-500 bg-clip-text text-transparent tracking-wider">
          Woujamind
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
          AI Powered Sprite Sheet Editor
        </p>
      </div>
    </div>
  );
}
