/**
 * Selection Card Component
 */
import React from 'react';
import { motion } from 'framer-motion';
import { ActionOption, ExpressionOption } from '../types';
import { cn } from '../utils';

export const SelectionCard = ({ 
  item, 
  selected, 
  onClick 
}: { 
  item: ActionOption | ExpressionOption; 
  selected: boolean; 
  onClick: () => void;
}) => {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -5, scale: 1.02 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        "flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200",
        "relative overflow-hidden group h-24 w-full",
        selected 
          ? "border-orange-500 bg-orange-500/10 shadow-[0_0_15px_rgba(249,115,22,0.3)]" 
          : "border-slate-200 bg-white/50 hover:bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-slate-700 dark:hover:bg-slate-800"
      )}
    >
      <div className={cn(
        "mb-2 transition-colors",
        selected ? "text-orange-600 dark:text-orange-300" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200"
      )}>
        {item.icon}
      </div>
      <span className={cn(
        "text-xs font-bold uppercase tracking-wider transition-colors",
        selected ? "text-orange-900 dark:text-white" : "text-slate-500 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300"
      )}>
        {item.label}
      </span>
    </motion.button>
  );
};
