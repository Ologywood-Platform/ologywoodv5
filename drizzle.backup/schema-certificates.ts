import { mysqlTable, int, varchar, text, timestamp, mysqlEnum, boolean, json } from "drizzle-orm/mysql-core";
import { unique } from "drizzle-orm/mysql-core";

/**
 * Digital signature certificates - stores cryptographic verification data
 */
export const signatureCertificates = mysqlTable("signature_certificates", {
  id: int("id").autoincrement().primaryKey(),
  contractId: int("contractId").notNull(),
  signatureId: int("signatureId").notNull(),
  signerName: varchar("signerName", { length: 255 }).notNull(),
  signerEmail: varchar("signerEmail", { length: 320 }).notNull(),
  signerRole: mysqlEnum("signerRole", ["artist", "venue"]).notNull(),
  certificateNumber: varchar("certificateNumber", { length: 50 }).notNull().unique(),
  signatureHash: varchar("signatureHash", { length: 64 }).notNull(),
  verificationHash: varchar("verificationHash", { length: 128 }).notNull(),
  signedAt: timestamp("signedAt").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  issuedAt: timestamp("issuedAt").defaultNow().notNull(),
  isValid: boolean("isValid").default(true).notNull(),
  tamperDetected: boolean("tamperDetected").default(false).notNull(),
  verificationCount: int("verificationCount").default(0).notNull(),
  lastVerifiedAt: timestamp("lastVerifiedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  contractSignerIndex: unique().on(table.contractId, table.signerRole),
}));

export type SignatureCertificate = typeof signatureCertificates.$inferSelect;
export type InsertSignatureCertificate = typeof signatureCertificates.$inferInsert;

/**
 * Certificate audit trail - tracks all verification and validation events
 */
export const certificateAuditTrail = mysqlTable("certificate_audit_trail", {
  id: int("id").autoincrement().primaryKey(),
  certificateId: int("certificateId").notNull(),
  contractId: int("contractId").notNull(),
  action: mysqlEnum("action", [
    "created",
    "verified",
    "expired",
    "revoked",
    "tamper_detected",
    "reissued",
    "archived"
  ]).notNull(),
  performedBy: int("performedBy"),
  details: json("details").$type<Record<string, any>>(),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CertificateAuditTrail = typeof certificateAuditTrail.$inferSelect;
export type InsertCertificateAuditTrail = typeof certificateAuditTrail.$inferInsert;

/**
 * Contract signing sessions - tracks active signing sessions
 */
export const contractSigningSessions = mysqlTable("contract_signing_sessions", {
  id: int("id").autoincrement().primaryKey(),
  contractId: int("contractId").notNull(),
  sessionToken: varchar("sessionToken", { length: 255 }).notNull().unique(),
  signerRole: mysqlEnum("signerRole", ["artist", "venue"]).notNull(),
  signerId: int("signerId").notNull(),
  status: mysqlEnum("status", ["active", "completed", "expired", "cancelled"]).default("active").notNull(),
  signatureData: text("signatureData"),
  signedAt: timestamp("signedAt"),
  expiresAt: timestamp("expiresAt").notNull(),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ContractSigningSession = typeof contractSigningSessions.$inferSelect;
export type InsertContractSigningSession = typeof contractSigningSessions.$inferInsert;

/**
 * Contract verification requests - tracks verification API calls
 */
export const contractVerificationRequests = mysqlTable("contract_verification_requests", {
  id: int("id").autoincrement().primaryKey(),
  certificateId: int("certificateId").notNull(),
  contractId: int("contractId").notNull(),
  requestedBy: int("requestedBy"),
  verificationMethod: mysqlEnum("verificationMethod", [
    "api",
    "web_interface",
    "email_link",
    "qr_code",
    "manual"
  ]).notNull(),
  result: mysqlEnum("result", ["valid", "invalid", "expired", "tampered"]).notNull(),
  details: json("details").$type<Record<string, any>>(),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ContractVerificationRequest = typeof contractVerificationRequests.$inferSelect;
export type InsertContractVerificationRequest = typeof contractVerificationRequests.$inferInsert;

/**
 * Contract reminders - tracks scheduled and sent reminders
 */
export const contractReminders = mysqlTable("contract_reminders", {
  id: int("id").autoincrement().primaryKey(),
  contractId: int("contractId").notNull(),
  recipientId: int("recipientId").notNull(),
  reminderType: mysqlEnum("reminderType", [
    "signature_pending",
    "signature_request",
    "event_approaching",
    "contract_expiring"
  ]).notNull(),
  daysBeforeEvent: int("daysBeforeEvent"),
  status: mysqlEnum("status", ["pending", "sent", "failed", "skipped"]).default("pending").notNull(),
  sentAt: timestamp("sentAt"),
  failureReason: text("failureReason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ContractReminder = typeof contractReminders.$inferSelect;
export type InsertContractReminder = typeof contractReminders.$inferInsert;
