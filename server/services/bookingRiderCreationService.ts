import { drizzle } from 'drizzle-orm/mysql2';
import { eq } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import type { RowDataPacket } from 'mysql2/promise';
import * as schema from '../../drizzle/schema';
import { bookings, type InsertBooking, type Booking } from '../../drizzle/schema';
import { getDb, getPool } from '../db';
import { ensureRiderDocumentSchema } from './riderDocumentSchemaService';
import { captureDefaultRiderDocumentForBooking, persistDefaultRiderDocumentForBooking } from './bookingRiderDocumentService';

/** The booking and its optional PDF version are committed together, never a failed post-create side effect. */
export async function createBookingWithRiderDocument(data: InsertBooking): Promise<Booking> {
  await getDb();
  const pool = getPool();
  if (!pool) throw new Error('Database not available');
  await ensureRiderDocumentSchema(pool);
  const connection = await pool.getConnection();
  try {
    const [artistRows] = await connection.execute<RowDataPacket[]>('SELECT userId FROM artist_profiles WHERE id = ? LIMIT 1', [data.artistId]);
    const ownerUserId = Number(artistRows[0]?.userId);
    if (!Number.isSafeInteger(ownerUserId) || ownerUserId <= 0) throw new TRPCError({ code: 'NOT_FOUND', message: 'Artist profile not found' });
    let otherUserId: number | undefined;
    if (data.bookingSource === 'client_booking' || data.bookingSource === 'client') otherUserId = data.venueId;
    else {
      const [venues] = await connection.execute<RowDataPacket[]>('SELECT userId FROM venue_profiles WHERE id = ? LIMIT 1', [data.venueId]);
      if (venues[0]) otherUserId = Number(venues[0].userId);
    }
    await connection.query('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');
    await connection.beginTransaction();
    const userIds = [...new Set([ownerUserId, otherUserId].filter((id): id is number => Number.isSafeInteger(id) && Number(id) > 0))].sort((a, b) => a - b);
    await connection.execute(`SELECT id FROM users WHERE id IN (${userIds.map(() => '?').join(',')}) ORDER BY id FOR UPDATE`, userIds);
    const [currentArtists] = await connection.execute<RowDataPacket[]>('SELECT userId FROM artist_profiles WHERE id = ? FOR UPDATE', [data.artistId]);
    if (Number(currentArtists[0]?.userId) !== ownerUserId) throw new TRPCError({ code: 'CONFLICT', message: 'Booking ownership changed. Refresh and retry' });
    if (data.bookingSource !== 'client_booking' && data.bookingSource !== 'client' && otherUserId !== undefined) {
      const [currentVenues] = await connection.execute<RowDataPacket[]>('SELECT userId FROM venue_profiles WHERE id = ? FOR UPDATE', [data.venueId]);
      if (Number(currentVenues[0]?.userId) !== otherUserId) throw new TRPCError({ code: 'CONFLICT', message: 'Booking ownership changed. Refresh and retry' });
    }
    const snapshot = await captureDefaultRiderDocumentForBooking(connection, data.artistId);
    const database = drizzle(connection, { schema, mode: 'default' });
    const result = await database.insert(bookings).values(data);
    const bookingId = result[0].insertId;
    if (snapshot) await persistDefaultRiderDocumentForBooking(connection, bookingId, snapshot, ownerUserId);
    const [booking] = await database.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1);
    if (!booking) throw new Error('Booking could not be loaded');
    await connection.commit();
    return booking;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally { connection.release(); }
}
