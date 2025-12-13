/**
 * PricingModal Component
 * Modal for purchasing tokens/credits.
 */
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Zap, Sparkles, Crown } from 'lucide-react';
import { cn } from '../utils';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPurchase: (amount: number) => void;
  currentTokens: number;
}

const PLANS = [
  {
    id: 'starter',
    name: 'Apprentice',
    tokens: 10,
    price: '$5',
    popular: false,
    color: 'from-blue-400 to-sky-500',
    icon: <Sparkles className="w-5 h-5 text-white" />
  },
  {
    id: 'pro',
    name: 'Sorcerer',
    tokens: 50,
    price: '$20',
    popular: true,
    color: 'from-orange-400 to-pink-500',
    icon: <Zap className="w-5 h-5 text-white" />
  },
  {
    id: 'max',
    name: 'Archmage',
    tokens: 200,
    price: '$50',
    popular: false,
    color: 'from-purple-500 to-indigo-600',
    icon: <Crown className="w-5 h-5 text-white" />
  }
];

export function PricingModal({ isOpen, onClose, onPurchase, currentTokens }: PricingModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
          >
            {/* Header */}
            <div className="relative bg-slate-50 dark:bg-slate-950 p-8 text-center overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 via-sky-500 to-orange-500" />
               <button 
                 onClick={onClose}
                 className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
               >
                 <X className="w-5 h-5" />
               </button>

               <motion.div
                 initial={{ y: 20, opacity: 0 }}
                 animate={{ y: 0, opacity: 1 }}
                 transition={{ delay: 0.1 }}
               >
                 <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Replenish Your Magic</h2>
                 <p className="text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
                   Unlock high-fidelity sprite sheets, GIFs, and commercial usage rights. 
                   <br/>You currently have <span className={cn("font-bold", currentTokens > 0 ? "text-orange-500" : "text-red-500")}>{currentTokens} tokens</span>.
                 </p>
               </motion.div>
            </div>

            {/* Plans Grid */}
            <div className="p-8 grid md:grid-cols-3 gap-6">
              {PLANS.map((plan, idx) => (
                <motion.div
                  key={plan.id}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 + (idx * 0.1) }}
                  className={cn(
                    "relative p-6 rounded-2xl border flex flex-col transition-all cursor-pointer group",
                    plan.popular 
                      ? "border-orange-500 dark:border-orange-500/50 bg-orange-50 dark:bg-orange-950/20 shadow-xl scale-105 z-10" 
                      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-orange-300 dark:hover:border-slate-600 hover:shadow-lg"
                  )}
                  onClick={() => onPurchase(plan.tokens)}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                      MOST POPULAR
                    </div>
                  )}

                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-gradient-to-br shadow-lg",
                    plan.color
                  )}>
                    {plan.icon}
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-3xl font-bold text-slate-900 dark:text-white">{plan.price}</span>
                    <span className="text-sm text-slate-500 dark:text-slate-400">/ once</span>
                  </div>

                  <div className="flex-1 space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <div className="p-0.5 rounded-full bg-green-100 text-green-600"><Check className="w-3 h-3" /></div>
                      <span className="font-bold">{plan.tokens} Tokens</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <div className="p-0.5 rounded-full bg-green-100 text-green-600"><Check className="w-3 h-3" /></div>
                      <span>Commercial License</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <div className="p-0.5 rounded-full bg-green-100 text-green-600"><Check className="w-3 h-3" /></div>
                      <span>High-Speed Generation</span>
                    </div>
                  </div>

                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onPurchase(plan.tokens);
                    }}
                    className={cn(
                      "w-full py-3 rounded-xl font-bold transition-all",
                      plan.popular
                        ? "bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-lg hover:shadow-orange-500/25"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700"
                    )}
                  >
                    Choose {plan.name}
                  </button>
                </motion.div>
              ))}
            </div>

            <div className="p-6 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-200 dark:border-slate-800 text-center text-sm text-slate-500 dark:text-slate-400">
              Secure payment processed by Stripe. All plans include 24/7 support.
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
