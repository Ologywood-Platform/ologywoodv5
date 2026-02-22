import { eq, and, gte, lte, inArray, like, or, desc, asc, sql, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "../drizzle/schema";
import { 
  User, InsertUser, users, 
  artistProfiles, InsertArtistProfile, ArtistProfile,
  venueProfiles, InsertVenueProfile, VenueProfile,
  riderTemplates, InsertRiderTemplate, RiderTemplate,
  availability, InsertAvailability, Availability,
  bookings, InsertBooking, Booking,
  messages, InsertMessage, Message,
  reviews, InsertReview, Review,
  venueReviews, InsertVenueReview, VenueReview,
  favorites, InsertFavorite, Favorite,
  bookingTemplates, InsertBookingTemplate, BookingTemplate,
  profileViews, InsertProfileView, ProfileView,
  bookingReminders, InsertBookingReminder, BookingReminder,
  contracts, InsertContract, Contract,
  signatures, InsertSignature, Signature,
  emailPreferences, InsertEmailPreference, EmailPreference,
  userSubscriptions, InsertUserSubscription, UserSubscription,
  stripeConnectAccounts, InsertStripeConnectAccount, StripeConnectAccount,
  artistPayouts, InsertArtistPayout, ArtistPayout,
  invoices, InsertInvoice, Invoice,
  events, InsertEvent, Event,
  eventRecurrence, InsertEventRecurrence, EventRecurrence,
  eventHistory, InsertEventHistory, EventHistory,
  eventPhotos, InsertEventPhoto, EventPhoto,
  savedEvents, InsertSavedEvent, SavedEvent
} from "../drizzle/schema";
import { ENV } from './_core/env';

// Re-export User type for use in other modules
export type { User, InsertUser };

let _db: ReturnType<typeof drizzle> | null = null;

// ============= CALENDAR EVENT FUNCTIONS (DEPRECATED) =============
// Calendar functions removed - calendarRouter is deprecated and commented out in routers.ts

// ============= CONTRACT FUNCTIONS =============

export async function createContract(data: InsertContract): Promise<Contract> {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  const result = await db.insert(contracts).values(data);
  const contractId = (result as any).insertId;
  const contract = await db.select().from(contracts).where(eq(contracts.id, contractId)).limit(1);
  return contract[0] as Contract;
}

export async function getContractById(id: number): Promise<Contract | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(contracts).where(eq(contracts.id, id)).limit(1);
  return result[0];
}

export async function getContractByBookingId(bookingId: number): Promise<Contract | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(contracts).where(eq(contracts.bookingId, bookingId)).limit(1);
  return result[0];
}

export async function getContractsByArtistId(artistId: number): Promise<Contract[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(contracts).where(eq(contracts.artistId, artistId));
}

export async function getContractsByVenueId(venueId: number): Promise<Contract[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(contracts).where(eq(contracts.venueId, venueId));
}

export async function updateContract(id: number, data: Partial<InsertContract>): Promise<Contract | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  await db.update(contracts).set(data).where(eq(contracts.id, id));
  return await getContractById(id);
}

// ============= SIGNATURE FUNCTIONS =============

export async function createSignature(data: InsertSignature): Promise<Signature> {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  const result = await db.insert(signatures).values(data);
  const signatureId = (result as any).insertId;
  const signature = await db.select().from(signatures).where(eq(signatures.id, signatureId)).limit(1);
  return signature[0] as Signature;
}

export async function getSignaturesByContractId(contractId: number): Promise<Signature[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(signatures).where(eq(signatures.contractId, contractId));
}

