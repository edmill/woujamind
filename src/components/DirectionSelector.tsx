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
      icon: <Dot className="w-6 h-6" />,
      description: 'Single direction (front or side view)'
    },
    {
      count: 4,
      label: '4',
      icon: <Plus className="w-6 h-6" />,
      description: '4 cardinal directions (N, E, S, W)'
    },
    {
      count: 8,
      label: '8',
      icon: <Compass className="w-6 h-6" />,
      description: '8 directions (N, NE, E, SE, S, SW, W, NW)'
    }
  ];

  return (
    <div className="space-y-4">
      {/* Circular/Radial Button Layout */}
      <div className="flex items-center justify-center gap-4">
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
                "relative flex flex-col items-center justify-center rounded-2xl border-2 transition-all",
                "w-24 h-24 group",
                isSelected
                  ? "border-orange-500 bg-orange-500/10 shadow-[0_0_20px_rgba(249,115,22,0.4)]"
                  : "border-slate-200 bg-white/50 hover:border-orange-300 dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-orange-600",
                disabled && "opacity-50 cursor-not-allowed"
              )}
              title={dir.description}
            >
              {/* Glow effect for selected */}
              {isSelected && (
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 animate-pulse" />
              )}

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
                "relative z-10 text-2xl font-bold transition-colors mt-1",
                isSelected
                  ? "text-orange-600 dark:text-orange-400"
                  : "text-slate-600 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200"
              )}>
                {dir.label}
              </div>

              {/* Cost badge */}
              <div className={cn(
                "absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap transition-all",
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

      {/* Selected Direction Info */}
      <div className="text-center space-y-1">
        <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {directions.find(d => d.count === selectedDirectionCount)?.description}
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400">
          {selectedDirectionCount} {selectedDirectionCount === 1 ? 'direction' : 'directions'} = {' '}
          <span className="font-bold text-orange-600 dark:text-orange-400">
            {calculateGenerationCost(selectedDirectionCount).creditsRequired} credits
          </span>
          {' '}(${calculateGenerationCost(selectedDirectionCount).usdEquivalent.toFixed(2)})
        </div>
      </div>

      {/* Info hint */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800">
        <div className="text-sky-600 dark:text-sky-400 mt-0.5">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="text-xs text-sky-700 dark:text-sky-300 leading-relaxed">
          <span className="font-semibold">Tip:</span> Start with 1 direction to test your character, then generate 4 or 8 directions for full game-ready sprites.
        </div>
      </div>
    </div>
  );
}

