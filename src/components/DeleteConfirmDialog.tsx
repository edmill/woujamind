/**
 * Delete Confirmation Dialog Component
 * Custom styled confirmation dialog matching app theme
 */
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  message?: string;
}

export function DeleteConfirmDialog({
  isOpen,
  onConfirm,
  onCancel,
  title = 'Delete Sprite Sheet?',
  message = 'This action cannot be undone. The sprite sheet will be permanently deleted from your local storage.'
}: DeleteConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            {/* Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border-2 border-slate-200 dark:border-slate-700 max-w-md w-full overflow-hidden"
            >
              {/* Header */}
              <div className="relative bg-gradient-to-r from-red-500 to-orange-500 p-6 pb-8">
                <button
                  onClick={onCancel}
                  className="absolute top-4 right-4 p-1 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>

                <div className="flex items-center gap-4">
                  {/* Animated Warning Icon */}
                  <motion.div
                    animate={{
                      rotate: [0, -10, 10, -10, 0],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{
                      duration: 0.5,
                      repeat: Infinity,
                      repeatDelay: 2
                    }}
                    className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm"
                  >
                    <AlertTriangle className="w-8 h-8 text-white" />
                  </motion.div>

                  <h2 className="text-2xl font-bold text-white">
                    {title}
                  </h2>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  {message}
                </p>
              </div>

              {/* Actions */}
              <div className="p-6 pt-0 flex gap-3">
                <button
                  onClick={onCancel}
                  className="flex-1 px-6 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 text-white font-semibold hover:from-red-600 hover:to-orange-600 transition-all shadow-lg hover:shadow-xl"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
