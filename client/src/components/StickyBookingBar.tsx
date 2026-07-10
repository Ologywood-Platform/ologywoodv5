import { Button } from "@/components/ui/button";
import { DollarSign } from "lucide-react";
import { useState, useEffect, useRef } from "react";

interface StickyBookingBarProps {
  artistName: string;
  feeRangeMin?: number | null;
  feeRangeMax?: number | null;
  onBookClick: () => void;
  /** Ref to the hero section element — bar appears after scrolling past it */
  heroRef: React.RefObject<HTMLElement | null>;
}

export function StickyBookingBar({
  artistName,
  feeRangeMin,
  feeRangeMax,
  onBookClick,
  heroRef,
}: StickyBookingBarProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (!heroRef.current) return;
      const heroBottom = heroRef.current.getBoundingClientRect().bottom;
      // Show bar when hero is scrolled out of view
      setIsVisible(heroBottom < 0);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Check initial state
    return () => window.removeEventListener("scroll", handleScroll);
  }, [heroRef]);

  const feeText =
    feeRangeMin && feeRangeMax
      ? `$${feeRangeMin} - $${feeRangeMax}`
      : feeRangeMin
        ? `From $${feeRangeMin}`
        : null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-[55] sm:hidden transition-transform duration-300 ease-in-out ${
        isVisible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="bg-background/95 backdrop-blur-md border-t shadow-[0_-4px_12px_rgba(0,0,0,0.1)] px-4 py-3 safe-area-bottom">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold truncate">{artistName}</p>
            {feeText && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <DollarSign className="h-3 w-3 shrink-0" />
                {feeText}
              </p>
            )}
          </div>
          <Button size="default" onClick={onBookClick} className="shrink-0">
            Request Booking
          </Button>
        </div>
      </div>
    </div>
  );
}
