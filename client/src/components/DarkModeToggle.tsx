import { useTheme } from '@/contexts/ThemeContext';
import { Moon, Sun } from 'lucide-react';

interface DarkModeToggleProps {
  /** Compact icon-only variant (for mobile menus) */
  compact?: boolean;
  className?: string;
}

export function DarkModeToggle({ compact = false, className = '' }: DarkModeToggleProps) {
  const { theme, toggleTheme, switchable } = useTheme();

  if (!switchable || !toggleTheme) return null;

  const isDark = theme === 'dark';

  if (compact) {
    return (
      <button
        onClick={toggleTheme}
        className={`p-2 rounded-lg transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-800 ${className}`}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        title={isDark ? 'Light mode' : 'Dark mode'}
      >
        {isDark ? (
          <Sun className="h-5 w-5 text-yellow-400" />
        ) : (
          <Moon className="h-5 w-5 text-gray-600" />
        )}
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 ${className}`}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? (
        <>
          <Sun className="h-4 w-4 text-yellow-400" />
          <span>Light Mode</span>
        </>
      ) : (
        <>
          <Moon className="h-4 w-4 text-gray-600" />
          <span>Dark Mode</span>
        </>
      )}
    </button>
  );
}
