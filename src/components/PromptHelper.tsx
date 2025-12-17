/**
 * PromptHelper Component
 * AI-powered dropdown with suggested character prompts
 */
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ChevronDown, Wand2, XCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../utils';
import { SUGGESTED_PROMPTS } from '../constants';
import { generateCharacterPrompts } from '../services/geminiService';

interface PromptHelperProps {
  onSelectPrompt: (prompt: string) => void;
  currentPrompt: string;
}

export function PromptHelper({ onSelectPrompt, currentPrompt }: PromptHelperProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [aiGeneratedPrompts, setAiGeneratedPrompts] = useState<Record<string, string[]>>({});
  const [isGenerating, setIsGenerating] = useState(false);
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

  const handleRefreshPrompts = async () => {
    if (!selectedCategory || isGenerating) return;

    setIsGenerating(true);
    try {
      const newPrompts = await generateCharacterPrompts(selectedCategory, 5);
      setAiGeneratedPrompts(prev => ({
        ...prev,
        [selectedCategory]: newPrompts
      }));
      toast.success('New prompts generated!');
    } catch (error) {
      console.error('Failed to generate prompts:', error);
      toast.error('Failed to generate new prompts. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Get prompts for current category (AI-generated if available, otherwise default)
  const getCurrentPrompts = (): string[] => {
    if (!selectedCategory) return [];

    // If we have AI-generated prompts for this category, use them
    if (aiGeneratedPrompts[selectedCategory]) {
      return aiGeneratedPrompts[selectedCategory];
    }

    // Otherwise use default prompts
    const category = SUGGESTED_PROMPTS.find(c => c.category === selectedCategory);
    return category?.prompts || [];
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
            ? "bg-orange-500 text-white shadow-lg shadow-orange-500/30"
            : "bg-orange-500/10 text-orange-600 dark:text-orange-300 hover:bg-orange-500/20 border border-orange-500/20"
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
            className="absolute top-full right-0 mt-2 w-[420px] max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-[200] flex flex-col max-h-[520px] overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500/10 to-sky-500/10 border-b border-slate-200 dark:border-slate-800 px-6 py-3 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wand2 className="w-5 h-5 text-orange-600 dark:text-orange-300" />
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
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 ml-7">
                Choose a category to explore creative character ideas
              </p>
            </div>

            {/* Content */}
            <div className="overflow-y-auto flex-1 sprite-scroll">
              {!selectedCategory ? (
                /* Category Selection */
                <div className="p-4 space-y-2">
                  {SUGGESTED_PROMPTS.map((category, idx) => (
                    <motion.button
                      key={category.category}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        delay: idx * 0.04,
                        duration: 0.3,
                        ease: [0.4, 0, 0.2, 1]
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedCategory(category.category)}
                      className="w-full text-left px-4 py-3 rounded-xl bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-800/50 hover:from-orange-50 hover:to-sky-50 dark:hover:from-orange-900/20 dark:hover:to-sky-900/20 border border-slate-200 dark:border-slate-700 transition-all group"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-300 transition-colors">
                            {category.category}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {category.prompts.length} creative prompts
                          </div>
                        </div>
                        <ChevronDown className="w-5 h-5 text-slate-400 rotate-[-90deg] group-hover:text-orange-500 transition-colors" />
                      </div>
                    </motion.button>
                  ))}
                </div>
              ) : (
                /* Prompt Selection */
                <div className="p-4 space-y-2">
                  {/* Back Button */}
                  <motion.button
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                    onClick={() => setSelectedCategory(null)}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-orange-600 dark:text-orange-300 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors mb-2"
                  >
                    <ChevronDown className="w-4 h-4 rotate-90" />
                    Back to categories
                  </motion.button>

                  {/* Category Title with Refresh Button */}
                  <div className="px-3 py-2 mb-2 flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h4 className="font-bold text-lg text-slate-900 dark:text-white">
                        {selectedCategory}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {aiGeneratedPrompts[selectedCategory] ? 'AI-generated prompts' : 'Click any prompt to use it'}
                      </p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05, rotate: 15 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleRefreshPrompts}
                      disabled={isGenerating}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all",
                        isGenerating
                          ? "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                          : "bg-orange-500 text-white hover:bg-orange-600 hover:shadow-lg hover:shadow-orange-500/30 active:scale-95"
                      )}
                      title="Generate new AI prompts"
                    >
                      <RefreshCw className={cn("w-3.5 h-3.5", isGenerating && "animate-spin")} />
                      <span>{isGenerating ? 'Generating...' : 'Refresh'}</span>
                    </motion.button>
                  </div>

                  {/* Prompts List */}
                  {getCurrentPrompts().map((prompt, idx) => (
                    <motion.button
                      key={idx}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        delay: idx * 0.04,
                        duration: 0.3,
                        ease: [0.4, 0, 0.2, 1]
                      }}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handlePromptSelect(prompt)}
                      className={cn(
                        "w-full text-left px-4 py-3 rounded-xl border transition-all group relative overflow-hidden",
                        currentPrompt === prompt
                          ? "bg-gradient-to-r from-orange-500/20 to-sky-500/20 border-orange-500/50 dark:border-orange-500/50"
                          : "bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-orange-300 dark:hover:border-orange-600"
                      )}
                    >
                      {/* Sparkle Effect on Hover */}
                      <div className="absolute inset-0 bg-gradient-to-r from-orange-500/0 via-sky-500/5 to-orange-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />

                      <div className="relative flex items-start gap-3">
                        <Sparkles className={cn(
                          "w-4 h-4 mt-0.5 flex-shrink-0",
                          currentPrompt === prompt
                            ? "text-orange-600 dark:text-orange-300"
                            : "text-slate-400 group-hover:text-orange-500 dark:group-hover:text-orange-400"
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
            <div className="border-t border-slate-200 dark:border-slate-800 px-6 py-3 bg-slate-50 dark:bg-slate-900/50 flex-shrink-0">
              <p className="text-xs text-slate-500 dark:text-slate-400 text-center leading-relaxed">
                💡 Pro tip: Mix and match ideas or add your own creative twist!
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

