import { randomUUID } from "crypto";
import { and, desc, eq, gte } from "drizzle-orm";
import {
  nilAthleteComplianceProfiles,
  nilComplianceDeals,
  nilComplianceEvents,
  type InsertNilAthleteComplianceProfile,
  type InsertNilComplianceDeal,
} from "../../drizzle/schema";
import {
  NIL_AGENT_FEE_MAX_PERCENT,
  NIL_AGREEMENT_REPORTING_DAYS,
  NIL_COMPENSATION_REPORTING_DAYS,
  NIL_CONTRACT_TEMPLATE_VERSION,
  NIL_EVIDENCE_MAX_BYTES,
  NIL_EVIDENCE_MIME_TYPES,
  NIL_REPORTING_THRESHOLD_CENTS,
  NIL_TERMS_VERSION,
  normalizeNilSourceKey,
} from "../../shared/nilCompliance";
import { getArtistProfileByUserId, getDb } from "../db";
import { storageGet, storagePut } from "../storage";
import { ensureNilComplianceSchema } from "./nilComplianceSchemaService";

export type NilDeadlineStatus = "not_required" | "upcoming" | "due" | "overdue" | "submitted";

export interface NilComplianceProfileInput {
  athleticStatus: InsertNilAthleteComplianceProfile["athleticStatus"];
  institutionName?: string | null;
  institutionState?: string | null;
  associationName?: string | null;
  divisionLevel?: string | null;
  eligibilityEndsAt?: Date | null;
  complianceContactName?: string | null;
  complianceContactEmail?: string | null;
  complianceContactPhone?: string | null;
  isMinor: boolean;
  guardianName?: string | null;
  guardianEmail?: string | null;
  representativeInvolved: boolean;
}

export interface NilComplianceDealInput {
  sourceType: InsertNilComplianceDeal["sourceType"];
  bookingId?: number | null;
  ologyLiveBookingId?: number | null;
  sourceName: string;
  title: string;
  dealType: InsertNilComplianceDeal["dealType"];
  isNilActivity: boolean;
  isEndorsementContract: boolean;
  proposedProtectionEnabled: boolean;
  divisionOneReportingApplies: boolean;
  agreementDate: Date;
  termStartsAt?: Date | null;
  termEndsAt?: Date | null;
  servicesDescription: string;
  counterpartyName: string;
  counterpartyEmail?: string | null;
  grossCompensation: number;
  compensationReceivedAmount?: number | null;
  compensationReceivedAt?: Date | null;
  writtenAgreementConfirmed: boolean;
  nonperformanceTerminationTerms?: string | null;
  notConditionedOnEnrollmentOrResidency: boolean;
  representativeInvolved: boolean;
  representativeName?: string | null;
  representativeEmail?: string | null;
  representativeRegistrationState?: string | null;
  representativeRegistrationNumber?: string | null;
  agencyContractConfirmed: boolean;
  agentFeePercent?: number | null;
  platformServiceFeeAmount?: number | null;
  paymentProcessingFeeAmount?: number | null;
}

function nullableText(value?: string | null) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function addDays(value: Date, days: number) {
  return new Date(value.getTime() + days * 24 * 60 * 60 * 1000);
}

async function getNilComplianceDb() {
  const database = await getDb();
  if (!database) throw new Error("Database unavailable");
  await ensureNilComplianceSchema(database);
  return database;
}

export function getNilDeadlineStatus(required: boolean, submitted: boolean, dueAt: Date | null, now: Date): NilDeadlineStatus {
  if (!required) return "not_required";
  if (submitted) return "submitted";
  if (!dueAt) return "not_required";
  if (dueAt.getTime() < now.getTime()) return "overdue";
  if (dueAt.getTime() - now.getTime() <= 24 * 60 * 60 * 1000) return "due";
  return "upcoming";
}

function assertFiniteMoney(value: number | null | undefined, label: string) {
  if (value == null) return;
  if (!Number.isFinite(value) || value < 0 || value > 100_000_000) {
    throw new Error(`${label} must be between $0 and $100,000,000.`);
  }
}

