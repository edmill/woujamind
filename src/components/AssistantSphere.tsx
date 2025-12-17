/**
 * Assistant Sphere Component
 * A cursor-following animated sphere with personality
 */
import React, { useState, useEffect, useRef } from 'react';
import { motion, useSpring } from 'framer-motion';

interface AssistantSphereProps {
  containerRef: React.RefObject<HTMLDivElement>;
}

export function AssistantSphere({ containerRef }: AssistantSphereProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Smooth spring animation for cursor following
  const springConfig = { damping: 20, stiffness: 150, mass: 0.5 };
  const x = useSpring(0, springConfig);
  const y = useSpring(0, springConfig);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      setMousePosition({ x: mouseX, y: mouseY });
      setIsHovered(true);

      // Update spring values
      x.set(mouseX);
      y.set(mouseY);
    };

    const handleMouseLeave = () => {
      setIsHovered(false);
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [containerRef, x, y]);

  if (!isHovered) return null;

  return (
    <motion.div
      className="pointer-events-none absolute z-30"
      style={{
        x,
        y,
        translateX: '-50%',
        translateY: '-50%'
      }}
    >
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
        className="absolute -inset-2 rounded-full bg-gradient-to-r from-sky-400 via-blue-400 to-purple-400 blur-md opacity-50"
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
        <div className="w-full h-full bg-gradient-to-br from-sky-400 to-blue-600 shadow-[inset_-3px_-3px_8px_rgba(0,0,0,0.2),inset_3px_3px_8px_rgba(255,255,255,0.5)] rounded-full">
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
  );
}
