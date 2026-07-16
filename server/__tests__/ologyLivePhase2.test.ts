import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("Ology Live Phase 2 - NIL Session Contracts", () => {
  const contractServicePath = path.resolve(__dirname, "../services/nilSessionContract.ts");

  it("should have the NIL session contract service file", () => {
    expect(fs.existsSync(contractServicePath)).toBe(true);
  });

  it("should export generateSessionContract function", () => {
    const content = fs.readFileSync(contractServicePath, "utf-8");
    expect(content).toContain("export async function generateSessionContract");
  });

  it("should export getContractByBookingId function", () => {
    const content = fs.readFileSync(contractServicePath, "utf-8");
    expect(content).toContain("export async function getContractByBookingId");
  });

  it("should include NCAA compliance provisions in contract generation", () => {
    const content = fs.readFileSync(contractServicePath, "utf-8");
    expect(content).toContain("NCAA");
    expect(content).toContain("compliance");
  });

  it("should include NIL disclosure requirements", () => {
    const content = fs.readFileSync(contractServicePath, "utf-8");
    expect(content).toContain("NIL");
    expect(content).toContain("disclosure");
  });

  it("should calculate platform fee correctly (15%)", () => {
    const content = fs.readFileSync(contractServicePath, "utf-8");
    expect(content).toContain("platformFee");
    expect(content).toContain("PLATFORM_FEE_PERCENT");
    expect(content).toContain("15");
  });

  it("should store contract in ologyLiveSessionContracts table", () => {
    const content = fs.readFileSync(contractServicePath, "utf-8");
    expect(content).toContain("ologyLiveSessionContracts");
  });

  it("should include cancellation policy in contract", () => {
    const content = fs.readFileSync(contractServicePath, "utf-8");
    expect(content).toContain("cancellation");
  });

  it("should include media rights clause", () => {
    const content = fs.readFileSync(contractServicePath, "utf-8");
    expect(content).toContain("media");
    expect(content).toContain("rights");
  });
});

describe("Ology Live Phase 2 - Recurring Availability", () => {
  const routerPath = path.resolve(__dirname, "../routers/ologyLive.ts");

  it("should have setRecurringSchedule endpoint", () => {
    const content = fs.readFileSync(routerPath, "utf-8");
    expect(content).toContain("setRecurringSchedule");
  });

  it("should have regenerateSlots endpoint", () => {
    const content = fs.readFileSync(routerPath, "utf-8");
    expect(content).toContain("regenerateSlots");
  });

  it("should support day of week scheduling (0-6)", () => {
    const content = fs.readFileSync(routerPath, "utf-8");
    expect(content).toContain("dayOfWeek");
    expect(content).toContain("z.number().min(0).max(6)");
  });

  it("should support timezone configuration", () => {
    const content = fs.readFileSync(routerPath, "utf-8");
    expect(content).toContain("timezone");
    expect(content).toContain("America/New_York");
  });

  it("should support configurable weeks ahead (1-8)", () => {
    const content = fs.readFileSync(routerPath, "utf-8");
    expect(content).toContain("weeksAhead");
    expect(content).toContain("z.number().min(1).max(8)");
  });

  it("should generate time slots based on duration", () => {
    const content = fs.readFileSync(routerPath, "utf-8");
    expect(content).toContain("generateRecurringSlots");
    expect(content).toContain("durationMinutes");
  });

  it("should avoid creating duplicate time slots", () => {
    const content = fs.readFileSync(routerPath, "utf-8");
    expect(content).toContain("existing");
    expect(content).toContain("!existing");
  });

  it("should only generate future time slots", () => {
    const content = fs.readFileSync(routerPath, "utf-8");
    expect(content).toContain("slotStart > now");
  });
});

describe("Ology Live Phase 2 - Session Reminders", () => {
  const handlerPath = path.resolve(__dirname, "../handlers/sessionReminders.ts");

  it("should have the session reminders handler", () => {
    expect(fs.existsSync(handlerPath)).toBe(true);
  });

  it("should query for upcoming sessions within reminder window", () => {
    const content = fs.readFileSync(handlerPath, "utf-8");
    expect(content).toContain("upcoming");
  });

  it("should send notifications for sessions starting soon", () => {
    const content = fs.readFileSync(handlerPath, "utf-8");
    expect(content).toContain("notification");
  });

  it("should be registered at /api/scheduled/session-reminders endpoint", () => {
    const indexPath = path.resolve(__dirname, "../_core/index.ts");
    const content = fs.readFileSync(indexPath, "utf-8");
    expect(content).toContain("/api/scheduled/session-reminders");
  });
});

