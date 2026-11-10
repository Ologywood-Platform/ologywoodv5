export interface EduBillingSchemaExecutor {
  execute(query: string, values?: unknown[]): Promise<any>;
}
/** Call only after the EDU evidence/schema bootstrap, never during module import.
 * No business records, secrets, Stripe state, or scheduler registrations change. */
export async function ensureEduBillingSchema(
  executor: EduBillingSchemaExecutor
): Promise<void> {
  await executor.execute(`CREATE TABLE IF NOT EXISTS \`edu_billing_notices\` (
    \`noticeKey\` varchar(191) NOT NULL PRIMARY KEY,
    \`userId\` int NOT NULL,
    \`verificationId\` int NOT NULL,
    \`revision\` int NOT NULL,
    \`kind\` varchar(32) NOT NULL,
    \`deadline\` timestamp NOT NULL,
    \`state\` varchar(16) NOT NULL,
    \`sentAt\` timestamp NULL,
    \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY \`idx_edu_billing_notice_verification\` (\`verificationId\`, \`revision\`)
  )`);
  await executor.execute(`CREATE TABLE IF NOT EXISTS \`edu_billing_notice_resolutions\` (
    \`id\` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
    \`noticeKey\` varchar(191) NOT NULL,
    \`actorUserId\` int NOT NULL,
    \`decision\` varchar(32) NOT NULL,
    \`providerEvidence\` varchar(500) NOT NULL,
    \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY \`idx_edu_billing_resolution_notice\` (\`noticeKey\`)
  )`);
}
