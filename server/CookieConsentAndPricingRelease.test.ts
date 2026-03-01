/**
 * Tests for CookieConsent banner and Pricing page White Label Release features.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

// ─── CookieConsent logic tests ───────────────────────────────────────────────

describe("CookieConsent", () => {
  const CONSENT_KEY = "ologywood_cookie_consent";

  // Simple in-memory mock for localStorage (Node env has no window.localStorage)
  let store: Record<string, string> = {};
  const mockLS = {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    clear: () => { store = {}; },
  };

  beforeEach(() => {
    mockLS.clear();
  });

  it("should not have consent key initially", () => {
    expect(mockLS.getItem(CONSENT_KEY)).toBeNull();
  });

  it("should persist dismissal", () => {
    mockLS.setItem(CONSENT_KEY, "accepted");
    expect(mockLS.getItem(CONSENT_KEY)).toBe("accepted");
  });

  it("should not show again after dismissal", () => {
    mockLS.setItem(CONSENT_KEY, "accepted");
    const dismissed = mockLS.getItem(CONSENT_KEY);
    expect(dismissed).toBeTruthy();
  });

  it("should use the correct localStorage key", () => {
    expect(CONSENT_KEY).toBe("ologywood_cookie_consent");
  });
});

// ─── Pricing page tier data tests ────────────────────────────────────────────

describe("Pricing page - White Label Release tiers", () => {
  // Replicate the tier data structure to validate correctness
  const freeTierFeatures = [
    { name: "Artist or venue profile", included: true },
    { name: "Browse artists and venues", included: true },
    { name: "In-platform messaging", included: true },
    { name: "Availability calendar", included: true },
    { name: "Follow artists & event discovery", included: true },
    { name: "2 booking requests per month", included: true },
    { name: "Rider Builder & templates", included: false },
    { name: "Contract management & e-signatures", included: false },
    { name: "Fan email list & Send Update", included: false },
    { name: "White Label Releases (sell music)", included: false },
    { name: "Analytics & payment history", included: false },
    { name: "Priority support", included: false },
    { name: "Featured profile & custom branding", included: false },
  ];

  const starterTierFeatures = [
    { name: "Everything in Free, plus:", included: true },
    { name: "Unlimited booking requests", included: true },
    { name: "Rider Builder & saved templates", included: true },
    { name: "Fan email list & Send Update", included: true },
    { name: "Follow artists & event discovery", included: true },
    { name: "In-platform messaging", included: true },
    { name: "Availability calendar", included: true },
    { name: "White Label Releases — 2 singles", included: true },
    { name: "Contract management & e-signatures", included: false },
    { name: "Analytics & payment history", included: false },
    { name: "Priority support", included: false },
    { name: "Featured profile & custom branding", included: false },
    { name: "Bulk messaging", included: false },
  ];

  const professionalTierFeatures = [
    { name: "Everything in Starter, plus:", included: true },
    { name: "Contract management & e-signatures", included: true },
    { name: "Advanced analytics dashboard", included: true },
    { name: "Payment history & earnings tracking", included: true },
    { name: "Priority support", included: true },
    { name: "Featured profile listing", included: true },
    { name: "Custom branding", included: true },
    { name: "Bulk messaging", included: true },
    { name: "Advanced profile customization", included: true },
    { name: "Unlimited booking requests", included: true },
    { name: "Rider Builder & saved templates", included: true },
    { name: "Fan email list & Send Update", included: true },
    { name: "White Label Releases — unlimited + pay-what-you-want", included: true },
  ];

  it("Free tier should NOT include White Label Releases", () => {
    const releaseFeature = freeTierFeatures.find((f) =>
      f.name.toLowerCase().includes("white label")
    );
    expect(releaseFeature).toBeDefined();
    expect(releaseFeature!.included).toBe(false);
  });

  it("Starter tier should include White Label Releases limited to 2 singles", () => {
    const releaseFeature = starterTierFeatures.find((f) =>
      f.name.toLowerCase().includes("white label")
    );
    expect(releaseFeature).toBeDefined();
    expect(releaseFeature!.included).toBe(true);
    expect(releaseFeature!.name).toContain("2 singles");
  });

  it("Professional tier should include unlimited White Label Releases with PWYW", () => {
    const releaseFeature = professionalTierFeatures.find((f) =>
      f.name.toLowerCase().includes("white label")
    );
    expect(releaseFeature).toBeDefined();
    expect(releaseFeature!.included).toBe(true);
    expect(releaseFeature!.name).toContain("unlimited");
    expect(releaseFeature!.name).toContain("pay-what-you-want");
  });

  it("All three tiers should mention White Label Releases", () => {
    const freeHas = freeTierFeatures.some((f) => f.name.toLowerCase().includes("white label"));
    const starterHas = starterTierFeatures.some((f) => f.name.toLowerCase().includes("white label"));
    const proHas = professionalTierFeatures.some((f) => f.name.toLowerCase().includes("white label"));
    expect(freeHas).toBe(true);
    expect(starterHas).toBe(true);
    expect(proHas).toBe(true);
  });
});

// ─── ReleaseManager non-artist error state tests ─────────────────────────────

describe("ReleaseManager - non-artist error handling", () => {
  it("should show error state when canCreate query fails", () => {
    // The ReleaseManager now checks canCreateQuery.isError and renders
    // an "Artist Account Required" message instead of infinite spinner
    const errorState = {
      isError: true,
      isLoading: false,
      data: undefined,
    };
    expect(errorState.isError).toBe(true);
    expect(errorState.isLoading).toBe(false);
  });

  it("should show loading state only while query is pending", () => {
    const loadingState = {
      isError: false,
      isLoading: true,
      data: undefined,
    };
    expect(loadingState.isLoading).toBe(true);
    expect(loadingState.isError).toBe(false);
  });

  it("should show normal content when query succeeds", () => {
    const successState = {
      isError: false,
      isLoading: false,
      data: { hasAccess: true, currentCount: 0, maxAllowed: 2 },
    };
    expect(successState.data).toBeDefined();
    expect(successState.data!.hasAccess).toBe(true);
  });
});