function assertDealInput(input: NilComplianceDealInput, complianceProfile: typeof nilAthleteComplianceProfiles.$inferSelect) {
  assertFiniteMoney(input.grossCompensation, "Gross compensation");
  assertFiniteMoney(input.compensationReceivedAmount, "Compensation received");
  assertFiniteMoney(input.platformServiceFeeAmount, "Platform service fee");
  assertFiniteMoney(input.paymentProcessingFeeAmount, "Payment processing fee");

  if (input.termStartsAt && input.termEndsAt && input.termEndsAt < input.termStartsAt) {
    throw new Error("The deal end date cannot be before its start date.");
  }

  const studentAthlete = complianceProfile.athleticStatus === "college_student_athlete" || complianceProfile.athleticStatus === "prospective_student_athlete";
  const protectedEndorsement = input.proposedProtectionEnabled && studentAthlete && input.isEndorsementContract;

  if (protectedEndorsement && !input.writtenAgreementConfirmed) {
    throw new Error("Confirm that the endorsement agreement is in writing before using the proposed-protection workflow.");
  }
  if (protectedEndorsement && !input.notConditionedOnEnrollmentOrResidency) {
    throw new Error("Confirm that validity and payment are not conditioned on enrollment, continued enrollment, or residence.");
  }
  if (protectedEndorsement && !nullableText(input.nonperformanceTerminationTerms)) {
    throw new Error("Describe the nonperformance termination terms for this endorsement agreement.");
  }
  if (protectedEndorsement && complianceProfile.eligibilityEndsAt && input.termEndsAt && input.termEndsAt > complianceProfile.eligibilityEndsAt) {
    throw new Error("The endorsement term cannot extend beyond the athlete's recorded intercollegiate eligibility end date.");
  }

  if (input.representativeInvolved) {
    if (!nullableText(input.representativeName) || !nullableText(input.representativeRegistrationState) || !nullableText(input.representativeRegistrationNumber)) {
      throw new Error("Representative name, registration state, and registration number are required when a representative is involved.");
    }
    if (protectedEndorsement && !input.agencyContractConfirmed) {
      throw new Error("Confirm the athlete has a separate written agency contract with the representative.");
    }
    if (input.agentFeePercent == null) {
      throw new Error("Enter the representative fee percentage.");
    }
    if (input.agentFeePercent < 0) {
      throw new Error("Representative fees cannot be negative.");
    }
    if (protectedEndorsement && input.agentFeePercent > NIL_AGENT_FEE_MAX_PERCENT) {
      throw new Error(`Representative fees for a protected endorsement cannot exceed ${NIL_AGENT_FEE_MAX_PERCENT}% of the endorsement contract value.`);
    }
  } else if ((input.agentFeePercent ?? 0) > 0) {
    throw new Error("A representative fee cannot be entered unless representative involvement is enabled.");
  }
}

export async function requireOwnedAthleteProfile(userId: number) {
  const artistProfile = await getArtistProfileByUserId(userId);
  if (!artistProfile || artistProfile.talentType !== "athlete") {
    throw new Error("An owned Athlete profile is required to access NIL compliance tools.");
  }
  return artistProfile;
}

export async function hasOwnedAthleteProfile(userId: number) {
  const artistProfile = await getArtistProfileByUserId(userId);
  return artistProfile?.talentType === "athlete";
}

export async function getContractSafeComplianceSnapshot(artistProfileId: number) {
  const database = await getNilComplianceDb();
  const profile = (await database.select().from(nilAthleteComplianceProfiles)
    .where(eq(nilAthleteComplianceProfiles.artistProfileId, artistProfileId)).limit(1))[0];
  if (!profile) return null;

  return {
    athleticStatus: profile.athleticStatus,
    institutionName: profile.institutionName,
    institutionState: profile.institutionState,
    associationName: profile.associationName,
    divisionLevel: profile.divisionLevel,
    eligibilityEndsAt: profile.eligibilityEndsAt?.toISOString() ?? null,
    representativeInvolved: profile.representativeInvolved,
    athleteAttestedAt: profile.athleteAttestedAt?.toISOString() ?? null,
    termsVersion: profile.termsVersion,
  };
}

async function appendEvent(params: {
  dealId?: number | null;
  athleteProfileId: number;
  athleteUserId: number;
  actorUserId: number;
  eventType: typeof nilComplianceEvents.$inferInsert.eventType;
  eventData?: Record<string, unknown>;
  evidence?: {
    key: string;
    url?: string | null;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
  };
}) {
  const database = await getNilComplianceDb();
  await database.insert(nilComplianceEvents).values({
    dealId: params.dealId ?? null,
    athleteProfileId: params.athleteProfileId,
    athleteUserId: params.athleteUserId,
    actorUserId: params.actorUserId,
    eventType: params.eventType,
    eventData: params.eventData ?? null,
    evidenceKey: params.evidence?.key ?? null,
    evidenceUrl: params.evidence?.url ?? null,
    evidenceFileName: params.evidence?.fileName ?? null,
    evidenceMimeType: params.evidence?.mimeType ?? null,
    evidenceSizeBytes: params.evidence?.sizeBytes ?? null,
  });
}

