import { sql } from "drizzle-orm";

type NilComplianceSchemaDb = {
  execute: (...args: any[]) => Promise<any>;
};

let nilComplianceSchemaReadyPromise: Promise<void> | null = null;

const CONTRACT_COLUMNS = [
  { name: "templateVersion", definition: "`templateVersion` varchar(32)" },
  { name: "nilTermsVersion", definition: "`nilTermsVersion` varchar(64)" },
  { name: "complianceSnapshot", definition: "`complianceSnapshot` json" },
  { name: "contentHash", definition: "`contentHash` varchar(64)" },
] as const;

const LIVE_CONTRACT_COLUMNS = [
  ...CONTRACT_COLUMNS,
  { name: "statutoryRightsCarveout", definition: "`statutoryRightsCarveout` boolean DEFAULT false NOT NULL" },
] as const;

function rowsFromResult(result: unknown): any[] {
  return Array.isArray(result) && Array.isArray(result[0]) ? result[0] as any[] : [];
}

async function ensureColumns(
  db: NilComplianceSchemaDb,
  tableName: "contracts" | "ology_live_session_contracts",
  definitions: readonly { name: string; definition: string }[],
  options: { skipMissingTable?: boolean } = {},
) {
  let result: unknown;
  try {
    result = await db.execute(`SHOW COLUMNS FROM \`${tableName}\``);
  } catch (error) {
    const record = typeof error === "object" && error !== null ? error as { code?: unknown; message?: unknown; cause?: { code?: unknown; message?: unknown } } : {};
    const code = String(record.code ?? record.cause?.code ?? "");
    const message = String(record.message ?? record.cause?.message ?? "");
    if (options.skipMissingTable && (code === "ER_NO_SUCH_TABLE" || message.includes("doesn't exist"))) return;
    throw error;
  }
  const existing = new Set(rowsFromResult(result).map((row) => String(row.Field ?? row.field)));
  for (const column of definitions) {
    if (existing.has(column.name)) continue;
    await db.execute(`ALTER TABLE \`${tableName}\` ADD COLUMN ${column.definition}`);
    existing.add(column.name);
  }
}

/**
 * Some long-lived runtime databases can record an additive migration without
 * receiving every table or column. Repair only the approved NIL readiness
 * schema idempotently; never update athlete, contract, payment, or audit rows.
 */
