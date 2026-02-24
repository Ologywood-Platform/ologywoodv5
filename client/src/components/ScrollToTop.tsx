import { useEffect } from "react";
import { useLocation } from "wouter";

/**
 * ScrollToTop component - scrolls the window to the top whenever
 * the route (pathname) changes. This fixes the issue where clicking
 * footer links or navigation links leaves the user mid-page instead
 * of showing the beginning of the new page.
 */
export function ScrollToTop() {
  const [location] = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [location]);

  return null;
}
