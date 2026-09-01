import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { X, FileText, Clock } from 'lucide-react';
import { useAuth } from '@/_core/hooks/useAuth';

const TERMS_VERSION = '2026-09-01';
const STORAGE_KEY = 'ologywood_terms_accepted_version';
const REMIND_LATER_KEY = 'ologywood_terms_remind_later';
const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

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
    if (acceptedVersion === TERMS_VERSION) {
      setVisible(false);
      return;
    }

    // Check if user chose "Remind me later" within the last 24 hours
    const remindLater = localStorage.getItem(REMIND_LATER_KEY);
    if (remindLater) {
      const dismissedAt = parseInt(remindLater, 10);
      if (Date.now() - dismissedAt < TWENTY_FOUR_HOURS) {
        setVisible(false);
        return;
      }
      // 24 hours have passed, remove the key and show the banner
      localStorage.removeItem(REMIND_LATER_KEY);
    }

    setVisible(true);
  }, [user]);

  const handleAccept = () => {
    localStorage.setItem(STORAGE_KEY, TERMS_VERSION);
    localStorage.removeItem(REMIND_LATER_KEY);
    setVisible(false);
  };

  const handleRemindLater = () => {
    localStorage.setItem(REMIND_LATER_KEY, Date.now().toString());
    setVisible(false);
  };

  const handleDismiss = () => {
    // Same as remind later — dismiss for 24 hours
    handleRemindLater();
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
              Our Terms now include Sandbox Posts, permanent replacement behavior, profile sharing, Creator Shop, Books and eBooks, AI Policy, Creator Bill of Rights, and Community Guidelines.{' '}
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
          <Button onClick={handleRemindLater} variant="outline" size="sm" className="flex-1 sm:flex-none gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            Remind Me Later
          </Button>
          <Button onClick={handleDismiss} variant="ghost" size="sm" className="px-2">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
