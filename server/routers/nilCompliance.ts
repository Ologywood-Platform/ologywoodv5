import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  NIL_ATHLETIC_STATUS_VALUES,
  NIL_DEAL_TYPE_VALUES,
  NIL_EVIDENCE_MIME_TYPES,
  NIL_SOURCE_TYPE_VALUES,
  NIL_SUBMITTED_BY_VALUES,
} from "../../shared/nilCompliance";
import { protectedProcedure, router } from "../_core/trpc";
import {
  createOwnedDeal,
  getOwnedEvidenceUrl,
  getOwnedComplianceProfile,
  getOwnedDashboard,
  listOwnedEvents,
  recordOwnedSubmission,
  updateOwnedDeal,
  uploadOwnedEvidence,
  upsertOwnedComplianceProfile,
} from "../services/nilComplianceService";

function asTrpcError(error: unknown): never {
  const message = error instanceof Error ? error.message : "NIL compliance request failed.";
  const forbidden = message.includes("Athlete profile is required") || message.includes("owned Athlete profile is required");
  const notFound = message.includes("not found");
  throw new TRPCError({ code: forbidden ? "FORBIDDEN" : notFound ? "NOT_FOUND" : "BAD_REQUEST", message });
}

const optionalText = (max: number) => z.string().trim().max(max).nullable().optional();

const complianceProfileInput = z.object({
  athleticStatus: z.enum(NIL_ATHLETIC_STATUS_VALUES),
  institutionName: optionalText(255),
  institutionState: optionalText(100),
  associationName: optionalText(100),
  divisionLevel: optionalText(50),
  eligibilityEndsAt: z.date().nullable().optional(),
  complianceContactName: optionalText(255),
  complianceContactEmail: z.string().trim().email().max(320).nullable().optional(),
  complianceContactPhone: optionalText(50),
  isMinor: z.boolean(),
  guardianName: optionalText(255),
  guardianEmail: z.string().trim().email().max(320).nullable().optional(),
  representativeInvolved: z.boolean(),
  attested: z.literal(true),
});

const money = z.number().finite().min(0).max(100_000_000);
const dealInput = z.object({
  sourceType: z.enum(NIL_SOURCE_TYPE_VALUES).default("manual"),
  bookingId: z.number().int().positive().nullable().optional(),
  ologyLiveBookingId: z.number().int().positive().nullable().optional(),
  sourceName: z.string().trim().min(1).max(255),
  title: z.string().trim().min(1).max(255),
  dealType: z.enum(NIL_DEAL_TYPE_VALUES),
  isNilActivity: z.boolean().default(true),
  isEndorsementContract: z.boolean().default(false),
  proposedProtectionEnabled: z.boolean().default(true),
  divisionOneReportingApplies: z.boolean().default(false),
  agreementDate: z.date(),
  termStartsAt: z.date().nullable().optional(),
  termEndsAt: z.date().nullable().optional(),
  servicesDescription: z.string().trim().min(1).max(5_000),
  counterpartyName: z.string().trim().min(1).max(255),
  counterpartyEmail: z.string().trim().email().max(320).nullable().optional(),
  grossCompensation: money,
  compensationReceivedAmount: money.nullable().optional(),
  compensationReceivedAt: z.date().nullable().optional(),
  writtenAgreementConfirmed: z.boolean().default(false),
  nonperformanceTerminationTerms: optionalText(5_000),
  notConditionedOnEnrollmentOrResidency: z.boolean().default(false),
  representativeInvolved: z.boolean().default(false),
  representativeName: optionalText(255),
  representativeEmail: z.string().trim().email().max(320).nullable().optional(),
  representativeRegistrationState: optionalText(100),
  representativeRegistrationNumber: optionalText(120),
  agencyContractConfirmed: z.boolean().default(false),
  agentFeePercent: z.number().finite().min(0).max(100).nullable().optional(),
  platformServiceFeeAmount: money.nullable().optional(),
  paymentProcessingFeeAmount: money.nullable().optional(),
});

export const nilComplianceRouter = router({
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    try { return await getOwnedComplianceProfile(ctx.user.id); } catch (error) { asTrpcError(error); }
  }),
  saveProfile: protectedProcedure.input(complianceProfileInput).mutation(async ({ ctx, input }) => {
    try {
      const { attested: _attested, ...profile } = input;
      return await upsertOwnedComplianceProfile(ctx.user.id, profile);
    } catch (error) { asTrpcError(error); }
  }),
  getDashboard: protectedProcedure.query(async ({ ctx }) => {
    try { return await getOwnedDashboard(ctx.user.id); } catch (error) { asTrpcError(error); }
  }),
  createDeal: protectedProcedure.input(dealInput).mutation(async ({ ctx, input }) => {
    try { return await createOwnedDeal(ctx.user.id, input); } catch (error) { asTrpcError(error); }
  }),
  updateDeal: protectedProcedure.input(z.object({ id: z.number().int().positive(), deal: dealInput })).mutation(async ({ ctx, input }) => {
    try { return await updateOwnedDeal(ctx.user.id, input.id, input.deal); } catch (error) { asTrpcError(error); }
  }),
  recordSubmission: protectedProcedure.input(z.object({
    dealId: z.number().int().positive(),
    kind: z.enum(["agreement", "compensation"]),
    recipient: z.string().trim().min(1).max(255),
    submittedBy: z.enum(NIL_SUBMITTED_BY_VALUES),
    attested: z.literal(true),
  })).mutation(async ({ ctx, input }) => {
    try { return await recordOwnedSubmission(ctx.user.id, input); } catch (error) { asTrpcError(error); }
  }),
  uploadEvidence: protectedProcedure.input(z.object({
    dealId: z.number().int().positive(),
    fileName: z.string().trim().min(1).max(255),
    mimeType: z.enum(NIL_EVIDENCE_MIME_TYPES),
    fileData: z.string().min(1),
  })).mutation(async ({ ctx, input }) => {
    try { return await uploadOwnedEvidence(ctx.user.id, input); } catch (error) { asTrpcError(error); }
  }),
  getEvidenceUrl: protectedProcedure.input(z.object({ eventId: z.number().int().positive() })).query(async ({ ctx, input }) => {
    try { return await getOwnedEvidenceUrl(ctx.user.id, input.eventId); } catch (error) { asTrpcError(error); }
  }),
  listEvents: protectedProcedure.input(z.object({ dealId: z.number().int().positive().optional() }).optional()).query(async ({ ctx, input }) => {
    try { return await listOwnedEvents(ctx.user.id, input?.dealId); } catch (error) { asTrpcError(error); }
  }),
});
