import { sql } from 'drizzle-orm';

type OlogyLiveSchemaDb = {
  execute: (...args: any[]) => Promise<any>;
};

let bookingsSchemaReadyPromise: Promise<void> | null = null;

/**
 * Some legacy runtime databases recorded the Ology Live migration while
 * missing the bookings table. My Ology reads this table to build the fan's
 * Return experience, so repair only that already-defined table idempotently.
 */
export function ensureOlogyLiveBookingsSchema(db: OlogyLiveSchemaDb): Promise<void> {
  if (bookingsSchemaReadyPromise) return bookingsSchemaReadyPromise;

  bookingsSchemaReadyPromise = db.execute(sql.raw(`
    CREATE TABLE IF NOT EXISTS \`ology_live_bookings\` (
      \`id\` int AUTO_INCREMENT NOT NULL,
      \`experienceId\` int NOT NULL,
      \`fanId\` int NOT NULL,
      \`talentId\` int NOT NULL,
      \`scheduledAt\` timestamp NOT NULL,
      \`duration\` int NOT NULL,
      \`status\` enum('pending','confirmed','completed','cancelled','no_show') NOT NULL DEFAULT 'pending',
      \`amount\` decimal(10,2) NOT NULL,
      \`platformFee\` decimal(10,2),
      \`stripePaymentIntentId\` varchar(255),
      \`paymentStatus\` enum('unpaid','paid','refunded') NOT NULL DEFAULT 'unpaid',
      \`paidAt\` timestamp,
      \`refundedAt\` timestamp,
      \`joinLink\` varchar(512),
      \`platform\` varchar(50),
      \`cancelledAt\` timestamp,
      \`cancelledBy\` varchar(20),
      \`cancellationReason\` text,
      \`fanRating\` int,
      \`fanReview\` text,
      \`reviewedAt\` timestamp,
      \`notes\` text,
      \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      KEY \`idx_ology_live_bookings_experience\` (\`experienceId\`),
      KEY \`idx_ology_live_bookings_fan\` (\`fanId\`),
      KEY \`idx_ology_live_bookings_talent\` (\`talentId\`),
      KEY \`idx_ology_live_bookings_status\` (\`status\`),
      KEY \`idx_ology_live_bookings_scheduled\` (\`scheduledAt\`)
    )
  `)).then(() => undefined).catch((error) => {
    bookingsSchemaReadyPromise = null;
    throw error;
  });

  return bookingsSchemaReadyPromise;
}

export function resetOlogyLiveBookingsSchemaForTests() {
  bookingsSchemaReadyPromise = null;
}
