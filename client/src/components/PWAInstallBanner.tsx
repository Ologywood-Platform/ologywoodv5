import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWAInstall } from '@/hooks/usePWAInstall';

export function PWAInstallBanner() {
  const { isInstallable, promptInstall, dismissInstall } = usePWAInstall();

  if (!isInstallable) return null;

  return (
    <div className="fixed bottom-16 sm:bottom-4 left-3 right-3 sm:left-auto sm:right-4 sm:max-w-sm z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-background border shadow-lg rounded-xl p-4">
        <div className="flex items-start gap-3">
          {/* App Icon */}
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Download className="h-6 w-6 text-primary" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm">Install Ologywood</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Add to your home screen for quick access and a native app experience.
            </p>

            <div className="flex items-center gap-2 mt-3">
              <Button
                size="sm"
                onClick={promptInstall}
                className="h-8 text-xs px-4"
              >
                Install App
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={dismissInstall}
                className="h-8 text-xs px-3 text-muted-foreground"
              >
                Not now
              </Button>
            </div>
          </div>

          {/* Close */}
          <button
            onClick={dismissInstall}
            className="p-1 rounded-md hover:bg-muted transition-colors"
            aria-label="Dismiss install prompt"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
}
