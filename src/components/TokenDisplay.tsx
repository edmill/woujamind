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
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onPurchase}
      className={cn(
        "relative overflow-hidden group flex items-center rounded-full shadow-lg transition-all duration-300",
        tokens > 0 
          ? "bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-orange-300 dark:hover:border-orange-600 hover:shadow-orange-500/10" 
          : "bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-400 bg-[size:200%_auto] hover:bg-right shadow-orange-500/20",
        className
      )}
    >
      {/* Token Balance Section */}
      <div className="flex items-center p-1 pr-3">
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center shadow-sm transition-all duration-300",
          tokens > 0 
            ? "bg-gradient-to-br from-yellow-400 to-orange-500 text-white group-hover:scale-110" 
            : "bg-white/30 text-white"
        )}>
          <Zap className={cn("w-4 h-4 fill-current", tokens > 0 && "animate-pulse")} />
        </div>
        <div className="ml-3 flex flex-col leading-none">
          <span className={cn(
            "text-[10px] font-bold uppercase tracking-wider",
            tokens > 0 ? "text-slate-400" : "text-white/70"
          )}>
            Credits
          </span>
          <span className={cn(
            "text-sm font-bold font-mono",
            tokens > 0 ? "text-slate-900 dark:text-white" : "text-white"
          )}>
            {tokens}
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className={cn(
        "w-px h-8 transition-colors",
        tokens > 0 
          ? "bg-slate-200 dark:bg-slate-700 group-hover:bg-orange-300 dark:group-hover:bg-orange-600" 
          : "bg-white/20"
      )} />

      {/* Action Section */}
      <div className="flex items-center gap-1.5 px-4 py-2">
        <Plus className={cn(
          "w-4 h-4 stroke-[3] transition-transform group-hover:rotate-90 duration-300",
          tokens > 0 ? "text-orange-500 dark:text-orange-400" : "text-white"
        )} />
        <span className={cn(
          "font-bold text-sm whitespace-nowrap",
          tokens > 0 ? "text-slate-700 dark:text-slate-300" : "text-white"
        )}>
          Get Tokens
        </span>
      </div>

      {/* Shine effect on hover */}
      <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
    </motion.button>
  );
}