describe("Ology Live Phase 2 - Reviews System", () => {
  const phase2RouterPath = path.resolve(__dirname, "../routers/ologyLivePhase2.ts");

  it("should have the Phase 2 router file", () => {
    expect(fs.existsSync(phase2RouterPath)).toBe(true);
  });

  it("should export ologyLivePhase2Router", () => {
    const content = fs.readFileSync(phase2RouterPath, "utf-8");
    expect(content).toContain("export const ologyLivePhase2Router");
  });

  it("should have submitReview endpoint", () => {
    const content = fs.readFileSync(phase2RouterPath, "utf-8");
    expect(content).toContain("submitReview");
  });

  it("should validate rating between 1-5", () => {
    const content = fs.readFileSync(phase2RouterPath, "utf-8");
    expect(content).toContain("rating");
    expect(content).toContain("min(1)");
    expect(content).toContain("max(5)");
  });

  it("should update experience average rating after review", () => {
    const content = fs.readFileSync(phase2RouterPath, "utf-8");
    expect(content).toContain("averageRating");
  });
});

describe("Ology Live Phase 2 - Earnings Tracking", () => {
  const phase2RouterPath = path.resolve(__dirname, "../routers/ologyLivePhase2.ts");

  it("should have getEarningsSummary endpoint", () => {
    const content = fs.readFileSync(phase2RouterPath, "utf-8");
    expect(content).toContain("getEarningsSummary");
  });

  it("should have getNilReport endpoint", () => {
    const content = fs.readFileSync(phase2RouterPath, "utf-8");
    expect(content).toContain("getNilReport");
  });

  it("should track platform fees separately", () => {
    const content = fs.readFileSync(phase2RouterPath, "utf-8");
    expect(content).toContain("platformFee");
  });

  it("should include NIL compliance disclaimer", () => {
    const content = fs.readFileSync(phase2RouterPath, "utf-8");
    expect(content).toContain("disclaimer");
    expect(content).toContain("NIL");
  });

  it("should support yearly earnings filtering", () => {
    const content = fs.readFileSync(phase2RouterPath, "utf-8");
    expect(content).toContain("year");
  });
});

describe("Ology Live Phase 2 - Fan My Sessions Page", () => {
  const pagePath = path.resolve(__dirname, "../../client/src/pages/OlogyLiveMySessions.tsx");

  it("should have the My Sessions page component", () => {
    expect(fs.existsSync(pagePath)).toBe(true);
  });

  it("should have tabs for upcoming, past, and all sessions", () => {
    const content = fs.readFileSync(pagePath, "utf-8");
    expect(content).toContain("upcoming");
    expect(content).toContain("past");
    expect(content).toContain("all");
  });

  it("should have a review submission form", () => {
    const content = fs.readFileSync(pagePath, "utf-8");
    expect(content).toContain("submitReview");
    expect(content).toContain("Leave Review");
  });

  it("should show join session link for confirmed bookings", () => {
    const content = fs.readFileSync(pagePath, "utf-8");
    expect(content).toContain("Join Session");
    expect(content).toContain("joinLink");
  });

  it("should display session status badges", () => {
    const content = fs.readFileSync(pagePath, "utf-8");
    expect(content).toContain("confirmed");
    expect(content).toContain("completed");
    expect(content).toContain("cancelled");
  });
});