export async function getOwnedComplianceProfile(userId: number) {
  const artistProfile = await requireOwnedAthleteProfile(userId);
  const database = await getNilComplianceDb();
  const profile = (await database.select().from(nilAthleteComplianceProfiles)
    .where(eq(nilAthleteComplianceProfiles.athleteUserId, userId)).limit(1))[0] ?? null;
  return { artistProfile, profile };
}

export async function upsertOwnedComplianceProfile(userId: number, input: NilComplianceProfileInput) {
  const artistProfile = await requireOwnedAthleteProfile(userId);
  const database = await getNilComplianceDb();

  if (input.isMinor && (!nullableText(input.guardianName) || !nullableText(input.guardianEmail))) {
    throw new Error("Guardian name and email are required for a minor athlete.");
  }

  const existing = (await database.select().from(nilAthleteComplianceProfiles)
    .where(eq(nilAthleteComplianceProfiles.athleteUserId, userId)).limit(1))[0];
  const values = {
    artistProfileId: artistProfile.id,
    athleteUserId: userId,
    athleticStatus: input.athleticStatus,
    institutionName: nullableText(input.institutionName),
    institutionState: nullableText(input.institutionState),
    associationName: nullableText(input.associationName),
    divisionLevel: nullableText(input.divisionLevel),
    eligibilityEndsAt: input.eligibilityEndsAt ?? null,
    complianceContactName: nullableText(input.complianceContactName),
    complianceContactEmail: nullableText(input.complianceContactEmail),
    complianceContactPhone: nullableText(input.complianceContactPhone),
    isMinor: input.isMinor,
    guardianName: input.isMinor ? nullableText(input.guardianName) : null,
    guardianEmail: input.isMinor ? nullableText(input.guardianEmail) : null,
    representativeInvolved: input.representativeInvolved,
    athleteAttestedAt: new Date(),
    termsVersion: NIL_TERMS_VERSION,
  } satisfies InsertNilAthleteComplianceProfile;

  if (existing) {
    await database.update(nilAthleteComplianceProfiles).set(values)
      .where(eq(nilAthleteComplianceProfiles.id, existing.id));
  } else {
    await database.insert(nilAthleteComplianceProfiles).values(values);
  }

  await appendEvent({
    athleteProfileId: artistProfile.id,
    athleteUserId: userId,
    actorUserId: userId,
    eventType: existing ? "profile_updated" : "profile_created",
    eventData: {
      athleticStatus: input.athleticStatus,
      institutionName: nullableText(input.institutionName),
      associationName: nullableText(input.associationName),
      divisionLevel: nullableText(input.divisionLevel),
      eligibilityEndsAt: input.eligibilityEndsAt?.toISOString() ?? null,
      representativeInvolved: input.representativeInvolved,
      termsVersion: NIL_TERMS_VERSION,
    },
  });

  return getOwnedComplianceProfile(userId);
}

