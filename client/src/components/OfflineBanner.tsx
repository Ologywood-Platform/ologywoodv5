import { useState, useEffect } from "react";
import { WifiOff } from "lucide-react";

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const handleOffline = () => {
      setIsOffline(true);
      setShowReconnected(false);
    };

    const handleOnline = () => {
      setIsOffline(false);
      setShowReconnected(true);
      // Hide the "reconnected" message after 3 seconds
      setTimeout(() => setShowReconnected(false), 3000);
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  if (!isOffline && !showReconnected) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[9999] px-4 py-2 text-center text-sm font-medium transition-all duration-300 ${
        isOffline
          ? "bg-amber-500 text-white"
          : "bg-green-500 text-white"
      }`}
    >
      {isOffline ? (
        <span className="flex items-center justify-center gap-2">
          <WifiOff className="h-4 w-4" />
          You're offline. Some features may be limited.
        </span>
      ) : (
        <span>Back online!</span>
      )}
    </div>
  );
}
