import { eq, and, gte, lte, inArray, like, or, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, 
  artistProfiles, InsertArtistProfile, ArtistProfile,
  venueProfiles, InsertVenueProfile, VenueProfile,
  riderTemplates, InsertRiderTemplate, RiderTemplate,
  availability, InsertAvailability, Availability,
  bookings, InsertBooking, Booking,
  messages, InsertMessage, Message,
  subscriptions, InsertSubscription, Subscription
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============= USER FUNCTIONS =============

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============= ARTIST PROFILE FUNCTIONS =============

export async function createArtistProfile(profile: InsertArtistProfile) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(artistProfiles).values(profile);
  return result;
}

export async function getArtistProfileByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(artistProfiles).where(eq(artistProfiles.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getArtistProfileById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(artistProfiles).where(eq(artistProfiles.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateArtistProfile(id: number, updates: Partial<ArtistProfile>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(artistProfiles).set(updates).where(eq(artistProfiles.id, id));
}

export async function searchArtists(filters: {
  genre?: string[];
  location?: string;
  minFee?: number;
  maxFee?: number;
}) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(artistProfiles);
  
  // Note: Genre filtering with JSON arrays requires custom SQL or post-processing
  // For MVP, we'll return all and filter in application code if needed
  
  const results = await query;
  
  // Apply filters in application code for MVP
  let filtered = results;
  
  if (filters.location) {
    filtered = filtered.filter(a => 
      a.location?.toLowerCase().includes(filters.location!.toLowerCase())
    );
  }
  
  if (filters.minFee !== undefined) {
    filtered = filtered.filter(a => 
      a.feeRangeMin !== null && a.feeRangeMin >= filters.minFee!
    );
  }
  
  if (filters.maxFee !== undefined) {
    filtered = filtered.filter(a => 
      a.feeRangeMax !== null && a.feeRangeMax <= filters.maxFee!
    );
  }
  
  return filtered;
}

export async function getAllArtists() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(artistProfiles);
}

// ============= VENUE PROFILE FUNCTIONS =============

export async function createVenueProfile(profile: InsertVenueProfile) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(venueProfiles).values(profile);
  return result;
}

export async function getVenueProfileByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(venueProfiles).where(eq(venueProfiles.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateVenueProfile(id: number, updates: Partial<VenueProfile>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(venueProfiles).set(updates).where(eq(venueProfiles.id, id));
}

// ============= RIDER TEMPLATE FUNCTIONS =============

export async function createRiderTemplate(template: InsertRiderTemplate) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(riderTemplates).values(template);
  return result;
}

export async function getRiderTemplatesByArtistId(artistId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(riderTemplates).where(eq(riderTemplates.artistId, artistId));
}

export async function getRiderTemplateById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(riderTemplates).where(eq(riderTemplates.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateRiderTemplate(id: number, updates: Partial<RiderTemplate>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(riderTemplates).set(updates).where(eq(riderTemplates.id, id));
}

export async function deleteRiderTemplate(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(riderTemplates).where(eq(riderTemplates.id, id));
}

// ============= AVAILABILITY FUNCTIONS =============

export async function setAvailability(avail: InsertAvailability) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(availability).values(avail).onDuplicateKeyUpdate({
    set: { status: avail.status, notes: avail.notes }
  });
}

export async function getAvailabilityByArtistId(artistId: number, startDate?: string, endDate?: string) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(availability).where(eq(availability.artistId, artistId));
  
  // If date range provided, filter (would need to add date comparison logic)
  const results = await query;
  
  if (startDate && endDate) {
    return results.filter(a => {
      const dateStr = a.date instanceof Date ? a.date.toISOString().split('T')[0] : a.date;
      return dateStr >= startDate && dateStr <= endDate;
    });
  }
  
  return results;
}

export async function getAvailabilityForDate(artistId: number, date: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(availability)
    .where(and(
      eq(availability.artistId, artistId),
      sql`${availability.date} = ${date}`
    ))
    .limit(1);
    
  return result.length > 0 ? result[0] : undefined;
}

export async function deleteAvailability(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(availability).where(eq(availability.id, id));
}

// ============= BOOKING FUNCTIONS =============

export async function createBooking(booking: InsertBooking) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(bookings).values(booking);
  return result;
}

export async function getBookingById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getBookingsByArtistId(artistId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(bookings)
    .where(eq(bookings.artistId, artistId))
    .orderBy(desc(bookings.createdAt));
}

export async function getBookingsByVenueId(venueId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(bookings)
    .where(eq(bookings.venueId, venueId))
    .orderBy(desc(bookings.createdAt));
}

export async function updateBooking(id: number, updates: Partial<Booking>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(bookings).set(updates).where(eq(bookings.id, id));
}

// ============= MESSAGE FUNCTIONS =============

export async function createMessage(message: InsertMessage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(messages).values(message);
  return result;
}

export async function getMessagesByBookingId(bookingId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(messages)
    .where(eq(messages.bookingId, bookingId))
    .orderBy(messages.sentAt);
}

export async function markMessageAsRead(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(messages).set({ readAt: new Date() }).where(eq(messages.id, id));
}

// ============= SUBSCRIPTION FUNCTIONS =============

export async function createSubscription(subscription: InsertSubscription) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(subscriptions).values(subscription);
  return result;
}

export async function getSubscriptionByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateSubscription(userId: number, updates: Partial<Subscription>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(subscriptions).set(updates).where(eq(subscriptions.userId, userId));
}