function toDealValues(userId: number, athleteProfileId: number, complianceProfile: typeof nilAthleteComplianceProfiles.$inferSelect, input: NilComplianceDealInput) {
  assertDealInput(input, complianceProfile);
  const agentFeePercent = input.representativeInvolved ? (input.agentFeePercent ?? 0) : 0;
  return {
    athleteProfileId,
    athleteUserId: userId,
    sourceType: input.sourceType,
    bookingId: input.bookingId ?? null,
    ologyLiveBookingId: input.ologyLiveBookingId ?? null,
    sourceName: input.sourceName.trim(),
    sourceKey: normalizeNilSourceKey(input.sourceName),
    title: input.title.trim(),
    dealType: input.dealType,
    isNilActivity: input.isNilActivity,
    isEndorsementContract: input.isEndorsementContract,
    proposedProtectionEnabled: input.proposedProtectionEnabled,
    divisionOneReportingApplies: input.divisionOneReportingApplies,
    agreementDate: input.agreementDate,
    termStartsAt: input.termStartsAt ?? null,
    termEndsAt: input.termEndsAt ?? null,
    eligibilityEndsAtSnapshot: complianceProfile.eligibilityEndsAt,
    servicesDescription: input.servicesDescription.trim(),
    counterpartyName: input.counterpartyName.trim(),
    counterpartyEmail: nullableText(input.counterpartyEmail),
    grossCompensation: input.grossCompensation.toFixed(2),
    compensationReceivedAmount: input.compensationReceivedAmount == null ? null : input.compensationReceivedAmount.toFixed(2),
    compensationReceivedAt: input.compensationReceivedAt ?? null,
    currency: "USD",
    writtenAgreementConfirmed: input.writtenAgreementConfirmed,
    nonperformanceTerminationTerms: nullableText(input.nonperformanceTerminationTerms),
    notConditionedOnEnrollmentOrResidency: input.notConditionedOnEnrollmentOrResidency,
    representativeInvolved: input.representativeInvolved,
    representativeName: input.representativeInvolved ? nullableText(input.representativeName) : null,
    representativeEmail: input.representativeInvolved ? nullableText(input.representativeEmail) : null,
    representativeRegistrationState: input.representativeInvolved ? nullableText(input.representativeRegistrationState) : null,
    representativeRegistrationNumber: input.representativeInvolved ? nullableText(input.representativeRegistrationNumber) : null,
    agencyContractConfirmed: input.representativeInvolved && input.agencyContractConfirmed,
    agentFeePercent: agentFeePercent.toFixed(2),
    agentFeeAmount: (input.grossCompensation * agentFeePercent / 100).toFixed(2),
    platformServiceFeeAmount: input.platformServiceFeeAmount == null ? null : input.platformServiceFeeAmount.toFixed(2),
    paymentProcessingFeeAmount: input.paymentProcessingFeeAmount == null ? null : input.paymentProcessingFeeAmount.toFixed(2),
    contractTemplateVersion: NIL_CONTRACT_TEMPLATE_VERSION,
    nilTermsVersion: NIL_TERMS_VERSION,
  } satisfies Partial<InsertNilComplianceDeal>;
}

export async function createOwnedDeal(userId: number, input: NilComplianceDealInput) {
  const { artistProfile, profile } = await getOwnedComplianceProfile(userId);
  if (!profile) throw new Error("Complete the private athlete compliance profile before adding a NIL deal.");
  const database = await getNilComplianceDb();
  const values = toDealValues(userId, artistProfile.id, profile, input);
  const result = await database.insert(nilComplianceDeals).values(values as InsertNilComplianceDeal);
  const dealId = Number(result[0].insertId);
  await appendEvent({
    dealId,
    athleteProfileId: artistProfile.id,
    athleteUserId: userId,
    actorUserId: userId,
    eventType: "deal_created",
    eventData: {
      title: values.title,
      sourceName: values.sourceName,
      dealType: values.dealType,
      grossCompensation: values.grossCompensation,
      representativeInvolved: values.representativeInvolved,
      agentFeePercent: values.agentFeePercent,
      contractTemplateVersion: NIL_CONTRACT_TEMPLATE_VERSION,
      nilTermsVersion: NIL_TERMS_VERSION,
    },
  });
  return getOwnedDeal(userId, dealId);
}

export async function getOwnedDeal(userId: number, dealId: number) {
  await requireOwnedAthleteProfile(userId);
  const database = await getNilComplianceDb();
  const deal = (await database.select().from(nilComplianceDeals)
    .where(and(eq(nilComplianceDeals.id, dealId), eq(nilComplianceDeals.athleteUserId, userId))).limit(1))[0];
  if (!deal) throw new Error("NIL compliance deal not found.");
  return deal;
}

export async function updateOwnedDeal(userId: number, dealId: number, input: NilComplianceDealInput) {
  const { artistProfile, profile } = await getOwnedComplianceProfile(userId);
  if (!profile) throw new Error("Complete the private athlete compliance profile before updating a NIL deal.");
  const current = await getOwnedDeal(userId, dealId);
  const database = await getNilComplianceDb();
  const values = toDealValues(userId, artistProfile.id, profile, input);
  await database.update(nilComplianceDeals).set(values)
    .where(and(eq(nilComplianceDeals.id, current.id), eq(nilComplianceDeals.athleteUserId, userId)));
  await appendEvent({
    dealId,
    athleteProfileId: artistProfile.id,
    athleteUserId: userId,
    actorUserId: userId,
    eventType: "deal_updated",
    eventData: {
      title: values.title,
      sourceName: values.sourceName,
      grossCompensation: values.grossCompensation,
      representativeInvolved: values.representativeInvolved,
      agentFeePercent: values.agentFeePercent,
      nilTermsVersion: NIL_TERMS_VERSION,
    },
  });
  return getOwnedDeal(userId, dealId);
}

