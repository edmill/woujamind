/**
 * DirectionSelector Component
 * Circular/radial gamepad-style direction selector for sprite generation
 */
import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../utils';
import { DirectionSelection } from '../types';
import { calculateGenerationCost } from '../services/creditService';

interface DirectionSelectorProps {
  selectedDirectionCount: DirectionSelection;
  onDirectionCountChange: (count: DirectionSelection) => void;
  disabled?: boolean;
}

// Visual direction diagrams
const DirectionDiagrams = {
  1: () => (
    <svg viewBox="0 0 32 32" className="w-full h-full">
      {/* Single character sprite facing down */}
      <circle cx="16" cy="14" r="4" className="fill-current opacity-80" />
      <rect x="13" y="18" width="6" height="8" rx="1" className="fill-current opacity-80" />
      {/* Down arrow */}
      <path d="M16 28 L16 30 M14 29 L16 31 L18 29" className="stroke-current opacity-60" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  4: () => (
    <svg viewBox="0 0 32 32" className="w-full h-full">
      {/* 4 small sprites arranged in cross pattern */}
      {/* Top (N) */}
      <circle cx="16" cy="6" r="2" className="fill-current opacity-70" />
      <rect x="15" y="8" width="2" height="3" className="fill-current opacity-70" />
      {/* Right (E) */}
      <circle cx="26" cy="16" r="2" className="fill-current opacity-70" />
      <rect x="25" y="18" width="2" height="3" className="fill-current opacity-70" />
      {/* Bottom (S) */}
      <circle cx="16" cy="26" r="2" className="fill-current opacity-70" />
      <rect x="15" y="28" width="2" height="3" className="fill-current opacity-70" />
      {/* Left (W) */}
      <circle cx="6" cy="16" r="2" className="fill-current opacity-70" />
      <rect x="5" y="18" width="2" height="3" className="fill-current opacity-70" />
      {/* Plus symbol in center */}
      <path d="M16 14 L16 18 M14 16 L18 16" className="stroke-current opacity-40" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  8: () => (
    <svg viewBox="0 0 32 32" className="w-full h-full">
      {/* 8 tiny sprites in compass pattern */}
      {/* N */}
      <circle cx="16" cy="4" r="1.5" className="fill-current opacity-60" />
      <rect x="15.25" y="5.5" width="1.5" height="2" className="fill-current opacity-60" />
      {/* NE */}
      <circle cx="23" cy="9" r="1.5" className="fill-current opacity-60" />
      <rect x="22.25" y="10.5" width="1.5" height="2" className="fill-current opacity-60" />
      {/* E */}
      <circle cx="28" cy="16" r="1.5" className="fill-current opacity-60" />
      <rect x="27.25" y="17.5" width="1.5" height="2" className="fill-current opacity-60" />
      {/* SE */}
      <circle cx="23" cy="23" r="1.5" className="fill-current opacity-60" />
      <rect x="22.25" y="24.5" width="1.5" height="2" className="fill-current opacity-60" />
      {/* S */}
      <circle cx="16" cy="28" r="1.5" className="fill-current opacity-60" />
      <rect x="15.25" y="29.5" width="1.5" height="2" className="fill-current opacity-60" />
      {/* SW */}
      <circle cx="9" cy="23" r="1.5" className="fill-current opacity-60" />
      <rect x="8.25" y="24.5" width="1.5" height="2" className="fill-current opacity-60" />
      {/* W */}
      <circle cx="4" cy="16" r="1.5" className="fill-current opacity-60" />
      <rect x="3.25" y="17.5" width="1.5" height="2" className="fill-current opacity-60" />
      {/* NW */}
      <circle cx="9" cy="9" r="1.5" className="fill-current opacity-60" />
      <rect x="8.25" y="10.5" width="1.5" height="2" className="fill-current opacity-60" />
      {/* Compass center */}
      <circle cx="16" cy="16" r="2" className="stroke-current fill-none opacity-30" strokeWidth="1" />
    </svg>
  )
};

export function DirectionSelector({
  selectedDirectionCount,
  onDirectionCountChange,
  disabled = false
}: DirectionSelectorProps) {
  const directions: { count: DirectionSelection; label: string; diagram: React.FC; description: string }[] = [
    {
      count: 1,
      label: '1',
      diagram: DirectionDiagrams[1],
      description: 'Single direction'
    },
    {
      count: 4,
      label: '4',
      diagram: DirectionDiagrams[4],
      description: '4 directions (N, E, S, W)'
    },
    {
      count: 8,
      label: '8',
      diagram: DirectionDiagrams[8],
      description: '8 directions (N, NE, E, SE, S, SW, W, NW)'
    }
  ];

  return (
    <div className="space-y-3">
      {/* Button Layout with Visual Examples */}
      <div className="flex items-stretch justify-center gap-3">
        {directions.map((dir) => {
          const isSelected = selectedDirectionCount === dir.count;
          const cost = calculateGenerationCost(dir.count);
          const DiagramComponent = dir.diagram;

          return (
            <motion.button
              key={dir.count}
              whileHover={!disabled ? { scale: 1.03 } : {}}
              whileTap={!disabled ? { scale: 0.97 } : {}}
              onClick={() => !disabled && onDirectionCountChange(dir.count)}
              disabled={disabled}
              className={cn(
                "relative flex flex-col items-center justify-between rounded-xl border-2 transition-all",
                "flex-1 px-3 py-3 group min-h-[100px]",
                isSelected
                  ? "border-orange-500 bg-orange-500/10 shadow-[0_0_15px_rgba(249,115,22,0.25)]"
                  : "border-slate-200 bg-white/80 hover:border-orange-300 dark:border-slate-700 dark:bg-slate-800/80 dark:hover:border-orange-600",
                disabled && "opacity-50 cursor-not-allowed"
              )}
              title={dir.description}
            >
              {/* Visual Diagram */}
              <div className={cn(
                "w-full aspect-square max-w-[48px] transition-colors",
                isSelected
                  ? "text-orange-600 dark:text-orange-400"
                  : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-400"
              )}>
                <DiagramComponent />
              </div>

              {/* Label with count */}
              <div className="flex flex-col items-center gap-0.5 mt-2">
                <div className={cn(
                  "text-xs font-semibold transition-colors",
                  isSelected
                    ? "text-orange-700 dark:text-orange-300"
                    : "text-slate-600 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-300"
                )}>
                  {dir.label} Direction{dir.count > 1 ? 's' : ''}
                </div>

                {/* Cost badge */}
                <div className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap transition-all",
                  isSelected
                    ? "bg-orange-500 text-white shadow-sm"
                    : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400"
                )}>
                  {cost.creditsRequired}cr
                </div>
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
    </div>
  );
}

