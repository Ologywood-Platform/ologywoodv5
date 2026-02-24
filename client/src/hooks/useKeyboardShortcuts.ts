import { useEffect } from 'react';
import { useLocation } from 'wouter';

interface Shortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
}

export function useKeyboardShortcuts() {
  const [, navigate] = useLocation();

  const shortcuts: Shortcut[] = [
    {
      key: 'k',
      ctrl: true,
      action: () => {
        // Command palette - can be implemented later
        
      },
      description: 'Open command palette'
    },
    {
      key: 'd',
      ctrl: true,
      action: () => navigate('/dashboard-v2'),
      description: 'Go to dashboard'
    },
    {
      key: 'm',
      ctrl: true,
      action: () => navigate('/messages'),
      description: 'Go to messages'
    },
    {
      key: 's',
      ctrl: true,
      action: () => navigate('/settings'),
      description: 'Go to settings'
    },
    {
      key: 'b',
      ctrl: true,
      action: () => navigate('/bookings'),
      description: 'Go to bookings'
    },
    {
      key: 'a',
      ctrl: true,
      action: () => navigate('/availability'),
      description: 'Go to availability (artists only)'
    },
    {
      key: '?',
      shift: true,
      action: () => {
        // Show shortcuts help
        
      },
      description: 'Show keyboard shortcuts'
    }
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = shortcut.ctrl ? e.ctrlKey || e.metaKey : !e.ctrlKey && !e.metaKey;
        const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
        const altMatch = shortcut.alt ? e.altKey : !e.altKey;

        if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
          e.preventDefault();
          shortcut.action();
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  return shortcuts;
}