export async function recordOwnedSubmission(userId: number, params: {
  dealId: number;
  kind: "agreement" | "compensation";
  recipient: string;
  submittedBy: "athlete" | "authorized_representative";
  attested: boolean;
}) {
  if (!params.attested) throw new Error("Confirm that the submission information is accurate.");
  const deal = await getOwnedDeal(userId, params.dealId);
  const database = await getNilComplianceDb();
  const now = new Date();
  const recipient = params.recipient.trim();
  if (!recipient) throw new Error("Enter the institution, association, or enforcement recipient.");
  const patch = params.kind === "agreement" ? {
    agreementDisclosureStatus: "submitted" as const,
    agreementSubmittedAt: now,
    agreementSubmissionRecipient: recipient,
    agreementSubmittedBy: params.submittedBy,
  } : {
    compensationDisclosureStatus: "submitted" as const,
    compensationSubmittedAt: now,
    compensationSubmissionRecipient: recipient,
    compensationSubmittedBy: params.submittedBy,
  };
  await database.update(nilComplianceDeals).set(patch)
    .where(and(eq(nilComplianceDeals.id, deal.id), eq(nilComplianceDeals.athleteUserId, userId)));
  await appendEvent({
    dealId: deal.id,
    athleteProfileId: deal.athleteProfileId,
    athleteUserId: userId,
    actorUserId: userId,
    eventType: params.kind === "agreement" ? "agreement_submission_recorded" : "compensation_submission_recorded",
    eventData: { recipient, submittedBy: params.submittedBy, submittedAt: now.toISOString(), attested: true },
  });
  return getOwnedDeal(userId, deal.id);
}

function hasExpectedSignature(buffer: Buffer, mimeType: string) {
  if (mimeType === "application/pdf") return buffer.subarray(0, 5).toString("ascii") === "%PDF-";
  if (mimeType === "image/png") return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (mimeType === "image/jpeg") return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (mimeType === "image/webp") return buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP";
  return false;
}

export async function uploadOwnedEvidence(userId: number, params: {
  dealId: number;
  fileName: string;
  mimeType: string;
  fileData: string;
}) {
  const deal = await getOwnedDeal(userId, params.dealId);
  if (!NIL_EVIDENCE_MIME_TYPES.includes(params.mimeType as (typeof NIL_EVIDENCE_MIME_TYPES)[number])) {
    throw new Error("Evidence must be a PDF, PNG, JPEG, or WebP file.");
  }
  const base64 = params.fileData.includes(",") ? params.fileData.split(",").pop() ?? "" : params.fileData;
  const buffer = Buffer.from(base64, "base64");
  if (!buffer.length || buffer.length > NIL_EVIDENCE_MAX_BYTES) {
    throw new Error("Evidence must be a non-empty file no larger than 10 MB.");
  }
  if (!hasExpectedSignature(buffer, params.mimeType)) {
    throw new Error("The evidence file content does not match its declared file type.");
  }
  const safeName = params.fileName.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-120) || "evidence";
  const key = `nil-compliance-evidence/${userId}/${deal.id}/${randomUUID()}-${safeName}`;
  const stored = await storagePut(key, buffer, params.mimeType);
  await appendEvent({
    dealId: deal.id,
    athleteProfileId: deal.athleteProfileId,
    athleteUserId: userId,
    actorUserId: userId,
    eventType: "evidence_uploaded",
    eventData: { uploadedAt: new Date().toISOString() },
    evidence: { key: stored.key, url: null, fileName: safeName, mimeType: params.mimeType, sizeBytes: buffer.length },
  });
  return { fileName: safeName, mimeType: params.mimeType, sizeBytes: buffer.length };
}

export async function getOwnedEvidenceUrl(userId: number, eventId: number) {
  await requireOwnedAthleteProfile(userId);
  const database = await getNilComplianceDb();
  const event = (await database.select().from(nilComplianceEvents)
    .where(and(eq(nilComplianceEvents.id, eventId), eq(nilComplianceEvents.athleteUserId, userId))).limit(1))[0];
  if (!event?.evidenceKey) throw new Error("NIL evidence file not found.");
  const file = await storageGet(event.evidenceKey);
  return { url: file.url, fileName: event.evidenceFileName || "NIL evidence" };
}

