import { router, publicProcedure } from '../_core/trpc';
import { z } from 'zod';
import { getDb } from '../db';
import { riderAcknowledgments, riderModificationHistory, bookings, riderTemplates } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

const ProposedModificationSchema = z.object({
  field: z.string(),
  originalValue: z.any(),
  proposedValue: z.any(),
  reason: z.string().optional(),
});

export const riderAcknowledgmentRouter = router({
  // Get rider acknowledgment for a booking
  getByBooking: publicProcedure
    .input(z.object({ bookingId: z.number() }))
    .query(async ({ input }: any) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const result = await db.select().from(riderAcknowledgments).where(eq(riderAcknowledgments.bookingId, input.bookingId)).limit(1);
      const acknowledgment = result.length > 0 ? result[0] : null;
      return acknowledgment;
    }),

  // Create new rider acknowledgment
  create: publicProcedure
    .input(z.object({
      bookingId: z.number(),
      riderTemplateId: z.number(),
      artistId: z.number(),
      venueId: z.number(),
    }))
    .mutation(async ({ input }: any) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const result = await db.insert(riderAcknowledgments).values({
        bookingId: input.bookingId,
        riderTemplateId: input.riderTemplateId,
        artistId: input.artistId,
        venueId: input.venueId,
        status: 'pending',
      });

      return result;
    }),

  // Acknowledge rider (venue confirms they can meet requirements)
  acknowledge: publicProcedure
    .input(z.object({
      bookingId: z.number(),
      userId: z.number(),
    }))
    .mutation(async ({ input }: any) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const result = await db
        .update(riderAcknowledgments)
        .set({
          status: 'acknowledged',
          acknowledgedAt: new Date(),
          acknowledgedByUserId: input.userId,
        })
        .where(eq(riderAcknowledgments.bookingId, input.bookingId));

      return result;
    }),

  // Propose modifications to rider
  proposeModifications: publicProcedure
    .input(z.object({
      bookingId: z.number(),
      modifications: z.array(ProposedModificationSchema),
      userId: z.number(),
    }))
    .mutation(async ({ input }: any) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      // Update acknowledgment status
      await db
        .update(riderAcknowledgments)
        .set({
          status: 'modifications_proposed',
          proposedModifications: input.modifications,
          modificationsProposedAt: new Date(),
        })
        .where(eq(riderAcknowledgments.bookingId, input.bookingId));

      // Create modification history records
      const result = await db.select().from(riderAcknowledgments).where(eq(riderAcknowledgments.bookingId, input.bookingId)).limit(1);
      const acknowledgment = result.length > 0 ? result[0] : null;

      if (acknowledgment) {
        for (let i = 0; i < input.modifications.length; i++) {
          const mod = input.modifications[i];
          await db.insert(riderModificationHistory).values({
            riderAcknowledgmentId: acknowledgment.id,
            modificationNumber: i + 1,
            fieldName: mod.field,
            originalValue: JSON.stringify(mod.originalValue),
            newValue: JSON.stringify(mod.proposedValue),
            reason: mod.reason,
            changedByUserId: input.userId,
            changedByRole: 'venue',
            status: 'proposed',
          });
        }
      }

      return acknowledgment;
    }),

  // Approve proposed modifications (artist accepts changes)
  approveModifications: publicProcedure
    .input(z.object({
      bookingId: z.number(),
      userId: z.number(),
    }))
    .mutation(async ({ input }: any) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const result = await db
        .update(riderAcknowledgments)
        .set({
          status: 'accepted',
          artistResponse: 'approved',
          artistResponseAt: new Date(),
          finalizedAt: new Date(),
          finalizedByUserId: input.userId,
        })
        .where(eq(riderAcknowledgments.bookingId, input.bookingId));

      // Update all modification history records to approved
      const ackResult = await db.select().from(riderAcknowledgments).where(eq(riderAcknowledgments.bookingId, input.bookingId)).limit(1);
      const ack = ackResult.length > 0 ? ackResult[0] : null;

      if (ack) {
        await db
          .update(riderModificationHistory)
          .set({
            status: 'approved',
            statusChangedAt: new Date(),
            statusChangedByUserId: input.userId,
          })
          .where(eq(riderModificationHistory.riderAcknowledgmentId, ack.id));
      }

      return result;
    }),

  // Reject proposed modifications with reason
  rejectModifications: publicProcedure
    .input(z.object({
      bookingId: z.number(),
      reason: z.string(),
      userId: z.number(),
    }))
    .mutation(async ({ input }: any) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const result = await db
        .update(riderAcknowledgments)
        .set({
          status: 'pending',
          artistResponse: 'rejected',
          artistResponseAt: new Date(),
          artistResponseNotes: input.reason,
        })
        .where(eq(riderAcknowledgments.bookingId, input.bookingId));

      // Mark all modifications as rejected
      const ackResult = await db.select().from(riderAcknowledgments).where(eq(riderAcknowledgments.bookingId, input.bookingId)).limit(1);
      const ack = ackResult.length > 0 ? ackResult[0] : null;

      if (ack) {
        await db
          .update(riderModificationHistory)
          .set({
            status: 'rejected',
            statusChangedAt: new Date(),
            statusChangedByUserId: input.userId,
            statusChangeNotes: input.reason,
          })
          .where(eq(riderModificationHistory.riderAcknowledgmentId, ack.id));
      }

      return result;
    }),

  // Finalize rider (both parties agreed)
  finalize: publicProcedure
    .input(z.object({
      bookingId: z.number(),
      userId: z.number(),
    }))
    .mutation(async ({ input }: any) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const result = await db
        .update(riderAcknowledgments)
        .set({
          status: 'accepted',
          finalizedAt: new Date(),
          finalizedByUserId: input.userId,
        })
        .where(eq(riderAcknowledgments.bookingId, input.bookingId));

      return result;
    }),

  // Reject entire rider (cannot meet requirements)
  reject: publicProcedure
    .input(z.object({
      bookingId: z.number(),
      reason: z.string(),
      userId: z.number(),
    }))
    .mutation(async ({ input }: any) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const result = await db
        .update(riderAcknowledgments)
        .set({
          status: 'rejected',
          notes: input.reason,
          finalizedAt: new Date(),
          finalizedByUserId: input.userId,
        })
        .where(eq(riderAcknowledgments.bookingId, input.bookingId));

      return result;
    }),

  // Get modification history for an acknowledgment
  getModificationHistory: publicProcedure
    .input(z.object({ acknowledgmentId: z.number() }))
    .query(async ({ input }: any) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const history = await db.select().from(riderModificationHistory).where(eq(riderModificationHistory.riderAcknowledgmentId, input.acknowledgmentId));
      return history;
    }),
});
