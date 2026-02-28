import { useState, useEffect, useRef, useCallback } from "react";

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  /** Minimum pull distance in px to trigger refresh (default: 80) */
  threshold?: number;
  /** Max pull distance in px (default: 120) */
  maxPull?: number;
  /** Only enable on mobile (default: true) */
  mobileOnly?: boolean;
}

interface UsePullToRefreshReturn {
  /** Ref to attach to the scrollable container */
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** Whether a refresh is currently in progress */
  isRefreshing: boolean;
  /** Current pull distance (0 when not pulling) */
  pullDistance: number;
  /** The pull-to-refresh indicator JSX to render at the top */
  PullIndicator: React.FC;
}

export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  maxPull = 120,
  mobileOnly = true,
}: UsePullToRefreshOptions): UsePullToRefreshReturn {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const isPulling = useRef(false);

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (isRefreshing) return;
      if (mobileOnly && window.innerWidth >= 640) return;

      // Only start pull if at top of page
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      if (scrollTop > 5) return;

      startY.current = e.touches[0].clientY;
      isPulling.current = true;
    },
    [isRefreshing, mobileOnly]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isPulling.current || isRefreshing) return;

      const currentY = e.touches[0].clientY;
      const diff = currentY - startY.current;

      if (diff > 0) {
        // Apply resistance curve for natural feel
        const distance = Math.min(diff * 0.5, maxPull);
        setPullDistance(distance);

        // Prevent default scroll when pulling down
        if (distance > 10) {
          e.preventDefault();
        }
      } else {
        isPulling.current = false;
        setPullDistance(0);
      }
    },
    [isRefreshing, maxPull]
  );

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling.current) return;
    isPulling.current = false;

    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(threshold * 0.6); // Snap to loading position
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, threshold, isRefreshing, onRefresh]);

  useEffect(() => {
    const el = document;
    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchmove", handleTouchMove, { passive: false });
    el.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchmove", handleTouchMove);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  const PullIndicator: React.FC = () => {
    if (pullDistance === 0 && !isRefreshing) return null;

    const progress = Math.min(pullDistance / threshold, 1);
    const rotation = isRefreshing ? 0 : progress * 360;

    return (
      <div
        className="flex items-center justify-center overflow-hidden transition-[height] duration-200 ease-out sm:hidden"
        style={{ height: `${pullDistance}px` }}
      >
        <div
          className={`flex items-center gap-2 ${isRefreshing ? "animate-pulse" : ""}`}
        >
          <svg
            className={`h-5 w-5 text-primary ${isRefreshing ? "animate-spin" : ""}`}
            style={!isRefreshing ? { transform: `rotate(${rotation}deg)` } : undefined}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          <span className="text-xs text-muted-foreground font-medium">
            {isRefreshing
              ? "Refreshing..."
              : progress >= 1
                ? "Release to refresh"
                : "Pull to refresh"}
          </span>
        </div>
      </div>
    );
  };

  return { containerRef, isRefreshing, pullDistance, PullIndicator };
}
