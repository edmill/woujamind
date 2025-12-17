/**
 * PromptEnhancer Component
 * AI-powered button to enhance and optimize user prompts for better results
 */
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Wand2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../utils';
import { enhancePrompt } from '../services/geminiService';

interface PromptEnhancerProps {
  currentPrompt: string;
  onEnhance: (enhancedPrompt: string) => void;
  disabled?: boolean;
}

export function PromptEnhancer({ currentPrompt, onEnhance, disabled }: PromptEnhancerProps) {
  const [isEnhancing, setIsEnhancing] = useState(false);

  const handleEnhance = async () => {
    if (!currentPrompt.trim() || disabled) return;

    setIsEnhancing(true);

    try {
      // Use AI-powered enhancement via Gemini 2.5 Flash
      const enhanced = await enhancePrompt(currentPrompt);
      onEnhance(enhanced);
      toast.success("Prompt enhanced with AI!");
    } catch (error) {
      console.error('Enhancement failed:', error);
      toast.error("Enhancement failed. Please try again.");
    } finally {
      setIsEnhancing(false);
    }
  };

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      onClick={handleEnhance}
      disabled={disabled || !currentPrompt.trim() || isEnhancing}
      className={cn(
        "flex items-center justify-center w-8 h-8 rounded-lg transition-all",
        disabled || !currentPrompt.trim() || isEnhancing
          ? "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed"
          : "bg-orange-500 text-white hover:bg-orange-600 hover:shadow-lg hover:shadow-orange-500/30 active:scale-95"
      )}
      title="Enhance prompt with professional sprite art keywords"
    >
      {isEnhancing ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Wand2 className="w-4 h-4" />
      )}
    </motion.button>
  );
}

