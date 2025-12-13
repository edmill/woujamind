/**
 * Animated Logo Component
 * A delightful, motion-rich logo for Sprite Magic.
 */
import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

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
        className="absolute -inset-1 rounded-xl bg-gradient-to-r from-orange-500 via-yellow-500 to-sky-500 blur opacity-40 group-hover:opacity-75 transition duration-500"
      />
      
      {/* Icon Container */}
      <div className="relative bg-gradient-to-tr from-orange-500 to-sky-500 p-3 rounded-xl shadow-lg shadow-orange-900/20 flex items-center justify-center overflow-hidden">
        
        {/* Shine Effect */}
        <motion.div
          animate={{ x: [-50, 50] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          className="absolute inset-0 w-4 bg-white/30 skew-x-12 blur-sm"
          style={{ left: '-20px' }}
        />

        {/* Main Icon */}
        <motion.div
          whileHover={{ rotate: [0, -10, 10, -10, 0] }}
          transition={{ duration: 0.5 }}
        >
          <Sparkles className="w-6 h-6 text-white" />
        </motion.div>

        {/* Particle Sparkles */}
        <motion.div
          animate={{ 
            opacity: [0, 1, 0],
            scale: [0.5, 1, 0.5],
            x: [0, 10],
            y: [0, -10]
          }}
          transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 0.5 }}
          className="absolute top-1 right-1"
        >
          <Sparkles className="w-2 h-2 text-yellow-200" />
        </motion.div>
      </div>
    </div>
  );
}
