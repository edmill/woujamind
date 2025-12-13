/**
 * PromptEnhancer Component
 * AI button to enhance and optimize user prompts for better results
 */
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Wand2, Loader2 } from 'lucide-react';
import { cn } from '../utils';

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
    
    // NOTE: This is CLIENT-SIDE enhancement only
    // It adds professional sprite art keywords using local JavaScript logic
    // To use AI (Gemini), you would call your geminiService here
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const enhanced = enhancePrompt(currentPrompt);
    onEnhance(enhanced);
    
    setIsEnhancing(false);
  };

  const enhancePrompt = (prompt: string): string => {
    // CLIENT-SIDE ENHANCEMENT LOGIC
    // This adds professional game sprite terminology to simple prompts
    // Does NOT call any AI model - purely string manipulation
    
    // Skip if already enhanced
    if (prompt.toLowerCase().includes('front-facing') || 
        prompt.toLowerCase().includes('sprite') ||
        prompt.length > 200) {
      return prompt;
    }

    // Professional sprite art keywords
    const enhancements = [
      'front-facing view',
      'clean sprite art style',
      'sharp details',
      'high contrast lighting',
      'game-ready asset'
    ];

    let enhanced = prompt.trim();
    
    // Ensure "character" or "creature" is specified
    if (!enhanced.toLowerCase().includes('character') && 
        !enhanced.toLowerCase().includes('creature')) {
      enhanced = `A ${enhanced} character`;
    }
    
    // Build enhanced prompt with professional keywords
    enhanced = `${enhanced}, ${enhancements[0]}, ${enhancements[1]}, ${enhancements[2]}, ${enhancements[3]}, ${enhancements[4]}`;
    
    return enhanced;
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
          : "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg hover:shadow-purple-500/30"
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