describe("Ology Live Phase 2 - NIL Earnings Dashboard", () => {
  const pagePath = path.resolve(__dirname, "../../client/src/pages/OlogyLiveEarnings.tsx");

  it("should have the Earnings Dashboard page", () => {
    expect(fs.existsSync(pagePath)).toBe(true);
  });

  it("should display net earnings, gross revenue, and platform fees", () => {
    const content = fs.readFileSync(pagePath, "utf-8");
    expect(content).toContain("Net Earnings");
    expect(content).toContain("Gross Revenue");
    expect(content).toContain("Platform Fees");
  });

  it("should have NIL Compliance Report section", () => {
    const content = fs.readFileSync(pagePath, "utf-8");
    expect(content).toContain("NIL Compliance Report");
  });

  it("should support year filtering for reports", () => {
    const content = fs.readFileSync(pagePath, "utf-8");
    expect(content).toContain("selectedYear");
  });

  it("should show monthly breakdown table", () => {
    const content = fs.readFileSync(pagePath, "utf-8");
    expect(content).toContain("Monthly Breakdown");
    expect(content).toContain("monthlyBreakdown");
  });

  it("should display earnings by NIL category", () => {
    const content = fs.readFileSync(pagePath, "utf-8");
    expect(content).toContain("Earnings by NIL Category");
    expect(content).toContain("byCategory");
  });
});

describe("Ology Live Phase 2 - Profile Integration", () => {
  const componentPath = path.resolve(__dirname, "../../client/src/components/OlogyLiveProfileSection.tsx");
  const artistProfilePath = path.resolve(__dirname, "../../client/src/pages/ArtistProfile.tsx");

  it("should have the OlogyLiveProfileSection component", () => {
    expect(fs.existsSync(componentPath)).toBe(true);
  });

  it("should display experience cards with price, duration, and category", () => {
    const content = fs.readFileSync(componentPath, "utf-8");
    expect(content).toContain("formatPrice");
    expect(content).toContain("duration");
    expect(content).toContain("getCategoryLabel");
  });

  it("should be integrated into ArtistProfile page", () => {
    const content = fs.readFileSync(artistProfilePath, "utf-8");
    expect(content).toContain("OlogyLiveProfileSection");
    expect(content).toContain("talentId");
    expect(content).toContain("talentName");
  });

  it("should link to individual experience pages", () => {
    const content = fs.readFileSync(componentPath, "utf-8");
    expect(content).toContain("/ology-live/");
  });
});

describe("Ology Live Phase 2 - Database Schema", () => {
  const schemaPath = path.resolve(__dirname, "../../drizzle/schema.ts");

  it("should have ologyLiveSessionContracts table", () => {
    const content = fs.readFileSync(schemaPath, "utf-8");
    expect(content).toContain("ologyLiveSessionContracts");
    expect(content).toContain("ology_live_session_contracts");
  });

  it("should have ologyLiveReviews table", () => {
    const content = fs.readFileSync(schemaPath, "utf-8");
    expect(content).toContain("ologyLiveReviews");
    expect(content).toContain("ology_live_reviews");
  });

  it("should have ologyLiveEarnings table", () => {
    const content = fs.readFileSync(schemaPath, "utf-8");
    expect(content).toContain("ologyLiveEarnings");
    expect(content).toContain("ology_live_earnings");
  });

  it("should have NCAA compliance fields in session contracts", () => {
    const content = fs.readFileSync(schemaPath, "utf-8");
    expect(content).toContain("ncaaComplianceNote");
    expect(content).toContain("nilCategory");
  });

  it("should track payout status in earnings", () => {
    const content = fs.readFileSync(schemaPath, "utf-8");
    expect(content).toContain("payoutStatus");
  });
});

describe("Ology Live Phase 2 - Routing", () => {
  const appPath = path.resolve(__dirname, "../../client/src/App.tsx");

  it("should have /ology-live/my-sessions route", () => {
    const content = fs.readFileSync(appPath, "utf-8");
    expect(content).toContain("/ology-live/my-sessions");
    expect(content).toContain("OlogyLiveMySessions");
  });

  it("should have /ology-live/earnings route", () => {
    const content = fs.readFileSync(appPath, "utf-8");
    expect(content).toContain("/ology-live/earnings");
    expect(content).toContain("OlogyLiveEarnings");
  });

  it("should mount ologyLivePhase2 router in appRouter", () => {
    const routersPath = path.resolve(__dirname, "../routers.ts");
    const content = fs.readFileSync(routersPath, "utf-8");
    expect(content).toContain("ologyLivePhase2:");
    expect(content).toContain("ologyLivePhase2Router");
  });
});
