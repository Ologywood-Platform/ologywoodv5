import { HelpCircle } from 'lucide-react';
import { useHelperNotes } from '@/contexts/HelperNotesContext';
import { cn } from '@/lib/utils';

interface HelperNotesToggleProps {
  className?: string;
}

export function HelperNotesToggle({ className }: HelperNotesToggleProps) {
  const { showHelperNotes, toggleHelperNotes } = useHelperNotes();

  return (
    <button
      onClick={toggleHelperNotes}
      className={cn(
        'flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border transition-colors',
        showHelperNotes
          ? 'border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-900/20 dark:text-purple-300'
          : 'border-gray-200 bg-gray-50 text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400',
        className
      )}
      title={showHelperNotes ? 'Hide helper tips' : 'Show helper tips'}
    >
      <HelpCircle className="h-3.5 w-3.5" />
      <span>Tips {showHelperNotes ? 'on' : 'off'}</span>
    </button>
  );
}
