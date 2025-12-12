/**
 * Blob Preview Component with animation logic
 */
import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TabMode, ActionType, ExpressionType } from '../types';
import { cn } from '../utils';

export const BlobPreview = ({ 
  mode,
  action, 
  expression,
  isTransparent = false
}: { 
  mode: TabMode;
  action: ActionType; 
  expression: ExpressionType;
  isTransparent?: boolean;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) - rect.width / 2;
      const y = (e.clientY - rect.top) - rect.height / 2;
      
      const maxRange = 10;
      const limitedX = Math.max(Math.min(x / 10, maxRange), -maxRange);
      const limitedY = Math.max(Math.min(y / 10, maxRange), -maxRange);
      
      setMousePos({ x: limitedX, y: limitedY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const bodyVariants = {
    idle: { 
      scaleY: [1, 1.05, 0.95, 1], 
      scaleX: [1, 0.95, 1.05, 1],
      y: [0, -5, 0],
      borderRadius: [
        "60% 40% 30% 70% / 60% 30% 70% 40%",
        "50% 60% 50% 40% / 40% 50% 40% 60%",
        "60% 40% 30% 70% / 60% 30% 70% 40%"
      ],
      transition: { repeat: Infinity, duration: 4, ease: "easeInOut" } 
    },
    walk: { 
      y: [0, -10, 0], 
      rotate: [-5, 5, -5],
      borderRadius: [
        "50% 50% 50% 50% / 50% 50% 50% 50%",
        "45% 55% 45% 55% / 55% 45% 55% 45%", 
        "50% 50% 50% 50% / 50% 50% 50% 50%"
      ],
      transition: { repeat: Infinity, duration: 0.8, ease: "linear" } 
    },
    run: { 
      y: [0, -5, 0], 
      skewX: [-10, -20, -10],
      scaleX: [1.1, 1, 1.1],
      transition: { repeat: Infinity, duration: 0.4, ease: "linear" } 
    },
    jump: { 
      y: [0, -40, 0], 
      scaleY: [0.8, 1.2, 0.9, 1],
      scaleX: [1.2, 0.8, 1.1, 1],
      transition: { repeat: Infinity, duration: 1.2, times: [0, 0.5, 0.9, 1] } 
    },
    attack: { 
      x: [0, 30, -5, 0], 
      scaleX: [1, 1.3, 0.9, 1],
      transition: { repeat: Infinity, duration: 1, delay: 0.5 } 
    },
    cast: { 
      scale: [1, 1.15, 1], 
      filter: ["brightness(1)", "brightness(1.3)", "brightness(1)"],
      transition: { repeat: Infinity, duration: 1.5 } 
    },
  };

  const currentExpression = mode === 'expression' ? expression : 'neutral';
  
  const Eye = ({ className, style }: { className?: string, style?: React.CSSProperties }) => (
    <motion.div 
      className={cn("bg-black/80 absolute top-1/3 transition-all duration-300", className)}
      style={{ 
        ...style,
        x: mousePos.x, 
        y: mousePos.y 
      }} 
    />
  );

  const renderFace = () => {
    switch(currentExpression) {
      case 'happy':
        return (
          <>
            <Eye className="left-3 w-2 h-3 rounded-full" style={{ height: 4, borderRadius: '50% 50% 0 0' }} />
            <Eye className="right-3 w-2 h-3 rounded-full" style={{ height: 4, borderRadius: '50% 50% 0 0' }} />
            <motion.div 
              style={{ x: mousePos.x * 0.5, y: mousePos.y * 0.5 }}
              className="absolute bottom-1/3 left-1/2 -translate-x-1/2 w-4 h-2 border-b-2 border-black/80 rounded-full" 
            />
          </>
        );
      case 'angry':
        return (
          <>
            <Eye className="left-3 w-2 h-3 rotate-12" />
            <Eye className="right-3 w-2 h-3 -rotate-12" />
            <motion.div 
              style={{ x: mousePos.x * 0.5, y: mousePos.y * 0.5 }}
              className="absolute bottom-1/3 left-1/2 -translate-x-1/2 w-4 h-1 bg-black/80 rounded-full mt-1" 
            />
          </>
        );
      case 'surprised':
        return (
          <>
            <Eye className="left-3 w-3 h-3 rounded-full" />
            <Eye className="right-3 w-3 h-3 rounded-full" />
            <motion.div 
              style={{ x: mousePos.x * 0.5, y: mousePos.y * 0.5 }}
              className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-2 h-2 bg-black/80 rounded-full" 
            />
          </>
        );
      case 'pain':
        return (
          <>
             <div className="absolute top-1/3 left-3 text-black/80 text-xs font-bold" style={{ transform: `translate(${mousePos.x}px, ${mousePos.y}px)` }}>X</div>
             <div className="absolute top-1/3 right-3 text-black/80 text-xs font-bold" style={{ transform: `translate(${mousePos.x}px, ${mousePos.y}px)` }}>X</div>
             <motion.div 
              style={{ x: mousePos.x * 0.5, y: mousePos.y * 0.5 }}
              className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-3 h-1 bg-black/80 rounded-full rotate-12" 
             />
          </>
        );
      default: 
        return (
          <>
            <Eye className="left-4 w-2 h-3 rounded-full" />
            <Eye className="right-4 w-2 h-3 rounded-full" />
            {mode === 'expression' && (
              <motion.div 
                style={{ x: mousePos.x * 0.5, y: mousePos.y * 0.5 }}
                className="absolute bottom-1/3 left-1/2 -translate-x-1/2 w-2 h-1 bg-black/40 rounded-full" 
              />
            )}
          </>
        );
    }
  };

  const activeAnim = mode === 'action' ? action : 'idle';

  return (
    <div ref={containerRef} className={cn(
      "w-full h-full flex flex-col items-center justify-center relative overflow-hidden rounded-2xl border transition-colors duration-300",
      isTransparent 
        ? "bg-[#e5e5f7] border-slate-300 dark:border-slate-700" 
        : "bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800"
    )}>
      
      {/* Background Effect - Only show if NOT transparent */}
      {!isTransparent ? (
        <>
          {/* Grid Background */}
          <motion.div 
            animate={{ backgroundPosition: ["0px 0px", "40px 40px"] }}
            transition={{ duration: 4, ease: "linear", repeat: Infinity }}
            className="absolute inset-0 opacity-10 dark:opacity-20" 
            style={{ 
              backgroundImage: 'linear-gradient(to right, #0ea5e9 1px, transparent 1px), linear-gradient(to bottom, #0ea5e9 1px, transparent 1px)',
              backgroundSize: '40px 40px'
            }} 
          />
          {/* Spotlight */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-orange-500/5 dark:to-orange-900/20" />
        </>
      ) : (
        /* Checkerboard for Transparency */
        <div className="absolute inset-0 opacity-40" 
          style={{
             backgroundImage: 'radial-gradient(#0ea5e9 0.5px, transparent 0.5px), radial-gradient(#0ea5e9 0.5px, #e5e5f7 0.5px)',
             backgroundSize: '20px 20px',
             backgroundPosition: '0 0, 10px 10px'
          }}
        />
      )}

      {/* The Organic Blob */}
      <motion.div
        variants={bodyVariants}
        animate={activeAnim}
        className="relative w-28 h-24"
      >
        {/* Shadow - Hide if transparent */}
        {!isTransparent && (
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-16 h-4 bg-black/20 dark:bg-black/40 blur-md rounded-full" />
        )}
        
        {/* Body */}
        <div className={cn(
          "w-full h-full shadow-[inset_-10px_-10px_20px_rgba(0,0,0,0.1),inset_10px_10px_20px_rgba(255,255,255,0.4)] dark:shadow-[inset_-10px_-10px_20px_rgba(0,0,0,0.2),inset_10px_10px_20px_rgba(255,255,255,0.2)]",
          "bg-gradient-to-br from-orange-300 to-sky-500 dark:from-orange-400 dark:to-sky-600 flex items-center justify-center relative backdrop-blur-md transition-all duration-500"
        )}
        style={{
          borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%" 
        }}
        >
          {/* Shine */}
          <div className="absolute top-4 left-5 w-6 h-4 bg-white/60 dark:bg-white/40 rounded-[50%] blur-sm rotate-[-20deg]" />
          
          {/* Face Container */}
          <div className="relative w-16 h-12">
            {renderFace()}
          </div>
        </div>

        {/* Particles for Cast/Attack */}
        {activeAnim === 'cast' && (
          <motion.div 
            animate={{ rotate: 360, scale: [1, 1.5, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute -inset-4 border-2 border-dashed border-yellow-400/50 dark:border-yellow-300/50 rounded-full"
          />
        )}
      </motion.div>
      
      <div className="absolute bottom-6 font-mono text-xs text-slate-500 dark:text-slate-400 bg-white/80 dark:bg-slate-900/80 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700 backdrop-blur-sm">
        PREVIEW: {mode === 'action' ? action.toUpperCase() : expression.toUpperCase()}
      </div>
    </div>
  );
};
