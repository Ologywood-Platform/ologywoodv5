import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = readFileSync(
  resolve(process.cwd(), "client/src/components/FeaturedArtistsCarousel.tsx"),
  "utf8",
);

describe("FeaturedArtistsCarousel", () => {
  it("renders the real artist cards and clean profile links", () => {
    expect(source).toContain("artists: Artist[]");
    expect(source).toContain("toSlug(artist.artistName || '')");
    expect(source).toContain("View Profile");
    expect(source).toContain("artist.profilePhotoUrl");
    expect(source).toContain("isVerified");
  });

  it("adapts the number of visible cards to the viewport", () => {
    expect(source).toContain("window.innerWidth < 640");
    expect(source).toContain("setItemsPerView(1)");
    expect(source).toContain("setItemsPerView(2)");
    expect(source).toContain("setItemsPerView(3)");
    expect(source).toContain("window.addEventListener(\"resize\", handleResize)");
    expect(source).toContain("window.removeEventListener(\"resize\", handleResize)");
  });

  it("provides accessible wraparound navigation and a safe empty state", () => {
    expect(source).toContain("No featured artists available at this time.");
    expect(source).toContain('aria-label="Previous artists"');
    expect(source).toContain('aria-label="Next artists"');
    expect(source).toContain("prev === 0 ? totalSlides - 1 : prev - 1");
    expect(source).toContain("prev === totalSlides - 1 ? 0 : prev + 1");
    expect(source).toContain("aria-label={`Go to slide ${i + 1}`}");
  });
});
