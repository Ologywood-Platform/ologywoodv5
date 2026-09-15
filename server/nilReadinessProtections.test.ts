import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  calculateNilReadiness,
  getNilDeadlineStatus,
} from "./services/nilComplianceService";
import {
  NIL_AGENT_FEE_MAX_PERCENT,
  NIL_AGREEMENT_REPORTING_DAYS,
  NIL_COMPENSATION_REPORTING_DAYS,
  NIL_CONTRACT_TEMPLATE_VERSION,
  NIL_REPORTING_THRESHOLD_CENTS,
  NIL_TERMS_VERSION,
  normalizeNilSourceKey,
} from "../shared/nilCompliance";

const root = path.resolve(__dirname, "..");
const read = (relative: string) => fs.readFileSync(path.join(root, relative), "utf8");

function deal(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    sourceKey: "hbcu-brand",
    agreementDate: new Date("2026-09-10T12:00:00.000Z"),
    grossCompensation: "300.00",
    proposedProtectionEnabled: true,
    divisionOneReportingApplies: true,
    isNilActivity: true,
    compensationReceivedAt: null,
    agreementDisclosureStatus: "not_recorded",
    compensationDisclosureStatus: "not_recorded",
    ...overrides,
  };
}

describe("NIL readiness policy constants", () => {
  it("uses the proposed values without presenting the bill as enacted", () => {
    expect(NIL_AGENT_FEE_MAX_PERCENT).toBe(5);
    expect(NIL_REPORTING_THRESHOLD_CENTS).toBe(60_000);
    expect(NIL_AGREEMENT_REPORTING_DAYS).toBe(5);
    expect(NIL_COMPENSATION_REPORTING_DAYS).toBe(30);
    expect(NIL_CONTRACT_TEMPLATE_VERSION).toBe("2026.1");
    expect(NIL_TERMS_VERSION).toMatch(/^2026-/);
  });

  it("normalizes equivalent counterparty names for same-source aggregation", () => {
    expect(normalizeNilSourceKey("  HBCU Brand, Inc. ")).toBe("hbcu-brand-inc");
  });
});

describe("NIL in-app deadline calculations", () => {
  const now = new Date("2026-09-15T12:00:00.000Z");

  it("aggregates the same source over the rolling 12-month window", () => {
    const result = calculateNilReadiness([
      deal({ id: 1, agreementDate: new Date("2026-09-10T12:00:00.000Z"), grossCompensation: "300.00" }),
      deal({ id: 2, agreementDate: new Date("2026-09-12T12:00:00.000Z"), grossCompensation: "300.00" }),
    ], now);
    expect(result.deals).toHaveLength(2);
    expect(result.deals[0].sameSourceTotalCents).toBe(60_000);
    expect(result.deals[0].reportingRequired).toBe(true);
    expect(result.deals[0].agreementDueAt?.toISOString()).toBe("2026-09-15T12:00:00.000Z");
  });

  it("does not combine different sources or expired agreements", () => {
    const result = calculateNilReadiness([
      deal({ id: 1, sourceKey: "brand-a", grossCompensation: "300.00" }),
      deal({ id: 2, sourceKey: "brand-b", grossCompensation: "300.00" }),
      deal({ id: 3, sourceKey: "brand-a", agreementDate: new Date("2025-08-01T12:00:00.000Z"), grossCompensation: "500.00" }),
    ], now);
    expect(result.deals[0].sameSourceTotalCents).toBe(30_000);
    expect(result.deals[0].reportingRequired).toBe(false);
    expect(result.deals[1].sameSourceTotalCents).toBe(30_000);
  });

  it("derives five-day agreement and thirty-day compensation reminders", () => {
    const result = calculateNilReadiness([
      deal({
        grossCompensation: "600.00",
        compensationReceivedAt: new Date("2026-09-01T12:00:00.000Z"),
      }),
    ], now);
    expect(result.deals[0].agreementReminderStatus).toBe("due");
    expect(result.deals[0].compensationDueAt?.toISOString()).toBe("2026-10-01T12:00:00.000Z");
    expect(result.deals[0].compensationReminderStatus).toBe("upcoming");
    expect(result.reminderCounts).toEqual({ overdue: 0, due: 1, upcoming: 1 });
  });

  it("treats a recorded submission as submitted rather than overdue", () => {
    expect(getNilDeadlineStatus(true, true, new Date("2026-01-01T00:00:00.000Z"), now)).toBe("submitted");
  });
});

