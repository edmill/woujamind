/**
 * Logger Utility
 * Centralized logging with environment-based filtering
 */

const isDevelopment = import.meta.env.DEV;
const isDebugMode = typeof window !== 'undefined' && localStorage.getItem('woujamind_debug') === 'true';

export const logger = {
  log: (...args: unknown[]) => {
    if (isDevelopment || isDebugMode) {
      console.log('[Woujamind]', ...args);
    }
  },
  
  error: (...args: unknown[]) => {
    // Always log errors
    console.error('[Woujamind]', ...args);
  },
  
  warn: (...args: unknown[]) => {
    // Always log warnings
    console.warn('[Woujamind]', ...args);
  },
  
  debug: (...args: unknown[]) => {
    // Only in debug mode
    if (isDebugMode) {
      console.debug('[Woujamind]', ...args);
    }
  },
  
  group: (label: string) => {
    if (isDevelopment || isDebugMode) {
      console.group(`[Woujamind] ${label}`);
    }
  },
  
  groupEnd: () => {
    if (isDevelopment || isDebugMode) {
      console.groupEnd();
    }
  },
  
  time: (label: string) => {
    if (isDevelopment || isDebugMode) {
      console.time(`[Woujamind] ${label}`);
    }
  },
  
  timeEnd: (label: string) => {
    if (isDevelopment || isDebugMode) {
      console.timeEnd(`[Woujamind] ${label}`);
    }
  }
};

