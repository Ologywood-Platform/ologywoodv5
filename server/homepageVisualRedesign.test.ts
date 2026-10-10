import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

const homePath = path.resolve(__dirname, "../client/src/pages/Home.tsx");
const cssPath = path.resolve(__dirname, "../client/src/pages/Home.css");
const homeSource = fs.readFileSync(homePath, "utf8");

function has(text: string): boolean {
  return homeSource.includes(text);
}

describe("Homepage visual redesign source contracts", () => {
  it("uses the new opportunity-led hero headline", () => {
    expect(homeSource).toContain(
      "Your Talent. Your Platform. Your Next Opportunity."
    );
  });

  it("keeps the redesign styles local to Home and scopes them to home-redesign", () => {
    expect(homeSource).toMatch(/import\s+["']\.\/Home\.css["']/);
    expect(fs.existsSync(cssPath)).toBe(true);
    const homeCss = fs.readFileSync(cssPath, "utf8");
    expect(homeCss).toMatch(/\.home-redesign\b/);
    expect(homeCss).not.toMatch(/(?:^|})\s*(?:body|html|:root|\.dark)\s*\{/);
  });

  it("preserves the real artist and featured-venue data contracts", () => {
    expect(homeSource).toMatch(/trpc\.artist\.search\.useQuery\(\{\s*\}\)/);
    expect(homeSource).toMatch(/trpc\.venue\.getFeatured\.useQuery\(\s*\)/);
  });

  it("continues rendering the featured and follow discovery components", () => {
    expect(has("FeaturedArtistsCarousel")).toBe(true);
    expect(has("FeaturedVenuesCarousel")).toBe(true);
    expect(has("SuggestedFollows")).toBe(true);
    expect(homeSource).toMatch(/<FeaturedArtistsCarousel\b/);
    expect(homeSource).toMatch(/<FeaturedVenuesCarousel\b/);
    expect(homeSource).toMatch(/<SuggestedFollows\b/);
  });

  it("preserves the shared header, homepage SEO metadata, and structured data", () => {
    expect(homeSource).toMatch(/<SiteHeader\b[^>]*\blargeLogo\b/);
    expect(homeSource).toContain("setMetaTags(pageMetaTags.home)");
    expect(homeSource).toMatch(/<JsonLd\b/);
  });

  it("retains OAuth redirect handling and the signup modal entry point", () => {
    expect(homeSource).toContain("new URLSearchParams(window.location.search)");
    expect(homeSource).toContain("params.get('redirect')");
    expect(homeSource).toMatch(/redirect[\s\S]{0,220}!isAuthenticated/);
    expect(homeSource).toContain("setAuthModalTab('login')");
    expect(homeSource).toMatch(/<QuickSignupModal\b/);
  });

  it("keeps the established product-feature vocabulary visible on the homepage", () => {
    for (const label of [
      "Riders & Contracts",
      "Events & Availability",
      "Follow & Stay Connected",
      "Secure Payments",
      "Direct Messaging",
      "You Keep 90%",
      "NIL Readiness Tools",
    ]) {
      expect(
        homeSource,
        `missing preserved homepage label: ${label}`
      ).toContain(label);
    }
  });

  it("does not move global infrastructure or schema concerns into the page redesign", () => {
    expect(homeSource).not.toMatch(/ThemeProvider|schema/i);
    expect(homeSource).not.toMatch(
      /(?:drizzle|mysql|CREATE\s+TABLE|ALTER\s+TABLE)/i
    );
    expect(homeSource).toMatch(/trpc\.artist\.search\.useQuery\(\{\s*\}\)/);
  });

  it("treats concept imagery as decoration rather than fabricated profile content", () => {
    expect(homeSource).not.toMatch(
      /(?:mock|fake|sample|demo)\s*(?:artist|venue|profile|card)/i
    );
    expect(homeSource).not.toMatch(
      /(?:fabricated|placeholder)\s*(?:artist|venue|profile|card)/i
    );
    expect(homeSource).not.toMatch(
      /const\s+(?:profiles|profileCards|artistCards|venueCards)\s*=\s*\[/i
    );
  });
});
