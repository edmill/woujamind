/**
 * Empty State View Component
 * Shows helpful message when no sprites exist
 */
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface EmptyStateViewProps {
  isGenerating?: boolean;
  statusText?: string;
  isLoadingSprites?: boolean;
}

export function EmptyStateView({
  isGenerating = false,
  statusText = '',
  isLoadingSprites = false
}: EmptyStateViewProps) {
  const sphereRef = useRef<HTMLDivElement>(null);
  const [eyePosition, setEyePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!sphereRef.current) return;

      const rect = sphereRef.current.getBoundingClientRect();
      const sphereCenterX = rect.left + rect.width / 2;
      const sphereCenterY = rect.top + rect.height / 2;

      const deltaX = e.clientX - sphereCenterX;
      const deltaY = e.clientY - sphereCenterY;

      const angle = Math.atan2(deltaY, deltaX);
      const distance = Math.min(Math.sqrt(deltaX * deltaX + deltaY * deltaY) / 50, 3);

      const eyeX = Math.cos(angle) * distance;
      const eyeY = Math.sin(angle) * distance;

      setEyePosition({ x: eyeX, y: eyeY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-sky-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 opacity-60" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(251,146,60,0.1),transparent_50%),radial-gradient(circle_at_70%_80%,rgba(14,165,233,0.1),transparent_50%)] dark:bg-[radial-gradient(circle_at_30%_20%,rgba(251,146,60,0.05),transparent_50%),radial-gradient(circle_at_70%_80%,rgba(14,165,233,0.05),transparent_50%)]" />

      {/* Loading sprites state */}
      {isLoadingSprites && !isGenerating && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center gap-4 relative z-10"
        >
          <div className="relative">
            {/* Outer Spinner */}
            <div className="w-16 h-16 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
            {/* Inner Spinner Reverse */}
            <div className="absolute inset-2 border-4 border-sky-500/20 border-b-sky-500 rounded-full animate-spin [animation-direction:reverse] [animation-duration:1.5s]"></div>
            {/* Center Icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-orange-500 dark:text-orange-400 animate-pulse" />
            </div>
          </div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Loading sprite sheets...
          </p>
        </motion.div>
      )}

      {/* Centered message */}
      {!isGenerating && !isLoadingSprites && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="flex flex-col items-center gap-4 px-6 relative z-10"
        >
          <div className="max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl p-8 shadow-2xl border-2 border-slate-200 dark:border-slate-700">
            {/* Header with animated sphere */}
            <div className="flex items-center justify-center gap-4 mb-6">
              {/* Animated Assistant Sphere */}
              <div className="relative">
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
                  className="absolute -inset-2 rounded-full bg-gradient-to-r from-teal-400 to-orange-400 blur-md opacity-50"
                />

                {/* Assistant Sphere */}
                <motion.div
                  ref={sphereRef}
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
                  className="relative w-12 h-12"
                >
                  {/* Sphere Body */}
                  <div className="w-full h-full bg-gradient-to-br from-teal-400 to-orange-500 shadow-[inset_-3px_-3px_8px_rgba(0,0,0,0.2),inset_3px_3px_8px_rgba(255,255,255,0.5)] rounded-full">
                    {/* Shine */}
                    <div
                      className="absolute top-2 left-3 w-3 h-2 bg-white/70 rounded-full blur-[1px] -rotate-[20deg]"
                    />

                    {/* Eyes that follow mouse */}
                    <motion.div
                      className="absolute top-[40%] left-[30%] w-1.5 h-2 bg-slate-800/90 rounded-full"
                      animate={{
                        x: eyePosition.x,
                        y: eyePosition.y,
                        scaleY: [1, 0.1, 1],
                      }}
                      transition={{
                        x: { type: "spring", stiffness: 200, damping: 20 },
                        y: { type: "spring", stiffness: 200, damping: 20 },
                        scaleY: {
                          duration: 0.15,
                          repeat: Infinity,
                          repeatDelay: 3,
                          ease: "easeInOut"
                        }
                      }}
                    />
                    <motion.div
                      className="absolute top-[40%] right-[30%] w-1.5 h-2 bg-slate-800/90 rounded-full"
                      animate={{
                        x: eyePosition.x,
                        y: eyePosition.y,
                        scaleY: [1, 0.1, 1],
                      }}
                      transition={{
                        x: { type: "spring", stiffness: 200, damping: 20 },
                        y: { type: "spring", stiffness: 200, damping: 20 },
                        scaleY: {
                          duration: 0.15,
                          repeat: Infinity,
                          repeatDelay: 3,
                          ease: "easeInOut"
                        }
                      }}
                    />
                  </div>

                  {/* Shadow */}
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-10 h-2 bg-black/20 blur-sm rounded-full" />
                </motion.div>
              </div>

              {/* Title */}
              <h3 className="text-2xl font-bold bg-gradient-to-r from-teal-500 to-orange-500 bg-clip-text text-transparent">
                No Sprite Sheets Yet
              </h3>
            </div>

            {/* Message */}
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed text-center mb-4">
              This space will come alive with your animated creations! Generate your first sprite sheet and it will automatically be saved here for quick access.
            </p>

            {/* Footer note */}
            <div className="pt-4 text-xs text-slate-500 dark:text-slate-500 border-t border-slate-200 dark:border-slate-700 text-center">
              💡 All sprite sheets are saved locally in your browser
            </div>
          </div>
        </motion.div>
      )}

      {/* Generating state */}
      {isGenerating && statusText && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full"
          />
          <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
            {statusText}
          </p>
        </motion.div>
      )}
    </div>
  );
}
