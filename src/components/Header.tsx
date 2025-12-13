/**
 * Header Component
 * Displays the logo, title, token count, and theme toggle.
 */
import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon, Settings2 } from 'lucide-react';
import { AnimatedLogo } from './AnimatedLogo';
import { TokenDisplay } from './TokenDisplay';
import { Theme } from '../types';

interface HeaderProps {
  tokens: number;
  setShowPricing: (show: boolean) => void;
  theme: Theme;
  toggleTheme: () => void;
  onSettingsClick?: () => void;
}

export function Header({ tokens, setShowPricing, theme, toggleTheme, onSettingsClick }: HeaderProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex-shrink-0 mb-6 flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 gap-4"
    >
      <div className="flex items-center gap-4">
        <AnimatedLogo />
        <div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-600 via-sky-600 to-orange-500 dark:from-orange-400 dark:via-sky-400 dark:to-orange-300">
            Sprite Magic
          </h1>
          <p className="text-slate-500 text-sm">AI-Powered Character Alchemist</p>
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-4 self-end md:self-auto">
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

