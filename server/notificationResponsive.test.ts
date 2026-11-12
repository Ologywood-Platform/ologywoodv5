import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = readFileSync(resolve(process.cwd(), "client/src/components/RealtimeNotifications.tsx"), "utf8");

describe("mobile notification panel layout", () => {
  it("uses an inset fixed mobile panel with safe-area spacing", () => {
    expect(source).toContain("fixed left-2 right-2");
    expect(source).toContain("top-[calc(env(safe-area-inset-top,0px)+4.5rem)]");
    expect(source).toContain("sm:absolute sm:left-auto sm:right-0");
    expect(source).toContain("max-h-[calc(100dvh-6.5rem)]");
  });

  it("keeps the notification dialog accessible and explains mobile interaction", () => {
    expect(source).toContain('role="dialog"');
    expect(source).toContain('aria-label="Notifications"');
    expect(source).toContain("onTouchStart={handleSwipeStart}");
    expect(source).toContain("onTouchMove={handleSwipeMove}");
    expect(source).toContain("onTouchEnd={handleSwipeEnd}");
    expect(source).toContain("touchAction: 'pan-y'");
    expect(source).toContain("swipe sideways to close or scroll for more");
  });
});
