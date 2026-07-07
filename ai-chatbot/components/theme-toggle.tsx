'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from './theme-provider';
import { Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';

type ThemeToggleProps = {
  variant?: 'fixed' | 'inline';
  className?: string;
};

export function ThemeToggle({ variant = 'fixed', className }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch by waiting for client-side mount
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Return a visually stable skeleton button during hydration
    return (
      <div 
        className={cn(
          "w-9 h-9 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 opacity-50",
          variant === 'fixed' ? 'fixed top-4 right-4 z-50' : 'inline-block',
          className
        )}
      />
    );
  }

  const baseClasses = variant === 'fixed'
    ? "fixed top-4 right-4 p-2 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors z-50 focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-600 focus:ring-offset-2 dark:focus:ring-offset-neutral-900"
    : "p-1.5 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-600 flex-shrink-0 flex items-center justify-center";

  return (
    <button
      onClick={toggleTheme}
      className={cn(baseClasses, className)}
      aria-label="Toggle Theme"
    >
      {theme === 'dark' ? (
        <Sun className="h-5 w-5 text-amber-400" />
      ) : (
        <Moon className="h-5 w-5 text-indigo-600" />
      )}
    </button>
  );
}