export function calculateNilReadiness<T extends {
  sourceKey: string;
  agreementDate: Date;
  grossCompensation: string | number;
  proposedProtectionEnabled: boolean;
  divisionOneReportingApplies: boolean;
  isNilActivity: boolean;
  compensationReceivedAt: Date | null;
  agreementDisclosureStatus: string;
  compensationDisclosureStatus: string;
}>(deals: T[], now = new Date()) {
  const windowStart = new Date(now);
  windowStart.setUTCFullYear(windowStart.getUTCFullYear() - 1);
  const recentDeals = deals.filter((deal) => deal.agreementDate >= windowStart && deal.agreementDate <= now);
  const totalsBySource = new Map<string, number>();
  for (const deal of recentDeals) {
    totalsBySource.set(deal.sourceKey, (totalsBySource.get(deal.sourceKey) ?? 0) + Math.round(Number(deal.grossCompensation) * 100));
  }
  const enrichedDeals = deals.map((deal) => {
    const sameSourceTotalCents = totalsBySource.get(deal.sourceKey) ?? 0;
    const reportingRequired = deal.proposedProtectionEnabled && deal.divisionOneReportingApplies && deal.isNilActivity && sameSourceTotalCents >= NIL_REPORTING_THRESHOLD_CENTS;
    const agreementDueAt = reportingRequired ? addDays(deal.agreementDate, NIL_AGREEMENT_REPORTING_DAYS) : null;
    const compensationDueAt = reportingRequired && deal.compensationReceivedAt ? addDays(deal.compensationReceivedAt, NIL_COMPENSATION_REPORTING_DAYS) : null;
    return {
      ...deal,
      sameSourceTotalCents,
      reportingRequired,
      agreementDueAt,
      agreementReminderStatus: getNilDeadlineStatus(reportingRequired, deal.agreementDisclosureStatus === "submitted", agreementDueAt, now),
      compensationDueAt,
      compensationReminderStatus: getNilDeadlineStatus(reportingRequired && !!deal.compensationReceivedAt, deal.compensationDisclosureStatus === "submitted", compensationDueAt, now),
    };
  });
  const reminderCounts = enrichedDeals.reduce((counts, deal) => {
    for (const status of [deal.agreementReminderStatus, deal.compensationReminderStatus]) {
      if (status === "overdue") counts.overdue += 1;
      if (status === "due") counts.due += 1;
      if (status === "upcoming") counts.upcoming += 1;
    }
    return counts;
  }, { overdue: 0, due: 0, upcoming: 0 });
  return { deals: enrichedDeals, reminderCounts };
}

export async function getOwnedDashboard(userId: number, now = new Date()) {
  const { artistProfile, profile } = await getOwnedComplianceProfile(userId);
  const database = await getNilComplianceDb();
  const deals = await database.select().from(nilComplianceDeals)
    .where(eq(nilComplianceDeals.athleteUserId, userId))
    .orderBy(desc(nilComplianceDeals.agreementDate));
  const readiness = calculateNilReadiness(deals, now);
  return {
    artistProfile: { id: artistProfile.id, artistName: artistProfile.artistName, talentType: artistProfile.talentType },
    complianceProfile: profile,
    deals: readiness.deals,
    reminderCounts: readiness.reminderCounts,
    policy: {
      billStatus: "proposed_not_enacted" as const,
      thresholdCents: NIL_REPORTING_THRESHOLD_CENTS,
      agreementDays: NIL_AGREEMENT_REPORTING_DAYS,
      compensationDays: NIL_COMPENSATION_REPORTING_DAYS,
      agentFeeMaxPercent: NIL_AGENT_FEE_MAX_PERCENT,
      termsVersion: NIL_TERMS_VERSION,
      contractTemplateVersion: NIL_CONTRACT_TEMPLATE_VERSION,
    },
  };
}

export async function listOwnedEvents(userId: number, dealId?: number) {
  await requireOwnedAthleteProfile(userId);
  const database = await getNilComplianceDb();
  const conditions = [eq(nilComplianceEvents.athleteUserId, userId)];
  if (dealId != null) conditions.push(eq(nilComplianceEvents.dealId, dealId));
  const events = await database.select().from(nilComplianceEvents)
    .where(and(...conditions))
    .orderBy(desc(nilComplianceEvents.createdAt));
  return events.map(({ evidenceKey, evidenceUrl: _legacyEvidenceUrl, ...event }) => ({
    ...event,
    hasEvidence: Boolean(evidenceKey),
  }));
}
