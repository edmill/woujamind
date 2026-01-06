/**
 * Version Display Component
 * Shows app version at the bottom of the home page
 */
import React from 'react';
import { getVersionString } from '../utils/version';
import { cn } from '../utils';

interface VersionDisplayProps {
  className?: string;
}

export function VersionDisplay({ className }: VersionDisplayProps) {
  const versionString = getVersionString();

  return (
    <div className={cn(
      "flex items-center justify-center py-2 px-4",
      "text-xs text-slate-400 dark:text-slate-500",
      "font-mono tracking-wide",
      className
    )}>
      <span>{versionString}</span>
    </div>
  );
}

