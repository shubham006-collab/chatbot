'use client';

import React from 'react';
import { useTheme } from './theme-provider';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="fixed top-4 right-4 p-2 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors z-50 focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-600 focus:ring-offset-2 dark:focus:ring-offset-neutral-900"
      aria-label="Toggle Theme"
    >
      {theme === 'dark' ? (
        <Sun className="h-5 w-5 text-neutral-200" />
      ) : (
        <Moon className="h-5 w-5 text-neutral-800" />
      )}
    </button>
  );
}
