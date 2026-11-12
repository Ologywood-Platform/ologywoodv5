import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const homePath = resolve(process.cwd(), "client/src/pages/Home.tsx");
const home = readFileSync(homePath, "utf8");

describe("mobile homepage experience", () => {
  it("uses bundled category images instead of fragile storage URLs", () => {
    for (const asset of [
      "ologywood-category-musician.webp",
      "ologywood-category-athlete.webp",
      "ologywood-category-filmmaker.webp",
    ]) {
      expect(existsSync(resolve(process.cwd(), "client/public/images", asset))).toBe(true);
      expect(home).toContain(`/images/${asset}`);
    }
    expect(home).not.toContain("/manus-storage/ologywood-category-");
  });

  it("supports guarded top-of-page pull-to-refresh", () => {
    expect(home).toContain("onTouchStart={handlePullStart}");
    expect(home).toContain("onTouchMove={handlePullMove}");
    expect(home).toContain("onTouchEnd={() => void handlePullEnd()}");
    expect(home).toContain("window.scrollY > 0");
    expect(home).toContain("retryArtists()");
    expect(home).toContain("retryVenues()");
    expect(home).toContain("Release to refresh");
  });
});
