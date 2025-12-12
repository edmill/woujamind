/**
 * TokenDisplay Component
 * Displays current token balance and purchase button.
 */
import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Plus } from 'lucide-react';
import { cn } from '../utils';

interface TokenDisplayProps {
  tokens: number;
  onPurchase: () => void;
  className?: string;
}

export function TokenDisplay({ tokens, onPurchase, className }: TokenDisplayProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Token Balance Pill */}
      <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 p-1 pr-4 shadow-inner">
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center shadow-sm",
          tokens > 0 
            ? "bg-gradient-to-br from-yellow-400 to-orange-500 text-white" 
            : "bg-slate-300 dark:bg-slate-700 text-slate-500"
        )}>
          <Zap className={cn("w-4 h-4 fill-current", tokens > 0 && "animate-pulse")} />
        </div>
        <div className="ml-3 flex flex-col leading-none">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Credits</span>
          <span className={cn(
            "text-sm font-bold font-mono",
            tokens > 0 ? "text-slate-900 dark:text-white" : "text-red-500"
          )}>
            {tokens}
          </span>
        </div>
      </div>

      {/* Purchase Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onPurchase}
        className="relative overflow-hidden group rounded-full bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-400 bg-[size:200%_auto] hover:bg-right px-4 py-2 shadow-lg shadow-orange-500/20 transition-all duration-300"
      >
        <div className="flex items-center gap-1.5 text-white font-bold text-sm shadow-black/10 text-shadow-sm">
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Get Tokens</span>
        </div>
        
        {/* Shine effect */}
        <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent z-10" />
      </motion.button>
    </div>
  );
}
