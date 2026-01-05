/**
 * DirectionSelector Component
 * Circular/radial gamepad-style direction selector for sprite generation
 */
import React from 'react';
import { motion } from 'framer-motion';
import { Dot, Plus, Compass } from 'lucide-react';
import { cn } from '../utils';
import { DirectionSelection } from '../types';
import { calculateGenerationCost } from '../services/creditService';

interface DirectionSelectorProps {
  selectedDirectionCount: DirectionSelection;
  onDirectionCountChange: (count: DirectionSelection) => void;
  disabled?: boolean;
}

export function DirectionSelector({
  selectedDirectionCount,
  onDirectionCountChange,
  disabled = false
}: DirectionSelectorProps) {
  const directions: { count: DirectionSelection; label: string; icon: React.ReactNode; description: string }[] = [
    {
      count: 1,
      label: '1',
      icon: <Dot className="w-4 h-4" />,
      description: 'Single direction'
    },
    {
      count: 4,
      label: '4',
      icon: <Plus className="w-4 h-4" />,
      description: '4 directions (N, E, S, W)'
    },
    {
      count: 8,
      label: '8',
      icon: <Compass className="w-4 h-4" />,
      description: '8 directions (N, NE, E, SE, S, SW, W, NW)'
    }
  ];

  return (
    <div className="space-y-2">
      {/* Compact Button Layout */}
      <div className="flex items-center justify-center gap-2">
        {directions.map((dir) => {
          const isSelected = selectedDirectionCount === dir.count;
          const cost = calculateGenerationCost(dir.count);

          return (
            <motion.button
              key={dir.count}
              whileHover={!disabled ? { scale: 1.05 } : {}}
              whileTap={!disabled ? { scale: 0.95 } : {}}
              onClick={() => !disabled && onDirectionCountChange(dir.count)}
              disabled={disabled}
              className={cn(
                "relative flex flex-col items-center justify-center rounded-lg border transition-all",
                "w-14 h-14 group",
                isSelected
                  ? "border-orange-500 bg-orange-500/10 shadow-[0_0_10px_rgba(249,115,22,0.3)]"
                  : "border-slate-200 bg-white/50 hover:border-orange-300 dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-orange-600",
                disabled && "opacity-50 cursor-not-allowed"
              )}
              title={dir.description}
            >
              {/* Icon */}
              <div className={cn(
                "relative z-10 transition-colors",
                isSelected
                  ? "text-orange-600 dark:text-orange-400"
                  : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300"
              )}>
                {dir.icon}
              </div>

              {/* Label */}
              <div className={cn(
                "relative z-10 text-sm font-bold transition-colors -mt-0.5",
                isSelected
                  ? "text-orange-600 dark:text-orange-400"
                  : "text-slate-600 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200"
              )}>
                {dir.label}
              </div>

              {/* Cost badge */}
              <div className={cn(
                "absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-full text-[9px] font-bold whitespace-nowrap transition-all",
                isSelected
                  ? "bg-orange-500 text-white"
                  : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
              )}>
                {cost.creditsRequired}cr
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Compact Info */}
      <div className="text-center">
        <div className="text-xs text-slate-500 dark:text-slate-400">
          {selectedDirectionCount} {selectedDirectionCount === 1 ? 'direction' : 'directions'} = {' '}
          <span className="font-bold text-orange-600 dark:text-orange-400">
            {calculateGenerationCost(selectedDirectionCount).creditsRequired}cr
          </span>
          {' '}(${calculateGenerationCost(selectedDirectionCount).usdEquivalent.toFixed(2)})
        </div>
      </div>

      {/* Compact hint - overhead games only */}
      <div className="flex items-start gap-1.5 p-2 rounded-md bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800">
        <div className="text-sky-600 dark:text-sky-400 mt-0.5 flex-shrink-0">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="text-[10px] text-sky-700 dark:text-sky-300 leading-relaxed">
          <span className="font-semibold">Overhead games only:</span> For top-down/top-view games. Not needed for 2D side-scrolling games.
        </div>
      </div>
    </div>
  );
}

