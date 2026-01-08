/**
 * Animated Logo Component
 * The Woujamind logo with animated assistant
 */
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useSpring } from 'framer-motion';
import { WorkingSphere } from './WorkingSphere';

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
      <div ref={logoContainerRef} className="relative h-[67px] flex items-center">
        <img
          src="/logo.png"
          alt="W"
          className="h-[67px] w-auto object-contain"
          style={{ imageRendering: '-webkit-optimize-contrast' }}
        />

        {/* Animated Assistant Sphere - positioned on the W */}
        <AnimatePresence>
          {sphereState !== 'hidden' && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={
                sphereState === 'swoosh'
                  ? { scale: 1, opacity: 1 }
                  : { scale: 1, opacity: 1 }
              }
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
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
              {/* Outer Glow for idle state */}
              {sphereState === 'idle' && (
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

              {sphereState === 'working' ? (
                <WorkingSphere size="small" />
              ) : sphereState === 'swoosh' ? (
                <WorkingSphere size="small" isSwooshing={true} onSwooshComplete={onSwooshComplete} />
              ) : (
                // Idle sphere
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
                  <div className="w-full h-full shadow-[inset_-3px_-3px_8px_rgba(0,0,0,0.2),inset_3px_3px_8px_rgba(255,255,255,0.5)] rounded-full bg-gradient-to-br from-teal-400 to-orange-500">
                    {/* Shine */}
                    <div className="absolute top-1 left-2 w-2 h-1 bg-white/70 rounded-full blur-[1px] -rotate-[20deg]" />

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
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Brand Text */}
      <div className="flex flex-col">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-500 via-blue-500 via-purple-500 to-orange-500 bg-clip-text text-transparent tracking-wider">
          Woujamind
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
          AI Powered Sprite Sheet Editor
        </p>
      </div>
    </div>
  );
}
