import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function detectIsIOS(): boolean {
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function detectIsSafari(): boolean {
  const ua = navigator.userAgent;
  return /Safari/.test(ua) && !/Chrome|CriOS|FxiOS/.test(ua);
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isIOSSafari, setIsIOSSafari] = useState(false);

  useEffect(() => {
    // Detect iOS and Safari
    const iosDetected = detectIsIOS();
    const safariDetected = detectIsSafari();
    setIsIOS(iosDetected);
    setIsIOSSafari(iosDetected && safariDetected);

    // Check if already installed (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check if running as iOS PWA
    if ((navigator as any).standalone === true) {
      setIsInstalled(true);
      return;
    }

    // On iOS Safari, we can't use beforeinstallprompt but we can show manual instructions
    if (iosDetected && safariDetected) {
      setIsInstallable(true);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) return false;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    setDeferredPrompt(null);
    setIsInstallable(false);

    return outcome === 'accepted';
  };

  const dismissInstall = () => {
    setIsInstallable(false);
    // Store dismissal in localStorage so we don't show again for a while
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  const wasDismissedRecently = () => {
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (!dismissed) return false;
    // Show again after 7 days
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    return Date.now() - parseInt(dismissed) < sevenDays;
  };

  return {
    isInstallable: isInstallable && !wasDismissedRecently(),
    isInstalled,
    isIOS,
    isIOSSafari,
    promptInstall,
    dismissInstall,
  };
}
