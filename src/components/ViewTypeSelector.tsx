/**
 * ViewTypeSelector Component
 * Allows users to select between side-view and top-down game perspectives
 */
import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../utils';
import { ViewType } from '../types';

interface ViewTypeSelectorProps {
  selectedViewType: ViewType;
  onViewTypeChange: (viewType: ViewType) => void;
  disabled?: boolean;
}

// Visual diagrams for view types
const ViewTypeDiagrams = {
  'side-view': () => (
    <svg viewBox="0 0 48 32" className="w-full h-full">
      {/* Side-scrolling platformer representation */}
      {/* Ground platforms */}
      <rect x="2" y="26" width="44" height="4" className="fill-current opacity-30" rx="1" />
      <rect x="8" y="18" width="12" height="2" className="fill-current opacity-30" rx="0.5" />
      <rect x="28" y="18" width="12" height="2" className="fill-current opacity-30" rx="0.5" />

      {/* Character facing right */}
      <circle cx="24" cy="20" r="3" className="fill-current opacity-80" />
      <rect x="22" y="23" width="4" height="6" rx="1" className="fill-current opacity-80" />

      {/* Arrow pointing right */}
      <path d="M 30 23 L 34 23 M 32 21 L 34 23 L 32 25" className="stroke-current opacity-60" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  'top-down': () => (
    <svg viewBox="0 0 48 32" className="w-full h-full">
      {/* Top-down RPG/strategy representation */}
      {/* Grid tiles suggesting overhead view */}
      <rect x="4" y="4" width="8" height="8" className="stroke-current fill-none opacity-20" strokeWidth="1" />
      <rect x="12" y="4" width="8" height="8" className="stroke-current fill-none opacity-20" strokeWidth="1" />
      <rect x="20" y="4" width="8" height="8" className="stroke-current fill-none opacity-20" strokeWidth="1" />
      <rect x="28" y="4" width="8" height="8" className="stroke-current fill-none opacity-20" strokeWidth="1" />
      <rect x="36" y="4" width="8" height="8" className="stroke-current fill-none opacity-20" strokeWidth="1" />

      {/* Character viewed from above (center) */}
      <circle cx="24" cy="16" r="4" className="fill-current opacity-70" />
      <ellipse cx="24" cy="20" rx="3" ry="1.5" className="fill-current opacity-50" />

      {/* 4 direction arrows around character */}
      {/* Up */}
      <path d="M 24 8 L 24 11 M 22.5 9.5 L 24 8 L 25.5 9.5" className="stroke-current opacity-50" strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {/* Right */}
      <path d="M 32 16 L 29 16 M 30.5 14.5 L 32 16 L 30.5 17.5" className="stroke-current opacity-50" strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {/* Down */}
      <path d="M 24 24 L 24 27 M 22.5 25.5 L 24 27 L 25.5 25.5" className="stroke-current opacity-50" strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {/* Left */}
      <path d="M 16 16 L 19 16 M 17.5 14.5 L 16 16 L 17.5 17.5" className="stroke-current opacity-50" strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
};

export function ViewTypeSelector({
  selectedViewType,
  onViewTypeChange,
  disabled = false
}: ViewTypeSelectorProps) {
  const viewTypes: { id: ViewType; label: string; diagram: React.FC; description: string }[] = [
    {
      id: 'side-view',
      label: 'Side View',
      diagram: ViewTypeDiagrams['side-view'],
      description: 'For 2D platformers, beat-em-ups, or side-scrolling games'
    },
    {
      id: 'top-down',
      label: 'Top-Down',
      diagram: ViewTypeDiagrams['top-down'],
      description: 'For overhead RPGs, strategy games, or top-view games'
    }
  ];

  return (
    <div className="space-y-3">
      {/* View Type Buttons */}
      <div className="grid grid-cols-2 gap-3">
        {viewTypes.map((viewType) => {
          const isSelected = selectedViewType === viewType.id;
          const DiagramComponent = viewType.diagram;

          return (
            <motion.button
              key={viewType.id}
              whileHover={!disabled ? { scale: 1.02 } : {}}
              whileTap={!disabled ? { scale: 0.98 } : {}}
              onClick={() => !disabled && onViewTypeChange(viewType.id)}
              disabled={disabled}
              className={cn(
                "relative flex flex-col items-center justify-between rounded-xl border-2 transition-all",
                "px-3 py-3 group min-h-[110px]",
                isSelected
                  ? "border-orange-500 bg-orange-500/10 shadow-[0_0_15px_rgba(249,115,22,0.25)]"
                  : "border-slate-200 bg-white/80 hover:border-orange-300 dark:border-slate-700 dark:bg-slate-800/80 dark:hover:border-orange-600",
                disabled && "opacity-50 cursor-not-allowed"
              )}
              title={viewType.description}
            >
              {/* Visual Diagram */}
              <div className={cn(
                "w-full aspect-[3/2] max-w-[80px] transition-colors",
                isSelected
                  ? "text-orange-600 dark:text-orange-400"
                  : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-400"
              )}>
                <DiagramComponent />
              </div>

              {/* Label */}
              <div className="flex flex-col items-center gap-1 mt-2">
                <div className={cn(
                  "text-sm font-bold transition-colors text-center",
                  isSelected
                    ? "text-orange-700 dark:text-orange-300"
                    : "text-slate-600 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-300"
                )}>
                  {viewType.label}
                </div>
                <div className={cn(
                  "text-[10px] leading-tight text-center transition-colors",
                  isSelected
                    ? "text-slate-600 dark:text-slate-400"
                    : "text-slate-500 dark:text-slate-500"
                )}>
                  {viewType.description}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Info hint */}
      {selectedViewType === 'top-down' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-1.5 p-2 rounded-md bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800"
        >
          <div className="text-sky-600 dark:text-sky-400 mt-0.5 flex-shrink-0">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-[10px] text-sky-700 dark:text-sky-300 leading-relaxed">
            You'll be able to choose the number of directions in the next step.
          </div>
        </motion.div>
      )}
    </div>
  );
}
