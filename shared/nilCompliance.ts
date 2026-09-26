export const NIL_TERMS_VERSION = "2026-09-26-fan-club-fee-v2";
export const NIL_CONTRACT_TEMPLATE_VERSION = "2026.1";

export const NIL_AGENT_FEE_MAX_PERCENT = 5;
export const NIL_REPORTING_THRESHOLD_CENTS = 60_000;
export const NIL_AGREEMENT_REPORTING_DAYS = 5;
export const NIL_COMPENSATION_REPORTING_DAYS = 30;
export const NIL_EVIDENCE_MAX_BYTES = 10 * 1024 * 1024;

export const NIL_ATHLETIC_STATUS_VALUES = [
  "prospective_student_athlete",
  "college_student_athlete",
  "professional_athlete",
  "former_athlete",
  "other",
] as const;

export type NilAthleticStatus = (typeof NIL_ATHLETIC_STATUS_VALUES)[number];

export const NIL_DEAL_TYPE_VALUES = [
  "brand_endorsement",
  "appearance",
  "autograph_signing",
  "speaking",
  "camp_clinic",
  "ology_live",
  "other",
] as const;

export type NilDealType = (typeof NIL_DEAL_TYPE_VALUES)[number];

export const NIL_SOURCE_TYPE_VALUES = ["manual", "booking", "ology_live"] as const;
export const NIL_SUBMISSION_STATUS_VALUES = ["not_recorded", "submitted"] as const;
export const NIL_SUBMITTED_BY_VALUES = ["athlete", "authorized_representative"] as const;

export const NIL_EVIDENCE_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

export const NIL_ATHLETIC_STATUS_LABELS: Record<NilAthleticStatus, string> = {
  prospective_student_athlete: "Prospective student athlete",
  college_student_athlete: "Current college student athlete",
  professional_athlete: "Professional athlete",
  former_athlete: "Former athlete",
  other: "Other sports creator",
};

export function normalizeNilSourceKey(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 191);
}
