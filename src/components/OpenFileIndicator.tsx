/**
 * OpenFileIndicator Component
 * Shows when a user has a file open in sprite edit mode and provides a way to return to it
 */
import React from 'react';
import { motion } from 'framer-motion';
import { FileImage, ArrowRight } from 'lucide-react';
import { cn } from '../utils';

interface OpenFileIndicatorProps {
  onReturnToEditor: () => void;
  theme?: 'dark' | 'light';
}

export function OpenFileIndicator({ onReturnToEditor, theme = 'dark' }: OpenFileIndicatorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="mb-4 shrink-0"
    >
      <button
        onClick={onReturnToEditor}
        className={cn(
          "w-full group relative overflow-hidden rounded-xl border-2 transition-all duration-300",
          "bg-gradient-to-r from-teal-500/10 via-orange-500/10 to-teal-500/10",
          "border-teal-500/30 dark:border-teal-400/30",
          "hover:border-teal-500/50 dark:hover:border-teal-400/50",
          "hover:shadow-lg hover:shadow-teal-500/20 dark:hover:shadow-teal-400/20",
          "active:scale-[0.98]"
        )}
      >
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-teal-500/0 via-orange-500/5 to-teal-500/0 group-hover:from-teal-500/5 group-hover:via-orange-500/10 group-hover:to-teal-500/5 transition-all duration-500" />
        
        <div className="relative flex items-center gap-3 px-4 py-3">
          {/* Icon */}
          <div className={cn(
            "flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center",
            "bg-teal-500/20 dark:bg-teal-400/20",
            "group-hover:bg-teal-500/30 dark:group-hover:bg-teal-400/30",
            "transition-colors duration-300"
          )}>
            <FileImage className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          </div>
          
          {/* Text Content */}
          <div className="flex-1 text-left min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                File Open in Editor
              </span>
              <motion.div
                animate={{ x: [0, 4, 0] }}
                transition={{ 
                  duration: 1.5, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="text-teal-600 dark:text-teal-400"
              >
                <ArrowRight className="w-4 h-4" />
              </motion.div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Click to return to sprite edit mode
            </p>
          </div>
        </div>
      </button>
    </motion.div>
  );
}






