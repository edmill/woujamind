/**
 * Header Component
 * Displays the logo, title, token count, and theme toggle.
 */
import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon, Settings2, Plus, Upload } from 'lucide-react';
import { AnimatedLogo } from './AnimatedLogo';
import { TokenDisplay } from './TokenDisplay';
import { Theme } from '../types';

type SphereState = 'hidden' | 'idle' | 'working' | 'swoosh';

interface HeaderProps {
  tokens: number;
  setShowPricing: (show: boolean) => void;
  theme: Theme;
  toggleTheme: () => void;
  onSettingsClick?: () => void;
  onNewClick?: () => void;
  onLoadSpriteSheet?: () => void;
  sphereState?: SphereState;
  onSwooshComplete?: () => void;
}

export function Header({ tokens, setShowPricing, theme, toggleTheme, onSettingsClick, onNewClick, onLoadSpriteSheet, sphereState, onSwooshComplete }: HeaderProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex-shrink-0 mb-6 flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 gap-4"
    >
      <div className="flex items-center">
        <AnimatedLogo sphereState={sphereState} onSwooshComplete={onSwooshComplete} />
      </div>

      <div className="flex items-center gap-3 md:gap-4 self-end md:self-auto">
        {onNewClick && (
          <>
            <button
              onClick={onNewClick}
              className="px-4 py-2 rounded-lg font-semibold text-sm bg-orange-500 text-white hover:bg-orange-600 hover:shadow-lg hover:shadow-orange-500/25 active:scale-95 transition-all flex items-center gap-2"
              title="Create New Animation"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New</span>
            </button>
          </>
        )}
        {onLoadSpriteSheet && (
          <>
            <button
              onClick={onLoadSpriteSheet}
              className="px-4 py-2 rounded-lg font-semibold text-sm bg-teal-500 text-white hover:bg-teal-600 hover:shadow-lg hover:shadow-teal-500/25 active:scale-95 transition-all flex items-center gap-2"
              title="Load Existing Sprite Sheet"
            >
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Load</span>
            </button>
            <div className="w-px h-8 bg-slate-200 dark:bg-slate-800 mx-1 hidden md:block" />
          </>
        )}

        <TokenDisplay 
          tokens={tokens} 
          onPurchase={() => setShowPricing(true)} 
        />
        
        <div className="w-px h-8 bg-slate-200 dark:bg-slate-800 mx-2 hidden md:block" />

        {onSettingsClick && (
          <button 
            onClick={onSettingsClick}
            className="p-2 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
            title="Settings"
          >
            <Settings2 className="w-5 h-5" />
          </button>
        )}

        <button 
          onClick={toggleTheme}
          className="p-2 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>
    </motion.div>
  );
}