export async function getSignatureByContractAndSigner(contractId: number, userId: number): Promise<Signature | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(signatures).where(
    and(eq(signatures.contractId, contractId), eq(signatures.userId, userId))
  ).limit(1);
  return result[0];
}

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      // Parse DATABASE_URL to extract connection parameters
      const url = new URL(process.env.DATABASE_URL);
      const pool = mysql.createPool({
        host: url.hostname,
        port: parseInt(url.port || '3306'),
        user: url.username,
        password: url.password,
        database: url.pathname.slice(1),
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        enableKeepAlive: true,
        ssl: true // Enable SSL for TiDB
      });
      _db = drizzle(pool, { schema, mode: 'default' });
      console.log("[Database] Connected successfully to TiDB");
    } catch (error) {
      console.error("[Database] Failed to connect:", error);
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
    // NOTE: If role is not provided and user is not owner, we don't update the role field
    // This preserves the existing role when updating an existing user via OAuth

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    try {
      await db.insert(users).values(values).onDuplicateKeyUpdate({
        set: updateSet,
      });
    } catch (insertError: any) {
      // If it's a duplicate key error, try updating instead
      if (insertError?.code === 'ER_DUP_ENTRY') {
        console.log("[Database] User already exists, updating instead");
        await db.update(users).set(updateSet).where(eq(users.openId, user.openId));
      } else {
        throw insertError;
      }
    }
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

export async function updateUserRole(userId: number, role: 'artist' | 'venue') {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.update(users).set({ role }).where(eq(users.id, userId));
}

export async function updateUser(userId: number, updates: { name?: string; email?: string }) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.update(users).set(updates).where(eq(users.id, userId));
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
  if (!db) return null;
  
  const result = await db.select().from(artistProfiles).where(eq(artistProfiles.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getArtistProfileById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(artistProfiles).where(eq(artistProfiles.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
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
  availableFrom?: string;
  availableTo?: string;
}) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(artistProfiles);
  
  // Note: Genre filtering with JSON arrays requires custom SQL or post-processing
  // For MVP, we'll return all and filter in application code if needed
  
  const results = await query;
  
  // Apply filters in application code for MVP
  let filtered = results;
  
  // Filter by genre
  if (filters.genre && filters.genre.length > 0) {
    filtered = filtered.filter(a => {
      const artistGenres = Array.isArray(a.genre) ? a.genre : [];
      return filters.genre!.some(selectedGenre => 
        artistGenres.some(g => g?.toLowerCase() === selectedGenre.toLowerCase())
      );
    });
  }
  
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
  
  // Filter by availability dates if provided
  if (filters.availableFrom || filters.availableTo) {
    // Get availability for all artists
    const artistIds = filtered.map(a => a.id);
    const availabilities = await db.select().from(availability).where(
      sql`${availability.artistId} IN (${sql.join(artistIds.map(id => sql`${id}`), sql`, `)})`
    );
    
    // Filter artists who have availability in the requested date range
    filtered = filtered.filter(artist => {
      const artistAvailability = availabilities.filter(av => av.artistId === artist.id);
      if (artistAvailability.length === 0) return false;
      
      return artistAvailability.some(av => {
        const avDate = new Date(av.date);
        const fromDate = filters.availableFrom ? new Date(filters.availableFrom) : null;
        const toDate = filters.availableTo ? new Date(filters.availableTo) : null;
        
        if (fromDate && avDate < fromDate) return false;
        if (toDate && avDate > toDate) return false;
        return true;
      });
    });
  }
  
  return filtered;
}

export async function getAllArtists() {
  const db = await getDb();
  if (!db) {
    console.log("[getAllArtists] Database not available");
    return [];
  }
  
  try {
    console.log("[getAllArtists] Fetching all artists...");
    const artists = await db.select().from(artistProfiles);
    console.log(`[getAllArtists] Successfully fetched ${artists.length} artists`);
    
    // Ensure all JSON fields are properly parsed and serializable
    return artists.map(artist => ({
      ...artist,
      genre: Array.isArray(artist.genre) ? artist.genre : [],
      mediaGallery: artist.mediaGallery || { photos: [], videos: [] },
      socialLinks: artist.socialLinks || {},
      // Ensure all fields are serializable
      profilePhotoUrl: artist.profilePhotoUrl || null,
      websiteUrl: artist.websiteUrl || null,
      bio: artist.bio || null,
      location: artist.location || null,
    }));
  } catch (error) {
    console.error("[getAllArtists] Error fetching artists:", error);
    return [];
  }
}

// ============= VENUE PROFILE FUNCTIONS =============

export async function createVenueProfile(profile: InsertVenueProfile) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  try {
    // Check if profile already exists
    const existing = await db.select().from(venueProfiles).where(eq(venueProfiles.userId, profile.userId)).limit(1);
    
    if (existing && existing.length > 0) {
      // Update existing profile
      const result = await db.update(venueProfiles)
        .set({
          organizationName: profile.organizationName,
          contactName: profile.contactName || null,
          contactPhone: profile.contactPhone || null,
          location: (profile as any).location || null,
          bio: (profile as any).bio || null,
          updatedAt: new Date(),
        })
        .where(eq(venueProfiles.userId, profile.userId));
      return result;
    }
    
    // Create new profile
    const result = await db.insert(venueProfiles).values({
      userId: profile.userId,
      organizationName: profile.organizationName,
      contactName: profile.contactName || null,
      contactPhone: profile.contactPhone || null,
      location: (profile as any).location || null,
      bio: (profile as any).bio || null,
    });
    return result;
  } catch (error) {
    console.error("Error creating/updating venue profile:", error);
    throw error;
  }
}

// Old function - no longer used

export async function getVenueProfileByUserId(userId: number) {
  try {
    const db = await getDb();
    if (!db) return null;
    const result = await db.select().from(venueProfiles).where(eq(venueProfiles.userId, userId)).limit(1);
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error('Error getting venue profile by user ID:', error);
    return null;
  }
}

export async function getVenueProfileById(id: number) {
  try {
    const db = await getDb();
    if (!db) return null;
    const result = await db.select().from(venueProfiles).where(eq(venueProfiles.id, id)).limit(1);
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error('Error getting venue profile by ID:', error);
    return null;
  }
}

export async function getVenueProfileByToken(token: string) {
  try {
    const db = await getDb();
    if (!db) return null;
    const result = await db.select().from(venueProfiles).where(eq((venueProfiles as any).emailVerificationToken, token)).limit(1);
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error('Error getting venue profile by token:', error);
    return null;
  }
}

export async function updateVenueProfile(id: number, updates: Partial<VenueProfile>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(venueProfiles).set(updates).where(eq(venueProfiles.id, id));
}

export async function searchVenues(options: { searchQuery?: string; location?: string; limit?: number; offset?: number } = {}) {
  try {
    const db = await getDb();
    if (!db) return [];
    const { searchQuery, location, limit = 20, offset = 0 } = options;
    const conditions = [];
    conditions.push(eq(venueProfiles.isListed, true));
    if (searchQuery) {
      conditions.push(like(venueProfiles.organizationName, `%${searchQuery}%`));
    }
    if (location) {
      conditions.push(like(venueProfiles.location, `%${location}%`));
    }
    const venues = await db.select().from(venueProfiles).where(and(...conditions)).limit(limit).offset(offset);
    return venues;
  } catch (error) {
    console.error('Error searching venues:', error);
    return [];
  }
}

// ============= RIDER TEMPLATE FUNCTIONS =============

export async function createRiderTemplate(template: InsertRiderTemplate) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(riderTemplates).values(template);
  // Get the last inserted template
  const result = await db.select().from(riderTemplates)
    .where(eq(riderTemplates.artistId, template.artistId as any))
    .orderBy(desc(riderTemplates.createdAt))
    .limit(1);
  return result[0];
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
  // Return the updated template
  const result = await db.select().from(riderTemplates).where(eq(riderTemplates.id, id)).limit(1);
  return result[0];
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
  
  // Note: availability table doesn't have notes field
  await db.insert(availability).values(avail).onDuplicateKeyUpdate({
    set: { status: avail.status }
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
      const dateStr = (a.date as unknown) instanceof Date ? ((a.date as unknown) as Date).toISOString().split('T')[0] : a.date;
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
      eq(availability.date, date)
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

export async function createBooking(booking: InsertBooking): Promise<Booking> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(bookings).values(booking);
  // Get the inserted booking
  const newBooking = await db.select().from(bookings)
    .where(eq(bookings.id, sql`LAST_INSERT_ID()`))
    .limit(1);
  return newBooking[0] as Booking;
}

export async function getBookingById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getBookingsByArtistId(artistId: number): Promise<Booking[]> {
  try {
    const db = await getDb();
    if (!db) return [];
    
    // Use simple select to avoid type inference issues
    const results = await db.select().from(bookings)
      .where(eq(bookings.artistId as any, artistId))
      .orderBy(desc(bookings.createdAt));
    return results as any[];
  } catch (error) {
    console.error('Error fetching bookings for artist:', error);
    return [] as Booking[];
  }
}

export async function getBookingsByVenueId(venueId: number) {
  try {
    const db = await getDb();
    if (!db) return [];
    
    return await db.select().from(bookings)
      .where(eq(bookings.venueId, venueId))
      .orderBy(desc(bookings.createdAt));
  } catch (error) {
    console.error('Error fetching bookings for venue:', error);
    return [];
  }
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
    .orderBy(messages.createdAt);
}

export async function markMessageAsRead(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(messages).set({ isRead: true }).where(eq(messages.id, id));
}

// ============= SUBSCRIPTION FUNCTIONS =============

export async function createSubscription(subscription: InsertUserSubscription) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(userSubscriptions).values(subscription);
  return result;
}

export async function getSubscriptionByUserId(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select({
    id: userSubscriptions.id,
    userId: userSubscriptions.userId,
    tier: userSubscriptions.tier,
    stripeCustomerId: userSubscriptions.stripeCustomerId,
    stripeSubscriptionId: userSubscriptions.stripeSubscriptionId,
    status: userSubscriptions.status,
    createdAt: userSubscriptions.createdAt,
    updatedAt: userSubscriptions.updatedAt,
  }).from(userSubscriptions).where(eq(userSubscriptions.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateSubscription(userId: number, updates: Partial<UserSubscription>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(userSubscriptions).set(updates).where(eq(userSubscriptions.userId, userId));
}

export async function upsertSubscription(data: {
  userId: number;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  tier?: string;
  status: 'active' | 'inactive' | 'trialing' | 'canceled' | 'past_due';
  currentPeriodEnd?: Date;
}) {
  const db = await getDb();
  if (!db) return;

  const validStatus: 'active' | 'cancelled' | 'past_due' | 'trialing' = (data.status === 'active' || data.status === 'canceled' || data.status === 'past_due' || data.status === 'trialing') ? (data.status === 'canceled' ? 'cancelled' : data.status) : 'active';
  const tier = (data.tier as 'free' | 'starter' | 'professional') || 'free';
  const insertData = { userId: data.userId, tier, status: validStatus, stripeCustomerId: data.stripeCustomerId, stripeSubscriptionId: data.stripeSubscriptionId };
  await db.insert(userSubscriptions).values(insertData).onDuplicateKeyUpdate({
    set: {
      stripeCustomerId: data.stripeCustomerId,
      stripeSubscriptionId: data.stripeSubscriptionId,
      status: validStatus,
      updatedAt: new Date(),
    },
  });
}

export async function updateSubscriptionStatus(
  userId: number,
  status: 'active' | 'cancelled' | 'past_due' | 'trialing'
) {
  const db = await getDb();
  if (!db) return;

  await db.update(userSubscriptions)
    .set({ status, updatedAt: new Date() })
    .where(eq(userSubscriptions.userId, userId));
}

// ============= REVIEW FUNCTIONS =============

export async function createReview(review: InsertReview) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(reviews).values(review);
  return result;
}

export async function getReviewsByArtistId(artistId: number) {
  const db = await getDb();
  if (!db) return [];
  
  // Select only core columns to avoid schema mismatch
  return await db.select({
    id: reviews.id,
    bookingId: reviews.bookingId,
    artistId: reviews.artistId,
    venueId: reviews.venueId,
    rating: reviews.rating,
    createdAt: reviews.createdAt,
    updatedAt: reviews.updatedAt,
  }).from(reviews)
    .where(eq(reviews.artistId, artistId))
    .orderBy(desc(reviews.createdAt));
}

export async function getReviewByBookingId(bookingId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  // Select only core columns to avoid schema mismatch
  const result = await db.select({
    id: reviews.id,
    bookingId: reviews.bookingId,
    artistId: reviews.artistId,
    venueId: reviews.venueId,
    rating: reviews.rating,
    createdAt: reviews.createdAt,
    updatedAt: reviews.updatedAt,
  }).from(reviews).where(eq(reviews.bookingId, bookingId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getReviewById(reviewId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  // Select only core columns to avoid schema mismatch
  const result = await db.select({
    id: reviews.id,
    bookingId: reviews.bookingId,
    artistId: reviews.artistId,
    venueId: reviews.venueId,
    rating: reviews.rating,
    createdAt: reviews.createdAt,
    updatedAt: reviews.updatedAt,
  }).from(reviews).where(eq(reviews.id, reviewId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateReview(reviewId: number, updates: { comment?: string, rating?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(reviews).set({ ...updates, updatedAt: new Date() }).where(eq(reviews.id, reviewId));
}

export async function getAverageRatingForArtist(artistId: number): Promise<{ average: number; count: number }> {
  const db = await getDb();
  if (!db) return { average: 0, count: 0 };
  
  const artistReviews = await getReviewsByArtistId(artistId);
  if (!artistReviews || artistReviews.length === 0) {
    return { average: 0, count: 0 };
  }
  
  const sum = artistReviews.reduce((acc, review) => acc + (review.rating ?? 0), 0);
  return {
    average: sum / artistReviews.length,
    count: artistReviews.length,
  };
}

export async function getUnreadMessageCountByBooking(bookingId: number, userId: number) {
  const db = await getDb();
  if (!db) return 0;
  
  // Note: recipientId and isRead columns may not exist in current schema
  // Returning 0 for now
  return 0;
}

export async function getTotalUnreadMessageCount(userId: number) {
  const db = await getDb();
  if (!db) return 0;
  
  // Note: recipientId and isRead columns may not exist in current schema
  // Returning 0 for now
  return 0;
}

export async function markMessagesAsRead(bookingId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Note: recipientId and isRead columns may not exist in current schema
  // Skipping update for now
}

// ============= VENUE REVIEW FUNCTIONS =============

export async function createVenueReview(review: InsertVenueReview) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(venueReviews).values(review);
  return result;
}

export async function getVenueReviewsByVenueId(venueId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(venueReviews)
    .where(eq(venueReviews.venueId, venueId))
    .orderBy(desc(venueReviews.createdAt));
}

export async function getVenueReviewByBookingId(bookingId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(venueReviews).where(eq(venueReviews.bookingId, bookingId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getVenueReviewById(reviewId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(venueReviews).where(eq(venueReviews.id, reviewId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateVenueReview(reviewId: number, updates: { comment?: string, rating?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(venueReviews).set({ ...updates, updatedAt: new Date() }).where(eq(venueReviews.id, reviewId));
}

export async function getAverageRatingForVenue(venueId: number): Promise<{ average: number; count: number }> {
  const db = await getDb();
  if (!db) return { average: 0, count: 0 };
  
  const reviews = await getVenueReviewsByVenueId(venueId);
  if (!reviews || reviews.length === 0) {
    return { average: 0, count: 0 };
  }
  
  const sum = reviews.reduce((acc, review) => acc + (review.rating ?? 0), 0);
  return {
    average: sum / reviews.length,
    count: reviews.length,
  };
}


// ============= FAVORITES FUNCTIONS =============

export async function addFavorite(venueId: number, artistId: number) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    // Check if already favorited
    const existing = await db.select({ id: favorites.id, venueId: favorites.venueId, artistId: favorites.artistId }).from(favorites)
      .where(and(eq(favorites.venueId, venueId), eq(favorites.artistId, artistId)));
    
    if (existing.length > 0) {
      return existing[0];
    }
    
    await db.insert(favorites).values({ venueId, artistId });
    return { venueId, artistId };
  } catch (error) {
    console.error('Error adding favorite:', error);
    throw error;
  }
}

export async function removeFavorite(venueId: number, artistId: number) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    await db.delete(favorites)
      .where(and(eq(favorites.venueId, venueId), eq(favorites.artistId, artistId)));
  } catch (error) {
    console.error('Error removing favorite:', error);
    throw error;
  }
}

export async function getFavoritesByVenue(venueId: number) {
  const db = await getDb();
  if (!db) return [];
  
  // Get favorites with artist profile details
  const venueFavorites = await db.select().from(favorites)
    .where(eq(favorites.venueId, venueId));
  
  if (venueFavorites.length === 0) return [];
  
  const artistIds = venueFavorites.map(f => f.artistId);
  const artists = await db.select().from(artistProfiles)
    .where(sql`${artistProfiles.id} IN (${sql.join(artistIds.map(id => sql`${id}`), sql`, `)})`);
  
  return artists;
}

export async function isFavorited(venueId: number, artistId: number) {
  try {
    const db = await getDb();
    if (!db) return false;
    
    const result = await db.select({ id: favorites.id, venueId: favorites.venueId, artistId: favorites.artistId }).from(favorites)
      .where(and(eq(favorites.venueId, venueId), eq(favorites.artistId, artistId)));
    
    return result.length > 0;
  } catch (error) {
    console.error('Error checking if favorited:', error);
    return false;
  }
}

export async function getFavoriteCount(artistId: number) {
  const db = await getDb();
  if (!db) return 0;
  
  const result = await db.select().from(favorites)
    .where(eq(favorites.artistId, artistId));
  
  return result.length;
}


export async function getVenuesWhoFavoritedArtist(artistId: number) {
  try {
    const db = await getDb();
    if (!db) return [];
  
  // Get all venues that favorited this artist
  const venueFavorites = await db.select().from(favorites)
    .where(eq(favorites.artistId, artistId));
  
  if (venueFavorites.length === 0) return [];
  
  const venueIds = venueFavorites.map(f => f.venueId);
  
  // Handle empty array case - SQL IN clause fails with empty arrays
  if (venueIds.length === 0) return [];
  
  // Get venue profiles for those venues
  const venueProfilesList = await db.select().from(venueProfiles)
    .where(sql`${venueProfiles.id} IN (${sql.join(venueIds.map(id => sql`${id}`), sql`, `)})`);
  
  // Get user emails for those venues
  const venueUsers = await db.select().from(users)
    .where(sql`${users.id} IN (${sql.join(venueProfilesList.map(p => sql`${p.userId}`), sql`, `)})`);
  
  // Combine user and venue profile data
  return venueUsers.map(user => {
    const profile = venueProfilesList.find((p: VenueProfile) => p.userId === user.id);
    return {
      userId: user.id,
      email: user.email,
      name: user.name,
      organizationName: profile?.organizationName,
    };
  }).filter(v => v.email); // Only return venues with email addresses
  } catch (error) {
    console.error('Error getting venues who favorited artist:', error);
    return []; // Return empty array on error instead of crashing
  }
}


// ============= BOOKING TEMPLATE FUNCTIONS =============

export async function createBookingTemplate(template: InsertBookingTemplate) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(bookingTemplates).values(template);
  return template;
}

export async function getBookingTemplatesByUserId(userId: number): Promise<BookingTemplate[]> {
  try {
    const db = await getDb();
    if (!db) return [];
    
    const templates = await db.select().from(bookingTemplates)
      .where(eq(bookingTemplates.venueId, userId))
      .orderBy(desc(bookingTemplates.updatedAt));
    
    return templates as BookingTemplate[];
  } catch (error) {
    console.error('Error getting booking templates by user ID:', error);
    return [];
  }
}

export async function getBookingTemplateById(id: number): Promise<BookingTemplate | null> {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(bookingTemplates)
    .where(eq(bookingTemplates.id, id));
  
  return (result[0] as BookingTemplate) || null;
}

export async function updateBookingTemplate(id: number, updates: Partial<InsertBookingTemplate>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(bookingTemplates)
    .set(updates)
    .where(eq(bookingTemplates.id, id));
}

export async function deleteBookingTemplate(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(bookingTemplates)
    .where(eq(bookingTemplates.id, id));
}


// ============= ANALYTICS FUNCTIONS =============

export async function trackProfileView(artistId: number, viewerUserId?: number, ipAddress?: string) {
  const db = await getDb();
  if (!db) return;
  
  await db.insert(profileViews).values({
    artistId,
  });
}

export async function getProfileViewCount(artistId: number, days?: number) {
  const db = await getDb();
  if (!db) return 0;
  
  let conditions = [eq(profileViews.artistId, artistId)];
  
  // Note: viewedAt tracking not implemented in current schema
  
  const result = await db.select({ count: sql<number>`count(*)` })
    .from(profileViews)
    .where(and(...conditions));
  
  return Number(result[0]?.count) || 0;
}

export async function getBookingStats(artistId: number) {
  const db = await getDb();
  if (!db) return {
    total: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    totalRevenue: 0,
  };
  
  const allBookings = await db.select().from(bookings)
    .where(eq(bookings.artistId, artistId));
  
  const stats = {
    total: allBookings.length,
    pending: allBookings.filter(b => b.status === 'pending').length,
    confirmed: allBookings.filter(b => b.status === 'confirmed').length,
    completed: allBookings.filter(b => b.status === 'completed').length,
    cancelled: allBookings.filter(b => b.status === 'cancelled').length,
    totalRevenue: allBookings
      .filter(b => b.status === 'completed' && b.totalFee)
      .reduce((sum, b) => sum + (typeof b.totalFee === 'number' ? b.totalFee : 0), 0),
  };
  
  return stats;
}

export async function getRevenueByMonth(artistId: number, months: number = 12) {
  const db = await getDb();
  if (!db) return [];
  
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);
  
  const completedBookings = await db.select().from(bookings)
    .where(
      and(
        eq(bookings.artistId, artistId),
        eq(bookings.status, 'completed'),
        gte(bookings.eventDate, startDate)
      )
    )
    .orderBy(bookings.eventDate);
  
  // Group by month
  const revenueByMonth: { [key: string]: number } = {};
  completedBookings.forEach(booking => {
    if (booking.eventDate && booking.totalFee) {
      const monthKey = booking.eventDate.toISOString().substring(0, 7); // YYYY-MM
      const fee = typeof booking.totalFee === 'number' ? booking.totalFee : 0;
      revenueByMonth[monthKey] = (revenueByMonth[monthKey] || 0) + fee;
    }
  });
  
  return Object.entries(revenueByMonth).map(([month, revenue]) => ({
    month,
    revenue,
  }));
}


// ============= BOOKING REMINDER FUNCTIONS =============

export async function getBookingsNeedingReminders() {
  const db = await getDb();
  if (!db) return [];
  
  const now = new Date();
  const sevenDaysFromNow = new Date(now);
  sevenDaysFromNow.setDate(now.getDate() + 7);
  const threeDaysFromNow = new Date(now);
  threeDaysFromNow.setDate(now.getDate() + 3);
  const oneDayFromNow = new Date(now);
  oneDayFromNow.setDate(now.getDate() + 1);
  
  // Get all confirmed bookings with upcoming event dates
  const upcomingBookings = await db.select().from(bookings)
    .where(
      and(
        eq(bookings.status, 'confirmed'),
        gte(bookings.eventDate, now)
      )
    );
  
  // Get all sent reminders
  const sentReminders = await db.select().from(bookingReminders);
  
  const bookingsNeedingReminders: Array<{
    booking: any;
    reminderType: 'upcoming' | 'deposit_due' | 'final_payment_due';
  }> = [];
  
  for (const booking of upcomingBookings) {
    if (!booking.eventDate) continue;
    
    const eventDate = new Date(booking.eventDate);
    const daysUntil = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    // Check if we need to send 7-day reminder
    if (daysUntil <= 7 && daysUntil > 6) {
      const alreadySent = sentReminders.some(
        r => r.bookingId === booking.id && (r.reminderType as any) === ('7_days' as any)
      );
      if (!alreadySent) {
        bookingsNeedingReminders.push({ booking: booking as any, reminderType: 'upcoming' });
      }
    }
    
    // Check if we need to send 3-day reminder
    if (daysUntil <= 3 && daysUntil > 2) {
      const alreadySent = sentReminders.some(
        r => r.bookingId === booking.id && (r.reminderType as any) === ('7_days' as any)
      );
      if (!alreadySent) {
        bookingsNeedingReminders.push({ booking: booking as any, reminderType: 'upcoming' });
      }
    }
    
    // Check if we need to send 1-day reminder
    if (daysUntil <= 1 && daysUntil > 0) {
      const alreadySent = sentReminders.some(
        r => r.bookingId === booking.id && (r.reminderType as any) === ('7_days' as any)
      );
      if (!alreadySent) {
        bookingsNeedingReminders.push({ booking: booking as any, reminderType: 'upcoming' });
      }
    }
  }
  
  return bookingsNeedingReminders;
}

export async function markReminderSent(bookingId: number, reminderType: string) {
  const db = await getDb();
  if (!db) return;
  
  await db.insert(bookingReminders).values({
    bookingId,
    reminderType,
  } as any);
}


// ============= CALENDAR FUNCTIONS =============

export async function getVenueBookingsByDateRange(venueId: number, startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(bookings)
    .where(
      and(
        eq(bookings.venueId, venueId),
        gte(bookings.eventDate, startDate),
        lte(bookings.eventDate, endDate)
      )
    )
    .orderBy(bookings.eventDate);
}

export async function getFavoritedArtistsAvailability(userId: number, startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];
  
  // Get user's favorited artists
  const userFavorites = await db.select().from(favorites)
    .where(eq((favorites as any).userId, userId));
  
  if (userFavorites.length === 0) return [];
  
  const artistIds = userFavorites.map(f => f.artistId);
  
  // Get availability for those artists in the date range
  const availabilityRecords = await db.select().from(availability)
    .where(
      and(
        artistIds.length > 0 ? inArray(availability.artistId, artistIds.filter(id => id !== null) as number[]) : undefined,
        gte(availability.date, startDate as any),
        lte(availability.date, endDate as any),
        eq(availability.status, 'available')
      )
    );
  
  // Enrich with artist details
  const enrichedAvailability = [];
  for (const avail of availabilityRecords) {
    const artist = await getArtistProfileById(avail.artistId);
    if (artist) {
      enrichedAvailability.push({
        ...avail,
        artistName: artist.artistName,
      });
    }
  }
  
  return enrichedAvailability;
}

// ============= PAYMENT FUNCTIONS =============

export async function updateBookingPaymentStatus(bookingId: number, paymentStatus: string, stripePaymentIntentId?: string, depositPaidAt?: Date, fullPaymentPaidAt?: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const updates: any = { paymentStatus };
  if (stripePaymentIntentId) updates.stripePaymentIntentId = stripePaymentIntentId;
  if (depositPaidAt) updates.depositPaidAt = depositPaidAt;
  if (fullPaymentPaidAt) updates.fullPaymentPaidAt = fullPaymentPaidAt;
  
  await db.update(bookings)
    .set(updates)
    .where(eq(bookings.id, bookingId));
}

export async function recordRefund(bookingId: number, stripeRefundId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(bookings)
    .set({ paymentStatus: "refunded", stripeRefundId })
    .where(eq(bookings.id, bookingId));
}

export async function getPaymentHistory(bookingId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const booking = await db.select({
    id: bookings.id,
    paymentStatus: bookings.paymentStatus,
    totalFee: bookings.totalFee,
    depositAmount: bookings.depositAmount,
    depositPaidAt: bookings.depositPaidAt,
    // fullPaymentPaidAt: bookings.fullPaymentPaidAt,
    stripePaymentIntentId: bookings.stripePaymentIntentId,
    stripeRefundId: bookings.stripeRefundId,
  })
  .from(bookings)
  .where(eq(bookings.id, bookingId))
  .limit(1);
  
  return booking[0] || null;
}


// ============= EMAIL PREFERENCES FUNCTIONS =============

export async function getEmailPreferences(userId: number): Promise<EmailPreference | null> {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select()
    .from(emailPreferences)
    .where(eq(emailPreferences.userId, userId))
    .limit(1);
  
  return result[0] || null;
}

export async function createEmailPreferences(userId: number): Promise<EmailPreference> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const data: InsertEmailPreference = {
    userId,
    frequency: 'weekly',
    bookingUpdates: true,
    newOpportunities: true,
    platformNews: false,
    weeklyDigest: true,
    reminders: true,
  };
  
  try {
    const result = await db.insert(emailPreferences).values(data);
    const prefId = (result as any).insertId;
    
    if (!prefId) {
      // If insertId is not available, fetch by userId
      const prefs = await db.select()
        .from(emailPreferences)
        .where(eq(emailPreferences.userId, userId))
        .limit(1);
      
      if (prefs.length === 0) {
        throw new Error("Failed to create email preferences");
      }
      return prefs[0] as EmailPreference;
    }
    
    const prefs = await db.select()
      .from(emailPreferences)
      .where(eq(emailPreferences.id, prefId))
      .limit(1);
    
    if (prefs.length === 0) {
      throw new Error("Failed to retrieve created email preferences");
    }
    
    return prefs[0] as EmailPreference;
  } catch (error) {
    console.error('Error creating email preferences:', error);
    throw error;
  }
}

export async function updateEmailPreferences(userId: number, updates: Partial<InsertEmailPreference>): Promise<EmailPreference | null> {
  const db = await getDb();
  if (!db) return null;
  
  // First check if preferences exist
  let prefs = await getEmailPreferences(userId);
  
  // If not, create them
  if (!prefs) {
    prefs = await createEmailPreferences(userId);
  }
  
  // Update the preferences
  await db.update(emailPreferences)
    .set(updates)
    .where(eq(emailPreferences.userId, userId));
  
  // Return updated preferences
  return getEmailPreferences(userId);
}

export async function deleteEmailPreferences(userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  try {
    const result = await db.delete(emailPreferences)
      .where(eq(emailPreferences.userId, userId));
    
    return (result as any).affectedRows > 0;
  } catch (error) {
    console.error('Error deleting email preferences:', error);
    return false;
  }
}



// ============= EVENT FUNCTIONS =============

/**
 * Create a new event for an artist
 */
export async function createEvent(data: InsertEvent): Promise<Event> {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  const result = await db.insert(events).values(data);
  const eventId = (result as any).insertId;
  const event = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
  return event[0] as Event;
}

/**
 * Get event by ID
 */
export async function getEventById(id: number): Promise<Event | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(events).where(eq(events.id, id)).limit(1);
  return result[0] as Event | undefined;
}

/**
 * Get all events for an artist
 */
export async function getArtistEvents(artistId: number): Promise<Event[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(events)
    .where(eq(events.artistId, artistId))
    .orderBy(desc(events.eventDate));
}

/**
 * Get public events for an artist (for discovery)
 */
export async function getArtistPublicEvents(artistId: number): Promise<Event[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(events)
    .where(and(
      eq(events.artistId, artistId),
      eq(events.isPublic, true),
      eq(events.status, 'available')
    ))
    .orderBy(asc(events.eventDate));
}

/**
 * Get upcoming events for an artist (for calendar view)
 */
export async function getArtistUpcomingEvents(artistId: number, daysAhead: number = 90): Promise<Event[]> {
  const db = await getDb();
  if (!db) return [];

  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);

  return await db.select().from(events)
    .where(and(
      eq(events.artistId, artistId),
      gte(events.eventDate, new Date()),
      lte(events.eventDate, futureDate)
    ))
    .orderBy(asc(events.eventDate));
}

/**
 * Search for public events with filters
 */
export async function searchPublicEvents(filters: {
  eventType?: string;
  location?: string;
  minRate?: number;
  maxRate?: number;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}): Promise<Event[]> {
  const db = await getDb();
  if (!db) return [];

  // Build where conditions dynamically
  const conditions: any[] = [
    eq(events.isPublic, true),
    eq(events.status, 'available')
  ];

  if (filters.eventType) {
    conditions.push(eq(events.eventType, filters.eventType as any));
  }

  if (filters.location) {
    conditions.push(like(events.location, `%${filters.location}%`));
  }

  if (filters.minRate) {
    conditions.push(gte(events.rate, filters.minRate.toString()));
  }

  if (filters.maxRate) {
    conditions.push(lte(events.rate, filters.maxRate.toString()));
  }

  if (filters.startDate) {
    conditions.push(gte(events.eventDate, filters.startDate));
  }

  if (filters.endDate) {
    conditions.push(lte(events.eventDate, filters.endDate));
  }

  let query: any = db.select().from(events).where(and(...conditions)).orderBy(asc(events.eventDate));

  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  if (filters.offset) {
    query = query.offset(filters.offset);
  }

  return await query;
}

/**
 * Update an event
 */
export async function updateEvent(id: number, data: Partial<InsertEvent>): Promise<Event | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  await db.update(events).set(data).where(eq(events.id, id));
  return await getEventById(id);
}

/**
 * Delete an event
 */
export async function deleteEvent(id: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const result = await db.delete(events).where(eq(events.id, id));
  return (result as any).affectedRows > 0;
}

/**
 * Create event recurrence
 */
export async function createEventRecurrence(data: InsertEventRecurrence): Promise<EventRecurrence> {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  const result = await db.insert(eventRecurrence).values(data);
  const recurrenceId = (result as any).insertId;
  const recurrence = await db.select().from(eventRecurrence).where(eq(eventRecurrence.id, recurrenceId)).limit(1);
  return recurrence[0] as EventRecurrence;
}

/**
 * Get recurrence for an event
 */
export async function getEventRecurrence(eventId: number): Promise<EventRecurrence | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(eventRecurrence).where(eq(eventRecurrence.eventId, eventId)).limit(1);
  return result[0] as EventRecurrence | undefined;
}

/**
 * Delete event recurrence
 */
export async function deleteEventRecurrence(eventId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const result = await db.delete(eventRecurrence).where(eq(eventRecurrence.eventId, eventId));
  return (result as any).affectedRows > 0;
}

/**
 * Create event history (post-event recap)
 */
export async function createEventHistory(data: InsertEventHistory): Promise<EventHistory> {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  const result = await db.insert(eventHistory).values(data);
  const historyId = (result as any).insertId;
  const history = await db.select().from(eventHistory).where(eq(eventHistory.id, historyId)).limit(1);
  return history[0] as EventHistory;
}

/**
 * Get event history by ID
 */
export async function getEventHistoryById(id: number): Promise<EventHistory | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(eventHistory).where(eq(eventHistory.id, id)).limit(1);
  return result[0] as EventHistory | undefined;
}

/**
 * Get event history for an artist (portfolio)
 */
export async function getArtistEventHistory(artistId: number): Promise<EventHistory[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(eventHistory)
    .where(eq(eventHistory.artistId, artistId))
    .orderBy(desc(eventHistory.eventDate));
}

/**
 * Add photo to event history
 */
export async function addEventPhoto(data: InsertEventPhoto): Promise<EventPhoto> {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  const result = await db.insert(eventPhotos).values(data);
  const photoId = (result as any).insertId;
  const photo = await db.select().from(eventPhotos).where(eq(eventPhotos.id, photoId)).limit(1);
  return photo[0] as EventPhoto;
}

/**
 * Get photos for event history
 */
export async function getEventPhotos(eventHistoryId: number): Promise<EventPhoto[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(eventPhotos)
    .where(eq(eventPhotos.eventHistoryId, eventHistoryId))
    .orderBy(asc(eventPhotos.createdAt));
}

/**
 * Delete event photo
 */
export async function deleteEventPhoto(id: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const result = await db.delete(eventPhotos).where(eq(eventPhotos.id, id));
  return (result as any).affectedRows > 0;
}

/**
 * Save event for later (venue saves artist's event)
 */
export async function saveEvent(userId: number, eventId: number): Promise<SavedEvent> {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  const result = await db.insert(savedEvents).values({ userId, eventId });
  const savedId = (result as any).insertId;
  const saved = await db.select().from(savedEvents).where(eq(savedEvents.id, savedId)).limit(1);
  return saved[0] as SavedEvent;
}

/**
 * Get saved events for a user
 */
export async function getUserSavedEvents(userId: number): Promise<Event[]> {
  const db = await getDb();
  if (!db) return [];

  const saved = await db.select().from(savedEvents)
    .where(eq(savedEvents.userId, userId));

  if (saved.length === 0) return [];

  const eventIds = saved.map(s => s.eventId);
  return await db.select().from(events)
    .where(inArray(events.id, eventIds))
    .orderBy(asc(events.eventDate));
}

/**
 * Check if user has saved an event
 */
export async function isEventSaved(userId: number, eventId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const result = await db.select().from(savedEvents)
    .where(and(
      eq(savedEvents.userId, userId),
      eq(savedEvents.eventId, eventId)
    ))
    .limit(1);

  return result.length > 0;
}

/**
 * Remove saved event
 */
export async function removeSavedEvent(userId: number, eventId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const result = await db.delete(savedEvents)
    .where(and(
      eq(savedEvents.userId, userId),
      eq(savedEvents.eventId, eventId)
    ));

  return (result as any).affectedRows > 0;
}
