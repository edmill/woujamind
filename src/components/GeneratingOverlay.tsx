/**
 * Generating Overlay Component
 * Shows a blurred placeholder with animated sphere during generation
 */
import React from 'react';
import { motion } from 'framer-motion';
import { WorkingSphere } from './WorkingSphere';

interface GeneratingOverlayProps {
  statusText: string;
  onSwooshComplete?: () => void;
  isSwooshing?: boolean;
}

export function GeneratingOverlay({
  statusText,
  onSwooshComplete,
  isSwooshing = false
}: GeneratingOverlayProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex items-center justify-center"
    >
      {/* Blurred placeholder background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-30 dark:opacity-20 bg-[linear-gradient(to_right,#0ea5e9_1px,transparent_1px),linear-gradient(to_bottom,#0ea5e9_1px,transparent_1px)] bg-[length:40px_40px]" />

        {/* Radial gradients */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(251,146,60,0.15),transparent_50%),radial-gradient(circle_at_70%_80%,rgba(14,165,233,0.15),transparent_50%)]" />

        {/* Blur overlay */}
        <div className="absolute inset-0 backdrop-blur-sm bg-white/30 dark:bg-black/30" />
      </div>

      {/* Centered animated sphere */}
      <div className="relative z-10 flex flex-col items-center gap-20">
        <WorkingSphere
          size="large"
          isSwooshing={isSwooshing}
          onSwooshComplete={onSwooshComplete}
        />

        {/* Status text - simple and clean */}
        {!isSwooshing && statusText && (
          <motion.div
            key={statusText}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="font-normal text-sm text-slate-700 dark:text-slate-300 px-6 py-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-full shadow-lg border border-slate-200 dark:border-slate-700"
          >
            {statusText}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
