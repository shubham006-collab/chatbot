'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from './theme-provider';
import { Sun, Moon, Sunset } from 'lucide-react';
import { cn } from '@/lib/utils';

type ThemeToggleProps = {
  variant?: 'fixed' | 'inline';
  className?: string;
};

export function ThemeToggle({ variant = 'fixed', className }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch by waiting for client-side mount
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Visually stable skeleton
    return (
      <div 
        className={cn(
          "h-10 w-[130px] rounded-full border border-white/20 dark:border-neutral-800 bg-white/20 dark:bg-neutral-900/20 backdrop-blur-md opacity-50",
          variant === 'fixed' ? 'fixed top-4 right-4 z-50' : 'inline-block',
          className
        )}
      />
    );
  }

  const options = [
    { value: 'light', icon: Sun, label: 'Light' },
    { value: 'dark', icon: Moon, label: 'Dark' },
    { value: 'system', icon: Sunset, label: 'System' }
  ] as const;

  return (
    <div 
      className={cn(
        "relative flex items-center p-1 rounded-full border border-neutral-200/50 dark:border-neutral-800 bg-white/45 dark:bg-neutral-950/40 backdrop-blur-xl transition-all duration-300 select-none shadow-sm z-50",
        variant === 'fixed' ? 'fixed top-4 right-4' : 'inline-flex',
        className
      )}
      style={{ height: '38px', width: '124px' }}
    >
      {/* Sliding Glass Background Indicator */}
      <div 
        className="absolute top-1 bottom-1 rounded-full bg-white/80 dark:bg-neutral-800/80 border border-white/40 dark:border-neutral-700/30 shadow-md backdrop-blur-md transition-all duration-300 ease-out z-0"
        style={{
          width: '36px',
          left: theme === 'light' ? '4px' : theme === 'dark' ? '43px' : '82px',
        }}
      />

      {options.map((opt) => {
        const Icon = opt.icon;
        const isActive = theme === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => setTheme(opt.value)}
            className={cn(
              "relative z-10 flex items-center justify-center h-7 w-9 rounded-full transition-colors duration-250 focus:outline-none",
              isActive 
                ? "text-neutral-900 dark:text-neutral-50" 
                : "text-neutral-450 hover:text-neutral-850 dark:text-neutral-500 dark:hover:text-neutral-200"
            )}
            aria-label={`Switch to ${opt.label} Theme`}
          >
            <Icon className="h-4 w-4" />
          </button>
        );
      })}
    </div>
  );
}
