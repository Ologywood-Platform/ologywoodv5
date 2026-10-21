import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb, getPool } from "../db";
import { ensureRiderDocumentSchema } from "../services/riderDocumentSchemaService";
import {
  attachRiderDocumentToBooking,
  getBookingRiderDocumentContext,
  listBookingRiderDocuments,
  type RiderDocumentConnection,
} from "../services/bookingRiderDocumentService";

/**
 * Booking-scoped supplemental PDF rider links. This namespace never reads or
 * writes structured booking riders, signing state, terms, or payments.
 */
async function openRiderDocumentConnection(): Promise<RiderDocumentConnection & { release(): void }> {
  // Schema installation is intentionally outside an attachment transaction: DDL
  // can implicitly commit in MySQL. An outage/incompatibility fails the request closed.
  await getDb();
  const pool = getPool();
  if (!pool) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Rider documents are temporarily unavailable" });
  await ensureRiderDocumentSchema(pool as any);
  return await pool.getConnection() as unknown as RiderDocumentConnection & { release(): void };
}

export const bookingRiderDocumentsRouter = router({
  context: protectedProcedure
    .input(z.object({ bookingId: z.number().int().safe().positive() }).strict())
    .query(async ({ ctx, input }) => {
      const connection = await openRiderDocumentConnection();
      try {
        await connection.execute('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');
        await connection.beginTransaction();
        const result = await getBookingRiderDocumentContext(connection, ctx.user.id, input.bookingId);
        await connection.commit();
        return result;
      } catch (error) { await connection.rollback(); throw error; } finally {
        connection.release();
      }
    }),

  list: protectedProcedure
    .input(z.object({ bookingId: z.number().int().safe().positive() }).strict())
    .query(async ({ ctx, input }) => {
      const connection = await openRiderDocumentConnection();
      try {
        await connection.execute('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');
        await connection.beginTransaction();
        const result = await listBookingRiderDocuments(connection, ctx.user.id, input.bookingId);
        await connection.commit();
        return result;
      } catch (error) { await connection.rollback(); throw error; } finally {
        connection.release();
      }
    }),

  attach: protectedProcedure
    .input(z.object({
      bookingId: z.number().int().safe().positive(),
      documentId: z.number().int().safe().positive(),
      expectedRevision: z.number().int().safe().positive(),
    }).strict())
    .mutation(async ({ ctx, input }) => {
      const connection = await openRiderDocumentConnection();
      try {
        return await attachRiderDocumentToBooking(connection, ctx.user.id, input);
      } finally {
        connection.release();
      }
    }),
});