describe("NIL readiness implementation boundaries", () => {
  it("uses additive private schema and leaves payment records untouched", () => {
    const schema = read("drizzle/schema.ts");
    const migration = read("drizzle/0112_grey_triton.sql");
    expect(schema).toContain('mysqlTable("nil_athlete_compliance_profiles"');
    expect(schema).toContain('mysqlTable("nil_compliance_deals"');
    expect(schema).toContain('mysqlTable("nil_compliance_events"');
    expect(migration).toContain("CREATE TABLE `nil_athlete_compliance_profiles`");
    expect(migration).toContain("ADD `nilTermsVersion`");
    expect(migration).not.toMatch(/DROP\s+(TABLE|COLUMN)/i);
    expect(migration).not.toContain("release_purchases");
    expect(migration).not.toContain("ology_live_bookings");
  });

  it("enforces athlete ownership on NIL tools without gating general Ology Live creation", () => {
    const service = read("server/services/nilComplianceService.ts");
    const rider = read("server/routers/rider.ts");
    const analyzer = read("server/routers/contractAnalyzer.ts");
    const live = read("server/routers/ologyLivePhase2.ts");
    expect(service).toContain('artistProfile.talentType !== "athlete"');
    expect(rider).toContain("requireOwnedAthleteProfile");
    expect(analyzer).toContain("requireOwnedAthleteProfile");
    expect(live).toContain("requireOwnedAthleteProfile");
    expect(read("server/routers/ologyLive.ts")).toContain("createExperience: talentProcedure");
  });

  it("keeps evidence in private S3 keys and creates URLs only after owner authorization", () => {
    const service = read("server/services/nilComplianceService.ts");
    expect(service).toContain("nil-compliance-evidence/${userId}/${deal.id}");
    expect(service).toContain("url: null");
    expect(service).toContain("getOwnedEvidenceUrl");
    expect(service).toContain("eq(nilComplianceEvents.athleteUserId, userId)");
    expect(service).toContain("storageGet(event.evidenceKey)");
    expect(service).toContain("hasEvidence: Boolean(evidenceKey)");
    expect(read("client/src/pages/NilComplianceCenter.tsx")).not.toContain("event.evidenceKey");
  });

  it("uses truthful proposed-protection and non-agent wording", () => {
    const terms = read("client/src/pages/TermsOfService.tsx");
    const nilContract = read("server/services/nilContractGenerator.ts");
    const liveContract = read("server/services/nilSessionContract.ts");
    expect(terms).toContain("proposed in the Protect College Sports Act of 2026");
    expect(terms).toContain("The proposal was not enacted as of this Terms version");
    expect(terms).toContain("act as an athlete agent");
    expect(nilContract).toContain("NIL Readiness & Athlete Representations");
    expect(nilContract).not.toContain("NCAA Compliant:</strong> Yes");
    expect(liveContract).toContain("technology marketplace service fee");
    expect(liveContract).toContain("non-waivable statutory remedy");
    expect(liveContract).not.toContain("held in escrow");
  });

  it("classifies platform fees separately without changing approved percentages", () => {
    const payment = read("server/routers.ts");
    const live = read("server/routers/ologyLive.ts");
    const booking = read("server/routes/bookingCheckout.ts");
    expect(payment).toContain("amountCents * 0.01");
    expect(payment).toContain("technology_marketplace_service");
    expect(booking).toContain("const PLATFORM_FEE_PERCENT = 1");
    expect(live).toContain("const PLATFORM_FEE_PERCENT = 15");
    expect(live).toContain("athleteAgentFeeIncluded: 'false'");
  });

  it("stores NIL template and Terms versions with a limited contract-safe snapshot", () => {
    const router = read("server/routers/riderContract.ts");
    const service = read("server/services/nilComplianceService.ts");
    expect(router).toContain("getNilContractMetadata");
    expect(router.match(/getNilContractMetadata\(booking\.artistId\)/g)?.length).toBe(3);
    expect(service).toContain("getContractSafeComplianceSnapshot");
    expect(service).not.toContain("complianceContactEmail: profile.complianceContactEmail");
    expect(service).not.toContain("guardianEmail: profile.guardianEmail");
  });

  it("provides truthful athlete guidance without certification claims", () => {
    const help = read("client/src/pages/Help.tsx");
    const faq = read("client/src/pages/FAQ.tsx");
    const tour = read("client/src/components/OnboardingTour.tsx");
    const analyzer = read("client/src/components/ContractAnalyzer.tsx");
    expect(help).toContain("Where is the NIL Compliance Center?");
    expect(help).toContain("proposed Division I workflow");
    expect(help).toContain("does not certify NCAA");
    expect(faq).toContain("Does Ologywood certify NIL or NCAA compliance?");
    expect(tour).toContain("Welcome to NIL Readiness Tools");
    expect(tour).not.toContain("NIL-Compliant Contracts");
    expect(analyzer).toContain("Analyze Contract Readiness");
    expect(analyzer).not.toContain("Analyze for Compliance");
  });

  it("keeps general Ology Live earnings available while limiting NIL exports to Athlete profiles", () => {
    const page = read("client/src/pages/OlogyLiveEarnings.tsx");
    const router = read("server/routers/ologyLivePhase2.ts");
    expect(page).toContain('const isAthleteProfile = artistProfile?.talentType === "athlete"');
    expect(page).toContain('{ enabled: isAthleteProfile }');
    expect(page).toContain('isAthleteProfile && <div className="flex gap-2">');
    expect(page).toContain("Athlete NIL Activity Earnings Summary");
    expect(page).toContain("Technology Marketplace Service Fees (15%)");
    expect(router).toContain("requireOwnedAthleteProfile(ctx.user.id)");
    expect(router).toContain("not a disclosure filing");
  });
});
