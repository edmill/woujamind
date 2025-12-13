/**
 * PromptHelper Component
 * AI-powered dropdown with suggested character prompts
 */
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ChevronDown, Wand2, XCircle } from 'lucide-react';
import { cn } from '../utils';
import { SUGGESTED_PROMPTS } from '../constants';

interface PromptHelperProps {
  onSelectPrompt: (prompt: string) => void;
  currentPrompt: string;
}

export function PromptHelper({ onSelectPrompt, currentPrompt }: PromptHelperProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedCategory(null);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handlePromptSelect = (prompt: string) => {
    onSelectPrompt(prompt);
    setIsOpen(false);
    setSelectedCategory(null);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
          isOpen
            ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30"
            : "bg-gradient-to-r from-purple-500/10 to-pink-500/10 text-purple-600 dark:text-purple-300 hover:from-purple-500/20 hover:to-pink-500/20 border border-purple-500/20"
        )}
      >
        <Sparkles className="w-4 h-4" />
        <span>AI Inspire</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full right-0 mt-2 w-[420px] max-w-[calc(100vw-2rem)] max-h-[480px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-[200]"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-b border-slate-200 dark:border-slate-800 px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wand2 className="w-5 h-5 text-purple-600 dark:text-purple-300" />
                  <h3 className="font-bold text-slate-900 dark:text-white">
                    AI-Powered Inspiration
                  </h3>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <XCircle className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Choose a category to explore creative character ideas
              </p>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[400px] sprite-scroll">
              {!selectedCategory ? (
                /* Category Selection */
                <div className="p-3 space-y-2">
                  {SUGGESTED_PROMPTS.map((category, idx) => (
                    <motion.button
                      key={category.category}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      whileHover={{ scale: 1.02, x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedCategory(category.category)}
                      className="w-full text-left px-4 py-3 rounded-xl bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-800/50 hover:from-purple-50 hover:to-pink-50 dark:hover:from-purple-900/20 dark:hover:to-pink-900/20 border border-slate-200 dark:border-slate-700 transition-all group"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors">
                            {category.category}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {category.prompts.length} creative prompts
                          </div>
                        </div>
                        <ChevronDown className="w-5 h-5 text-slate-400 rotate-[-90deg] group-hover:text-purple-500 transition-colors" />
                      </div>
                    </motion.button>
                  ))}
                </div>
              ) : (
                /* Prompt Selection */
                <div className="p-3 space-y-2">
                  {/* Back Button */}
                  <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => setSelectedCategory(null)}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-purple-600 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors mb-2"
                  >
                    <ChevronDown className="w-4 h-4 rotate-90" />
                    Back to categories
                  </motion.button>

                  {/* Category Title */}
                  <div className="px-3 py-2 mb-2">
                    <h4 className="font-bold text-lg text-slate-900 dark:text-white">
                      {selectedCategory}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Click any prompt to use it
                    </p>
                  </div>

                  {/* Prompts List */}
                  {SUGGESTED_PROMPTS.find(c => c.category === selectedCategory)?.prompts.map((prompt, idx) => (
                    <motion.button
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      whileHover={{ scale: 1.01, x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handlePromptSelect(prompt)}
                      className={cn(
                        "w-full text-left px-4 py-3 rounded-xl border transition-all group relative overflow-hidden",
                        currentPrompt === prompt
                          ? "bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/50 dark:border-purple-500/50"
                          : "bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-600"
                      )}
                    >
                      {/* Sparkle Effect on Hover */}
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-pink-500/5 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                      
                      <div className="relative flex items-start gap-3">
                        <Sparkles className={cn(
                          "w-4 h-4 mt-0.5 flex-shrink-0",
                          currentPrompt === prompt
                            ? "text-purple-600 dark:text-purple-300"
                            : "text-slate-400 group-hover:text-purple-500 dark:group-hover:text-purple-400"
                        )} />
                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                          {prompt}
                        </p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 dark:border-slate-800 px-4 py-2 bg-slate-50 dark:bg-slate-900/50">
              <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center">
                💡 Pro tip: Mix and match ideas or add your own creative twist!
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

