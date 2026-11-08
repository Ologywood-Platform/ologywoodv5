import { eq } from 'drizzle-orm';
import { getDb, getPool } from '../server/db';
import { googleCalendarIntegrations, signatures, venueContractSignatures } from '../drizzle/schema';
import { encryptOAuthToken, isEncryptedOAuthToken } from '../server/services/oauthTokenEncryption';
import { encryptPrivateData, isEncryptedPrivateData } from '../server/services/privateDataEncryption';

const apply = process.argv.includes('--apply');
const confirmed = process.env.ALLOW_PRIVATE_DATA_REENCRYPTION === '1';

if (apply && !confirmed) {
  throw new Error('Refusing to apply without ALLOW_PRIVATE_DATA_REENCRYPTION=1');
}

async function main() {
  const database = await getDb();
  if (!database) throw new Error('Database not available');

  const [googleRows, signatureRows, venueSignatureRows] = await Promise.all([
    database.select({ id: googleCalendarIntegrations.id, accessToken: googleCalendarIntegrations.accessToken, refreshToken: googleCalendarIntegrations.refreshToken }).from(googleCalendarIntegrations),
    database.select({ id: signatures.id, signatureData: signatures.signatureData }).from(signatures),
    database.select({ id: venueContractSignatures.id, signatureData: venueContractSignatures.signatureData }).from(venueContractSignatures),
  ]);

  const legacyGoogle = googleRows.filter((row) => !isEncryptedOAuthToken(row.accessToken) || !isEncryptedOAuthToken(row.refreshToken));
  const legacySignatures = signatureRows.filter((row) => !isEncryptedPrivateData(row.signatureData));
  const legacyVenueSignatures = venueSignatureRows.filter((row) => !isEncryptedPrivateData(row.signatureData));

  const counts = {
    googleCalendarRows: googleRows.length,
    googleCalendarLegacyRows: legacyGoogle.length,
    signatureRows: signatureRows.length,
    signatureLegacyRows: legacySignatures.length,
    venueContractSignatureRows: venueSignatureRows.length,
    venueContractSignatureLegacyRows: legacyVenueSignatures.length,
    mode: apply ? 'apply' : 'dry-run',
  };

  if (apply) {
    // Encrypt in place only after the complete read-only inventory above succeeds.
    for (const row of legacyGoogle) {
      await database.update(googleCalendarIntegrations).set({
        accessToken: encryptOAuthToken(row.accessToken),
        refreshToken: encryptOAuthToken(row.refreshToken),
      }).where(eq(googleCalendarIntegrations.id, row.id));
    }
    for (const row of legacySignatures) {
      await database.update(signatures).set({ signatureData: encryptPrivateData(row.signatureData) }).where(eq(signatures.id, row.id));
    }
    for (const row of legacyVenueSignatures) {
      await database.update(venueContractSignatures).set({ signatureData: encryptPrivateData(row.signatureData) }).where(eq(venueContractSignatures.id, row.id));
    }
  }

  console.log(JSON.stringify(counts));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Sensitive-data remediation failed');
  process.exitCode = 1;
}).finally(async () => {
  const pool = getPool();
  if (pool) await pool.end();
});
