import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHelperNotes } from '@/contexts/HelperNotesContext';

interface HelperNoteProps {
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'xs';
}

export function HelperNote({ children, className, size = 'xs' }: HelperNoteProps) {
  const { showHelperNotes } = useHelperNotes();

  if (!showHelperNotes) return null;

  return (
    <p
      className={cn(
        'flex items-start gap-1.5 text-muted-foreground animate-in fade-in duration-500',
        size === 'xs' ? 'text-[11px]' : 'text-xs',
        className
      )}
    >
      <Info className={cn('shrink-0 mt-[1px] opacity-60', size === 'xs' ? 'h-3 w-3' : 'h-3.5 w-3.5')} />
      <span>{children}</span>
    </p>
  );
}
