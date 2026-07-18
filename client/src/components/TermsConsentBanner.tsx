import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { X, FileText } from 'lucide-react';
import { useAuth } from '@/_core/hooks/useAuth';

const TERMS_VERSION = '2026-07-18';
const STORAGE_KEY = 'ologywood_terms_accepted_version';

export function TermsConsentBanner() {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only show to logged-in users who haven't accepted the latest version
    if (!user) {
      setVisible(false);
      return;
    }
    const acceptedVersion = localStorage.getItem(STORAGE_KEY);
    if (acceptedVersion !== TERMS_VERSION) {
      setVisible(true);
    }
  }, [user]);

  const handleAccept = () => {
    localStorage.setItem(STORAGE_KEY, TERMS_VERSION);
    setVisible(false);
  };

  const handleDismiss = () => {
    // Dismiss for this session but will show again next time
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] bg-white dark:bg-gray-900 border-t border-border shadow-lg px-4 py-3 sm:py-4 safe-area-bottom">
      <div className="container mx-auto max-w-4xl flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
        <div className="flex items-start gap-3 flex-1">
          <FileText className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">
              We've updated our Terms of Service
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Our Terms now include AI Policy, Creator Bill of Rights, and Community Guidelines.{' '}
              <Link href="/terms-of-service" className="text-primary hover:underline">
                Review changes
              </Link>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button onClick={handleAccept} size="sm" className="flex-1 sm:flex-none">
            I Accept
          </Button>
          <Button onClick={handleDismiss} variant="ghost" size="sm" className="px-2">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
