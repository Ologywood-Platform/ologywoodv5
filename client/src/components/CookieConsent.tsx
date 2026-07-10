/**
 * CookieConsent — A simple informational cookie consent banner.
 * Since Ologywood only uses one essential session cookie (app_session_id),
 * this is an informational banner, not a blocking consent gate.
 * Dismissal is stored in localStorage so it only shows once per browser.
 */

import { useState, useEffect } from "react";
import { X, Cookie } from "lucide-react";
import { Link } from "wouter";

const CONSENT_KEY = "ologywood_cookie_consent";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Show banner after a short delay if not already dismissed
    const dismissed = localStorage.getItem(CONSENT_KEY);
    if (!dismissed) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem(CONSENT_KEY, "accepted");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 p-4 sm:p-0 sm:bottom-4 sm:left-4 sm:right-auto sm:max-w-md"
      role="dialog"
      aria-label="Cookie notice"
    >
      <div className="bg-card border border-border rounded-lg shadow-lg p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <Cookie className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground mb-1">
              Cookie Notice
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              We use one essential cookie (<code className="text-xs bg-muted px-1 rounded">app_session_id</code>) to keep you logged in. 
              No tracking or advertising cookies are used.{" "}
              <Link
                href="/cookies"
                className="text-primary hover:underline font-medium"
              >
                Learn more
              </Link>
            </p>
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={dismiss}
                className="px-4 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Got it
              </button>
              <Link
                href="/cookies"
                className="px-4 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Cookie Policy
              </Link>
            </div>
          </div>
          <button
            onClick={dismiss}
            className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
            aria-label="Dismiss cookie notice"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
