import React from 'react';
import { Toaster } from 'sonner';
import SpriteMagic from './Component';

// Configure Tailwind for the environment
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.tailwind = window.tailwind || {};
  // @ts-ignore
  window.tailwind.config = {
    // @ts-ignore
    ...window.tailwind.config,
    darkMode: 'class', // Enable class-based dark mode
    theme: {
      extend: {
        colors: {
          border: 'hsl(var(--border))',
          input: 'hsl(var(--input))',
          ring: 'hsl(var(--ring))',
          background: 'hsl(var(--background))',
          foreground: 'hsl(var(--foreground))',
          primary: {
            DEFAULT: 'hsl(var(--primary))',
            foreground: 'hsl(var(--primary-foreground))',
          },
          secondary: {
            DEFAULT: 'hsl(var(--secondary))',
            foreground: 'hsl(var(--secondary-foreground))',
          },
          destructive: {
            DEFAULT: 'hsl(var(--destructive))',
            foreground: 'hsl(var(--destructive-foreground))',
          },
          muted: {
            DEFAULT: 'hsl(var(--muted))',
            foreground: 'hsl(var(--muted-foreground))',
          },
          accent: {
            DEFAULT: 'hsl(var(--accent))',
            foreground: 'hsl(var(--accent-foreground))',
          },
          popover: {
            DEFAULT: 'hsl(var(--popover))',
            foreground: 'hsl(var(--popover-foreground))',
          },
          card: {
            DEFAULT: 'hsl(var(--card))',
            foreground: 'hsl(var(--card-foreground))',
          },
        },
        borderRadius: {
          lg: 'var(--radius)',
          md: 'calc(var(--radius) - 2px)',
          sm: 'calc(var(--radius) - 4px)',
        },
      }
    }
  };
}

export default function App() {
  return (
    <div className="w-full h-full overflow-x-hidden max-w-full">
      <SpriteMagic />
      <Toaster 
        position="top-right" 
        richColors 
        closeButton
        theme="dark"
        toastOptions={{
          className: 'font-sans bg-slate-900 border border-slate-700 text-slate-200',
        }}
      />
    </div>
  );
}