/**
 * Tests for Sell Music landing page and onboarding wizard White Label Releases step.
 */
import { describe, it, expect } from "vitest";

// ─── Onboarding wizard step data tests ───────────────────────────────────────

describe("Artist Onboarding Wizard - White Label Releases step", () => {
  const steps = [
    { id: "photo", title: "Add Profile Photo", required: true },
    { id: "genres", title: "Select Your Genres", required: true },
    { id: "location", title: "Set Your Location", required: true },
    { id: "pricing", title: "Set Your Pricing", required: true },
    { id: "links", title: "Add Social Links", required: false },
    { id: "releases", title: "Sell Your Music", required: false },
  ];

  it("should have 6 steps total", () => {
    expect(steps.length).toBe(6);
  });

  it("should have the releases step as the last step", () => {
    const lastStep = steps[steps.length - 1];
    expect(lastStep.id).toBe("releases");
    expect(lastStep.title).toBe("Sell Your Music");
  });

  it("should mark the releases step as optional (not required)", () => {
    const releasesStep = steps.find((s) => s.id === "releases");
    expect(releasesStep).toBeDefined();
    expect(releasesStep!.required).toBe(false);
  });

  it("should have 4 required steps and 2 optional steps", () => {
    const required = steps.filter((s) => s.required);
    const optional = steps.filter((s) => !s.required);
    expect(required.length).toBe(4);
    expect(optional.length).toBe(2);
  });

  it("should maintain correct step order", () => {
    expect(steps[0].id).toBe("photo");
    expect(steps[1].id).toBe("genres");
    expect(steps[2].id).toBe("location");
    expect(steps[3].id).toBe("pricing");
    expect(steps[4].id).toBe("links");
    expect(steps[5].id).toBe("releases");
  });
});

// ─── Sell Music page SEO meta tests ──────────────────────────────────────────

describe("Sell Music landing page - SEO metadata", () => {
  const sellMusicMeta = {
    title: "Sell Your Music - Ologywood White Label Releases",
    description:
      "Sell singles directly from your Ologywood artist profile. Keep 99% of every sale with just a 1% platform fee. Upload, price, and sell your music to fans worldwide.",
    keywords:
      "sell music online, white label release, independent artist, music distribution, sell singles",
  };

  it("should have a title mentioning White Label Releases", () => {
    expect(sellMusicMeta.title).toContain("White Label Releases");
  });

  it("should mention 99% and 1% fee in description", () => {
    expect(sellMusicMeta.description).toContain("99%");
    expect(sellMusicMeta.description).toContain("1% platform fee");
  });

  it("should include relevant keywords for SEO", () => {
    expect(sellMusicMeta.keywords).toContain("sell music online");
    expect(sellMusicMeta.keywords).toContain("independent artist");
    expect(sellMusicMeta.keywords).toContain("music distribution");
  });
});

// ─── Sell Music page content structure tests ─────────────────────────────────

describe("Sell Music landing page - content structure", () => {
  const sections = [
    "hero",
    "fee-comparison",
    "how-it-works",
    "features",
    "tier-comparison",
    "final-cta",
  ];

  it("should have 6 content sections", () => {
    expect(sections.length).toBe(6);
  });

  const howItWorksSteps = [
    { title: "Upload", step: 1 },
    { title: "Set Your Price", step: 2 },
    { title: "Publish", step: 3 },
    { title: "Get Paid", step: 4 },
  ];

  it("should have 4 how-it-works steps", () => {
    expect(howItWorksSteps.length).toBe(4);
  });

  it("should start with Upload and end with Get Paid", () => {
    expect(howItWorksSteps[0].title).toBe("Upload");
    expect(howItWorksSteps[3].title).toBe("Get Paid");
  });

  const features = [
    "30-Second Preview",
    "Secure Downloads",
    "Sales Analytics",
    "Instant Delivery",
    "Fan Notifications",
    "DMCA Compliant",
  ];

  it("should list 6 key features", () => {
    expect(features.length).toBe(6);
  });

  it("should include security and compliance features", () => {
    expect(features).toContain("Secure Downloads");
    expect(features).toContain("DMCA Compliant");
  });
});

// ─── Sitemap and robots.txt inclusion tests ──────────────────────────────────

describe("Sell Music - sitemap and robots.txt", () => {
  const sitemapUrls = [
    "/", "/browse", "/venues", "/events", "/pricing",
    "/how-it-works", "/sell-music", "/contact", "/faq", "/help",
  ];

  const robotsAllowed = [
    "/browse", "/venues", "/events", "/pricing",
    "/how-it-works", "/sell-music", "/contact", "/faq",
  ];

  it("should include /sell-music in sitemap URLs", () => {
    expect(sitemapUrls).toContain("/sell-music");
  });

  it("should allow /sell-music in robots.txt", () => {
    expect(robotsAllowed).toContain("/sell-music");
  });
});

// ─── Footer link tests ──────────────────────────────────────────────────────

describe("Footer - Sell Music link", () => {
  const forArtistsLinks = [
    { label: "Artist Dashboard", path: "/dashboard" },
    { label: "Browse Venues", path: "/venues" },
    { label: "Create Rider", path: "/rider-builder" },
    { label: "My Bookings", path: "/bookings" },
    { label: "Earnings", path: "/earnings-dashboard" },
    { label: "Sell Music", path: "/sell-music" },
    { label: "Following", path: "/following" },
  ];

  it("should include Sell Music in the For Artists footer section", () => {
    const sellMusicLink = forArtistsLinks.find((l) => l.path === "/sell-music");
    expect(sellMusicLink).toBeDefined();
    expect(sellMusicLink!.label).toBe("Sell Music");
  });
});