export function ensureNilComplianceSchema(db: NilComplianceSchemaDb): Promise<void> {
  if (nilComplianceSchemaReadyPromise) return nilComplianceSchemaReadyPromise;

  nilComplianceSchemaReadyPromise = (async () => {
    await db.execute(sql.raw(`
      CREATE TABLE IF NOT EXISTS \`nil_athlete_compliance_profiles\` (
        \`id\` int AUTO_INCREMENT NOT NULL,
        \`artistProfileId\` int NOT NULL,
        \`athleteUserId\` int NOT NULL,
        \`athleticStatus\` enum('prospective_student_athlete','college_student_athlete','professional_athlete','former_athlete','other') NOT NULL,
        \`institutionName\` varchar(255),
        \`institutionState\` varchar(100),
        \`associationName\` varchar(100),
        \`divisionLevel\` varchar(50),
        \`eligibilityEndsAt\` timestamp,
        \`complianceContactName\` varchar(255),
        \`complianceContactEmail\` varchar(320),
        \`complianceContactPhone\` varchar(50),
        \`isMinor\` boolean NOT NULL DEFAULT false,
        \`guardianName\` varchar(255),
        \`guardianEmail\` varchar(320),
        \`representativeInvolved\` boolean NOT NULL DEFAULT false,
        \`athleteAttestedAt\` timestamp,
        \`termsVersion\` varchar(64) NOT NULL,
        \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uniq_nil_athlete_compliance_profile\` (\`artistProfileId\`),
        UNIQUE KEY \`uniq_nil_athlete_compliance_user\` (\`athleteUserId\`),
        KEY \`idx_nil_athlete_compliance_status\` (\`athleticStatus\`)
      )
    `));

    await db.execute(sql.raw(`
      CREATE TABLE IF NOT EXISTS \`nil_compliance_deals\` (
        \`id\` int AUTO_INCREMENT NOT NULL,
        \`athleteProfileId\` int NOT NULL,
        \`athleteUserId\` int NOT NULL,
        \`sourceType\` enum('manual','booking','ology_live') NOT NULL DEFAULT 'manual',
        \`bookingId\` int,
        \`ologyLiveBookingId\` int,
        \`sourceName\` varchar(255) NOT NULL,
        \`sourceKey\` varchar(191) NOT NULL,
        \`title\` varchar(255) NOT NULL,
        \`dealType\` enum('brand_endorsement','appearance','autograph_signing','speaking','camp_clinic','ology_live','other') NOT NULL,
        \`isNilActivity\` boolean NOT NULL DEFAULT true,
        \`isEndorsementContract\` boolean NOT NULL DEFAULT false,
        \`proposedProtectionEnabled\` boolean NOT NULL DEFAULT true,
        \`divisionOneReportingApplies\` boolean NOT NULL DEFAULT false,
        \`agreementDate\` timestamp NOT NULL,
        \`termStartsAt\` timestamp,
        \`termEndsAt\` timestamp,
        \`eligibilityEndsAtSnapshot\` timestamp,
        \`servicesDescription\` text NOT NULL,
        \`counterpartyName\` varchar(255) NOT NULL,
        \`counterpartyEmail\` varchar(320),
        \`grossCompensation\` decimal(12,2) NOT NULL,
        \`compensationReceivedAmount\` decimal(12,2),
        \`compensationReceivedAt\` timestamp,
        \`currency\` varchar(3) NOT NULL DEFAULT 'USD',
        \`writtenAgreementConfirmed\` boolean NOT NULL DEFAULT false,
        \`nonperformanceTerminationTerms\` text,
        \`notConditionedOnEnrollmentOrResidency\` boolean NOT NULL DEFAULT false,
        \`representativeInvolved\` boolean NOT NULL DEFAULT false,
        \`representativeName\` varchar(255),
        \`representativeEmail\` varchar(320),
        \`representativeRegistrationState\` varchar(100),
        \`representativeRegistrationNumber\` varchar(120),
        \`agencyContractConfirmed\` boolean NOT NULL DEFAULT false,
        \`agentFeePercent\` decimal(5,2),
        \`agentFeeAmount\` decimal(12,2),
        \`platformServiceFeeAmount\` decimal(12,2),
        \`paymentProcessingFeeAmount\` decimal(12,2),
        \`agreementDisclosureStatus\` enum('not_recorded','submitted') NOT NULL DEFAULT 'not_recorded',
        \`agreementSubmittedAt\` timestamp,
        \`agreementSubmissionRecipient\` varchar(255),
        \`agreementSubmittedBy\` enum('athlete','authorized_representative'),
        \`compensationDisclosureStatus\` enum('not_recorded','submitted') NOT NULL DEFAULT 'not_recorded',
        \`compensationSubmittedAt\` timestamp,
        \`compensationSubmissionRecipient\` varchar(255),
        \`compensationSubmittedBy\` enum('athlete','authorized_representative'),
        \`contractTemplateVersion\` varchar(32) NOT NULL,
        \`nilTermsVersion\` varchar(64) NOT NULL,
        \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        KEY \`idx_nil_deals_athlete_created\` (\`athleteUserId\`, \`createdAt\`),
        KEY \`idx_nil_deals_source_window\` (\`athleteProfileId\`, \`sourceKey\`, \`agreementDate\`),
        KEY \`idx_nil_deals_booking\` (\`bookingId\`),
        KEY \`idx_nil_deals_live_booking\` (\`ologyLiveBookingId\`)
      )
    `));

    await db.execute(sql.raw(`
      CREATE TABLE IF NOT EXISTS \`nil_compliance_events\` (
        \`id\` int AUTO_INCREMENT NOT NULL,
        \`dealId\` int,
        \`athleteProfileId\` int NOT NULL,
        \`athleteUserId\` int NOT NULL,
        \`actorUserId\` int NOT NULL,
        \`eventType\` enum('profile_created','profile_updated','deal_created','deal_updated','agreement_submission_recorded','compensation_submission_recorded','evidence_uploaded') NOT NULL,
        \`eventData\` json,
        \`evidenceKey\` varchar(512),
        \`evidenceUrl\` text,
        \`evidenceFileName\` varchar(255),
        \`evidenceMimeType\` varchar(100),
        \`evidenceSizeBytes\` int,
        \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        KEY \`idx_nil_events_athlete_created\` (\`athleteUserId\`, \`createdAt\`),
        KEY \`idx_nil_events_deal_created\` (\`dealId\`, \`createdAt\`),
        KEY \`idx_nil_events_type\` (\`eventType\`)
      )
    `));

    await ensureColumns(db, "contracts", CONTRACT_COLUMNS);
    await ensureColumns(db, "ology_live_session_contracts", LIVE_CONTRACT_COLUMNS, { skipMissingTable: true });
  })().catch((error) => {
    nilComplianceSchemaReadyPromise = null;
    throw error;
  });

  return nilComplianceSchemaReadyPromise;
}

export function resetNilComplianceSchemaForTests() {
  nilComplianceSchemaReadyPromise = null;
}
