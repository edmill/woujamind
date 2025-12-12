/**
 * Animated Icon Components for Actions and Expressions
 * Uses framer-motion for delightful micro-interactions
 */
import React from 'react';
import { motion } from 'framer-motion';
import { 
  Ghost, 
  Footprints, 
  Zap, 
  ArrowRight, 
  Sword, 
  Wand2, 
  Meh, 
  Smile, 
  Angry, 
  Frown,
  AlertCircle
} from 'lucide-react';
import { cn } from '../utils';

interface IconProps {
  className?: string;
}

// Actions
export const IdleIcon = ({ className }: IconProps) => (
  <motion.div
    animate={{ y: [-2, 2, -2] }}
    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
  >
    <Ghost className={className} />
  </motion.div>
);

export const WalkIcon = ({ className }: IconProps) => (
  <motion.div
    animate={{ rotate: [-5, 5, -5] }}
    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
  >
    <Footprints className={className} />
  </motion.div>
);

export const RunIcon = ({ className }: IconProps) => (
  <motion.div
    animate={{ 
      x: [-1, 1, -1],
      skewX: [-10, 10, -10]
    }}
    transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}
  >
    <Zap className={cn(className, "fill-current opacity-80")} />
  </motion.div>
);

export const JumpIcon = ({ className }: IconProps) => (
  <motion.div
    animate={{ y: [2, -4, 2] }}
    transition={{ duration: 1.2, repeat: Infinity, times: [0, 0.5, 1], ease: "easeInOut" }}
  >
    <ArrowRight className={cn(className, "-rotate-45")} />
  </motion.div>
);

export const AttackIcon = ({ className }: IconProps) => (
  <motion.div
    animate={{ rotate: [0, 45, 0] }}
    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", times: [0, 0.2, 1] }}
    style={{ originX: 0, originY: 1 }}
  >
    <Sword className={className} />
  </motion.div>
);

export const CastIcon = ({ className }: IconProps) => (
  <motion.div
    animate={{ rotate: [0, 15, 0] }}
    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    style={{ originX: 0.2, originY: 0.8 }}
  >
    <Wand2 className={className} />
    <motion.div
      className="absolute top-0 right-0 w-1 h-1 bg-current rounded-full"
      animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0] }}
      transition={{ duration: 2, repeat: Infinity }}
    />
  </motion.div>
);

// Expressions
export const NeutralIcon = ({ className }: IconProps) => (
  <motion.div
    animate={{ scaleY: [1, 0.9, 1] }}
    transition={{ duration: 3, repeat: Infinity, times: [0, 0.05, 0.1] }}
  >
    <Meh className={className} />
  </motion.div>
);

export const HappyIcon = ({ className }: IconProps) => (
  <motion.div
    animate={{ rotate: [-10, 10, -10] }}
    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
  >
    <Smile className={className} />
  </motion.div>
);

export const AngryIcon = ({ className }: IconProps) => (
  <motion.div
    animate={{ x: [-1, 1, -1] }}
    transition={{ duration: 0.2, repeat: Infinity, repeatDelay: 2 }}
  >
    <Angry className={className} />
  </motion.div>
);

export const ShockIcon = ({ className }: IconProps) => (
  <motion.div
    animate={{ scale: [1, 1.2, 1] }}
    transition={{ duration: 1.5, repeat: Infinity, times: [0, 0.1, 1] }}
  >
    <AlertCircle className={className} />
  </motion.div>
);

export const PainIcon = ({ className }: IconProps) => (
  <motion.div
    animate={{ opacity: [1, 0.5, 1] }}
    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
  >
    <Frown className={className} />
  </motion.div>
);
